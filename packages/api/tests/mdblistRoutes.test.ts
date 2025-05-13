import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loadUserMDBListApiKey,
  getMDBListSearch,
  getMDBListTop100,
  addMDBListCatalog,
  saveMDBListConfig,
} from '../routes/mdblistRoutes';
import { configManager } from '../../../packages/platforms/cloudflare/configManager';
import * as mdblistUtils from '../../../packages/core/utils/mdblist';
import * as templates from '../../../templates/mdblistTemplates';
import * as addonUtils from '../../../packages/platforms/cloudflare/addon';
import { appConfig } from '../../../packages/platforms/cloudflare/appConfig';

// Define interfaces for our mock objects that match the actual implementations
interface MDBListCatalog {
  id: string;
  name: string;
  type: string;
  user: {
    name: string;
    id: string;
  };
  itemCount: number;
  likes: number;
  mdblistUrl: string;
  slug?: string;
  mdblistId?: number;
}

interface StremioMeta {
  id: string;
  name: string;
  type: string;
  poster?: string;
  genres?: string[];
  releaseInfo?: string;
}

interface MDBListDetails {
  id?: number;
  name: string;
  mediatype?: string;
  user_id?: string;
  user_name?: string;
  items?: number;
  likes?: number;
  slug?: string;
}

// Get access to the private sanitizeRedirect function
// We'll do this by creating a test-only version
function sanitizeRedirect(referrer: string, fallback: string): string {
  try {
    // Use the request's host as the base for parsing
    const baseUrl = new URL(referrer);

    // Create an array of trusted origins
    const trustedOrigins = [
      // Add trusted origins for testing
      'https://example.com',
      'https://aiocatalogs.com',
      ...(appConfig.app.trustedOrigins || []),
    ].filter(Boolean);

    // Check if the URL's origin is in our list of trusted origins
    if (!trustedOrigins.includes(baseUrl.origin)) throw new Error();

    return baseUrl.pathname + (baseUrl.search || '');
  } catch {
    return fallback;
  }
}

// Mock the required dependencies
vi.mock('../../../packages/platforms/cloudflare/configManager', () => ({
  configManager: {
    loadMDBListApiKey: vi.fn(),
    userExists: vi.fn(),
    saveMDBListApiKey: vi.fn(),
    getCatalogs: vi.fn().mockResolvedValue([]),
    addCatalog: vi.fn().mockResolvedValue(true),
    saveCatalogs: vi.fn().mockResolvedValue(true),
    clearCache: vi.fn(),
    clearApiKeyCache: vi.fn(),
  },
}));

vi.mock('../../../packages/core/utils/mdblist', () => ({
  fetchTopLists: vi.fn(),
  searchLists: vi.fn(),
  isMDBListApiKeyValid: vi.fn(),
  fetchMDBListCatalog: vi.fn(),
  fetchListDetails: vi.fn(),
}));

vi.mock('../../../templates/mdblistTemplates', () => ({
  getMDBListSearchResultsHTML: vi.fn().mockReturnValue('<html>Search Results</html>'),
  getMDBListTop100HTML: vi.fn().mockReturnValue('<html>Top 100</html>'),
}));

vi.mock('../../../packages/platforms/cloudflare/addon', () => ({
  clearAddonCache: vi.fn(),
}));

vi.mock('../../../packages/core/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('../../../packages/platforms/cloudflare/appConfig', () => ({
  appConfig: {
    app: {
      trustedOrigins: ['https://trusted.org'],
    },
    api: {
      maxItemsMDBList: 100,
    },
  },
}));

describe('MDBList Routes', () => {
  // Create mock context
  const createMockContext = (
    params: Record<string, string> = {},
    query: Record<string, string> = {},
    formData: Record<string, string> = {},
    headers: Record<string, string> = {}
  ) => {
    const c = {
      req: {
        param: (key: string) => params[key],
        query: (key: string) => query[key],
        formData: vi.fn().mockResolvedValue({
          get: (key: string) => formData[key],
        }),
        url: 'https://example.com/test',
        header: (key: string) => headers[key] || null,
      },
      redirect: vi.fn().mockReturnValue({ status: 302 }),
      html: vi.fn().mockReturnValue({ status: 200 }),
      json: vi.fn().mockReturnValue({ status: 200 }),
    };
    return c;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sanitizeRedirect', () => {
    it('should return only path and query if origin is trusted', () => {
      const referrer = 'https://example.com/path?query=value';
      const fallback = '/default';

      const result = sanitizeRedirect(referrer, fallback);

      expect(result).toBe('/path?query=value');
    });

    it('should return only path and query for trusted origins from config', () => {
      const referrer = 'https://trusted.org/path?query=value';
      const fallback = '/default';

      const result = sanitizeRedirect(referrer, fallback);

      expect(result).toBe('/path?query=value');
    });

    it('should return fallback if origin is not trusted', () => {
      const referrer = 'https://malicious.com/path?query=value';
      const fallback = '/default';

      const result = sanitizeRedirect(referrer, fallback);

      expect(result).toBe('/default');
    });

    it('should return fallback if URL is invalid', () => {
      const referrer = 'not-a-url';
      const fallback = '/default';

      const result = sanitizeRedirect(referrer, fallback);

      expect(result).toBe('/default');
    });
  });

  describe('loadUserMDBListApiKey', () => {
    it('should return API key when successfully loaded', async () => {
      vi.mocked(configManager.loadMDBListApiKey).mockResolvedValue('test-api-key');

      const result = await loadUserMDBListApiKey('test-user');

      expect(result).toBe('test-api-key');
      expect(configManager.loadMDBListApiKey).toHaveBeenCalledWith('test-user');
    });

    it('should return null for errors', async () => {
      vi.mocked(configManager.loadMDBListApiKey).mockRejectedValue(new Error('DB error'));

      const result = await loadUserMDBListApiKey('test-user');

      expect(result).toBeNull();
    });

    it('should return null if no API key is found', async () => {
      vi.mocked(configManager.loadMDBListApiKey).mockResolvedValue(null);

      const result = await loadUserMDBListApiKey('test-user');

      expect(result).toBeNull();
    });
  });

  describe('getMDBListSearch', () => {
    it('should redirect if user does not exist', async () => {
      vi.mocked(configManager.userExists).mockResolvedValue(false);

      const c = createMockContext({ userId: 'test-user' });
      await getMDBListSearch(c);

      expect(c.redirect).toHaveBeenCalledWith('/configure?error=User not found');
    });

    it('should redirect if API key is not valid', async () => {
      vi.mocked(configManager.userExists).mockResolvedValue(true);
      vi.mocked(configManager.loadMDBListApiKey).mockResolvedValue('invalid-key');
      vi.mocked(mdblistUtils.isMDBListApiKeyValid).mockReturnValue(false);

      const c = createMockContext({ userId: 'test-user' });
      await getMDBListSearch(c);

      expect(c.redirect).toHaveBeenCalledWith(
        '/configure/test-user?error=MDBList API key is required. Please configure it in the settings.'
      );
    });

    it('should render search results HTML if successful', async () => {
      vi.mocked(configManager.userExists).mockResolvedValue(true);
      vi.mocked(configManager.loadMDBListApiKey).mockResolvedValue('valid-key');
      vi.mocked(mdblistUtils.isMDBListApiKeyValid).mockReturnValue(true);

      const mockCatalogs: MDBListCatalog[] = [
        {
          id: 'list1',
          name: 'Test List',
          type: 'public',
          user: {
            name: 'Test User',
            id: 'user123',
          },
          itemCount: 10,
          likes: 5,
          mdblistUrl: 'https://mdblist.com/list/123',
          slug: 'test-list',
          mdblistId: 123,
        },
      ];

      vi.mocked(mdblistUtils.searchLists).mockResolvedValue(mockCatalogs);

      const c = createMockContext(
        { userId: 'test-user' },
        { query: 'test-query', message: 'Success', error: '' }
      );

      await getMDBListSearch(c);

      expect(mdblistUtils.searchLists).toHaveBeenCalledWith('test-query', 'valid-key');
      expect(templates.getMDBListSearchResultsHTML).toHaveBeenCalledWith(
        'test-user',
        'test-query',
        mockCatalogs,
        'Success',
        ''
      );
      expect(c.html).toHaveBeenCalled();
    });

    it('should handle search errors', async () => {
      vi.mocked(configManager.userExists).mockResolvedValue(true);
      vi.mocked(configManager.loadMDBListApiKey).mockResolvedValue('valid-key');
      vi.mocked(mdblistUtils.isMDBListApiKeyValid).mockReturnValue(true);
      vi.mocked(mdblistUtils.searchLists).mockRejectedValue(new Error('Search failed'));

      const c = createMockContext({ userId: 'test-user' });
      await getMDBListSearch(c);

      expect(c.redirect).toHaveBeenCalledWith(
        `/configure/test-user?error=Failed to search MDBList: Error: Search failed`
      );
    });
  });

  describe('getMDBListTop100', () => {
    it('should redirect if user does not exist', async () => {
      vi.mocked(configManager.userExists).mockResolvedValue(false);

      const c = createMockContext({ userId: 'test-user' });
      await getMDBListTop100(c);

      expect(c.redirect).toHaveBeenCalledWith('/configure?error=User not found');
    });

    it('should redirect if API key is not valid', async () => {
      vi.mocked(configManager.userExists).mockResolvedValue(true);
      vi.mocked(configManager.loadMDBListApiKey).mockResolvedValue('invalid-key');
      vi.mocked(mdblistUtils.isMDBListApiKeyValid).mockReturnValue(false);

      const c = createMockContext({ userId: 'test-user' });
      await getMDBListTop100(c);

      expect(c.redirect).toHaveBeenCalledWith(
        '/configure/test-user?error=MDBList API key is required. Please configure it in the settings.'
      );
    });

    it('should render top 100 HTML if successful', async () => {
      vi.mocked(configManager.userExists).mockResolvedValue(true);
      vi.mocked(configManager.loadMDBListApiKey).mockResolvedValue('valid-key');
      vi.mocked(mdblistUtils.isMDBListApiKeyValid).mockReturnValue(true);

      const mockCatalogs: MDBListCatalog[] = [
        {
          id: 'list1',
          name: 'Top List',
          type: 'public',
          user: {
            name: 'Test User',
            id: 'user123',
          },
          itemCount: 100,
          likes: 20,
          mdblistUrl: 'https://mdblist.com/list/123',
          slug: 'top-list',
          mdblistId: 456,
        },
      ];

      vi.mocked(mdblistUtils.fetchTopLists).mockResolvedValue(mockCatalogs);

      const c = createMockContext({ userId: 'test-user' }, { message: 'Success', error: '' });

      await getMDBListTop100(c);

      expect(mdblistUtils.fetchTopLists).toHaveBeenCalledWith('valid-key');
      expect(templates.getMDBListTop100HTML).toHaveBeenCalledWith(
        'test-user',
        mockCatalogs,
        'Success',
        ''
      );
      expect(c.html).toHaveBeenCalled();
    });

    it('should handle fetchTopLists errors', async () => {
      vi.mocked(configManager.userExists).mockResolvedValue(true);
      vi.mocked(configManager.loadMDBListApiKey).mockResolvedValue('valid-key');
      vi.mocked(mdblistUtils.isMDBListApiKeyValid).mockReturnValue(true);
      vi.mocked(mdblistUtils.fetchTopLists).mockRejectedValue(new Error('Fetch failed'));

      const c = createMockContext({ userId: 'test-user' });
      await getMDBListTop100(c);

      expect(c.redirect).toHaveBeenCalledWith(
        `/configure/test-user?error=Failed to fetch top lists: Error: Fetch failed`
      );
    });
  });

  describe('addMDBListCatalog', () => {
    it('should add a catalog successfully', async () => {
      const mockListDetails: MDBListDetails = {
        id: 123,
        name: 'Test List',
        mediatype: 'movie',
        user_id: 'user123',
        user_name: 'Test User',
        items: 50,
        likes: 10,
        slug: 'test-list',
      };

      vi.mocked(configManager.userExists).mockResolvedValue(true);
      vi.mocked(configManager.loadMDBListApiKey).mockResolvedValue('valid-key');
      vi.mocked(mdblistUtils.isMDBListApiKeyValid).mockReturnValue(true);
      vi.mocked(mdblistUtils.fetchListDetails).mockResolvedValue(mockListDetails);
      vi.mocked(mdblistUtils.fetchMDBListCatalog).mockResolvedValue({
        metas: [
          { id: 'movie1', name: 'Test Movie', type: 'movie' },
          { id: 'series1', name: 'Test Series', type: 'series' },
        ],
      });
      vi.mocked(configManager.addCatalog).mockResolvedValue(true);

      const formData = {
        userId: 'mdbuser123',
        listId: 'list123',
        name: 'Original Name',
        type: 'both',
        mdblistId: '',
        slug: 'test-list',
      };

      const c = createMockContext({ userId: 'test-user' }, {}, formData, {
        referer: 'https://example.com/configure/test-user',
      });

      await addMDBListCatalog(c);

      expect(configManager.addCatalog).toHaveBeenCalled();
      expect(addonUtils.clearAddonCache).toHaveBeenCalledWith('test-user');
      expect(c.redirect).toHaveBeenCalled();
    });
  });

  describe('saveMDBListConfig', () => {
    it('should save MDBList API key and redirect', async () => {
      vi.mocked(configManager.userExists).mockResolvedValue(true);
      vi.mocked(configManager.saveMDBListApiKey).mockResolvedValue(true);
      vi.mocked(mdblistUtils.fetchTopLists).mockResolvedValue([
        {
          id: 'list1',
          name: 'Top List',
          type: 'public',
          user: {
            name: 'Test User',
            id: 'user123',
          },
          itemCount: 100,
          likes: 20,
          mdblistUrl: 'https://mdblist.com/list/123',
          slug: 'top-list',
          mdblistId: 456,
        },
      ]);

      const c = createMockContext(
        { userId: 'test-user' },
        { referrer: 'https://example.com/previous-page' },
        { apiKey: 'new-api-key' }
      );

      await saveMDBListConfig(c);

      expect(configManager.saveMDBListApiKey).toHaveBeenCalledWith('test-user', 'new-api-key');
      expect(c.redirect).toHaveBeenCalled();
    });
  });
});
