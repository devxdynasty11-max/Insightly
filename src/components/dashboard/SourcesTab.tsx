import React from 'react';
import {
  Globe2,
  Share2,
  Tag,
  ExternalLink,
  PieChart as PieIcon,
  TrendingUp
} from 'lucide-react';
import { TrafficSource, ReferrerStat, CampaignStat } from '../../types';

interface SourcesTabProps {
  sources: TrafficSource[];
  referrers: ReferrerStat[];
  campaigns: CampaignStat[];
}

export const SourcesTab: React.FC<SourcesTabProps> = ({
  sources,
  referrers,
  campaigns
}) => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-white">Traffic Acquisition</h3>
        <p className="text-xs text-neutral-400 mt-0.5">
          Origins, referring websites, and marketing campaigns driving users to your website
        </p>
      </div>

      {/* Main Channels Breakdown Grid */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Globe2 className="h-4 w-4 text-emerald-400" />
          <h4 className="font-bold text-white text-sm">Classified Traffic Channels</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((src, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 transition hover:border-neutral-700"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-200 text-sm">{src.channel}</span>
                <span className="font-mono text-emerald-400 font-bold text-xs">{src.percentage}%</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-white">{src.count.toLocaleString()}</span>
                <span className="text-[10px] text-neutral-500 uppercase font-semibold">Visits</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(100, Math.max(3, src.percentage))}%` }}
                />
              </div>
            </div>
          ))}
          {sources.length === 0 && (
            <div className="col-span-3 py-8 text-center text-neutral-500 text-xs">
              No traffic sources recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* 2 Columns: Referrer Domains & UTM Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referrer Domains */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-teal-400" />
              <h4 className="font-bold text-white text-sm">Top Referring Domains</h4>
            </div>
            <span className="text-xs text-neutral-500 font-mono">External links</span>
          </div>

          <div className="divide-y divide-neutral-800/70 text-xs">
            {referrers.map((ref, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                <span className="font-mono text-neutral-300 font-medium">{ref.domain}</span>
                <span className="font-mono font-semibold text-white">{ref.count.toLocaleString()} visits</span>
              </div>
            ))}
            {referrers.length === 0 && (
              <div className="py-8 text-center text-neutral-500 text-xs">
                No external referrers detected. Most users arrive directly or via unshared headers.
              </div>
            )}
          </div>
        </div>

        {/* UTM Campaigns */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-400" />
              <h4 className="font-bold text-white text-sm">UTM Campaigns</h4>
            </div>
            <span className="text-xs text-neutral-500 font-mono">utm_campaign tag</span>
          </div>

          <div className="divide-y divide-neutral-800/70 text-xs">
            {campaigns.map((cmp, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                <span className="font-mono text-amber-300 font-medium">{cmp.campaign}</span>
                <span className="font-mono font-semibold text-white">{cmp.count.toLocaleString()} clicks</span>
              </div>
            ))}
            {campaigns.length === 0 && (
              <div className="py-8 text-center text-neutral-500 text-xs">
                No UTM campaigns detected yet. Append <code className="text-emerald-400 font-mono">?utm_campaign=launch</code> to your URLs to track campaigns.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
