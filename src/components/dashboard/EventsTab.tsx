import React, { useState } from 'react';
import {
  MousePointerClick,
  Copy,
  Check,
  Code2,
  Sparkles,
  ArrowUpRight,
  Send
} from 'lucide-react';
import { EventStat } from '../../types';

interface EventsTabProps {
  events: EventStat[];
  onOpenPlayground: () => void;
}

export const EventsTab: React.FC<EventsTabProps> = ({ events, onOpenPlayground }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (snippet: string, label: string) => {
    navigator.clipboard.writeText(snippet);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const sampleSnippet = `// 1. Basic event trigger:
insightly.track("signup");

// 2. Custom event with metadata:
insightly.track("button_click", {
  button: "buy_now",
  plan: "annual",
  currency: "USD"
});`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Custom Event Tracking & Conversions</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Monitor interaction goals, conversion rates, and custom client-side events
          </p>
        </div>

        <button
          onClick={onOpenPlayground}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 transition"
        >
          <MousePointerClick className="h-3.5 w-3.5" />
          <span>Test in Live Browser</span>
        </button>
      </div>

      {/* Events Data Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/80 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-neutral-800 bg-neutral-950/60 font-semibold uppercase tracking-wider text-neutral-400">
            <tr>
              <th className="py-3.5 px-5">Event Name</th>
              <th className="py-3.5 px-4 text-right">Total Triggers</th>
              <th className="py-3.5 px-4 text-right">Unique Visitors</th>
              <th className="py-3.5 px-5 text-right">Conversion Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
            {events.map((ev, idx) => (
              <tr key={idx} className="hover:bg-neutral-800/40 transition">
                <td className="py-3.5 px-5">
                  <div className="inline-flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="font-mono font-bold text-white">{ev.event_name}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-right font-semibold text-white">
                  {ev.count.toLocaleString()}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-neutral-400">
                  {ev.unique_visitors.toLocaleString()}
                </td>
                <td className="py-3.5 px-5 text-right font-mono font-bold text-emerald-400">
                  {ev.conversion_rate}%
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-neutral-500">
                  No custom events recorded yet. Follow the code snippet below to start tracking.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* How to track guide */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-emerald-400" />
            <h4 className="font-bold text-white text-sm">How to fire custom events</h4>
          </div>
          <button
            onClick={() => copyCode(sampleSnippet, 'code')}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:underline"
          >
            {copied === 'code' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span>{copied === 'code' ? 'Copied' : 'Copy JS Snippet'}</span>
          </button>
        </div>

        <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
          The INSIGHTLY tracker automatically defines the global <code className="text-emerald-300 font-mono">window.insightly.track(name, metadata)</code> helper. You can call it from any button click, React handler, or form submission:
        </p>

        <pre className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-emerald-300 overflow-x-auto">
          {sampleSnippet}
        </pre>
      </div>
    </div>
  );
};
