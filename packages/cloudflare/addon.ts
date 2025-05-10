import { CatalogRequest, CatalogResponse, D1Database, MetaItem } from './types';
import { configManager } from './configManager';
import { version, description } from '../../package.json';
import { buildManifest, handleCatalogRequest } from '../shared/manifestBuilder';

// Cache for builders to avoid multiple creations
const addonCache = new Map();

const ADDON_ID = 'community.aiocatalogs';

// Create AddonInterface for a specific user
export async function getAddonInterface(userId: string, db: D1Database) {
  if (addonCache.has(userId)) {
    return addonCache.get(userId);
  }

  // Ensure database is set in configManager
  configManager.setDatabase(db);

  // Get all catalogs for the user
  const userCatalogs = await configManager.getAllCatalogs(userId);

  // Create manifest
  const manifest = buildManifest(userId, version, description, userCatalogs);

  // Create AddonInterface
  const addonInterface = {
    manifest,

    // Catalog handler
    async catalog(args: CatalogRequest): Promise<CatalogResponse> {
      console.log(`Catalog request for ${userId} - ${args.type}/${args.id}`);
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
  };

  addonCache.set(userId, addonInterface);
  return addonInterface;
}

// Clear cache for a specific user
export function clearAddonCache(userId: string) {
  if (addonCache.has(userId)) {
    console.log(`Clearing addon cache for user ${userId}`);
    addonCache.delete(userId);
  }
}

// Clear entire addon cache
export function clearAllAddonCache() {
  console.log('Clearing entire addon cache');
  addonCache.clear();
}
