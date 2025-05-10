import { CatalogRequest, CatalogResponse, D1Database, MetaItem } from './types';
import { configManager } from './configManager';
import packageJson from '../../../package.json';
import { buildManifest, handleCatalogRequest } from '../../core/utils/manifestBuilder';

// Cache for builders to avoid multiple creations
const addonCache = new Map();

const ADDON_ID = 'community.aiocatalogs';

// Import package.json with correct path
const { version, description } = packageJson;

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

    // Handle catalog request
    async handleCatalog(userId: string, args: any) {
      console.log(`Handling catalog request for user ${userId} with args: ${JSON.stringify(args)}`);
      const userCatalogs = await configManager.getAllCatalogs(userId);
      console.log(`Found ${userCatalogs.length} catalogs for user ${userId}`);

      if (!userCatalogs || userCatalogs.length === 0) {
        console.log(`User ${userId} has no catalogs configured or they couldn't be loaded`);
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
    console.log(`Clearing addon cache for user ${userId}`);
    addonCache.delete(userId);
  }
}

// Clear entire addon cache
export function clearAllAddonCache() {
  console.log('Clearing entire addon cache');
  addonCache.clear();
}
