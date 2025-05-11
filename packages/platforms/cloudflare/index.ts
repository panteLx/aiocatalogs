import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { html } from 'hono/html';
import { configManager } from './configManager';
import { getAddonInterface, clearAddonCache } from './addon';
import { D1Database, Env } from './types';
import { getHomePageHTML } from '../../../templates/configPage';
import packageInfo from '../../../package.json';
import { getConfigPageHTML } from '../../../templates/configPage';

// Create Hono App with Bindings type parameter
const app = new Hono<{ Bindings: Env }>();

// Enable CORS middleware
app.use('*', cors());

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
    console.error('Failed to parse JSON parameters:', e);
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

// Configuration page (imported from separate file)
import {
  getConfigPage,
  addCatalog,
  removeCatalog,
  moveCatalogUp,
  moveCatalogDown,
} from '../../api/routes/configPage';

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
