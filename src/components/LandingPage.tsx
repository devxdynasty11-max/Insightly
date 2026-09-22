import React from 'react';
import {
  Activity,
  ArrowRight,
  Shield,
  Zap,
  Globe2,
  PieChart,
  MousePointerClick,
  Sparkles,
  Layers,
  Code2,
  CheckCircle2,
  Lock,
  EyeOff,
  Cpu,
  TrendingUp,
  BarChart3,
  Flame,
  Check,
  Play
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onStartTracking: () => void;
  onViewDemo: () => void;
  onOpenPlayground: () => void;
  onOpenAccessModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartTracking,
  onViewDemo,
  onOpenPlayground,
  onOpenAccessModal
}) => {
  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute top-[600px] right-0 h-[400px] w-[600px] rounded-full bg-teal-500/5 blur-[160px]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>No Cookies • No Passwords • Real-Time Engine</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl"
          >
            Know who's visiting.
            <br />
            <span className="text-neutral-400">Understand why they're coming.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-neutral-400 sm:text-xl leading-relaxed"
          >
            Simple, privacy-conscious website analytics built for modern creators, developers and businesses.
            Zero cookies, ultra-lightweight, and real-time.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              id="hero-btn-start"
              onClick={onStartTracking}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-neutral-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 active:scale-98"
            >
              <span>Start Tracking</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              id="hero-btn-demo"
              onClick={onViewDemo}
              className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/90 px-6 py-3.5 text-sm font-semibold text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800"
            >
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <span>View Demo</span>
            </button>
            <button
              id="hero-btn-test-site"
              onClick={onOpenPlayground}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-5 py-3.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-900/40"
            >
              <Play className="h-4 w-4 fill-emerald-400" />
              <span>Live Test Website</span>
            </button>
          </motion.div>

          {/* Key Metric Highlights Bar */}
          <div className="mt-14 grid grid-cols-2 gap-4 border-y border-neutral-800/80 py-6 sm:grid-cols-4 text-left">
            <div>
              <div className="text-2xl font-bold text-white">&lt; 3.8 KB</div>
              <div className="text-xs text-neutral-400 mt-0.5">Vanilla script payload</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">&lt; 15 ms</div>
              <div className="text-xs text-neutral-400 mt-0.5">Ingestion API latency</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">100% GDPR</div>
              <div className="text-xs text-neutral-400 mt-0.5">Zero cookie banners needed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-teal-400">Project-Key</div>
              <div className="text-xs text-neutral-400 mt-0.5">Zero user accounts or passwords</div>
            </div>
          </div>
        </div>

        {/* Hero Interactive Dashboard Preview Mockup */}
        <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/90 shadow-2xl shadow-emerald-950/20">
            {/* Window header */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3 bg-neutral-950/60">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 font-mono text-xs text-neutral-500">insightly.app/dashboard • ORBIT (Live Demo)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-semibold text-emerald-400">42 live visitors right now</span>
              </div>
            </div>

            {/* Dashboard Mock Content */}
            <div className="p-6 space-y-6">
              {/* Metric Cards Row */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <div className="text-xs font-medium text-neutral-400">Unique Visitors</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white">14,280</span>
                    <span className="text-xs font-semibold text-emerald-400">+18.4%</span>
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <div className="text-xs font-medium text-neutral-400">Sessions</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white">18,940</span>
                    <span className="text-xs font-semibold text-emerald-400">+12.1%</span>
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <div className="text-xs font-medium text-neutral-400">Page Views</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white">46,210</span>
                    <span className="text-xs font-semibold text-emerald-400">+24.6%</span>
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <div className="text-xs font-medium text-neutral-400">Bounce Rate</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white">34.2%</span>
                    <span className="text-xs font-semibold text-emerald-400">-4.8%</span>
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 col-span-2 lg:col-span-1">
                  <div className="text-xs font-medium text-neutral-400">Avg Duration</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white">2m 28s</span>
                    <span className="text-xs font-semibold text-emerald-400">+9.3%</span>
                  </div>
                </div>
              </div>

              {/* Chart Mockup Graphic */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Traffic Volume Over Time</h4>
                    <p className="text-xs text-neutral-500">Real database aggregations across past 7 days</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" /> Visitors
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-teal-300">
                      <span className="h-2 w-2 rounded-full bg-teal-400" /> Pageviews
                    </span>
                  </div>
                </div>

                {/* Styled SVG Chart line */}
                <div className="h-44 w-full relative flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 700 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="0" y1="40" x2="700" y2="40" stroke="#262626" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="700" y2="80" stroke="#262626" strokeDasharray="3 3" />
                    <line x1="0" y1="120" x2="700" y2="120" stroke="#262626" strokeDasharray="3 3" />
                    {/* Area fill */}
                    <path
                      d="M0,120 Q100,105 200,85 T400,60 T600,30 T700,20 L700,160 L0,160 Z"
                      fill="url(#heroGradient)"
                    />
                    {/* Smooth curve */}
                    <path
                      d="M0,120 Q100,105 200,85 T400,60 T600,30 T700,20"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
              </div>

              {/* Bottom Quick Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-3">Top Pages</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                      <span className="font-mono text-neutral-300">/</span>
                      <span className="font-semibold text-white">18,450 views</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                      <span className="font-mono text-neutral-300">/pricing</span>
                      <span className="font-semibold text-white">9,230 views</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="font-mono text-neutral-300">/blog/how-we-scaled</span>
                      <span className="font-semibold text-white">6,840 views</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-3">Traffic Channels</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                      <span className="text-neutral-300">Google Organic</span>
                      <span className="font-semibold text-emerald-400">40%</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                      <span className="text-neutral-300">Direct Navigation</span>
                      <span className="font-semibold text-emerald-400">27%</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-neutral-300">X / Twitter</span>
                      <span className="font-semibold text-emerald-400">13%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Sections */}
      <section className="border-t border-neutral-800/80 bg-neutral-950/80 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Built for Precision</h2>
            <h3 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              Everything you need to grow your website.
            </h3>
            <p className="mt-4 text-neutral-400">
              No bloated tag managers. No complex 40-step setup wizards. No data selling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Real-time */}
            <div className="rounded-2xl border border-neutral-800/90 bg-neutral-900/50 p-6 transition hover:border-neutral-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
                <Activity className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Real-Time Analytics</h4>
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                Watch visitors browse your pages live. See active countries, devices, and live incoming referrers
                updated every few seconds.
              </p>
            </div>

            {/* 2. Traffic Sources */}
            <div className="rounded-2xl border border-neutral-800/90 bg-neutral-900/50 p-6 transition hover:border-neutral-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 mb-4">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Traffic Sources & UTM</h4>
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                Automatic channel classification for Google, Bing, Instagram, YouTube, Facebook, LinkedIn, X/Twitter, and
                deep UTM campaign tracking.
              </p>
            </div>

            {/* 3. Audience Insights */}
            <div className="rounded-2xl border border-neutral-800/90 bg-neutral-900/50 p-6 transition hover:border-neutral-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 mb-4">
                <Globe2 className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Audience Insights</h4>
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                Understand user devices (Desktop, Mobile, Tablet), operating systems, and browsers without invasive
                fingerprinting or intrusive tracking.
              </p>
            </div>

            {/* 4. Page Analytics */}
            <div className="rounded-2xl border border-neutral-800/90 bg-neutral-900/50 p-6 transition hover:border-neutral-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-4">
                <PieChart className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Page Analytics & Time</h4>
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                Discover your highest converting content, average time on page, and accurate bounce rates computed from
                real visitor behavior.
              </p>
            </div>

            {/* 5. Custom Events */}
            <div className="rounded-2xl border border-neutral-800/90 bg-neutral-900/50 p-6 transition hover:border-neutral-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
                <MousePointerClick className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Custom Event Tracking</h4>
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                One-liner event tracking: <code className="text-xs text-emerald-300 font-mono">insightly.track("signup")</code>. Measure conversions, clicks, and custom metadata easily.
              </p>
            </div>

            {/* 6. Privacy Conscious */}
            <div id="privacy" className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 transition hover:border-emerald-500/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 mb-4">
                <Shield className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Privacy-Conscious by Default</h4>
              <p className="mt-2 text-sm text-neutral-300 leading-relaxed">
                Zero cookies. Never store raw IP addresses. No sensitive form fields, keystrokes, or personal identifiers.
                Fully compliant with GDPR, CCPA, and PECR.
              </p>
            </div>

            {/* 7. Lightweight Tracker */}
            <div className="rounded-2xl border border-neutral-800/90 bg-neutral-900/50 p-6 transition hover:border-neutral-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-4">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Sub-4KB Lightweight Tracker</h4>
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                Over 45x lighter than Google Analytics 4. Uses asynchronous loading and <code className="text-xs text-neutral-300 font-mono">sendBeacon</code> for 100/100 Lighthouse performance.
              </p>
            </div>

            {/* 8. Multiple Websites */}
            <div className="rounded-2xl border border-neutral-800/90 bg-neutral-900/50 p-6 transition hover:border-neutral-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Multiple Website Support</h4>
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                Manage all your projects (e.g. ORBIT, AdityaX, LECTURA AI) in one dashboard. Each site gets isolated
                cryptographic keys.
              </p>
            </div>

            {/* 9. Milestone System */}
            <div className="rounded-2xl border border-neutral-800/90 bg-neutral-900/50 p-6 transition hover:border-neutral-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Real Visitor Milestones</h4>
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                Celebrate authentic growth when your site crosses 100, 1,000, 10,000, or 100,000 unique visitors with
                shareable achievement cards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section (vs GA4) */}
      <section className="border-t border-neutral-800/80 py-20 bg-neutral-900/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white sm:text-3xl">Why creators switch from Google Analytics</h3>
            <p className="text-neutral-400 mt-2 text-sm">Clear numbers without the corporate tracking bloat.</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-800 bg-neutral-900/60 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="py-4 px-6">Feature</th>
                  <th className="py-4 px-6 text-emerald-400 font-bold">INSIGHTLY</th>
                  <th className="py-4 px-6 text-neutral-400">Google Analytics 4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Script Size</td>
                  <td className="py-4 px-6 text-emerald-400 font-bold">&lt; 4 KB</td>
                  <td className="py-4 px-6 text-neutral-400">~150 KB+</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Cookie Banners Required</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold">No (0 cookies)</td>
                  <td className="py-4 px-6 text-neutral-400">Yes (Mandatory consent)</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Account / Password System</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold">Project Keys (No account needed)</td>
                  <td className="py-4 px-6 text-neutral-400">Google Account / SSO</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Real-Time Latency</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold">&lt; 1-3 seconds</td>
                  <td className="py-4 px-6 text-neutral-400">24-48 hour delay</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">IP & Sensitive Data Storage</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold">Never stored</td>
                  <td className="py-4 px-6 text-neutral-400">Stored & cross-profiled</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Quick Setup Code Snippet Section */}
      <section className="border-t border-neutral-800/80 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-extrabold text-white">Installs in 30 seconds</h3>
          <p className="mt-3 text-neutral-400 text-sm">
            Copy the script tag into your website's <code className="text-emerald-300 font-mono">&lt;head&gt;</code> and start collecting real traffic immediately.
          </p>

          <div className="mt-8 text-left rounded-xl border border-neutral-800 bg-neutral-900/90 p-5 font-mono text-xs text-neutral-200 overflow-x-auto shadow-xl">
            <div className="flex items-center justify-between text-neutral-500 pb-3 border-b border-neutral-800 mb-3">
              <span>HTML / Next.js / Vite / WordPress snippet</span>
              <span className="text-emerald-400 text-[11px]">Vanilla JS • Async</span>
            </div>
            <pre className="text-emerald-300">
{`<!-- INSIGHTLY Analytics Tracker -->
<script
  async
  src="https://insightly.app/tracker.js"
  data-site-id="site_8x29abc"
  data-tracking-key="trk_91f82b0e9c814a72">
</script>`}
            </pre>
          </div>

          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={onStartTracking}
              className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-neutral-950 transition hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
            >
              Add Your First Website
            </button>
            <button
              onClick={onOpenAccessModal}
              className="rounded-xl border border-neutral-700 bg-neutral-900 px-6 py-3 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-800"
            >
              Access Existing Site
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-12 text-xs text-neutral-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-neutral-950 font-bold text-xs">
              IN
            </div>
            <span className="font-bold text-white text-sm">INSIGHTLY</span>
            <span className="text-neutral-400 ml-2">"Know your visitors. Understand your growth."</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button onClick={onOpenPlayground} className="hover:text-emerald-400 transition">
              Live Test Simulator
            </button>
            <button onClick={onViewDemo} className="hover:text-white transition">
              Demo Mode
            </button>
            <button onClick={onOpenAccessModal} className="hover:text-white transition">
              Dashboard Login
            </button>
            <a href="#privacy" className="hover:text-white transition">
              Privacy Policy
            </a>
          </div>

          <div className="text-neutral-400">
            Powered by Supabase PostgreSQL & Express Engine
          </div>
        </div>
      </footer>
    </div>
  );
};
