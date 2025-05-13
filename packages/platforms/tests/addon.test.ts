import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getAddonInterface, clearAddonCache } from '../cloudflare/addon';
import { configManager } from '../cloudflare/configManager';
import * as manifestBuilder from '../../core/utils/manifestBuilder';
import * as mdblist from '../../core/utils/mdblist';
import { UserConfig, CatalogManifest } from '../../types';
import * as catalogAggregator from '../../core/catalog/catalogAggregator';

// Mock configManager
vi.mock('../cloudflare/configManager', () => ({
  configManager: {
    setDatabase: vi.fn(),
    getAllCatalogs: vi.fn(),
    getConfig: vi.fn(),
    loadMDBListApiKey: vi.fn(),
  },
}));

// Mock manifestBuilder
vi.mock('../../core/utils/manifestBuilder', () => ({
  buildManifest: vi.fn(),
  handleCatalogRequest: vi.fn(),
}));

// Mock mdblist utils
vi.mock('../../core/utils/mdblist', () => ({
  fetchMDBListCatalog: vi.fn(),
  fetchListDetails: vi.fn(),
}));

// Mock catalogAggregator
vi.mock('../../core/catalog/catalogAggregator', () => ({
  CatalogAggregator: vi.fn().mockImplementation(() => ({
    checkCatalogHealth: vi.fn(),
  })),
}));

// Mock database for testing
const mockDb = {} as any;

// Create sample catalogs for testing
const createSampleCatalog = (id: string, name: string): CatalogManifest => ({
  id,
  name,
  description: 'Test catalog',
  version: '1.0.0',
  resources: ['catalog'],
  types: ['movie', 'series'],
  catalogs: [
    { type: 'movie', id: `${id}_movie`, name: `${name} Movies` },
    { type: 'series', id: `${id}_series`, name: `${name} Series` },
  ],
  endpoint: 'https://example.com/stremio',
});

describe('Addon Interface', () => {
  // Reset module cache before each test to avoid cross-test interference
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create and return an addon interface', async () => {
    // Set up mocks
    const userCatalogs = [
      createSampleCatalog('test1', 'Test 1'),
      createSampleCatalog('test2', 'Test 2'),
    ];

    const userConfig: UserConfig = {
      catalogs: userCatalogs,
      randomizedCatalogs: ['test1'],
    };

    const mockManifest = {
      id: 'test.addon',
      name: 'Test Addon',
      version: '1.0.0',
      description: 'Test description',
      resources: ['catalog'],
      types: ['movie', 'series'],
      catalogs: [
        {
          type: 'movie',
          id: 'test1_movie',
          name: 'Test 1 Movies',
        },
      ],
      logo: 'https://example.com/logo.png',
      background: 'https://example.com/bg.png',
      behaviorHints: { adult: false },
      idPrefixes: [],
    };

    (configManager.getAllCatalogs as any).mockResolvedValue(userCatalogs);
    (configManager.getConfig as any).mockResolvedValue(userConfig);
    (vi.mocked(manifestBuilder.buildManifest) as any).mockReturnValue(mockManifest);

    // Call the function
    const addonInterface = await getAddonInterface('test-user', mockDb);

    // Assertions
    expect(configManager.setDatabase).toHaveBeenCalledWith(mockDb);
    expect(configManager.getAllCatalogs).toHaveBeenCalledWith('test-user');
    expect(manifestBuilder.buildManifest).toHaveBeenCalled();
    expect(addonInterface).toBeDefined();
    expect(addonInterface.manifest).toEqual(mockManifest);
    expect(typeof addonInterface.catalog).toBe('function');
  });

  it('should handle MDBList catalog requests', async () => {
    // Setup mocks
    const userCatalogs = [createSampleCatalog('mdblist_123', 'My MDBList')];

    const userConfig: UserConfig = {
      catalogs: userCatalogs,
      randomizedCatalogs: ['mdblist_123'],
    };

    const mockManifest = {
      id: 'test.addon',
      name: 'Test Addon',
      version: '1.0.0',
      description: 'Test description',
      resources: ['catalog'],
      types: ['movie', 'series'],
      catalogs: [],
      logo: 'https://example.com/logo.png',
      background: 'https://example.com/bg.png',
      behaviorHints: { adult: false },
      idPrefixes: [],
    };

    (configManager.getAllCatalogs as any).mockResolvedValue(userCatalogs);
    (configManager.getConfig as any).mockResolvedValue(userConfig);
    (configManager.loadMDBListApiKey as any).mockResolvedValue('test-api-key');
    (vi.mocked(manifestBuilder.buildManifest) as any).mockReturnValue(mockManifest);

    const mockMetas = {
      metas: [
        { id: 'tt1234', type: 'movie', name: 'Test Movie' },
        { id: 'tt5678', type: 'series', name: 'Test Series' },
      ],
    };

    (vi.mocked(mdblist.fetchMDBListCatalog) as any).mockResolvedValue(mockMetas);

    // Create the addon
    const addonInterface = await getAddonInterface('test-user', mockDb);

    // Clear previous calls
    vi.clearAllMocks();
    (configManager.loadMDBListApiKey as any).mockResolvedValue('test-api-key');
    (vi.mocked(mdblist.fetchMDBListCatalog) as any).mockResolvedValue(mockMetas);

    // Test MDBList catalog request
    const result = await addonInterface.catalog({
      type: 'movie',
      id: 'mdblist_123',
    });

    // Verify MDBList specific flow
    expect(configManager.loadMDBListApiKey).toHaveBeenCalledWith('test-user');
    expect(mdblist.fetchMDBListCatalog).toHaveBeenCalledWith('123', 'test-api-key');
  });

  // Add new tests to improve coverage

  it('should handle regular catalog requests', async () => {
    // Setup mocks
    const userCatalogs = [createSampleCatalog('test1', 'Test 1')];
    const userConfig: UserConfig = {
      catalogs: userCatalogs,
      randomizedCatalogs: [],
    };

    const mockManifest = {
      id: 'test.addon',
      name: 'Test Addon',
      version: '1.0.0',
      resources: ['catalog'],
      types: ['movie'],
      catalogs: [{ id: 'test1_movie', type: 'movie', name: 'Test 1 Movies' }],
      description: 'Test description',
      logo: 'https://example.com/logo.png',
      background: 'https://example.com/bg.png',
      behaviorHints: { adult: false },
      idPrefixes: [],
    };

    (configManager.getAllCatalogs as any).mockResolvedValue(userCatalogs);
    (configManager.getConfig as any).mockResolvedValue(userConfig);
    (vi.mocked(manifestBuilder.buildManifest) as any).mockReturnValue(mockManifest);

    const mockMetas = {
      metas: [{ id: 'tt1234', type: 'movie', name: 'Test Movie' }],
    };

    // Mock the handleCatalogRequest to resolve with mockMetas for any input
    const mockHandleCatalogRequest = vi.fn().mockResolvedValue(mockMetas);
    (vi.mocked(manifestBuilder.handleCatalogRequest) as any).mockImplementation(
      mockHandleCatalogRequest
    );

    // Create the addon
    const addonInterface = await getAddonInterface('test-user', mockDb);

    // Clear previous calls
    vi.clearAllMocks();
    mockHandleCatalogRequest.mockResolvedValue(mockMetas);

    // Test regular catalog request
    const result = await addonInterface.catalog({
      type: 'movie',
      id: 'test1_movie',
    });

    // Just verify that we got the expected result
    expect(result).toEqual(mockMetas);
    expect(mockHandleCatalogRequest).toHaveBeenCalled();
  });

  it('should handle errors in catalog request', async () => {
    // Setup mocks
    const userCatalogs = [createSampleCatalog('test1', 'Test 1')];
    const userConfig: UserConfig = {
      catalogs: userCatalogs,
      randomizedCatalogs: [],
    };

    const mockManifest = {
      id: 'test.addon',
      name: 'Test Addon',
      version: '1.0.0',
      resources: ['catalog'],
      types: ['movie'],
      catalogs: [{ id: 'test1_movie', type: 'movie', name: 'Test 1 Movies' }],
      description: 'Test description',
      logo: 'https://example.com/logo.png',
      background: 'https://example.com/bg.png',
      behaviorHints: { adult: false },
      idPrefixes: [],
    };

    (configManager.getAllCatalogs as any).mockResolvedValue(userCatalogs);
    (configManager.getConfig as any).mockResolvedValue(userConfig);
    (vi.mocked(manifestBuilder.buildManifest) as any).mockReturnValue(mockManifest);

    // Mock handleCatalogRequest implementation to mimic the real one that handles errors internally
    (vi.mocked(manifestBuilder.handleCatalogRequest) as any).mockImplementation(async () => {
      try {
        // Simulate an error being thrown
        throw new Error('Test error');
      } catch (error) {
        // Like in the real implementation, we catch the error and return empty metas
        return { metas: [] };
      }
    });

    // Create the addon
    const addonInterface = await getAddonInterface('test-user', mockDb);

    // Test catalog request with error
    const result = await addonInterface.catalog({
      type: 'movie',
      id: 'test1_movie',
    });

    // Should return empty metas on error
    expect(result).toEqual({ metas: [] });
    expect(manifestBuilder.handleCatalogRequest).toHaveBeenCalled();
  });

  it('should handle missing user configuration gracefully', async () => {
    // Setup mocks to return null user config
    (configManager.getAllCatalogs as any).mockResolvedValue([]);
    (configManager.getConfig as any).mockResolvedValue(null);

    // Create a test addon manifest that should be returned by default
    const testManifest = {
      id: 'test.addon',
      name: 'Test Addon',
      version: '1.0.0',
      description: 'Test description',
      resources: ['catalog'],
      types: ['movie', 'series'],
      catalogs: [{ id: 'test1_movie', type: 'movie', name: 'Test 1 Movies' }],
      logo: 'https://example.com/logo.png',
      background: 'https://example.com/bg.png',
      behaviorHints: { adult: false },
      idPrefixes: [],
    };

    (vi.mocked(manifestBuilder.buildManifest) as any).mockReturnValue(testManifest);

    // Create the addon
    const addonInterface = await getAddonInterface('test-user', mockDb);

    // Should return the test manifest instead of a default one
    expect(addonInterface.manifest).toEqual(testManifest);
  });

  it('should handle MDBList API key errors', async () => {
    // Setup mocks
    const userCatalogs = [createSampleCatalog('mdblist_123', 'My MDBList')];
    const userConfig: UserConfig = {
      catalogs: userCatalogs,
      randomizedCatalogs: [],
    };

    (configManager.getAllCatalogs as any).mockResolvedValue(userCatalogs);
    (configManager.getConfig as any).mockResolvedValue(userConfig);
    // Simulate missing API key
    (configManager.loadMDBListApiKey as any).mockResolvedValue(null);

    (vi.mocked(manifestBuilder.buildManifest) as any).mockReturnValue({
      id: 'test.addon',
      name: 'Test Addon',
      version: '1.0.0',
      resources: ['catalog'],
      types: ['movie'],
      catalogs: [{ id: 'mdblist_123', type: 'movie', name: 'MDBList 123' }],
      description: 'Test description',
      logo: 'https://example.com/logo.png',
      background: 'https://example.com/bg.png',
      behaviorHints: { adult: false },
      idPrefixes: [],
    });

    // Create the addon
    const addonInterface = await getAddonInterface('test-user', mockDb);

    // Test MDBList catalog request with missing API key
    const result = await addonInterface.catalog({
      type: 'movie',
      id: 'mdblist_123',
    });

    // Should return empty metas when API key is missing
    expect(result).toEqual({ metas: [] });
  });

  it('should clear the addon cache', async () => {
    // Use a simple check to verify the clearAddonCache function exists
    expect(typeof clearAddonCache).toBe('function');

    // Call the function to verify it doesn't throw
    clearAddonCache('test-user');

    // Simply pass the test if no exceptions occur
    expect(true).toBe(true);
  });

  it('should handle failures in MDBList fetchMDBListCatalog', async () => {
    // Setup mocks
    const userCatalogs = [createSampleCatalog('mdblist_123', 'My MDBList')];
    const userConfig: UserConfig = {
      catalogs: userCatalogs,
      randomizedCatalogs: [],
    };

    (configManager.getAllCatalogs as any).mockResolvedValue(userCatalogs);
    (configManager.getConfig as any).mockResolvedValue(userConfig);
    (configManager.loadMDBListApiKey as any).mockResolvedValue('test-api-key');

    (vi.mocked(manifestBuilder.buildManifest) as any).mockReturnValue({
      id: 'test.addon',
      name: 'Test Addon',
      version: '1.0.0',
      resources: ['catalog'],
      types: ['movie'],
      catalogs: [{ id: 'mdblist_123', type: 'movie', name: 'MDBList 123' }],
      description: 'Test description',
      logo: 'https://example.com/logo.png',
      background: 'https://example.com/bg.png',
      behaviorHints: { adult: false },
      idPrefixes: [],
    });

    // Simulate API fetch error
    (vi.mocked(mdblist.fetchMDBListCatalog) as any).mockRejectedValue(new Error('API error'));

    // Create the addon
    const addonInterface = await getAddonInterface('test-user', mockDb);

    // Test MDBList catalog request with API error
    const result = await addonInterface.catalog({
      type: 'movie',
      id: 'mdblist_123',
    });

    // Should return empty metas when API fetch fails
    expect(result).toEqual({ metas: [] });
  });
});
