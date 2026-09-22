import React, { useState } from 'react';
import {
  Users,
  Layers,
  Eye,
  Percent,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Award,
  Globe2,
  TrendingUp,
  FileText
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { DashboardStats } from '../../types';

interface OverviewTabProps {
  stats: DashboardStats;
  onSelectTab: (tab: any) => void;
  onOpenMilestone: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  onSelectTab,
  onOpenMilestone
}) => {
  const [activeMetric, setActiveMetric] = useState<'visitors' | 'sessions' | 'pageviews'>('visitors');
  const { overview, timeseries, topPages, sources, milestones } = stats;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const getMetricColor = () => {
    switch (activeMetric) {
      case 'visitors': return '#10b981';
      case 'sessions': return '#14b8a6';
      case 'pageviews': return '#38bdf8';
    }
  };

  return (
    <div className="space-y-6">
      {/* Milestone Progress or Celebration Banner */}
      {milestones && (
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-950 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-sm">
                  {milestones.latest
                    ? `🎉 Milestone Reached: ${milestones.latest.threshold.toLocaleString()} Visitors!`
                    : `Next Growth Milestone: ${milestones.nextThreshold.toLocaleString()} Visitors`}
                </h4>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  {milestones.progress}% there
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {milestones.totalVisitors.toLocaleString()} verified unique visitors recorded in database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="w-32 hidden md:block">
              <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${milestones.progress}%` }}
                />
              </div>
            </div>
            <button
              onClick={onOpenMilestone}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{milestones.latest ? 'Share Card' : 'Milestone Info'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {/* 1. Visitors */}
        <div
          onClick={() => setActiveMetric('visitors')}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            activeMetric === 'visitors'
              ? 'border-emerald-500 bg-neutral-900 shadow-lg shadow-emerald-500/10'
              : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Visitors</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {overview.visitors.value.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs">
            {overview.visitors.change >= 0 ? (
              <span className="flex items-center text-emerald-400 font-semibold">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +{overview.visitors.change}%
              </span>
            ) : (
              <span className="flex items-center text-rose-400 font-semibold">
                <ArrowDownRight className="h-3.5 w-3.5" />
                {overview.visitors.change}%
              </span>
            )}
            <span className="text-neutral-500 text-[10px]">vs previous</span>
          </div>
        </div>

        {/* 2. Sessions */}
        <div
          onClick={() => setActiveMetric('sessions')}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            activeMetric === 'sessions'
              ? 'border-teal-500 bg-neutral-900 shadow-lg shadow-teal-500/10'
              : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Sessions</span>
            <Layers className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {overview.sessions.value.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs">
            {overview.sessions.change >= 0 ? (
              <span className="flex items-center text-teal-400 font-semibold">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +{overview.sessions.change}%
              </span>
            ) : (
              <span className="flex items-center text-rose-400 font-semibold">
                <ArrowDownRight className="h-3.5 w-3.5" />
                {overview.sessions.change}%
              </span>
            )}
            <span className="text-neutral-500 text-[10px]">vs previous</span>
          </div>
        </div>

        {/* 3. Page Views */}
        <div
          onClick={() => setActiveMetric('pageviews')}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            activeMetric === 'pageviews'
              ? 'border-sky-500 bg-neutral-900 shadow-lg shadow-sky-500/10'
              : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Page Views</span>
            <Eye className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {overview.pageviews.value.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs">
            {overview.pageviews.change >= 0 ? (
              <span className="flex items-center text-sky-400 font-semibold">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +{overview.pageviews.change}%
              </span>
            ) : (
              <span className="flex items-center text-rose-400 font-semibold">
                <ArrowDownRight className="h-3.5 w-3.5" />
                {overview.pageviews.change}%
              </span>
            )}
            <span className="text-neutral-500 text-[10px]">vs previous</span>
          </div>
        </div>

        {/* 4. Bounce Rate */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Bounce Rate</span>
            <Percent className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {overview.bounce_rate.value}%
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs">
            {overview.bounce_rate.change <= 0 ? (
              <span className="flex items-center text-emerald-400 font-semibold">
                <ArrowDownRight className="h-3.5 w-3.5" />
                {overview.bounce_rate.change}%
              </span>
            ) : (
              <span className="flex items-center text-amber-400 font-semibold">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +{overview.bounce_rate.change}%
              </span>
            )}
            <span className="text-neutral-500 text-[10px]">vs previous</span>
          </div>
        </div>

        {/* 5. Avg Session Duration */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Avg Duration</span>
            <Clock className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {formatDuration(overview.avg_duration.value)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs">
            {overview.avg_duration.change >= 0 ? (
              <span className="flex items-center text-emerald-400 font-semibold">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +{overview.avg_duration.change}%
              </span>
            ) : (
              <span className="flex items-center text-rose-400 font-semibold">
                <ArrowDownRight className="h-3.5 w-3.5" />
                {overview.avg_duration.change}%
              </span>
            )}
            <span className="text-neutral-500 text-[10px]">vs previous</span>
          </div>
        </div>
      </div>

      {/* Traffic Graph */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-white text-base">Traffic Volume</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Daily aggregates calculated from real visits in database
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-950 p-1">
            <button
              onClick={() => setActiveMetric('visitors')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                activeMetric === 'visitors'
                  ? 'bg-emerald-500 text-neutral-950'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Visitors
            </button>
            <button
              onClick={() => setActiveMetric('sessions')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                activeMetric === 'sessions'
                  ? 'bg-teal-500 text-neutral-950'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sessions
            </button>
            <button
              onClick={() => setActiveMetric('pageviews')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                activeMetric === 'pageviews'
                  ? 'bg-sky-500 text-neutral-950'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Page Views
            </button>
          </div>
        </div>

        {/* Responsive Area Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeseries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getMetricColor()} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={getMetricColor()} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis
                dataKey="formattedDate"
                stroke="#737373"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#737373"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171717',
                  border: '1px solid #404040',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px'
                }}
                formatter={(val: any) => [val.toLocaleString(), activeMetric.toUpperCase()]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey={activeMetric}
                stroke={getMetricColor()}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#metricFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2-Column Summary Row: Top Pages & Top Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <h4 className="font-bold text-white text-sm">Top Pages</h4>
            </div>
            <button
              onClick={() => onSelectTab('pages')}
              className="text-xs text-emerald-400 hover:underline"
            >
              View all pages →
            </button>
          </div>

          <div className="divide-y divide-neutral-800/70 text-xs">
            {topPages.slice(0, 5).map((page, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                <div className="truncate max-w-[240px]">
                  <div className="font-mono text-neutral-200 truncate">{page.path}</div>
                  <div className="text-[10px] text-neutral-500 truncate">{page.title}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-white">{page.views.toLocaleString()} views</div>
                  <div className="text-[10px] text-neutral-400">{page.uniqueVisitors.toLocaleString()} unique</div>
                </div>
              </div>
            ))}
            {topPages.length === 0 && (
              <div className="py-6 text-center text-neutral-500 text-xs">
                No pageviews recorded yet. Send your first event via the tracker!
              </div>
            )}
          </div>
        </div>

        {/* Top Sources */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-teal-400" />
              <h4 className="font-bold text-white text-sm">Traffic Sources</h4>
            </div>
            <button
              onClick={() => onSelectTab('sources')}
              className="text-xs text-teal-400 hover:underline"
            >
              View all sources →
            </button>
          </div>

          <div className="divide-y divide-neutral-800/70 text-xs">
            {sources.slice(0, 5).map((src, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-200">{src.channel}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-white">{src.count.toLocaleString()}</span>
                  <span className="w-12 text-right font-mono text-emerald-400 font-bold">{src.percentage}%</span>
                </div>
              </div>
            ))}
            {sources.length === 0 && (
              <div className="py-6 text-center text-neutral-500 text-xs">
                No traffic sources classified yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
