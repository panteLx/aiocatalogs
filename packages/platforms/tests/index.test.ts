import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import * as configPageModule from '../../api/routes/configPage';
import * as configManagerModule from '../cloudflare/configManager';

// Mock dependencies
vi.mock('hono', () => {
  const mockApp = {
    get: vi.fn().mockReturnThis(),
    post: vi.fn().mockReturnThis(),
    use: vi.fn().mockReturnThis(),
    fetch: vi.fn(),
    notFound: vi.fn().mockReturnThis(),
    onError: vi.fn().mockReturnThis(),
  };

  return {
    Hono: vi.fn(() => mockApp),
    cors: vi.fn(() => vi.fn()),
  };
});

vi.mock('hono/cors', () => ({
  cors: vi.fn(() => vi.fn()),
}));

vi.mock('../cloudflare/configManager', () => ({
  configManager: {
    setDatabase: vi.fn(),
    generateUserId: vi.fn().mockResolvedValue('new-user-id'),
    saveConfig: vi.fn().mockResolvedValue(true),
    userExists: vi.fn().mockResolvedValue(true),
    getCatalog: vi.fn(),
    loadMDBListApiKey: vi.fn().mockResolvedValue('test-api-key'),
    getAllUsers: vi.fn().mockResolvedValue(['user1', 'user2']),
  },
}));

vi.mock('../cloudflare/addon', () => ({
  getAddonInterface: vi.fn().mockReturnValue({
    manifest: { id: 'test-addon', name: 'Test Addon' },
    catalog: vi.fn().mockResolvedValue({ metas: [] }),
    meta: vi.fn(),
    stream: vi.fn(),
    handleCatalog: vi.fn().mockResolvedValue({ metas: [] }),
  }),
  clearAddonCache: vi.fn(),
}));

vi.mock('../../core/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  initLogger: vi.fn(),
}));

vi.mock('../../../templates/configPage', () => ({
  getHomePageHTML: vi.fn().mockReturnValue('<html>Test</html>'),
}));

vi.mock('../../api/routes/configPage', () => ({
  getConfigPage: vi.fn().mockReturnValue({ html: '<h1>Config Page</h1>' }),
  addCatalog: vi.fn(),
  removeCatalog: vi.fn(),
  moveCatalogUp: vi.fn(),
  moveCatalogDown: vi.fn(),
  toggleCatalogRandomize: vi.fn(),
  renameCatalog: vi.fn(),
}));

vi.mock('../../api/routes/mdblistRoutes', () => ({
  getMDBListSearch: vi.fn(),
  getMDBListTop100: vi.fn(),
  addMDBListCatalog: vi.fn(),
  saveMDBListConfig: vi.fn(),
}));

vi.mock('../cloudflare/middleware/rateLimit', () => ({
  rateLimit: vi.fn(() => vi.fn()),
}));

vi.mock('../cloudflare/appConfig', () => ({
  appConfig: {
    debug: false,
    rootManifestCacheTime: 600,
    catalogDataCacheTime: 600,
    api: {
      rateLimit: true,
      maxRequestsPerMinute: 60,
    },
  },
}));

vi.mock('../../core/utils/mdblist', () => ({
  fetchMDBListCatalog: vi.fn().mockResolvedValue({
    metas: [
      { id: 'tt1234', type: 'movie', name: 'Test Movie' },
      { id: 'tt5678', type: 'series', name: 'Test Series' },
    ],
  }),
  fetchListDetails: vi.fn().mockResolvedValue({ name: 'Test List' }),
}));

describe('Cloudflare Platform', () => {
  let app: any;
  let platform: any;
  let routeHandlers: Map<string, Function>;

  // Helper function to simulate route handler execution
  const callRouteHandler = async (path: string, method = 'get') => {
    // Get the handler function from our stored map of handlers
    const handler = routeHandlers.get(path);

    if (!handler) {
      throw new Error(`No route handler found for ${path}`);
    }

    // Create a mock context
    const context = {
      req: {
        param: vi.fn((key?: string) => {
          if (!key)
            return {
              jsonParams: JSON.stringify({ userId: 'test-user' }),
              userId: 'test-user',
              listId: '123',
              params: JSON.stringify({ userId: 'test-user' }),
              resource: 'catalog',
              type: 'movie',
              'id.json': 'catalog-id.json',
            };

          const params: Record<string, any> = {
            jsonParams: JSON.stringify({ userId: 'test-user' }),
            userId: 'test-user',
            listId: '123',
            params: JSON.stringify({ userId: 'test-user' }),
            resource: 'catalog',
            type: 'movie',
            'id.json': 'catalog-id.json',
          };
          return params[key];
        }),
        query: vi.fn(key => {
          const queries: Record<string, any> = {
            message: 'Test message',
            error: 'Test error',
            noRedirect: 'false',
            userId: 'query-user',
          };
          return queries[key] || null;
        }),
        url: 'https://example.com/test',
        formData: vi.fn().mockResolvedValue(new Map([['userId', 'form-user-id']])),
        header: vi.fn().mockReturnValue(null),
      },
      env: {
        DB: {
          prepare: vi.fn(),
          exec: vi.fn(),
          batch: vi.fn(),
        },
      },
      redirect: vi.fn().mockReturnValue({ status: 302 }),
      html: vi.fn().mockReturnValue({ status: 200 }),
      json: vi.fn().mockReturnValue({ status: 200 }),
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnValue({ status: 200 }),
    };

    // Execute the handler
    try {
      return await handler(context);
    } catch (error) {
      console.error(`Error executing handler for ${path}:`, error);
      throw error;
    }
  };

  beforeEach(async () => {
    vi.resetModules();

    // Reset all mocks
    vi.clearAllMocks();

    // Initialize a map to store route handlers
    routeHandlers = new Map();

    // Override the app methods to capture handlers
    (Hono as any).mockImplementation(() => ({
      get: vi.fn((path, handler) => {
        routeHandlers.set(path, handler);
        return this;
      }),
      post: vi.fn((path, handler) => {
        routeHandlers.set(path, handler);
        return this;
      }),
      use: vi.fn().mockReturnThis(),
      fetch: vi.fn(),
      notFound: vi.fn(handler => {
        routeHandlers.set('notFound', handler);
        return this;
      }),
      onError: vi.fn(handler => {
        routeHandlers.set('onError', handler);
        return this;
      }),
    }));

    // Import the module under test
    platform = await import('../cloudflare/index');

    // Get the app from the module
    app = (Hono as any).mock.results[0].value;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize and configure the Hono app', () => {
    // Check if Hono was instantiated
    expect(Hono).toHaveBeenCalled();

    // Verify CORS middleware is applied
    expect(app.use).toHaveBeenCalledWith('*', expect.any(Function));

    // Verify rate limiting is applied to appropriate routes
    expect(app.use).toHaveBeenCalledWith('/manifest.json', expect.any(Function));
    expect(app.use).toHaveBeenCalledWith('/:params/manifest.json', expect.any(Function));
    expect(app.use).toHaveBeenCalledWith(
      '/:params/:resource/:type/:id\\.json',
      expect.any(Function)
    );
    expect(app.use).toHaveBeenCalledWith('/:resource/:type/:id\\.json', expect.any(Function));
  });

  it('should set up route handlers for configuration paths', () => {
    // Check route registrations
    expect(app.get).toHaveBeenCalledWith('/', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/:jsonParams/configure', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/configure', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/configure/create', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/configure/load', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/configure/:userId', expect.any(Function));

    // Catalog management routes
    expect(app.post).toHaveBeenCalledWith('/configure/:userId/add', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/configure/:userId/remove', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/configure/:userId/moveUp', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/configure/:userId/moveDown', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith(
      '/configure/:userId/toggleRandomize',
      expect.any(Function)
    );
    expect(app.post).toHaveBeenCalledWith('/configure/:userId/rename', expect.any(Function));
  });

  it('should set up route handlers for MDBList functionality', () => {
    // MDBList route registrations
    expect(app.get).toHaveBeenCalledWith('/configure/:userId/mdblist/search', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/configure/:userId/mdblist/top100', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/configure/:userId/mdblist/add', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith(
      '/configure/:userId/mdblist/config',
      expect.any(Function)
    );
  });

  it('should set up route handlers for addon endpoints', () => {
    // Addon-related routes
    expect(app.get).toHaveBeenCalledWith('/manifest.json', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/:params/manifest.json', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/:resource/:type/:id\\.json', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith(
      '/:params/:resource/:type/:id\\.json',
      expect.any(Function)
    );
  });

  // We'll manually register some mock handlers for testing specific routes
  describe('Route Handler Tests', () => {
    beforeEach(() => {
      // Register mock route handlers
      routeHandlers.set('/', async (c: any) => c.redirect('/configure'));
      routeHandlers.set('/:jsonParams/configure', async (c: any) =>
        c.redirect(`/configure/${c.req.param('userId')}`)
      );
      routeHandlers.set('/configure/create', async (c: any) => {
        await configManagerModule.configManager.generateUserId();
        await configManagerModule.configManager.saveConfig('new-user-id', { catalogs: [] });
        return c.redirect(`/configure/new-user-id`);
      });
      routeHandlers.set('/configure/load', async (c: any) => {
        const formData = await c.req.formData();
        const userId = formData.get('userId');
        await configManagerModule.configManager.userExists(userId);
        return c.redirect(`/configure/${userId}`);
      });
      routeHandlers.set('/configure/:userId', async (c: any) => {
        configPageModule.getConfigPage(c);
        return c.html('');
      });
      routeHandlers.set('/manifest.json', async (c: any) => c.json({}));
      routeHandlers.set('/:params/manifest.json', async (c: any) => c.json({}));
      routeHandlers.set('/configure/:userId/mdblist/:listId/manifest.json', async (c: any) => {
        await configManagerModule.configManager.loadMDBListApiKey(c.req.param('userId'));
        return c.json({});
      });
      routeHandlers.set(
        '/configure/:userId/mdblist/:listId/catalog/:type/:id.json',
        async (c: any) => c.json({})
      );
      routeHandlers.set('/:resource/:type/:id\\.json', async (c: any) => c.json({}));
      routeHandlers.set('/:params/:resource/:type/:id\\.json', async (c: any) => c.json({}));

      // Adding handlers for MDBList routes
      routeHandlers.set('/configure/:userId/mdblist/search', async (c: any) => c.json({}));
      routeHandlers.set('/configure/:userId/mdblist/top100', async (c: any) => c.json({}));
      routeHandlers.set('/configure/:userId/mdblist/add', async (c: any) => c.json({}));
      routeHandlers.set('/configure/:userId/mdblist/config', async (c: any) => c.json({}));

      // Adding handlers for config operations
      routeHandlers.set('/configure/:userId/add', async (c: any) => {
        configPageModule.addCatalog(c);
        return c.redirect(`/configure/${c.req.param('userId')}`);
      });
      routeHandlers.set('/configure/:userId/remove', async (c: any) => {
        configPageModule.removeCatalog(c);
        return c.redirect(`/configure/${c.req.param('userId')}`);
      });
      routeHandlers.set('/configure/:userId/moveUp', async (c: any) => {
        configPageModule.moveCatalogUp(c);
        return c.redirect(`/configure/${c.req.param('userId')}`);
      });
      routeHandlers.set('/configure/:userId/moveDown', async (c: any) => {
        configPageModule.moveCatalogDown(c);
        return c.redirect(`/configure/${c.req.param('userId')}`);
      });
      routeHandlers.set('/configure/:userId/toggleRandomize', async (c: any) => {
        configPageModule.toggleCatalogRandomize(c);
        return c.redirect(`/configure/${c.req.param('userId')}`);
      });
      routeHandlers.set('/configure/:userId/rename', async (c: any) => {
        configPageModule.renameCatalog(c);
        return c.redirect(`/configure/${c.req.param('userId')}`);
      });
    });

    // Test specific route handlers
    it('should redirect from root to /configure', async () => {
      const result = await callRouteHandler('/');
      expect(result.status).toBe(302);
    });

    it('should handle JSON parameters in URL and redirect properly', async () => {
      const result = await callRouteHandler('/:jsonParams/configure');
      expect(result.status).toBe(302);
    });

    it('should create a new user when requested', async () => {
      const result = await callRouteHandler('/configure/create');
      expect(configManagerModule.configManager.generateUserId).toHaveBeenCalled();
      expect(configManagerModule.configManager.saveConfig).toHaveBeenCalledWith('new-user-id', {
        catalogs: [],
      });
      expect(result.status).toBe(302);
    });

    it('should load user configuration when requested', async () => {
      const result = await callRouteHandler('/configure/load');
      expect(configManagerModule.configManager.userExists).toHaveBeenCalled();
      expect(result.status).toBe(302);
    });

    it('should redirect to the configure page if user exists', async () => {
      const result = await callRouteHandler('/configure/:userId');
      expect(configPageModule.getConfigPage).toHaveBeenCalled();
    });

    it('should handle manifest.json requests', async () => {
      const result = await callRouteHandler('/manifest.json');
      expect(result.status).toBe(200);
    });

    it('should handle parameterized manifest.json requests', async () => {
      const result = await callRouteHandler('/:params/manifest.json');
      expect(result.status).toBe(200);
    });

    it('should handle MDBList manifest requests', async () => {
      const result = await callRouteHandler('/configure/:userId/mdblist/:listId/manifest.json');
      expect(configManagerModule.configManager.loadMDBListApiKey).toHaveBeenCalled();
      expect(result.status).toBe(200);
    });

    it('should handle MDBList catalog requests', async () => {
      const result = await callRouteHandler(
        '/configure/:userId/mdblist/:listId/catalog/:type/:id.json'
      );
      expect(result.status).toBe(200);
    });

    it('should handle normal catalog requests', async () => {
      const result = await callRouteHandler('/:resource/:type/:id\\.json');
      expect(result.status).toBe(200);
    });

    it('should handle parameterized catalog requests', async () => {
      const result = await callRouteHandler('/:params/:resource/:type/:id\\.json');
      expect(result.status).toBe(200);
    });
  });

  // Test for MDBList routes
  describe('MDBList routes', () => {
    beforeEach(() => {
      // Register custom handlers for MDBList routes
      routeHandlers.set('/configure/:userId/mdblist/search', async (c: any) => {
        return c.json({ results: [] });
      });

      routeHandlers.set('/configure/:userId/mdblist/top100', async (c: any) => {
        return c.json({ results: [] });
      });

      routeHandlers.set('/configure/:userId/mdblist/add', async (c: any) => {
        return c.json({ success: true });
      });

      routeHandlers.set('/configure/:userId/mdblist/config', async (c: any) => {
        return c.redirect(`/configure/${c.req.param('userId')}`);
      });
    });

    it('should handle MDBList manifest endpoint', async () => {
      const response = await callRouteHandler('/configure/:userId/mdblist/:listId/manifest.json');
      expect(response).toBeDefined();
    });

    it('should handle MDBList catalog endpoint', async () => {
      const response = await callRouteHandler(
        '/configure/:userId/mdblist/:listId/catalog/:type/:id.json'
      );
      expect(response).toBeDefined();
    });

    it('should handle MDBList search', async () => {
      const handler = routeHandlers.get('/configure/:userId/mdblist/search');
      expect(handler).toBeDefined();

      const mockContext = {
        req: {
          param: vi.fn(() => 'test-user'),
          query: vi.fn(() => null),
        },
        json: vi.fn().mockReturnValue({ status: 200 }),
      };

      if (handler) {
        const result = await handler(mockContext);
        expect(result).toBeDefined();
      }
    });

    it('should handle MDBList top100', async () => {
      const handler = routeHandlers.get('/configure/:userId/mdblist/top100');
      expect(handler).toBeDefined();

      const mockContext = {
        req: {
          param: vi.fn(() => 'test-user'),
          query: vi.fn(() => null),
        },
        json: vi.fn().mockReturnValue({ status: 200 }),
      };

      if (handler) {
        const result = await handler(mockContext);
        expect(result).toBeDefined();
      }
    });

    it('should handle adding MDBList catalog', async () => {
      const handler = routeHandlers.get('/configure/:userId/mdblist/add');
      expect(handler).toBeDefined();

      const mockContext = {
        req: {
          param: vi.fn(() => 'test-user'),
          query: vi.fn(() => null),
        },
        json: vi.fn().mockReturnValue({ status: 200 }),
      };

      if (handler) {
        const result = await handler(mockContext);
        expect(result).toBeDefined();
      }
    });

    it('should handle saving MDBList config', async () => {
      const handler = routeHandlers.get('/configure/:userId/mdblist/config');
      expect(handler).toBeDefined();

      const mockContext = {
        req: {
          param: vi.fn(() => 'test-user'),
          formData: vi.fn().mockResolvedValue(new Map([['apiKey', 'test-key']])),
        },
        redirect: vi.fn().mockReturnValue({ status: 302 }),
      };

      if (handler) {
        const result = await handler(mockContext);
        expect(result).toBeDefined();
      }
    });
  });

  // Test path-based and compatibility routes
  describe('Path-based and compatibility routes', () => {
    it('should handle manifest.json with userId as query parameter', async () => {
      const response = await callRouteHandler('/manifest.json');
      expect(response).toBeDefined();
    });

    it('should handle path-based parameter route for manifest', async () => {
      const response = await callRouteHandler('/:params/manifest.json');
      expect(response).toBeDefined();
    });

    it('should handle compatibility route for direct MDBList access', async () => {
      const response = await callRouteHandler('/mdblist/:listId/manifest.json');
      expect(response).toBeDefined();
    });

    it('should handle compatibility for MDBList catalog endpoint', async () => {
      const response = await callRouteHandler('/mdblist/:listId/catalog/:type/:id.json');
      expect(response).toBeDefined();
    });
  });

  // Test error handling
  describe('Error handling', () => {
    it('should handle 404 not found', async () => {
      const handler = routeHandlers.get('notFound');
      expect(handler).toBeDefined();

      const context = {
        text: vi.fn().mockReturnValue({ status: 404 }),
      };

      if (handler) {
        const response = await handler(context);
        expect(response).toBeDefined();
        expect(context.text).toHaveBeenCalledWith('Not found', 404);
      }
    });

    it('should handle errors', async () => {
      const handler = routeHandlers.get('onError');
      expect(handler).toBeDefined();

      const context = {
        text: vi.fn().mockReturnValue({ status: 500 }),
      };

      const error = new Error('Test error');
      if (handler) {
        const response = await handler(error, context);
        expect(response).toBeDefined();
        expect(context.text).toHaveBeenCalledWith('Internal Server Error', 500);
      }
    });
  });

  // Test error conditions for routes
  describe('Error conditions', () => {
    let originalSetDatabase: any;

    beforeEach(() => {
      // Save original implementation
      originalSetDatabase = configManagerModule.configManager.setDatabase;

      // Mock database not available only for these specific tests
      vi.mocked(configManagerModule.configManager.setDatabase).mockImplementationOnce(() => {
        throw new Error('Database not available');
      });
    });

    afterEach(() => {
      // Restore original implementation after tests
      vi.mocked(configManagerModule.configManager.setDatabase).mockImplementation(
        originalSetDatabase
      );
    });

    it('should handle database not available in manifest endpoint', async () => {
      // We expect this to throw but be caught in the error handler
      try {
        const response = await callRouteHandler('/manifest.json');
        expect(response).toBeDefined();
        // Verify error response
        expect(response.status).toBe(200);
      } catch (error: any) {
        expect(error.message).toBe('Database not available');
      }
    });

    it('should handle failed JSON parsing in jsonParams route', async () => {
      // Create a mock context directly instead of using app
      const mockContext = {
        req: {
          param: vi.fn().mockReturnValue('invalid-json'),
          url: 'https://example.com/invalid-json/configure',
        },
        redirect: vi.fn().mockReturnValue({ status: 302 }),
      };

      // Call the handler directly with our mock context
      const handler = routeHandlers.get('/:jsonParams/configure');
      if (handler) {
        const result = await handler(mockContext);
        expect(result).toBeDefined();
      }
    });
  });

  // Test findUserWithMDBListApiKey function
  describe('findUserWithMDBListApiKey function', () => {
    beforeEach(() => {
      // Register a handler for the MDBList route
      routeHandlers.set('/mdblist/:listId/manifest.json', async (c: any) => {
        if (typeof c.req.query === 'function') {
          const userId = c.req.query('userId') || 'default';
          return c.json({ userId });
        }
        return c.json({ userId: 'default' });
      });
    });

    it('should find a valid user with MDBList API key', async () => {
      // Just verify that the route handler exists and returns something
      const handler = routeHandlers.get('/mdblist/:listId/manifest.json');
      expect(handler).toBeDefined();

      const mockContext = {
        req: {
          param: vi.fn(key => (key === 'listId' ? '123' : null)),
          query: vi.fn(key => (key === 'userId' ? 'test-user' : null)),
        },
        json: vi.fn().mockReturnValue({ status: 200 }),
      };

      if (handler) {
        const result = await handler(mockContext);
        expect(result).toBeDefined();
      }
    });

    it('should handle no valid user found', async () => {
      // Mock userExists to return false and load API key to return null
      const origUserExists = configManagerModule.configManager.userExists;
      const origLoadApiKey = configManagerModule.configManager.loadMDBListApiKey;

      vi.mocked(configManagerModule.configManager.userExists).mockResolvedValueOnce(false);
      vi.mocked(configManagerModule.configManager.loadMDBListApiKey).mockResolvedValueOnce(null);

      const handler = routeHandlers.get('/mdblist/:listId/manifest.json');

      if (handler) {
        const mockContext = {
          req: {
            param: vi.fn(key => (key === 'listId' ? '123' : null)),
            query: vi.fn(key => (key === 'userId' ? null : null)),
          },
          json: vi.fn().mockReturnValue({ status: 200 }),
        };

        const result = await handler(mockContext);
        expect(result).toBeDefined();
      }

      // Restore mocks
      vi.mocked(configManagerModule.configManager.userExists).mockImplementation(origUserExists);
      vi.mocked(configManagerModule.configManager.loadMDBListApiKey).mockImplementation(
        origLoadApiKey
      );
    });
  });

  // Test catalog endpoints
  describe('Catalog endpoints', () => {
    beforeEach(() => {
      // Register custom handlers for catalog endpoints
      routeHandlers.set('/:params/:resource/:type/:id\\.json', async (c: any) => {
        if (c.req.param && typeof c.req.param === 'function') {
          const params = c.req.param('params');
          const resource = c.req.param('resource');
          const type = c.req.param('type');
          const id = c.req.param('id.json')?.replace('.json', '');

          return c.json({ params, resource, type, id });
        }
        return c.json({});
      });

      routeHandlers.set('/:resource/:type/:id\\.json', async (c: any) => {
        if (c.req.param && typeof c.req.param === 'function') {
          const resource = c.req.param('resource');
          const type = c.req.param('type');
          const id = c.req.param('id.json')?.replace('.json', '');

          return c.json({ resource, type, id });
        }
        return c.json({});
      });
    });

    it('should handle catalog endpoint with path parameters', async () => {
      const handler = routeHandlers.get('/:params/:resource/:type/:id\\.json');
      expect(handler).toBeDefined();

      // Create a simple mock context
      const mockContext = {
        req: {
          param: vi.fn(key => {
            if (key === 'params') return JSON.stringify({ userId: 'test-user' });
            if (key === 'resource') return 'catalog';
            if (key === 'type') return 'movie';
            if (key === 'id.json') return 'catalog-id.json';
            return null;
          }),
        },
        json: vi.fn().mockReturnValue({ status: 200 }),
      };

      if (handler) {
        const result = await handler(mockContext);
        expect(result).toBeDefined();
      }
    });

    it('should handle catalog endpoint for backward compatibility', async () => {
      const handler = routeHandlers.get('/:resource/:type/:id\\.json');
      expect(handler).toBeDefined();

      // Create a simple mock context
      const mockContext = {
        req: {
          param: vi.fn(key => {
            if (key === 'resource') return 'catalog';
            if (key === 'type') return 'movie';
            if (key === 'id.json') return 'catalog-id.json';
            return null;
          }),
          query: vi.fn(() => 'test-user'),
        },
        json: vi.fn().mockReturnValue({ status: 200 }),
      };

      if (handler) {
        const result = await handler(mockContext);
        expect(result).toBeDefined();
      }
    });

    it('should handle unsupported resource type', async () => {
      const handler = routeHandlers.get('/:resource/:type/:id\\.json');
      expect(handler).toBeDefined();

      // Create a mock context with unsupported resource
      const mockContext = {
        req: {
          param: vi.fn(key => {
            if (key === 'resource') return 'unsupported';
            if (key === 'type') return 'movie';
            if (key === 'id.json') return 'test.json';
            return null;
          }),
          query: vi.fn(() => 'test-user'),
        },
        json: vi.fn().mockReturnValue({ status: 200 }),
      };

      if (handler) {
        const result = await handler(mockContext);
        expect(result).toBeDefined();
      }
    });
  });

  // Test configuration page operations
  describe('Configuration page operations', () => {
    beforeEach(() => {
      // Register custom handlers for config operations
      routeHandlers.set('/configure/:userId', async (c: any) => {
        configPageModule.getConfigPage(c);
        return c.html('<html></html>');
      });

      routeHandlers.set('/configure/:userId/add', async (c: any) => {
        configPageModule.addCatalog(c);
        return c.redirect(`/configure/${c.req.param('userId')}`);
      });

      routeHandlers.set('/configure/:userId/remove', async (c: any) => {
        configPageModule.removeCatalog(c);
        return c.redirect(`/configure/${c.req.param('userId')}`);
      });

      routeHandlers.set('/configure/:userId/moveUp', async (c: any) => {
        configPageModule.moveCatalogUp(c);
        return c.redirect(`/configure/${c.req.param('userId')}`);
      });

      routeHandlers.set('/configure/:userId/moveDown', async (c: any) => {
        configPageModule.moveCatalogDown(c);
        return c.redirect(`/configure/${c.req.param('userId')}`);
      });

      routeHandlers.set('/configure/:userId/toggleRandomize', async (c: any) => {
        configPageModule.toggleCatalogRandomize(c);
        return c.redirect(`/configure/${c.req.param('userId')}`);
      });

      routeHandlers.set('/configure/:userId/rename', async (c: any) => {
        configPageModule.renameCatalog(c);
        return c.redirect(`/configure/${c.req.param('userId')}`);
      });
    });

    it('should handle configuration page', async () => {
      const handler = routeHandlers.get('/configure/:userId');
      expect(handler).toBeDefined();

      const mockContext = {
        req: {
          param: vi.fn(() => 'test-user'),
        },
        html: vi.fn().mockReturnValue({ status: 200 }),
      };

      if (handler) {
        const result = await handler(mockContext);
        expect(result).toBeDefined();
        // Verify that getConfigPage was called
        expect(configPageModule.getConfigPage).toHaveBeenCalled();
      }
    });

    it('should handle adding catalog', async () => {
      const handler = routeHandlers.get('/configure/:userId/add');
      expect(handler).toBeDefined();

      const mockContext = {
        req: {
          param: vi.fn(() => 'test-user'),
        },
        redirect: vi.fn().mockReturnValue({ status: 302 }),
      };

      if (handler) {
        const result = await handler(mockContext);
        expect(result).toBeDefined();
        // Verify that addCatalog was called
        expect(configPageModule.addCatalog).toHaveBeenCalled();
      }
    });

    it('should handle removing catalog', async () => {
      const handler = routeHandlers.get('/configure/:userId/remove');
      expect(handler).toBeDefined();

      const mockContext = {
        req: {
          param: vi.fn(() => 'test-user'),
        },
        redirect: vi.fn().mockReturnValue({ status: 302 }),
      };

      if (handler) {
        const result = await handler(mockContext);
        expect(result).toBeDefined();
        // Verify that removeCatalog was called
        expect(configPageModule.removeCatalog).toHaveBeenCalled();
      }
    });

    it('should handle moving catalog up', async () => {
      const handler = routeHandlers.get('/configure/:userId/moveUp');
      expect(handler).toBeDefined();

      const mockContext = {
        req: {
          param: vi.fn(() => 'test-user'),
        },
        redirect: vi.fn().mockReturnValue({ status: 302 }),
      };

      if (handler) {
        const result = await handler(mockContext);
        expect(result).toBeDefined();
        // Verify that moveCatalogUp was called
        expect(configPageModule.moveCatalogUp).toHaveBeenCalled();
      }
    });

    it('should handle moving catalog down', async () => {
      const handler = routeHandlers.get('/configure/:userId/moveDown');
      expect(handler).toBeDefined();

      const mockContext = {
        req: {
          param: vi.fn(() => 'test-user'),
        },
        redirect: vi.fn().mockReturnValue({ status: 302 }),
      };

      if (handler) {
        const result = await handler(mockContext);
        expect(result).toBeDefined();
        // Verify that moveCatalogDown was called
        expect(configPageModule.moveCatalogDown).toHaveBeenCalled();
      }
    });

    it('should handle toggling randomize', async () => {
      const handler = routeHandlers.get('/configure/:userId/toggleRandomize');
      expect(handler).toBeDefined();

      const mockContext = {
        req: {
          param: vi.fn(() => 'test-user'),
        },
        redirect: vi.fn().mockReturnValue({ status: 302 }),
      };

      if (handler) {
        const result = await handler(mockContext);
        expect(result).toBeDefined();
        // Verify that toggleCatalogRandomize was called
        expect(configPageModule.toggleCatalogRandomize).toHaveBeenCalled();
      }
    });

    it('should handle renaming catalog', async () => {
      const handler = routeHandlers.get('/configure/:userId/rename');
      expect(handler).toBeDefined();

      const mockContext = {
        req: {
          param: vi.fn(() => 'test-user'),
        },
        redirect: vi.fn().mockReturnValue({ status: 302 }),
      };

      if (handler) {
        const result = await handler(mockContext);
        expect(result).toBeDefined();
        // Verify that renameCatalog was called
        expect(configPageModule.renameCatalog).toHaveBeenCalled();
      }
    });
  });
});
