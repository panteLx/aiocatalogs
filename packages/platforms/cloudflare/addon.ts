import { CatalogRequest, CatalogResponse, D1Database, MetaItem } from './types';
import { configManager } from './configManager';
import packageJson from '../../../package.json';
import { buildManifest, handleCatalogRequest } from '../../core/utils/manifestBuilder';
import { logger } from '../../core/utils/logger';
import {
  fetchMDBListCatalog,
  fetchListDetails,
  fetchMyMDBListWatchlist,
} from '../../core/utils/mdblist';
import { processPosterUrls } from '../../core/utils/posterUtils';
import { loadUserRPDBApiKey } from '../../api/routes/rpdbRoutes';

const addonCache = new Map();
const { version, description } = packageJson;

/**
 * Helper function to process MDBList catalog requests
 */
async function processMDBListCatalog(
  args: CatalogRequest,
  userId: string
): Promise<{ metas: MetaItem[] }> {
  const MDBLIST_WATCHLIST_SOURCE_ID = 'aiocatalogs_mdb_user_watchlist';
  try {
    const apiKey = await configManager.loadMDBListApiKey(userId);
    if (!apiKey) {
      logger.warn(
        `No MDBList API key found for user ${userId} while processing catalog ${args.id}.`
      );
      return { metas: [] };
    }

    if (args.id.startsWith(MDBLIST_WATCHLIST_SOURCE_ID + '_')) {
      const typeSegment = args.id.substring((MDBLIST_WATCHLIST_SOURCE_ID + '_').length); // "movies" or "series"
      logger.debug(
        `Processing MDBList watchlist request for user: ${userId}, type segment: ${typeSegment}`
      );

      const watchlistData = await fetchMyMDBListWatchlist(apiKey);
      let filteredMetas = watchlistData.metas;

      if (typeSegment === 'movies') {
        filteredMetas = watchlistData.metas.filter(m => m.type === 'movie');
      } else if (typeSegment === 'series') {
        filteredMetas = watchlistData.metas.filter(m => m.type === 'series');
      } else {
        logger.warn(
          `Invalid type segment '${typeSegment}' for watchlist. Expected 'movies' or 'series'. Returning empty metas.`
        );
        return { metas: [] };
      }

      const rpdbApiKey = await loadUserRPDBApiKey(userId);
      if (rpdbApiKey && filteredMetas) {
        filteredMetas = processPosterUrls([...filteredMetas], rpdbApiKey);
      }

      const userConfig = await configManager.getConfig(userId);
      if (
        userConfig.randomizedCatalogs?.includes(MDBLIST_WATCHLIST_SOURCE_ID) &&
        filteredMetas.length > 1
      ) {
        logger.debug(`Randomizing MDBList watchlist items for ${MDBLIST_WATCHLIST_SOURCE_ID}`);
        filteredMetas = shuffleArray(filteredMetas);
      }
      return { metas: filteredMetas };
    } else if (args.id && args.id.startsWith('mdblist_')) {
      const potentialNumericId = args.id.substring('mdblist_'.length).split('_')[0];
      if (/^\d+$/.test(potentialNumericId)) {
        logger.debug(
          `Processing regular MDBList catalog request for MDBList ID: ${potentialNumericId}, full ID: ${args.id}`
        );
        const result = await fetchMDBListCatalog(potentialNumericId, apiKey);
        // ... (filtering by args.type, randomization, RPDB logic as before for regular lists)
        let finalMetas = result.metas;
        if (args.type === 'movie') finalMetas = result.metas.filter(item => item.type === 'movie');
        else if (args.type === 'series')
          finalMetas = result.metas.filter(item => item.type === 'series');

        const rpdbApiKey = await loadUserRPDBApiKey(userId);
        if (rpdbApiKey && finalMetas) {
          finalMetas = processPosterUrls([...finalMetas], rpdbApiKey);
        }
        const userConfig = await configManager.getConfig(userId);
        if (
          userConfig.randomizedCatalogs?.includes(`mdblist_${potentialNumericId}`) &&
          finalMetas.length > 1
        ) {
          finalMetas = shuffleArray(finalMetas);
        }
        return { metas: finalMetas };
      }
    }

    logger.warn(`processMDBListCatalog could not determine handler for ID: ${args.id}`);
    return { metas: [] }; // Fallback
  } catch (error) {
    logger.error(
      `Error processing MDBList catalog/watchlist for ID ${args.id} (User: ${userId}):`,
      error
    );
    return { metas: [] };
  }
}

/**
 * Create an addon interface for a specific user
 */
export async function getAddonInterface(userId: string, db: D1Database) {
  if (addonCache.has(userId)) {
    logger.debug(`Using cached addon interface for user ${userId}`);
    return addonCache.get(userId);
  }

  // Initialize config manager with the database
  configManager.setDatabase(db);

  // Get the user's catalogs
  const userCatalogs = await configManager.getAllCatalogs(userId);
  logger.info(`Found ${userCatalogs.length} catalogs for user ${userId}`);

  // Update MDBList catalog names if they're using generic names
  for (const catalog of userCatalogs) {
    // Check if this is an MDBList catalog by its ID format
    if (catalog.id && catalog.id.includes('mdblist_')) {
      // If the name is generic (contains the ID), try to update it
      if (catalog.name && (catalog.name.includes('MDBList') || catalog.name.includes(catalog.id))) {
        try {
          // Extract MDBList ID
          let mdblistId = catalog.id.replace('mdblist_', '');
          if (mdblistId.includes('_')) {
            mdblistId = mdblistId.split('_')[0]; // Handle IDs like mdblist_123_mdblist_123
          }

          // Get the API key for this user
          const apiKey = await configManager.loadMDBListApiKey(userId);
          if (apiKey) {
            // Fetch list details to get real name
            const listDetails = await fetchListDetails(mdblistId, apiKey);
            if (listDetails && listDetails.name) {
              // Update the catalog name with the real list name
              catalog.name = listDetails.name;
            }
          }
        } catch (error) {
          logger.warn(`Error updating MDBList catalog name: ${error}`);
        }
      }
    }
  }

  // Get the user's config to access randomizedCatalogs
  const userConfig = await configManager.getConfig(userId);
  const randomizedCatalogs = userConfig.randomizedCatalogs || [];

  // Build the manifest
  const manifest = buildManifest(userId, version, description, userCatalogs);

  // Create AddonInterface
  const addonInterface = {
    manifest,

    // Catalog handler
    async catalog(args: CatalogRequest): Promise<CatalogResponse> {
      logger.debug(`Catalog request for ${userId} - ${args.type}/${args.id}`);

      // Check if it's the watchlist (highest priority check)
      if (args.id.startsWith('aiocatalogs_mdb_user_watchlist_')) {
        logger.debug(`Routing to processMDBListCatalog for watchlist: ${args.id}`);
        return processMDBListCatalog(args, userId); // Ensure this function handles watchlist IDs correctly
      }
      // Check for regular MDBList catalogs (identified by mdblist_ followed by a numeric list ID)
      else if (
        args.id.startsWith('mdblist_') &&
        args.id.split('_')[1] &&
        /^\d+$/.test(args.id.split('_')[1])
      ) {
        logger.debug(`Routing to processMDBListCatalog for regular MDBList: ${args.id}`);
        return processMDBListCatalog(args, userId);
      }

      // Process regular catalogs
      const result = await handleCatalogRequest(args, userCatalogs, randomizedCatalogs);

      // Get the user's RPDB API key
      const rpdbApiKey = await loadUserRPDBApiKey(userId);

      // Process posters if RPDB API key is available
      if (rpdbApiKey && result.metas) {
        result.metas = processPosterUrls([...result.metas], rpdbApiKey);
      }

      return result;
    },

    // Meta handler - not implemented
    async meta() {
      return { meta: null };
    },

    // Stream handler - not implemented
    async stream() {
      return { streams: [] };
    },

    // Handle catalog request
    async handleCatalog(userId: string, args: any) {
      logger.debug(`Handling catalog request for user ${userId} with args:`, args);

      // Check if this is a MDBList catalog request
      if (args.id && args.id.includes('mdblist_')) {
        return processMDBListCatalog(args, userId);
      }

      // Handle regular catalogs
      const userCatalogs = await configManager.getAllCatalogs(userId);
      logger.info(`Found ${userCatalogs.length} catalogs for user ${userId}`);

      // Handle default catalog case
      if (!userCatalogs || userCatalogs.length === 0) {
        logger.info(`User ${userId} has no catalogs configured`);
        if (args.id === 'aiocatalogs-default') {
          return { metas: [] };
        }
        logger.error(`Source ${args.id} not found in user catalogs`);
        return { metas: [] };
      }

      // Get randomized catalogs
      const userConfig = await configManager.getConfig(userId);
      const randomizedCatalogs = userConfig.randomizedCatalogs || [];

      const result = await handleCatalogRequest(args, userCatalogs, randomizedCatalogs);

      // Get the user's RPDB API key
      const rpdbApiKey = await loadUserRPDBApiKey(userId);

      // Process posters if RPDB API key is available
      if (rpdbApiKey && result.metas) {
        result.metas = processPosterUrls([...result.metas], rpdbApiKey);
      }

      return result;
    },
  };

  addonCache.set(userId, addonInterface);
  return addonInterface;
}

// Clear cache for a specific user
export function clearAddonCache(userId: string): void {
  if (addonCache.has(userId)) {
    logger.debug(`Clearing addon cache for user ${userId}`);
    addonCache.delete(userId);
  }
}

// Clear entire addon cache
export function clearAllAddonCache() {
  logger.debug('Clearing entire addon cache');
  addonCache.clear();
}

/**
 * Helper function to parse catalog request parameters
 */
function parseCatalogRequest(path: string, request: any): CatalogRequest {
  const parts = path.split('/');
  const type = parts[0] || '';
  const id = parts[1] || '';
  const extra = parts[2] || '';

  // Parse query parameters
  const url = new URL(request.url);
  const skip = parseInt(url.searchParams.get('skip') || '0', 10);
  const limit = parseInt(url.searchParams.get('limit') || '100', 10);
  const genre = url.searchParams.get('genre') || undefined;
  const search = url.searchParams.get('search') || undefined;

  return {
    type,
    id,
    extra,
    skip,
    limit,
    genre,
    search,
  };
}

/**
 * Get manifest for a specific user
 */
async function getManifest(userId: string): Promise<Response> {
  try {
    // Get the user's catalogs
    const userCatalogs = await configManager.getAllCatalogs(userId);
    logger.info(`Found ${userCatalogs.length} catalogs for user ${userId}`);

    // Build the manifest
    const manifest = buildManifest(userId, version, description, userCatalogs);

    return new Response(JSON.stringify(manifest), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  } catch (error) {
    logger.error('Error getting manifest:', error);
    return new Response('Server error', { status: 500 });
  }
}

/**
 * Main handler for addon requests
 */
export async function handleAddonResource(request: any, userId: string) {
  try {
    // Get the path from the request
    const url = new URL(request.url);
    const path = url.pathname.split(`/${userId}/`)[1];

    // If no path, return the manifest
    if (!path) {
      return getManifest(userId);
    }

    // Handle catalog requests
    if (path.startsWith('catalog/')) {
      const catalogPath = path.replace('catalog/', '');
      const catalogRequest = parseCatalogRequest(catalogPath, request);

      // Check if it's a MDBList catalog request
      if (catalogRequest.id && catalogRequest.id.startsWith('mdblist_')) {
        const result = await processMDBListCatalog(catalogRequest, userId);

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        });
      }

      // Handle regular catalog requests
      const userCatalogs = await configManager.getAllCatalogs(userId);
      const userConfig = await configManager.getConfig(userId);
      const randomizedCatalogs = userConfig.randomizedCatalogs || [];

      const result = await handleCatalogRequest(catalogRequest, userCatalogs, randomizedCatalogs);

      // Get the user's RPDB API key
      const rpdbApiKey = await loadUserRPDBApiKey(userId);

      // Process posters if RPDB API key is available
      if (rpdbApiKey && result.metas) {
        result.metas = processPosterUrls([...result.metas], rpdbApiKey);
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      });
    }

    // If no matching route, return 404
    return new Response('Not found', { status: 404 });
  } catch (error) {
    logger.error('Error handling addon request:', error);
    return new Response('Server error', { status: 500 });
  }
}

/**
 * Helper function to perform Fisher-Yates shuffle on an array in place
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
