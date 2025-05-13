import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseCatalogAggregator } from '../catalog/catalogAggregator';
import { CatalogManifest } from '../../types/index';

// Mock implementation for testing
class MockCatalogAggregator extends BaseCatalogAggregator {}

// Mock global fetch function
global.fetch = vi.fn();

describe('BaseCatalogAggregator', () => {
  let aggregator: MockCatalogAggregator;

  beforeEach(() => {
    aggregator = new MockCatalogAggregator();
    vi.resetAllMocks();
  });

  describe('fetchCatalogManifest', () => {
    it('should fetch and parse a valid manifest', async () => {
      const mockManifest = {
        id: 'test-id',
        name: 'Test Catalog',
        description: 'A test catalog',
        version: '1.0.0',
        resources: ['catalog'],
        types: ['movie', 'series'],
        catalogs: [
          { type: 'movie', id: 'movieCatalog', name: 'Movies' },
          { type: 'series', id: 'seriesCatalog', name: 'TV Series' },
        ],
        idPrefixes: ['tt', 'rm'],
        behaviorHints: {
          adult: false,
          p2p: false,
        },
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockManifest),
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const result = await aggregator.fetchCatalogManifest('https://example.com/addon');

      expect(fetch).toHaveBeenCalledWith('https://example.com/addon/manifest.json');
      expect(result).toBeDefined();
      expect(result?.id).toBe('test-id');
      expect(result?.name).toBe('Test Catalog');
      expect(result?.catalogs).toHaveLength(2);
    });

    it('should normalize URLs with trailing manifest.json', async () => {
      const mockManifest = {
        id: 'test-id',
        name: 'Test Catalog',
        catalogs: [],
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockManifest),
      };

      (fetch as any).mockResolvedValue(mockResponse);

      await aggregator.fetchCatalogManifest('https://example.com/addon/manifest.json');

      expect(fetch).toHaveBeenCalledWith('https://example.com/addon/manifest.json');
    });

    it('should add a trailing slash if missing', async () => {
      const mockManifest = {
        id: 'test-id',
        name: 'Test Catalog',
        catalogs: [],
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockManifest),
      };

      (fetch as any).mockResolvedValue(mockResponse);

      await aggregator.fetchCatalogManifest('https://example.com/addon');

      expect(fetch).toHaveBeenCalledWith('https://example.com/addon/manifest.json');
    });

    it('should filter out search catalogs', async () => {
      const mockManifest = {
        id: 'test-id',
        name: 'Test Catalog',
        catalogs: [
          { type: 'movie', id: 'movieCatalog', name: 'Movies' },
          { type: 'series', id: 'search', name: 'Search' },
          { type: 'movie', id: 'search_movies', name: 'Movie Search' },
        ],
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockManifest),
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const result = await aggregator.fetchCatalogManifest('https://example.com/addon');

      expect(result?.catalogs).toHaveLength(1);
      expect(result?.catalogs[0].id).toBe('movieCatalog');
    });

    it('should return null for a failed fetch', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Not Found',
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const result = await aggregator.fetchCatalogManifest('https://example.com/missing');

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await aggregator.fetchCatalogManifest('https://example.com/error');

      expect(result).toBeNull();
    });

    it('should return null for missing required fields', async () => {
      const mockManifest = {
        // Missing id and name
        catalogs: [],
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockManifest),
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const result = await aggregator.fetchCatalogManifest('https://example.com/incomplete');

      expect(result).toBeNull();
    });
  });

  describe('fetchCatalogData', () => {
    it('should fetch catalog data correctly', async () => {
      const mockData = {
        metas: [
          { id: 'tt123', name: 'Movie 1' },
          { id: 'tt456', name: 'Movie 2' },
        ],
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const result = await aggregator.fetchCatalogData(
        'https://example.com/addon',
        'movie',
        'catalog'
      );

      expect(fetch).toHaveBeenCalledWith('https://example.com/addon/catalog/movie/catalog.json');
      expect(result.metas).toHaveLength(2);
    });

    it('should handle endpoint with trailing slash', async () => {
      const mockData = { metas: [] };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };

      (fetch as any).mockResolvedValue(mockResponse);

      await aggregator.fetchCatalogData('https://example.com/addon/', 'movie', 'catalog');

      expect(fetch).toHaveBeenCalledWith('https://example.com/addon/catalog/movie/catalog.json');
    });

    it('should return empty metas array on fetch failure', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Not Found',
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const result = await aggregator.fetchCatalogData(
        'https://example.com/addon',
        'movie',
        'catalog'
      );

      expect(result.metas).toEqual([]);
    });

    it('should return empty metas array on exception', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await aggregator.fetchCatalogData(
        'https://example.com/addon',
        'movie',
        'catalog'
      );

      expect(result.metas).toEqual([]);
    });
  });

  describe('checkCatalogHealth', () => {
    it('should return true for a healthy catalog', async () => {
      const mockResponse = {
        ok: true,
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const catalog: CatalogManifest = {
        id: 'test-catalog',
        name: 'Test Catalog',
        endpoint: 'https://example.com/addon',
        description: 'Test',
        version: '1.0.0',
        resources: ['catalog'],
        types: ['movie'],
        catalogs: [],
      };

      const result = await aggregator.checkCatalogHealth(catalog);

      expect(fetch).toHaveBeenCalledWith('https://example.com/addon/manifest.json');
      expect(result).toBe(true);
    });

    it('should handle endpoint with trailing slash', async () => {
      const mockResponse = {
        ok: true,
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const catalog: CatalogManifest = {
        id: 'test-catalog',
        name: 'Test Catalog',
        endpoint: 'https://example.com/addon/',
        description: 'Test',
        version: '1.0.0',
        resources: ['catalog'],
        types: ['movie'],
        catalogs: [],
      };

      const result = await aggregator.checkCatalogHealth(catalog);

      expect(fetch).toHaveBeenCalledWith('https://example.com/addon/manifest.json');
      expect(result).toBe(true);
    });

    it('should return false for an unhealthy catalog', async () => {
      const mockResponse = {
        ok: false,
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const catalog: CatalogManifest = {
        id: 'test-catalog',
        name: 'Test Catalog',
        endpoint: 'https://example.com/addon',
        description: 'Test',
        version: '1.0.0',
        resources: ['catalog'],
        types: ['movie'],
        catalogs: [],
      };

      const result = await aggregator.checkCatalogHealth(catalog);

      expect(result).toBe(false);
    });

    it('should return false on fetch exception', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const catalog: CatalogManifest = {
        id: 'test-catalog',
        name: 'Test Catalog',
        endpoint: 'https://example.com/addon',
        description: 'Test',
        version: '1.0.0',
        resources: ['catalog'],
        types: ['movie'],
        catalogs: [],
      };

      const result = await aggregator.checkCatalogHealth(catalog);

      expect(result).toBe(false);
    });
  });
});
