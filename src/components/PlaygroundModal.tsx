import React, { useState } from 'react';
import {
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Send,
  MousePointerClick,
  Sparkles,
  Layers,
  ArrowRight,
  Monitor
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  trackingKey: string;
  siteName: string;
  onEventSent?: () => void;
}

export const PlaygroundModal: React.FC<PlaygroundModalProps> = ({
  isOpen,
  onClose,
  siteId,
  trackingKey,
  siteName,
  onEventSent
}) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [logs, setLogs] = useState<Array<{ id: string; time: string; type: string; detail: string; status: number }>>([]);
  const [sending, setSending] = useState(false);
  const [referrer, setReferrer] = useState('https://google.com/search?q=orbit');
  const [customEventName, setCustomEventName] = useState('signup');
  const [currentVid, setCurrentVid] = useState(() => {
    let vid = localStorage.getItem('_ins_test_vid');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('_ins_test_vid', vid);
    }
    return vid;
  });
  const [currentSid, setCurrentSid] = useState(() => {
    let sid = localStorage.getItem('_ins_test_sid');
    if (!sid) {
      sid = 's_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('_ins_test_sid', sid);
    }
    return sid;
  });

  if (!isOpen) return null;

  const handleNewVisitor = () => {
    const newVid = 'v_' + Math.random().toString(36).substring(2, 8);
    const newSid = 's_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('_ins_test_vid', newVid);
    localStorage.setItem('_ins_test_sid', newSid);
    setCurrentVid(newVid);
    setCurrentSid(newSid);
  };

  const handleNewSession = () => {
    const newSid = 's_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('_ins_test_sid', newSid);
    setCurrentSid(newSid);
  };

  const sendTrackerCall = async (type: 'pageview' | 'event', path: string, eventName?: string, metadata?: any) => {
    setSending(true);
    const now = new Date();
    const timeStr = now.toLocaleTimeString();

    const anonId = currentVid;
    const sessId = currentSid;

    const payload = {
      site_id: siteId,
      tracking_key: trackingKey,
      type,
      payload: {
        event_id: 'evt_' + Math.random().toString(36).substring(2, 12),
        url: `https://${siteName.toLowerCase().replace(/\s+/g, '')}.example${path}`,
        path,
        title: `${siteName} — ${path === '/' ? 'Home' : path.replace('/', '')}`,
        referrer,
        anonymous_id: anonId,
        session_id: sessId,
        device_type: 'desktop',
        browser: 'Chrome',
        os: 'macOS',
        screen_size: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language || 'en',
        event_name: eventName,
        metadata: metadata || (eventName ? { triggered_by: 'live_test_browser' } : undefined),
        duration: 12
      }
    };

    try {
      const res = await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => ({}));
      const logEntry = {
        id: Math.random().toString(),
        time: timeStr,
        type: type === 'pageview' ? `PAGEVIEW (${path})` : `EVENT (${eventName})`,
        detail: JSON.stringify(payload.payload.metadata || { title: payload.payload.title }),
        status: res.status
      };

      setLogs(prev => [logEntry, ...prev.slice(0, 19)]);

      if (json.milestone) {
        try {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        } catch {}
      }

      if (onEventSent) {
        onEventSent();
      }
    } catch (err: any) {
      setLogs(prev => [
        {
          id: Math.random().toString(),
          time: timeStr,
          type: 'ERROR',
          detail: err.message || 'Request failed',
          status: 500
        },
        ...prev
      ]);
    } finally {
      setSending(false);
    }
  };

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    sendTrackerCall('pageview', path);
  };

  const triggerEvent = (evName: string, meta?: any) => {
    sendTrackerCall('event', currentPath, evName, meta);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl text-neutral-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Monitor className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Live Interactive Test Website</h3>
              <p className="text-xs text-neutral-400">
                Click links and buttons to fire real tracker.js calls to <code className="text-emerald-400 font-mono">POST /api/collect</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Browser Mockup Window */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="rounded-xl border border-neutral-700 bg-neutral-950 overflow-hidden shadow-xl">
            {/* Browser Address Bar */}
            <div className="flex items-center gap-3 border-b border-neutral-800 bg-neutral-900/90 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
              </div>

              {/* URL address pill */}
              <div className="flex flex-1 items-center rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1 font-mono text-xs text-emerald-300">
                <span className="text-neutral-500">https://</span>
                <span className="text-neutral-300">{siteName.toLowerCase().replace(/\s+/g, '')}.example</span>
                <span className="text-white font-bold">{currentPath}</span>
              </div>

              {/* Referrer Selector */}
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-400">
                <span>Referrer:</span>
                <select
                  value={referrer}
                  onChange={(e) => setReferrer(e.target.value)}
                  className="rounded border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-neutral-200 text-xs focus:outline-none"
                >
                  <option value="https://google.com/search?q=orbit">Google</option>
                  <option value="https://t.co/launch_thread">X / Twitter</option>
                  <option value="https://news.ycombinator.com/item?id=1">Hacker News</option>
                  <option value="https://linkedin.com/feed">LinkedIn</option>
                  <option value="">Direct (No referrer)</option>
                </select>
              </div>
            </div>

            {/* Browser In-Page Content */}
            <div className="p-6 bg-neutral-900/40 text-center space-y-6">
              {/* Virtual Website Navigation */}
              <div className="flex justify-center items-center gap-3 border-b border-neutral-800 pb-4">
                <button
                  onClick={() => navigateTo('/')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    currentPath === '/' ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  Home (/)
                </button>
                <button
                  onClick={() => navigateTo('/pricing')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    currentPath === '/pricing' ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  Pricing (/pricing)
                </button>
                <button
                  onClick={() => navigateTo('/features')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    currentPath === '/features' ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  Features (/features)
                </button>
                <button
                  onClick={() => navigateTo('/docs')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    currentPath === '/docs' ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  Docs (/docs)
                </button>
              </div>

              {/* Identity & Session Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-neutral-950/80 px-3 py-2 text-xs border border-neutral-800">
                <div className="flex items-center gap-3 text-neutral-400 font-mono text-[11px]">
                  <span>Visitor: <strong className="text-emerald-400">{currentVid}</strong></span>
                  <span>Session: <strong className="text-teal-400">{currentSid}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleNewSession}
                    title="Simulate 30 min passing or a new visit session"
                    className="rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1 text-[11px] font-semibold transition"
                  >
                    + New Session
                  </button>
                  <button
                    onClick={handleNewVisitor}
                    title="Simulate a completely new visitor"
                    className="rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold transition"
                  >
                    + New Visitor
                  </button>
                </div>
              </div>

              {/* Page Body */}
              <div className="py-4">
                <h4 className="text-xl font-bold text-white">
                  Welcome to {siteName} {currentPath !== '/' && `• ${currentPath.replace('/', '').toUpperCase()}`}
                </h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                  This virtual page is tracked with your site's credentials:
                  <br />
                  <span className="font-mono text-emerald-400 font-semibold">{siteId}</span>
                </p>

                {/* Interactive Custom Event Buttons */}
                <div className="mt-6 flex flex-wrap justify-center items-center gap-3">
                  <button
                    onClick={() => triggerEvent('signup', { source: 'hero_cta', tier: 'free' })}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition active:scale-95 shadow-md shadow-emerald-500/20"
                  >
                    <MousePointerClick className="h-3.5 w-3.5" />
                    <span>Trigger insightly.track("signup")</span>
                  </button>
                  <button
                    onClick={() => triggerEvent('button_click', { button: 'start_tracking', page: currentPath })}
                    className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition active:scale-95"
                  >
                    <span>Trigger insightly.track("button_click")</span>
                  </button>
                  <button
                    onClick={() => triggerEvent('upgrade_plan', { plan: 'enterprise', amount: 99 })}
                    className="flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-950/40 px-4 py-2 text-xs font-semibold text-teal-300 hover:bg-teal-900/50 transition active:scale-95"
                  >
                    <span>Trigger insightly.track("upgrade_plan")</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live Transmission Wire Log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Live HTTP Network Ingestion Log
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">POST /api/collect • 200 OK</span>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 font-mono text-[11px] text-neutral-300 max-h-36 overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <div className="text-neutral-500 text-center py-4">
                  Click any navigation link or trigger button above to observe network calls.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between border-b border-neutral-900/80 pb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">[{log.time}]</span>
                      <span className="text-emerald-400 font-semibold">{log.type}</span>
                      <span className="text-neutral-400 text-[10px] truncate max-w-xs">{log.detail}</span>
                    </div>
                    <span className="rounded bg-emerald-950/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                      HTTP {log.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-800 px-6 py-3 bg-neutral-950/60 text-xs text-neutral-400">
          <span>Real data flows straight into your INSIGHTLY dashboard.</span>
          <button
            onClick={onClose}
            className="rounded-xl bg-neutral-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700 transition"
          >
            Done Testing
          </button>
        </div>
      </div>
    </div>
  );
};
