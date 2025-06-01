import {
  fetchTopLists,
  searchLists,
  isMDBListApiKeyValid,
  fetchMDBListCatalog,
  fetchListDetails,
  fetchMyMDBListWatchlist,
} from '../../core/utils/mdblist';
import {
  getMDBListSearchResultsHTML,
  getMDBListTop100HTML,
} from '../../../templates/mdblistTemplates';
import { configManager } from '../../platforms/cloudflare/configManager';
import { clearAddonCache } from '../../platforms/cloudflare/addon';
import { logger } from '../../core/utils/logger';
import { appConfig } from '../../platforms/cloudflare/appConfig';
import { CatalogManifest } from '../../types';

const MDBLIST_WATCHLIST_NAME = 'MDBList Watchlist';

export const importUserWatchlist = async (c: any /* Hono Context */) => {
  const userId = c.req.param('userId');

  logger.info(`Received request to import MDBList watchlist for user ${userId}`);

  const apiKey = await configManager.loadMDBListApiKey(userId);
  if (!apiKey || !isMDBListApiKeyValid(apiKey)) {
    logger.warn(`MDBList API key not found or invalid for user ${userId} during watchlist import.`);
    return c.json(
      {
        success: false,
        error: 'MDBList API key not configured or invalid. Please save a valid API key first.',
      },
      400
    );
  }

  try {
    const watchlistFetchResult = await fetchMyMDBListWatchlist(apiKey);

    const watchlistSourceManifest: CatalogManifest = {
      id: 'aiocatalogs_mdb_user_watchlist',
      name: 'MDBList Watchlist',
      description: 'Your personal MDBList Watchlist.',
      endpoint: `internal://mdblist_watchlist/${userId}`, // Internal routing hint
      version: '1.0.0',
      resources: ['catalog'],
      types: [],
      catalogs: [],
      behaviorHints: { adult: false, p2p: false },
    };

    const hasMovies = watchlistFetchResult.metas.some(item => item.type === 'movie');
    const hasSeries = watchlistFetchResult.metas.some(item => item.type === 'series');

    if (hasMovies) {
      watchlistSourceManifest.types.push('movie');
      watchlistSourceManifest.catalogs.push({
        id: 'movies',
        type: 'movie',
        name: `${MDBLIST_WATCHLIST_NAME} (Movies)`,
      });
    }
    if (hasSeries) {
      watchlistSourceManifest.types.push('series');
      watchlistSourceManifest.catalogs.push({
        id: 'series',
        type: 'series',
        name: `${MDBLIST_WATCHLIST_NAME} (Series)`,
      });
    }

    if (watchlistSourceManifest.catalogs.length === 0) {
      if (watchlistFetchResult.metas.length > 0) {
        logger.info(
          `Watchlist for ${userId} contains items, but no movies or series. Adding generic placeholders.`
        );
      } else {
        logger.info(`Watchlist for ${userId} is empty. Adding placeholder catalog entries.`);
      }
      // Add default placeholder if watchlist is empty or types are not movie/series
      if (!watchlistSourceManifest.types.includes('movie'))
        watchlistSourceManifest.types.push('movie');
      watchlistSourceManifest.catalogs.push({
        id: 'movies',
        type: 'movie',
        name: `${MDBLIST_WATCHLIST_NAME} (Movies)`,
      });
      if (!watchlistSourceManifest.types.includes('series'))
        watchlistSourceManifest.types.push('series'); // Ensure series type is also added if no content
      watchlistSourceManifest.catalogs.push({
        id: 'series',
        type: 'series',
        name: `${MDBLIST_WATCHLIST_NAME} (Series)`,
      });
    }

    const addSuccess = await configManager.addCatalog(userId, watchlistSourceManifest);
    if (!addSuccess) {
      logger.error(`Failed to save watchlist catalog to configuration for user ${userId}.`);
      return c.json(
        { success: false, error: 'Failed to add watchlist to AIOCatalogs configuration.' },
        500
      );
    }

    clearAddonCache(userId);
    configManager.clearCache(userId);
    logger.info(`Successfully imported MDBList watchlist catalog for user ${userId}.`);
    return c.json({
      success: true,
      message: 'MDBList Watchlist imported successfully as a new catalog!',
    });
  } catch (err) {
    logger.error(`Error importing MDBList watchlist for ${userId}:`, err);
    return c.json(
      {
        success: false,
        error: `Failed to import watchlist: ${err instanceof Error ? err.message : 'Unknown error'}`,
      },
      500
    );
  }
};

/**
 * Sanitizes a redirect URL to ensure it's a same-origin path
 * @param referrer The referrer URL to sanitize
 * @param fallback The fallback URL to use if the referrer is invalid
 * @returns A safe path to redirect to
 */
function sanitizeRedirect(referrer: string, fallback: string): string {
  try {
    // Use the request's host as the base for parsing
    const baseUrl = new URL(referrer);

    // Create an array of trusted origins
    const trustedOrigins = [
      // Add any additional trusted origins from the comma-separated list
      ...(appConfig.app.trustedOrigins || []),
    ].filter(Boolean); // Remove any undefined/null values

    // Check if the URL's origin is in our list of trusted origins
    if (!trustedOrigins.includes(baseUrl.origin)) throw new Error();

    return baseUrl.pathname + (baseUrl.search || '');
  } catch {
    return fallback;
  }
}

// Helper function to load the MDBList API key for a user
export async function loadUserMDBListApiKey(userId: string): Promise<string | null> {
  try {
    const apiKey = await configManager.loadMDBListApiKey(userId);
    if (apiKey) {
      logger.debug(`Loaded MDBList API key for user ${userId}`);
      return apiKey;
    }
    return null;
  } catch (error) {
    logger.error(`Error loading MDBList API key for user ${userId}:`, error);
    return null;
  }
}

// Display MDBList search results
export const getMDBListSearch = async (c: any) => {
  const userId = c.req.param('userId');
  const query = c.req.query('query') || '';

  // Check if user exists
  const exists = await configManager.userExists(userId);
  if (!exists) {
    return c.redirect('/configure?error=User not found');
  }

  // Load the user's API key from the database
  const apiKey = await loadUserMDBListApiKey(userId);

  // Check if API key is configured
  if (!apiKey || !isMDBListApiKeyValid(apiKey)) {
    return c.redirect(
      `/configure/${userId}?error=MDBList API key is required. Please configure it in the settings.`
    );
  }

  try {
    const catalogs = await searchLists(query, apiKey);
    const message = c.req.query('message') || '';
    const error = c.req.query('error') || '';

    // Return HTML
    return c.html(getMDBListSearchResultsHTML(userId, query, catalogs, message, error));
  } catch (error) {
    console.error('Error searching MDBList:', error);
    return c.redirect(`/configure/${userId}?error=Failed to search MDBList: ${error}`);
  }
};

// Display MDBList top 100
export const getMDBListTop100 = async (c: any) => {
  const userId = c.req.param('userId');

  // Check if user exists
  const exists = await configManager.userExists(userId);
  if (!exists) {
    return c.redirect('/configure?error=User not found');
  }

  // Load the user's API key from the database
  const apiKey = await loadUserMDBListApiKey(userId);

  // Check if API key is configured
  if (!apiKey || !isMDBListApiKeyValid(apiKey)) {
    return c.redirect(
      `/configure/${userId}?error=MDBList API key is required. Please configure it in the settings.`
    );
  }

  try {
    const catalogs = await fetchTopLists(apiKey);
    const message = c.req.query('message') || '';
    const error = c.req.query('error') || '';

    // Return HTML
    return c.html(getMDBListTop100HTML(userId, catalogs, message, error));
  } catch (error) {
    console.error('Error fetching top lists:', error);
    return c.redirect(`/configure/${userId}?error=Failed to fetch top lists: ${error}`);
  }
};

// Add MDBList catalog
export const addMDBListCatalog = async (c: any) => {
  const userId = c.req.param('userId');

  // Check if user exists
  const exists = await configManager.userExists(userId);
  if (!exists) {
    return c.redirect('/configure?error=User not found');
  }

  // Load the user's API key from the database
  const apiKey = await loadUserMDBListApiKey(userId);

  // Check if API key is configured
  if (!apiKey || !isMDBListApiKeyValid(apiKey)) {
    return c.redirect(
      `/configure/${userId}?error=MDBList API key is required. Please configure it in the settings.`
    );
  }

  const formData = await c.req.formData();
  const mdblistUserId = formData.get('userId') as string;
  const listId = formData.get('listId') as string;
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const mdblistId = formData.get('mdblistId') as string;
  const slug = formData.get('slug') as string;

  // Get the current request URL to build absolute URLs
  const url = new URL(c.req.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  // Construct catalog URL using our own endpoint instead of external services
  let catalogId = '';
  if (mdblistId) {
    catalogId = mdblistId;
  } else if (listId) {
    catalogId = listId;
  } else {
    return c.redirect(`/configure/${userId}?error=Missing list ID`);
  }

  // Fetch the actual list details to get the proper name
  let listName = name;
  try {
    const listDetails = await fetchListDetails(catalogId, apiKey);
    if (listDetails && listDetails.name) {
      listName = listDetails.name;
    }
  } catch (error) {
    logger.warn(`Error fetching list details: ${error}`);
    // Continue with the provided name
  }

  try {
    // Instead of fetching via HTTP, directly create the manifest
    // Generate the manifest URL (for reference only)
    const manifestUrl = `${baseUrl}/configure/${userId}/mdblist/${catalogId}/manifest.json`;

    // Check if we have content to make a better manifest
    const catalog = await fetchMDBListCatalog(catalogId, apiKey);
    const hasMovies = catalog.metas.some(item => item.type === 'movie');
    const hasSeries = catalog.metas.some(item => item.type === 'series');

    // Create catalogs array based on available content
    const catalogs = [];

    if (hasMovies) {
      catalogs.push({
        id: `mdblist_${catalogId}`,
        type: 'movie',
        name: listName,
      });
    }

    if (hasSeries) {
      catalogs.push({
        id: `mdblist_${catalogId}`,
        type: 'series',
        name: listName,
      });
    }

    // If no content was found, add both types as fallback
    if (catalogs.length === 0) {
      catalogs.push(
        {
          id: `mdblist_${catalogId}`,
          type: 'movie',
          name: listName,
        },
        {
          id: `mdblist_${catalogId}`,
          type: 'series',
          name: listName,
        }
      );
    }

    // Create the manifest directly
    const manifest = {
      id: `mdblist_${catalogId}`,
      version: '1.0.0',
      name: listName,
      description: `${listName} - MDBList catalog`,
      endpoint: `${baseUrl}/configure/${userId}/mdblist/${catalogId}`,
      resources: ['catalog'],
      types: ['movie', 'series'],
      catalogs: catalogs,
      behaviorHints: {
        adult: false,
        p2p: false,
      },
      // Store apiKey in context for future use
      context: { apiKey },
    };

    // Add the catalog to the user's config
    const success = await configManager.addCatalog(userId, manifest);

    if (!success) {
      // Get the referrer URL to determine where to redirect back to
      const rawRef = c.req.header('referer') || `/configure/${userId}`;
      const safePath = sanitizeRedirect(rawRef, `/configure/${userId}`);

      // If we're on the search page, preserve the query parameter
      if (safePath.includes('/mdblist/search')) {
        let searchQuery = '';
        try {
          const url = new URL(rawRef);
          searchQuery = url.searchParams.get('query') || '';
        } catch (err) {
          logger.warn(`Invalid referrer URL: ${rawRef}`);
        }
        return c.redirect(
          `/configure/${userId}/mdblist/search?query=${searchQuery}&error=Failed to add MDBList catalog`
        );
      }
      // If we're on the top100 page, use the specific endpoint
      if (safePath.includes('/mdblist/top100')) {
        return c.redirect(
          `/configure/${userId}/mdblist/top100?error=Failed to add MDBList catalog`
        );
      }
      return c.redirect(`${safePath}?error=Failed to add MDBList catalog`);
    }

    // Clear both caches to ensure fresh data
    clearAddonCache(userId);
    configManager.clearCache(userId);

    // Get the referrer URL to determine where to redirect back to
    const rawRef = c.req.header('referer') || `/configure/${userId}`;
    const safePath = sanitizeRedirect(rawRef, `/configure/${userId}`);

    // If we're on the search page, preserve the query parameter
    if (safePath.includes('/mdblist/search')) {
      let searchQuery = '';
      try {
        const url = new URL(rawRef);
        searchQuery = url.searchParams.get('query') || '';
      } catch (err) {
        logger.warn(`Invalid referrer URL: ${rawRef}`);
      }
      return c.redirect(
        `/configure/${userId}/mdblist/search?query=${searchQuery}&message=Successfully added catalog: ${listName}`
      );
    }
    // If we're on the top100 page, use the specific endpoint
    if (safePath.includes('/mdblist/top100')) {
      return c.redirect(
        `/configure/${userId}/mdblist/top100?message=Successfully added catalog: ${listName}`
      );
    }
    return c.redirect(`${safePath}?message=Successfully added catalog: ${listName}`);
  } catch (error) {
    console.error('Error adding MDBList catalog:', error);
    // Get the referrer URL to determine where to redirect back to
    const rawRef = c.req.header('referer') || `/configure/${userId}`;
    const safePath = sanitizeRedirect(rawRef, `/configure/${userId}`);

    // If we're on the search page, preserve the query parameter
    if (safePath.includes('/mdblist/search')) {
      let searchQuery = '';
      try {
        const url = new URL(rawRef);
        searchQuery = url.searchParams.get('query') || '';
      } catch (err) {
        logger.warn(`Invalid referrer URL: ${rawRef}`);
      }
      return c.redirect(
        `/configure/${userId}/mdblist/search?query=${searchQuery}&error=Failed to add MDBList catalog: ${error}`
      );
    }
    // If we're on the top100 page, use the specific endpoint
    if (safePath.includes('/mdblist/top100')) {
      return c.redirect(
        `/configure/${userId}/mdblist/top100?error=Failed to add MDBList catalog: ${error}`
      );
    }
    return c.redirect(`${safePath}?error=Failed to add MDBList catalog: ${error}`);
  }
};

// Save MDBList API configuration
export const saveMDBListConfig = async (c: any) => {
  const userId = c.req.param('userId');
  const formData = await c.req.formData();
  const apiKey = formData.get('apiKey') as string;

  // Check if user exists
  const exists = await configManager.userExists(userId);
  if (!exists) {
    // It's good practice to return the response from c.redirect
    return c.redirect('/configure?error=User not found');
  }

  try {
    if (!apiKey || apiKey.trim() === '') {
      return c.redirect(`/configure/${userId}?error=MDBList API key cannot be empty`);
    }

    let isValidApiKey = false;
    try {
      const testResult = await fetchTopLists(apiKey);
      // Check if we got a valid response array and at least one list
      // This verifies both API key validity and proper API response format
      if (
        Array.isArray(testResult) &&
        testResult.length > 0 &&
        testResult[0] && // Check first element exists
        'name' in testResult[0] && // Verify it has required MDBListCatalog properties
        'type' in testResult[0] &&
        'user' in testResult[0]
      ) {
        isValidApiKey = true;
        logger.info(
          `Successfully validated MDBList API key for user ${userId} during save. Found ${testResult.length} lists.`
        );
      } else {
        logger.warn(
          `MDBList API key validation failed for user ${userId}: invalid or empty response structure`
        );
      }
    } catch (validationError) {
      logger.error(`MDBList API key validation call failed for user ${userId}:`, validationError);
    }
    if (!isValidApiKey) {
      return c.redirect(
        `/configure/${userId}?error=Invalid MDBList API key - please check and try again, or service might be temporarily unavailable.`
      );
    }

    const success = await configManager.saveMDBListApiKey(userId, apiKey);

    if (!success) {
      logger.warn(`Database save failed for MDBList API key for user ${userId}`);
      return c.redirect(
        `/configure/${userId}?error=Could not save MDBList API key. Please try again.`
      );
    }

    configManager.clearApiKeyCache(userId);

    logger.info(`MDBList API key configuration saved successfully for user ${userId}.`);
    return c.redirect(`/configure/${userId}?message=MDBList API configuration saved successfully`);
  } catch (error) {
    logger.error(`Error saving MDBList API configuration for user ${userId}:`, error);
    return c.redirect(
      `/configure/${userId}?error=Failed to save MDBList API configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
