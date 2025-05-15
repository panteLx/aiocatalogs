import { UserConfig, CatalogManifest } from '../../types/index';
import { D1Database, Env } from './types';
import { randomUUID } from 'crypto';
import { BaseConfigManager } from '../../core/config/configManager';
import { logger } from '../../core/utils/logger';

export class CloudflareConfigManager extends BaseConfigManager {
  private database: D1Database | null = null;
  private apiKeyCache: Map<string, string> = new Map<string, string>();
  private rpdbApiKeyCache: Map<string, string> = new Map();

  constructor() {
    super();
  }

  // Set the database
  setDatabase(database: D1Database) {
    this.database = database;
  }

  // Initialize database schema
  async initDatabase() {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    // Create table for user configurations if it doesn't exist
    try {
      await this.database.exec(
        `CREATE TABLE IF NOT EXISTS user_configs (user_id TEXT PRIMARY KEY, config TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`
      );
      logger.debug('Database schema initialized');
    } catch (error) {
      logger.error('Error initializing database schema:', error);
      throw error;
    }
  }

  // Generate a new user ID
  async generateUserId(): Promise<string> {
    // In Cloudflare Workers we use crypto.randomUUID
    const userId = randomUUID();
    logger.info(`Generated new user ID: ${userId}`);
    return userId;
  }

  // Load configuration for a specific user
  async loadConfig(userId: string): Promise<UserConfig> {
    // Add a cache invalidation time - if cache is older than 30 seconds, refresh it
    // This ensures that changes made to catalogs are visible faster
    const cachedConfig = this.cache.get(userId);
    const now = Date.now();

    if (cachedConfig && cachedConfig._cachedAt && now - cachedConfig._cachedAt < 30000) {
      logger.info(
        `Using cached config for user ${userId} (age: ${(now - cachedConfig._cachedAt) / 1000}s)`
      );
      return cachedConfig;
    }

    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      // Initialize the database if not already done
      await this.initDatabase();

      // Load configuration from the database
      const result = await this.database
        .prepare('SELECT config FROM user_configs WHERE user_id = ?')
        .bind(userId)
        .first();

      if (result && result.config) {
        const config = JSON.parse(result.config as string);
        logger.debug(
          `Loaded config for user ${userId} with ${config.catalogs?.length || 0} catalogs and catalogOrder: ${JSON.stringify(config.catalogOrder)}`
        );

        // Add timestamp to track cache age
        config._cachedAt = now;
        this.cache.set(userId, config);
        return config;
      }
    } catch (error) {
      logger.error(`Error loading config for user ${userId}:`, error);
    }

    // Default empty configuration
    logger.info(`Creating new empty config for user ${userId}`);
    const defaultConfig: UserConfig = { catalogs: [], _cachedAt: now };
    return defaultConfig;
  }

  // Save configuration for a specific user
  async saveConfig(userId: string, config?: UserConfig): Promise<boolean> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    // If no configuration is provided but exists in cache, use that
    if (!config && this.cache.has(userId)) {
      config = this.cache.get(userId)!;
    } else if (!config) {
      // Error if no configuration found
      logger.error(
        `Cannot save config for user ${userId}: config not provided and not found in cache`
      );
      return false;
    }

    try {
      // Initialize the database if not already done
      await this.initDatabase();

      const now = Date.now();
      const configJson = JSON.stringify(config);

      // Check if the user already exists
      const exists = await this.userExists(userId);

      if (exists) {
        // Update existing entry
        await this.database
          .prepare('UPDATE user_configs SET config = ?, updated_at = ? WHERE user_id = ?')
          .bind(configJson, now, userId)
          .run();
      } else {
        // Add new entry
        await this.database
          .prepare(
            'INSERT INTO user_configs (user_id, config, created_at, updated_at) VALUES (?, ?, ?, ?)'
          )
          .bind(userId, configJson, now, now)
          .run();
      }

      logger.info(
        `Saved config for user ${userId} with ${config.catalogs.length} catalogs and catalogOrder: ${JSON.stringify(config.catalogOrder)}`
      );

      // Add or update timestamp for cache tracking
      config._cachedAt = Date.now();
      this.cache.set(userId, config);
      return true;
    } catch (error) {
      logger.error(`Error saving config for user ${userId}:`, error);
      return false;
    }
  }

  // Check if user exists
  async userExists(userId: string): Promise<boolean> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      // Initialize the database if not already done
      await this.initDatabase();

      const result = await this.database
        .prepare('SELECT 1 FROM user_configs WHERE user_id = ?')
        .bind(userId)
        .first();

      return !!result;
    } catch (error) {
      logger.error(`Error checking if user ${userId} exists:`, error);
      return false;
    }
  }

  // Get all users
  async getAllUsers(): Promise<string[]> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      // Initialize the database if not already done
      await this.initDatabase();

      const result = await this.database
        .prepare('SELECT user_id FROM user_configs ORDER BY created_at DESC')
        .all();

      if (result && result.results) {
        const users = result.results.map((row: any) => row.user_id);
        logger.info(`Retrieved ${users.length} users`);
        return users;
      }

      return [];
    } catch (error) {
      logger.error('Error getting all users:', error);
      return [];
    }
  }

  // Add a new method to explicitly clear cache for a user
  clearUserCache(userId: string): void {
    if (this.cache.has(userId)) {
      logger.info(`Manually clearing config cache for user ${userId}`);
      this.cache.delete(userId);
    }
  }

  // Clear the API key cache for a user
  clearApiKeyCache(userId: string): void {
    this.apiKeyCache.delete(userId);
    this.rpdbApiKeyCache.delete(userId);
    logger.debug(`Cleared API key cache for user ${userId}`);
  }

  // Save MDBList API key for a user
  async saveMDBListApiKey(userId: string, apiKey: string): Promise<boolean> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      // Initialize the database if not already done
      await this.initDatabase();

      const now = Date.now();

      // Check if an entry for this user already exists
      const exists = await this.database
        .prepare('SELECT 1 FROM mdblist_api_keys WHERE user_id = ?')
        .bind(userId)
        .first();

      if (exists) {
        // Update existing entry
        await this.database
          .prepare('UPDATE mdblist_api_keys SET api_key = ?, updated_at = ? WHERE user_id = ?')
          .bind(apiKey, now, userId)
          .run();
      } else {
        // Add new entry
        await this.database
          .prepare(
            'INSERT INTO mdblist_api_keys (user_id, api_key, created_at, updated_at) VALUES (?, ?, ?, ?)'
          )
          .bind(userId, apiKey, now, now)
          .run();
      }

      logger.info(`Saved MDBList API key for user ${userId}`);
      return true;
    } catch (error) {
      // Improved error handling with more detailed information
      if (error instanceof Error) {
        logger.error(`Error saving MDBList API key for user ${userId}: ${error.message}`, error);
      } else {
        logger.error(`Unknown error saving MDBList API key for user ${userId}:`, error);
      }

      // Try as fallback to store the API key in the in-memory cache
      try {
        this.apiKeyCache.set(userId, apiKey);
        logger.info(`Saved MDBList API key for user ${userId} in memory cache as fallback`);
        return true;
      } catch (cacheError) {
        logger.error(`Failed to save API key in memory cache: ${cacheError}`);
        return false;
      }
    }
  }

  // Load MDBList API key for a user
  async loadMDBListApiKey(userId: string): Promise<string | null> {
    // Check cache first
    if (this.apiKeyCache.has(userId)) {
      const cachedKey = this.apiKeyCache.get(userId);
      logger.debug(`Using cached MDBList API key for user ${userId}`);
      return cachedKey || null;
    }

    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      // Initialize the database if not already done
      await this.initDatabase();

      // Get the API key from the database
      const result = await this.database
        .prepare('SELECT api_key FROM mdblist_api_keys WHERE user_id = ?')
        .bind(userId)
        .first();

      if (result && result.api_key) {
        const apiKey = result.api_key as string;
        logger.debug(`Loaded MDBList API key for user ${userId} from database`);

        // Store in cache for future use
        this.apiKeyCache.set(userId, apiKey);

        return apiKey;
      }
    } catch (error) {
      logger.error(`Error loading MDBList API key for user ${userId}:`, error);
    }

    logger.debug(`No MDBList API key found for user ${userId}`);
    return null;
  }

  // Save RPDB API key for a user
  async saveRPDBApiKey(userId: string, apiKey: string): Promise<boolean> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      // Initialize the database if not already done
      await this.initDatabase();

      const now = Date.now();

      // Check if an entry for this user already exists
      const exists = await this.database
        .prepare('SELECT 1 FROM rpdb_api_keys WHERE user_id = ?')
        .bind(userId)
        .first();

      if (exists) {
        // Update existing entry
        await this.database
          .prepare('UPDATE rpdb_api_keys SET api_key = ?, updated_at = ? WHERE user_id = ?')
          .bind(apiKey, now, userId)
          .run();
      } else {
        // Add new entry
        await this.database
          .prepare(
            'INSERT INTO rpdb_api_keys (user_id, api_key, created_at, updated_at) VALUES (?, ?, ?, ?)'
          )
          .bind(userId, apiKey, now, now)
          .run();
      }

      logger.info(`Saved RPDB API key for user ${userId}`);

      // Update cache
      this.rpdbApiKeyCache.set(userId, apiKey);
      return true;
    } catch (error) {
      // Improved error handling with more detailed information
      if (error instanceof Error) {
        logger.error(`Error saving RPDB API key for user ${userId}: ${error.message}`, error);
      } else {
        logger.error(`Unknown error saving RPDB API key for user ${userId}:`, error);
      }

      // Try as fallback to store the API key in the in-memory cache
      try {
        this.rpdbApiKeyCache.set(userId, apiKey);
        logger.info(`Saved RPDB API key for user ${userId} in memory cache as fallback`);
        return true;
      } catch (cacheError) {
        logger.error(`Failed to save RPDB API key in memory cache: ${cacheError}`);
        return false;
      }
    }
  }

  // Load RPDB API key for a user
  async loadRPDBApiKey(userId: string): Promise<string | null> {
    // Check cache first
    if (this.rpdbApiKeyCache.has(userId)) {
      const cachedKey = this.rpdbApiKeyCache.get(userId);
      logger.debug(`Using cached RPDB API key for user ${userId}`);
      return cachedKey || null;
    }

    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      // Initialize the database if not already done
      await this.initDatabase();

      // Get the API key from the database
      const result = await this.database
        .prepare('SELECT api_key FROM rpdb_api_keys WHERE user_id = ?')
        .bind(userId)
        .first();

      if (result && result.api_key) {
        const apiKey = result.api_key as string;
        logger.debug(`Loaded RPDB API key for user ${userId} from database`);

        // Store in cache for future use
        this.rpdbApiKeyCache.set(userId, apiKey);

        return apiKey;
      }
    } catch (error) {
      logger.error(`Error loading RPDB API key for user ${userId}:`, error);
    }

    logger.debug(`No RPDB API key found for user ${userId}`);
    return null;
  }
}

// Singleton instance
export const configManager = new CloudflareConfigManager();
