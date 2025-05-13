import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildManifest, ADDON_ID, handleCatalogRequest } from '../utils/manifestBuilder';
import { CatalogManifest } from '../../types/index';

// Mock global fetch for handleCatalogRequest tests
global.fetch = vi.fn();

describe('manifestBuilder', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('ADDON_ID', () => {
    it('should be defined', () => {
      expect(ADDON_ID).toBeDefined();
      expect(ADDON_ID).toBe('community.aiocatalogs');
    });
  });

  describe('buildManifest', () => {
    it('should build a manifest with user catalogs', () => {
      const userId = 'test-user';
      const version = '1.0.0';
      const description = 'Test Description';
      const userCatalogs: CatalogManifest[] = [
        {
          id: 'source1',
          name: 'Source 1',
          description: 'Test Source 1',
          endpoint: 'https://example.com/addon1',
          version: '1.0.0',
          resources: ['catalog'],
          types: ['movie'],
          catalogs: [
            { type: 'movie', id: 'catalog1', name: 'Movies' },
            { type: 'series', id: 'catalog2', name: 'Series' },
          ],
        },
        {
          id: 'source2',
          name: 'Source 2',
          description: 'Test Source 2',
          endpoint: 'https://example.com/addon2',
          version: '1.0.0',
          resources: ['catalog', 'meta'],
          types: ['movie', 'series'],
          catalogs: [{ type: 'movie', id: 'catalog3', name: 'Action Movies' }],
        },
      ];

      const manifest = buildManifest(userId, version, description, userCatalogs);

      expect(manifest).toBeDefined();
      expect(manifest.id).toBe(`${ADDON_ID}.${userId}`);
      expect(manifest.version).toBe(version);
      expect(manifest.name).toBe('AIOCatalogs');
      expect(manifest.description).toBe(description);
      expect(manifest.resources).toContain('catalog');
      expect(manifest.resources).not.toContain('meta'); // Only catalog is supported
      expect(manifest.catalogs).toHaveLength(3);

      // Check for prefixed IDs in catalogs
      const catalogIds = manifest.catalogs.map((cat: any) => cat.id);
      expect(catalogIds).toContain('source1_catalog1');
      expect(catalogIds).toContain('source1_catalog2');
      expect(catalogIds).toContain('source2_catalog3');
    });

    it('should filter out search catalogs', () => {
      const userCatalogs: CatalogManifest[] = [
        {
          id: 'source1',
          name: 'Source 1',
          description: 'Test Source',
          endpoint: 'https://example.com/addon',
          version: '1.0.0',
          resources: ['catalog'],
          types: ['movie'],
          catalogs: [
            { type: 'movie', id: 'catalog1', name: 'Movies' },
            { type: 'movie', id: 'search', name: 'Search' },
            { type: 'series', id: 'search_series', name: 'Search Series' },
          ],
        },
      ];

      const manifest = buildManifest('user', '1.0.0', 'Test', userCatalogs);

      expect(manifest.catalogs).toHaveLength(1);
      expect(manifest.catalogs[0].id).toBe('source1_catalog1');
    });

    it('should use customName if available', () => {
      const userCatalogs: CatalogManifest[] = [
        {
          id: 'source1',
          name: 'Source 1',
          customName: 'My Custom Source', // Added custom name
          description: 'Test Source',
          endpoint: 'https://example.com/addon',
          version: '1.0.0',
          resources: ['catalog'],
          types: ['movie'],
          catalogs: [{ type: 'movie', id: 'catalog1', name: 'Movies' }],
        },
      ];

      const manifest = buildManifest('user', '1.0.0', 'Test', userCatalogs);

      expect(manifest.catalogs[0].name).toBe('My Custom Source');
    });

    it('should build a default manifest when no catalogs are provided', () => {
      const manifest = buildManifest('user', '1.0.0', 'Test', []);

      expect(manifest.catalogs).toHaveLength(1);
      expect(manifest.catalogs[0].id).toBe('aiocatalogs-default');
      expect(manifest.catalogs[0].name).toBe('AIO Catalogs (No catalogs added yet)');
      expect((manifest as any).stremioAddonsConfig).toBeDefined();
    });

    it('should return a fallback manifest on error', () => {
      // Force an error by passing invalid data
      const manifest = buildManifest('user', '1.0.0', 'Test', null as any);

      expect(manifest.id).toBe(`${ADDON_ID}.user`);
      expect(manifest.catalogs).toHaveLength(1);
      expect(manifest.catalogs[0].id).toBe('error');
      expect((manifest as any).stremioAddonsConfig).toBeDefined();
    });
  });

  describe('handleCatalogRequest', () => {
    it('should fetch catalog data from the correct endpoint', async () => {
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

      const userCatalogs: CatalogManifest[] = [
        {
          id: 'source1',
          name: 'Source 1',
          description: 'Test Source',
          endpoint: 'https://example.com/addon',
          version: '1.0.0',
          resources: ['catalog'],
          types: ['movie'],
          catalogs: [{ type: 'movie', id: 'catalog1', name: 'Movies' }],
        },
      ];

      const args = {
        id: 'source1_catalog1',
        type: 'movie',
      };

      const result = await handleCatalogRequest(args, userCatalogs);

      expect(fetch).toHaveBeenCalledWith('https://example.com/addon/catalog/movie/catalog1.json');
      expect(result.metas).toEqual(mockData.metas);
    });

    it('should return empty metas array when source not found', async () => {
      const userCatalogs: CatalogManifest[] = [
        {
          id: 'source1',
          name: 'Source 1',
          description: 'Test Source',
          endpoint: 'https://example.com/addon',
          version: '1.0.0',
          resources: ['catalog'],
          types: ['movie'],
          catalogs: [{ type: 'movie', id: 'catalog1', name: 'Movies' }],
        },
      ];

      const args = {
        id: 'nonexistent_catalog1',
        type: 'movie',
      };

      const result = await handleCatalogRequest(args, userCatalogs);

      expect(result.metas).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should return empty metas array when catalog not found in source', async () => {
      const userCatalogs: CatalogManifest[] = [
        {
          id: 'source1',
          name: 'Source 1',
          description: 'Test Source',
          endpoint: 'https://example.com/addon',
          version: '1.0.0',
          resources: ['catalog'],
          types: ['movie'],
          catalogs: [{ type: 'movie', id: 'catalog1', name: 'Movies' }],
        },
      ];

      const args = {
        id: 'source1_nonexistent',
        type: 'movie',
      };

      const result = await handleCatalogRequest(args, userCatalogs);

      expect(result.metas).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should normalize endpoint URL with trailing slash', async () => {
      const mockData = { metas: [] };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const userCatalogs: CatalogManifest[] = [
        {
          id: 'source1',
          name: 'Source 1',
          description: 'Test Source',
          endpoint: 'https://example.com/addon/',
          version: '1.0.0',
          resources: ['catalog'],
          types: ['movie'],
          catalogs: [{ type: 'movie', id: 'catalog1', name: 'Movies' }],
        },
      ];

      const args = {
        id: 'source1_catalog1',
        type: 'movie',
      };

      await handleCatalogRequest(args, userCatalogs);

      expect(fetch).toHaveBeenCalledWith('https://example.com/addon/catalog/movie/catalog1.json');
    });

    it('should return empty metas array on fetch error', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Not Found',
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const userCatalogs: CatalogManifest[] = [
        {
          id: 'source1',
          name: 'Source 1',
          description: 'Test Source',
          endpoint: 'https://example.com/addon',
          version: '1.0.0',
          resources: ['catalog'],
          types: ['movie'],
          catalogs: [{ type: 'movie', id: 'catalog1', name: 'Movies' }],
        },
      ];

      const args = {
        id: 'source1_catalog1',
        type: 'movie',
      };

      const result = await handleCatalogRequest(args, userCatalogs);

      expect(result.metas).toEqual([]);
    });
  });
});
