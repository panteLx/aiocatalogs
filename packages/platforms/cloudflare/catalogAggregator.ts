import { CatalogManifest } from '../../types/index';
import { BaseCatalogAggregator } from '../../core/catalog/catalogAggregator';

export class CloudflareCatalogAggregator extends BaseCatalogAggregator {
  // Add Cloudflare-specific functionality here if needed
}

// Singleton instance
export const catalogAggregator = new CloudflareCatalogAggregator();
