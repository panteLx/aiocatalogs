/**
 * Environment variable utilities for AIOCatalogs
 */

/**
 * Get an environment variable with optional default value
 *
 * @param key - The environment variable name
 * @param defaultValue - Optional default value if the environment variable is not set
 * @returns The environment variable value or the default value
 */
export function getEnv(key: string, defaultValue?: string): string | undefined {
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key];
  }
  return defaultValue;
}

/**
 * Check if an environment variable exists
 *
 * @param key - The environment variable name
 * @returns True if the environment variable exists
 */
export function hasEnv(key: string): boolean {
  return typeof process !== 'undefined' && process.env && process.env[key] !== undefined;
}

/**
 * Get an environment variable as a number
 *
 * @param key - The environment variable name
 * @param defaultValue - Optional default value if the environment variable is not set or invalid
 * @returns The environment variable as a number or the default value
 */
export function getEnvAsNumber(key: string, defaultValue?: number): number | undefined {
  const value = getEnv(key);
  if (value === undefined) {
    return defaultValue;
  }

  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Get an environment variable as a boolean
 *
 * @param key - The environment variable name
 * @param defaultValue - Optional default value if the environment variable is not set
 * @returns The environment variable as a boolean or the default value
 */
export function getEnvAsBoolean(key: string, defaultValue?: boolean): boolean | undefined {
  const value = getEnv(key);
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
}

/**
 * Create environment variable object with required variables
 *
 * @param requiredVars - Array of required environment variable names
 * @returns Object with information about missing required variables
 */
export function checkRequiredEnv(requiredVars: string[]): {
  missing: string[];
  isValid: boolean;
} {
  const missing = requiredVars.filter(key => !hasEnv(key));
  return {
    missing,
    isValid: missing.length === 0,
  };
}
