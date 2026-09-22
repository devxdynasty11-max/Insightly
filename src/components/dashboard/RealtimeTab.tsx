import React, { useState, useEffect } from 'react';
import {
  Activity,
  Globe2,
  FileText,
  Radio,
  Smartphone,
  Monitor,
  Tablet,
  Share2,
  RefreshCw,
  Sparkles,
  Terminal
} from 'lucide-react';
import { RealtimeStats } from '../../types';
import { fetchRealtimeStatsApi } from '../../lib/api';
import { DEMO_REALTIME_STATS } from '../../lib/demoData';

interface RealtimeTabProps {
  siteId: string;
  dashboardKey: string;
  isDemo?: boolean;
}

export const RealtimeTab: React.FC<RealtimeTabProps> = ({
  siteId,
  dashboardKey,
  isDemo
}) => {
  const [data, setData] = useState<RealtimeStats>(
    isDemo ? DEMO_REALTIME_STATS : {
      liveVisitors: 0,
      currentPages: [],
      countries: [],
      devices: [],
      referrers: [],
      recentEvents: [],
      updatedAt: new Date().toISOString()
    }
  );
  const [loading, setLoading] = useState(false);
  const [lastTick, setLastTick] = useState<Date>(new Date());

  // Polling every 3 seconds for live realtime visitor activity
  useEffect(() => {
    let isMounted = true;

    const poll = async () => {
      if (isDemo) {
        // In demo mode, simulate slight natural fluctuations (e.g. 40-44 visitors)
        const delta = Math.floor(Math.random() * 3) - 1;
        setData(prev => ({
          ...prev,
          liveVisitors: Math.max(38, Math.min(48, prev.liveVisitors + delta)),
          updatedAt: new Date().toISOString()
        }));
        setLastTick(new Date());
        return;
      }

      try {
        const stats = await fetchRealtimeStatsApi(siteId, dashboardKey);
        if (isMounted) {
          setData(stats);
          setLastTick(new Date());
        }
      } catch (err) {
        console.error('Realtime fetch failed', err);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [siteId, dashboardKey, isDemo]);

  const getDeviceIcon = (dev: string) => {
    switch (dev.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-3.5 w-3.5 text-sky-400" />;
      case 'tablet': return <Tablet className="h-3.5 w-3.5 text-purple-400" />;
      default: return <Monitor className="h-3.5 w-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Hero Pulse Card */}
      <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950/30 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-2xl bg-emerald-400 opacity-25" />
              <Activity className="h-8 w-8 stroke-[2.5]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Live Active Visitors
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-5xl font-black text-white tracking-tight">
                  {data.liveVisitors}
                </span>
                <span className="text-sm text-neutral-400">
                  {data.liveVisitors === 1 ? 'person currently browsing' : 'people currently browsing'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-neutral-400 font-mono">
            <div>Auto-refreshing every 3s</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              Updated: {new Date(data.updatedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Current Active Pages & Active Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Pages */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <h4 className="font-bold text-white text-sm">Active Pages Right Now</h4>
            </div>
            <span className="text-xs text-neutral-500 font-mono">
              {data.currentPages.length} active URLs
            </span>
          </div>

          <div className="divide-y divide-neutral-800/70 text-xs">
            {data.currentPages.map((page, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                <div className="truncate max-w-xs">
                  <div className="font-mono text-neutral-200 truncate font-medium">{page.path}</div>
                  <div className="text-[10px] text-neutral-500 truncate">{page.title}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                    {page.count} {page.count === 1 ? 'visitor' : 'visitors'}
                  </span>
                </div>
              </div>
            ))}
            {data.currentPages.length === 0 && (
              <div className="py-8 text-center text-neutral-500 text-xs">
                No active pages detected in the past 5 minutes.
              </div>
            )}
          </div>
        </div>

        {/* Active Referrers */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-teal-400" />
              <h4 className="font-bold text-white text-sm">Live Inflow Referrers</h4>
            </div>
            <span className="text-xs text-neutral-500 font-mono">Top origins</span>
          </div>

          <div className="divide-y divide-neutral-800/70 text-xs">
            {data.referrers.map((ref, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                <span className="text-neutral-300 font-medium truncate">{ref.source}</span>
                <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-bold text-teal-400 border border-teal-500/20">
                  {ref.count}
                </span>
              </div>
            ))}
            {data.referrers.length === 0 && (
              <div className="py-8 text-center text-neutral-500 text-xs">
                No live referrers detected. Direct navigation or no active sessions.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Active Countries & Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Countries */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Globe2 className="h-4 w-4 text-sky-400" />
            <h4 className="font-bold text-white text-sm">Active Countries</h4>
          </div>

          <div className="space-y-2.5 text-xs">
            {data.countries.map((c, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-neutral-300 font-medium">{c.country}</span>
                <span className="font-mono text-white font-semibold">{c.count}</span>
              </div>
            ))}
            {data.countries.length === 0 && (
              <div className="py-4 text-center text-neutral-500 text-xs">
                No country data available right now.
              </div>
            )}
          </div>
        </div>

        {/* Active Devices */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="h-4 w-4 text-purple-400" />
            <h4 className="font-bold text-white text-sm">Active Device Breakdown</h4>
          </div>

          <div className="space-y-2.5 text-xs">
            {data.devices.map((d, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2 capitalize">
                  {getDeviceIcon(d.device)}
                  <span className="text-neutral-300 font-medium">{d.device}</span>
                </div>
                <span className="font-mono text-white font-semibold">{d.count}</span>
              </div>
            ))}
            {data.devices.length === 0 && (
              <div className="py-4 text-center text-neutral-500 text-xs">
                No active devices connected.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Realtime Event Stream Terminal */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <h4 className="font-bold text-white text-sm">Live Event Stream</h4>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            {data.recentEvents.length} events logged
          </span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-300 max-h-56 overflow-y-auto space-y-1.5">
          {data.recentEvents.length === 0 ? (
            <div className="text-center py-6 text-neutral-500">
              No recent events logged yet. Visit your site or trigger custom events to watch them stream here live.
            </div>
          ) : (
            data.recentEvents.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between border-b border-neutral-900/80 pb-1">
                <div className="flex items-center gap-2 truncate max-w-lg">
                  <span className="text-neutral-500 text-[10px]">
                    {new Date(ev.time).toLocaleTimeString()}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    ev.type === 'pageview' ? 'bg-sky-950/80 text-sky-400 border border-sky-500/20' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {ev.type.toUpperCase()}
                  </span>
                  <span className="font-semibold text-neutral-200">{ev.name}</span>
                  {ev.detail && <span className="text-neutral-500 text-[10px] truncate">({ev.detail})</span>}
                </div>
                <span className="text-emerald-400 text-[10px] shrink-0 font-semibold">Processed</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
