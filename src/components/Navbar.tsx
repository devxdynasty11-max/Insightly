import React from 'react';
import { Activity, Plus, ShieldCheck, Terminal, ExternalLink, ArrowRight } from 'lucide-react';

interface NavbarProps {
  onStartTracking: () => void;
  onViewDemo: () => void;
  onOpenAccessModal: () => void;
  onOpenPlayground: () => void;
  currentView: 'landing' | 'dashboard';
  onNavigateLanding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onStartTracking,
  onViewDemo,
  onOpenAccessModal,
  onOpenPlayground,
  currentView,
  onNavigateLanding
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div
          onClick={onNavigateLanding}
          className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-2 shadow-lg shadow-emerald-500/20">
            <Activity className="h-5 w-5 text-neutral-950 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-lg">INSIGHTLY</span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                PROD
              </span>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-400">
          <button
            onClick={onNavigateLanding}
            className="transition hover:text-white"
          >
            Features
          </button>
          <button
            onClick={onOpenPlayground}
            className="flex items-center gap-1.5 transition hover:text-emerald-400 text-neutral-300"
          >
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            Live Test Site
          </button>
          <button
            onClick={onViewDemo}
            className="transition hover:text-white"
          >
            Interactive Demo
          </button>
          <a
            href="#privacy"
            onClick={(e) => {
              if (currentView !== 'landing' && onNavigateLanding) {
                e.preventDefault();
                onNavigateLanding();
                setTimeout(() => {
                  document.getElementById('privacy')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="flex items-center gap-1 transition hover:text-white"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Privacy
          </a>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          <button
            id="nav-btn-access"
            onClick={onOpenAccessModal}
            className="rounded-lg border border-neutral-700/80 bg-neutral-900/80 px-3.5 py-1.5 text-xs font-semibold text-neutral-200 transition hover:border-neutral-600 hover:bg-neutral-800"
          >
            Access Dashboard
          </button>
          <button
            id="nav-btn-start"
            onClick={onStartTracking}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-neutral-950 shadow-sm transition hover:bg-emerald-400 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Start Tracking</span>
          </button>
        </div>
      </div>
    </header>
  );
};
