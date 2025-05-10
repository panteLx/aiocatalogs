import { UserConfig, CatalogManifest } from '../types';
import { D1Database } from './types';
import { randomUUID } from 'crypto';
import { BaseConfigManager } from '../shared/configManager';

class CloudflareConfigManager extends BaseConfigManager {
  private db: D1Database | null = null;

  constructor() {
    super();
  }

  // Set database
  setDatabase(database: D1Database) {
    this.db = database;
  }

  // Initialize database schema
  async initDatabase() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Create table for user configurations if it doesn't exist
    try {
      await this.db.exec(
        `CREATE TABLE IF NOT EXISTS user_configs (user_id TEXT PRIMARY KEY, config TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`
      );
      console.log('Database schema initialized');
    } catch (error) {
      console.error('Error initializing database schema:', error);
      throw error;
    }
  }

  // Generate a new user ID
  async generateUserId(): Promise<string> {
    // In Cloudflare Workers we use crypto.randomUUID
    const userId = randomUUID();
    console.log(`Generated new user ID: ${userId}`);
    return userId;
  }

  // Load configuration for a specific user
  async loadConfig(userId: string): Promise<UserConfig> {
    if (this.cache.has(userId)) {
      console.log(`Using cached config for user ${userId}`);
      return this.cache.get(userId)!;
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Initialize the database if not already done
      await this.initDatabase();

      // Load configuration from the database
      const result = await this.db
        .prepare('SELECT config FROM user_configs WHERE user_id = ?')
        .bind(userId)
        .first();

      if (result && result.config) {
        const config = JSON.parse(result.config as string);
        console.log(
          `Loaded config for user ${userId} with ${config.catalogs?.length || 0} catalogs and catalogOrder: ${JSON.stringify(config.catalogOrder)}`
        );

        this.cache.set(userId, config);
        return config;
      }
    } catch (error) {
      console.error(`Error loading config for user ${userId}:`, error);
    }

    // Default empty configuration
    console.log(`Creating new empty config for user ${userId}`);
    const defaultConfig: UserConfig = { catalogs: [] };
    return defaultConfig;
  }

  // Save configuration for a specific user
  async saveConfig(userId: string, config?: UserConfig): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // If no configuration is provided but exists in cache, use that
    if (!config && this.cache.has(userId)) {
      config = this.cache.get(userId)!;
    } else if (!config) {
      // Error if no configuration found
      console.error(
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
        await this.db
          .prepare('UPDATE user_configs SET config = ?, updated_at = ? WHERE user_id = ?')
          .bind(configJson, now, userId)
          .run();
      } else {
        // Add new entry
        await this.db
          .prepare(
            'INSERT INTO user_configs (user_id, config, created_at, updated_at) VALUES (?, ?, ?, ?)'
          )
          .bind(userId, configJson, now, now)
          .run();
      }

      console.log(
        `Saved config for user ${userId} with ${config.catalogs.length} catalogs and catalogOrder: ${JSON.stringify(config.catalogOrder)}`
      );

      this.cache.set(userId, config);
      return true;
    } catch (error) {
      console.error(`Error saving config for user ${userId}:`, error);
      return false;
    }
  }

  // Check if user exists
  async userExists(userId: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Initialize the database if not already done
      await this.initDatabase();

      const result = await this.db
        .prepare('SELECT 1 FROM user_configs WHERE user_id = ?')
        .bind(userId)
        .first();

      return !!result;
    } catch (error) {
      console.error(`Error checking if user ${userId} exists:`, error);
      return false;
    }
  }

  // Get all users
  async getAllUsers(): Promise<string[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Initialize the database if not already done
      await this.initDatabase();

      const result = await this.db
        .prepare('SELECT user_id FROM user_configs ORDER BY created_at DESC')
        .all();

      if (result && result.results) {
        const users = result.results.map((row: any) => row.user_id);
        console.log(`Retrieved ${users.length} users`);
        return users;
      }

      return [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const configManager = new CloudflareConfigManager();
