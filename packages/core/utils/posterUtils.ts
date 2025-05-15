import { logger } from './logger';
import { appConfig } from '../../platforms/cloudflare/appConfig';

// Cache for storing poster URLs to reduce API requests
// Key format: `${mediaId}_${rpdbApiKey}`
const posterUrlCache = new Map<string, { url: string; timestamp: number }>();

// Cache expiration time in milliseconds (default: 7 days)
const CACHE_EXPIRATION_TIME = (appConfig.api.cacheExpirationRPDB ?? 7) * 24 * 60 * 60 * 1000;

/**
 * Returns the appropriate poster URL - either using RPDB or the original URL
 *
 * @param originalUrl The original poster URL
 * @param rpdbApiKey The user's RPDB API key (if any)
 * @param mediaId The media ID (usually IMDb ID)
 * @returns The URL to use for the poster
 */
export function getPosterUrl(
  originalUrl: string | undefined,
  rpdbApiKey: string | null,
  mediaId: string
): string {
  // If no RPDB API key or no original URL, return the original URL
  if (!rpdbApiKey || !originalUrl) {
    return originalUrl || '';
  }

  try {
    // Check if we have this poster URL cached
    const cacheKey = `${mediaId}_${rpdbApiKey}`;
    const cachedItem = posterUrlCache.get(cacheKey);

    // Use cached URL if it exists and hasn't expired
    if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_EXPIRATION_TIME) {
      logger.debug(`Using cached RPDB URL for ${mediaId}`);
      return cachedItem.url;
    }

    // Construct the RPDB URL
    const rpdbUrl = `https://api.ratingposterdb.com/${rpdbApiKey}/imdb/poster-default/${mediaId}.jpg?fallback=true`;

    logger.debug(`Replacing poster URL: ${originalUrl} with RPDB URL: ${rpdbUrl}`);

    // Cache the URL
    posterUrlCache.set(cacheKey, {
      url: rpdbUrl,
      timestamp: Date.now(),
    });

    return rpdbUrl;
  } catch (error) {
    // In case of any errors, fall back to the original URL
    logger.error(`Error constructing RPDB poster URL for ${mediaId}:`, error);
    return originalUrl;
  }
}

/**
 * Process meta items to replace poster URLs with RPDB URLs when applicable
 *
 * @param metas Array of meta items with poster URLs
 * @param rpdbApiKey The user's RPDB API key (if any)
 * @returns The same array with processed poster URLs
 */
export function processPosterUrls(metas: any[], rpdbApiKey: string | null): any[] {
  if (!rpdbApiKey) {
    return metas;
  }

  return metas.map(meta => {
    if (meta.poster && meta.id) {
      meta.poster = getPosterUrl(meta.poster, rpdbApiKey, meta.id);
    }
    return meta;
  });
}
