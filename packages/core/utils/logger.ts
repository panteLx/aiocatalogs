/**
 * Consolidated logger utility with configuration and initialization
 */

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

// Default configuration for the logger
interface LoggerConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  // Timestamp format options
  timestampFormat?: string;
  timezone?: string;
}

// Default configurations for different environments
const DEV_CONFIG: LoggerConfig = {
  level: LogLevel.DEBUG,
  enableTimestamp: true,
  timestampFormat: 'HH:mm:ss',
  timezone: 'UTC',
};

const PROD_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  enableTimestamp: true,
  timestampFormat: 'HH:mm:ss',
  timezone: 'UTC',
};

const TEST_CONFIG: LoggerConfig = {
  level: LogLevel.WARN,
  enableTimestamp: false,
  timestampFormat: 'HH:mm:ss',
  timezone: 'UTC',
};

/**
 * Format a date according to the specified format and timezone
 */
function formatDate(date: Date, format: string = 'HH:mm:ss', timezone: string = 'UTC'): string {
  // Adjust date for timezone
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));

  // Apply timezone offset difference
  const timezoneOffsetDiff = date.getTimezoneOffset() - localDate.getTimezoneOffset();
  localDate.setMinutes(localDate.getMinutes() + timezoneOffsetDiff);

  // Get date components
  const year = String(localDate.getFullYear());
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  const seconds = String(localDate.getSeconds()).padStart(2, '0');
  const milliseconds = String(localDate.getMilliseconds()).padStart(3, '0');

  // Replace format patterns with actual values
  let result = format;

  // Replace year
  result = result.replace(/yyyy/g, year);
  result = result.replace(/YYYY/g, year);

  // Replace month
  result = result.replace(/MM/g, month);

  // Replace day
  result = result.replace(/dd/g, day);
  result = result.replace(/DD/g, day);

  // Replace hours
  result = result.replace(/HH/g, hours);
  result = result.replace(/hh/g, hours);

  // Replace minutes
  result = result.replace(/mm/g, minutes);

  // Replace seconds
  result = result.replace(/ss/g, seconds);

  // Replace milliseconds
  result = result.replace(/SSS/g, milliseconds);
  result = result.replace(/sss/g, milliseconds);

  return result;
}

/**
 * Parse string log level to enum value
 */
function parseLogLevel(levelStr: string): LogLevel {
  const normalizedLevel = levelStr.toUpperCase();

  if (LogLevel[normalizedLevel as keyof typeof LogLevel] !== undefined) {
    return LogLevel[normalizedLevel as keyof typeof LogLevel];
  }

  return LogLevel.INFO; // Default to INFO if parsing fails
}

/**
 * Get configuration based on environment
 */
function getLogConfig(): LoggerConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';
  const envLogLevel = process.env.LOG_LEVEL;

  let config: LoggerConfig;

  if (isTest) {
    config = { ...TEST_CONFIG };
  } else if (isProduction) {
    config = { ...PROD_CONFIG };
  } else {
    config = { ...DEV_CONFIG };
  }

  // Override with environment variable if present
  if (envLogLevel) {
    config.level = parseLogLevel(envLogLevel);
  }

  return config;
}

/**
 * Logger class that supports different log levels
 */
export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...getLogConfig(), ...config };
  }

  /**
   * Set the current log level
   */
  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get the current log level
   */
  public getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Enable or disable timestamp in logs
   */
  public enableTimestamp(enable: boolean): void {
    this.config.enableTimestamp = enable;
  }

  /**
   * Get current timestamp setting
   */
  public getTimestampEnabled(): boolean {
    return !!this.config?.enableTimestamp;
  }

  /**
   * Set the timestamp format
   */
  public setTimestampFormat(format: string): void {
    this.config.timestampFormat = format;
  }

  /**
   * Get current timestamp format
   */
  public getTimestampFormat(): string {
    return this.config.timestampFormat || 'HH:mm:ss';
  }

  /**
   * Set the timezone
   */
  public setTimezone(timezone: string): void {
    this.config.timezone = timezone;
  }

  /**
   * Get current timezone
   */
  public getTimezone(): string {
    return this.config.timezone || 'UTC';
  }

  /**
   * Format a log message with timestamp and log level
   */
  private formatMessage(message: string, logLevel: LogLevel): string {
    const parts: string[] = [];

    if (this.config.enableTimestamp) {
      const formattedDate = formatDate(
        new Date(),
        this.config.timestampFormat,
        this.config.timezone
      );
      parts.push(`[${formattedDate}]`);
    }

    // Add log level instead of prefix
    parts.push(`[${LogLevel[logLevel]}]`);

    parts.push(message);
    return parts.join(' ');
  }

  /**
   * Format arguments into a string
   */
  private formatArgs(args: any[]): string {
    return args
      .map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return require('util').inspect(arg, { depth: 2, colors: false });
          }
        }
        return String(arg);
      })
      .join(' ');
  }

  /**
   * Log a debug message
   */
  public debug(...args: any[]): void {
    if (this.config.level <= LogLevel.DEBUG) {
      console.debug(this.formatMessage(this.formatArgs(args), LogLevel.DEBUG));
    }
  }

  /**
   * Log an info message
   */
  public info(...args: any[]): void {
    if (this.config.level <= LogLevel.INFO) {
      console.log(this.formatMessage(this.formatArgs(args), LogLevel.INFO));
    }
  }

  /**
   * Log a warning message
   */
  public warn(...args: any[]): void {
    if (this.config.level <= LogLevel.WARN) {
      console.warn(this.formatMessage(this.formatArgs(args), LogLevel.WARN));
    }
  }

  /**
   * Log an error message
   */
  public error(...args: any[]): void {
    if (this.config.level <= LogLevel.ERROR) {
      console.error(this.formatMessage(this.formatArgs(args), LogLevel.ERROR));
    }
  }
}

// Create default logger instance
export const logger = new Logger();

// Create a custom logger with specified config
export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  return new Logger(config);
}

/**
 * Initialize the logger with application config
 */
export function initLogger(appConfig?: any): void {
  // Apply LOG_LEVEL from appConfig if provided
  if (appConfig && appConfig.logger && appConfig.logger.logLevel) {
    const configLogLevel = appConfig.logger.logLevel.toUpperCase();
    if (LogLevel[configLogLevel as keyof typeof LogLevel] !== undefined) {
      logger.setLevel(LogLevel[configLogLevel as keyof typeof LogLevel]);
    }
  }

  // Apply enableTimestamps from appConfig if provided
  if (appConfig && appConfig.logger && appConfig.logger.enableTimestamps !== undefined) {
    logger.enableTimestamp(appConfig.logger.enableTimestamps);
  }

  // Apply timestamp format from appConfig if provided
  if (appConfig && appConfig.logger && appConfig.logger.timestampFormat) {
    logger.setTimestampFormat(appConfig.logger.timestampFormat);
  }

  // Apply timezone from appConfig if provided
  if (appConfig && appConfig.logger && appConfig.logger.timezone) {
    logger.setTimezone(appConfig.logger.timezone);
  }

  // Log initialization with configuration details
  const timestampStatus = logger.getTimestampEnabled() ? 'Enabled' : 'Disabled';
  logger.info(
    `Logger initialized:
    • Level: ${LogLevel[logger.getLevel()]}
    • Timestamps: ${timestampStatus}
    • Format: ${logger.getTimestampFormat()}
    • Timezone: ${logger.getTimezone()}`
  );
  logger.debug(
    `AIOCatalogs Settings:
    • MDBList Max Items: ${appConfig.api.maxItemsMDBList}
    • API Max Requests: ${appConfig.api.maxRequestsPerMinute}/min
    • Rate Limit: ${appConfig.api.rateLimit ? 'Enabled' : 'Disabled'}
    • Trusted Origins: ${appConfig.app.trustedOrigins.join(', ')}
    • Cache Expiration:
      - RPDB: ${appConfig.api.cacheExpirationRPDB} days
      - MDBList: ${appConfig.api.cacheExpirationMDBList} minutes`
  );
}
