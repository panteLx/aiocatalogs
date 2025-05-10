// Data types for Cloudflare D1
import { D1Database as CloudflareD1Database } from '@cloudflare/workers-types';

export type D1Database = CloudflareD1Database;

// Import common types from the types package
import {
  UserConfig,
  CatalogManifest,
  MetaPreviewItem,
  CatalogRequest,
  CatalogResponse,
  MetaItem,
} from '../../types/index';

// Re-export of common types
export { UserConfig, CatalogManifest, MetaPreviewItem, CatalogRequest, CatalogResponse, MetaItem };

// Cloudflare Worker Environment
export interface Env {
  DB: D1Database;
  // Add an index signature to meet the Env type requirements
  [key: string]: any;
}
