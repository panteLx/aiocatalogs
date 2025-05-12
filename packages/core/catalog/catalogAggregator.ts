import { CatalogManifest } from '../../types/index';
import { logger } from '../utils/logger';

// Interface for raw data from the manifest API
interface RawManifest {
  id: string;
  name: string;
  description?: string;
  version?: string;
  resources?: string[];
  types?: string[];
  catalogs: { type: string; id: string; name: string }[];
  idPrefixes?: string[];
  behaviorHints?: {
    adult?: boolean;
    p2p?: boolean;
  };
}

/**
 * Shared catalog aggregator functionality that can be used
 * in both Cloudflare and Node.js environments
 */
export abstract class BaseCatalogAggregator {
  /**
   * Fetch a catalog manifest from a URL
   */
  async fetchCatalogManifest(catalogUrl: string, context?: any): Promise<CatalogManifest | null> {
    try {
      // Normalize the URL to ensure it points to the manifest.json
      let endpoint = catalogUrl;
      if (endpoint.endsWith('/manifest.json')) {
        endpoint = endpoint.substring(0, endpoint.length - '/manifest.json'.length);
      }

      // Add trailing slash if missing
      if (!endpoint.endsWith('/')) {
        endpoint += '/';
      }

      const manifestUrl = `${endpoint}manifest.json`;
      logger.debug(`Fetching manifest from: ${manifestUrl}`);

      const response = await fetch(manifestUrl);

      if (!response.ok) {
        logger.error(`Failed to fetch manifest: ${response.statusText}`);
        return null;
      }

      const data = await response.json();

      // Type checking of required fields
      if (!data || typeof data !== 'object') {
        logger.error('Invalid manifest format: not an object');
        return null;
      }

      // Cast to RawManifest for type safety
      const manifest = data as RawManifest;

      // Check if the manifest is valid and contains required fields
      if (!manifest.id || !manifest.name || !manifest.catalogs) {
        logger.error('Invalid manifest format: missing required fields');
        return null;
      }

      // Filter out catalogs with 'search' in their ID as they don't contain content
      const filteredCatalogs = manifest.catalogs.filter(
        (cat: { id: string }) => !cat.id.toLowerCase().includes('search')
      );

      if (manifest.catalogs.length !== filteredCatalogs.length) {
        logger.info(
          `Filtered out ${manifest.catalogs.length - filteredCatalogs.length} search catalogs from ${manifest.name}`
        );
      }

      // Create a CatalogManifest object
      const catalogManifest: CatalogManifest = {
        id: manifest.id,
        name: manifest.name,
        description: manifest.description || `Catalog from ${catalogUrl}`,
        endpoint: endpoint,
        version: manifest.version || '0.0.1',
        resources: manifest.resources || ['catalog'],
        types: manifest.types || ['movie', 'series'],
        catalogs: filteredCatalogs,
        idPrefixes: manifest.idPrefixes,
        behaviorHints: manifest.behaviorHints,
        context: context, // Store the context for future use
      };

      logger.info(
        `Successfully fetched manifest for ${catalogManifest.name} with ${catalogManifest.catalogs.length} catalogs`
      );
      return catalogManifest;
    } catch (error) {
      logger.error('Error fetching catalog manifest:', error);
      return null;
    }
  }

  /**
   * Fetch catalog data from an endpoint
   */
  async fetchCatalogData(endpoint: string, type: string, id: string): Promise<any> {
    try {
      // Ensure the endpoint is correctly formatted
      const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
      const url = `${baseUrl}/catalog/${type}/${id}.json`;

      logger.debug(`Fetching catalog data from ${url}`);
      const response = await fetch(url);

      if (!response.ok) {
        logger.error(`Failed to fetch catalog data: ${response.statusText}`);
        return { metas: [] };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error fetching catalog data:', error);
      return { metas: [] };
    }
  }

  /**
   * Check if a catalog is reachable
   */
  async checkCatalogHealth(manifest: CatalogManifest): Promise<boolean> {
    try {
      const endpoint = manifest.endpoint.endsWith('/')
        ? manifest.endpoint
        : manifest.endpoint + '/';

      const response = await fetch(`${endpoint}manifest.json`);
      return response.ok;
    } catch (error) {
      logger.error(`Health check failed for ${manifest.id}:`, error);
      return false;
    }
  }
}
