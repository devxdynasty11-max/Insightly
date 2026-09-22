import { DashboardStats, RealtimeStats, Website } from '../types';

export interface SavedSiteSession {
  site_id: string;
  dashboard_key: string;
  name: string;
  domain: string;
  tracking_key?: string;
  savedAt: string;
}

const STORAGE_ACTIVE_KEY = 'insightly_active_site';
const STORAGE_HISTORY_KEY = 'insightly_site_history';

// Local Storage Session Management
export function getStoredSession(): SavedSiteSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(session: SavedSiteSession): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(session));
    // Also add to history
    const history = getSavedSites();
    const filtered = history.filter(s => s.site_id !== session.site_id);
    filtered.unshift(session);
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(filtered.slice(0, 8)));
  } catch {}
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(STORAGE_ACTIVE_KEY);
  } catch {}
}

export function clearLocalSession(siteId?: string): void {
  clearStoredSession();
  if (siteId) {
    removeSavedSite(siteId);
  }
}

export function getSavedSites(): SavedSiteSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function removeSavedSite(siteId: string): void {
  try {
    const history = getSavedSites();
    const updated = history.filter(s => s.site_id !== siteId);
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updated));
    const active = getStoredSession();
    if (active && active.site_id === siteId) {
      clearStoredSession();
    }
  } catch {}
}

// API Calls
export async function createWebsiteApi(name: string, domain: string): Promise<{
  website: Website;
  site_id: string;
  tracking_key: string;
  dashboard_key: string;
}> {
  const res = await fetch('/api/websites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, domain })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create website');
  }
  return res.json();
}

export async function listWebsitesApi(): Promise<Website[]> {
  const res = await fetch('/api/websites');
  if (!res.ok) return [];
  const data = await res.json();
  return data.websites || [];
}

export async function verifyDashboardKeyApi(
  siteId: string,
  dashboardKey: string
): Promise<{ ok: boolean; website: Website }> {
  const res = await fetch('/api/dashboard/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ site_id: siteId, dashboard_key: dashboardKey })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Invalid website ID or dashboard access key');
  }
  return res.json();
}

export async function fetchDashboardStatsApi(
  siteId: string,
  dashboardKey: string,
  range: string = '7d',
  from?: string,
  to?: string
): Promise<DashboardStats> {
  const params = new URLSearchParams({ range });
  if (from) params.append('from', from);
  if (to) params.append('to', to);

  const res = await fetch(`/api/dashboard/stats?${params.toString()}`, {
    headers: {
      'x-site-id': siteId,
      'x-dashboard-key': dashboardKey
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to load dashboard statistics');
  }
  return res.json();
}

export async function fetchRealtimeStatsApi(
  siteId: string,
  dashboardKey: string
): Promise<RealtimeStats> {
  const res = await fetch('/api/dashboard/realtime', {
    headers: {
      'x-site-id': siteId,
      'x-dashboard-key': dashboardKey
    }
  });

  if (!res.ok) {
    throw new Error('Failed to load realtime stats');
  }
  return res.json();
}

export async function checkSiteTrackingStatusApi(siteId: string): Promise<{
  has_events: boolean;
  count: number;
  first_event_at: string | null;
}> {
  const res = await fetch(`/api/websites/status?site_id=${encodeURIComponent(siteId)}`);
  if (!res.ok) {
    return { has_events: false, count: 0, first_event_at: null };
  }
  return res.json();
}

export async function simulateTrafficApi(
  siteId: string,
  count: number = 1,
  page: string = '/',
  referrer: string = 'Google',
  event_name?: string
): Promise<{ ok: boolean; simulated: number; milestone: any }> {
  const res = await fetch('/api/test/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ site_id: siteId, count, page, referrer, event_name })
  });
  if (!res.ok) {
    throw new Error('Failed to simulate traffic');
  }
  return res.json();
}

export async function deleteWebsiteApi(siteId: string, dashboardKey: string): Promise<boolean> {
  const res = await fetch(`/api/websites/${siteId}`, {
    method: 'DELETE',
    headers: {
      'x-dashboard-key': dashboardKey
    }
  });
  return res.ok;
}
