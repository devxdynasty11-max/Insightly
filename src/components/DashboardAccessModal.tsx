import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Globe,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Lock,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import {
  verifyDashboardKeyApi,
  setStoredSession,
  getSavedSites,
  removeSavedSite
} from '../lib/api';

interface DashboardAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: {
    site_id: string;
    dashboard_key: string;
    name: string;
    domain: string;
  }) => void;
  onLaunchDemo: () => void;
}

export const DashboardAccessModal: React.FC<DashboardAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onLaunchDemo
}) => {
  const [siteId, setSiteId] = useState('');
  const [dashboardKey, setDashboardKey] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSites, setSavedSites] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSavedSites(getSavedSites());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId.trim() || !dashboardKey.trim()) {
      setError('Please provide both Website ID and Dashboard Access Key');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await verifyDashboardKeyApi(siteId.trim(), dashboardKey.trim());
      const session = {
        site_id: res.website.site_id,
        dashboard_key: dashboardKey.trim(),
        name: res.website.name,
        domain: res.website.domain,
        savedAt: new Date().toISOString()
      };

      if (remember) {
        setStoredSession(session);
      }

      onSuccess(session);
    } catch (err: any) {
      setError(err.message || 'Invalid website ID or dashboard access key');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (saved: any) => {
    setSiteId(saved.site_id);
    setDashboardKey(saved.dashboard_key);
  };

  const handleRemoveSaved = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeSavedSite(id);
    setSavedSites(getSavedSites());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 shadow-2xl text-neutral-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Access Dashboard</h3>
            <p className="text-xs text-neutral-400">Enter your project credentials to view analytics.</p>
          </div>
        </div>

        {/* Previously Saved Sites on this device */}
        {savedSites.length > 0 && (
          <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Saved Websites on this Device
            </div>
            <div className="space-y-1.5">
              {savedSites.map((site) => (
                <div
                  key={site.site_id}
                  onClick={() => handleQuickSelect(site)}
                  className="flex items-center justify-between rounded-lg p-2 text-xs bg-neutral-900 hover:bg-neutral-800/80 cursor-pointer transition border border-neutral-800"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-semibold text-white">{site.name}</span>
                    <span className="font-mono text-neutral-400 text-[10px]">({site.site_id})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleRemoveSaved(e, site.site_id)}
                      title="Forget this website"
                      className="text-neutral-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Website ID (site_id)
            </label>
            <input
              id="dash-access-site-id"
              type="text"
              placeholder="e.g. site_8x29abc"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              required
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 font-mono text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Dashboard Access Key
            </label>
            <input
              id="dash-access-key"
              type="password"
              placeholder="dash_xxxxxxxxxxxxxxxx"
              value={dashboardKey}
              onChange={(e) => setDashboardKey(e.target.value)}
              required
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 font-mono text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-neutral-400 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-950 text-emerald-500 focus:ring-0"
              />
              <span>Remember active session on this device</span>
            </label>

            <button
              type="button"
              onClick={() => {
                onClose();
                onLaunchDemo();
              }}
              className="text-emerald-400 hover:underline text-xs flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              <span>Or try Demo Mode</span>
            </button>
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-700 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              id="dash-access-submit"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 disabled:opacity-50 transition active:scale-95 shadow-md shadow-emerald-500/20"
            >
              {loading ? 'Authenticating...' : 'Open Analytics Dashboard'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
