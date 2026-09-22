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

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'insightly_db.json');
    this.init();
  }

  private init() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('[INSIGHTLY DB] Connected to Supabase PostgreSQL at', supabaseUrl);
      } catch (err) {
        console.error('[INSIGHTLY DB] Failed to connect to Supabase, falling back to local persistent store:', err);
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
        // Initialize with default state
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
        console.error('[INSIGHTLY DB] Supabase createWebsite error:', err);
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

  // Verify dashboard key access
  public async validateDashboardKey(siteId: string, rawDashboardKey: string): Promise<WebsiteRecord | null> {
    const hash = hashKey(rawDashboardKey);
    const site = this.state.websites.find(w => w.site_id === siteId && w.dashboard_key_hash === hash);
    return site || null;
  }

  // Verify tracking key
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

  // Check if a website has received any events
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

  // Ingest Inbound Analytics Event from Tracker
  public async ingestEvent(
    data: IngestionPayload,
    clientGeo: { country: string; region: string }
  ): Promise<{ success: boolean; milestone?: MilestoneRecord | null }> {
    const site = await this.validateTrackingKey(data.site_id, data.tracking_key);
    if (!site) {
      throw new Error('Invalid site ID or tracking key');
    }

    const { site_id, type, payload } = data;
    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    // 1. Resolve or Create Visitor
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
      if (clientGeo.country && visitor.country === 'Unknown') {
        visitor.country = clientGeo.country;
      }
    }

    // 2. Resolve or Create Session
    let session = this.state.sessions.find(
      s => s.site_id === site_id && s.session_id === payload.session_id
    );

    if (!session) {
      session = {
        id: crypto.randomUUID ? crypto.randomUUID() : `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        site_id,
        visitor_id: visitor.id,
        session_id: payload.session_id,
        started_at: nowIso,
        last_activity: nowIso,
        landing_page: payload.path || payload.url || '/',
        exit_page: payload.path || payload.url || '/',
        duration: payload.duration || 0,
        pageview_count: type === 'pageview' ? 1 : 0
      };
      this.state.sessions.push(session);
    } else {
      session.last_activity = nowIso;
      if (payload.path || payload.url) {
        session.exit_page = payload.path || payload.url;
      }
      if (payload.duration) {
        session.duration = Math.max(session.duration, payload.duration);
      }
      if (type === 'pageview') {
        session.pageview_count = (session.pageview_count || 1) + 1;
      }
    }

    // 3. Process Pageview / Event
    if (type === 'pageview') {
      let refDomain = '';
      if (payload.referrer) {
        try {
          refDomain = new URL(payload.referrer).hostname.replace(/^www\./, '');
        } catch {
          refDomain = payload.referrer.split('/')[0];
        }
      }

      const pvRecord: PageviewRecord = {
        id: crypto.randomUUID ? crypto.randomUUID() : `pv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        site_id,
        visitor_id: visitor.id,
        session_id: session.session_id,
        url: payload.url || '/',
        path: payload.path || new URL(payload.url || 'http://localhost/').pathname,
        title: payload.title || 'Untitled',
        referrer: payload.referrer || '',
        referrer_domain: refDomain || undefined,
        utm_source: payload.utm?.source || undefined,
        utm_medium: payload.utm?.medium || undefined,
        utm_campaign: payload.utm?.campaign || undefined,
        utm_term: payload.utm?.term || undefined,
        utm_content: payload.utm?.content || undefined,
        created_at: nowIso
      };
      this.state.pageviews.push(pvRecord);
    } else if (type === 'event' && payload.event_name) {
      const evRecord: EventRecord = {
        id: crypto.randomUUID ? crypto.randomUUID() : `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        site_id,
        visitor_id: visitor.id,
        session_id: session.session_id,
        event_type: payload.event_name,
        page_url: payload.url || '/',
        referrer: payload.referrer || '',
        metadata: payload.metadata || {},
        created_at: nowIso
      };
      this.state.events.push(evRecord);
    }

    // 4. Update Daily Stats Aggregation
    this.updateDailyStat(site_id, today);

    // 5. Milestone Detection
    const milestone = this.checkAndAwardMilestone(site_id);

    this.persistLocal();

    return {
      success: true,
      milestone
    };
  }

  // Internal direct ingestion (bypasses tracking key check for simulator/test site)
  public async ingestEventDirect(
    data: IngestionPayload,
    clientGeo: { country: string; region: string }
  ): Promise<{ success: boolean; milestone?: MilestoneRecord | null }> {
    const site = await this.getWebsite(data.site_id);
    if (!site) {
      throw new Error('Website not found');
    }

    const { site_id, type, payload } = data;
    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    // 1. Resolve or Create Visitor
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
      if (clientGeo.country && visitor.country === 'Unknown') {
        visitor.country = clientGeo.country;
      }
    }

    // 2. Resolve or Create Session
    let session = this.state.sessions.find(
      s => s.site_id === site_id && s.session_id === payload.session_id
    );

    if (!session) {
      session = {
        id: crypto.randomUUID ? crypto.randomUUID() : `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        site_id,
        visitor_id: visitor.id,
        session_id: payload.session_id,
        started_at: nowIso,
        last_activity: nowIso,
        landing_page: payload.path || payload.url || '/',
        exit_page: payload.path || payload.url || '/',
        duration: payload.duration || 0,
        pageview_count: type === 'pageview' ? 1 : 0
      };
      this.state.sessions.push(session);
    } else {
      session.last_activity = nowIso;
      if (payload.path || payload.url) {
        session.exit_page = payload.path || payload.url;
      }
      if (payload.duration) {
        session.duration = Math.max(session.duration, payload.duration);
      }
      if (type === 'pageview') {
        session.pageview_count = (session.pageview_count || 1) + 1;
      }
    }

    // 3. Process Pageview / Event
    if (type === 'pageview') {
      let refDomain = '';
      if (payload.referrer) {
        try {
          refDomain = new URL(payload.referrer).hostname.replace(/^www\./, '');
        } catch {
          refDomain = payload.referrer.split('/')[0];
        }
      }

      const pvRecord: PageviewRecord = {
        id: crypto.randomUUID ? crypto.randomUUID() : `pv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        site_id,
        visitor_id: visitor.id,
        session_id: session.session_id,
        url: payload.url || '/',
        path: payload.path || new URL(payload.url || 'http://localhost/').pathname,
        title: payload.title || 'Untitled',
        referrer: payload.referrer || '',
        referrer_domain: refDomain || undefined,
        utm_source: payload.utm?.source || undefined,
        utm_medium: payload.utm?.medium || undefined,
        utm_campaign: payload.utm?.campaign || undefined,
        utm_term: payload.utm?.term || undefined,
        utm_content: payload.utm?.content || undefined,
        created_at: nowIso
      };
      this.state.pageviews.push(pvRecord);
    } else if (type === 'event' && payload.event_name) {
      const evRecord: EventRecord = {
        id: crypto.randomUUID ? crypto.randomUUID() : `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        site_id,
        visitor_id: visitor.id,
        session_id: session.session_id,
        event_type: payload.event_name,
        page_url: payload.url || '/',
        referrer: payload.referrer || '',
        metadata: payload.metadata || {},
        created_at: nowIso
      };
      this.state.events.push(evRecord);
    }

    this.updateDailyStat(site_id, today);
    const milestone = this.checkAndAwardMilestone(site_id);
    this.persistLocal();

    return {
      success: true,
      milestone
    };
  }

  // Calculate & Upsert daily rollup
  private updateDailyStat(siteId: string, dateStr: string) {
    const sitePageviews = this.state.pageviews.filter(
      p => p.site_id === siteId && p.created_at.startsWith(dateStr)
    );
    const siteSessions = this.state.sessions.filter(
      s => s.site_id === siteId && s.started_at.startsWith(dateStr)
    );
    const uniqueVisitorIds = new Set(siteSessions.map(s => s.visitor_id));

    let bounceCount = 0;
    let totalDuration = 0;
    for (const s of siteSessions) {
      if (s.pageview_count <= 1 && s.duration < 15) {
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

  // Check and Record Milestone
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

  // Retrieve Realtime Analytics (last 5 minutes)
  public async getRealtimeStats(siteId: string) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // Active sessions
    const activeSessions = this.state.sessions.filter(
      s => s.site_id === siteId && s.last_activity >= fiveMinutesAgo
    );
    const activeVisitorIds = new Set(activeSessions.map(s => s.visitor_id));
    const liveVisitors = activeVisitorIds.size;

    // Recent pageviews in last 5 min
    const recentPvs = this.state.pageviews
      .filter(p => p.site_id === siteId && p.created_at >= fiveMinutesAgo)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    // Active pages
    const pageCounts: Record<string, { path: string; title: string; count: number }> = {};
    for (const pv of recentPvs) {
      if (!pageCounts[pv.path]) {
        pageCounts[pv.path] = { path: pv.path, title: pv.title, count: 0 };
      }
      pageCounts[pv.path].count++;
    }
    const currentPages = Object.values(pageCounts).sort((a, b) => b.count - a.count);

    // Active countries
    const activeVisitors = this.state.visitors.filter(v => activeVisitorIds.has(v.id));
    const countryCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = {};
    for (const v of activeVisitors) {
      countryCounts[v.country] = (countryCounts[v.country] || 0) + 1;
      deviceCounts[v.device_type] = (deviceCounts[v.device_type] || 0) + 1;
    }

    const countries = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    const devices = Object.entries(deviceCounts)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);

    // Active referrers
    const refCounts: Record<string, number> = {};
    for (const pv of recentPvs) {
      const ref = pv.referrer_domain || 'Direct';
      refCounts[ref] = (refCounts[ref] || 0) + 1;
    }
    const referrers = Object.entries(refCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // Recent event stream (last 15 items: pageviews or custom events)
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

  // Full Dashboard Analytics Query with Date Range & Comparison
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
    let endDate: Date = new Date();
    let prevStartDate: Date;
    let prevEndDate: Date;

    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const durationMs = 24 * 60 * 60 * 1000;
      prevStartDate = new Date(startDate.getTime() - durationMs);
      prevEndDate = new Date(endDate.getTime() - durationMs);
    } else if (range === 'yesterday') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      prevStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime());
    } else if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      prevStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime());
    } else if (range === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      prevStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime());
    } else if (range === 'custom' && customFrom && customTo) {
      startDate = new Date(customFrom);
      endDate = new Date(customTo);
      const spanMs = endDate.getTime() - startDate.getTime();
      prevStartDate = new Date(startDate.getTime() - spanMs);
      prevEndDate = new Date(startDate.getTime());
    } else {
      // Default 7 days
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime());
    }

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();
    const prevStartIso = prevStartDate.toISOString();
    const prevEndIso = prevEndDate.toISOString();

    // Filter Current Period Data
    const curPvs = this.state.pageviews.filter(
      p => p.site_id === siteId && p.created_at >= startIso && p.created_at <= endIso
    );
    const curSessions = this.state.sessions.filter(
      s => s.site_id === siteId && s.started_at >= startIso && s.started_at <= endIso
    );
    const curVisitorIds = new Set(curSessions.map(s => s.visitor_id));
    const curVisitors = curVisitorIds.size;

    let curBounces = 0;
    let curTotalDuration = 0;
    for (const s of curSessions) {
      if (s.pageview_count <= 1 && s.duration < 15) curBounces++;
      curTotalDuration += (s.duration || 0);
    }
    const curBounceRate = curSessions.length > 0 ? (curBounces / curSessions.length) * 100 : 0;
    const curAvgDuration = curSessions.length > 0 ? Math.round(curTotalDuration / curSessions.length) : 0;

    // Filter Previous Period Data (for % growth comparisons)
    const prevPvs = this.state.pageviews.filter(
      p => p.site_id === siteId && p.created_at >= prevStartIso && p.created_at < prevEndIso
    );
    const prevSessions = this.state.sessions.filter(
      s => s.site_id === siteId && s.started_at >= prevStartIso && s.started_at < prevEndIso
    );
    const prevVisitors = new Set(prevSessions.map(s => s.visitor_id)).size;

    let prevBounces = 0;
    let prevTotalDuration = 0;
    for (const s of prevSessions) {
      if (s.pageview_count <= 1 && s.duration < 15) prevBounces++;
      prevTotalDuration += (s.duration || 0);
    }
    const prevBounceRate = prevSessions.length > 0 ? (prevBounces / prevSessions.length) * 100 : 0;
    const prevAvgDuration = prevSessions.length > 0 ? Math.round(prevTotalDuration / prevSessions.length) : 0;

    // Helper calculate percentage change
    const calcChange = (cur: number, prev: number) => {
      if (prev === 0) return cur > 0 ? 100 : 0;
      return Math.round(((cur - prev) / prev) * 1000) / 10;
    };

    // Build Timeseries Graph (daily breakdown)
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
      }
    }

    for (const s of curSessions) {
      const dateKey = s.started_at.split('T')[0];
      if (chartMap[dateKey]) {
        chartMap[dateKey].sessions++;
        chartMap[dateKey].visitors.add(s.visitor_id);
      }
    }

    const timeseries = Object.values(chartMap).map(item => ({
      date: item.date,
      formattedDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      visitors: item.visitors.size,
      sessions: item.sessions,
      pageviews: item.pageviews
    }));

    // Top Pages
    const pageMetrics: Record<string, { path: string; title: string; views: number; uniqueVisitors: Set<string>; totalTime: number }> = {};
    for (const pv of curPvs) {
      if (!pageMetrics[pv.path]) {
        pageMetrics[pv.path] = {
          path: pv.path,
          title: pv.title || 'Untitled',
          views: 0,
          uniqueVisitors: new Set(),
          totalTime: 0
        };
      }
      pageMetrics[pv.path].views++;
      pageMetrics[pv.path].uniqueVisitors.add(pv.visitor_id);
    }
    const topPages = Object.values(pageMetrics)
      .map(p => ({
        path: p.path,
        title: p.title,
        views: p.views,
        uniqueVisitors: p.uniqueVisitors.size,
        avgTime: curSessions.length > 0 ? Math.round(curAvgDuration * 0.75) : 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Traffic Sources Classification
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

    for (const pv of curPvs) {
      const ref = (pv.referrer_domain || '').toLowerCase();
      const utmSrc = (pv.utm_source || '').toLowerCase();

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
        referrerDomains[pv.referrer_domain!] = (referrerDomains[pv.referrer_domain!] || 0) + 1;
      } else {
        channelCounts.Other++;
      }

      if (pv.utm_campaign) {
        utmCampaigns[pv.utm_campaign] = (utmCampaigns[pv.utm_campaign] || 0) + 1;
      }
      if (pv.utm_source) {
        utmSources[pv.utm_source] = (utmSources[pv.utm_source] || 0) + 1;
      }
    }

    const sources = Object.entries(channelCounts)
      .filter(([_, count]) => count > 0)
      .map(([channel, count]) => ({ channel, count, percentage: curPvs.length > 0 ? Math.round((count / curPvs.length) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    const referrers = Object.entries(referrerDomains)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const campaigns = Object.entries(utmCampaigns)
      .map(([campaign, count]) => ({ campaign, count }))
      .sort((a, b) => b.count - a.count);

    // Audience Insights (Countries, Devices, OS, Browsers)
    const activeVisitors = this.state.visitors.filter(v => curVisitorIds.has(v.id));
    const countryMap: Record<string, number> = {};
    const deviceMap: Record<string, number> = {};
    const browserMap: Record<string, number> = {};
    const osMap: Record<string, number> = {};

    for (const v of activeVisitors) {
      countryMap[v.country] = (countryMap[v.country] || 0) + 1;
      deviceMap[v.device_type] = (deviceMap[v.device_type] || 0) + 1;
      browserMap[v.browser] = (browserMap[v.browser] || 0) + 1;
      osMap[v.os] = (osMap[v.os] || 0) + 1;
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

    // Custom Events
    const curEvents = this.state.events.filter(
      e => e.site_id === siteId && e.created_at >= startIso && e.created_at <= endIso
    );
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

    // Milestones for this site
    const totalAllTimeVisitors = this.state.visitors.filter(v => v.site_id === siteId).length;
    const achievedMilestones = this.state.milestones
      .filter(m => m.site_id === siteId)
      .sort((a, b) => a.threshold - b.threshold);

    // Find next milestone
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
