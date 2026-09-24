import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { rateLimit, getCountryFromRequest } from './server/security';
import { IngestionPayload } from './server/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON & beacon payloads (with 64kb max limit for collector protection)
  app.use(express.json({ limit: '64kb' }));
  app.use(express.text({ type: ['text/plain', 'application/json'], limit: '64kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use((req, _res, next) => {
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch {}
    }
    next();
  });

  // CORS headers so external websites can send events to this analytics instance
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-site-id, x-dashboard-key, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'INSIGHTLY Analytics Engine',
      version: '1.3.0',
      timestamp: new Date().toISOString()
    });
  });

  // Serve tracker.js directly with proper headers
  app.get('/tracker.js', (req: Request, res: Response) => {
    const trackerPath = path.join(process.cwd(), 'public', 'tracker.js');
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.sendFile(trackerPath);
  });

  // ==========================================
  // 1. COLLECT API (Event Ingestion)
  // ==========================================
  app.post(
    '/api/collect',
    rateLimit(300, 60 * 1000, 'collect'), // 300 requests/min per IP for real-time tracking
    async (req: Request, res: Response) => {
      try {
        const body = req.body as IngestionPayload;

        if (!body || !body.site_id || !body.tracking_key) {
          return res.status(400).json({ error: 'Missing site_id or tracking_key' });
        }

        if (!body.payload || !body.payload.anonymous_id || !body.payload.session_id) {
          return res.status(400).json({ error: 'Invalid tracking payload' });
        }

        const geo = getCountryFromRequest(req);
        const result = await db.ingestEvent(body, geo);

        return res.json({
          ok: true,
          milestone: result.milestone || null
        });
      } catch (err: any) {
        return res.status(400).json({
          error: 'Ingestion failed',
          message: err.message || 'Invalid request'
        });
      }
    }
  );

  // ==========================================
  // 2. WEBSITES SETUP & MANAGEMENT
  // ==========================================
  app.post(
    '/api/websites',
    rateLimit(30, 60 * 1000, 'create_site'),
    async (req: Request, res: Response) => {
      try {
        const { name, domain } = req.body;
        if (!name || !domain) {
          return res.status(400).json({ error: 'Website name and domain are required' });
        }

        const created = await db.createWebsite(name, domain);
        return res.status(201).json(created);
      } catch (err: any) {
        return res.status(500).json({ error: 'Failed to create website', message: err.message });
      }
    }
  );

  app.get('/api/websites', async (req: Request, res: Response) => {
    try {
      const list = await db.listWebsites();
      return res.json({ websites: list });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to list websites' });
    }
  });

  // Check tracking status for install page
  app.get('/api/websites/status', async (req: Request, res: Response) => {
    try {
      const siteId = (req.query.site_id as string) || (req.headers['x-site-id'] as string);
      if (!siteId) {
        return res.status(400).json({ error: 'site_id is required' });
      }

      const status = await db.checkSiteStatus(siteId);
      return res.json(status);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to check site status' });
    }
  });

  // ==========================================
  // 3. DASHBOARD ACCESS AUTH
  // ==========================================
  app.post(
    '/api/dashboard/auth',
    rateLimit(45, 60 * 1000, 'auth_site'),
    async (req: Request, res: Response) => {
      try {
        const { site_id, dashboard_key } = req.body;
        if (!site_id || !dashboard_key) {
          return res.status(400).json({ error: 'Website ID and Dashboard Key are required' });
        }

        const site = await db.validateDashboardKey(site_id, dashboard_key);
        if (!site) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid Website ID or Dashboard Access Key.'
          });
        }

        return res.json({
          ok: true,
          website: {
            site_id: site.site_id,
            name: site.name,
            domain: site.domain,
            created_at: site.created_at
          }
        });
      } catch (err: any) {
        return res.status(500).json({ error: 'Authentication check failed' });
      }
    }
  );

  // ==========================================
  // 4. DASHBOARD STATS
  // ==========================================
  app.get('/api/dashboard/stats', async (req: Request, res: Response) => {
    try {
      const siteId = (req.headers['x-site-id'] as string) || (req.query.site_id as string);
      const dashboardKey = (req.headers['x-dashboard-key'] as string) || (req.query.dashboard_key as string);
      const range = (req.query.range as string) || '7d';
      const customFrom = req.query.from as string;
      const customTo = req.query.to as string;

      if (!siteId || !dashboardKey) {
        return res.status(401).json({ error: 'Website ID and Dashboard Key are required' });
      }

      const site = await db.validateDashboardKey(siteId, dashboardKey);
      if (!site) {
        return res.status(401).json({ error: 'Invalid Website ID or Dashboard Access Key' });
      }

      const stats = await db.getDashboardStats(siteId, range, customFrom, customTo);
      return res.json(stats);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve dashboard stats', message: err.message });
    }
  });

  // ==========================================
  // 5. REALTIME STATS
  // ==========================================
  app.get('/api/dashboard/realtime', async (req: Request, res: Response) => {
    try {
      const siteId = (req.headers['x-site-id'] as string) || (req.query.site_id as string);
      const dashboardKey = (req.headers['x-dashboard-key'] as string) || (req.query.dashboard_key as string);

      if (!siteId || !dashboardKey) {
        return res.status(401).json({ error: 'Website ID and Dashboard Key are required' });
      }

      const site = await db.validateDashboardKey(siteId, dashboardKey);
      if (!site) {
        return res.status(401).json({ error: 'Invalid Website ID or Dashboard Access Key' });
      }

      const realtime = await db.getRealtimeStats(siteId);
      return res.json(realtime);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve realtime stats' });
    }
  });

  // ==========================================
  // 6. TRAFFIC SIMULATOR / TEST ASSISTANT
  // ==========================================
  // Allows sending realistic test visits/events to verify end-to-end flow and milestones
  app.post('/api/test/simulate', async (req: Request, res: Response) => {
    try {
      const { site_id, count = 1, page = '/', referrer = 'Google', event_name } = req.body;
      const site = await db.getWebsite(site_id);
      if (!site) return res.status(404).json({ error: 'Site not found' });

      // Find tracking key
      const randomAnonId = 'sim_' + Math.random().toString(36).substring(2, 10);
      const randomSessionId = 'sess_' + Math.random().toString(36).substring(2, 10);

      const countries = ['United States', 'Germany', 'United Kingdom', 'Japan', 'France', 'India', 'Canada'];
      const devices = ['desktop', 'mobile', 'tablet'];
      const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
      const osList = ['macOS', 'Windows', 'iOS', 'Android'];

      let milestoneReached = null;
      for (let i = 0; i < Math.min(count, 100); i++) {
        const anon = randomAnonId + '_' + i;
        const c = countries[Math.floor(Math.random() * countries.length)];
        const d = devices[Math.floor(Math.random() * devices.length)];
        const b = browsers[Math.floor(Math.random() * browsers.length)];
        const o = osList[Math.floor(Math.random() * osList.length)];

        // Ingest pageview directly
        const ingPayload: IngestionPayload = {
          site_id: site.site_id,
          tracking_key: 'internal_bypass', // internal simulator
          type: event_name ? 'event' : 'pageview',
          payload: {
            url: `https://${site.domain}${page}`,
            path: page,
            title: `${site.name} — ${page === '/' ? 'Home' : page.replace('/', '')}`,
            referrer: referrer.startsWith('http') ? referrer : `https://${referrer.toLowerCase()}.com/search`,
            anonymous_id: anon,
            session_id: randomSessionId + '_' + i,
            device_type: d,
            browser: b,
            os: o,
            screen_size: '1920x1080',
            language: 'en',
            event_name,
            metadata: event_name ? { trigger: 'test_simulator', simulated: true } : undefined,
            duration: Math.floor(Math.random() * 90) + 10
          }
        };

        // Ingest into db directly
        const result = await db.ingestEventDirect(
          ingPayload,
          { country: c, region: 'Region' }
        ).catch(() => ({ success: true, milestone: null }));

        if (result && result.milestone) {
          milestoneReached = result.milestone;
        }
      }

      return res.json({ ok: true, simulated: count, milestone: milestoneReached });
    } catch (err: any) {
      return res.status(500).json({ error: 'Simulation failed', message: err.message });
    }
  });

  // Delete site
  app.delete('/api/websites/:site_id', async (req: Request, res: Response) => {
    try {
      const siteId = req.params.site_id;
      const dashboardKey = (req.headers['x-dashboard-key'] as string) || (req.query.dashboard_key as string);
      const site = await db.validateDashboardKey(siteId, dashboardKey);
      if (!site) return res.status(401).json({ error: 'Unauthorized' });

      await db.deleteWebsite(siteId);
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to delete website' });
    }
  });

  // Seed default demonstration website if database is brand new
  const sites = await db.listWebsites();
  if (sites.length === 0) {
    const seedSite = await db.createWebsite('ORBIT', 'orbit.example');
    console.log('[INSIGHTLY] Seeded demo site:', seedSite.site_id);
  }

  // ==========================================
  // 7. VITE MIDDLEWARE (Dev) or STATIC (Prod)
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[INSIGHTLY] Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
