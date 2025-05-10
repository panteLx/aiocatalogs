import { CatalogManifest, UserConfig } from '../types';

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
    };

    // Collect all catalogs, types and resources
    const allTypes = new Set<string>();
    const allResources = new Set<string>();

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
        source.catalogs.forEach(catalog => {
          // Skip catalogs with 'search' in their ID as they don't contain content
          if (!catalog.id.toLowerCase().includes('search')) {
            manifest.catalogs.push({
              id: `${source.id}:${catalog.id}`,
              type: catalog.type,
              name: `${catalog.name}`,
            });

            // Collect types for the manifest
            allTypes.add(catalog.type);
          } else {
            console.log(`Skipping catalog with search in ID: ${catalog.id}`);
          }
        });

        // Collect resources from the source -
        // but only keep those we support
        if (source.resources) {
          source.resources.forEach(resource => {
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
  args: {
    type: string;
    id: string;
  },
  userCatalogs: CatalogManifest[]
): Promise<{ metas: any[] }> {
  console.log(`Catalog request for type ${args.type}, id ${args.id}`);

  try {
    // Handle default catalog
    if (args.id === 'aiocatalogs-default') {
      return {
        metas: [
          {
            id: 'setup-required',
            type: args.type,
            name: 'Setup Required',
            poster: 'https://i.imgur.com/fRPYeIV.png',
            description: 'Please visit the configuration page to add catalogs.',
          },
        ],
      };
    }

    // The catalog ID format is: sourceId:catalogId
    // Split ID to identify source and catalog
    const idParts = args.id.split(':');
    if (idParts.length !== 2) {
      console.error(`Invalid catalog ID format: ${args.id}`);
      return { metas: [] };
    }

    const sourceId = idParts[0];
    const catalogId = idParts[1];

    // Get catalog source from user configuration
    const source = userCatalogs.find(c => c.id === sourceId);

    if (!source) {
      console.error(`Source not found: ${sourceId}`);
      return { metas: [] };
    }

    // Find catalog in the source
    const catalog = source.catalogs.find(c => c.type === args.type && c.id === catalogId);

    if (!catalog) {
      console.error(`Catalog not found: ${catalogId} in source ${sourceId}`);
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
  } catch (error) {
    console.error(`Error handling catalog request: ${error}`);
    return { metas: [] };
  }
}
