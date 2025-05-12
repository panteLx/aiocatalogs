import { logger } from './logger';

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
  userId?: string; // Add userId to track which user's key we're using
}

// Default config - should be replaced with a real API key by the user
let apiConfig: MDBListApiConfig = {
  apiKey: '',
};

/**
 * Set the MDBList API configuration
 */
export function setMDBListApiConfig(config: MDBListApiConfig): void {
  apiConfig = config;
}

/**
 * Get the MDBList API configuration
 */
export function getMDBListApiConfig(): MDBListApiConfig {
  return apiConfig;
}

/**
 * Check if the MDBList API key is configured
 */
export function isMDBListApiConfigured(): boolean {
  return !!apiConfig.apiKey && apiConfig.apiKey.trim() !== '';
}

/**
 * Fetches lists from MDBList API
 */
async function fetchListsFromApi(
  endpoint: string,
  params: Record<string, string> = {},
  customApiKey?: string // Allow passing a specific API key
): Promise<any> {
  // Use provided API key or fall back to the configured one
  const apiKey = customApiKey || apiConfig.apiKey;

  if (!apiKey || apiKey.trim() === '') {
    logger.warn('MDBList API key not configured');
    return { lists: [] };
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
export async function fetchTopLists(customApiKey?: string): Promise<MDBListCatalog[]> {
  try {
    logger.debug('Fetching top lists from MDBList');

    if (!customApiKey && !isMDBListApiConfigured()) {
      logger.warn('MDBList API key not configured. Cannot fetch top lists.');
      return [];
    }

    const data = await fetchListsFromApi('/lists/top', {}, customApiKey);

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
export async function searchLists(query: string, customApiKey?: string): Promise<MDBListCatalog[]> {
  try {
    if (!query || query.trim() === '') {
      return [];
    }

    logger.debug(`Searching MDBList for: ${query}`);

    if (!customApiKey && !isMDBListApiConfigured()) {
      logger.warn('MDBList API key not configured. Cannot search lists.');
      return [];
    }

    const data = await fetchListsFromApi('/lists/search', { query }, customApiKey);

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
 * Fetches the items in a MDBList list
 * @param identifier Either the list ID or slug
 * @param useSlug If true, uses the slug instead of ID for fetching
 * @param customApiKey Optional custom API key
 */
export async function fetchListItems(
  identifier: string | number,
  useSlug: boolean = false,
  customApiKey?: string
): Promise<{ movies: MDBListItem[]; shows: MDBListItem[] }> {
  try {
    logger.debug(`Fetching items for list: ${identifier}`);

    if (!customApiKey && !isMDBListApiConfigured()) {
      logger.warn('MDBList API key not configured. Cannot fetch list items.');
      return { movies: [], shows: [] };
    }

    const endpoint = useSlug ? `/lists/s/${identifier}/items` : `/lists/${identifier}/items`;

    // Add limit parameter to get only the first 100 items
    const data = await fetchListsFromApi(endpoint, { limit: '100' }, customApiKey);

    if (!data || (!data.movies && !data.shows)) {
      logger.warn('Invalid response from MDBList API for list items');
      return { movies: [], shows: [] };
    }

    const movies = Array.isArray(data.movies) ? data.movies : [];
    const shows = Array.isArray(data.shows) ? data.shows : [];

    logger.debug(
      `Successfully fetched ${movies.length} movies and ${shows.length} shows from list ${identifier} (limited to first 100 items)`
    );
    return { movies, shows };
  } catch (error) {
    logger.error(`Error fetching items for list ${identifier}:`, error);
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
        releaseInfo: show.release_year ? `${show.release_year}--` : undefined,
      });
    });
  }

  return metas;
}

/**
 * Fetches a complete catalog from MDBList and converts it to Stremio format
 */
export async function fetchMDBListCatalog(
  mdblistId: string | number,
  customApiKey?: string
): Promise<{ metas: StremioMeta[] }> {
  try {
    const items = await fetchListItems(mdblistId, false, customApiKey);
    const metas = convertToStremioMeta(items);

    logger.debug(`Generated catalog with ${metas.length} items from MDBList ${mdblistId}`);
    return { metas };
  } catch (error) {
    logger.error(`Error fetching MDBList catalog ${mdblistId}:`, error);
    return { metas: [] };
  }
}

/**
 * Fetches details about a MDBList list
 */
export async function fetchListDetails(
  listId: string | number,
  customApiKey?: string
): Promise<MDBListDetails> {
  try {
    logger.debug(`Fetching details for list: ${listId}`);

    if (!customApiKey && !isMDBListApiConfigured()) {
      logger.warn('MDBList API key not configured. Cannot fetch list details.');
      return { name: `MDBList ${listId}` };
    }

    const data = await fetchListsFromApi(`/lists/${listId}`, {}, customApiKey);

    // Handle different response formats
    let listData;
    if (Array.isArray(data)) {
      // If response is an array, take the first item
      listData = data.length > 0 ? data[0] : null;
    } else {
      // If response is an object, use it directly
      listData = data;
    }

    if (!listData || !listData.name) {
      logger.warn('Invalid response from MDBList API for list details');
      return { name: `MDBList ${listId}` };
    }

    logger.debug(`Successfully fetched details for list ${listId}: ${listData.name}`);
    return {
      id: listData.id,
      name: listData.name,
      mediatype: listData.mediatype,
      user_id: listData.user_id,
      user_name: listData.user_name,
      items: listData.items,
      likes: listData.likes,
      slug: listData.slug,
    };
  } catch (error) {
    logger.error(`Error fetching details for list ${listId}:`, error);
    return { name: `MDBList ${listId}` };
  }
}
