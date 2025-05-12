import {
  fetchTopLists,
  searchLists,
  setMDBListApiConfig,
  isMDBListApiConfigured,
  fetchMDBListCatalog,
  fetchListDetails,
} from '../../core/utils/mdblist';
import {
  getMDBListSearchResultsHTML,
  getMDBListTop100HTML,
} from '../../../templates/mdblistTemplates';
import { handleAddCatalog } from './configPage';
import { configManager } from '../../platforms/cloudflare/configManager';
import { catalogAggregator } from '../../platforms/cloudflare/catalogAggregator';
import { clearAddonCache } from '../../platforms/cloudflare/addon';
import { logger } from '../../core/utils/logger';

// Helper function to load and set the MDBList API key for a user
export async function loadUserMDBListApiKey(userId: string): Promise<boolean> {
  try {
    const apiKey = await configManager.loadMDBListApiKey(userId);
    if (apiKey) {
      // Set the API key in the global configuration
      setMDBListApiConfig({ apiKey, userId });
      logger.debug(`Loaded MDBList API key for user ${userId}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Error loading MDBList API key for user ${userId}:`, error);
    return false;
  }
}

// Display MDBList search results
export const getMDBListSearch = async (c: any) => {
  const userId = c.req.param('userId');
  const query = c.req.query('query') || '';

  // Check if user exists
  const exists = await configManager.userExists(userId);
  if (!exists) {
    return c.redirect('/configure?error=User not found');
  }

  // Load the user's API key from the database
  await loadUserMDBListApiKey(userId);

  // Check if API key is configured
  if (!isMDBListApiConfigured()) {
    return c.redirect(
      `/configure/${userId}?error=MDBList API key is required. Please configure it in the settings.`
    );
  }

  try {
    const catalogs = await searchLists(query);
    const message = c.req.query('message') || '';
    const error = c.req.query('error') || '';

    // Return HTML
    return c.html(getMDBListSearchResultsHTML(userId, query, catalogs, message, error));
  } catch (error) {
    console.error('Error searching MDBList:', error);
    return c.redirect(`/configure/${userId}?error=Failed to search MDBList: ${error}`);
  }
};

// Display MDBList top 100
export const getMDBListTop100 = async (c: any) => {
  const userId = c.req.param('userId');

  // Check if user exists
  const exists = await configManager.userExists(userId);
  if (!exists) {
    return c.redirect('/configure?error=User not found');
  }

  // Load the user's API key from the database
  await loadUserMDBListApiKey(userId);

  // Check if API key is configured
  if (!isMDBListApiConfigured()) {
    return c.redirect(
      `/configure/${userId}?error=MDBList API key is required. Please configure it in the settings.`
    );
  }

  try {
    const catalogs = await fetchTopLists();
    const message = c.req.query('message') || '';
    const error = c.req.query('error') || '';

    // Return HTML
    return c.html(getMDBListTop100HTML(userId, catalogs, message, error));
  } catch (error) {
    console.error('Error fetching top lists:', error);
    return c.redirect(`/configure/${userId}?error=Failed to fetch top lists: ${error}`);
  }
};

// Add MDBList catalog
export const addMDBListCatalog = async (c: any) => {
  const userId = c.req.param('userId');

  // Check if user exists
  const exists = await configManager.userExists(userId);
  if (!exists) {
    return c.redirect('/configure?error=User not found');
  }

  // Load the user's API key from the database
  await loadUserMDBListApiKey(userId);

  // Check if API key is configured
  if (!isMDBListApiConfigured()) {
    return c.redirect(
      `/configure/${userId}?error=MDBList API key is required. Please configure it in the settings.`
    );
  }

  const formData = await c.req.formData();
  const mdblistUserId = formData.get('userId') as string;
  const listId = formData.get('listId') as string;
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const mdblistId = formData.get('mdblistId') as string;
  const slug = formData.get('slug') as string;

  // Get the current request URL to build absolute URLs
  const url = new URL(c.req.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  // Construct catalog URL using our own endpoint instead of external services
  let catalogId = '';
  if (mdblistId) {
    catalogId = mdblistId;
  } else if (listId) {
    catalogId = listId;
  } else {
    return c.redirect(`/configure/${userId}?error=Missing list ID`);
  }

  // Fetch the actual list details to get the proper name
  let listName = name;
  try {
    const listDetails = await fetchListDetails(catalogId);
    if (listDetails && listDetails.name) {
      listName = listDetails.name;
    }
  } catch (error) {
    logger.warn(`Error fetching list details: ${error}`);
    // Continue with the provided name
  }

  // Use our own endpoint with userId included
  const catalogUrl = `${baseUrl}/configure/${userId}/mdblist/${catalogId}/manifest.json`;

  try {
    // Before adding the catalog, customize the manifest with the real name
    const result = await handleAddCatalog(
      userId,
      catalogUrl,
      async (url: string) => {
        const manifest = await catalogAggregator.fetchCatalogManifest(url);
        // Update name in the manifest with the real name
        if (manifest && manifest.name) {
          manifest.name = listName;
        }
        if (manifest && manifest.catalogs) {
          for (const cat of manifest.catalogs) {
            // Replace the generic name with type-specific real name
            if (cat.type === 'movie') {
              cat.name = `${listName}`;
            } else if (cat.type === 'series') {
              cat.name = `${listName}`;
            }
          }
        }
        return manifest;
      },
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
      // Try to go back to the previous page if possible
      const referer = c.req.header('referer');
      if (referer && (referer.includes('/mdblist/search') || referer.includes('/mdblist/top100'))) {
        return c.redirect(`${referer}?error=${result.error}`);
      }

      return c.redirect(`/configure/${userId}?error=${result.error}`);
    }
  } catch (error) {
    console.error('Error adding MDBList catalog:', error);
    return c.redirect(`/configure/${userId}?error=Failed to add MDBList catalog: ${error}`);
  }
};

// Save MDBList API configuration
export const saveMDBListConfig = async (c: any) => {
  const userId = c.req.param('userId');
  const formData = await c.req.formData();
  const apiKey = formData.get('apiKey') as string;

  // Check if user exists
  const exists = await configManager.userExists(userId);
  if (!exists) {
    return c.redirect('/configure?error=User not found');
  }

  try {
    // Check if the API key is valid before saving it
    if (!apiKey || apiKey.trim() === '') {
      return c.redirect(`/configure/${userId}?error=MDBList API key cannot be empty`);
    }

    // Validate the API key by making a test call to the MDBList API
    try {
      setMDBListApiConfig({ apiKey, userId });
      const testResult = await fetchTopLists(apiKey);
      if (!testResult || testResult.length === 0) {
        logger.warn(`API key validation failed for user ${userId}: No lists returned`);
        return c.redirect(
          `/configure/${userId}?error=Invalid MDBList API key - please check and try again`
        );
      }
      logger.info(`Successfully validated API key for user ${userId}`);
    } catch (validationError) {
      logger.error(`API key validation failed for user ${userId}:`, validationError);
      return c.redirect(
        `/configure/${userId}?error=Invalid MDBList API key - please check and try again`
      );
    }

    // Save the API key to the database
    const success = await configManager.saveMDBListApiKey(userId, apiKey);

    if (!success) {
      logger.warn(`Database save failed, but API key is set in memory for user ${userId}`);
      // Despite database error, set the key in memory
      setMDBListApiConfig({ apiKey, userId });
      // Inform the user that there was a problem, but the API key works
      return c.redirect(
        `/configure/${userId}?message=MDBList API key is working but could not be saved permanently. It will work until the server restarts.`
      );
    }

    // Set it in memory for immediate use
    setMDBListApiConfig({ apiKey, userId });

    return c.redirect(`/configure/${userId}?message=MDBList API configuration saved successfully`);
  } catch (error) {
    console.error('Error saving MDBList API configuration:', error);
    return c.redirect(
      `/configure/${userId}?error=Failed to save MDBList API configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
