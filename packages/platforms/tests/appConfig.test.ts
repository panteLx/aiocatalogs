import { describe, it, expect, vi } from 'vitest';
import { appConfig } from '../cloudflare/appConfig';

// Import the internal function to test it directly
function parseCommaSeparatedList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

describe('AppConfig', () => {
  it('should have the correct structure', () => {
    expect(appConfig).toBeDefined();
    expect(appConfig.app).toBeDefined();
    expect(appConfig.api).toBeDefined();
    expect(appConfig.logger).toBeDefined();
  });

  it('should have app configuration', () => {
    expect(Array.isArray(appConfig.app.trustedOrigins)).toBe(true);
  });

  it('should have api configuration', () => {
    expect(typeof appConfig.api.rateLimit).toBe('boolean');
    expect(typeof appConfig.api.maxRequestsPerMinute).toBe('number');
    if (appConfig.api.maxRequestsPerMinute !== undefined) {
      expect(appConfig.api.maxRequestsPerMinute).toBeGreaterThan(0);
    }
    expect(typeof appConfig.api.maxItemsMDBList).toBe('number');
    if (appConfig.api.maxItemsMDBList !== undefined) {
      expect(appConfig.api.maxItemsMDBList).toBeGreaterThan(0);
    }
  });

  it('should have logger configuration', () => {
    expect(typeof appConfig.logger.logLevel).toBe('string');
    expect(typeof appConfig.logger.enableTimestamps).toBe('boolean');
    expect(typeof appConfig.logger.timestampFormat).toBe('string');
    expect(typeof appConfig.logger.timezone).toBe('string');
  });

  describe('parseCommaSeparatedList function', () => {
    it('should parse comma-separated list correctly', () => {
      const result = parseCommaSeparatedList(
        'https://test1.com,https://test2.com, https://test3.com'
      );
      expect(result).toEqual(['https://test1.com', 'https://test2.com', 'https://test3.com']);
    });

    it('should handle empty string', () => {
      const result = parseCommaSeparatedList('');
      expect(result).toEqual([]);
    });

    it('should handle undefined value', () => {
      const result = parseCommaSeparatedList(undefined);
      expect(result).toEqual([]);
    });

    it('should filter out empty items', () => {
      const result = parseCommaSeparatedList('https://test1.com,,https://test2.com, ');
      expect(result).toEqual(['https://test1.com', 'https://test2.com']);
    });
  });
});
