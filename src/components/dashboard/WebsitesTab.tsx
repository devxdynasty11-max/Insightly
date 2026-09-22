import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  ArrowRight,
  ExternalLink,
  Code2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { getSavedSites, removeSavedSite, checkSiteTrackingStatusApi } from '../../lib/api';

interface WebsitesTabProps {
  currentSiteId: string;
  onSwitchSite: (siteId: string, dashboardKey: string) => void;
  onOpenNewSiteModal: () => void;
  onOpenInstallModal: (site: any) => void;
  isDemo?: boolean;
}

export const WebsitesTab: React.FC<WebsitesTabProps> = ({
  currentSiteId,
  onSwitchSite,
  onOpenNewSiteModal,
  onOpenInstallModal,
  isDemo
}) => {
  const [sites, setSites] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Default suggested websites if user hasn't added others yet
  const defaultList = [
    {
      site_id: 'site_orbit_prod',
      name: 'ORBIT',
      domain: 'orbit.example',
      dashboard_key: 'dash_orbit_sample_key'
    },
    {
      site_id: 'site_adityax_prod',
      name: 'AdityaX',
      domain: 'adityax.example',
      dashboard_key: 'dash_adityax_sample_key'
    },
    {
      site_id: 'site_lectura_prod',
      name: 'LECTURA AI',
      domain: 'lectura.example',
      dashboard_key: 'dash_lectura_sample_key'
    }
  ];

  useEffect(() => {
    const saved = getSavedSites();
    if (saved.length > 0) {
      setSites(saved);
      // Fetch statuses
      saved.forEach(async (s) => {
        try {
          const res = await checkSiteTrackingStatusApi(s.site_id);
          setStatuses(prev => ({ ...prev, [s.site_id]: res.has_events }));
        } catch {}
      });
    } else {
      setSites(defaultList);
    }
  }, [currentSiteId]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRemove = (e: React.MouseEvent, siteId: string) => {
    e.stopPropagation();
    removeSavedSite(siteId);
    setSites(getSavedSites());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Managed Websites</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Switch projects or register additional websites under isolated cryptographic keys
          </p>
        </div>

        <button
          onClick={onOpenNewSiteModal}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition active:scale-95 shadow-md shadow-emerald-500/20"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Add Website</span>
        </button>
      </div>

      {/* Website Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites.map((site) => {
          const isCurrent = site.site_id === currentSiteId;
          const hasEvents = statuses[site.site_id];

          return (
            <div
              key={site.site_id}
              className={`rounded-2xl border p-5 transition flex flex-col justify-between ${
                isCurrent
                  ? 'border-emerald-500 bg-neutral-900 shadow-xl shadow-emerald-500/10'
                  : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{site.name}</h4>
                      <div className="text-xs text-neutral-400 font-mono">{site.domain}</div>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center gap-1.5">
                    {hasEvents || isCurrent ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
                        No Data
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-2 flex items-center justify-between font-mono">
                    <span className="text-[10px] text-neutral-500">site_id:</span>
                    <span className="text-neutral-200 font-semibold">{site.site_id}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenInstallModal(site)}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>Tracking Code</span>
                </button>

                <div className="flex items-center gap-2">
                  {isCurrent ? (
                    <span className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                      Current Site
                    </span>
                  ) : (
                    <button
                      onClick={() => onSwitchSite(site.site_id, site.dashboard_key)}
                      className="flex items-center gap-1 rounded-lg bg-neutral-800 px-3 py-1 text-xs font-semibold text-white hover:bg-neutral-700 transition"
                    >
                      <span>Switch</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
