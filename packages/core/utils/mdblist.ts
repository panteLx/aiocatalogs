import { logger } from './logger';
import { appConfig } from '../../platforms/cloudflare/appConfig';

// Cache for MDBList API responses to avoid rate limiting
// Key format: `${endpoint}_${params}_${apiKey}`
const mdblistApiCache = new Map<string, { data: any; timestamp: number }>();

// Get cache expiration time in milliseconds
const CACHE_EXPIRATION_TIME = (appConfig.api.cacheExpirationMDBList ?? 60) * 60 * 1000; // default: 60 minutes

/**
 * Represents an MDBList catalog
 */
export interface MDBListCatalog {
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

/**
 * Represents a MDBList item from a list
 */
export interface MDBListItem {
  id: number;
  rank?: number;
  adult: number;
  title: string;
  imdb_id: string;
  tvdb_id?: number;
  language?: string;
  mediatype: string;
  release_year: number;
  spoken_language?: string;
}

/**
 * Represents a Stremio meta object
 */
export interface StremioMeta {
  id: string;
  name: string;
  type: string;
  poster?: string;
  background?: string;
  genres?: string[];
  releaseInfo?: string;
}

/**
 * Represents a MDBList list details
 */
export interface MDBListDetails {
  id?: number;
  name: string;
  mediatype?: string;
  user_id?: string;
  user_name?: string;
  items?: number;
  likes?: number;
  slug?: string;
}

/**
 * MDBList API configuration
 */
interface MDBListApiConfig {
  apiKey: string;
  userId?: string;
}

/**
 * Check if a provided MDBList API key is valid
 */
export function isMDBListApiKeyValid(apiKey?: string): boolean {
  return !!apiKey && apiKey.trim() !== '';
}

/**
 * Fetches lists from MDBList API
 */
async function fetchListsFromApi(
  endpoint: string,
  apiKey: string,
  params: Record<string, string> = {}
): Promise<any> {
  if (!isMDBListApiKeyValid(apiKey)) {
    logger.warn('MDBList API key not provided or invalid');
    return { lists: [] };
  }

  // Create a cache key based on the endpoint, params, and API key
  const paramsString = Object.entries(params)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  const cacheKey = `${endpoint}_${paramsString}_${apiKey}`;

  // Check if we have a cached response that hasn't expired
  const cachedResponse = mdblistApiCache.get(cacheKey);
  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_EXPIRATION_TIME) {
    logger.debug(`Using cached MDBList API response for: ${endpoint}`);
    return cachedResponse.data;
  }

  // Add API key to params
  const queryParams = new URLSearchParams({
    apikey: apiKey,
    ...params,
  });

  try {
    const url = `https://api.mdblist.com${endpoint}?${queryParams.toString()}`;
    logger.debug(`Fetching from MDBList API: ${url}`);

    const response = await fetch(url, {
      // Add a timeout to prevent hanging requests
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      logger.warn(`Failed to fetch from MDBList API: ${response.statusText}`);
      if (response.status === 401 || response.status === 403) {
        logger.error('API key seems to be invalid or expired');
      }
      return { lists: [] };
    }

    const data = await response.json();

    // Cache the successful response
    mdblistApiCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return data;
  } catch (error) {
    // More detailed error message
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        logger.warn('MDBList API request timed out after 5 seconds');
      } else {
        logger.error(`Error fetching from MDBList API: ${error.message}`);
      }
    } else {
      logger.error('Unknown error fetching from MDBList API:', error);
    }
    return { lists: [] };
  }
}

/**
 * Converts an API list object to MDBListCatalog format
 */
function convertApiListToCatalog(list: any): MDBListCatalog {
  return {
    id: `${list.user_id}-${list.id}`,
    mdblistId: list.id,
    name: list.name,
    type: list.mediatype || 'movie', // API uses mediatype instead of type
    user: {
      name: list.user_name || 'Unknown User',
      id: list.user_id || '',
    },
    itemCount: list.items || 0,
    likes: list.likes || 0,
    mdblistUrl: `https://mdblist.com/lists/${list.user_name}/${list.slug || list.id}`,
    slug: list.slug,
  };
}

/**
 * Fetches the top 100 lists from MDBList
 */
export async function fetchTopLists(apiKey: string): Promise<MDBListCatalog[]> {
  try {
    logger.debug('Fetching top lists from MDBList');

    if (!isMDBListApiKeyValid(apiKey)) {
      logger.warn('MDBList API key not provided or invalid. Cannot fetch top lists.');
      return [];
    }

    const data = await fetchListsFromApi('/lists/top', apiKey);

    // Handle both direct array responses and {lists: [...]} formatted responses
    let listsData: any[] = [];

    if (Array.isArray(data)) {
      // Direct array response
      listsData = data;
    } else if (data.lists && Array.isArray(data.lists)) {
      // Response with lists property
      listsData = data.lists;
    } else {
      logger.warn('Invalid response from MDBList API');
      return [];
    }

    const catalogs = listsData.map(convertApiListToCatalog);

    logger.debug(`Successfully fetched ${catalogs.length} top lists from MDBList API`);
    return catalogs;
  } catch (error) {
    logger.error('Error fetching top lists:', error);
    return [];
  }
}

/**
 * Searches for lists on MDBList
 */
export async function searchLists(query: string, apiKey: string): Promise<MDBListCatalog[]> {
  try {
    if (!query || query.trim() === '') {
      return [];
    }

    logger.debug(`Searching MDBList for: ${query}`);

    if (!isMDBListApiKeyValid(apiKey)) {
      logger.warn('MDBList API key not provided or invalid. Cannot search lists.');
      return [];
    }

    const data = await fetchListsFromApi('/lists/search', apiKey, { query });

    // Handle both direct array responses and {lists: [...]} formatted responses
    let listsData: any[] = [];

    if (Array.isArray(data)) {
      // Direct array response
      listsData = data;
    } else if (data.lists && Array.isArray(data.lists)) {
      // Response with lists property
      listsData = data.lists;
    } else {
      logger.warn('Invalid response from MDBList API');
      return [];
    }

    const catalogs = listsData.map(convertApiListToCatalog);

    logger.debug(`Found ${catalogs.length} lists for query: ${query}`);
    return catalogs;
  } catch (error) {
    logger.error('Error searching lists:', error);
    return [];
  }
}

/**
 * Fetches items from a MDBList list (limited to 100 items)
 */
export async function fetchListItems(
  identifier: string | number,
  apiKey: string,
  useSlug: boolean = false
): Promise<{ movies: MDBListItem[]; shows: MDBListItem[] }> {
  try {
    logger.debug(`Fetching first ${appConfig.api.maxItemsMDBList} items for list ${identifier}`);

    if (!isMDBListApiKeyValid(apiKey)) {
      logger.warn('MDBList API key not provided or invalid. Cannot fetch list items.');
      return { movies: [], shows: [] };
    }

    // Determine endpoint based on whether we're using a slug or ID
    const endpoint = useSlug ? `/list/${identifier}` : `/lists/${identifier}/items`;

    // Add limit=x parameter to only fetch the first x items
    const limit = (appConfig.api.maxItemsMDBList ?? 100).toString();
    const data = await fetchListsFromApi(endpoint, apiKey, { limit });

    // Handle different response formats from the API
    let items: any[] = [];

    if (data && data.items && Array.isArray(data.items)) {
      // Object with items array
      items = data.items;
    } else if (
      Array.isArray(data) &&
      data.length > 0 &&
      data[0].items &&
      Array.isArray(data[0].items)
    ) {
      // Array with first element containing items array
      items = data[0].items;
    } else if (Array.isArray(data)) {
      // Direct array of items
      items = data;
    } else if (data && data.movies && Array.isArray(data.movies)) {
      // Object with separate movies and shows arrays
      return {
        movies: data.movies || [],
        shows: data.shows || [],
      };
    }

    if (items.length === 0) {
      logger.warn(`No items found for list ${identifier}`);
      return { movies: [], shows: [] };
    }

    // Split items into movies and shows
    const movies: MDBListItem[] = [];
    const shows: MDBListItem[] = [];

    items.forEach((item: MDBListItem) => {
      if (item.mediatype === 'movie') {
        movies.push(item);
      } else if (item.mediatype === 'show') {
        shows.push(item);
      }
    });

    logger.debug(`Found ${movies.length} movies and ${shows.length} shows for list ${identifier}`);
    return { movies, shows };
  } catch (error) {
    logger.error(`Error fetching list items for ${identifier}:`, error);
    return { movies: [], shows: [] };
  }
}

/**
 * Converts MDBList items to Stremio meta format
 * @param items The items from MDBList (movies and shows)
 * @returns An array of Stremio meta objects
 */
export function convertToStremioMeta(items: {
  movies: MDBListItem[];
  shows: MDBListItem[];
}): StremioMeta[] {
  const metas: StremioMeta[] = [];

  // Process movies
  if (items.movies && items.movies.length > 0) {
    items.movies.forEach(movie => {
      if (!movie.imdb_id) return;

      metas.push({
        id: movie.imdb_id,
        name: movie.title,
        type: 'movie',
        poster: `https://images.metahub.space/poster/small/${movie.imdb_id}/img`,
        background: `https://images.metahub.space/background/small/${movie.imdb_id}/img`,
        releaseInfo: movie.release_year ? `${movie.release_year}` : undefined,
      });
    });
  }

  // Process shows
  if (items.shows && items.shows.length > 0) {
    items.shows.forEach(show => {
      if (!show.imdb_id) return;

      metas.push({
        id: show.imdb_id,
        name: show.title,
        type: 'series',
        poster: `https://images.metahub.space/poster/small/${show.imdb_id}/img`,
        background: `https://images.metahub.space/background/small/${show.imdb_id}/img`,
        releaseInfo: show.release_year ? `${show.release_year}--` : undefined,
      });
    });
  }

  return metas;
}

/**
 * Fetches a complete catalog from MDBList based on list ID (limited to 100 items)
 */
export async function fetchMDBListCatalog(
  mdblistId: string | number,
  apiKey: string
): Promise<{ metas: StremioMeta[] }> {
  try {
    if (!isMDBListApiKeyValid(apiKey)) {
      return { metas: [] };
    }

    const items = await fetchListItems(mdblistId, apiKey);
    const metas = convertToStremioMeta(items);
    return { metas };
  } catch (error) {
    logger.error(`Error fetching MDBList catalog for ${mdblistId}:`, error);
    return { metas: [] };
  }
}

/**
 * Fetches list details from MDBList
 */
export async function fetchListDetails(
  listId: string | number,
  apiKey: string
): Promise<MDBListDetails> {
  try {
    logger.debug(`Fetching details for list ${listId}`);

    if (!isMDBListApiKeyValid(apiKey)) {
      logger.warn('MDBList API key not provided or invalid. Cannot fetch list details.');
      return { name: 'Unknown List' };
    }

    const data = await fetchListsFromApi(`/lists/${listId}`, apiKey);

    // Handle different response formats
    // Some endpoints return an array, others might return an object with info property
    let listData = null;

    if (Array.isArray(data) && data.length > 0) {
      // If response is an array, take the first item
      listData = data[0];
    } else if (data && data.info) {
      // If response has an info property, use that
      listData = data.info;
    }

    if (!listData) {
      logger.warn(`No details found for list ${listId}`);
      return { name: `MDBList ${listId}` };
    }

    logger.debug(`Successfully fetched details for list ${listId}: ${listData.name}`);

    return {
      id: listData.id,
      name: listData.name || `MDBList ${listId}`,
      mediatype: listData.mediatype,
      user_id: listData.user_id,
      user_name: listData.user_name,
      items: listData.items,
      likes: listData.likes,
      slug: listData.slug,
    };
  } catch (error) {
    logger.error(`Error fetching list details for ${listId}:`, error);
    return { name: `MDBList ${listId}` };
  }
}
