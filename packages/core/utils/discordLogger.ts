import { logger } from './logger';

interface DiscordLoggerConfig {
  webhookUrl: string;
  channelId?: string;
  botName?: string;
  botAvatar?: string;
  timestampFormat?: string;
  timezone?: string;
}

class DiscordLogger {
  private config: DiscordLoggerConfig;
  private isEnabled: boolean = false;
  private userId?: string;

  constructor(config: DiscordLoggerConfig) {
    this.config = {
      ...config,
      timestampFormat: config.timestampFormat || 'yyyy-MM-dd HH:mm:ss',
      timezone: config.timezone || 'UTC',
    };
    this.isEnabled = !!config.webhookUrl;
  }

  /**
   * Set the user ID for the current context
   */
  public setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Format timestamp according to the specified format and timezone
   */
  private formatTimestamp(): string {
    const now = new Date();
    const localDate = new Date(now.toLocaleString('en-US', { timeZone: this.config.timezone }));

    // Apply timezone offset difference
    const timezoneOffsetDiff = now.getTimezoneOffset() - localDate.getTimezoneOffset();
    localDate.setMinutes(localDate.getMinutes() + timezoneOffsetDiff);

    let format = this.config.timestampFormat as string;
    const year = String(localDate.getFullYear());
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const hours = String(localDate.getHours()).padStart(2, '0');
    const minutes = String(localDate.getMinutes()).padStart(2, '0');
    const seconds = String(localDate.getSeconds()).padStart(2, '0');

    let result = format;
    result = result.replace(/yyyy|YYYY/g, year);
    result = result.replace(/MM/g, month);
    result = result.replace(/dd|DD/g, day);
    result = result.replace(/HH|hh/g, hours);
    result = result.replace(/mm/g, minutes);
    result = result.replace(/ss/g, seconds);

    return result;
  }

  /**
   * Send a message to Discord via webhook
   */
  private async sendToDiscord(message: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const payload = {
        content: message,
        username: this.config.botName,
        avatar_url: this.config.botAvatar,
        channel_id: this.config.channelId,
      };

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Discord webhook failed with status ${response.status}`);
      }
    } catch (error) {
      // Use console.error here to avoid infinite loop with logger.error
      console.error('Failed to send message to Discord:', error);
    }
  }

  /**
   * Log an error message to Discord
   */
  public async logError(message: string, error?: any): Promise<void> {
    if (!this.isEnabled) return;

    const timestamp = this.formatTimestamp();
    const userIdStr = this.userId ? `[${this.userId}] ` : '';

    let formattedMessage = `[${timestamp}] ${userIdStr}\n\`\`\`\n${message}\n\`\`\``;

    if (error) {
      const errorDetails =
        error instanceof Error
          ? `${error.name}: ${error.message}\n${error.stack}`
          : JSON.stringify(error, null, 2);
      formattedMessage += `\n\`\`\`\n${errorDetails}\n\`\`\``;
    }

    await this.sendToDiscord(formattedMessage);
  }
}

// Create a singleton instance
let discordLoggerInstance: DiscordLogger | null = null;

/**
 * Initialize the Discord logger with configuration
 */
export async function initDiscordLogger(config: DiscordLoggerConfig): Promise<void> {
  // Pass timestamp settings from main logger
  const extendedConfig: DiscordLoggerConfig = {
    ...config,
    timestampFormat: logger.getTimestampFormat(),
    timezone: logger.getTimezone(),
  };
  discordLoggerInstance = new DiscordLogger(extendedConfig);
  logger.debug('Discord logger initialized');

  // Send test message
  // if (discordLoggerInstance) {
  //   try {
  //     await discordLoggerInstance.logError('🔔 Test Message: Discord Logger Connection Successful');
  //     logger.debug('Discord logger test message sent successfully');
  //   } catch (error) {
  //     console.error('Failed to send Discord logger test message:', error);
  //   }
  // }
}

/**
 * Get the Discord logger instance
 */
export function getDiscordLogger(): DiscordLogger {
  if (!discordLoggerInstance) {
    throw new Error('Discord logger not initialized. Call initDiscordLogger first.');
  }
  return discordLoggerInstance;
}

/**
 * Log an error to Discord
 */
export async function logErrorToDiscord(
  message: string,
  error?: any,
  userId?: string
): Promise<void> {
  if (discordLoggerInstance) {
    if (userId) {
      discordLoggerInstance.setUserId(userId);
    }
    await discordLoggerInstance.logError(message, error);
  }
}
