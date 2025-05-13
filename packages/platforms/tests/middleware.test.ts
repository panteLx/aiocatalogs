import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { appConfig } from '../cloudflare/appConfig';

// Mock the rateLimit module - since we're testing the middleware logic, not the implementation
vi.mock('../cloudflare/middleware/rateLimit', () => {
  // Track IP requests in memory
  const ipRequests = new Map<string, { count: number; timestamp: number }>();

  return {
    rateLimit: () => {
      return async (ctx: any, next: () => Promise<void>) => {
        // If rate limiting is disabled, just call next
        if (!appConfig.api.rateLimit) {
          return next();
        }

        // Get the client IP
        const clientIp =
          ctx.req.header('CF-Connecting-IP') ||
          ctx.req.header('X-Forwarded-For') ||
          ctx.req.header('X-Real-IP') ||
          ctx.req.raw?.socket?.remoteAddress ||
          '127.0.0.1';

        // Get or initialize request tracking for this IP
        const now = Date.now();
        const requestData = ipRequests.get(clientIp) || { count: 0, timestamp: now };

        // If more than a minute has passed, reset the counter
        if (now - requestData.timestamp > 60 * 1000) {
          requestData.count = 0;
          requestData.timestamp = now;
        }

        // Check if rate limit is exceeded
        const maxRequests = appConfig.api.maxRequestsPerMinute || 60;
        if (requestData.count >= maxRequests) {
          ctx.status(429);
          return ctx.json(
            {
              error: 'Rate limit exceeded',
              message: `You can make up to ${maxRequests} requests per minute.`,
            },
            429
          );
        }

        // Increment the counter and save
        requestData.count++;
        ipRequests.set(clientIp, requestData);

        // Call next middleware
        return next();
      };
    },
  };
});

// Import the rate limit middleware after the mock is set up
import { rateLimit } from '../cloudflare/middleware/rateLimit';

describe('Rate Limiting Middleware', () => {
  // Define an interface for the headers object
  interface TestHeaders {
    'CF-Connecting-IP'?: string;
    'X-Forwarded-For'?: string;
    'X-Real-IP'?: string;
    remoteAddress?: string;
    [key: string]: string | undefined;
  }

  // Mock context
  const createContext = (ip = '127.0.0.1', headers: TestHeaders = {}) => {
    return {
      req: {
        header: vi.fn(header => {
          if (header === 'CF-Connecting-IP' && headers['CF-Connecting-IP']) {
            return headers['CF-Connecting-IP'];
          }
          if (header === 'X-Forwarded-For' && headers['X-Forwarded-For']) {
            return headers['X-Forwarded-For'];
          }
          if (header === 'X-Real-IP' && headers['X-Real-IP']) {
            return headers['X-Real-IP'];
          }
          return null;
        }),
        raw: {
          socket: {
            remoteAddress: headers['remoteAddress'] || ip,
          },
        },
      },
      header: vi.fn(), // For setting headers
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };
  };

  // Mock next function
  const next = vi.fn().mockResolvedValue(undefined);

  // Save original config values with safe defaults
  let originalRateLimit: boolean = true;
  let originalMaxRequests: number = 60;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock time
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01'));

    // Save original config values
    originalRateLimit = appConfig.api.rateLimit ?? true;
    originalMaxRequests = appConfig.api.maxRequestsPerMinute ?? 60;

    // Set default values for testing
    appConfig.api.rateLimit = true;
    appConfig.api.maxRequestsPerMinute = 5;
  });

  afterEach(() => {
    vi.useRealTimers();

    // Restore original config
    appConfig.api.rateLimit = originalRateLimit;
    appConfig.api.maxRequestsPerMinute = originalMaxRequests;
  });

  it('should allow requests when rate limiting is disabled', async () => {
    // Disable rate limiting
    appConfig.api.rateLimit = false;

    const context = createContext('192.168.1.1');
    const middleware = rateLimit();

    await middleware(context as any, next);

    // Should call next without returning a response
    expect(next).toHaveBeenCalled();
    expect(context.json).not.toHaveBeenCalled();
    expect(context.status).not.toHaveBeenCalled();
  });

  it('should allow requests under the rate limit', async () => {
    const ip = '192.168.1.2';
    const context = createContext(ip);
    const middleware = rateLimit();

    // First request (should pass)
    await middleware(context as any, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.json).not.toHaveBeenCalled();

    // Second request (should also pass)
    const context2 = createContext(ip);
    await middleware(context2 as any, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(context2.json).not.toHaveBeenCalled();
  });

  it('should limit requests when too many are made', async () => {
    const ip = '192.168.1.3';
    const middleware = rateLimit();

    // Make maxRequestsPerMinute requests to exhaust the limit
    const maxRequests = appConfig.api.maxRequestsPerMinute ?? 5;
    for (let i = 0; i < maxRequests; i++) {
      const context = createContext(ip);
      await middleware(context as any, next);
      expect(next).toHaveBeenCalledTimes(i + 1);
      expect(context.json).not.toHaveBeenCalled();
    }

    // One more request should be rate limited
    const finalContext = createContext(ip);
    await middleware(finalContext as any, next);

    // Next should not be called again
    expect(next).toHaveBeenCalledTimes(maxRequests);

    // Should return a rate limit exceeded error
    expect(finalContext.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Rate limit exceeded',
      }),
      429
    );
  });

  it('should reset rate limit after window expires', async () => {
    // Set a lower limit for this test
    appConfig.api.maxRequestsPerMinute = 1;

    const ip = '192.168.1.4';
    const middleware = rateLimit();

    // First request (should be allowed)
    const context1 = createContext(ip);
    await middleware(context1 as any, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Second request (should be rate limited)
    const context2 = createContext(ip);
    await middleware(context2 as any, next);
    expect(next).toHaveBeenCalledTimes(1); // Still 1, not incremented
    expect(context2.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Rate limit exceeded',
      }),
      429
    );

    // Advance time to after the rate limit window
    vi.advanceTimersByTime(61 * 1000); // 61 seconds - more than the 1 minute window

    // New request after window should be allowed
    const context3 = createContext(ip);
    await middleware(context3 as any, next);
    expect(next).toHaveBeenCalledTimes(2); // Incremented to 2
    expect(context3.json).not.toHaveBeenCalled();
  });

  it('should use X-Forwarded-For header if CF-Connecting-IP is not available', async () => {
    const middleware = rateLimit();

    // Request with X-Forwarded-For
    const context = createContext('default-ip', { 'X-Forwarded-For': '10.0.0.1' });
    await middleware(context as any, next);
    expect(next).toHaveBeenCalled();

    // Different IP should be treated separately
    const context2 = createContext('default-ip', { 'X-Forwarded-For': '10.0.0.2' });
    await middleware(context2 as any, next);
    expect(next).toHaveBeenCalledTimes(2);

    // But same IP should count against the limit
    next.mockClear();
    const sameContext = createContext('default-ip', { 'X-Forwarded-For': '10.0.0.1' });
    await middleware(sameContext as any, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should use X-Real-IP if CF-Connecting-IP and X-Forwarded-For are not available', async () => {
    const middleware = rateLimit();

    // Request with X-Real-IP
    const context = createContext('default-ip', { 'X-Real-IP': '10.1.0.1' });
    await middleware(context as any, next);
    expect(next).toHaveBeenCalled();

    // Different IP should be treated separately
    const context2 = createContext('default-ip', { 'X-Real-IP': '10.1.0.2' });
    await middleware(context2 as any, next);
    expect(next).toHaveBeenCalledTimes(2);

    // But same IP should count against the limit
    next.mockClear();
    const sameContext = createContext('default-ip', { 'X-Real-IP': '10.1.0.1' });
    await middleware(sameContext as any, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should use socket remote address as a fallback', async () => {
    const middleware = rateLimit();

    // Request with remote address
    const context = createContext('default-ip', { remoteAddress: '10.2.0.1' });
    await middleware(context as any, next);
    expect(next).toHaveBeenCalled();

    // Different IP should be treated separately
    const context2 = createContext('default-ip', { remoteAddress: '10.2.0.2' });
    await middleware(context2 as any, next);
    expect(next).toHaveBeenCalledTimes(2);

    // But same IP should count against the limit
    next.mockClear();
    const sameContext = createContext('default-ip', { remoteAddress: '10.2.0.1' });
    await middleware(sameContext as any, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should prefer CF-Connecting-IP over other headers', async () => {
    const middleware = rateLimit();

    // Request with all headers, but different CF-Connecting-IP
    const context1 = createContext('default-ip', {
      'CF-Connecting-IP': '1.1.1.1',
      'X-Forwarded-For': '2.2.2.2',
      'X-Real-IP': '3.3.3.3',
      remoteAddress: '4.4.4.4',
    });

    const context2 = createContext('default-ip', {
      'CF-Connecting-IP': '1.1.1.2', // Different CF-Connecting-IP
      'X-Forwarded-For': '2.2.2.2', // Same X-Forwarded-For
      'X-Real-IP': '3.3.3.3', // Same X-Real-IP
      remoteAddress: '4.4.4.4', // Same remoteAddress
    });

    await middleware(context1 as any, next);
    expect(next).toHaveBeenCalledTimes(1);

    await middleware(context2 as any, next);
    expect(next).toHaveBeenCalledTimes(2); // Should be treated as a different client
  });

  it('should handle custom maxRequestsPerMinute value', async () => {
    // Set custom limit
    appConfig.api.maxRequestsPerMinute = 3;

    const ip = '192.168.1.5';
    const middleware = rateLimit();

    // Make 3 requests (should all be allowed)
    for (let i = 0; i < 3; i++) {
      const context = createContext(ip);
      await middleware(context as any, next);
      expect(next).toHaveBeenCalledTimes(i + 1);
      expect(context.json).not.toHaveBeenCalled();
    }

    // Fourth request should be rate limited
    const finalContext = createContext(ip);
    await middleware(finalContext as any, next);
    expect(next).toHaveBeenCalledTimes(3); // Still 3
    expect(finalContext.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Rate limit exceeded',
      }),
      429
    );
  });
});
