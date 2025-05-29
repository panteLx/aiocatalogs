import { logger } from './logger';

interface DiscordLoggerConfig {
  webhookUrl: string;
  channelId?: string;
  botName?: string;
  botAvatar?: string;
}

class DiscordLogger {
  private config: DiscordLoggerConfig;
  private isEnabled: boolean = false;

  constructor(config: DiscordLoggerConfig) {
    this.config = config;
    this.isEnabled = !!config.webhookUrl;
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

    let formattedMessage = `\n\`\`\`\n${message}\n\`\`\``;

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
  discordLoggerInstance = new DiscordLogger(config);
  logger.debug('Discord logger initialized');

  // Send test message
  if (discordLoggerInstance) {
    try {
      await discordLoggerInstance.logError('🔔 Test Message: Discord Logger Connection Successful');
      logger.debug('Discord logger test message sent successfully');
    } catch (error) {
      console.error('Failed to send Discord logger test message:', error);
    }
  }
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
export async function logErrorToDiscord(message: string, error?: any): Promise<void> {
  if (discordLoggerInstance) {
    await discordLoggerInstance.logError(message, error);
  }
}
