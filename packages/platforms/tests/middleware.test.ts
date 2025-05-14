import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { appConfig } from '../cloudflare/appConfig';
import { Context, Next } from 'hono';
import { rateLimit } from '../cloudflare/middleware/rateLimit';

// Mock the dependencies
vi.mock('../cloudflare/appConfig', () => ({
  appConfig: {
    api: {
      rateLimit: true,
      maxRequestsPerMinute: 60,
    },
  },
}));

// Access the internal ipRequests object to reset it between tests
// Need to directly get reference to the module to clear state
let rateLimitModule: any;

describe('Rate Limiting Middleware', () => {
  // Keep track of real Date.now implementation
  const originalDateNow = Date.now;

  // Mock context creation function
  const createMockContext = (headers: Record<string, string> = {}) => {
    return {
      req: {
        header: (name: string) => headers[name] || null,
      },
      header: vi.fn(),
      json: vi.fn().mockReturnValue({ status: 429 }),
    } as unknown as Context;
  };

  // Mock next function
  const mockNext = vi.fn().mockResolvedValue({ status: 200 });

  beforeEach(async () => {
    vi.clearAllMocks();

    // Force reimport of the module to reset internal state
    vi.resetModules();
    rateLimitModule = await import('../cloudflare/middleware/rateLimit');

    // Mock Date.now to return a fixed timestamp
    Date.now = vi.fn().mockReturnValue(1625097600000); // 2021-07-01T00:00:00.000Z

    // Reset appConfig values for testing
    appConfig.api.rateLimit = true;
    appConfig.api.maxRequestsPerMinute = 5;
  });

  afterEach(() => {
    // Restore the original Date.now function
    Date.now = originalDateNow;
  });

  it('should skip rate limiting when disabled in config', async () => {
    // Disable rate limiting in config
    appConfig.api.rateLimit = false;

    const context = createMockContext();
    const middleware = rateLimitModule.rateLimit();

    await middleware(context, mockNext);

    // Should have called next without setting headers or rate limiting
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(context.header).not.toHaveBeenCalled();
    expect(context.json).not.toHaveBeenCalled();
  });

  it('should use CF-Connecting-IP header for client identification', async () => {
    const context = createMockContext({
      'CF-Connecting-IP': '1.2.3.4',
    });

    const middleware = rateLimitModule.rateLimit();
    await middleware(context, mockNext);

    // Should set rate limit headers
    expect(context.header).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
    expect(context.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should use X-Forwarded-For when CF-Connecting-IP is not available', async () => {
    const context = createMockContext({
      'X-Forwarded-For': '5.6.7.8',
    });

    const middleware = rateLimitModule.rateLimit();
    await middleware(context, mockNext);

    // Should set rate limit headers
    expect(context.header).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
    expect(context.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should use "unknown" when no IP headers are available', async () => {
    const context = createMockContext({});

    const middleware = rateLimitModule.rateLimit();
    await middleware(context, mockNext);

    // Should set rate limit headers
    expect(context.header).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
    expect(context.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should allow requests under the rate limit', async () => {
    const ip = '1.2.3.4';
    const middleware = rateLimitModule.rateLimit();

    // Make requests up to the limit
    for (let i = 1; i <= 5; i++) {
      const context = createMockContext({ 'CF-Connecting-IP': ip });
      await middleware(context, mockNext);

      // Should set rate limit headers correctly
      expect(context.header).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
      expect(context.header).toHaveBeenCalledWith('X-RateLimit-Remaining', `${5 - i}`);
      expect(mockNext).toHaveBeenCalledTimes(i);
      expect(context.json).not.toHaveBeenCalled();
    }
  });

  it('should block requests exceeding the rate limit', async () => {
    const ip = '2.3.4.5';
    const middleware = rateLimitModule.rateLimit();

    // Make requests up to the limit
    for (let i = 1; i <= 5; i++) {
      const context = createMockContext({ 'CF-Connecting-IP': ip });
      await middleware(context, mockNext);
    }

    mockNext.mockClear();

    // One more request (exceeds the limit)
    const context = createMockContext({ 'CF-Connecting-IP': ip });
    await middleware(context, mockNext);

    // Next should not be called
    expect(mockNext).not.toHaveBeenCalled();

    // Rate limit response should be returned
    expect(context.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later',
        retryAfter: expect.any(Number),
      }),
      429
    );

    // Headers should still be set
    expect(context.header).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
    expect(context.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
    expect(context.header).toHaveBeenCalledWith('Retry-After', expect.any(String));
  });

  it('should reset rate limit after window expires', async () => {
    const ip = '3.4.5.6';
    const middleware = rateLimitModule.rateLimit();

    // First request
    let context = createMockContext({ 'CF-Connecting-IP': ip });
    await middleware(context, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);

    // Simulate time passing - window expired (60 seconds + 1)
    vi.mocked(Date.now).mockReturnValue(1625097661000);

    mockNext.mockClear();

    // New request after window expiration
    context = createMockContext({ 'CF-Connecting-IP': ip });
    await middleware(context, mockNext);

    // Should allow the request and reset counter
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(context.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');
  });

  it('should track different IPs separately', async () => {
    const middleware = rateLimitModule.rateLimit();

    // Request from first IP
    const context1 = createMockContext({ 'CF-Connecting-IP': '1.1.1.1' });
    await middleware(context1, mockNext);

    // Request from second IP
    const context2 = createMockContext({ 'CF-Connecting-IP': '2.2.2.2' });
    await middleware(context2, mockNext);

    // Both should be allowed and have correct remaining counts
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(context1.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');
    expect(context2.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');
  });

  it('should set Retry-After header when rate limited', async () => {
    const ip = '4.5.6.7';
    const middleware = rateLimitModule.rateLimit();

    // Exceed the limit
    for (let i = 1; i <= 6; i++) {
      const context = createMockContext({ 'CF-Connecting-IP': ip });
      await middleware(context, mockNext);

      if (i > 5) {
        // For the 6th request, check the Retry-After header
        expect(context.header).toHaveBeenCalledWith('Retry-After', expect.any(String));
      }
    }
  });
});
