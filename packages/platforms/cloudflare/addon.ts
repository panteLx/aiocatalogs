import { CatalogRequest, CatalogResponse, D1Database, MetaItem } from './types';
import { configManager } from './configManager';
import packageJson from '../../../package.json';
import { buildManifest, handleCatalogRequest } from '../../core/utils/manifestBuilder';
import { logger } from '../../core/utils/logger';
import { fetchMDBListCatalog, fetchListDetails } from '../../core/utils/mdblist';

// Cache for builders to avoid multiple creations
const addonCache = new Map();

// Import package.json with correct path
const { version, description } = packageJson;

/**
 * Helper function to process MDBList catalog requests
 */
async function processMDBListCatalog(args: any, userId: string): Promise<{ metas: MetaItem[] }> {
  try {
    // Extract the MDBList ID from the catalog ID
    // Handle both formats: mdblist_2236 and mdblist_2236_mdblist_2236
    let mdblistId = args.id.replace('mdblist_', '');

    // Handle doubled ID case (mdblist_2236_mdblist_2236)
    if (mdblistId.includes('mdblist_')) {
      mdblistId = mdblistId.split('_mdblist_')[0];
    }

    logger.debug(`Processing MDBList catalog request for list ID: ${mdblistId}`);

    // Get the API key for this user
    const apiKey = await configManager.loadMDBListApiKey(userId);
    if (!apiKey) {
      logger.warn(`No MDBList API key found for user ${userId}`);
      return { metas: [] };
    }

    // Fetch the MDBList catalog with all items using the user's API key
    const result = await fetchMDBListCatalog(mdblistId, apiKey);

    // Keep track of what types are available in this catalog
    const hasMovies = result.metas.some(item => item.type === 'movie');
    const hasSeries = result.metas.some(item => item.type === 'series');

    // Only filter by type if the catalog has content of that type
    // otherwise return all content regardless of requested type
    if (args.type === 'movie' && hasMovies) {
      result.metas = result.metas.filter(item => item.type === 'movie');
    } else if (args.type === 'series' && hasSeries) {
      result.metas = result.metas.filter(item => item.type === 'series');
    } else {
      // If we're requesting a type that doesn't exist in this catalog,
      // return all items - this prevents empty results for catalogs that
      // only have one type of content
      logger.debug(
        `Requested type ${args.type} not found in MDBList ${mdblistId}, returning all items`
      );
    }

    return result;
  } catch (error) {
    logger.error(`Error processing MDBList catalog: ${error}`);
    return { metas: [] };
  }
}

// Create AddonInterface for a specific user
export async function getAddonInterface(userId: string, db: D1Database) {
  if (addonCache.has(userId)) {
    return addonCache.get(userId);
  }

  // Ensure database is set in configManager
  configManager.setDatabase(db);

  // Get all catalogs for the user
  const userCatalogs = await configManager.getAllCatalogs(userId);

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

  // Create manifest
  const manifest = buildManifest(userId, version, description, userCatalogs);

  // Create AddonInterface
  const addonInterface = {
    manifest,

    // Catalog handler
    async catalog(args: CatalogRequest): Promise<CatalogResponse> {
      logger.debug(`Catalog request for ${userId} - ${args.type}/${args.id}`);

      // Check if this is a MDBList catalog request
      if (args.id && args.id.includes('mdblist_')) {
        return processMDBListCatalog(args, userId);
      }

      // Process regular catalogs
      return handleCatalogRequest(args, userCatalogs);
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

      if (!userCatalogs || userCatalogs.length === 0) {
        logger.info(`User ${userId} has no catalogs configured or they couldn't be loaded`);
        return { metas: [] };
      }

      return handleCatalogRequest(args, userCatalogs);
    },
  };

  addonCache.set(userId, addonInterface);
  return addonInterface;
}

// Clear cache for a specific user
export function clearAddonCache(userId: string) {
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
