/**
 * Guest Rate Limit Middleware
 *
 * Limits requests per IP address for guest checkout to prevent abuse.
 * Uses in-memory storage (sufficient for single-instance deployment).
 */

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipRequests = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    ipRequests.forEach((entry, ip) => {
      if (entry.resetAt < now) {
        ipRequests.delete(ip);
      }
    });
  },
  5 * 60 * 1000
);

export default (_config: unknown, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const ip = ctx.request.ip || ctx.ip || 'unknown';
    const now = Date.now();

    let entry = ipRequests.get(ip);

    // Reset if window expired
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + WINDOW_MS };
      ipRequests.set(ip, entry);
    }

    entry.count++;

    // Set rate limit headers
    ctx.set('X-RateLimit-Limit', String(MAX_REQUESTS));
    ctx.set('X-RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS - entry.count)));
    ctx.set('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > MAX_REQUESTS) {
      strapi.log.warn(`[guest-rate-limit] Rate limit exceeded for IP: ${ip}`);
      ctx.status = 429;
      ctx.body = {
        error: {
          status: 429,
          name: 'TooManyRequestsError',
          message: 'Too many requests. Please try again later.',
        },
      };
      return;
    }

    await next();
  };
};
