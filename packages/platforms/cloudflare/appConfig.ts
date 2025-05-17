import { getEnvAsNumber, getEnvAsBoolean, getEnv } from '../../core/utils/env';

/**
 * Helper to parse a comma-separated list from an environment variable
 * @param value The environment variable value
 * @returns Array of trimmed non-empty strings
 */
function parseCommaSeparatedList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

/**
 * Application configuration from environment variables
 */
export const appConfig = {
  /**
   * Application configuration
   */
  app: {
    /**
     * List of trusted origins for redirects (comma-separated URLs)
     * Example: 'https://app1.example.com,https://app2.example.com'
     * @default []
     */
    trustedOrigins: parseCommaSeparatedList(getEnv('AIOCATALOGS_TRUSTED_ORIGINS')),
  },
  /**
   * API configuration
   */
  api: {
    /**
     * Enable rate limiting
     * @default true
     */
    rateLimit: getEnvAsBoolean('AIOCATALOGS_API_RATE_LIMIT', true),

    /**
     * Maximum number of requests per minute
     * @default 60
     */
    maxRequestsPerMinute: getEnvAsNumber('AIOCATALOGS_API_MAX_REQUESTS', 60),

    /**
     * Maximum number of fetched items for MDBList API
     * @default 100
     */
    maxItemsMDBList: getEnvAsNumber('AIOCATALOGS_API_MAX_ITEMS_MDBLIST', 100),

    /**
     * Cache expiration time in days for RPDB API
     * @default 7
     */
    cacheExpirationRPDB: getEnvAsNumber('AIOCATALOGS_API_CACHE_EXPIRATION_RPDB', 7),

    /**
     * Cache expiration time in minutes for MDBList API
     * @default 60
     */
    cacheExpirationMDBList: getEnvAsNumber('AIOCATALOGS_API_CACHE_EXPIRATION_MDBLIST', 60),
  },

  /**
   * Logger configuration
   */
  logger: {
    /**
     * Log level
     * @default 'info'
     */
    logLevel: getEnv('LOG_LEVEL', 'info'),

    /**
     * Enable timestamps
     * @default true
     */
    enableTimestamps: getEnvAsBoolean('LOG_ENABLE_TIMESTAMPS', true),

    /**
     * Timestamp format
     * Available placeholders: HH (hour), mm (minute), ss (second),
     * YYYY/yyyy (year), MM (month), DD/dd (day), SSS/sss (milliseconds)
     * @default 'yyyy-MM-dd HH:mm:ss'
     */
    timestampFormat: getEnv('LOG_TIMESTAMP_FORMAT', 'yyyy-MM-dd HH:mm:ss'),

    /**
     * Timezone for timestamps
     * Examples: 'UTC', 'Europe/Berlin', 'America/New_York'
     * @default 'UTC'
     */
    timezone: getEnv('LOG_TIMEZONE', 'UTC'),
  },
};
