import { CatalogManifest, UserConfig } from '../../types/index';
import { logger } from './logger';

export const ADDON_ID = 'community.aiocatalogs';

/**
 * Build a manifest for a specific user
 *
 * @param userId User ID
 * @param version Version from package.json
 * @param description Description from package.json
 * @param userCatalogs List of catalog sources for the user
 * @returns The built manifest object
 */
export function buildManifest(
  userId: string,
  version: string,
  description: string,
  userCatalogs: CatalogManifest[]
) {
  try {
    logger.debug(
      `Building manifest for user ${userId} with ${userCatalogs.length} catalog sources`
    );

    // Initialize manifest object
    const manifest = {
      id: `${ADDON_ID}.${userId}`,
      version,
      name: 'AIOCatalogs',
      description,
      logo: 'https://i.imgur.com/fRPYeIV.png',
      background: 'https://i.imgur.com/QPPXf5T.jpeg',
      resources: [] as string[],
      types: [] as string[],
      catalogs: [] as Array<{ id: string; type: string; name: string }>,
      behaviorHints: {
        configurable: true,
        configurationRequired: false,
      },
      idPrefixes: [],
    };

    // Collect all catalogs, types and resources
    const allTypes = new Set<string>();
    const allResources = new Set<string>();
    const catalogIds = new Set<string>();

    // Only add 'catalog' since we only define this handler
    allResources.add('catalog');

    // Add catalogs to the manifest
    if (userCatalogs.length === 0) {
      // Default catalog if no catalogs were configured
      manifest.catalogs.push({
        id: 'aiocatalogs-default',
        type: 'movie',
        name: 'AIO Catalogs (No catalogs added yet)',
      });
      allTypes.add('movie');

      // Add stremioAddonsConfig when no catalogs are added
      (manifest as any).stremioAddonsConfig = {
        issuer: 'https://stremio-addons.net',
        signature:
          'eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0..aT0Md3j84gmtCUKxzsvn8A.71Mk-B82vQfci-ndjLqR5L568LFuG4JgS4yGD63q87tjric2vORJk0aqw23RG3c9cONs3-8HozwGeGvcmZbfktjYd5UKe9LGBNSbBmWJ7Y2U2elIhTgXHXRUVCCTZg_R.oRtgV-h1gfSmRAN4AMEZNg',
      };
    } else {
      // Add catalogs from user configurations
      userCatalogs.forEach(source => {
        // Add catalogs from this source
        if (source.catalogs && source.catalogs.length > 0) {
          source.catalogs.forEach((catalog: any) => {
            // Skip catalogs with 'search' in the ID as they don't contain content
            if (catalog.id.toLowerCase().includes('search')) {
              return;
            }

            // Add a prefix to the catalog ID to ensure uniqueness
            const prefixedId = `${source.id}_${catalog.id}`;

            // Only add if not already in the collection
            if (!catalogIds.has(prefixedId)) {
              manifest.catalogs.push({
                ...catalog,
                id: prefixedId,
                source: source.id,
                // Use customName if available, otherwise use original catalog name
                name: source.customName || catalog.name,
              });
              catalogIds.add(prefixedId);
            }
          });
        }

        // Collect resources from the source -
        // but only keep those we support
        if (source.resources && source.resources.length > 0) {
          source.resources.forEach((resource: string) => {
            if (resource === 'catalog') {
              allResources.add(resource);
            }
          });
        }
      });
    }

    // Insert collected types and resources into the manifest
    manifest.types = Array.from(allTypes);
    manifest.resources = Array.from(allResources);

    return manifest;
  } catch (error) {
    logger.error('Error building manifest:', error);

    // Return fallback manifest
    return {
      id: `${ADDON_ID}.${userId}`,
      version,
      name: 'AIOCatalogs',
      description: 'Error loading configuration',
      logo: 'https://i.imgur.com/fRPYeIV.png',
      background: 'https://i.imgur.com/QPPXf5T.jpeg',
      resources: ['catalog'],
      types: ['movie'],
      catalogs: [
        {
          type: 'movie',
          id: 'error',
          name: 'Error: Configuration could not be loaded',
        },
      ],
      behaviorHints: {
        configurable: true,
        configurationRequired: false,
      },
      // Add stremioAddonsConfig to the fallback manifest as well
      stremioAddonsConfig: {
        issuer: 'https://stremio-addons.net',
        signature:
          'eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0..aT0Md3j84gmtCUKxzsvn8A.71Mk-B82vQfci-ndjLqR5L568LFuG4JgS4yGD63q87tjric2vORJk0aqw23RG3c9cONs3-8HozwGeGvcmZbfktjYd5UKe9LGBNSbBmWJ7Y2U2elIhTgXHXRUVCCTZg_R.oRtgV-h1gfSmRAN4AMEZNg',
      },
    };
  }
}

/**
 * Handle catalog request
 *
 * @param args Catalog request parameters
 * @param userCatalogs List of catalog sources for the user
 * @param randomizedCatalogs List of catalog IDs to randomize
 * @returns Catalog response
 */
export async function handleCatalogRequest(
  args: any, // e.g., args.id is "aiocatalogs_mdb_user_watchlist_movies"
  userCatalogs: CatalogManifest[], // Array of "source" manifests from user config
  randomizedCatalogs: string[] = []
): Promise<any> {
  logger.debug(`Handling catalog request with args:`, args);

  let foundSource: CatalogManifest | undefined = undefined;
  let innerCatalogIdToFetch: string | undefined = undefined; // This is the ID like "movies" or "series"

  // Iterate through each configured source manifest
  for (const sourceCfg of userCatalogs) {
    // sourceCfg.id is e.g., "aiocatalogs_mdb_user_watchlist"
    // sourceCfg.catalogs contains inner definitions like { id: "movies", type: "movie", ... }

    if (args.id.startsWith(sourceCfg.id + "_")) {
      const potentialInnerId = args.id.substring((sourceCfg.id + "_").length);
      // Now check if this potentialInnerId actually matches one of the inner catalogs for this source
      const matchingInnerCatalog = sourceCfg.catalogs.find(
        (innerCat: any) => innerCat.id === potentialInnerId && innerCat.type === args.type
      );
      if (matchingInnerCatalog) {
        foundSource = sourceCfg;
        innerCatalogIdToFetch = matchingInnerCatalog.id;
        break;
      }
    }
  }

  if (!foundSource || !innerCatalogIdToFetch) {
    // Handle default catalog case more robustly if needed, or just log error
    if (args.id === 'aiocatalogs-default' && userCatalogs.length === 0 && args.type === 'movie') {
        logger.info('Serving empty metas for aiocatalogs-default (movie type) as no catalogs are configured.');
        return { metas: [] };
    }
    logger.error(`Source or inner catalog not found for args.id: ${args.id} of type ${args.type}`);
    return { metas: [] };
  }

  if (foundSource.endpoint.startsWith('internal://')) {
      logger.warn(`Internal source ${foundSource.id} was not handled by specific logic and fell through to generic handleCatalogRequest. This might indicate a routing issue in addon.ts.`);
      return { metas: [] };
  }

  // Original logic for fetching from external addon manifests:
  const endpoint = foundSource.endpoint.endsWith('/') ? foundSource.endpoint.slice(0, -1) : foundSource.endpoint;
  // Use innerCatalogIdToFetch for the specific catalog ID within the source
  const url = `${endpoint}/catalog/${args.type}/${innerCatalogIdToFetch}.json`;
  logger.debug(`Fetching (external) catalog from: ${url} (Source: ${foundSource.id}, Catalog: ${innerCatalogIdToFetch})`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      logger.error(`Error fetching catalog: ${response.statusText} from ${url}`);
      return { metas: [] };
    }

    const data = (await response.json()) as { metas?: any[] };
    let metas = data.metas || [];

    if (Array.isArray(metas)) {
      metas.forEach((item: any) => {
        item.sourceAddon = foundSource!.id; // foundSource is guaranteed to be defined here
      });

      const shouldRandomize = randomizedCatalogs.includes(foundSource!.id);
      if (shouldRandomize && metas.length > 1) {
        logger.debug(`Randomizing catalog items for ${foundSource!.id}`);
        for (let i = metas.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [metas[i], metas[j]] = [metas[j], metas[i]];
        }
      }
    }
    return { metas };
  } catch (error) {
    logger.error(`Exception fetching catalog from ${url}:`, error);
    return { metas: [] };
  }
}
