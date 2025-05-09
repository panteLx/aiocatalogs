import express from 'express';
import bodyParser from 'body-parser';
import { createAddonBuilder } from './manifest';
import configManager from './lib/configManager';
import { getHomePageHTML } from '../shared/templates/configPage';
import configRoutes from './routes/configPage';

// Port for the server (Default: 7000, can be overridden via ENV variable)
const port = process.env.PORT || 7000;

// Create Express app
const app = express();

// Add CORS headers for Stremio requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Middleware for JSON and URL-encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Cache for builders to avoid multiple creations
const builderCache = new Map();

// Clear cache for a user
export function clearBuilderCache(userId: string) {
  if (builderCache.has(userId)) {
    console.log(`Clearing builder cache for user ${userId}`);
    builderCache.delete(userId);
  }
}

// Clear entire cache
export function clearAllBuilderCache() {
  console.log('Clearing entire builder cache');
  builderCache.clear();
}

// Home page
app.get('/', (req, res) => {
  // Redirect from / to /configure
  return res.redirect('/configure');
});

// Main page with user selection
app.get('/configure', (req, res) => {
  // If userId is present as a query parameter, redirect to the configuration page
  const userId = req.query.userId as string;
  if (userId) {
    return res.redirect(`/configure/${userId}`);
  }

  // Get message and error parameters
  const message = (req.query.message as string) || '';
  const error = (req.query.error as string) || '';

  // Otherwise display the home page
  res.setHeader('Content-Type', 'text/html');
  res.send(getHomePageHTML(message, error));
});

// Create new user
app.post('/configure/create', (req, res) => {
  const userId = configManager.generateUserId();
  configManager.loadConfig(userId);
  configManager.saveConfig(userId);
  res.redirect(`/configure/${userId}`);
});

// Load user
// @ts-ignore - Temporary fix for Express version conflict
app.post('/configure/load', (req, res) => {
  const userId = req.body.userId;

  if (!userId) {
    return res.redirect('/configure?error=User ID is required');
  }

  if (!configManager.userExists(userId)) {
    return res.redirect('/configure?error=User not found');
  }

  res.redirect(`/configure/${userId}`);
});

// Include configuration routes
app.use('/configure', configRoutes);

// Handler for /manifest.json
app.get('/manifest.json', async (req, res) => {
  const userId = (req.query.userId as string) || 'default';

  try {
    // Get builder from cache or create a new one
    let builder;

    if (builderCache.has(userId)) {
      builder = builderCache.get(userId);
    } else {
      builder = await createAddonBuilder(userId);
      builderCache.set(userId, builder);
    }

    // Stremio SDK uses getInterface() to get the interface and manifest
    const addonInterface = builder.getInterface();

    // Logging for debugging purposes
    console.log(
      'Sending manifest (first 200 chars):',
      JSON.stringify(addonInterface.manifest).substring(0, 200) + '...'
    );

    // Explicitly set headers and send manifest
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(JSON.stringify(addonInterface.manifest));
  } catch (error) {
    console.error('Error generating manifest:', error);
    res.status(500).json({ error: 'Failed to generate manifest' });
  }
});

// Add new path-based parameter route for manifest
app.get('/:params/manifest.json', async (req, res) => {
  try {
    // Extract userId from URL path parameters
    let userId = 'default';
    try {
      const paramsObj = JSON.parse(decodeURIComponent(req.params.params));
      userId = paramsObj.userId || 'default';
    } catch (e) {
      console.error('Failed to parse path parameters:', e);
    }

    // Get builder from cache or create a new one
    let builder;

    if (builderCache.has(userId)) {
      builder = builderCache.get(userId);
    } else {
      builder = await createAddonBuilder(userId);
      builderCache.set(userId, builder);
    }

    // Stremio SDK uses getInterface() to get the interface and manifest
    const addonInterface = builder.getInterface();

    // Logging for debugging purposes
    console.log(
      'Sending manifest via path params (first 200 chars):',
      JSON.stringify(addonInterface.manifest).substring(0, 200) + '...'
    );

    // Explicitly set headers and send manifest
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(JSON.stringify(addonInterface.manifest));
  } catch (error) {
    console.error('Error generating manifest:', error);
    res.status(500).json({ error: 'Failed to generate manifest' });
  }
});

// Handler for Stremio endpoints with path parameters
app.get('/:params/:resource/:type/:id.json', async (req, res) => {
  const { resource, type, id, params } = req.params;

  try {
    // Extract userId from URL path parameters
    let userId = 'default';
    try {
      const paramsObj = JSON.parse(decodeURIComponent(params));
      userId = paramsObj.userId || 'default';
    } catch (e) {
      console.error('Failed to parse path parameters:', e);
    }

    // Only process catalog requests, respond with error for others
    if (resource !== 'catalog') {
      res.status(404).json({ error: 'Resource not supported' });
      return;
    }

    // Get builder from cache or create a new one
    let builder;

    if (builderCache.has(userId)) {
      builder = builderCache.get(userId);
    } else {
      builder = await createAddonBuilder(userId);
      builderCache.set(userId, builder);
    }

    // Get addon interface
    const addonInterface = builder.getInterface();

    // Call catalog method from interface
    addonInterface
      .get(resource, type, id)
      .then((result: unknown) => {
        res.setHeader('Content-Type', 'application/json');
        res.json(result);
      })
      .catch((error: Error) => {
        console.error(`Error handling ${resource} request:`, error);
        res.status(500).json({ error: 'internal error' });
      });
  } catch (error) {
    console.error(`Error in ${req.params.resource} endpoint:`, error);
    res.status(500).json({ error: 'internal server error' });
  }
});

// Original handler for Stremio endpoints (for backward compatibility)
app.get('/:resource/:type/:id.json', async (req, res) => {
  const { resource, type, id } = req.params;
  const userId = (req.query.userId as string) || 'default';

  try {
    // Only process catalog requests, respond with error for others
    if (resource !== 'catalog') {
      res.status(404).json({ error: 'Resource not supported' });
      return;
    }

    // Get builder from cache or create a new one
    let builder;

    if (builderCache.has(userId)) {
      builder = builderCache.get(userId);
    } else {
      builder = await createAddonBuilder(userId);
      builderCache.set(userId, builder);
    }

    // Get addon interface
    const addonInterface = builder.getInterface();

    // Call catalog method from interface - CORRECTED
    // The Stremio SDK provides a get() method
    addonInterface
      .get(resource, type, id)
      .then((result: unknown) => {
        res.setHeader('Content-Type', 'application/json');
        res.json(result);
      })
      .catch((error: Error) => {
        console.error(`Error handling ${resource} request:`, error);
        res.status(500).json({ error: 'internal error' });
      });
  } catch (error) {
    console.error(`Error in ${req.params.resource} endpoint:`, error);
    res.status(500).json({ error: 'internal server error' });
  }
});

// Start server
const portNumber = typeof port === 'string' ? parseInt(port, 10) : port;
app.listen(portNumber, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${portNumber}`);
  console.log(`Manifest URL: http://localhost:${portNumber}/manifest.json`);
  console.log(`Open http://localhost:${portNumber} in your browser to configure`);
});
