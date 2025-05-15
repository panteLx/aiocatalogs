/**
 * Common types shared between addon and cloudflare packages
 */

export interface CatalogManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  resources: string[];
  types: string[];
  catalogs: {
    type: string;
    id: string;
    name: string;
  }[];
  idPrefixes?: string[];
  behaviorHints?: {
    adult?: boolean;
    p2p?: boolean;
  };
  endpoint: string;
  context?: any; // Additional context information (like apiKey)
  customName?: string; // Custom name for the catalog defined by the user
}

export interface UserConfig {
  catalogs: CatalogManifest[];
  catalogOrder?: string[]; // Array of catalog IDs in the desired order
  randomizedCatalogs?: string[]; // Array of catalog IDs that should have randomized items
  _cachedAt?: number; // Timestamp when the config was cached
}

export interface MetaPreviewItem {
  id: string;
  type: string;
  name: string;
  poster?: string;
  background?: string;
  logo?: string;
  description?: string;
}

// Catalog request/response types
export interface CatalogRequest {
  type: string; // Content type (e.g. 'movie', 'series')
  id: string; // Catalog ID
  extra?: any; // Additional parameters
  skip?: number; // Number of items to skip
  limit?: number; // Maximum number of items to return
  genre?: string; // Filter by genre
  search?: string; // Search query
}

export interface CatalogResponse {
  metas: MetaItem[]; // List of meta objects
}

// Meta item structure
export interface MetaItem extends MetaPreviewItem {
  releaseInfo?: string; // Release information (e.g. year)
  imdbRating?: string; // IMDB rating
  director?: string[]; // Directors
  cast?: string[]; // Actors
  genres?: string[]; // Genres
  sourceAddon?: string; // Source addon ID
  [key: string]: any; // Additional fields
}
