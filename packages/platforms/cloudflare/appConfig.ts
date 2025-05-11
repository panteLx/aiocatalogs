import { getEnvAsNumber, getEnvAsBoolean } from '../../core/utils/env';

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
};
