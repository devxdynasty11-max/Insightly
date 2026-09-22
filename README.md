# INSIGHTLY — Website Analytics Platform

> **"Know your visitors. Understand your growth."**

INSIGHTLY is a production-ready, privacy-conscious, real-time website analytics platform built for modern creators, developers, and businesses. It delivers deep visitor insights, conversion metrics, and growth milestones with **zero cookies**, **zero passwords/user accounts**, and an ultra-lightweight client tracker (<4 KB).

---

## Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [Tech Stack](#tech-stack)
3. [Key Features](#key-features)
4. [No-Account Security Architecture](#no-account-security-architecture)
5. [Lightweight Tracking Script (`tracker.js`)](#lightweight-tracking-script-trackerjs)
6. [Real-Time Engine](#real-time-engine)
7. [Database Schema (Supabase PostgreSQL)](#database-schema-supabase-postgresql)
8. [Privacy Compliance (GDPR & CCPA)](#privacy-compliance-gdpr--ccpa)
9. [Installation & Setup Guide](#installation--setup-guide)
10. [Custom Event Tracking API](#custom-event-tracking-api)
11. [Testing & Verification](#testing--verification)

---

## Architectural Overview

INSIGHTLY replaces monolithic tag managers and complex authentication databases with a streamlined **project-key security model**:

```
[ Visitor Browser ]
         │
         │  1. Non-blocking beacon / fetch (<4 KB vanilla tracker.js)
         ▼
[ Express Ingestion Gateway (/api/collect) ]
         │
         │  2. In-memory validation, rate limiting & cryptographic hashing (SHA-256)
         │  3. Anonymization: IP is salted & hashed into daily rotating visitor hash (zero raw IP stored)
         ▼
[ Supabase PostgreSQL Database / JSON Fallback ]
  ├── Ingestion: raw_events (time-bucketed partitions)
  ├── Aggregations: daily_metrics (visitors, pageviews, bounce rate, duration)
  └── Milestones: 100, 1K, 5K, 10K, 25K, 50K, 100K+
         │
         │  4. Realtime aggregation & querying (/api/dashboard/stats, /api/dashboard/realtime)
         ▼
[ INSIGHTLY React 19 + Tailwind Dashboard ]
  ├── Overview: Area charts, top pages, traffic channels
  ├── Realtime: Active visitors radar, live pages, streaming terminal
  ├── Audience: Geographics, devices, browsers, operating systems
  ├── Events: Custom conversion tracking (e.g. signup, checkout)
  └── Milestones: Shareable achievement cards & celebrations
```

---

## Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Motion, Lucide React, Recharts, Canvas-Confetti.
- **Backend**: Express.js with custom Vite middleware for hybrid development and production bundle serving via `esbuild`.
- **Database**: Supabase PostgreSQL with automated failover to an atomic, persisted local database engine (`data/insightly_db.json`) for zero-configuration testing.
- **Tracker**: 100% vanilla JavaScript, zero runtime dependencies, target size < 3.8 KB minified, non-blocking asynchronous execution.

---

## Key Features

- **No Passwords or Accounts**: Websites are managed with isolated `site_id`, `tracking_key`, and `dashboard_key` pairs.
- **Real-Time Analytics**: Sub-3-second live updates of active visitors, current pages, and inflow referrers.
- **Traffic Classification**: Intelligent channel bucketing for Google, Bing, X/Twitter, LinkedIn, YouTube, GitHub, Product Hunt, Instagram, Facebook, and direct visits.
- **UTM Campaign Tracking**: Deep extraction of `utm_campaign`, `utm_source`, `utm_medium`, and `utm_content`.
- **Page Analytics**: Accurate average reading duration, unique visitor ratios, and bounce rates.
- **Custom Event Tracking**: `insightly.track("signup", { plan: "pro" })` with real-time conversion rates.
- **Automated Milestone Recognition**: Triggers celebrations and shareable cards when your site crosses 100, 1,000, 5,000, 10,000, or 100,000 unique visitors.
- **Demo Mode**: Built-in, fully interactive preview mode clearly labeled "Demo Data" that never pollutes production analytics.
- **Live Test Simulator**: Interactive virtual browser inside the app that fires real tracker calls directly to `/api/collect`.

---

## No-Account Security Architecture

INSIGHTLY rejects traditional email/password systems in favor of cryptographic isolation:

1. **Website ID (`site_id`)**: Public identifier (e.g., `site_8x29abc`) included in the HTML snippet.
2. **Tracking Key (`tracking_key`)**: Sent with events to prevent unauthorized spam injections.
3. **Dashboard Access Key (`dashboard_key`)**: A high-entropy secret (e.g., `dash_xxxxxxxxxxxxxxxx`) required to view analytics.
4. **Hashed Storage**: Only the **SHA-256 hash** of the keys is stored in the database. Raw dashboard keys are never accessible by server operators or exposed in responses.
5. **Rate Limiting & Anti-Abuse**: Ingestion endpoints enforce strict per-IP rate limiting (120 requests/min), size boundaries (<32 KB), and input sanitization.

---

## Lightweight Tracking Script (`tracker.js`)

The tracker is located at `/public/tracker.js` and served at `https://your-domain.com/tracker.js`.

- **Size**: ~3.5 KB (under the 10 KB target constraint).
- **Execution**: Asynchronous, non-render-blocking.
- **Transport**: Prioritizes `navigator.sendBeacon` to ensure page unloads and transitions are never lost, falling back to `fetch` with `keepalive: true`.
- **SPA Support**: Automatically intercepts `history.pushState` and `history.replaceState` along with `popstate` events to capture Single-Page Application (React, Next.js, Vue, Angular) route transitions.
- **Session Duration**: Emits heartbeat and `pagehide` signals to compute accurate time-on-page.

---

## Real-Time Engine

Live analytics are served via `GET /api/dashboard/realtime`:
- Filters active sessions with activity within the last 5 minutes.
- Aggregates unique anonymous visitor hashes currently browsing.
- Returns current pages, device types, origin countries, and a live rolling event stream.
- In the dashboard, the Realtime tab polls every 3 seconds for continuous updates.

---

## Database Schema (Supabase PostgreSQL)

A complete, production-ready schema is available in `supabase/schema.sql`:

- `websites`: Stores registered websites, domains, and hashed credentials.
- `raw_events`: Append-only event store with time-partitioned indexing.
- `daily_metrics`: Pre-aggregated daily records for high-performance dashboard loading.
- `milestones`: Records verified milestone achievements with timestamp and metadata.

---

## Privacy Compliance (GDPR & CCPA)

- **Zero Cookies**: INSIGHTLY does not write any `Set-Cookie` headers or use third-party storage cookies. No cookie consent banners required.
- **No Raw IP Storage**: The client IP address is salted with a daily-rotating secret and hashed using SHA-256. It is impossible to reverse the hash to recover the user's IP.
- **No Keystroke or Sensitive Input Tracking**: The tracker strictly ignores inputs, passwords, credit card fields, and text areas.

---

## Installation & Setup Guide

### 1. Register Your Website
Visit the INSIGHTLY dashboard and click **"Start Tracking"**. Enter your website name and domain to generate your credentials.

### 2. Add Tracking Code
Add this script tag before the closing `</head>` tag on your website:

```html
<script
  async
  src="https://your-insightly-instance.com/tracker.js"
  data-site-id="YOUR_SITE_ID"
  data-tracking-key="YOUR_TRACKING_KEY">
</script>
```

#### React / Next.js / Vite Usage

```tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://your-insightly-instance.com/tracker.js"
          data-site-id="YOUR_SITE_ID"
          data-tracking-key="YOUR_TRACKING_KEY"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## Custom Event Tracking API

INSIGHTLY injects a lightweight global helper `window.insightly`:

```javascript
// Track a sign up
insightly.track("signup");

// Track button click with custom properties
insightly.track("button_click", {
  button: "pricing_annual",
  plan: "enterprise",
  value: 99
});
```

---

## Testing & Verification

1. Click **"Live Test Site"** in the top navigation or sidebar.
2. Navigate between pages (`/`, `/pricing`, `/features`, `/docs`) and click custom event triggers.
3. Observe the live HTTP network log showing `HTTP 200 OK` from `POST /api/collect`.
4. Switch to the **Realtime** tab to watch your visit appear instantly on the live radar!
