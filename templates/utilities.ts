/**
 * Utility functions for the templates
 */

/**
 * Helper function to convert stremio:// URLs to https://
 */
export function convertStremioUrl(url: string): string {
  if (url.startsWith('stremio://')) {
    return url.replace('stremio://', 'https://');
  }
  return url;
}
