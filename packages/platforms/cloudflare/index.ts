import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { configManager } from './configManager';
import { getAddonInterface, clearAddonCache } from './addon';
import { D1Database, Env } from './types';
import { getHomePageHTML } from '../../../templates/configPage';
import packageInfo from '../../../package.json';
import { rateLimit } from './middleware/rateLimit';
import { logger, initLogger } from '../../core/utils/logger';
import { appConfig } from './appConfig';
import { fetchMDBListCatalog, fetchListDetails } from '../../core/utils/mdblist';
import { saveRPDBConfig } from '../../api/routes/rpdbRoutes';

// Configuration page (imported from separate file)
import {
  getConfigPage,
  addCatalog,
  removeCatalog,
  moveCatalogUp,
  moveCatalogDown,
  toggleCatalogRandomize,
  renameCatalog,
} from '../../api/routes/configPage';

// Import MDBList routes
import {
  getMDBListSearch,
  getMDBListTop100,
  addMDBListCatalog,
  saveMDBListConfig,
} from '../../api/routes/mdblistRoutes';

// Initialize logger with appConfig
initLogger(appConfig);

// Create Hono App with Bindings type parameter
const app = new Hono<{ Bindings: Env }>();

// Enable CORS middleware
app.use('*', cors());

// Apply rate limiting to API endpoints
app.use('/manifest.json', rateLimit());
app.use('/:params/manifest.json', rateLimit());
app.use('/:params/:resource/:type/:id\\.json', rateLimit());
app.use('/:resource/:type/:id\\.json', rateLimit());

// Initialize config manager
const initConfigManager = (c: any) => {
  if (c.env && c.env.DB) {
    configManager.setDatabase(c.env.DB);
  }
};

// Routes
app.get('/', async c => {
  // Redirect from / to /configure
  return c.redirect('/configure');
});

// Add redirection route for JSON-formatted userId parameter
app.get('/:jsonParams/configure', async c => {
  try {
    const jsonParams = decodeURIComponent(c.req.param('jsonParams'));
    const params = JSON.parse(jsonParams);
    if (params.userId) {
      return c.redirect(`/configure/${params.userId}`);
    }
  } catch (e) {
    logger.error('Failed to parse JSON parameters:', e);
    return c.redirect('/configure?error=Failed to parse JSON parameters');
  }

  // If parsing fails, return a 404 response
  return c.redirect('/configure?error=Something went wrong');
});

// Home page with user selection
app.get('/configure', async c => {
  initConfigManager(c);

  // Get message and error parameters from query
  const message = c.req.query('message') || '';
  const error = c.req.query('error') || '';
  const noRedirect = c.req.query('noRedirect') === 'true';

  const html = getHomePageHTML(message, error, packageInfo.version);

  // Add script to redirect to stored userId if available and noRedirect is not set
  const htmlWithAutoRedirect = html.replace(
    '</body>',
    `
    <script>
      // Auto-redirect to saved configuration if available and no redirect prevention flag is set
      document.addEventListener('DOMContentLoaded', function() {
        // We need to wait a moment for everything to be fully initialized
        setTimeout(function() {
          const shouldRedirect = !${noRedirect};
          // Use logger in client code
          console.log("Should redirect check:", shouldRedirect);
          
          if (shouldRedirect) {
            const savedUserId = localStorage.getItem('aioCatalogsUserId');
            console.log("Auto-redirect check - saved userId:", savedUserId);
            
            if (savedUserId && savedUserId.trim().length > 0) {
              console.log("Redirecting to:", '/configure/' + savedUserId);
              window.location.href = '/configure/' + savedUserId;
            } else {
              console.log("No userId found in localStorage or empty string");
            }
          } else {
            console.log("Redirect prevented by noRedirect flag");
          }
        }, 100); // Small delay to ensure localStorage is accessible
      });
    </script>
    </body>
  `
  );

  return c.html(htmlWithAutoRedirect);
});

// Create user
app.post('/configure/create', async c => {
  initConfigManager(c);
  const userId = await configManager.generateUserId();
  await configManager.saveConfig(userId, { catalogs: [] });

  return c.redirect(`/configure/${userId}`);
});

// Load user
app.post('/configure/load', async c => {
  initConfigManager(c);
  const formData = await c.req.formData();
  const userId = formData.get('userId') as string;

  if (!userId) {
    return c.redirect('/configure?error=User ID is required');
  }

  const exists = await configManager.userExists(userId);
  if (!exists) {
    return c.redirect('/configure?error=User not found');
  }

  return c.redirect(`/configure/${userId}`);
});

// Configuration endpoints
app.get('/configure/:userId', async c => {
  initConfigManager(c);
  return getConfigPage(c);
});

app.post('/configure/:userId/add', async c => {
  initConfigManager(c);
  return addCatalog(c);
});

app.post('/configure/:userId/remove', async c => {
  initConfigManager(c);
  return removeCatalog(c);
});

app.post('/configure/:userId/moveUp', async c => {
  initConfigManager(c);
  return moveCatalogUp(c);
});

app.post('/configure/:userId/moveDown', async c => {
  initConfigManager(c);
  return moveCatalogDown(c);
});

app.post('/configure/:userId/toggleRandomize', async c => {
  initConfigManager(c);
  return toggleCatalogRandomize(c);
});

app.post('/configure/:userId/rename', async c => {
  initConfigManager(c);
  return renameCatalog(c);
});

// MDBList endpoints
app.get('/configure/:userId/mdblist/search', async c => {
  initConfigManager(c);
  return getMDBListSearch(c);
});

app.get('/configure/:userId/mdblist/top100', async c => {
  initConfigManager(c);
  return getMDBListTop100(c);
});

app.post('/configure/:userId/mdblist/add', async c => {
  initConfigManager(c);
  return addMDBListCatalog(c);
});

app.post('/configure/:userId/mdblist/config', async c => {
  initConfigManager(c);
  return saveMDBListConfig(c);
});

// RPDB API configuration
app.post('/configure/:userId/rpdb/config', async c => {
  initConfigManager(c);
  return saveRPDBConfig(c);
});

// MDBList manifest endpoint - needed for MDBList catalogs
app.get('/configure/:userId/mdblist/:listId/manifest.json', async c => {
  const userId = c.req.param('userId');
  const listId = c.req.param('listId');

  initConfigManager(c);

  // Check if database is available
  if (c.env && c.env.DB) {
    configManager.setDatabase(c.env.DB);

    // Load the user's API key directly from the database
    const apiKey = await configManager.loadMDBListApiKey(userId);

    if (!apiKey) {
      logger.warn(`No MDBList API key found for user ${userId}`);
      return c.json(
        {
          error: 'MDBList API key not configured',
          message: 'Please configure your MDBList API key in the settings.',
        },
        403
      );
    }
  } else {
    return c.json({ error: 'Database not available' }, 500);
  }

  // Get base URL
  const url = new URL(c.req.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  try {
    // Get the API key directly from the database
    const apiKey = await configManager.loadMDBListApiKey(userId);

    if (!apiKey) {
      return c.json({ error: 'MDBList API key not configured' }, 403);
    }

    // Fetch list details to get the actual name
    const listDetails = await fetchListDetails(listId, apiKey);
    const listName = listDetails?.name || `MDBList ${listId}`;

    // Check if there's a custom name for this catalog
    const catalogId = `mdblist_${listId}`;
    const catalog = await configManager.getCatalog(userId, catalogId);
    const catalogName = catalog?.customName || listName;

    // Fetch actual content to determine what types are available
    const catalogData = await fetchMDBListCatalog(listId, apiKey);
    const hasMovies = catalogData.metas.some(item => item.type === 'movie');
    const hasSeries = catalogData.metas.some(item => item.type === 'series');

    // Create catalogs array based on available content
    const catalogs = [];

    if (hasMovies) {
      catalogs.push({
        id: `mdblist_${listId}`,
        type: 'movie',
        name: catalogName,
      });
    }

    if (hasSeries) {
      catalogs.push({
        id: `mdblist_${listId}`,
        type: 'series',
        name: catalogName,
      });
    }

    // If no content was found, add both types as fallback
    if (catalogs.length === 0) {
      catalogs.push(
        {
          id: `mdblist_${listId}`,
          type: 'movie',
          name: catalogName,
        },
        {
          id: `mdblist_${listId}`,
          type: 'series',
          name: catalogName,
        }
      );
    }

    // Create a basic manifest for this MDBList
    const manifest = {
      id: `mdblist_${listId}`,
      version: '1.0.0',
      name: catalogName,
      description: `${catalogName} - MDBList catalog`,
      resources: [
        {
          name: 'catalog',
          types: ['movie', 'series'],
          idPrefixes: ['tt'],
        },
      ],
      catalogs: catalogs,
      // Tell Stremio to use our direct catalog endpoint instead
      behaviorHints: {
        configurable: false,
        configurationRequired: false,
      },
    };

    return c.json(manifest);
  } catch (error) {
    console.error(`Error generating MDBList manifest for ${listId}:`, error);
    return c.json({ error: 'Failed to generate manifest' }, 500);
  }
});

// Helper function to find a valid user with MDBList API key
async function findUserWithMDBListApiKey(requestedUserId: string): Promise<string> {
  let validUserId = requestedUserId;
  let exists = await configManager.userExists(requestedUserId);

  if (!exists) {
    // Try to find any user who has a MDBList API key configured
    const allUsers = await configManager.getAllUsers();
    for (const user of allUsers) {
      const hasApiKey = await configManager.loadMDBListApiKey(user);
      if (hasApiKey) {
        validUserId = user;
        exists = true;
        break;
      }
    }

    // If we still don't have a valid user, use the default
    if (!exists) {
      validUserId = 'default';
    }
  }

  return validUserId;
}

// Add a compatibility route for direct MDBList access without userId
// This redirects to the version with userId for better compatibility
app.get('/mdblist/:listId/manifest.json', async c => {
  const listId = c.req.param('listId');
  const userId = c.req.query('userId') || 'default';

  // First check if this user exists, if not, try to find a user with a valid MDBList API key
  if (c.env && c.env.DB) {
    configManager.setDatabase(c.env.DB);
    const validUserId = await findUserWithMDBListApiKey(userId);

    // Redirect to the proper URL with userId in the path
    return c.redirect(`/configure/${validUserId}/mdblist/${listId}/manifest.json`);
  } else {
    // If no database, just use the default userId
    return c.redirect(`/configure/default/mdblist/${listId}/manifest.json`);
  }
});

// Also add compatibility for the catalog endpoint
app.get('/mdblist/:listId/catalog/:type/:id.json', async c => {
  const listId = c.req.param('listId');
  const type = c.req.param('type');
  const id = c.req.param('id.json').replace(/\.json$/, '');
  const userId = c.req.query('userId') || 'default';

  // First check if this user exists, if not, try to find a user with a valid MDBList API key
  if (c.env && c.env.DB) {
    configManager.setDatabase(c.env.DB);
    const validUserId = await findUserWithMDBListApiKey(userId);

    // Redirect to the proper URL with userId in the path
    return c.redirect(`/configure/${validUserId}/mdblist/${listId}/catalog/${type}/${id}.json`);
  } else {
    // If no database, just use the default userId
    return c.redirect(`/configure/default/mdblist/${listId}/catalog/${type}/${id}.json`);
  }
});

// Manifest.json with userId as query parameter
app.get('/manifest.json', async c => {
  initConfigManager(c);
  const userId = c.req.query('userId') || 'default';

  if (c.env && c.env.DB) {
    try {
      const addonInterface = await getAddonInterface(userId, c.env.DB as D1Database);

      c.header('Content-Type', 'application/json');
      c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      c.header('Pragma', 'no-cache');
      c.header('Expires', '0');
      return c.json(addonInterface.manifest);
    } catch (error) {
      console.error('Error generating manifest:', error);
      return c.json({ error: 'Failed to generate manifest' }, 500);
    }
  } else {
    return c.json({ error: 'Database not available' }, 500);
  }
});

// Add new path-based parameter route for manifest
app.get('/:params/manifest.json', async c => {
  initConfigManager(c);

  // Extract userId from URL path parameters
  let userId = 'default';
  try {
    const paramsObj = JSON.parse(decodeURIComponent(c.req.param('params')));
    userId = paramsObj.userId || 'default';
  } catch (e) {
    console.error('Failed to parse path parameters:', e);
  }

  if (c.env && c.env.DB) {
    try {
      const addonInterface = await getAddonInterface(userId, c.env.DB as D1Database);

      c.header('Content-Type', 'application/json');
      c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      c.header('Pragma', 'no-cache');
      c.header('Expires', '0');
      return c.json(addonInterface.manifest);
    } catch (error) {
      console.error('Error generating manifest:', error);
      return c.json({ error: 'Failed to generate manifest' }, 500);
    }
  } else {
    return c.json({ error: 'Database not available' }, 500);
  }
});

// Addon API routes with path parameters
app.get('/:params/:resource/:type/:id\\.json', async c => {
  initConfigManager(c);
  const params = c.req.param();
  const resource = params.resource;
  const type = params.type;
  // Extract route parameters correctly
  const idWithJson = params['id\\.json'];
  const id = idWithJson ? idWithJson.replace(/\.json$/, '') : '';

  // Extract userId from URL path parameters
  let userId = 'default';
  try {
    const paramsObj = JSON.parse(decodeURIComponent(params.params));
    userId = paramsObj.userId || 'default';
  } catch (e) {
    console.error('Failed to parse path parameters:', e);
  }

  if (c.env && c.env.DB) {
    try {
      const addonInterface = await getAddonInterface(userId, c.env.DB as D1Database);

      // Handle different resource types
      let result;
      if (resource === 'catalog') {
        result = await addonInterface.catalog({ type, id });
      } else if (resource === 'meta') {
        result = await addonInterface.meta();
      } else if (resource === 'stream') {
        result = await addonInterface.stream();
      } else {
        return c.json({ error: 'Resource not supported' }, 404);
      }

      c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      c.header('Pragma', 'no-cache');
      c.header('Expires', '0');
      return c.json(result);
    } catch (error) {
      console.error(`Error in ${resource} endpoint:`, error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  } else {
    return c.json({ error: 'Database not available' }, 500);
  }
});

// Original Addon API routes (for backward compatibility)
app.get('/:resource/:type/:id\\.json', async c => {
  initConfigManager(c);
  const params = c.req.param();
  const resource = params.resource;
  const type = params.type;
  // Extract route parameters correctly
  const idWithJson = params['id\\.json'];
  const id = idWithJson ? idWithJson.replace(/\.json$/, '') : '';
  const userId = c.req.query('userId') || 'default';

  if (c.env && c.env.DB) {
    try {
      const addonInterface = await getAddonInterface(userId, c.env.DB as D1Database);

      // Handle different resource types
      let result;
      if (resource === 'catalog') {
        result = await addonInterface.catalog({ type, id });
      } else if (resource === 'meta') {
        result = await addonInterface.meta();
      } else if (resource === 'stream') {
        result = await addonInterface.stream();
      } else {
        return c.json({ error: 'Resource not supported' }, 404);
      }

      c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      c.header('Pragma', 'no-cache');
      c.header('Expires', '0');
      return c.json(result);
    } catch (error) {
      console.error(`Error in ${resource} endpoint:`, error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  } else {
    return c.json({ error: 'Database not available' }, 500);
  }
});

// Direct MDBList catalog endpoints
app.get('/configure/:userId/mdblist/:listId/catalog/:type/:id.json', async c => {
  initConfigManager(c);
  const listId = c.req.param('listId');
  const type = c.req.param('type');
  const userId = c.req.param('userId');

  if (c.env && c.env.DB) {
    try {
      // Verify that the user exists
      configManager.setDatabase(c.env.DB);
      const exists = await configManager.userExists(userId);
      if (!exists) {
        return c.json({ error: 'User not found' }, 404);
      }

      const addonInterface = await getAddonInterface(userId, c.env.DB as D1Database);

      // Use the main catalog handler with the MDBList ID format that our addon understands
      const catalogId = `mdblist_${listId}`;
      const result = await addonInterface.handleCatalog(userId, { type, id: catalogId });

      return c.json(result);
    } catch (error) {
      console.error(`Error serving MDBList catalog: ${error}`);
      return c.json({ error: 'Failed to generate catalog' }, 500);
    }
  } else {
    return c.json({ error: 'Database not available' }, 500);
  }
});

// 404 handler
app.notFound(c => {
  return c.text('Not found', 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.text('Internal Server Error', 500);
});

// Worker export
export default app;
