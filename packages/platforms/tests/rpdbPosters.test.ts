import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPosterUrls } from '../../core/utils/posterUtils';
import { loadUserRPDBApiKey } from '../../api/routes/rpdbRoutes';
import { MetaItem } from '../cloudflare/types';

// Mock the posterUtils module
vi.mock('../../core/utils/posterUtils', () => ({
  processPosterUrls: vi.fn(),
}));

// Mock the rpdbRoutes module
vi.mock('../../api/routes/rpdbRoutes', () => ({
  loadUserRPDBApiKey: vi.fn(),
}));

// Mock the configManager
vi.mock('../cloudflare/configManager', () => ({
  configManager: {
    loadMDBListApiKey: vi.fn().mockResolvedValue('mock-api-key'),
    getAllCatalogs: vi.fn().mockResolvedValue([]),
    getConfig: vi.fn().mockResolvedValue({ randomizedCatalogs: [] }),
    setDatabase: vi.fn(),
  },
}));

// Mock the mdblist utilities
vi.mock('../../core/utils/mdblist', () => ({
  fetchMDBListCatalog: vi.fn().mockResolvedValue({ metas: [] }),
  fetchListDetails: vi.fn(),
}));

// Mock the manifestBuilder
vi.mock('../../core/utils/manifestBuilder', () => ({
  buildManifest: vi.fn().mockReturnValue({}),
  handleCatalogRequest: vi.fn().mockResolvedValue({ metas: [] }),
}));

// Mock logger
vi.mock('../../core/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Test the integration between addon.ts and the RPDB poster functionality
describe('RPDB Posters Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should apply RPDB posters when processing catalog requests', async () => {
    // Create mock data
    const mockUserId = 'test-user';
    const mockApiKey = 'test-rpdb-api-key';
    const mockMetas = [
      {
        id: 'tt1234567',
        type: 'movie',
        name: 'Test Movie 1',
        poster: 'https://example.com/poster1.jpg',
      },
      {
        id: 'tt7654321',
        type: 'movie',
        name: 'Test Movie 2',
        poster: 'https://example.com/poster2.jpg',
      },
    ];

    // Mock the loadUserRPDBApiKey to return our test API key
    vi.mocked(loadUserRPDBApiKey).mockResolvedValue(mockApiKey);

    // Mock processPosterUrls to return processed metas
    const processedMetas = [
      {
        id: 'tt1234567',
        type: 'movie',
        name: 'Test Movie 1',
        poster: 'https://rpdb.com/poster1.jpg',
      },
      {
        id: 'tt7654321',
        type: 'movie',
        name: 'Test Movie 2',
        poster: 'https://rpdb.com/poster2.jpg',
      },
    ];
    vi.mocked(processPosterUrls).mockReturnValue(processedMetas);

    // Mock handleCatalogRequest to return metas
    const { handleCatalogRequest } = await import('../../core/utils/manifestBuilder');
    vi.mocked(handleCatalogRequest).mockResolvedValue({ metas: mockMetas });

    // Create a mock for Response constructor
    const mockResponseJson = vi.fn();
    const mockResponse = {
      status: 200,
      headers: { 'content-type': 'application/json' },
      json: mockResponseJson,
    };
    global.Response = vi.fn().mockImplementation(() => mockResponse) as any;

    // Import the handleAddonResource function after all mocks are set up
    const { handleAddonResource } = await import('../cloudflare/addon');

    // Create a mock request
    const mockRequest = {
      url: `http://example.com/${mockUserId}/catalog/movie/regular_catalog.json`,
    };

    // Call the handleAddonResource function
    await handleAddonResource(mockRequest, mockUserId);

    // Verify API key was loaded
    expect(loadUserRPDBApiKey).toHaveBeenCalledWith(mockUserId);

    // Check that processPosterUrls was called
    expect(processPosterUrls).toHaveBeenCalled();
  });
});
