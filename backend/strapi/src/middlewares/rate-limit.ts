/**
 * Rate limiting middleware for the Tifossi API
 *
 * Simple in-memory rate limiter using Map to track request counts per IP.
 * This implementation avoids external dependencies and deployment issues.
 */

import type { Context, Next } from 'koa';

interface RateLimitConfig {
  enabled: boolean;
  duration?: number;
  max?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  slowdownStartTime?: number;
  delays: number;
}

interface RateLimitStore {
  [ip: string]: RateLimitEntry;
}

export default (config: RateLimitConfig, { strapi }: { strapi: any }) => {
  // Create rate limit store ONCE at initialization (not per request)
  const store: RateLimitStore = {};
  const windowMs = config.duration || 15 * 60 * 1000; // 15 minutes
  const maxRequests = config.max || 100;
  const slowDownThreshold = Math.floor(maxRequests * 0.5); // 50% of max

  // Cleanup old entries periodically
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach((ip) => {
      if (store[ip].resetTime < now) {
        delete store[ip];
      }
    });
  }, windowMs);

  // Clean up interval on process exit
  if (strapi?.destroy) {
    const originalDestroy = strapi.destroy;
    strapi.destroy = async function(...args: any[]) {
      clearInterval(cleanupInterval);
      return originalDestroy.apply(this, args);
    };
  }

  return async (ctx: Context, next: Next) => {
    // Skip rate limiting if disabled
    if (!config.enabled) {
      return next();
    }

    // Skip rate limiting for admin panel
    if (ctx.path.startsWith('/admin')) {
      return next();
    }

    // Skip for health checks
    if (ctx.path === '/api/health') {
      return next();
    }

    // Skip for webhooks
    if (ctx.path.startsWith('/api/webhooks')) {
      return next();
    }

    const ip = ctx.ip;
    const now = Date.now();

    // Initialize or reset rate limit entry for this IP
    if (!store[ip] || store[ip].resetTime < now) {
      store[ip] = {
        count: 0,
        resetTime: now + windowMs,
        delays: 0,
      };
    }

    const entry = store[ip];
    entry.count++;

    // Set rate limit headers
    ctx.set('RateLimit-Limit', maxRequests.toString());
    ctx.set('RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
    ctx.set('RateLimit-Reset', new Date(entry.resetTime).toISOString());

    // Check if rate limit exceeded
    if (entry.count > maxRequests) {
      ctx.status = 429;
      ctx.body = {
        error: {
          status: 429,
          name: 'RateLimitError',
          message: 'Too many requests from this IP, please try again later.',
          details: {
            limit: maxRequests,
            remaining: 0,
            resetTime: new Date(entry.resetTime),
          },
        },
      };
      return;
    }

    // Apply slowdown after threshold
    if (entry.count > slowDownThreshold) {
      const delayMs = Math.min(
        (entry.count - slowDownThreshold) * 500, // 500ms per request over threshold
        20000 // max 20 seconds
      );

      entry.delays++;

      // Add delay header
      ctx.set('RateLimit-Delay', `${delayMs}ms`);

      // Wait before proceeding
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    // Continue to next middleware
    await next();
  };
};
