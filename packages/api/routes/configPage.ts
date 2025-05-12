import { configManager } from '../../platforms/cloudflare/configManager';
import { catalogAggregator } from '../../platforms/cloudflare/catalogAggregator';
import { getConfigPageHTML } from '../../../templates/configPage';
import { clearAddonCache } from '../../platforms/cloudflare/addon';

// Direct reference to package.json for version
// This works because all assets are bundled during the build process
import packageJson from '../../../package.json';
const PACKAGE_VERSION = packageJson.version || 'unknown';

// Helper functions for config page routes
export function convertStremioUrl(url: string): string {
  if (url.startsWith('stremio://')) {
    return url.replace('stremio://', 'https://');
  }
  return url;
}

// Handler for adding catalogs
export async function handleAddCatalog(
  userId: string,
  catalogUrl: string,
  fetchCatalogManifest: (url: string) => Promise<any>,
  addCatalog: (userId: string, manifest: any) => Promise<boolean>,
  clearCache: (userId: string) => void
) {
  if (!catalogUrl) {
    return { success: false, error: 'No catalog URL provided' };
  }

  try {
    const manifest = await fetchCatalogManifest(catalogUrl);
    if (!manifest) {
      return { success: false, error: 'Failed to fetch catalog manifest' };
    }

    const success = await addCatalog(userId, manifest);
    if (!success) {
      return { success: false, error: 'Failed to add catalog' };
    }

    // Clear caches
    clearCache(userId);

    return {
      success: true,
      message: `Successfully added catalog: ${manifest.name}`,
    };
  } catch (error) {
    console.error('Error adding catalog:', error);
    return {
      success: false,
      error: `Failed to add catalog: ${error}`,
    };
  }
}

// Handler for removing catalogs
export async function handleRemoveCatalog(
  userId: string,
  catalogId: string,
  removeCatalog: (userId: string, catalogId: string) => Promise<boolean>,
  clearCache: (userId: string) => void
) {
  if (!catalogId) {
    return { success: false, error: 'No catalog ID provided' };
  }

  try {
    const success = await removeCatalog(userId, catalogId);
    if (!success) {
      return { success: false, error: 'Failed to remove catalog' };
    }

    // Clear caches
    clearCache(userId);

    return {
      success: true,
      message: 'Successfully removed catalog',
    };
  } catch (error) {
    console.error('Error removing catalog:', error);
    return {
      success: false,
      error: `Failed to remove catalog: ${error}`,
    };
  }
}

// Handler for moving catalogs up
export async function handleMoveCatalogUp(
  userId: string,
  catalogId: string,
  moveCatalogUp: (userId: string, catalogId: string) => Promise<boolean>,
  clearCache: (userId: string) => void
) {
  if (!catalogId) {
    return { success: false, error: 'No catalog ID provided' };
  }

  try {
    const success = await moveCatalogUp(userId, catalogId);
    if (!success) {
      return { success: false, error: 'Failed to move catalog up' };
    }

    // Clear caches
    clearCache(userId);

    return {
      success: true,
      message: 'Successfully moved catalog up',
    };
  } catch (error) {
    console.error('Error moving catalog up:', error);
    return {
      success: false,
      error: `Failed to move catalog up: ${error}`,
    };
  }
}

// Handler for moving catalogs down
export async function handleMoveCatalogDown(
  userId: string,
  catalogId: string,
  moveCatalogDown: (userId: string, catalogId: string) => Promise<boolean>,
  clearCache: (userId: string) => void
) {
  if (!catalogId) {
    return { success: false, error: 'No catalog ID provided' };
  }

  try {
    const success = await moveCatalogDown(userId, catalogId);
    if (!success) {
      return { success: false, error: 'Failed to move catalog down' };
    }

    // Clear caches
    clearCache(userId);

    return {
      success: true,
      message: 'Successfully moved catalog down',
    };
  } catch (error) {
    console.error('Error moving catalog down:', error);
    return {
      success: false,
      error: `Failed to move catalog down: ${error}`,
    };
  }
}

// Display configuration page
export const getConfigPage = async (c: any) => {
  const userId = c.req.param('userId');

  // If no user ID is provided, redirect to home page
  if (!userId) {
    return c.redirect('/configure');
  }

  // Check if user exists
  const exists = await configManager.userExists(userId);
  if (!exists) {
    return c.redirect('/configure?error=User with ID ' + userId + ' not found');
  }

  try {
    // Load configuration
    const catalogs = await configManager.getAllCatalogs(userId);

    // Load the MDBList API key from the database and set it for the current session
    try {
      // Import the required functions
      const { loadUserMDBListApiKey } = await import('../../api/routes/mdblistRoutes');

      // Load the API key from the database and set it globally
      await loadUserMDBListApiKey(userId);
      console.log(`Loaded MDBList API key for user ${userId} for config page`);
    } catch (apiKeyError) {
      console.warn(`Error loading MDBList API key for user ${userId}:`, apiKeyError);
      // Ignore errors here as it's not critical
    }

    const url = new URL(c.req.url);
    const baseUrlHost = url.host;
    const baseUrl = `${url.protocol}//${baseUrlHost}`;
    const message = c.req.query('message') || '';
    const error = c.req.query('error') || '';

    // Return HTML as text
    return c.html(
      getConfigPageHTML(userId, catalogs, baseUrl, message, error, true, PACKAGE_VERSION)
    );
  } catch (error) {
    console.error('Error displaying config page:', error);
    return c.redirect('/configure?error=Failed to load user configuration');
  }
};

// Add catalog
export const addCatalog = async (c: any) => {
  const userId = c.req.param('userId');
  const formData = await c.req.formData();
  const rawCatalogUrl = formData.get('catalogUrl') as string;

  // Check if user exists
  const exists = await configManager.userExists(userId);
  if (!exists) {
    return c.redirect('/configure?error=User not found');
  }

  // Convert stremio:// URL to https:// if necessary
  const catalogUrl = convertStremioUrl(rawCatalogUrl);

  const result = await handleAddCatalog(
    userId,
    catalogUrl,
    (url: string) => catalogAggregator.fetchCatalogManifest(url),
    (userId: string, manifest: any) => configManager.addCatalog(userId, manifest),
    (userId: string) => {
      // Clear both caches to ensure fresh data
      clearAddonCache(userId);
      configManager.clearCache(userId);
    }
  );

  if (result.success) {
    return c.redirect(`/configure/${userId}?message=${result.message}`);
  } else {
    return c.redirect(`/configure/${userId}?error=${result.error}`);
  }
};

// Remove catalog
export const removeCatalog = async (c: any) => {
  const userId = c.req.param('userId');
  const formData = await c.req.formData();
  const catalogId = formData.get('catalogId') as string;

  // Check if user exists
  const exists = await configManager.userExists(userId);
  if (!exists) {
    return c.redirect('/configure?error=User not found');
  }

  const result = await handleRemoveCatalog(
    userId,
    catalogId,
    (userId: string, catalogId: string) => configManager.removeCatalog(userId, catalogId),
    (userId: string) => {
      // Clear both caches to ensure fresh data
      clearAddonCache(userId);
      configManager.clearCache(userId);
    }
  );

  if (result.success) {
    return c.redirect(`/configure/${userId}?message=${result.message}`);
  } else {
    return c.redirect(`/configure/${userId}?error=${result.error}`);
  }
};

// Move catalog up
export const moveCatalogUp = async (c: any) => {
  const userId = c.req.param('userId');
  const formData = await c.req.formData();
  const catalogId = formData.get('catalogId') as string;

  // Check if user exists
  const exists = await configManager.userExists(userId);
  if (!exists) {
    return c.redirect('/configure?error=User not found');
  }

  const result = await handleMoveCatalogUp(
    userId,
    catalogId,
    (userId: string, catalogId: string) => configManager.moveCatalogUp(userId, catalogId),
    (userId: string) => {
      // Clear both caches to ensure fresh data
      clearAddonCache(userId);
      configManager.clearCache(userId);
    }
  );

  if (result.success) {
    return c.redirect(`/configure/${userId}?message=${result.message}`);
  } else {
    return c.redirect(`/configure/${userId}?error=${result.error}`);
  }
};

// Move catalog down
export const moveCatalogDown = async (c: any) => {
  const userId = c.req.param('userId');
  const formData = await c.req.formData();
  const catalogId = formData.get('catalogId') as string;

  // Check if user exists
  const exists = await configManager.userExists(userId);
  if (!exists) {
    return c.redirect('/configure?error=User not found');
  }

  const result = await handleMoveCatalogDown(
    userId,
    catalogId,
    (userId: string, catalogId: string) => configManager.moveCatalogDown(userId, catalogId),
    (userId: string) => {
      // Clear both caches to ensure fresh data
      clearAddonCache(userId);
      configManager.clearCache(userId);
    }
  );

  if (result.success) {
    return c.redirect(`/configure/${userId}?message=${result.message}`);
  } else {
    return c.redirect(`/configure/${userId}?error=${result.error}`);
  }
};
