import { DashboardStats, RealtimeStats } from '../types';

export const DEMO_WEBSITE = {
  site_id: 'site_demo_orbit',
  name: 'ORBIT (Demo)',
  domain: 'orbit.example',
  created_at: '2026-08-01T00:00:00.000Z'
};

export const DEMO_DASHBOARD_STATS: DashboardStats = {
  website: DEMO_WEBSITE,
  overview: {
    visitors: { value: 14280, change: 18.4 },
    sessions: { value: 18940, change: 12.1 },
    pageviews: { value: 46210, change: 24.6 },
    bounce_rate: { value: 34.2, change: -4.8 },
    avg_duration: { value: 148, change: 9.3 } // 2m 28s
  },
  timeseries: [
    { date: '2026-09-15', formattedDate: 'Sep 15', visitors: 1640, sessions: 2120, pageviews: 5120 },
    { date: '2026-09-16', formattedDate: 'Sep 16', visitors: 1820, sessions: 2340, pageviews: 5780 },
    { date: '2026-09-17', formattedDate: 'Sep 17', visitors: 2190, sessions: 2890, pageviews: 6940 },
    { date: '2026-09-18', formattedDate: 'Sep 18', visitors: 2450, sessions: 3100, pageviews: 7450 },
    { date: '2026-09-19', formattedDate: 'Sep 19', visitors: 2010, sessions: 2540, pageviews: 6210 },
    { date: '2026-09-20', formattedDate: 'Sep 20', visitors: 1880, sessions: 2410, pageviews: 5890 },
    { date: '2026-09-21', formattedDate: 'Sep 21', visitors: 2290, sessions: 3540, pageviews: 8820 }
  ],
  topPages: [
    { path: '/', title: 'Home — Orbit Cloud Workspace', views: 18450, uniqueVisitors: 9840, avgTime: 112 },
    { path: '/pricing', title: 'Pricing & Plans — Orbit', views: 9230, uniqueVisitors: 5610, avgTime: 184 },
    { path: '/blog/how-we-scaled-realtime', title: 'Scaling Realtime with 1M Websockets', views: 6840, uniqueVisitors: 4120, avgTime: 240 },
    { path: '/docs/getting-started', title: 'Developer Documentation — Orbit', views: 5120, uniqueVisitors: 3200, avgTime: 310 },
    { path: '/features/collaboration', title: 'Multiplayer Collaboration — Orbit', views: 3820, uniqueVisitors: 2450, avgTime: 145 },
    { path: '/changelog', title: 'Product Changelog v2.4', views: 2750, uniqueVisitors: 1910, avgTime: 95 }
  ],
  sources: [
    { channel: 'Google', count: 18400, percentage: 40 },
    { channel: 'Direct', count: 12500, percentage: 27 },
    { channel: 'X / Twitter', count: 6200, percentage: 13 },
    { channel: 'LinkedIn', count: 3400, percentage: 7 },
    { channel: 'YouTube', count: 2600, percentage: 6 },
    { channel: 'Referral', count: 2100, percentage: 5 },
    { channel: 'Other', count: 1010, percentage: 2 }
  ],
  referrers: [
    { domain: 'google.com', count: 18400 },
    { domain: 't.co', count: 6200 },
    { domain: 'github.com', count: 3900 },
    { domain: 'news.ycombinator.com', count: 2840 },
    { domain: 'linkedin.com', count: 2400 },
    { domain: 'producthunt.com', count: 1890 }
  ],
  campaigns: [
    { campaign: 'product_hunt_launch', count: 3420 },
    { campaign: 'twitter_thread_v2', count: 2150 },
    { campaign: 'q3_newsletter', count: 1680 }
  ],
  audience: {
    countries: [
      { country: 'United States', count: 6420, percentage: 45 },
      { country: 'Germany', count: 1840, percentage: 13 },
      { country: 'United Kingdom', count: 1560, percentage: 11 },
      { country: 'Japan', count: 1120, percentage: 8 },
      { country: 'Canada', count: 980, percentage: 7 },
      { country: 'India', count: 860, percentage: 6 },
      { country: 'France', count: 710, percentage: 5 },
      { country: 'Netherlands', count: 520, percentage: 4 }
    ],
    devices: [
      { device: 'desktop', count: 10240, percentage: 72 },
      { device: 'mobile', count: 3620, percentage: 25 },
      { device: 'tablet', count: 420, percentage: 3 }
    ],
    browsers: [
      { browser: 'Chrome', count: 9400, percentage: 66 },
      { browser: 'Safari', count: 2840, percentage: 20 },
      { browser: 'Firefox', count: 1150, percentage: 8 },
      { browser: 'Edge', count: 720, percentage: 5 },
      { browser: 'Other', count: 170, percentage: 1 }
    ],
    os: [
      { os: 'macOS', count: 7420, percentage: 52 },
      { os: 'Windows', count: 4200, percentage: 29 },
      { os: 'iOS', count: 1850, percentage: 13 },
      { os: 'Linux', count: 620, percentage: 4 },
      { os: 'Android', count: 190, percentage: 2 }
    ]
  },
  events: [
    { event_name: 'signup', count: 842, unique_visitors: 812, conversion_rate: 5.7 },
    { event_name: 'start_trial_click', count: 1420, unique_visitors: 1290, conversion_rate: 9.0 },
    { event_name: 'pricing_toggle_annual', count: 980, unique_visitors: 840, conversion_rate: 5.9 },
    { event_name: 'doc_copy_code', count: 2410, unique_visitors: 1150, conversion_rate: 8.1 }
  ],
  milestones: {
    achieved: [
      {
        id: 'ms_1',
        site_id: 'site_demo_orbit',
        milestone_type: 'visitors_100',
        threshold: 100,
        achieved_at: '2026-08-03T14:20:00.000Z'
      },
      {
        id: 'ms_2',
        site_id: 'site_demo_orbit',
        milestone_type: 'visitors_1000',
        threshold: 1000,
        achieved_at: '2026-08-12T09:15:00.000Z'
      },
      {
        id: 'ms_3',
        site_id: 'site_demo_orbit',
        milestone_type: 'visitors_5000',
        threshold: 5000,
        achieved_at: '2026-08-28T18:40:00.000Z'
      },
      {
        id: 'ms_4',
        site_id: 'site_demo_orbit',
        milestone_type: 'visitors_10000',
        threshold: 10000,
        achieved_at: '2026-09-14T11:05:00.000Z'
      }
    ],
    totalVisitors: 14280,
    nextThreshold: 25000,
    progress: 57,
    latest: {
      id: 'ms_4',
      site_id: 'site_demo_orbit',
      milestone_type: 'visitors_10000',
      threshold: 10000,
      achieved_at: '2026-09-14T11:05:00.000Z'
    }
  }
};

export const DEMO_REALTIME_STATS: RealtimeStats = {
  liveVisitors: 42,
  currentPages: [
    { path: '/', title: 'Home — Orbit Cloud Workspace', count: 18 },
    { path: '/pricing', title: 'Pricing & Plans — Orbit', count: 11 },
    { path: '/blog/how-we-scaled-realtime', title: 'Scaling Realtime with 1M Websockets', count: 7 },
    { path: '/docs/getting-started', title: 'Developer Documentation — Orbit', count: 4 },
    { path: '/changelog', title: 'Product Changelog v2.4', count: 2 }
  ],
  countries: [
    { country: 'United States', count: 19 },
    { country: 'Germany', count: 7 },
    { country: 'United Kingdom', count: 5 },
    { country: 'Japan', count: 4 },
    { country: 'Canada', count: 3 },
    { country: 'India', count: 2 },
    { country: 'France', count: 2 }
  ],
  devices: [
    { device: 'desktop', count: 31 },
    { device: 'mobile', count: 9 },
    { device: 'tablet', count: 2 }
  ],
  referrers: [
    { source: 'google.com', count: 17 },
    { source: 'Direct', count: 12 },
    { source: 't.co', count: 6 },
    { source: 'github.com', count: 4 },
    { source: 'news.ycombinator.com', count: 3 }
  ],
  recentEvents: [
    { id: '1', type: 'pageview', name: '/pricing', detail: 'Pricing & Plans — Orbit', time: new Date(Date.now() - 4000).toISOString() },
    { id: '2', type: 'custom_event', name: 'pricing_toggle_annual', detail: '{"plan":"annual"}', time: new Date(Date.now() - 11000).toISOString() },
    { id: '3', type: 'pageview', name: '/', detail: 'Home — Orbit Cloud Workspace', time: new Date(Date.now() - 19000).toISOString() },
    { id: '4', type: 'custom_event', name: 'signup', detail: '{"channel":"google"}', time: new Date(Date.now() - 32000).toISOString() },
    { id: '5', type: 'pageview', name: '/docs/getting-started', detail: 'Developer Documentation', time: new Date(Date.now() - 44000).toISOString() }
  ],
  updatedAt: new Date().toISOString()
};
