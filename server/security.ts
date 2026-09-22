import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Secure SHA-256 Hashing
export function hashKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey.trim()).digest('hex');
}

// Generate unique, clean alphanumeric site ID
export function generateSiteId(): string {
  const rand = crypto.randomBytes(4).toString('hex'); // 8 hex chars
  return `site_${rand}`;
}

// Generate tracking key
export function generateTrackingKey(): string {
  const rand = crypto.randomBytes(16).toString('hex');
  return `trk_${rand}`;
}

// Generate dashboard access key
export function generateDashboardKey(): string {
  const rand = crypto.randomBytes(24).toString('hex');
  return `dash_${rand}`;
}

// In-Memory Sliding Window Rate Limiter
interface RateBucket {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateBucket>();

// Clean up stale buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitMap.entries()) {
    if (bucket.resetAt <= now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimit(limit: number, windowMs: number, keyPrefix: string = 'rl') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const clientKey = `${keyPrefix}:${ip}`;
    const now = Date.now();

    let bucket = rateLimitMap.get(clientKey);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 1, resetAt: now + windowMs };
      rateLimitMap.set(clientKey, bucket);
      return next();
    }

    if (bucket.count >= limit) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((bucket.resetAt - now) / 1000)
      });
      return;
    }

    bucket.count++;
    next();
  };
}

// Sanitize & format domain (removes protocol, port, trailing slash)
export function sanitizeDomain(rawDomain: string): string {
  if (!rawDomain) return '';
  let clean = rawDomain.trim().toLowerCase();
  clean = clean.replace(/^(https?:\/\/)/i, '');
  clean = clean.split('/')[0];
  clean = clean.split(':')[0];
  return clean;
}

// Country code resolver (privacy safe, no IP stored)
export function getCountryFromRequest(req: Request): { country: string; region: string } {
  // Check common Cloudflare / Reverse Proxy headers
  const cfCountry = req.headers['cf-ipcountry'] as string;
  const cfRegion = req.headers['cf-region'] as string;
  if (cfCountry && cfCountry.length === 2) {
    return {
      country: cfCountry.toUpperCase(),
      region: cfRegion || 'Standard'
    };
  }

  // Fallback defaults or pseudo-geo based on locale
  const lang = (req.headers['accept-language'] as string || '').toLowerCase();
  if (lang.includes('en-us')) return { country: 'United States', region: 'NA' };
  if (lang.includes('en-gb')) return { country: 'United Kingdom', region: 'EU' };
  if (lang.includes('de')) return { country: 'Germany', region: 'EU' };
  if (lang.includes('fr')) return { country: 'France', region: 'EU' };
  if (lang.includes('ja')) return { country: 'Japan', region: 'AS' };
  if (lang.includes('in') || lang.includes('hi')) return { country: 'India', region: 'AS' };
  if (lang.includes('ca')) return { country: 'Canada', region: 'NA' };
  if (lang.includes('au')) return { country: 'Australia', region: 'OC' };
  if (lang.includes('es')) return { country: 'Spain', region: 'EU' };
  if (lang.includes('br') || lang.includes('pt')) return { country: 'Brazil', region: 'SA' };

  return { country: 'United States', region: 'NA' };
}
