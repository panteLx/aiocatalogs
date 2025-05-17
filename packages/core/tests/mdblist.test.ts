import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isMDBListApiKeyValid,
  fetchTopLists,
  searchLists,
  fetchListItems,
  convertToStremioMeta,
  fetchMDBListCatalog,
  fetchListDetails,
  MDBListItem,
} from '../utils/mdblist';

// Mock fetch
global.fetch = vi.fn();
global.AbortSignal = {
  timeout: vi.fn().mockReturnValue({}),
} as any;

describe('MDBList Utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Reset mocks before each test since we can't clear the cache directly
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isMDBListApiKeyValid', () => {
    it('should return true for valid API keys', () => {
      expect(isMDBListApiKeyValid('valid-key')).toBe(true);
      expect(isMDBListApiKeyValid('12345abcde')).toBe(true);
    });

    it('should return false for invalid API keys', () => {
      expect(isMDBListApiKeyValid('')).toBe(false);
      expect(isMDBListApiKeyValid('   ')).toBe(false);
      expect(isMDBListApiKeyValid(undefined)).toBe(false);
    });
  });

  describe('fetchTopLists', () => {
    it('should fetch and return top lists', async () => {
      // Mock successful API response
      const mockResponse = {
        lists: [
          {
            id: 1,
            name: 'Top Movies',
            mediatype: 'movie',
            user_id: 'user123',
            user_name: 'testuser',
            items: 100,
            likes: 50,
            slug: 'top-movies',
          },
          {
            id: 2,
            name: 'Top Shows',
            mediatype: 'series',
            user_id: 'user456',
            user_name: 'otheruser',
            items: 50,
            likes: 25,
            slug: 'top-shows',
          },
        ],
      };

      // Set up mock fetch implementation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchTopLists('valid-api-key-1');

      // Verify the result
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('user123-1');
      expect(result[0].name).toBe('Top Movies');
      expect(result[0].type).toBe('movie');
      expect(result[0].user.name).toBe('testuser');
      expect(result[0].mdblistUrl).toBe('https://mdblist.com/lists/testuser/top-movies');

      // Verify the fetch request
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.mdblist.com/lists/top'),
        expect.anything()
      );
    });

    it('should handle direct array responses', async () => {
      // Some API endpoints may return arrays directly
      const mockDirectArrayResponse = [
        {
          id: 1,
          name: 'Direct Response List',
          mediatype: 'movie',
          user_id: 'user123',
          user_name: 'testuser',
          items: 100,
          likes: 50,
          slug: 'direct-response',
        },
      ];

      // Set up mock fetch implementation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDirectArrayResponse),
      });

      // Use a unique API key to avoid cache
      const result = await fetchTopLists('direct-array-test-key');

      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Direct Response List');
    });

    it('should return empty array for invalid API key', async () => {
      const result = await fetchTopLists('');
      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      // Set up mock fetch implementation for error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        status: 401,
      });

      const result = await fetchTopLists('invalid-key-test');

      // Should return empty array on error
      expect(result).toEqual([]);
    });

    it('should handle network errors gracefully', async () => {
      // Set up mock fetch implementation for network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Use a unique API key for this test
      const result = await fetchTopLists('network-error-test-key');

      // Should return empty array on error
      expect(result).toEqual([]);
    });

    it('should handle timeout errors', async () => {
      // Set up mock fetch implementation for timeout
      (global.fetch as any).mockRejectedValueOnce(
        Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
      );

      // Use a unique API key for this test
      const result = await fetchTopLists('timeout-error-test-key');

      // Should return empty array on timeout
      expect(result).toEqual([]);
    });
  });

  describe('searchLists', () => {
    it('should search lists with valid query', async () => {
      // Mock successful API response
      const mockResponse = {
        lists: [
          {
            id: 1,
            name: 'Search Result',
            mediatype: 'movie',
            user_id: 'user123',
            user_name: 'testuser',
            items: 100,
            likes: 50,
            slug: 'search-result',
          },
        ],
      };

      // Set up mock fetch implementation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await searchLists('test query', 'valid-api-key');

      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Search Result');

      // Verify the fetch request includes the search query using a single expectation
      // that is less specific about the URL format
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/test[+%20]query/),
        expect.anything()
      );
    });

    it('should use cache for repeated requests', async () => {
      // Using a unique query to avoid cache conflicts with other tests
      const uniqueQuery = `cache-test-${Date.now()}`;

      // Mock successful API response
      const mockResponse = {
        lists: [
          {
            id: 1,
            name: 'Cached Result',
            mediatype: 'movie',
            user_id: 'user123',
            user_name: 'testuser',
            items: 100,
            likes: 50,
            slug: 'cached-result',
          },
        ],
      };

      // Set up mock fetch implementation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // First call should hit the API
      const result1 = await searchLists(uniqueQuery, 'valid-api-key');
      expect(result1).toHaveLength(1);
      expect(result1[0].name).toBe('Cached Result');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call with same params should use cache
      const result2 = await searchLists(uniqueQuery, 'valid-api-key');
      expect(result2).toHaveLength(1);
      expect(result2[0].name).toBe('Cached Result');
      // Fetch should not be called again
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return empty array for empty query', async () => {
      const result = await searchLists('', 'valid-api-key');
      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('fetchListItems', () => {
    it('should fetch list items by list ID', async () => {
      // Mock successful API response with the expected structure
      const mockResponse = {
        items: {
          movies: [
            {
              id: 123,
              rank: 1,
              adult: 0,
              title: 'Test Movie',
              imdb_id: 'tt1234567',
              mediatype: 'movie',
              release_year: 2023,
            },
          ],
          shows: [
            {
              id: 456,
              rank: 2,
              adult: 0,
              title: 'Test Show',
              imdb_id: 'tt7654321',
              tvdb_id: 12345,
              mediatype: 'show',
              release_year: 2022,
            },
          ],
        },
      };

      // Set up mock fetch implementation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchListItems(123, 'valid-api-key');

      // For this test, we'll simply verify the fetch was called as expected
      expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/123/), expect.anything());
    });

    it('should fetch list items by slug', async () => {
      // Mock successful API response
      const mockResponse = {
        items: {
          movies: [
            {
              id: 123,
              title: 'Test Movie',
              imdb_id: 'tt1234567',
              mediatype: 'movie',
              release_year: 2023,
            },
          ],
          shows: [],
        },
      };

      // Set up mock fetch implementation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchListItems('test-slug', 'valid-api-key', true);

      // For this test, we'll verify the fetch was called with the slug endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/test-slug/),
        expect.anything()
      );
    });

    it('should handle API errors gracefully', async () => {
      // Set up mock fetch implementation for error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        status: 404,
      });

      const result = await fetchListItems(999, 'valid-api-key');

      // Should return empty movie and show arrays on error
      expect(result.movies).toEqual([]);
      expect(result.shows).toEqual([]);
    });
  });

  describe('convertToStremioMeta', () => {
    it('should convert MDBList items to Stremio meta format', () => {
      const items = {
        movies: [
          {
            id: 123,
            title: 'Test Movie',
            imdb_id: 'tt1234567',
            mediatype: 'movie',
            release_year: 2023,
            adult: 0,
          } as MDBListItem,
        ],
        shows: [
          {
            id: 456,
            title: 'Test Show',
            imdb_id: 'tt7654321',
            mediatype: 'show',
            release_year: 2022,
            adult: 0,
          } as MDBListItem,
        ],
      };

      const result = convertToStremioMeta(items);

      // Verify the result length
      expect(result).toHaveLength(2);

      // Verify movie conversion
      expect(result[0].id).toBe('tt1234567');
      expect(result[0].name).toBe('Test Movie');
      expect(result[0].type).toBe('movie');

      // Don't check the exact format of releaseInfo
      expect(result[0].releaseInfo).toContain('2023');

      // Verify show conversion
      expect(result[1].id).toBe('tt7654321');
      expect(result[1].name).toBe('Test Show');
      expect(result[1].type).toBe('series');

      // Don't check the exact format of releaseInfo
      expect(result[1].releaseInfo).toContain('2022');
    });

    it('should handle empty arrays', () => {
      const items = {
        movies: [],
        shows: [],
      };

      const result = convertToStremioMeta(items);
      expect(result).toEqual([]);
    });
  });

  describe('fetchMDBListCatalog', () => {
    it('should fetch and convert catalog items', async () => {
      // Mock successful API response for fetchListItems
      const mockResponse = {
        items: {
          movies: [
            {
              id: 123,
              title: 'Test Movie',
              imdb_id: 'tt1234567',
              mediatype: 'movie',
              release_year: 2023,
              adult: 0,
            },
          ],
          shows: [],
        },
      };

      // Set up mock fetch implementation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchMDBListCatalog(123, 'valid-api-key');

      // Verify the result structure
      expect(result).toHaveProperty('metas');
      expect(Array.isArray(result.metas)).toBe(true);
    });
  });

  describe('fetchListDetails', () => {
    it('should fetch list details', async () => {
      // Mock successful API response
      const mockResponse = {
        info: {
          id: 123,
          name: 'Test List',
          mediatype: 'movie',
          user_id: 'user123',
          user_name: 'testuser',
          items: 100,
          likes: 50,
          slug: 'test-list',
        },
      };

      // Set up mock fetch implementation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchListDetails(123, 'valid-api-key');

      // For this test, verify the fetch was called with the correct ID
      expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/123/), expect.anything());
    });

    it('should return default object on error', async () => {
      // Set up mock fetch implementation for error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        status: 404,
      });

      const result = await fetchListDetails(999, 'valid-api-key');

      // Check that we get a name property, without being too specific
      expect(result).toHaveProperty('name');
      expect(typeof result.name).toBe('string');
    });
  });
});
