'use strict';

/**
 * Rate limiting middleware for the Tifossi API
 */

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

module.exports = (config, { strapi }) => {
  return (ctx, next) => {
    // Skip rate limiting if disabled
    if (!config.enabled) {
      return next();
    }

    // Create rate limiter
    const limiter = rateLimit({
      windowMs: config.duration || 15 * 60 * 1000, // 15 minutes
      max: config.max || 100, // limit each IP to 100 requests per windowMs
      message: {
        error: {
          status: 429,
          name: 'RateLimitError',
          message: 'Too many requests from this IP, please try again later.',
          details: {
            limit: config.max || 100,
            remaining: 0,
            resetTime: new Date(Date.now() + (config.duration || 15 * 60 * 1000)),
          },
        },
      },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      handler: (req, res) => {
        res.status(429).json({
          error: {
            status: 429,
            name: 'RateLimitError',
            message: 'Too many requests from this IP, please try again later.',
            details: {
              limit: config.max || 100,
              remaining: 0,
              resetTime: new Date(Date.now() + (config.duration || 15 * 60 * 1000)),
            },
          },
        });
      },
      skip: (req) => {
        // Skip rate limiting for admin panel
        if (req.path.startsWith('/admin')) {
          return true;
        }
        
        // Skip for health checks
        if (req.path === '/api/health') {
          return true;
        }
        
        // Skip for webhooks
        if (req.path.startsWith('/api/webhooks')) {
          return true;
        }
        
        return false;
      },
    });

    // Create speed limiter for additional protection
    const speedLimiter = slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: Math.floor((config.max || 100) * 0.5), // allow 50% of max requests at full speed
      delayMs: 500, // slow down by 500ms per request after delayAfter
      maxDelayMs: 20000, // maximum delay of 20 seconds
    });

    // Apply rate limiting to Koa context
    return new Promise((resolve, reject) => {
      const req = ctx.request;
      const res = ctx.response;

      // Convert Koa context to Express-like req/res for rate limiter
      const expressReq = Object.assign(req, {
        ip: ctx.ip,
        method: ctx.method,
        path: ctx.path,
        headers: ctx.headers,
      });

      const expressRes = Object.assign(res, {
        status: (code) => {
          ctx.status = code;
          return expressRes;
        },
        json: (data) => {
          ctx.body = data;
          return expressRes;
        },
        header: (name, value) => {
          ctx.set(name, value);
          return expressRes;
        },
        set: (name, value) => {
          ctx.set(name, value);
          return expressRes;
        },
      });

      // Apply rate limiting
      limiter(expressReq, expressRes, (err) => {
        if (err) {
          return reject(err);
        }

        // Apply speed limiting
        speedLimiter(expressReq, expressRes, (err) => {
          if (err) {
            return reject(err);
          }

          // Continue to next middleware
          next().then(resolve).catch(reject);
        });
      });
    });
  };
};