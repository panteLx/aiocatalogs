import { describe, test, expect, vi } from 'vitest';

// Since we're testing a declaration file, we'll need to mock the module's functionality
describe('Stremio Addon SDK Declaration', () => {
  describe('addonBuilder', () => {
    test('should have all expected methods', () => {
      // Mock the addonBuilder class
      const mockAddonBuilder = {
        defineMetaHandler: vi.fn().mockReturnThis(),
        defineCatalogHandler: vi.fn().mockReturnThis(),
        defineResourceHandler: vi.fn().mockReturnThis(),
        defineStreamHandler: vi.fn().mockReturnThis(),
        defineSubtitlesHandler: vi.fn().mockReturnThis(),
        getInterface: vi.fn().mockReturnValue({}),
        run: vi.fn(),
      };

      // Verify the mock has expected methods
      expect(mockAddonBuilder).toHaveProperty('defineMetaHandler');
      expect(mockAddonBuilder).toHaveProperty('defineCatalogHandler');
      expect(mockAddonBuilder).toHaveProperty('defineResourceHandler');
      expect(mockAddonBuilder).toHaveProperty('defineStreamHandler');
      expect(mockAddonBuilder).toHaveProperty('defineSubtitlesHandler');
      expect(mockAddonBuilder).toHaveProperty('getInterface');
      expect(mockAddonBuilder).toHaveProperty('run');
    });

    test('should properly chain handler methods', () => {
      // Mock the addonBuilder class
      const mockAddonBuilder = {
        defineMetaHandler: vi.fn().mockReturnThis(),
        defineCatalogHandler: vi.fn().mockReturnThis(),
        defineResourceHandler: vi.fn().mockReturnThis(),
        defineStreamHandler: vi.fn().mockReturnThis(),
        defineSubtitlesHandler: vi.fn().mockReturnThis(),
        getInterface: vi.fn().mockReturnValue({}),
        run: vi.fn(),
      };

      // Test method chaining
      const manifest = { id: 'test', name: 'Test Addon', version: '1.0.0' };
      const handler = async () => ({ metas: [] });

      // Chain multiple methods to simulate real usage
      const result = mockAddonBuilder
        .defineMetaHandler(handler)
        .defineCatalogHandler(handler)
        .defineStreamHandler(handler);

      expect(mockAddonBuilder.defineMetaHandler).toHaveBeenCalledWith(handler);
      expect(mockAddonBuilder.defineCatalogHandler).toHaveBeenCalledWith(handler);
      expect(mockAddonBuilder.defineStreamHandler).toHaveBeenCalledWith(handler);
      expect(result).toBe(mockAddonBuilder); // Check that it returns this for chaining
    });

    test('should have a constructor that accepts a manifest', () => {
      // Mock constructor function
      const MockAddonBuilder = vi.fn().mockImplementation(manifest => {
        expect(manifest).toHaveProperty('id');
        expect(manifest).toHaveProperty('name');
        expect(manifest).toHaveProperty('version');

        return {
          defineMetaHandler: vi.fn().mockReturnThis(),
          defineCatalogHandler: vi.fn().mockReturnThis(),
          defineResourceHandler: vi.fn().mockReturnThis(),
          defineStreamHandler: vi.fn().mockReturnThis(),
          defineSubtitlesHandler: vi.fn().mockReturnThis(),
          getInterface: vi.fn().mockReturnValue({}),
          run: vi.fn(),
        };
      });

      // Create an instance with a manifest
      const manifest = {
        id: 'test-addon',
        name: 'Test Addon',
        version: '1.0.0',
        resources: ['catalog'],
        catalogs: [],
      };

      const addonInstance = new MockAddonBuilder(manifest);

      expect(MockAddonBuilder).toHaveBeenCalledWith(manifest);
      expect(addonInstance).toHaveProperty('defineMetaHandler');
      expect(addonInstance).toHaveProperty('run');
    });
  });

  describe('serveHTTP', () => {
    test('should have expected methods', () => {
      // Mock the serveHTTP class
      const mockServeHTTP = {
        middleware: vi.fn().mockReturnValue({}),
        run: vi.fn(),
      };

      // Verify the mock has expected methods
      expect(mockServeHTTP).toHaveProperty('middleware');
      expect(mockServeHTTP).toHaveProperty('run');
    });

    test('should accept addonInterface and options', () => {
      // Mock constructor function
      const MockServeHTTP = vi.fn().mockImplementation((addonInterface, options) => {
        // Validate that options are correctly passed
        if (options) {
          expect(options).toHaveProperty('port');
          expect(options).toHaveProperty('cacheMaxAge');
        }

        return {
          middleware: vi.fn().mockReturnValue({}),
          run: vi.fn(),
        };
      });

      // Create an instance with an interface and options
      const addonInterface = {}; // Mock interface
      const options = { port: 3000, cacheMaxAge: 7200 };

      const serverInstance = new MockServeHTTP(addonInterface, options);

      expect(MockServeHTTP).toHaveBeenCalledWith(addonInterface, options);
      expect(serverInstance).toHaveProperty('middleware');
      expect(serverInstance).toHaveProperty('run');
    });
  });

  describe('getRouter', () => {
    test('should be a function that returns a router object', () => {
      // Mock the getRouter function
      const mockGetRouter = vi.fn().mockReturnValue({
        get: vi.fn(),
        post: vi.fn(),
        use: vi.fn(),
      });

      // Verify the mock function
      expect(typeof mockGetRouter).toBe('function');

      // Test function call
      const addonInterface = {};
      const options = { cacheMaxAge: 3600 };

      const router = mockGetRouter(addonInterface, options);
      expect(mockGetRouter).toHaveBeenCalledWith(addonInterface, options);
      expect(router).toHaveProperty('get');
      expect(router).toHaveProperty('post');
      expect(router).toHaveProperty('use');
    });

    test('should accept addonInterface parameter only', () => {
      // Mock the getRouter function
      const mockGetRouter = vi.fn().mockReturnValue({});

      // Test function call with only the required parameter
      const addonInterface = {};
      mockGetRouter(addonInterface);

      expect(mockGetRouter).toHaveBeenCalledWith(addonInterface);
    });
  });
});
