import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Radio,
  CheckCircle2,
  Code2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { checkSiteTrackingStatusApi, simulateTrafficApi } from '../lib/api';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteDetails: {
    site_id: string;
    tracking_key: string;
    dashboard_key: string;
    name: string;
    domain: string;
  };
  onGoToDashboard: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  siteDetails,
  onGoToDashboard
}) => {
  const [activeFramework, setActiveFramework] = useState<'html' | 'react' | 'nextjs' | 'vite' | 'wordpress'>('html');
  const [copied, setCopied] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const origin = window.location.origin;
  const scriptTag = `<script
  async
  src="${origin}/tracker.js"
  data-site-id="${siteDetails.site_id}"
  data-tracking-key="${siteDetails.tracking_key}">
</script>`;

  // Polling for first event
  useEffect(() => {
    if (!isOpen || !siteDetails.site_id) return;

    let isMounted = true;
    const checkStatus = async () => {
      try {
        setChecking(true);
        const res = await checkSiteTrackingStatusApi(siteDetails.site_id);
        if (res.has_events && isMounted) {
          if (!isActive) {
            setIsActive(true);
            try {
              confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
            } catch {}
          }
        }
      } catch (err) {
        // quiet polling error
      } finally {
        if (isMounted) setChecking(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, siteDetails.site_id, isActive]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTestEvent = async () => {
    setSendingTest(true);
    try {
      // Send real event via client fetch using tracking script payload format
      await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteDetails.site_id,
          tracking_key: siteDetails.tracking_key,
          type: 'pageview',
          payload: {
            url: `https://${siteDetails.domain}/test-verify`,
            path: '/test-verify',
            title: `${siteDetails.name} — Verified Installation`,
            referrer: 'https://insightly.app/install',
            anonymous_id: 'v_install_' + Math.random().toString(36).slice(2, 9),
            session_id: 's_install_' + Math.random().toString(36).slice(2, 9),
            device_type: 'desktop',
            browser: 'Chrome',
            os: 'macOS',
            screen_size: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language || 'en'
          }
        })
      });

      setIsActive(true);
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch {}
    } catch (err) {
      console.error(err);
    } finally {
      setSendingTest(false);
    }
  };

  const getSnippet = () => {
    switch (activeFramework) {
      case 'html':
        return `<!-- Step 2: Paste before </head> -->\n${scriptTag}`;
      case 'react':
        return `// In your public/index.html before </head>:\n${scriptTag}\n\n// Or in App.tsx / layout component:\nuseEffect(() => {\n  const script = document.createElement('script');\n  script.src = '${origin}/tracker.js';\n  script.async = true;\n  script.setAttribute('data-site-id', '${siteDetails.site_id}');\n  script.setAttribute('data-tracking-key', '${siteDetails.tracking_key}');\n  document.head.appendChild(script);\n}, []);`;
      case 'nextjs':
        return `// In app/layout.tsx or pages/_app.tsx:\nimport Script from 'next/script';\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang="en">\n      <head>\n        <Script\n          src="${origin}/tracker.js"\n          data-site-id="${siteDetails.site_id}"\n          data-tracking-key="${siteDetails.tracking_key}"\n          strategy="afterInteractive"\n        />\n      </head>\n      <body>{children}</body>\n    </html>\n  );\n}`;
      case 'vite':
        return `// In your Vite project's index.html before </head>:\n${scriptTag}`;
      case 'wordpress':
        return `// Add to your active theme's functions.php or Header/Footer script plugin:\nadd_action('wp_head', function() {\n  ?>\n  ${scriptTag}\n  <?php\n});`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 shadow-2xl text-neutral-100 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Code2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Install Tracking Script</h3>
            <p className="text-xs text-neutral-400">
              Target: <strong className="text-white">{siteDetails.name}</strong> ({siteDetails.domain})
            </p>
          </div>
        </div>

        {/* 4 Installation Steps */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="font-bold text-emerald-400">Step 1</div>
            <div className="text-neutral-300 mt-0.5">Copy snippet</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="font-bold text-emerald-400">Step 2</div>
            <div className="text-neutral-300 mt-0.5">Add to &lt;head&gt;</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="font-bold text-emerald-400">Step 3</div>
            <div className="text-neutral-300 mt-0.5">Deploy website</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="font-bold text-emerald-400">Step 4</div>
            <div className="text-neutral-300 mt-0.5">Visit site</div>
          </div>
        </div>

        {/* Live Status Radar */}
        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center">
              {isActive ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              ) : (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-amber-500" />
                </>
              )}
            </div>

            <div>
              <div className="text-xs uppercase font-bold text-neutral-400">Tracking Status</div>
              <div className="text-sm font-bold">
                {isActive ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    Tracking is active ✓
                  </span>
                ) : (
                  <span className="text-amber-300 flex items-center gap-1">
                    Waiting for your first event...
                    {checking && <RefreshCw className="h-3 w-3 animate-spin text-neutral-500 inline ml-1" />}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleSendTestEvent}
            disabled={sendingTest}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 transition disabled:opacity-50"
          >
            <Send className="h-3 w-3" />
            <span>{sendingTest ? 'Sending...' : 'Send Test Ping'}</span>
          </button>
        </div>

        {/* Framework Tabs */}
        <div className="mt-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              {(['html', 'react', 'nextjs', 'vite', 'wordpress'] as const).map((fw) => (
                <button
                  key={fw}
                  onClick={() => setActiveFramework(fw)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    activeFramework === fw
                      ? 'bg-neutral-800 text-white font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {fw === 'nextjs' ? 'Next.js' : fw === 'wordpress' ? 'WordPress' : fw.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-emerald-300 overflow-x-auto">
            {getSnippet()}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between pt-2 border-t border-neutral-800/80">
          <span className="text-xs text-neutral-500 font-mono">site_id: {siteDetails.site_id}</span>
          <button
            onClick={onGoToDashboard}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
