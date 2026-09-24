import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  WebsiteRecord,
  VisitorRecord,
  SessionRecord,
  PageviewRecord,
  EventRecord,
  DailyStatRecord,
  MilestoneRecord,
  IngestionPayload
} from './types';
import { hashKey, generateSiteId, generateTrackingKey, generateDashboardKey, sanitizeDomain } from './security';

interface DatabaseState {
  websites: WebsiteRecord[];
  visitors: VisitorRecord[];
  sessions: SessionRecord[];
  pageviews: PageviewRecord[];
  events: EventRecord[];
  daily_stats: DailyStatRecord[];
  milestones: MilestoneRecord[];
}

const MILESTONES_THRESHOLDS = [100, 1000, 5000, 10000, 25000, 50000, 100000, 1000000];

class AnalyticsDatabase {
  private supabase: SupabaseClient | null = null;
  private dbPath: string;
  private state: DatabaseState = {
    websites: [],
    visitors: [],
    sessions: [],
    pageviews: [],
    events: [],
    daily_stats: [],
    milestones: []
  };
  private isLoaded = false;

  // In-memory deduplication caches to protect against network retries & React StrictMode
  private processedEventIds = new Map<string, number>();
  private recentPageviews = new Map<string, number>();

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'insightly_db.json');
    this.init();

    // Clean up deduplication cache every 10 minutes
    const cleanupTimer = setInterval(() => {
      const now = Date.now();
      const cutoff = now - 10 * 60 * 1000;
      for (const [id, time] of this.processedEventIds.entries()) {
        if (time < cutoff) this.processedEventIds.delete(id);
      }
      for (const [key, time] of this.recentPageviews.entries()) {
        if (time < cutoff) this.recentPageviews.delete(key);
      }
    }, 10 * 60 * 1000);
    if (cleanupTimer.unref) cleanupTimer.unref();
  }

  private init() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('[INSIGHTLY DB] Supabase client initialized');
      } catch (err) {
        console.error('[INSIGHTLY DB] Failed to init Supabase client:', err);
      }
    }

    this.loadLocal();
  }

  private loadLocal() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        this.state = JSON.parse(raw);
      } else {
        this.state = {
          websites: [],
          visitors: [],
          sessions: [],
          pageviews: [],
          events: [],
          daily_stats: [],
          milestones: []
        };
        this.persistLocal();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('[INSIGHTLY DB] Error loading database file:', err);
    }
  }

  private persistLocal() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (err) {
      console.error('[INSIGHTLY DB] Error persisting database file:', err);
    }
  }

  // Create Website
  public async createWebsite(name: string, rawDomain: string) {
    const site_id = generateSiteId();
    const tracking_key = generateTrackingKey();
    const dashboard_key = generateDashboardKey();
    const domain = sanitizeDomain(rawDomain) || 'example.com';

    const record: WebsiteRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim() || 'My Website',
      domain,
      site_id,
      tracking_key_hash: hashKey(tracking_key),
      dashboard_key_hash: hashKey(dashboard_key),
      created_at: new Date().toISOString()
    };

    if (this.supabase) {
      try {
        await this.supabase.from('websites').insert([record]);
      } catch (err) {
        // Fallback local persistence is primary
      }
    }

    this.state.websites.push(record);
    this.persistLocal();

    return {
      website: record,
      site_id,
      tracking_key,
      dashboard_key
    };
  }

  public async validateDashboardKey(siteId: string, rawDashboardKey: string): Promise<WebsiteRecord | null> {
    const hash = hashKey(rawDashboardKey);
    const site = this.state.websites.find(w => w.site_id === siteId && w.dashboard_key_hash === hash);
    return site || null;
  }

  public async validateTrackingKey(siteId: string, rawTrackingKey: string): Promise<WebsiteRecord | null> {
    const hash = hashKey(rawTrackingKey);
    const site = this.state.websites.find(w => w.site_id === siteId && w.tracking_key_hash === hash);
    return site || null;
  }

  public async getWebsite(siteId: string): Promise<WebsiteRecord | null> {
    const site = this.state.websites.find(w => w.site_id === siteId);
    return site || null;
  }

  public async listWebsites(): Promise<Array<{ id: string; site_id: string; name: string; domain: string; created_at: string }>> {
    return this.state.websites.map(w => ({
      id: w.id,
      site_id: w.site_id,
      name: w.name,
      domain: w.domain,
      created_at: w.created_at
    }));
  }

  public async checkSiteStatus(siteId: string) {
    const sitePageviews = this.state.pageviews.filter(p => p.site_id === siteId);
    const siteEvents = this.state.events.filter(e => e.site_id === siteId);
    const count = sitePageviews.length + siteEvents.length;
    const firstEvent = sitePageviews[0]?.created_at || siteEvents[0]?.created_at || null;

    return {
      has_events: count > 0,
      count,
      first_event_at: firstEvent
    };
  }

  // Unified Ingestion Pipeline
  public async ingestEvent(
    data: IngestionPayload,
    clientGeo: { country: string; region: string }
  ): Promise<{ success: boolean; milestone?: MilestoneRecord | null; duplicate?: boolean }> {
    const site = await this.validateTrackingKey(data.site_id, data.tracking_key);
    if (!site) {
      throw new Error('Invalid site ID or tracking key');
    }

    return this.processEventIngestion(data.site_id, data.type, data.payload, clientGeo);
  }

  public async ingestEventDirect(
    data: IngestionPayload,
    clientGeo: { country: string; region: string }
  ): Promise<{ success: boolean; milestone?: MilestoneRecord | null; duplicate?: boolean }> {
    const site = await this.getWebsite(data.site_id);
    if (!site) {
      throw new Error('Website not found');
    }

    return this.processEventIngestion(data.site_id, data.type, data.payload, clientGeo);
  }

  private async processEventIngestion(
    site_id: string,
    type: 'pageview' | 'event' | 'ping' | 'heartbeat',
    payload: any,
    clientGeo: { country: string; region: string }
  ): Promise<{ success: boolean; milestone?: MilestoneRecord | null; duplicate?: boolean }> {
    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];
    const nowMs = Date.now();

    // 1. Resolve or Create Visitor (Persistent anonymous ID)
    let visitor = this.state.visitors.find(
      v => v.site_id === site_id && v.anonymous_id === payload.anonymous_id
    );

    if (!visitor) {
      visitor = {
        id: crypto.randomUUID ? crypto.randomUUID() : `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        site_id,
        anonymous_id: payload.anonymous_id,
        first_seen: nowIso,
        last_seen: nowIso,
        country: clientGeo.country || 'Unknown',
        region: clientGeo.region || 'Unknown',
        device_type: payload.device_type || 'desktop',
        browser: payload.browser || 'Unknown',
        os: payload.os || 'Unknown'
      };
      this.state.visitors.push(visitor);
    } else {
      visitor.last_seen = nowIso;
      if (clientGeo.country && (!visitor.country || visitor.country === 'Unknown')) {
        visitor.country = clientGeo.country;
      }
      if (payload.device_type) visitor.device_type = payload.device_type;
      if (payload.browser && visitor.browser === 'Unknown') visitor.browser = payload.browser;
      if (payload.os && visitor.os === 'Unknown') visitor.os = payload.os;
    }

    // 2. Duplicate Event / StrictMode Protection
    if (payload.event_id && this.processedEventIds.has(payload.event_id)) {
      // Event already processed
      return { success: true, milestone: null, duplicate: true };
    }
    if (payload.event_id) {
      this.processedEventIds.set(payload.event_id, nowMs);
    }

    const currentPath = payload.path || (payload.url ? new URL(payload.url, 'http://localhost').pathname : '/');

    // Debounce rapid duplicate pageviews (e.g. React StrictMode or immediate replaceState)
    if (type === 'pageview') {
      const dedupeKey = `${site_id}:${visitor.id}:${currentPath}`;
      const lastPvTime = this.recentPageviews.get(dedupeKey);
      if (lastPvTime && (nowMs - lastPvTime < 1000)) {
        // Duplicate pageview within 1 second - refresh session activity without double counting
        const existingSession = this.state.sessions.find(
          s => s.site_id === site_id && s.session_id === payload.session_id
        );
        if (existingSession) {
          existingSession.last_activity = nowIso;
        }
        return { success: true, milestone: null, duplicate: true };
      }
      this.recentPageviews.set(dedupeKey, nowMs);
    }

    // Parse Referrer Domain
    let refDomain = '';
    if (payload.referrer) {
      try {
        refDomain = new URL(payload.referrer).hostname.replace(/^www\./, '');
      } catch {
        refDomain = payload.referrer.split('/')[0];
      }
    }

    // 3. Resolve or Create Session (Enforce 30-minute inactivity timeout)
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
    let session = this.state.sessions.find(
      s => s.site_id === site_id && s.session_id === payload.session_id
    );

    const isExpired = session && (nowMs - new Date(session.last_activity).getTime() > SESSION_TIMEOUT_MS);

    if (!session || isExpired) {
      // New Session
      session = {
        id: crypto.randomUUID ? crypto.randomUUID() : `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        site_id,
        visitor_id: visitor.id,
        session_id: isExpired ? `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : payload.session_id,
        started_at: nowIso,
        last_activity: nowIso,
        landing_page: currentPath,
        exit_page: currentPath,
        duration: payload.duration || 0,
        pageview_count: type === 'pageview' ? 1 : 0,
        referrer_domain: refDomain || undefined,
        utm_source: payload.utm?.source || undefined,
        utm_medium: payload.utm?.medium || undefined,
        utm_campaign: payload.utm?.campaign || undefined
      };
      this.state.sessions.push(session);
    } else {
      // Existing active session
      session.last_activity = nowIso;
      session.exit_page = currentPath;

      const startedMs = new Date(session.started_at).getTime();
      const calculatedDuration = Math.max(0, Math.round((nowMs - startedMs) / 1000));
      session.duration = Math.max(session.duration || 0, payload.duration || 0, calculatedDuration);

      if (type === 'pageview') {
        session.pageview_count = (session.pageview_count || 0) + 1;
      }
    }

    // 4. Record Pageview or Custom Event
    if (type === 'pageview') {
      const pvRecord: PageviewRecord = {
        id: crypto.randomUUID ? crypto.randomUUID() : `pv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        site_id,
        visitor_id: visitor.id,
        session_id: session.session_id,
        url: payload.url || '/',
        path: currentPath,
        title: payload.title || 'Untitled',
        referrer: payload.referrer || '',
        referrer_domain: refDomain || undefined,
        utm_source: payload.utm?.source || undefined,
        utm_medium: payload.utm?.medium || undefined,
        utm_campaign: payload.utm?.campaign || undefined,
        utm_term: payload.utm?.term || undefined,
        utm_content: payload.utm?.content || undefined,
        created_at: nowIso,
        event_id: payload.event_id
      };
      this.state.pageviews.push(pvRecord);
    } else if (type === 'event' && payload.event_name) {
      const evRecord: EventRecord = {
        id: crypto.randomUUID ? crypto.randomUUID() : `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        site_id,
        visitor_id: visitor.id,
        session_id: session.session_id,
        event_type: payload.event_name,
        page_url: payload.url || currentPath,
        referrer: payload.referrer || '',
        metadata: payload.metadata || {},
        created_at: nowIso,
        event_id: payload.event_id
      };
      this.state.events.push(evRecord);
    }
    // Note: 'heartbeat' and 'ping' only update session last_activity and duration, without adding records

    // 5. Update daily aggregation & milestones
    this.updateDailyStat(site_id, today);
    const milestone = this.checkAndAwardMilestone(site_id);
    this.persistLocal();

    return {
      success: true,
      milestone,
      duplicate: false
    };
  }

  // Calculate & Upsert daily rollup
  private updateDailyStat(siteId: string, dateStr: string) {
    const sitePageviews = this.state.pageviews.filter(
      p => p.site_id === siteId && p.created_at.startsWith(dateStr)
    );
    const siteSessions = this.state.sessions.filter(
      s => s.site_id === siteId && (s.started_at.startsWith(dateStr) || s.last_activity.startsWith(dateStr))
    );
    const uniqueVisitorIds = new Set<string>();
    for (const pv of sitePageviews) uniqueVisitorIds.add(pv.visitor_id);
    for (const s of siteSessions) uniqueVisitorIds.add(s.visitor_id);

    let bounceCount = 0;
    let totalDuration = 0;
    for (const s of siteSessions) {
      if (s.pageview_count <= 1 && (s.duration || 0) < 15) {
        bounceCount++;
      }
      totalDuration += (s.duration || 0);
    }

    const bounceRate = siteSessions.length > 0
      ? Math.round((bounceCount / siteSessions.length) * 1000) / 10
      : 0;

    const avgDuration = siteSessions.length > 0
      ? Math.round(totalDuration / siteSessions.length)
      : 0;

    let stat = this.state.daily_stats.find(d => d.site_id === siteId && d.date === dateStr);
    if (!stat) {
      stat = {
        id: crypto.randomUUID ? crypto.randomUUID() : `ds_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        site_id: siteId,
        date: dateStr,
        visitors: uniqueVisitorIds.size,
        sessions: siteSessions.length,
        pageviews: sitePageviews.length,
        bounce_rate: bounceRate,
        avg_session_duration: avgDuration
      };
      this.state.daily_stats.push(stat);
    } else {
      stat.visitors = uniqueVisitorIds.size;
      stat.sessions = siteSessions.length;
      stat.pageviews = sitePageviews.length;
      stat.bounce_rate = bounceRate;
      stat.avg_session_duration = avgDuration;
    }
  }

  private checkAndAwardMilestone(siteId: string): MilestoneRecord | null {
    const totalVisitors = this.state.visitors.filter(v => v.site_id === siteId).length;

    for (const threshold of MILESTONES_THRESHOLDS) {
      if (totalVisitors >= threshold) {
        const milestoneType = `visitors_${threshold}`;
        const existing = this.state.milestones.find(
          m => m.site_id === siteId && m.milestone_type === milestoneType
        );
        if (!existing) {
          const newMilestone: MilestoneRecord = {
            id: crypto.randomUUID ? crypto.randomUUID() : `ms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            site_id: siteId,
            milestone_type: milestoneType,
            threshold,
            achieved_at: new Date().toISOString(),
            metadata: {
              total_visitors: totalVisitors
            }
          };
          this.state.milestones.push(newMilestone);
          return newMilestone;
        }
      }
    }
    return null;
  }

  // ==========================================
  // REALTIME ANALYTICS (Active window = 5 minutes)
  // ==========================================
  public async getRealtimeStats(siteId: string) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // 1. Active sessions within last 5 minutes
    const activeSessions = this.state.sessions.filter(
      s => s.site_id === siteId && s.last_activity >= fiveMinutesAgo
    );
    const activeVisitorIds = new Set(activeSessions.map(s => s.visitor_id));
    const liveVisitors = activeVisitorIds.size;

    // 2. Active pages right now:
    // Determine the current page for each active session, and count distinct active visitors on that page
    const pageVisitorMap: Record<string, { path: string; title: string; visitors: Set<string> }> = {};

    for (const s of activeSessions) {
      const pagePath = s.exit_page || s.landing_page || '/';
      if (!pageVisitorMap[pagePath]) {
        // Resolve title from latest pageview
        const pv = this.state.pageviews.slice().reverse().find(
          p => p.site_id === siteId && p.path === pagePath
        );
        pageVisitorMap[pagePath] = {
          path: pagePath,
          title: pv?.title || (pagePath === '/' ? 'Home' : pagePath.replace(/^\//, '')),
          visitors: new Set()
        };
      }
      pageVisitorMap[pagePath].visitors.add(s.visitor_id);
    }

    const currentPages = Object.values(pageVisitorMap)
      .map(p => ({
        path: p.path,
        title: p.title,
        count: p.visitors.size
      }))
      .sort((a, b) => b.count - a.count);

    // 3. Active countries & devices (one count per distinct active visitor)
    const activeVisitors = this.state.visitors.filter(v => activeVisitorIds.has(v.id));
    const countryCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = {};

    for (const v of activeVisitors) {
      countryCounts[v.country || 'Unknown'] = (countryCounts[v.country || 'Unknown'] || 0) + 1;
      deviceCounts[v.device_type || 'desktop'] = (deviceCounts[v.device_type || 'desktop'] || 0) + 1;
    }

    const countries = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    const devices = Object.entries(deviceCounts)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);

    // 4. Active referrers (from active sessions)
    const refCounts: Record<string, number> = {};
    for (const s of activeSessions) {
      const ref = s.referrer_domain || 'Direct';
      refCounts[ref] = (refCounts[ref] || 0) + 1;
    }
    const referrers = Object.entries(refCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // 5. Recent Event Stream (last 15 items: pageviews or custom events)
    const recentEvents = [
      ...this.state.pageviews
        .filter(p => p.site_id === siteId)
        .map(p => ({
          id: p.id,
          type: 'pageview',
          name: p.path,
          detail: p.title,
          time: p.created_at
        })),
      ...this.state.events
        .filter(e => e.site_id === siteId)
        .map(e => ({
          id: e.id,
          type: 'custom_event',
          name: e.event_type,
          detail: JSON.stringify(e.metadata),
          time: e.created_at
        }))
    ]
      .sort((a, b) => b.time.localeCompare(a.time))
      .slice(0, 15);

    return {
      liveVisitors,
      currentPages,
      countries,
      devices,
      referrers,
      recentEvents,
      updatedAt: new Date().toISOString()
    };
  }

  // ==========================================
  // DASHBOARD ANALYTICS (Consistent Date Range Queries)
  // ==========================================
  public async getDashboardStats(
    siteId: string,
    range: string = '7d',
    customFrom?: string,
    customTo?: string
  ) {
    const site = this.state.websites.find(w => w.site_id === siteId);
    if (!site) throw new Error('Website not found');

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let prevStartDate: Date;
    let prevEndDate: Date;

    const todayUtc = now.toISOString().slice(0, 10);

    if (range === 'today') {
      startDate = new Date(`${todayUtc}T00:00:00.000Z`);
      endDate = now;
      const durationMs = 24 * 60 * 60 * 1000;
      prevStartDate = new Date(startDate.getTime() - durationMs);
      prevEndDate = new Date(startDate.getTime() - 1);
    } else if (range === 'yesterday') {
      const yesterdayUtc = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      startDate = new Date(`${yesterdayUtc}T00:00:00.000Z`);
      endDate = new Date(`${yesterdayUtc}T23:59:59.999Z`);
      prevStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime() - 1);
    } else if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = now;
      prevStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      prevEndDate = startDate;
    } else if (range === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      endDate = now;
      prevStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      prevEndDate = startDate;
    } else if (range === 'custom' && customFrom && customTo) {
      startDate = new Date(customFrom.includes('T') ? customFrom : `${customFrom}T00:00:00.000Z`);
      endDate = new Date(customTo.includes('T') ? customTo : `${customTo}T23:59:59.999Z`);
      const spanMs = Math.max(24 * 60 * 60 * 1000, endDate.getTime() - startDate.getTime());
      prevStartDate = new Date(startDate.getTime() - spanMs);
      prevEndDate = startDate;
    } else {
      // Default 7 days
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = now;
      prevStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      prevEndDate = startDate;
    }

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();
    const prevStartIso = prevStartDate.toISOString();
    const prevEndIso = prevEndDate.toISOString();

    // 1. Current Period Data
    const curPvs = this.state.pageviews.filter(
      p => p.site_id === siteId && p.created_at >= startIso && p.created_at <= endIso
    );
    const curEvents = this.state.events.filter(
      e => e.site_id === siteId && e.created_at >= startIso && e.created_at <= endIso
    );
    const curSessions = this.state.sessions.filter(
      s => s.site_id === siteId && (
        (s.started_at >= startIso && s.started_at <= endIso) ||
        (s.last_activity >= startIso && s.started_at <= endIso)
      )
    );

    // Count unique anonymous visitors who had activity in this period
    const curVisitorIds = new Set<string>();
    for (const p of curPvs) if (p.visitor_id) curVisitorIds.add(p.visitor_id);
    for (const e of curEvents) if (e.visitor_id) curVisitorIds.add(e.visitor_id);
    for (const s of curSessions) if (s.visitor_id) curVisitorIds.add(s.visitor_id);
    const curVisitors = curVisitorIds.size;

    // Bounce Rate & Avg Duration
    let curBounces = 0;
    let curTotalDuration = 0;
    for (const s of curSessions) {
      if (s.pageview_count <= 1 && (s.duration || 0) < 15) {
        curBounces++;
      }
      curTotalDuration += (s.duration || 0);
    }
    const curBounceRate = curSessions.length > 0 ? (curBounces / curSessions.length) * 100 : 0;
    const curAvgDuration = curSessions.length > 0 ? Math.round(curTotalDuration / curSessions.length) : 0;

    // 2. Previous Period Data (for % growth comparisons)
    const prevPvs = this.state.pageviews.filter(
      p => p.site_id === siteId && p.created_at >= prevStartIso && p.created_at < prevEndIso
    );
    const prevEvents = this.state.events.filter(
      e => e.site_id === siteId && e.created_at >= prevStartIso && e.created_at < prevEndIso
    );
    const prevSessions = this.state.sessions.filter(
      s => s.site_id === siteId && (
        (s.started_at >= prevStartIso && s.started_at < prevEndIso) ||
        (s.last_activity >= prevStartIso && s.started_at < prevEndIso)
      )
    );
    const prevVisitorIds = new Set<string>();
    for (const p of prevPvs) if (p.visitor_id) prevVisitorIds.add(p.visitor_id);
    for (const e of prevEvents) if (e.visitor_id) prevVisitorIds.add(e.visitor_id);
    for (const s of prevSessions) if (s.visitor_id) prevVisitorIds.add(s.visitor_id);
    const prevVisitors = prevVisitorIds.size;

    let prevBounces = 0;
    let prevTotalDuration = 0;
    for (const s of prevSessions) {
      if (s.pageview_count <= 1 && (s.duration || 0) < 15) prevBounces++;
      prevTotalDuration += (s.duration || 0);
    }
    const prevBounceRate = prevSessions.length > 0 ? (prevBounces / prevSessions.length) * 100 : 0;
    const prevAvgDuration = prevSessions.length > 0 ? Math.round(prevTotalDuration / prevSessions.length) : 0;

    const calcChange = (cur: number, prev: number) => {
      if (prev === 0) return cur > 0 ? 100 : 0;
      return Math.round(((cur - prev) / prev) * 1000) / 10;
    };

    // 3. Timeseries Graph (daily breakdown)
    const chartMap: Record<string, { date: string; visitors: Set<string>; sessions: number; pageviews: number }> = {};
    const daysCount = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split('T')[0];
      chartMap[dateKey] = { date: dateKey, visitors: new Set(), sessions: 0, pageviews: 0 };
    }

    for (const pv of curPvs) {
      const dateKey = pv.created_at.split('T')[0];
      if (chartMap[dateKey]) {
        chartMap[dateKey].pageviews++;
        if (pv.visitor_id) chartMap[dateKey].visitors.add(pv.visitor_id);
      }
    }

    for (const s of curSessions) {
      const dateKey = s.started_at.split('T')[0];
      if (chartMap[dateKey]) {
        chartMap[dateKey].sessions++;
        if (s.visitor_id) chartMap[dateKey].visitors.add(s.visitor_id);
      }
    }

    const timeseries = Object.values(chartMap).map(item => ({
      date: item.date,
      formattedDate: new Date(item.date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      visitors: item.visitors.size,
      sessions: item.sessions,
      pageviews: item.pageviews
    }));

    // 4. Top Pages
    const pageMetrics: Record<string, { path: string; title: string; views: number; uniqueVisitors: Set<string>; totalDuration: number; durationCount: number }> = {};
    for (const pv of curPvs) {
      if (!pageMetrics[pv.path]) {
        pageMetrics[pv.path] = {
          path: pv.path,
          title: pv.title || 'Untitled',
          views: 0,
          uniqueVisitors: new Set(),
          totalDuration: 0,
          durationCount: 0
        };
      }
      pageMetrics[pv.path].views++;
      pageMetrics[pv.path].uniqueVisitors.add(pv.visitor_id);
    }

    for (const s of curSessions) {
      const p = s.exit_page || s.landing_page;
      if (p && pageMetrics[p]) {
        pageMetrics[p].totalDuration += (s.duration || 0);
        pageMetrics[p].durationCount++;
      }
    }

    const topPages = Object.values(pageMetrics)
      .map(p => ({
        path: p.path,
        title: p.title,
        views: p.views,
        uniqueVisitors: p.uniqueVisitors.size,
        avgTime: p.durationCount > 0 ? Math.round(p.totalDuration / p.durationCount) : (curAvgDuration || 15)
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // 5. Traffic Sources (Attributed per SESSION acquisition channel)
    const channelCounts: Record<string, number> = {
      Direct: 0,
      Google: 0,
      Bing: 0,
      Instagram: 0,
      YouTube: 0,
      Facebook: 0,
      LinkedIn: 0,
      'X / Twitter': 0,
      Referral: 0,
      Other: 0
    };

    const referrerDomains: Record<string, number> = {};
    const utmCampaigns: Record<string, number> = {};
    const utmSources: Record<string, number> = {};

    for (const s of curSessions) {
      const ref = (s.referrer_domain || '').toLowerCase();
      const utmSrc = (s.utm_source || '').toLowerCase();

      if (!ref && !utmSrc) {
        channelCounts.Direct++;
      } else if (ref.includes('google') || utmSrc.includes('google')) {
        channelCounts.Google++;
      } else if (ref.includes('bing')) {
        channelCounts.Bing++;
      } else if (ref.includes('instagram') || utmSrc.includes('instagram')) {
        channelCounts.Instagram++;
      } else if (ref.includes('youtube') || utmSrc.includes('youtube')) {
        channelCounts.YouTube++;
      } else if (ref.includes('facebook') || utmSrc.includes('facebook')) {
        channelCounts.Facebook++;
      } else if (ref.includes('linkedin') || utmSrc.includes('linkedin')) {
        channelCounts.LinkedIn++;
      } else if (ref.includes('twitter') || ref.includes('t.co') || ref.includes('x.com')) {
        channelCounts['X / Twitter']++;
      } else if (ref) {
        channelCounts.Referral++;
        referrerDomains[s.referrer_domain!] = (referrerDomains[s.referrer_domain!] || 0) + 1;
      } else {
        channelCounts.Other++;
      }

      if (s.utm_campaign) {
        utmCampaigns[s.utm_campaign] = (utmCampaigns[s.utm_campaign] || 0) + 1;
      }
      if (s.utm_source) {
        utmSources[s.utm_source] = (utmSources[s.utm_source] || 0) + 1;
      }
    }

    const sources = Object.entries(channelCounts)
      .filter(([_, count]) => count > 0)
      .map(([channel, count]) => ({
        channel,
        count,
        percentage: curSessions.length > 0 ? Math.round((count / curSessions.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    const referrers = Object.entries(referrerDomains)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const campaigns = Object.entries(utmCampaigns)
      .map(([campaign, count]) => ({ campaign, count }))
      .sort((a, b) => b.count - a.count);

    // 6. Audience Insights (Aggregated per UNIQUE ACTIVE VISITOR)
    const activeVisitors = this.state.visitors.filter(v => curVisitorIds.has(v.id));
    const countryMap: Record<string, number> = {};
    const deviceMap: Record<string, number> = {};
    const browserMap: Record<string, number> = {};
    const osMap: Record<string, number> = {};

    for (const v of activeVisitors) {
      countryMap[v.country || 'Unknown'] = (countryMap[v.country || 'Unknown'] || 0) + 1;
      deviceMap[v.device_type || 'desktop'] = (deviceMap[v.device_type || 'desktop'] || 0) + 1;
      browserMap[v.browser || 'Unknown'] = (browserMap[v.browser || 'Unknown'] || 0) + 1;
      osMap[v.os || 'Unknown'] = (osMap[v.os || 'Unknown'] || 0) + 1;
    }

    const audience = {
      countries: Object.entries(countryMap)
        .map(([country, count]) => ({ country, count, percentage: activeVisitors.length > 0 ? Math.round((count / activeVisitors.length) * 100) : 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      devices: Object.entries(deviceMap)
        .map(([device, count]) => ({ device, count, percentage: activeVisitors.length > 0 ? Math.round((count / activeVisitors.length) * 100) : 0 }))
        .sort((a, b) => b.count - a.count),
      browsers: Object.entries(browserMap)
        .map(([browser, count]) => ({ browser, count, percentage: activeVisitors.length > 0 ? Math.round((count / activeVisitors.length) * 100) : 0 }))
        .sort((a, b) => b.count - a.count),
      os: Object.entries(osMap)
        .map(([os, count]) => ({ os, count, percentage: activeVisitors.length > 0 ? Math.round((count / activeVisitors.length) * 100) : 0 }))
        .sort((a, b) => b.count - a.count)
    };

    // 7. Custom Events
    const eventStats: Record<string, { event_type: string; count: number; uniqueVisitors: Set<string> }> = {};
    for (const ev of curEvents) {
      if (!eventStats[ev.event_type]) {
        eventStats[ev.event_type] = {
          event_type: ev.event_type,
          count: 0,
          uniqueVisitors: new Set()
        };
      }
      eventStats[ev.event_type].count++;
      eventStats[ev.event_type].uniqueVisitors.add(ev.visitor_id);
    }
    const events = Object.values(eventStats)
      .map(ev => ({
        event_name: ev.event_type,
        count: ev.count,
        unique_visitors: ev.uniqueVisitors.size,
        conversion_rate: curVisitors > 0 ? Math.round((ev.uniqueVisitors.size / curVisitors) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // 8. Milestones
    const totalAllTimeVisitors = this.state.visitors.filter(v => v.site_id === siteId).length;
    const achievedMilestones = this.state.milestones
      .filter(m => m.site_id === siteId)
      .sort((a, b) => a.threshold - b.threshold);

    const nextMilestoneThreshold = MILESTONES_THRESHOLDS.find(t => t > totalAllTimeVisitors) || 1000000;
    const prevMilestoneThreshold = [...MILESTONES_THRESHOLDS].reverse().find(t => t <= totalAllTimeVisitors) || 0;
    const progressToNext = Math.min(
      100,
      Math.max(
        0,
        Math.round(((totalAllTimeVisitors - prevMilestoneThreshold) / (nextMilestoneThreshold - prevMilestoneThreshold)) * 100)
      )
    );

    return {
      website: {
        site_id: site.site_id,
        name: site.name,
        domain: site.domain,
        created_at: site.created_at
      },
      overview: {
        visitors: { value: curVisitors, change: calcChange(curVisitors, prevVisitors) },
        sessions: { value: curSessions.length, change: calcChange(curSessions.length, prevSessions.length) },
        pageviews: { value: curPvs.length, change: calcChange(curPvs.length, prevPvs.length) },
        bounce_rate: { value: Math.round(curBounceRate * 10) / 10, change: calcChange(curBounceRate, prevBounceRate) },
        avg_duration: { value: curAvgDuration, change: calcChange(curAvgDuration, prevAvgDuration) }
      },
      timeseries,
      topPages,
      sources,
      referrers,
      campaigns,
      audience,
      events,
      milestones: {
        achieved: achievedMilestones,
        totalVisitors: totalAllTimeVisitors,
        nextThreshold: nextMilestoneThreshold,
        progress: progressToNext,
        latest: achievedMilestones[achievedMilestones.length - 1] || null
      }
    };
  }

  // Delete website
  public async deleteWebsite(siteId: string) {
    this.state.websites = this.state.websites.filter(w => w.site_id !== siteId);
    this.state.visitors = this.state.visitors.filter(v => v.site_id !== siteId);
    this.state.sessions = this.state.sessions.filter(s => s.site_id !== siteId);
    this.state.pageviews = this.state.pageviews.filter(p => p.site_id !== siteId);
    this.state.events = this.state.events.filter(e => e.site_id !== siteId);
    this.state.daily_stats = this.state.daily_stats.filter(d => d.site_id !== siteId);
    this.state.milestones = this.state.milestones.filter(m => m.site_id !== siteId);
    this.persistLocal();
    return true;
  }
}

export const db = new AnalyticsDatabase();
