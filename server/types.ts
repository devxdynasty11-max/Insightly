export interface WebsiteRecord {
  id: string;
  name: string;
  domain: string;
  site_id: string;
  tracking_key_hash: string;
  dashboard_key_hash: string;
  created_at: string;
  aliases?: string[];
  secondary_tracking_key_hashes?: string[];
  secondary_dashboard_key_hashes?: string[];
}

export interface VisitorRecord {
  id: string;
  site_id: string;
  anonymous_id: string;
  first_seen: string;
  last_seen: string;
  country: string;
  region: string;
  device_type: string;
  browser: string;
  os: string;
}

export interface SessionRecord {
  id: string;
  site_id: string;
  visitor_id: string;
  session_id: string;
  started_at: string;
  last_activity: string;
  landing_page: string;
  exit_page?: string;
  duration: number; // seconds
  pageview_count: number;
  referrer_domain?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface PageviewRecord {
  id: string;
  site_id: string;
  visitor_id: string;
  session_id: string;
  url: string;
  path: string;
  title: string;
  referrer: string;
  referrer_domain?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  created_at: string;
  event_id?: string;
}

export interface EventRecord {
  id: string;
  site_id: string;
  visitor_id: string;
  session_id: string;
  event_type: string;
  page_url: string;
  referrer: string;
  metadata: Record<string, any>;
  created_at: string;
  event_id?: string;
}

export interface DailyStatRecord {
  id: string;
  site_id: string;
  date: string; // YYYY-MM-DD
  visitors: number;
  sessions: number;
  pageviews: number;
  bounce_rate: number;
  avg_session_duration: number;
}

export interface MilestoneRecord {
  id: string;
  site_id: string;
  milestone_type: string;
  threshold: number;
  achieved_at: string;
  metadata?: Record<string, any>;
}

export interface IngestionPayload {
  site_id: string;
  tracking_key: string;
  type: 'pageview' | 'event' | 'ping' | 'heartbeat';
  payload: {
    event_id?: string;
    url: string;
    path?: string;
    title?: string;
    referrer?: string;
    anonymous_id: string;
    session_id: string;
    device_type?: string;
    browser?: string;
    os?: string;
    screen_size?: string;
    language?: string;
    utm?: {
      source?: string;
      medium?: string;
      campaign?: string;
      term?: string;
      content?: string;
    };
    event_name?: string;
    metadata?: Record<string, any>;
    duration?: number;
    timestamp?: string;
  };
}
