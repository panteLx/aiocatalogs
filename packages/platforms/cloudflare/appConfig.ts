import { getEnvAsNumber, getEnvAsBoolean, getEnv } from '../../core/utils/env';

/**
 * Application configuration from environment variables
 */
export const appConfig = {
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
