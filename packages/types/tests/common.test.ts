import { describe, test, expect } from 'vitest';
import {
  CatalogManifest,
  UserConfig,
  MetaPreviewItem,
  CatalogRequest,
  CatalogResponse,
  MetaItem,
} from '../common';

describe('Common Types', () => {
  describe('CatalogManifest', () => {
    test('should validate a valid CatalogManifest object', () => {
      const manifest: CatalogManifest = {
        id: 'test-catalog',
        name: 'Test Catalog',
        description: 'A test catalog',
        version: '1.0.0',
        resources: ['catalog'],
        types: ['movie', 'series'],
        catalogs: [
          { type: 'movie', id: 'test-movie', name: 'Test Movies' },
          { type: 'series', id: 'test-series', name: 'Test Series' },
        ],
        endpoint: 'https://example.com/manifest.json',
        idPrefixes: ['tt', 'kitsu'],
        behaviorHints: {
          adult: false,
          p2p: false,
        },
        customName: 'My Test Catalog',
      };

      // Type validation happens at compile time, so we're just making sure the object is structured correctly
      expect(manifest).toHaveProperty('id');
      expect(manifest).toHaveProperty('name');
      expect(manifest).toHaveProperty('description');
      expect(manifest).toHaveProperty('version');
      expect(manifest).toHaveProperty('resources');
      expect(manifest).toHaveProperty('types');
      expect(manifest).toHaveProperty('catalogs');
      expect(manifest).toHaveProperty('endpoint');
      expect(Array.isArray(manifest.resources)).toBe(true);
      expect(Array.isArray(manifest.types)).toBe(true);
      expect(Array.isArray(manifest.catalogs)).toBe(true);
    });

    test('should validate a minimal CatalogManifest object', () => {
      const minimalManifest: CatalogManifest = {
        id: 'minimal-catalog',
        name: 'Minimal Catalog',
        description: 'A minimal catalog',
        version: '1.0.0',
        resources: ['catalog'],
        types: ['movie'],
        catalogs: [{ type: 'movie', id: 'movie-catalog', name: 'Movies' }],
        endpoint: 'https://example.com/manifest.json',
      };

      expect(minimalManifest).toHaveProperty('id');
      expect(minimalManifest).toHaveProperty('name');
      expect(minimalManifest).toHaveProperty('endpoint');
      expect(minimalManifest.idPrefixes).toBeUndefined();
      expect(minimalManifest.behaviorHints).toBeUndefined();
      expect(minimalManifest.customName).toBeUndefined();
    });

    test('should validate CatalogManifest with context', () => {
      const manifestWithContext: CatalogManifest = {
        id: 'context-catalog',
        name: 'Context Catalog',
        description: 'A catalog with context',
        version: '1.0.0',
        resources: ['catalog'],
        types: ['movie'],
        catalogs: [{ type: 'movie', id: 'movie-catalog', name: 'Movies' }],
        endpoint: 'https://example.com/manifest.json',
        context: {
          apiKey: 'secret-api-key',
          region: 'US',
          settings: {
            preferredQuality: 'HD',
          },
        },
      };

      expect(manifestWithContext).toHaveProperty('context');
      expect(manifestWithContext.context).toHaveProperty('apiKey');
      expect(manifestWithContext.context).toHaveProperty('region');
      expect(manifestWithContext.context).toHaveProperty('settings');
      expect(manifestWithContext.context.settings).toHaveProperty('preferredQuality');
    });
  });

  describe('UserConfig', () => {
    test('should validate a valid UserConfig object', () => {
      const userConfig: UserConfig = {
        catalogs: [
          {
            id: 'test-catalog',
            name: 'Test Catalog',
            description: 'A test catalog',
            version: '1.0.0',
            resources: ['catalog'],
            types: ['movie', 'series'],
            catalogs: [{ type: 'movie', id: 'test-movie', name: 'Test Movies' }],
            endpoint: 'https://example.com/manifest.json',
          },
        ],
        catalogOrder: ['test-catalog'],
        randomizedCatalogs: ['test-catalog'],
        _cachedAt: Date.now(),
      };

      expect(userConfig).toHaveProperty('catalogs');
      expect(Array.isArray(userConfig.catalogs)).toBe(true);
      expect(userConfig.catalogs.length).toBeGreaterThan(0);

      if (userConfig.catalogOrder) {
        expect(Array.isArray(userConfig.catalogOrder)).toBe(true);
      }

      if (userConfig.randomizedCatalogs) {
        expect(Array.isArray(userConfig.randomizedCatalogs)).toBe(true);
      }
    });

    test('should validate a minimal UserConfig object', () => {
      const minimalUserConfig: UserConfig = {
        catalogs: [
          {
            id: 'minimal-catalog',
            name: 'Minimal Catalog',
            description: 'A minimal catalog',
            version: '1.0.0',
            resources: ['catalog'],
            types: ['movie'],
            catalogs: [{ type: 'movie', id: 'movie-catalog', name: 'Movies' }],
            endpoint: 'https://example.com/manifest.json',
          },
        ],
      };

      expect(minimalUserConfig).toHaveProperty('catalogs');
      expect(minimalUserConfig.catalogOrder).toBeUndefined();
      expect(minimalUserConfig.randomizedCatalogs).toBeUndefined();
      expect(minimalUserConfig._cachedAt).toBeUndefined();
    });

    test('should validate UserConfig with empty catalogs array', () => {
      const emptyUserConfig: UserConfig = {
        catalogs: [],
      };

      expect(emptyUserConfig).toHaveProperty('catalogs');
      expect(Array.isArray(emptyUserConfig.catalogs)).toBe(true);
      expect(emptyUserConfig.catalogs.length).toBe(0);
    });
  });

  describe('MetaPreviewItem', () => {
    test('should validate a valid MetaPreviewItem object', () => {
      const metaPreview: MetaPreviewItem = {
        id: 'tt1234567',
        type: 'movie',
        name: 'Test Movie',
        poster: 'https://example.com/poster.jpg',
        background: 'https://example.com/background.jpg',
        logo: 'https://example.com/logo.jpg',
        description: 'A test movie description',
      };

      expect(metaPreview).toHaveProperty('id');
      expect(metaPreview).toHaveProperty('type');
      expect(metaPreview).toHaveProperty('name');
      expect(typeof metaPreview.id).toBe('string');
      expect(typeof metaPreview.type).toBe('string');
      expect(typeof metaPreview.name).toBe('string');
    });

    test('should validate MetaPreviewItem with minimal properties', () => {
      const minimalMetaPreview: MetaPreviewItem = {
        id: 'tt1234567',
        type: 'movie',
        name: 'Test Movie',
      };

      expect(minimalMetaPreview).toHaveProperty('id');
      expect(minimalMetaPreview).toHaveProperty('type');
      expect(minimalMetaPreview).toHaveProperty('name');
      expect(minimalMetaPreview.poster).toBeUndefined();
      expect(minimalMetaPreview.background).toBeUndefined();
      expect(minimalMetaPreview.logo).toBeUndefined();
      expect(minimalMetaPreview.description).toBeUndefined();
    });
  });

  describe('CatalogRequest', () => {
    test('should validate a valid CatalogRequest object', () => {
      const request: CatalogRequest = {
        type: 'movie',
        id: 'test-catalog',
        extra: {
          skip: 0,
          limit: 100,
          genre: 'Action',
        },
      };

      expect(request).toHaveProperty('type');
      expect(request).toHaveProperty('id');
      expect(typeof request.type).toBe('string');
      expect(typeof request.id).toBe('string');
    });

    test('should validate CatalogRequest without extra', () => {
      const minimalRequest: CatalogRequest = {
        type: 'movie',
        id: 'test-catalog',
      };

      expect(minimalRequest).toHaveProperty('type');
      expect(minimalRequest).toHaveProperty('id');
      expect(minimalRequest.extra).toBeUndefined();
    });

    test('should validate CatalogRequest with complex extra parameters', () => {
      const requestWithComplexExtra: CatalogRequest = {
        type: 'series',
        id: 'test-catalog',
        extra: {
          skip: 0,
          limit: 100,
          genre: ['Action', 'Drama'],
          country: 'US',
          search: 'test query',
          sort: {
            field: 'popularity',
            order: 'desc',
          },
          filters: {
            year: {
              min: 2010,
              max: 2023,
            },
            rating: {
              min: 7,
            },
          },
        },
      };

      expect(requestWithComplexExtra).toHaveProperty('extra');
      expect(requestWithComplexExtra.extra).toHaveProperty('genre');
      expect(requestWithComplexExtra.extra).toHaveProperty('sort');
      expect(requestWithComplexExtra.extra).toHaveProperty('filters');
      expect(requestWithComplexExtra.extra.filters).toHaveProperty('year');
      expect(requestWithComplexExtra.extra.filters).toHaveProperty('rating');
    });
  });

  describe('CatalogResponse', () => {
    test('should validate a valid CatalogResponse object', () => {
      const response: CatalogResponse = {
        metas: [
          {
            id: 'tt1234567',
            type: 'movie',
            name: 'Test Movie',
            poster: 'https://example.com/poster.jpg',
          },
        ],
      };

      expect(response).toHaveProperty('metas');
      expect(Array.isArray(response.metas)).toBe(true);
    });

    test('should validate CatalogResponse with empty metas array', () => {
      const emptyResponse: CatalogResponse = {
        metas: [],
      };

      expect(emptyResponse).toHaveProperty('metas');
      expect(Array.isArray(emptyResponse.metas)).toBe(true);
      expect(emptyResponse.metas.length).toBe(0);
    });

    test('should validate CatalogResponse with multiple metas', () => {
      const multipleMetasResponse: CatalogResponse = {
        metas: [
          {
            id: 'tt1234567',
            type: 'movie',
            name: 'Test Movie 1',
          },
          {
            id: 'tt7654321',
            type: 'movie',
            name: 'Test Movie 2',
            poster: 'https://example.com/poster2.jpg',
          },
          {
            id: 'tt9876543',
            type: 'series',
            name: 'Test Series',
            description: 'A test series description',
          },
        ],
      };

      expect(multipleMetasResponse).toHaveProperty('metas');
      expect(Array.isArray(multipleMetasResponse.metas)).toBe(true);
      expect(multipleMetasResponse.metas.length).toBe(3);
      expect(multipleMetasResponse.metas[0].type).toBe('movie');
      expect(multipleMetasResponse.metas[2].type).toBe('series');
    });
  });

  describe('MetaItem', () => {
    test('should validate a valid MetaItem object', () => {
      const metaItem: MetaItem = {
        id: 'tt1234567',
        type: 'movie',
        name: 'Test Movie',
        poster: 'https://example.com/poster.jpg',
        releaseInfo: '2023',
        imdbRating: '8.5',
        director: ['Director Name'],
        cast: ['Actor 1', 'Actor 2'],
        genres: ['Action', 'Drama'],
        sourceAddon: 'test-addon',
      };

      expect(metaItem).toHaveProperty('id');
      expect(metaItem).toHaveProperty('type');
      expect(metaItem).toHaveProperty('name');
      expect(typeof metaItem.id).toBe('string');
      expect(typeof metaItem.type).toBe('string');
      expect(typeof metaItem.name).toBe('string');

      if (metaItem.releaseInfo) {
        expect(typeof metaItem.releaseInfo).toBe('string');
      }

      if (metaItem.genres) {
        expect(Array.isArray(metaItem.genres)).toBe(true);
      }
    });

    test('should support additional properties', () => {
      const metaItem: MetaItem = {
        id: 'tt1234567',
        type: 'movie',
        name: 'Test Movie',
        customProperty: 'custom value',
        anotherProperty: 42,
      };

      expect(metaItem).toHaveProperty('id');
      expect(metaItem).toHaveProperty('type');
      expect(metaItem).toHaveProperty('name');
      expect(metaItem).toHaveProperty('customProperty');
      expect(metaItem).toHaveProperty('anotherProperty');
      expect(metaItem.customProperty).toBe('custom value');
      expect(metaItem.anotherProperty).toBe(42);
    });

    test('should validate MetaItem inheriting from MetaPreviewItem', () => {
      const metaItem: MetaItem = {
        id: 'tt1234567',
        type: 'movie',
        name: 'Test Movie',
        poster: 'https://example.com/poster.jpg',
        background: 'https://example.com/background.jpg',
        logo: 'https://example.com/logo.jpg',
        description: 'A test movie description',
        releaseInfo: '2023',
        imdbRating: '8.5',
      };

      // Check MetaPreviewItem properties
      expect(metaItem).toHaveProperty('id');
      expect(metaItem).toHaveProperty('type');
      expect(metaItem).toHaveProperty('name');
      expect(metaItem).toHaveProperty('poster');
      expect(metaItem).toHaveProperty('background');
      expect(metaItem).toHaveProperty('logo');
      expect(metaItem).toHaveProperty('description');

      // Check MetaItem additional properties
      expect(metaItem).toHaveProperty('releaseInfo');
      expect(metaItem).toHaveProperty('imdbRating');
    });

    test('should validate different types of MetaItem', () => {
      const movieMeta: MetaItem = {
        id: 'tt1234567',
        type: 'movie',
        name: 'Test Movie',
        releaseInfo: '2023',
      };

      const seriesMeta: MetaItem = {
        id: 'tt7654321',
        type: 'series',
        name: 'Test Series',
        releaseInfo: '2020-2023',
        videos: [
          { id: 's1e1', name: 'Episode 1', season: 1, episode: 1 },
          { id: 's1e2', name: 'Episode 2', season: 1, episode: 2 },
        ],
      };

      expect(movieMeta.type).toBe('movie');
      expect(seriesMeta.type).toBe('series');
      expect(seriesMeta).toHaveProperty('videos');
      expect(Array.isArray(seriesMeta.videos)).toBe(true);
    });
  });
});
