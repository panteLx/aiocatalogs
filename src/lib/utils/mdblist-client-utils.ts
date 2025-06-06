// Client-side utility functions for MDBList operations
// Note: This is for client components that can't access server env vars

// Hardcoded URL for client-side use (since env vars aren't available in client components)
const MDBLIST_MANIFEST_BASE_URL =
  "https://1fe84bc728af-stremio-mdblist.baby-beamup.club";

// Helper function to check if a URL is an MDBList manifest URL (client-side version)
export function isMDBListCatalogClient(manifestUrl: string): boolean {
  return manifestUrl.includes(MDBLIST_MANIFEST_BASE_URL);
}
