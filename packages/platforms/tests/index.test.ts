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
    generateUserId: vi.fn(),
    saveConfig: vi.fn(),
    userExists: vi.fn(),
  },
}));

vi.mock('../cloudflare/addon', () => ({
  getAddonInterface: vi.fn(),
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
  getConfigPage: vi.fn(),
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
  },
}));

describe('Cloudflare Platform', () => {
  let app: any;
  let platform: any;

  beforeEach(async () => {
    vi.resetModules();

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
});
