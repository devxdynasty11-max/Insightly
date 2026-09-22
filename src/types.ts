export interface Website {
  id?: string;
  site_id: string;
  name: string;
  domain: string;
  created_at: string;
  tracking_key?: string;
  dashboard_key?: string;
}

export interface MetricCardValue {
  value: number;
  change: number; // percentage change vs previous period
}

export interface OverviewMetrics {
  visitors: MetricCardValue;
  sessions: MetricCardValue;
  pageviews: MetricCardValue;
  bounce_rate: MetricCardValue;
  avg_duration: MetricCardValue; // seconds
}

export interface TimeseriesPoint {
  date: string;
  formattedDate: string;
  visitors: number;
  sessions: number;
  pageviews: number;
}

export interface TopPageItem {
  path: string;
  title: string;
  views: number;
  uniqueVisitors: number;
  avgTime: number;
}

export interface SourceItem {
  channel: string;
  count: number;
  percentage: number;
}

export interface ReferrerItem {
  domain: string;
  count: number;
}

export interface CampaignItem {
  campaign: string;
  count: number;
}

export type PageStat = TopPageItem;
export type TrafficSource = SourceItem;
export type ReferrerStat = ReferrerItem;
export type CampaignStat = CampaignItem;
export type EventStat = CustomEventItem;

export interface AudienceBreakdown {
  countries: Array<{ country: string; count: number; percentage: number }>;
  devices: Array<{ device: string; count: number; percentage: number }>;
  browsers: Array<{ browser: string; count: number; percentage: number }>;
  os: Array<{ os: string; count: number; percentage: number }>;
}

export interface CustomEventItem {
  event_name: string;
  count: number;
  unique_visitors: number;
  conversion_rate: number;
}

export interface MilestoneItem {
  id: string;
  site_id: string;
  milestone_type: string;
  threshold: number;
  achieved_at: string;
  metadata?: Record<string, any>;
}

export interface DashboardStats {
  website: Website;
  overview: OverviewMetrics;
  timeseries: TimeseriesPoint[];
  topPages: TopPageItem[];
  sources: SourceItem[];
  referrers: ReferrerItem[];
  campaigns: CampaignItem[];
  audience: AudienceBreakdown;
  events: CustomEventItem[];
  milestones: {
    achieved: MilestoneItem[];
    totalVisitors: number;
    nextThreshold: number;
    progress: number;
    latest: MilestoneItem | null;
  };
}

export interface RealtimeStats {
  liveVisitors: number;
  currentPages: Array<{ path: string; title: string; count: number }>;
  countries: Array<{ country: string; count: number }>;
  devices: Array<{ device: string; count: number }>;
  referrers: Array<{ source: string; count: number }>;
  recentEvents: Array<{
    id: string;
    type: string;
    name: string;
    detail: string;
    time: string;
  }>;
  updatedAt: string;
}

export type DateRange = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';
export type DashboardTab = 'overview' | 'realtime' | 'pages' | 'sources' | 'audience' | 'events' | 'websites' | 'settings';
