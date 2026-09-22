import React, { useState } from 'react';
import {
  Settings,
  Shield,
  EyeOff,
  Trash2,
  Copy,
  Check,
  Code2,
  RefreshCw,
  Key,
  Globe,
  AlertTriangle
} from 'lucide-react';
import { clearLocalSession, deleteWebsiteApi } from '../../lib/api';

interface SettingsTabProps {
  site: {
    site_id: string;
    name: string;
    domain: string;
    created_at?: string;
  };
  dashboardKey: string;
  onSiteDeleted: () => void;
  isDemo?: boolean;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  site,
  dashboardKey,
  onSiteDeleted,
  isDemo
}) => {
  const [excludeMyself, setExcludeMyself] = useState(() => {
    return localStorage.getItem('ins_exclude_own_visits') === 'true';
  });
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const origin = window.location.origin;
  const scriptSnippet = `<script
  async
  src="${origin}/tracker.js"
  data-site-id="${site.site_id}">
</script>`;

  const toggleExclude = () => {
    const next = !excludeMyself;
    setExcludeMyself(next);
    localStorage.setItem('ins_exclude_own_visits', String(next));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleting(true);
    try {
      if (!isDemo) {
        await deleteWebsiteApi(site.site_id, dashboardKey);
      }
      clearLocalSession(site.site_id);
      onSiteDeleted();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-xl font-bold text-white">Website & Security Settings</h3>
        <p className="text-xs text-neutral-400 mt-0.5">
          Configuration for {site.name} ({site.domain})
        </p>
      </div>

      {/* Website Details Card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-emerald-400" />
          <h4 className="font-bold text-white text-sm">Site Information</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <span className="text-neutral-500 uppercase font-bold text-[10px]">Website Name</span>
            <div className="text-white font-semibold mt-0.5">{site.name}</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <span className="text-neutral-500 uppercase font-bold text-[10px]">Configured Domain</span>
            <div className="text-white font-semibold font-mono mt-0.5">{site.domain}</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <span className="text-neutral-500 uppercase font-bold text-[10px]">Website ID</span>
            <div className="text-emerald-400 font-semibold font-mono mt-0.5">{site.site_id}</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <span className="text-neutral-500 uppercase font-bold text-[10px]">Registered Date</span>
            <div className="text-neutral-300 font-mono mt-0.5">
              {site.created_at ? new Date(site.created_at).toLocaleDateString() : 'Active'}
            </div>
          </div>
        </div>
      </div>

      {/* Embed Code */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-emerald-400" />
            <h4 className="font-bold text-white text-sm">Tracking Installation Script</h4>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs text-neutral-200 hover:text-white"
          >
            {copiedSnippet ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedSnippet ? 'Copied' : 'Copy Script Tag'}</span>
          </button>
        </div>

        <pre className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-emerald-300 overflow-x-auto">
          {scriptSnippet}
        </pre>
      </div>

      {/* Personal Visit Exclusion */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-xl flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <EyeOff className="h-4 w-4 text-amber-400" />
            <span>Exclude My Own Visits</span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-lg">
            When enabled, tracker calls from this specific browser will be ignored so your own testing does not skew analytics data.
          </p>
        </div>

        <button
          onClick={toggleExclude}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            excludeMyself ? 'bg-emerald-500' : 'bg-neutral-800'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              excludeMyself ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Danger Zone: Delete Website */}
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>Danger Zone</span>
        </div>
        <p className="text-xs text-neutral-300">
          Permanently delete this website and all associated aggregated analytics, sessions, and custom events.
        </p>

        <div className="pt-2">
          {deleteConfirm ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition shadow-md shadow-rose-600/20"
              >
                {deleting ? 'Deleting...' : 'Yes, Permanently Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Website</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
