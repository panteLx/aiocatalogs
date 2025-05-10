import { configManager } from '../configManager';
import { catalogAggregator } from '../catalogAggregator';
import { getConfigPageHTML } from '../../shared/templates/configPage';
import {
  handleAddCatalog,
  handleRemoveCatalog,
  handleMoveCatalogUp,
  handleMoveCatalogDown,
  convertStremioUrl,
} from '../../shared/routes/configPageHandlers';
import { clearAddonCache } from '../addon';

// Direct reference to package.json for version
// This works because all assets are bundled during the build process
import packageJson from '../../../package.json';
const PACKAGE_VERSION = packageJson.version || 'unknown';

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
    const url = new URL(c.req.url);
    const baseUrlHost = url.host;
    // const baseUrl = `${url.protocol === 'https' ? 'https' : 'http'}://${baseUrlHost}`;
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
    url => catalogAggregator.fetchCatalogManifest(url),
    (userId, manifest) => configManager.addCatalog(userId, manifest),
    userId => {
      // Clear both caches to ensure fresh data
      clearAddonCache(userId);
      configManager.clearUserCache(userId);
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
    (userId, catalogId) => configManager.removeCatalog(userId, catalogId),
    userId => {
      // Clear both caches to ensure fresh data
      clearAddonCache(userId);
      configManager.clearUserCache(userId);
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
    (userId, catalogId) => configManager.moveCatalogUp(userId, catalogId),
    userId => {
      // Clear both caches to ensure fresh data
      clearAddonCache(userId);
      configManager.clearUserCache(userId);
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
    (userId, catalogId) => configManager.moveCatalogDown(userId, catalogId),
    userId => {
      // Clear both caches to ensure fresh data
      clearAddonCache(userId);
      configManager.clearUserCache(userId);
    }
  );

  if (result.success) {
    return c.redirect(`/configure/${userId}?message=${result.message}`);
  } else {
    return c.redirect(`/configure/${userId}?error=${result.error}`);
  }
};
