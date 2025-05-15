import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseConfigManager } from '../config/configManager';
import { UserConfig, CatalogManifest } from '../../types/index';

// Mock implementation of BaseConfigManager for testing
class MockConfigManager extends BaseConfigManager {
  private configs: Map<string, UserConfig>;
  private mdbApiKeys: Map<string, string>;
  private rpdbApiKeys: Map<string, string>;
  private users: Set<string>;

  constructor() {
    super();
    this.configs = new Map();
    this.mdbApiKeys = new Map();
    this.rpdbApiKeys = new Map();
    this.users = new Set(['test-user']);

    // Set up initial test data
    this.configs.set('test-user', {
      catalogs: [
        {
          id: 'test-catalog-1',
          name: 'Test Catalog 1',
          endpoint: 'http://example.com/1',
        } as CatalogManifest,
        {
          id: 'test-catalog-2',
          name: 'Test Catalog 2',
          endpoint: 'http://example.com/2',
        } as CatalogManifest,
      ],
      catalogOrder: ['test-catalog-1', 'test-catalog-2'],
      randomizedCatalogs: [],
    });
  }

  generateUserId(): string {
    return 'generated-user-id';
  }

  loadConfig(userId: string): UserConfig {
    return (
      this.configs.get(userId) || {
        catalogs: [],
        catalogOrder: [],
        randomizedCatalogs: [],
      }
    );
  }

  saveConfig(userId: string, config?: UserConfig): boolean {
    if (config) {
      this.configs.set(userId, config);
      return true;
    }
    return false;
  }

  userExists(userId: string): boolean {
    return this.users.has(userId);
  }

  saveMDBListApiKey(userId: string, apiKey: string): boolean {
    this.mdbApiKeys.set(userId, apiKey);
    return true;
  }

  loadMDBListApiKey(userId: string): string | null {
    return this.mdbApiKeys.get(userId) || null;
  }

  saveRPDBApiKey(userId: string, apiKey: string): boolean {
    this.rpdbApiKeys.set(userId, apiKey);
    return true;
  }

  loadRPDBApiKey(userId: string): string | null {
    return this.rpdbApiKeys.get(userId) || null;
  }

  // Test helpers to access protected properties
  setCacheItem(key: string, value: UserConfig): void {
    this.cache.set(key, value);
  }

  getCacheItem(key: string): UserConfig | undefined {
    return this.cache.get(key);
  }

  hasCacheItem(key: string): boolean {
    return this.cache.has(key);
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  // Missing implementation for renameCatalog
  async renameCatalog(userId: string, id: string, newName: string): Promise<boolean> {
    const config = this.loadConfig(userId);
    const catalog = config.catalogs.find(c => c.id === id);

    if (catalog) {
      catalog.name = newName;
      this.saveConfig(userId, config);
      return true;
    }

    return false;
  }
}

describe('BaseConfigManager', () => {
  let configManager: MockConfigManager;

  beforeEach(() => {
    configManager = new MockConfigManager();
    vi.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return user config', async () => {
      const config = await configManager.getConfig('test-user');
      expect(config).toBeDefined();
      expect(config.catalogs).toHaveLength(2);
      expect(config.catalogOrder).toEqual(['test-catalog-1', 'test-catalog-2']);
    });

    it('should initialize catalogOrder if not present', async () => {
      const newUser = 'new-user';
      const newCatalog = {
        id: 'new-catalog',
        name: 'New Catalog',
        endpoint: 'http://example.com/new',
      } as CatalogManifest;
      await configManager.saveConfig(newUser, {
        catalogs: [newCatalog],
        catalogOrder: [],
        randomizedCatalogs: [],
      });

      const config = await configManager.getConfig(newUser);
      expect(config.catalogOrder).toEqual(['new-catalog']);
    });
  });

  describe('addCatalog', () => {
    it('should add a new catalog to user config', async () => {
      const newCatalog: CatalogManifest = {
        id: 'test-catalog-3',
        name: 'Test Catalog 3',
        endpoint: 'http://example.com/3',
        catalogs: [],
        version: '1.0.0',
        resources: ['catalog'],
        types: ['movie', 'series'],
        description: 'Test',
      };

      const result = await configManager.addCatalog('test-user', newCatalog);
      expect(result).toBe(true);

      const config = await configManager.getConfig('test-user');
      expect(config.catalogs).toHaveLength(3);
      expect(config.catalogOrder).toContain('test-catalog-3');
    });

    it('should update existing catalog with same ID', async () => {
      const updatedCatalog: CatalogManifest = {
        id: 'test-catalog-1',
        name: 'Updated Catalog',
        endpoint: 'http://example.com/updated',
        catalogs: [],
        version: '1.0.0',
        resources: ['catalog'],
        types: ['movie', 'series'],
        description: 'Updated Test',
      };

      const result = await configManager.addCatalog('test-user', updatedCatalog);
      expect(result).toBe(true);

      const config = await configManager.getConfig('test-user');
      expect(config.catalogs).toHaveLength(2);
      expect(config.catalogs[0].name).toBe('Updated Catalog');
    });
  });

  describe('removeCatalog', () => {
    it('should remove a catalog from user config', async () => {
      const result = await configManager.removeCatalog('test-user', 'test-catalog-1');
      expect(result).toBe(true);

      const config = await configManager.getConfig('test-user');
      expect(config.catalogs).toHaveLength(1);
      expect(config.catalogOrder).not.toContain('test-catalog-1');
    });

    it('should return false if catalog not found', async () => {
      const result = await configManager.removeCatalog('test-user', 'nonexistent-catalog');
      expect(result).toBe(false);
    });
  });

  describe('toggleRandomize', () => {
    it('should add catalog to randomizedCatalogs if not present', async () => {
      const result = await configManager.toggleRandomize('test-user', 'test-catalog-1');
      expect(result).toBe(true);

      const config = await configManager.getConfig('test-user');
      expect(config.randomizedCatalogs).toContain('test-catalog-1');
    });

    it('should remove catalog from randomizedCatalogs if already present', async () => {
      // First add it
      await configManager.toggleRandomize('test-user', 'test-catalog-2');

      // Then remove it
      const result = await configManager.toggleRandomize('test-user', 'test-catalog-2');
      expect(result).toBe(true);

      const config = await configManager.getConfig('test-user');
      expect(config.randomizedCatalogs).not.toContain('test-catalog-2');
    });
  });

  describe('isRandomized', () => {
    it('should return true for randomized catalog', async () => {
      await configManager.toggleRandomize('test-user', 'test-catalog-1');
      const result = await configManager.isRandomized('test-user', 'test-catalog-1');
      expect(result).toBe(true);
    });

    it('should return false for non-randomized catalog', async () => {
      const result = await configManager.isRandomized('test-user', 'test-catalog-2');
      expect(result).toBe(false);
    });
  });

  describe('moveCatalogUp and moveCatalogDown', () => {
    it('should move catalog up in the order', async () => {
      const result = await configManager.moveCatalogUp('test-user', 'test-catalog-2');
      expect(result).toBe(true);

      const config = await configManager.getConfig('test-user');
      expect(config.catalogOrder).toEqual(['test-catalog-2', 'test-catalog-1']);
    });

    it('should not move catalog up if already at the top', async () => {
      // First move to the top
      await configManager.moveCatalogUp('test-user', 'test-catalog-2');

      // Try to move up again
      const result = await configManager.moveCatalogUp('test-user', 'test-catalog-2');
      expect(result).toBe(false);
    });

    it('should move catalog down in the order', async () => {
      const result = await configManager.moveCatalogDown('test-user', 'test-catalog-1');
      expect(result).toBe(true);

      const config = await configManager.getConfig('test-user');
      expect(config.catalogOrder).toEqual(['test-catalog-2', 'test-catalog-1']);
    });

    it('should not move catalog down if already at the bottom', async () => {
      // First move to the bottom
      await configManager.moveCatalogDown('test-user', 'test-catalog-1');

      // Try to move down again
      const result = await configManager.moveCatalogDown('test-user', 'test-catalog-1');
      expect(result).toBe(false);
    });

    it('should return false when moving a non-existent catalog', async () => {
      const result = await configManager.moveCatalogDown('test-user', 'nonexistent-catalog');
      expect(result).toBe(false);
    });
  });

  describe('renameCatalog', () => {
    it('should rename a catalog successfully', async () => {
      const result = await configManager.renameCatalog(
        'test-user',
        'test-catalog-1',
        'Renamed Catalog'
      );
      expect(result).toBe(true);

      const config = await configManager.getConfig('test-user');
      const catalog = config.catalogs.find(c => c.id === 'test-catalog-1');
      expect(catalog?.name).toBe('Renamed Catalog');
    });

    it('should return false when renaming a non-existent catalog', async () => {
      const result = await configManager.renameCatalog(
        'test-user',
        'nonexistent-catalog',
        'New Name'
      );
      expect(result).toBe(false);
    });
  });

  describe('getCatalog', () => {
    it('should return a specific catalog by ID', async () => {
      const catalog = await configManager.getCatalog('test-user', 'test-catalog-1');
      expect(catalog).toBeDefined();
      expect(catalog?.id).toBe('test-catalog-1');
    });

    it('should return undefined for non-existent catalog', async () => {
      const catalog = await configManager.getCatalog('test-user', 'nonexistent-catalog');
      expect(catalog).toBeUndefined();
    });
  });

  describe('getAllCatalogs', () => {
    it('should return all catalogs for a user', async () => {
      const catalogs = await configManager.getAllCatalogs('test-user');
      expect(catalogs).toHaveLength(2);
      expect(catalogs[0].id).toBe('test-catalog-1');
      expect(catalogs[1].id).toBe('test-catalog-2');
    });

    it('should return empty array for user with no catalogs', async () => {
      const catalogs = await configManager.getAllCatalogs('empty-user');
      expect(catalogs).toEqual([]);
    });
  });

  describe('cache management', () => {
    it('should clear cache for a specific user', () => {
      // Set up a cache entry
      configManager.setCacheItem('test-user', {
        catalogs: [],
        catalogOrder: [],
        randomizedCatalogs: [],
      });
      expect(configManager.hasCacheItem('test-user')).toBe(true);

      configManager.clearCache('test-user');
      expect(configManager.hasCacheItem('test-user')).toBe(false);
    });

    it('should clear cache for all users', () => {
      // Set up multiple cache entries
      configManager.setCacheItem('test-user-1', {
        catalogs: [],
        catalogOrder: [],
        randomizedCatalogs: [],
      });
      configManager.setCacheItem('test-user-2', {
        catalogs: [],
        catalogOrder: [],
        randomizedCatalogs: [],
      });
      expect(configManager.getCacheSize()).toBe(2);

      configManager.clearAllCache();
      expect(configManager.getCacheSize()).toBe(0);
    });
  });

  describe('MDBList API key management', () => {
    it('should save and load MDBList API key', async () => {
      const apiKey = 'test-api-key';
      const saveResult = await configManager.saveMDBListApiKey('test-user', apiKey);
      expect(saveResult).toBe(true);

      const loadedKey = await configManager.loadMDBListApiKey('test-user');
      expect(loadedKey).toBe(apiKey);
    });

    it('should return null for non-existent API key', async () => {
      const loadedKey = await configManager.loadMDBListApiKey('new-user');
      expect(loadedKey).toBeNull();
    });
  });
});
