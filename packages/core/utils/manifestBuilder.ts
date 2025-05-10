import { CatalogManifest, UserConfig } from '../../types/index';

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
    console.log(`Building manifest for user ${userId} with ${userCatalogs.length} catalog sources`);

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
    console.error('Error building manifest:', error);

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
    };
  }
}

/**
 * Handle catalog request
 *
 * @param args Catalog request parameters
 * @param userCatalogs List of catalog sources for the user
 * @returns Catalog response
 */
export async function handleCatalogRequest(
  args: any,
  userCatalogs: CatalogManifest[]
): Promise<any> {
  console.log(`Handling catalog request with args: ${JSON.stringify(args)}`);

  // Find the target source catalog
  const catalogId = args.id.split('_')[1]; // Extract the original catalog ID
  const sourceId = args.id.split('_')[0]; // Extract the source addon ID

  // Find the source catalog from user's catalogs
  const source = userCatalogs.find(c => c.id === sourceId);

  if (!source) {
    console.error(`Source ${sourceId} not found in user catalogs`);
    return { metas: [] };
  }

  // Find the specific catalog within the source
  const catalog = source.catalogs.find((c: any) => c.type === args.type && c.id === catalogId);

  if (!catalog) {
    console.error(`Catalog ${catalogId} of type ${args.type} not found in source ${sourceId}`);
    return { metas: [] };
  }

  // Create catalog endpoint
  const endpoint = source.endpoint.endsWith('/') ? source.endpoint.slice(0, -1) : source.endpoint;
  const url = `${endpoint}/catalog/${args.type}/${catalogId}.json`;
  console.log(`Fetching catalog from: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Error fetching catalog: ${response.statusText}`);
      return { metas: [] };
    }

    const data = (await response.json()) as { metas?: any[] };
    const metas = data.metas || [];

    // Add source to each item
    if (Array.isArray(metas)) {
      metas.forEach((item: any) => {
        item.sourceAddon = sourceId;
      });
    }

    return { metas };
  } catch (error) {
    console.error(`Error fetching catalog: ${error}`);
    return { metas: [] };
  }
}
