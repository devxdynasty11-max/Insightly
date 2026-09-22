import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Activity,
  FileText,
  Globe2,
  Users,
  MousePointerClick,
  Layers,
  Settings,
  Calendar,
  RefreshCw,
  LogOut,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Code2,
  Terminal,
  ShieldCheck,
  Plus
} from 'lucide-react';
import {
  fetchDashboardStatsApi,
  clearLocalSession,
  getSavedSites
} from '../../lib/api';
import { DashboardStats, DateRange } from '../../types';
import { DEMO_DASHBOARD_STATS, DEMO_WEBSITE } from '../../lib/demoData';
import { OverviewTab } from './OverviewTab';
import { RealtimeTab } from './RealtimeTab';
import { PagesTab } from './PagesTab';
import { SourcesTab } from './SourcesTab';
import { AudienceTab } from './AudienceTab';
import { EventsTab } from './EventsTab';
import { WebsitesTab } from './WebsitesTab';
import { SettingsTab } from './SettingsTab';
import { MilestoneModal } from './MilestoneModal';

interface DashboardProps {
  siteId: string;
  dashboardKey: string;
  siteName: string;
  domain: string;
  isDemo?: boolean;
  onExit: () => void;
  onOpenNewSiteModal: () => void;
  onOpenInstallModal: (site: any) => void;
  onOpenPlayground: () => void;
  onSwitchSite: (siteId: string, dashboardKey: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  siteId,
  dashboardKey,
  siteName,
  domain,
  isDemo = false,
  onExit,
  onOpenNewSiteModal,
  onOpenInstallModal,
  onOpenPlayground,
  onSwitchSite
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'realtime' | 'pages' | 'sources' | 'audience' | 'events' | 'websites' | 'settings'
  >('overview');

  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [stats, setStats] = useState<DashboardStats | null>(isDemo ? DEMO_DASHBOARD_STATS : null);
  const [loading, setLoading] = useState(!isDemo);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMilestoneOpen, setIsMilestoneOpen] = useState(false);
  const [savedSites, setSavedSites] = useState<any[]>([]);
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);

  useEffect(() => {
    setSavedSites(getSavedSites());
  }, [siteId]);

  const loadStats = async (isManualRefresh = false) => {
    if (isDemo) {
      setStats(DEMO_DASHBOARD_STATS);
      return;
    }

    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);
    try {
      const data = await fetchDashboardStatsApi(siteId, dashboardKey, dateRange);
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [siteId, dashboardKey, dateRange, isDemo]);

  const handleForgetSite = () => {
    clearLocalSession(siteId);
    onExit();
  };

  const navItems: Array<{
    id: 'overview' | 'realtime' | 'pages' | 'sources' | 'audience' | 'events' | 'websites' | 'settings';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'realtime', label: 'Realtime', icon: Activity, badge: 'Live' },
    { id: 'pages', label: 'Pages', icon: FileText },
    { id: 'sources', label: 'Sources', icon: Globe2 },
    { id: 'audience', label: 'Audience', icon: Users },
    { id: 'events', label: 'Events', icon: MousePointerClick },
    { id: 'websites', label: 'Websites', icon: Layers },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-r border-neutral-800/80 bg-neutral-950 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-800/80">
            <div
              onClick={onExit}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-1.5 shadow-md shadow-emerald-500/20">
                <Activity className="h-5 w-5 text-neutral-950 stroke-[2.5]" />
              </div>
              <span className="font-extrabold tracking-tight text-white text-lg">INSIGHTLY</span>
            </div>
            {isDemo && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                Demo
              </span>
            )}
          </div>

          {/* Website Quick Switcher in Sidebar */}
          <div className="p-4">
            <div className="relative">
              <button
                onClick={() => setIsSiteDropdownOpen(!isSiteDropdownOpen)}
                className="w-full flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/90 p-2.5 text-left text-xs transition hover:border-neutral-700"
              >
                <div className="truncate">
                  <div className="font-bold text-white truncate">{siteName}</div>
                  <div className="text-[10px] text-neutral-400 font-mono truncate">{domain}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0 ml-1" />
              </button>

              {isSiteDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-full rounded-xl border border-neutral-700 bg-neutral-900 p-1 shadow-2xl z-50 text-xs">
                  <div className="p-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Switch Project
                  </div>
                  {savedSites.map((s) => (
                    <button
                      key={s.site_id}
                      onClick={() => {
                        setIsSiteDropdownOpen(false);
                        onSwitchSite(s.site_id, s.dashboard_key);
                      }}
                      className="w-full flex items-center justify-between rounded-lg p-2 text-left hover:bg-neutral-800 text-neutral-200"
                    >
                      <span className="font-medium truncate">{s.name}</span>
                      {s.site_id === siteId && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-neutral-800 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setIsSiteDropdownOpen(false);
                        onOpenNewSiteModal();
                      }}
                      className="w-full flex items-center gap-1.5 rounded-lg p-2 text-left font-semibold text-emerald-400 hover:bg-neutral-800"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Website...</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.2 text-[10px] font-bold text-emerald-400">
                      <span className="h-1 w-1 rounded-full bg-emerald-400 animate-ping" />
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-neutral-800/80 space-y-2 text-xs">
          <button
            onClick={onOpenPlayground}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 py-2 font-medium text-emerald-300 hover:bg-emerald-900/40 transition"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Live Test Simulator</span>
          </button>

          <button
            onClick={handleForgetSite}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-neutral-800 py-2 text-neutral-400 hover:bg-neutral-900 hover:text-rose-300 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Forget this website</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar with Range selector & Refresh */}
        <header className="h-16 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white capitalize">{activeTab}</h2>
            {isDemo && (
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
                Demo Data Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Selector (for non-realtime tabs) */}
            {activeTab !== 'realtime' && (
              <div className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-1 text-xs">
                {(['today', 'yesterday', '7d', '30d', '90d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                      dateRange === range
                        ? 'bg-emerald-500 text-neutral-950'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {range === 'today' ? 'Today' : range === 'yesterday' ? 'Yesterday' : range.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {/* Manual Refresh Button */}
            <button
              onClick={() => loadStats(true)}
              disabled={refreshing}
              title="Refresh data"
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Tracking Code button */}
            <button
              onClick={() => onOpenInstallModal({ site_id: siteId, name: siteName, domain, dashboard_key: dashboardKey })}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition"
            >
              <Code2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Tracking Code</span>
            </button>
          </div>
        </header>

        {/* Tab Body */}
        <div className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          {/* Demo Mode Notice Banner */}
          {isDemo && (
            <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Demo Mode Active:</strong> All displayed numbers are marked as <strong>Demo Data</strong> and will never be mixed with production analytics.
                </span>
              </div>
              <button
                onClick={onOpenNewSiteModal}
                className="shrink-0 rounded-lg bg-amber-400 px-3 py-1 text-xs font-bold text-neutral-950 hover:bg-amber-300 transition"
              >
                Track Your Real Website
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center text-neutral-500 gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
              <div className="text-xs font-medium">Aggregating visitor records from database...</div>
            </div>
          ) : stats ? (
            <>
              {activeTab === 'overview' && (
                <OverviewTab
                  stats={stats}
                  onSelectTab={(tab) => setActiveTab(tab)}
                  onOpenMilestone={() => setIsMilestoneOpen(true)}
                />
              )}

              {activeTab === 'realtime' && (
                <RealtimeTab
                  siteId={siteId}
                  dashboardKey={dashboardKey}
                  isDemo={isDemo}
                />
              )}

              {activeTab === 'pages' && (
                <PagesTab pages={stats.topPages} />
              )}

              {activeTab === 'sources' && (
                <SourcesTab
                  sources={stats.sources}
                  referrers={stats.referrers}
                  campaigns={stats.campaigns}
                />
              )}

              {activeTab === 'audience' && (
                <AudienceTab audience={stats.audience} />
              )}

              {activeTab === 'events' && (
                <EventsTab
                  events={stats.events}
                  onOpenPlayground={onOpenPlayground}
                />
              )}

              {activeTab === 'websites' && (
                <WebsitesTab
                  currentSiteId={siteId}
                  onSwitchSite={onSwitchSite}
                  onOpenNewSiteModal={onOpenNewSiteModal}
                  onOpenInstallModal={onOpenInstallModal}
                  isDemo={isDemo}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsTab
                  site={stats.website}
                  dashboardKey={dashboardKey}
                  onSiteDeleted={onExit}
                  isDemo={isDemo}
                />
              )}
            </>
          ) : null}
        </div>
      </main>

      {/* Milestone Modal */}
      {stats?.milestones && (
        <MilestoneModal
          isOpen={isMilestoneOpen}
          onClose={() => setIsMilestoneOpen(false)}
          siteName={siteName}
          domain={domain}
          threshold={stats.milestones.latest?.threshold || stats.milestones.nextThreshold}
          totalVisitors={stats.milestones.totalVisitors}
        />
      )}
    </div>
  );
};
