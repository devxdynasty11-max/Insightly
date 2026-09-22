import React from 'react';
import {
  Globe2,
  Monitor,
  Smartphone,
  Tablet,
  Compass,
  Laptop
} from 'lucide-react';
import { AudienceBreakdown } from '../../types';

interface AudienceTabProps {
  audience: AudienceBreakdown;
}

export const AudienceTab: React.FC<AudienceTabProps> = ({ audience }) => {
  const getDeviceIcon = (dev: string) => {
    switch (dev.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4 text-sky-400" />;
      case 'tablet': return <Tablet className="h-4 w-4 text-purple-400" />;
      default: return <Monitor className="h-4 w-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">Audience Demographics & Technology</h3>
        <p className="text-xs text-neutral-400 mt-0.5">
          Privacy-friendly breakdowns inferred from client parameters without cookie trackers
        </p>
      </div>

      {/* 2x2 Grid: Countries, Devices, Browsers, Operating Systems */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Countries */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Globe2 className="h-4 w-4 text-emerald-400" />
            <h4 className="font-bold text-white text-sm">Top Countries</h4>
          </div>

          <div className="space-y-3 text-xs">
            {audience.countries.map((c, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-200">{c.country}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-400 font-mono">{c.count.toLocaleString()}</span>
                    <span className="font-mono text-emerald-400 font-bold w-10 text-right">{c.percentage}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, Math.max(2, c.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
            {audience.countries.length === 0 && (
              <div className="py-6 text-center text-neutral-500">No country data recorded yet.</div>
            )}
          </div>
        </div>

        {/* 2. Devices */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="h-4 w-4 text-sky-400" />
            <h4 className="font-bold text-white text-sm">Device Categories</h4>
          </div>

          <div className="space-y-3 text-xs">
            {audience.devices.map((d, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 capitalize font-medium text-neutral-200">
                    {getDeviceIcon(d.device)}
                    <span>{d.device}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-400 font-mono">{d.count.toLocaleString()}</span>
                    <span className="font-mono text-sky-400 font-bold w-10 text-right">{d.percentage}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${Math.min(100, Math.max(2, d.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
            {audience.devices.length === 0 && (
              <div className="py-6 text-center text-neutral-500">No device data recorded yet.</div>
            )}
          </div>
        </div>

        {/* 3. Browsers */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="h-4 w-4 text-purple-400" />
            <h4 className="font-bold text-white text-sm">Browsers</h4>
          </div>

          <div className="space-y-3 text-xs">
            {audience.browsers.map((b, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-200">{b.browser}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-400 font-mono">{b.count.toLocaleString()}</span>
                    <span className="font-mono text-purple-400 font-bold w-10 text-right">{b.percentage}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500"
                    style={{ width: `${Math.min(100, Math.max(2, b.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
            {audience.browsers.length === 0 && (
              <div className="py-6 text-center text-neutral-500">No browser data recorded yet.</div>
            )}
          </div>
        </div>

        {/* 4. Operating Systems */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Laptop className="h-4 w-4 text-teal-400" />
            <h4 className="font-bold text-white text-sm">Operating Systems</h4>
          </div>

          <div className="space-y-3 text-xs">
            {audience.os.map((o, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-200">{o.os}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-400 font-mono">{o.count.toLocaleString()}</span>
                    <span className="font-mono text-teal-400 font-bold w-10 text-right">{o.percentage}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-500"
                    style={{ width: `${Math.min(100, Math.max(2, o.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
            {audience.os.length === 0 && (
              <div className="py-6 text-center text-neutral-500">No OS data recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
