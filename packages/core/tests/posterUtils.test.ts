import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPosterUrl, processPosterUrls } from '../utils/posterUtils';
import * as logger from '../utils/logger';

// Mock the appConfig
vi.mock('../../platforms/cloudflare/appConfig', () => ({
  appConfig: {
    api: {
      cacheExpirationRPDB: 7,
    },
  },
}));

// Mock the logger
vi.mock('../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Poster Utilities', () => {
  const originalDate = global.Date.now;
  const mockNow = 1625097600000; // Fixed timestamp for testing

  beforeEach(() => {
    vi.resetAllMocks();
    // Mock Date.now for consistent cache testing
    global.Date.now = vi.fn().mockReturnValue(mockNow);
  });

  afterEach(() => {
    // Restore Date.now
    global.Date.now = originalDate;
  });

  describe('getPosterUrl', () => {
    it('should return original URL when no RPDB API key is provided', () => {
      const originalUrl = 'https://example.com/poster.jpg';
      const result = getPosterUrl(originalUrl, null, 'tt1234567');
      expect(result).toBe(originalUrl);
    });

    it('should return empty string when original URL is undefined and no API key is provided', () => {
      const result = getPosterUrl(undefined, null, 'tt1234567');
      expect(result).toBe('');
    });

    it('should return RPDB URL when API key is provided', () => {
      const originalUrl = 'https://example.com/poster.jpg';
      const apiKey = 'test-api-key';
      const mediaId = 'tt1234567';

      const result = getPosterUrl(originalUrl, apiKey, mediaId);

      const expectedUrl = `https://api.ratingposterdb.com/${apiKey}/imdb/poster-default/${mediaId}.jpg?fallback=true`;
      expect(result).toBe(expectedUrl);
    });

    it('should use cached URL if available and not expired', () => {
      const originalUrl = 'https://example.com/poster.jpg';
      const apiKey = 'test-api-key';
      const mediaId = 'tt1234567';

      // First call to cache the URL
      const result1 = getPosterUrl(originalUrl, apiKey, mediaId);

      // Second call should use cached URL
      const result2 = getPosterUrl(originalUrl, apiKey, mediaId);

      expect(result1).toBe(result2);
    });

    it('should generate new URL when cache is expired', () => {
      const originalUrl = 'https://example.com/poster.jpg';
      const apiKey = 'test-api-key';
      const mediaId = 'tt1234567';

      // First call to cache the URL
      const result1 = getPosterUrl(originalUrl, apiKey, mediaId);

      // Reset the mock call count
      vi.mocked(global.Date.now).mockClear();

      // Advance time past cache expiration (7 days + 1 ms)
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      global.Date.now = vi.fn().mockReturnValue(mockNow + sevenDaysMs + 1);

      // Second call should generate a new URL (but in this case it's the same)
      const result2 = getPosterUrl(originalUrl, apiKey, mediaId);

      // The URLs should be the same in content, but we've verified cache expiration by
      // checking that Date.now was called a second time after our mock update
      expect(result1).toBe(result2);
      // Date.now should be called at least twice - once for checking expiration and once for setting new timestamp
      expect(global.Date.now).toHaveBeenCalledTimes(2);
    });

    it('should return original URL on error', () => {
      const originalUrl = 'https://example.com/poster.jpg';
      const apiKey = 'test-api-key';
      const mediaId = 'tt1234567';

      // Force an error by mocking Date.now to throw
      const originalDateNow = global.Date.now;
      global.Date.now = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      try {
        const result = getPosterUrl(originalUrl, apiKey, mediaId);

        // Should return the original URL on error
        expect(result).toBe(originalUrl);

        // Verify that an error was logged
        expect(logger.logger.error).toHaveBeenCalled();
      } finally {
        // Always restore the original method
        global.Date.now = originalDateNow;
      }
    });
  });

  describe('processPosterUrls', () => {
    it('should not modify metas when no RPDB API key is provided', () => {
      const metas = [
        { id: 'tt1234567', poster: 'https://example.com/poster1.jpg' },
        { id: 'tt7654321', poster: 'https://example.com/poster2.jpg' },
      ];

      const result = processPosterUrls(metas, null);

      expect(result).toEqual(metas);
      // Verify the original objects haven't been modified
      expect(result).toBe(metas);
    });

    it('should replace poster URLs with RPDB URLs when API key is provided', () => {
      const apiKey = 'test-api-key';
      const metas = [
        { id: 'tt1234567', poster: 'https://example.com/poster1.jpg' },
        { id: 'tt7654321', poster: 'https://example.com/poster2.jpg' },
      ];

      const result = processPosterUrls(metas, apiKey);

      // Expect poster URLs to be replaced with RPDB URLs
      expect(result).toEqual([
        {
          id: 'tt1234567',
          poster: `https://api.ratingposterdb.com/${apiKey}/imdb/poster-default/tt1234567.jpg?fallback=true`,
        },
        {
          id: 'tt7654321',
          poster: `https://api.ratingposterdb.com/${apiKey}/imdb/poster-default/tt7654321.jpg?fallback=true`,
        },
      ]);
    });

    it('should not modify meta items without poster or id', () => {
      const apiKey = 'test-api-key';
      const metas = [
        { id: 'tt1234567', title: 'Test Movie' }, // No poster
        { poster: 'https://example.com/poster.jpg', title: 'Another Movie' }, // No id
        { id: 'tt7654321', poster: 'https://example.com/poster2.jpg', title: 'Complete Movie' }, // Both id and poster
      ];

      const result = processPosterUrls(metas, apiKey);

      expect(result).toEqual([
        { id: 'tt1234567', title: 'Test Movie' }, // Unchanged
        { poster: 'https://example.com/poster.jpg', title: 'Another Movie' }, // Unchanged
        {
          id: 'tt7654321',
          poster: `https://api.ratingposterdb.com/${apiKey}/imdb/poster-default/tt7654321.jpg?fallback=true`,
          title: 'Complete Movie',
        }, // Poster URL modified
      ]);
    });
  });
});
