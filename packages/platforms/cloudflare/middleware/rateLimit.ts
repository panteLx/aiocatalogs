import { Context, Next } from 'hono';
import { appConfig } from '../appConfig';

// Simple in-memory rate limiter store
type RateLimitStore = {
  [key: string]: {
    count: number;
    resetTime: number;
  };
};

// Rate limit storage (in-memory)
const ipRequests: RateLimitStore = {};

/**
 * Gets a unique identifier for the request
 * Uses IP address as default, but can be customized
 */
function getRequestIdentifier(c: Context): string {
  // Use Cloudflare's CF-Connecting-IP header if available
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';

  return ip;
}

/**
 * Rate limit middleware for Hono
 * Limits requests based on IP address and configured values
 */
export function rateLimit() {
  return async (c: Context, next: Next) => {
    // Skip rate limiting if disabled in config
    if (!appConfig.api.rateLimit) {
      return await next();
    }

    const identifier = getRequestIdentifier(c);
    const now = Date.now();
    const resetWindowMs = 60 * 1000; // 1 minute in milliseconds
    const maxRequests = appConfig.api.maxRequestsPerMinute || 60;

    // Initialize or reset entry if window has expired
    if (!ipRequests[identifier] || now > ipRequests[identifier].resetTime) {
      ipRequests[identifier] = {
        count: 1,
        resetTime: now + resetWindowMs,
      };

      // Set headers and continue
      setRateLimitHeaders(c, 1, maxRequests, ipRequests[identifier].resetTime);
      return await next();
    }

    // Increment request count
    ipRequests[identifier].count++;

    // Check if rate limit exceeded
    if (ipRequests[identifier].count > maxRequests) {
      // Rate limit exceeded
      setRateLimitHeaders(
        c,
        ipRequests[identifier].count,
        maxRequests,
        ipRequests[identifier].resetTime
      );
      return c.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil((ipRequests[identifier].resetTime - now) / 1000),
        },
        429
      );
    }

    // Set rate limit headers and continue
    setRateLimitHeaders(
      c,
      ipRequests[identifier].count,
      maxRequests,
      ipRequests[identifier].resetTime
    );
    return await next();
  };
}

/**
 * Set rate limit headers for transparency
 */
function setRateLimitHeaders(c: Context, current: number, limit: number, resetTime: number) {
  c.header('X-RateLimit-Limit', limit.toString());
  c.header('X-RateLimit-Remaining', Math.max(0, limit - current).toString());
  c.header('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());

  // If rate limited, add Retry-After header
  if (current > limit) {
    const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);
    c.header('Retry-After', retryAfterSeconds.toString());
  }
}
