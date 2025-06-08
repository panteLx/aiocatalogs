/**
 * Memory-based cache utility for cross-environment compatibility
 */

// Simple in-memory cache for cross-environment compatibility
const memoryCache = new Map<string, { data: unknown; expires: number }>();

/**
 * Unified cached function that works in both Cloudflare Workers and Next.js environments
 * Similar to Next.js unstable_cache but with cross-environment support
 */
export function createCachedFunction<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  keyParts: string[],
  options: { revalidate: number } = { revalidate: 3600 },
): (...args: TArgs) => Promise<TReturn> {
  const cacheKey = keyParts.join("-");

  return async (...args: TArgs): Promise<TReturn> => {
    const now = Date.now();
    const cached = memoryCache.get(cacheKey);

    // Check if we have valid cached data
    if (cached && cached.expires > now) {
      console.log(`🎯 Cache hit for key: ${cacheKey}`);
      return cached.data as TReturn;
    }

    // Cache miss or expired, fetch new data
    console.log(`🔄 Cache miss for key: ${cacheKey}, fetching fresh data`);
    const result = await fn(...args);

    // Store in cache with expiration
    memoryCache.set(cacheKey, {
      data: result,
      expires: now + options.revalidate * 1000,
    });

    console.log(
      `💾 Cached data for key: ${cacheKey} (expires in ${options.revalidate}s)`,
    );
    return result;
  };
}

/**
 * Invalidate MDBList cache - clears all MDBList-related cache entries
 */
export function invalidateMDBListCache(): void {
  // Clear all cache entries that start with "mdblist-api"
  const keysToDelete = Array.from(memoryCache.keys()).filter((key) =>
    key.startsWith("mdblist-api"),
  );

  keysToDelete.forEach((key) => {
    memoryCache.delete(key);
    console.log(`🗑️ Cleared MDBList cache for key: ${key}`);
  });

  if (keysToDelete.length === 0) {
    console.log(`🗑️ No MDBList cache entries found to clear`);
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
export function invalidateCacheOnCatalogChange(): void {
  invalidateMDBListCache();
}
