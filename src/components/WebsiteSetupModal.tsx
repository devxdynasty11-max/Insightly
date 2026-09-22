import React, { useState } from 'react';
import {
  X,
  Globe,
  Key,
  Copy,
  Check,
  ShieldAlert,
  ArrowRight,
  Code2,
  ExternalLink,
  Lock,
  Sparkles
} from 'lucide-react';
import { createWebsiteApi, setStoredSession } from '../lib/api';

interface WebsiteSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (siteDetails: {
    site_id: string;
    tracking_key: string;
    dashboard_key: string;
    name: string;
    domain: string;
  }) => void;
}

export const WebsiteSetupModal: React.FC<WebsiteSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state after creation
  const [createdSite, setCreatedSite] = useState<{
    site_id: string;
    tracking_key: string;
    dashboard_key: string;
    name: string;
    domain: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !domain.trim()) {
      setError('Please provide both website name and domain');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await createWebsiteApi(name.trim(), domain.trim());
      const details = {
        site_id: res.site_id,
        tracking_key: res.tracking_key,
        dashboard_key: res.dashboard_key,
        name: res.website.name,
        domain: res.website.domain
      };
      setCreatedSite(details);
      // Auto-save session
      setStoredSession({
        site_id: details.site_id,
        dashboard_key: details.dashboard_key,
        name: details.name,
        domain: details.domain,
        tracking_key: details.tracking_key,
        savedAt: new Date().toISOString()
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create website');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const origin = window.location.origin;
  const scriptSnippet = `<script
  async
  src="${origin}/tracker.js"
  data-site-id="${createdSite?.site_id || ''}"
  data-tracking-key="${createdSite?.tracking_key || ''}">
</script>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 shadow-2xl text-neutral-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {!createdSite ? (
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Add New Website</h3>
                <p className="text-xs text-neutral-400">Generate your isolated tracking and dashboard access credentials.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Website Name
                </label>
                <input
                  id="site-setup-name"
                  type="text"
                  placeholder="e.g. ORBIT, AdityaX, LECTURA AI"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Website Domain / URL
                </label>
                <input
                  id="site-setup-domain"
                  type="text"
                  placeholder="e.g. orbit.example or https://myapp.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Protocols like https:// will be normalized automatically.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-3.5 text-xs text-neutral-400 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Lock className="h-3.5 w-3.5" />
                  <span>No Password Architecture</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  INSIGHTLY uses project-based cryptographic keys. You will receive a secret <strong>Dashboard Access Key</strong> to access your analytics without creating an account.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-neutral-700 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition"
                >
                  Cancel
                </button>
                <button
                  id="site-setup-submit"
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 disabled:opacity-50 transition active:scale-95"
                >
                  {loading ? 'Generating Keys...' : 'Create & Generate Keys'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Step 2: Keys and Installation Snippet */
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
              <Sparkles className="h-5 w-5" />
              <span>Website Created Successfully!</span>
            </div>

            {/* Secret Dashboard Key Notice */}
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Save Your Dashboard Key Now</span>
              </div>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                Because INSIGHTLY does not have user accounts or passwords, this <strong>Dashboard Access Key</strong> is the ONLY way to access this website's analytics. We store only its cryptographic hash on the server.
              </p>
            </div>

            {/* Credentials Grid */}
            <div className="space-y-2.5">
              {/* Site ID */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-neutral-500">Website ID (site_id)</div>
                  <div className="font-mono text-xs text-white font-semibold">{createdSite.site_id}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(createdSite.site_id, 'site_id')}
                  className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1 text-[11px] text-neutral-300 hover:text-white"
                >
                  {copiedKey === 'site_id' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey === 'site_id' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Tracking Key */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-neutral-500">Website Tracking Key</div>
                  <div className="font-mono text-xs text-neutral-300">{createdSite.tracking_key}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(createdSite.tracking_key, 'tracking_key')}
                  className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1 text-[11px] text-neutral-300 hover:text-white"
                >
                  {copiedKey === 'tracking_key' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey === 'tracking_key' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Dashboard Access Key */}
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Dashboard Access Key (Secret)</div>
                  <div className="font-mono text-xs text-emerald-300 font-bold">{createdSite.dashboard_key}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(createdSite.dashboard_key, 'dash_key')}
                  className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-neutral-950 hover:bg-emerald-400"
                >
                  {copiedKey === 'dash_key' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey === 'dash_key' ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
            </div>

            {/* Tracking snippet */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-neutral-300">Tracking Installation Code</span>
                <button
                  onClick={() => copyToClipboard(scriptSnippet, 'snippet')}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  {copiedKey === 'snippet' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey === 'snippet' ? 'Snippet Copied!' : 'Copy Script Tag'}</span>
                </button>
              </div>
              <pre className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                {scriptSnippet}
              </pre>
            </div>

            {/* Final Action Buttons */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => {
                  onSuccess(createdSite);
                }}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
              >
                <span>Proceed to Installation & Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
