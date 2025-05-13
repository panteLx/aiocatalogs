import { describe, test, expect } from 'vitest';
import * as indexExports from '../index';
import * as commonExports from '../common';

describe('Index Module', () => {
  test('should re-export all types from common.ts', () => {
    // Get the names of all exports from common
    const commonExportNames = Object.keys(commonExports);

    // Get the names of all exports from index
    const indexExportNames = Object.keys(indexExports);

    // Verify that all common exports are re-exported from index
    for (const exportName of commonExportNames) {
      expect(indexExportNames).toContain(exportName);
    }

    // Verify counts match
    expect(indexExportNames.length).toBe(commonExportNames.length);
  });

  test('should allow using CatalogManifest type', () => {
    const testManifest: indexExports.CatalogManifest = {
      id: 'test-id',
      name: 'Test Catalog',
      description: 'Test Description',
      version: '1.0.0',
      resources: ['catalog'],
      types: ['movie'],
      catalogs: [{ type: 'movie', id: 'movie-catalog', name: 'Movies' }],
      endpoint: 'https://example.com/manifest.json',
    };

    expect(testManifest.id).toBe('test-id');
  });

  test('should allow using UserConfig type', () => {
    const testManifest: indexExports.CatalogManifest = {
      id: 'test-id',
      name: 'Test Catalog',
      description: 'Test Description',
      version: '1.0.0',
      resources: ['catalog'],
      types: ['movie'],
      catalogs: [{ type: 'movie', id: 'movie-catalog', name: 'Movies' }],
      endpoint: 'https://example.com/manifest.json',
    };

    const testConfig: indexExports.UserConfig = {
      catalogs: [testManifest],
      catalogOrder: ['test-id'],
      randomizedCatalogs: [],
      _cachedAt: Date.now(),
    };

    expect(Array.isArray(testConfig.catalogs)).toBe(true);
  });

  test('should allow using MetaPreviewItem type', () => {
    const testMetaPreview: indexExports.MetaPreviewItem = {
      id: 'tt1234567',
      type: 'movie',
      name: 'Test Movie',
      poster: 'https://example.com/poster.jpg',
      description: 'A test movie',
    };

    expect(testMetaPreview.id).toBe('tt1234567');
    expect(testMetaPreview.type).toBe('movie');
  });

  test('should allow using CatalogRequest type', () => {
    const testRequest: indexExports.CatalogRequest = {
      type: 'movie',
      id: 'test-catalog',
      extra: {
        skip: 0,
        limit: 100,
      },
    };

    expect(testRequest.type).toBe('movie');
    expect(testRequest.id).toBe('test-catalog');
  });

  test('should allow using CatalogResponse type', () => {
    const testResponse: indexExports.CatalogResponse = {
      metas: [
        {
          id: 'tt1234567',
          type: 'movie',
          name: 'Test Movie',
        },
      ],
    };

    expect(Array.isArray(testResponse.metas)).toBe(true);
    expect(testResponse.metas.length).toBe(1);
  });

  test('should allow using MetaItem type', () => {
    const testMetaItem: indexExports.MetaItem = {
      id: 'tt1234567',
      type: 'movie',
      name: 'Test Movie',
      releaseInfo: '2023',
      imdbRating: '8.5',
      genres: ['Action', 'Sci-Fi'],
    };

    expect(testMetaItem.id).toBe('tt1234567');
    expect(testMetaItem.type).toBe('movie');
    expect(Array.isArray(testMetaItem.genres)).toBe(true);
  });
});
