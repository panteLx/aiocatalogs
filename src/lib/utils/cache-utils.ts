import { revalidateTag } from "next/cache";

/**
 * Cache invalidation utilities for MDBList data
 */
export function invalidateMDBListCache() {
  try {
    revalidateTag("mdblist-data");
    console.log("MDBList cache invalidated successfully");
  } catch (error) {
    console.error("Failed to invalidate MDBList cache:", error);
  }
}

/**
 * Invalidate MDBList cache when catalogs are modified
 * Should be called when:
 * - Adding new catalogs
 * - Removing catalogs
 * - Updating catalog properties (name, RPDB settings, etc.)
 * - Reordering catalogs
 */
export function invalidateCacheOnCatalogChange() {
  invalidateMDBListCache();
}

/**
 * Invalidate GitHub changelog cache
 * Can be called manually if needed (e.g., after deployments)
 */
export function invalidateChangelogCache() {
  try {
    revalidateTag("github-releases");
    console.log("GitHub changelog cache invalidated successfully");
  } catch (error) {
    console.error("Failed to invalidate GitHub changelog cache:", error);
  }
}
