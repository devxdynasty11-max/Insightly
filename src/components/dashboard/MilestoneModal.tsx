import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Share2,
  Download,
  Copy,
  Check,
  Award,
  Globe,
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteName: string;
  domain: string;
  threshold: number;
  totalVisitors: number;
  dateStr?: string;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  isOpen,
  onClose,
  siteName,
  domain,
  threshold,
  totalVisitors,
  dateStr
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleFireConfetti = () => {
    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } catch {}
  };

  const shareText = `🎉 ${siteName} (${domain}) just crossed ${threshold.toLocaleString()} unique visitors on INSIGHTLY Analytics! 🚀 #analytics #growth`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 shadow-2xl text-neutral-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 p-3 shadow-lg shadow-amber-500/20 text-neutral-950 mb-4">
            <Award className="h-8 w-8 stroke-[2.5]" />
          </div>

          <h3 className="text-2xl font-extrabold text-white">
            🎉 Your website just crossed {threshold.toLocaleString()} visitors!
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Calculated from verified unique visitor records in your database.
          </p>
        </div>

        {/* Shareable Card Canvas Mockup */}
        <div
          id="milestone-card"
          className="mt-6 rounded-2xl border border-neutral-700 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-neutral-950 font-bold text-xs">
                IN
              </div>
              <span className="font-extrabold text-white text-xs tracking-wider">INSIGHTLY VERIFIED MILESTONE</span>
            </div>
            <span className="font-mono text-[10px] text-neutral-500">
              {dateStr || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {/* Card Body */}
          <div className="py-6 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Official Growth Achievement</div>
            <div className="mt-2 text-5xl font-black text-white tracking-tight">
              {threshold.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-400 mt-1 uppercase tracking-widest font-semibold">Unique Visitors</div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/90 px-4 py-1.5 text-xs text-neutral-200">
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-bold text-white">{siteName}</span>
              <span className="text-neutral-500 font-mono text-[11px]">({domain})</span>
            </div>
          </div>

          {/* Card Footer */}
          <div className="border-t border-neutral-800/80 pt-3 flex items-center justify-between text-[10px] text-neutral-500">
            <span>Verified by INSIGHTLY Real-Time Engine</span>
            <span>Zero cookies • 100% real data</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition active:scale-95 shadow-md shadow-emerald-500/20"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied Announcement!' : 'Copy Shareable Text'}</span>
          </button>
          <button
            onClick={handleFireConfetti}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Celebrate Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
