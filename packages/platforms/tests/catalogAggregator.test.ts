import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { catalogAggregator, CloudflareCatalogAggregator } from '../cloudflare/catalogAggregator';
import { CatalogManifest } from '../../types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CatalogAggregator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Class Instance', () => {
    it('should export a singleton instance', () => {
      expect(catalogAggregator).toBeInstanceOf(CloudflareCatalogAggregator);
    });
  });

  describe('fetchCatalogManifest', () => {
    it('should fetch and parse a valid catalog manifest', async () => {
      // Mock response for fetch
      const mockManifest = {
        id: 'test.addon',
        name: 'Test Addon',
        description: 'Test description',
        version: '1.0.0',
        resources: ['catalog'],
        types: ['movie', 'series'],
        catalogs: [
          { type: 'movie', id: 'movie_catalog', name: 'Movies' },
          { type: 'series', id: 'series_catalog', name: 'Series' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      });

      const result = await catalogAggregator.fetchCatalogManifest('https://example.com/addon');

      // Verify fetch was called with the correct URL
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/addon/manifest.json');

      // Verify result contains expected data
      expect(result).toBeDefined();
      expect(result?.id).toBe('test.addon');
      expect(result?.name).toBe('Test Addon');
      expect(result?.catalogs.length).toBe(2);
    });

    it('should handle URLs that end with manifest.json', async () => {
      const mockManifest = {
        id: 'test.addon',
        name: 'Test Addon',
        catalogs: [{ type: 'movie', id: 'movie_catalog', name: 'Movies' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      });

      await catalogAggregator.fetchCatalogManifest('https://example.com/addon/manifest.json');

      // Should strip manifest.json and add it back correctly
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/addon/manifest.json');
    });

    it('should add trailing slash if missing', async () => {
      const mockManifest = {
        id: 'test.addon',
        name: 'Test Addon',
        catalogs: [{ type: 'movie', id: 'movie_catalog', name: 'Movies' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      });

      await catalogAggregator.fetchCatalogManifest('https://example.com/addon');

      // Should add trailing slash before adding manifest.json
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/addon/manifest.json');
    });

    it('should filter out search catalogs', async () => {
      // Mock response with search catalogs
      const mockManifest = {
        id: 'test.addon',
        name: 'Test Addon',
        version: '1.0.0',
        catalogs: [
          { type: 'movie', id: 'movie_catalog', name: 'Movies' },
          { type: 'movie', id: 'search', name: 'Search' },
          { type: 'series', id: 'series_search', name: 'Series Search' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      });

      const result = await catalogAggregator.fetchCatalogManifest('https://example.com/addon');

      // Should have only one catalog (filtering out the two search catalogs)
      expect(result?.catalogs.length).toBe(1);
      expect(result?.catalogs[0].id).toBe('movie_catalog');
    });

    it('should store provided context in the catalog manifest', async () => {
      const mockManifest = {
        id: 'test.addon',
        name: 'Test Addon',
        catalogs: [{ type: 'movie', id: 'movie_catalog', name: 'Movies' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      });

      const testContext = { userId: 'test-user' };
      const result = await catalogAggregator.fetchCatalogManifest(
        'https://example.com/addon',
        testContext
      );

      expect(result?.context).toBe(testContext);
    });

    it('should use defaults for optional manifest fields', async () => {
      // Mock minimal manifest with only required fields
      const mockManifest = {
        id: 'test.addon',
        name: 'Test Addon',
        catalogs: [{ type: 'movie', id: 'movie_catalog', name: 'Movies' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      });

      const result = await catalogAggregator.fetchCatalogManifest('https://example.com/addon');

      // Check default values
      expect(result?.description).toBe('Catalog from https://example.com/addon');
      expect(result?.version).toBe('0.0.1');
      expect(result?.resources).toEqual(['catalog']);
      expect(result?.types).toEqual(['movie', 'series']);
    });

    it('should handle failed fetch requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      const result = await catalogAggregator.fetchCatalogManifest('https://example.com/addon');

      expect(result).toBeNull();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await catalogAggregator.fetchCatalogManifest('https://example.com/addon');

      expect(result).toBeNull();
    });

    it('should handle invalid JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await catalogAggregator.fetchCatalogManifest('https://example.com/addon');

      expect(result).toBeNull();
    });

    it('should handle invalid manifest data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          // Missing required fields
          version: '1.0.0',
        }),
      });

      const result = await catalogAggregator.fetchCatalogManifest('https://example.com/addon');

      expect(result).toBeNull();
    });

    it('should handle non-object manifest data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => 'not an object',
      });

      const result = await catalogAggregator.fetchCatalogManifest('https://example.com/addon');

      expect(result).toBeNull();
    });
  });

  describe('fetchCatalogData', () => {
    it('should fetch catalog data correctly', async () => {
      const mockCatalogData = {
        metas: [{ id: 'tt1', type: 'movie', name: 'Test Movie' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalogData,
      });

      const result = await catalogAggregator.fetchCatalogData(
        'https://example.com/addon',
        'movie',
        'catalog'
      );

      // Verify fetch was called with the correct URL
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/addon/catalog/movie/catalog.json'
      );

      // Verify result contains expected data
      expect(result).toEqual(mockCatalogData);
    });

    it('should handle endpoints with trailing slashes', async () => {
      const mockCatalogData = {
        metas: [{ id: 'tt1', type: 'movie', name: 'Test Movie' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalogData,
      });

      await catalogAggregator.fetchCatalogData('https://example.com/addon/', 'movie', 'catalog');

      // Should remove trailing slash to avoid double slashes
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/addon/catalog/movie/catalog.json'
      );
    });

    it('should handle failed catalog data fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      const result = await catalogAggregator.fetchCatalogData(
        'https://example.com/addon',
        'movie',
        'catalog'
      );

      expect(result).toEqual({ metas: [] });
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await catalogAggregator.fetchCatalogData(
        'https://example.com/addon',
        'movie',
        'catalog'
      );

      expect(result).toEqual({ metas: [] });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await catalogAggregator.fetchCatalogData(
        'https://example.com/addon',
        'movie',
        'catalog'
      );

      expect(result).toEqual({ metas: [] });
    });
  });

  describe('checkCatalogHealth', () => {
    it('should return true for healthy catalog', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const mockManifest: CatalogManifest = {
        id: 'test.addon',
        name: 'Test Addon',
        description: 'Test description',
        version: '1.0.0',
        resources: ['catalog'],
        types: ['movie'],
        catalogs: [],
        endpoint: 'https://example.com/addon',
      };

      const result = await catalogAggregator.checkCatalogHealth(mockManifest);

      expect(result).toBe(true);
    });

    it('should handle endpoints with trailing slashes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const mockManifest: CatalogManifest = {
        id: 'test.addon',
        name: 'Test Addon',
        description: 'Test description',
        version: '1.0.0',
        resources: ['catalog'],
        types: ['movie'],
        catalogs: [],
        endpoint: 'https://example.com/addon/',
      };

      await catalogAggregator.checkCatalogHealth(mockManifest);

      // Should not add another trailing slash
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/addon/manifest.json');
    });

    it('should add trailing slash if missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const mockManifest: CatalogManifest = {
        id: 'test.addon',
        name: 'Test Addon',
        description: 'Test description',
        version: '1.0.0',
        resources: ['catalog'],
        types: ['movie'],
        catalogs: [],
        endpoint: 'https://example.com/addon',
      };

      await catalogAggregator.checkCatalogHealth(mockManifest);

      // Should add trailing slash
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/addon/manifest.json');
    });

    it('should return false for unhealthy catalog', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const mockManifest: CatalogManifest = {
        id: 'test.addon',
        name: 'Test Addon',
        description: 'Test description',
        version: '1.0.0',
        resources: ['catalog'],
        types: ['movie'],
        catalogs: [],
        endpoint: 'https://example.com/addon',
      };

      const result = await catalogAggregator.checkCatalogHealth(mockManifest);

      expect(result).toBe(false);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const mockManifest: CatalogManifest = {
        id: 'test.addon',
        name: 'Test Addon',
        description: 'Test description',
        version: '1.0.0',
        resources: ['catalog'],
        types: ['movie'],
        catalogs: [],
        endpoint: 'https://example.com/addon',
      };

      const result = await catalogAggregator.checkCatalogHealth(mockManifest);

      expect(result).toBe(false);
    });
  });
});
