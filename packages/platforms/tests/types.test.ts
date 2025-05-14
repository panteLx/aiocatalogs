import { describe, it, expect, vi } from 'vitest';
import { D1Database, Env } from '../cloudflare/types';
import {
  UserConfig,
  CatalogManifest,
  MetaPreviewItem,
  CatalogRequest,
  CatalogResponse,
  MetaItem,
} from '../../types/index';

describe('Cloudflare Types', () => {
  it('should define the D1Database interface', () => {
    // This test simply verifies that the type exists by creating a mock implementation
    const mockDb: D1Database = {
      prepare: vi.fn(),
      exec: vi.fn(),
      batch: vi.fn(),
      dump: vi.fn(),
      withSession: vi.fn(),
    };

    // Verify the mock has the expected methods
    expect(mockDb).toHaveProperty('prepare');
    expect(mockDb).toHaveProperty('exec');
    expect(mockDb).toHaveProperty('batch');
    expect(mockDb).toHaveProperty('dump');
    expect(mockDb).toHaveProperty('withSession');

    // Test method functionality
    mockDb.prepare('SELECT * FROM table');
    expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM table');

    mockDb.exec('INSERT INTO table VALUES (1)');
    expect(mockDb.exec).toHaveBeenCalledWith('INSERT INTO table VALUES (1)');

    const statement = { sql: 'SELECT 1', execute: vi.fn() } as any; // Mock D1PreparedStatement
    const statements = [statement, statement];
    mockDb.batch(statements);
    expect(mockDb.batch).toHaveBeenCalledWith(statements);
  });

  it('should define the Env interface', () => {
    // Create a mock Env object
    const mockEnv: Env = {
      DB: {} as D1Database,
      ENVIRONMENT: 'test',
      API_KEY: 'test-key',
    };

    // Verify the mock has the expected properties
    expect(mockEnv).toHaveProperty('DB');
    expect(typeof mockEnv.DB).toBe('object');

    // Test index signature works
    expect(mockEnv.ENVIRONMENT).toBe('test');
    expect(mockEnv.API_KEY).toBe('test-key');

    // Test adding additional properties via index signature
    mockEnv['CUSTOM_SETTING'] = 'custom value';
    expect(mockEnv.CUSTOM_SETTING).toBe('custom value');

    // Test with complex value
    mockEnv['CONFIG'] = { enabled: true, timeout: 30 };
    expect(mockEnv.CONFIG).toEqual({ enabled: true, timeout: 30 });
  });

  it('should re-export UserConfig type', () => {
    // Create a mock UserConfig with proper CatalogManifest objects
    const mockConfig: UserConfig = {
      catalogs: [
        {
          id: 'test-catalog',
          name: 'Test Catalog',
          description: 'Test catalog description',
          version: '1.0.0',
          resources: ['catalog'],
          types: ['movie'],
          catalogs: [
            {
              id: 'inner-catalog',
              type: 'movie',
              name: 'Inner Catalog',
            },
          ],
          endpoint: 'https://example.com/endpoint',
        },
      ],
    };

    expect(mockConfig).toHaveProperty('catalogs');
    expect(Array.isArray(mockConfig.catalogs)).toBe(true);

    // Test with empty catalogs
    const emptyConfig: UserConfig = {
      catalogs: [],
    };
    expect(emptyConfig).toHaveProperty('catalogs');
    expect(emptyConfig.catalogs.length).toBe(0);

    // Test with additional optional properties
    const configWithOptionals: any = {
      catalogs: [],
      lastUpdated: '2023-01-01',
      settings: {
        theme: 'dark',
        notifications: true,
      },
    };
    expect(configWithOptionals).toHaveProperty('lastUpdated');
    expect(configWithOptionals).toHaveProperty('settings');
  });

  it('should re-export CatalogManifest type', () => {
    // Create a mock CatalogManifest
    const mockManifest: CatalogManifest = {
      id: 'test-manifest',
      name: 'Test Manifest',
      version: '1.0.0',
      description: 'Test description',
      resources: ['catalog'],
      types: ['movie'],
      catalogs: [
        {
          id: 'test-catalog',
          type: 'movie',
          name: 'Test Movie Catalog',
        },
      ],
      endpoint: 'https://example.com/endpoint',
    };

    expect(mockManifest).toHaveProperty('id');
    expect(mockManifest).toHaveProperty('name');
    expect(mockManifest).toHaveProperty('version');
    expect(mockManifest).toHaveProperty('description');
    expect(mockManifest).toHaveProperty('resources');
    expect(mockManifest).toHaveProperty('types');
    expect(mockManifest).toHaveProperty('catalogs');
    expect(mockManifest).toHaveProperty('endpoint');

    // Test with multiple resources and types
    const mockManifestMultiple: CatalogManifest = {
      id: 'multiple-manifest',
      name: 'Multiple Resources Manifest',
      version: '1.0.0',
      description: 'Test with multiple resources and types',
      resources: ['catalog', 'meta', 'stream'],
      types: ['movie', 'series'],
      catalogs: [
        {
          id: 'movie-catalog',
          type: 'movie',
          name: 'Movies',
        },
        {
          id: 'series-catalog',
          type: 'series',
          name: 'TV Shows',
        },
      ],
      endpoint: 'https://example.com/endpoint',
    };

    expect(Array.isArray(mockManifestMultiple.resources)).toBe(true);
    expect(mockManifestMultiple.resources.length).toBe(3);
    expect(Array.isArray(mockManifestMultiple.types)).toBe(true);
    expect(mockManifestMultiple.types.length).toBe(2);
    expect(mockManifestMultiple.catalogs.length).toBe(2);

    // Test with behaviorHints
    const manifestWithBehaviorHints: CatalogManifest = {
      id: 'behavior-manifest',
      name: 'Manifest with Behavior Hints',
      version: '1.0.0',
      description: 'Test with behavior hints',
      resources: ['catalog'],
      types: ['movie'],
      catalogs: [],
      endpoint: 'https://example.com/endpoint',
      behaviorHints: {
        configurable: true,
        configurationRequired: false,
      } as any,
    };

    expect(manifestWithBehaviorHints).toHaveProperty('behaviorHints');
    expect((manifestWithBehaviorHints.behaviorHints as any)?.configurable).toBe(true);
    expect((manifestWithBehaviorHints.behaviorHints as any)?.configurationRequired).toBe(false);
  });

  it('should re-export MetaPreviewItem type', () => {
    // Create a mock MetaPreviewItem
    const mockMetaPreview: MetaPreviewItem = {
      id: 'tt1234567',
      type: 'movie',
      name: 'Test Movie',
      poster: 'https://example.com/poster.jpg',
    };

    expect(mockMetaPreview).toHaveProperty('id');
    expect(mockMetaPreview).toHaveProperty('type');
    expect(mockMetaPreview).toHaveProperty('name');
    expect(mockMetaPreview).toHaveProperty('poster');

    // Test with optional properties
    const mockMetaPreviewFull: any = {
      id: 'tt1234567',
      type: 'movie',
      name: 'Test Movie',
      poster: 'https://example.com/poster.jpg',
      posterShape: 'regular',
      logo: 'https://example.com/logo.png',
      description: 'Movie description',
      releaseInfo: '2023',
      runtime: '120 min',
      director: ['Director Name'],
      cast: ['Actor 1', 'Actor 2'],
      imdbRating: 8.5,
    };

    expect(mockMetaPreviewFull).toHaveProperty('posterShape');
    expect(mockMetaPreviewFull).toHaveProperty('logo');
    expect(mockMetaPreviewFull).toHaveProperty('description');
    expect(mockMetaPreviewFull).toHaveProperty('releaseInfo');
    expect(mockMetaPreviewFull).toHaveProperty('runtime');
    expect(mockMetaPreviewFull).toHaveProperty('director');
    expect(mockMetaPreviewFull).toHaveProperty('cast');
    expect(mockMetaPreviewFull).toHaveProperty('imdbRating');

    // Test with series type
    const seriesMetaPreview: any = {
      id: 'tt7890123',
      type: 'series',
      name: 'Test Series',
      poster: 'https://example.com/series_poster.jpg',
      videos: [
        { id: 'ep1', title: 'Episode 1', released: '2023-01-01' },
        { id: 'ep2', title: 'Episode 2', released: '2023-01-08' },
      ],
      releaseInfo: '2023',
    };

    expect(seriesMetaPreview.type).toBe('series');
    expect(seriesMetaPreview).toHaveProperty('videos');
    expect(Array.isArray(seriesMetaPreview.videos)).toBe(true);
    expect(seriesMetaPreview.videos?.length).toBe(2);
  });

  it('should re-export CatalogRequest type', () => {
    // Create a mock CatalogRequest
    const mockRequest: CatalogRequest = {
      type: 'movie',
      id: 'test-catalog',
      extra: {
        search: 'query',
      },
    };

    expect(mockRequest).toHaveProperty('type');
    expect(mockRequest).toHaveProperty('id');
    expect(mockRequest).toHaveProperty('extra');

    // Test with different types
    const seriesRequest: CatalogRequest = {
      type: 'series',
      id: 'series-catalog',
    };

    expect(seriesRequest.type).toBe('series');

    // Test with various extra parameters
    const requestWithExtras: CatalogRequest = {
      type: 'movie',
      id: 'movie-catalog',
      extra: {
        genre: 'action',
        year: '2023',
        skip: 10,
        limit: 20,
      },
    };

    expect(requestWithExtras.extra).toHaveProperty('genre');
    expect(requestWithExtras.extra).toHaveProperty('year');
    expect(requestWithExtras.extra).toHaveProperty('skip');
    expect(requestWithExtras.extra).toHaveProperty('limit');
  });

  it('should re-export CatalogResponse type', () => {
    // Create a mock CatalogResponse
    const mockResponse: CatalogResponse = {
      metas: [
        {
          id: 'tt1234567',
          type: 'movie',
          name: 'Test Movie',
          poster: 'https://example.com/poster.jpg',
        },
      ],
    };

    expect(mockResponse).toHaveProperty('metas');
    expect(Array.isArray(mockResponse.metas)).toBe(true);

    // Test with empty response
    const emptyResponse: CatalogResponse = {
      metas: [],
    };

    expect(emptyResponse.metas.length).toBe(0);

    // Test with multiple items
    const multipleItemsResponse: CatalogResponse = {
      metas: [
        {
          id: 'tt1111111',
          type: 'movie',
          name: 'Movie 1',
          poster: 'https://example.com/poster1.jpg',
        },
        {
          id: 'tt2222222',
          type: 'movie',
          name: 'Movie 2',
          poster: 'https://example.com/poster2.jpg',
        },
        {
          id: 'tt3333333',
          type: 'series',
          name: 'Series 1',
          poster: 'https://example.com/series1.jpg',
        },
      ],
    };

    expect(multipleItemsResponse.metas.length).toBe(3);
    expect(multipleItemsResponse.metas[0].id).toBe('tt1111111');
    expect(multipleItemsResponse.metas[2].type).toBe('series');
  });

  it('should re-export MetaItem type', () => {
    // Create a mock MetaItem
    const mockMetaItem: MetaItem = {
      id: 'tt1234567',
      type: 'movie',
      name: 'Test Movie',
      poster: 'https://example.com/poster.jpg',
      description: 'Test description',
      runtime: '120 min',
      releaseInfo: '2023',
    };

    expect(mockMetaItem).toHaveProperty('id');
    expect(mockMetaItem).toHaveProperty('type');
    expect(mockMetaItem).toHaveProperty('name');
    expect(mockMetaItem).toHaveProperty('poster');
    expect(mockMetaItem).toHaveProperty('description');
    expect(mockMetaItem).toHaveProperty('runtime');
    expect(mockMetaItem).toHaveProperty('releaseInfo');

    // Test with rich metadata
    const richMetaItem: MetaItem = {
      id: 'tt1234567',
      type: 'movie',
      name: 'Rich Test Movie',
      poster: 'https://example.com/rich_poster.jpg',
      background: 'https://example.com/background.jpg',
      logo: 'https://example.com/logo.png',
      videos: [
        {
          id: 'trailer',
          title: 'Trailer',
          thumbnail: 'https://example.com/trailer.jpg',
        },
      ],
      description: 'Rich description',
      runtime: '135 min',
      releaseInfo: '2023',
      director: ['Famous Director'],
      cast: ['Actor 1', 'Actor 2', 'Actor 3'],
      genres: ['Action', 'Drama'],
      imdbRating: '9.2',
      awards: 'Oscar Winner',
      country: 'USA',
      posterShape: 'landscape',
      trailers: [
        {
          source: 'youtube',
          id: 'abc123',
        },
      ],
    };

    expect(richMetaItem).toHaveProperty('background');
    expect(richMetaItem).toHaveProperty('logo');
    expect(richMetaItem).toHaveProperty('videos');
    expect(richMetaItem).toHaveProperty('director');
    expect(richMetaItem).toHaveProperty('cast');
    expect(richMetaItem).toHaveProperty('genres');
    expect(richMetaItem).toHaveProperty('imdbRating');
    expect(richMetaItem).toHaveProperty('awards');
    expect(richMetaItem).toHaveProperty('country');
    expect(richMetaItem).toHaveProperty('posterShape');
    expect(richMetaItem).toHaveProperty('trailers');

    // Test series specific properties
    const seriesMetaItem: MetaItem = {
      id: 'tt5555555',
      type: 'series',
      name: 'Test Series',
      poster: 'https://example.com/series_poster.jpg',
      description: 'Series description',
      releaseInfo: '2022-2023',
      videos: [
        { id: 's01e01', title: 'Episode 1', season: 1, episode: 1 },
        { id: 's01e02', title: 'Episode 2', season: 1, episode: 2 },
        { id: 's02e01', title: 'Episode 1', season: 2, episode: 1 },
      ],
      runtime: '60 min',
      season: 2,
      episodeCount: 10,
    };

    expect(seriesMetaItem.type).toBe('series');
    expect(seriesMetaItem).toHaveProperty('videos');
    expect(seriesMetaItem).toHaveProperty('season');
    expect(seriesMetaItem).toHaveProperty('episodeCount');
    expect(seriesMetaItem.videos?.length).toBe(3);
  });
});
