// Common utility functions for MDBList operations
import { env } from "@/env";

// Helper function to check if a URL is an MDBList manifest URL
export function isMDBListManifestUrl(manifestUrl: string): boolean {
  return manifestUrl.includes(env.MDBLIST_MANIFEST_URL);
}

// Helper function to replace API key in MDBList manifest URL
export function replaceMDBListApiKey(
  manifestUrl: string,
  newApiKey: string,
): string {
  if (!isMDBListManifestUrl(manifestUrl)) {
    return manifestUrl;
  }

  // Pattern: https://1fe84bc728af-stremio-mdblist.baby-beamup.club/677/<api_key>/manifest.json
  // We need to replace the API key part (second path segment after list ID)
  const urlObj = new URL(manifestUrl);
  const pathParts = urlObj.pathname
    .split("/")
    .filter((part) => part.length > 0);

  if (pathParts.length >= 2) {
    // Replace the API key (second part after the list ID)
    pathParts[1] = newApiKey;
    urlObj.pathname = "/" + pathParts.join("/");
  }

  return urlObj.toString();
}
