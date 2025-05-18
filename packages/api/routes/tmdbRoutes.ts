import { configManager } from '../../platforms/cloudflare/configManager';
import { logger } from '../../core/utils/logger';

// Helper function to load TMDB API key for a user
export async function loadUserTMDBApiKey(userId: string): Promise<string | null> {
  try {
    return await configManager.loadTMDBApiKey(userId);
  } catch (error) {
    logger.error('Error loading TMDB API key:', error);
    return null;
  }
}

// Helper function to validate TMDB API key
async function validateTMDBApiKey(apiKey: string): Promise<boolean> {
  try {
    const url = 'https://api.themoviedb.org/3/authentication';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    };

    const response = await fetch(url, options);
    return response.ok;
  } catch (error) {
    logger.error('Error validating TMDB API key:', error);
    return false;
  }
}

// Save TMDB API configuration
export const saveTMDBConfig = async (c: any) => {
  const userId = c.req.param('userId');
  const formData = await c.req.formData();
  const apiKey = formData.get('apiKey') as string;

  // Check if user exists
  const exists = await configManager.userExists(userId);
  if (!exists) {
    return c.redirect('/configure?error=User not found');
  }

  try {
    // Check if the API key is valid before saving it
    if (!apiKey || apiKey.trim() === '') {
      return c.redirect(`/configure/${userId}?error=TMDB API key cannot be empty`);
    }

    // Validate the API key by making a test call to the TMDB API
    try {
      const isValid = await validateTMDBApiKey(apiKey);
      if (!isValid) {
        logger.warn(`TMDB API key validation failed for user ${userId}`);
        return c.redirect(
          `/configure/${userId}?error=Invalid TMDB API key - please check and try again`
        );
      }
      logger.info(`Successfully validated TMDB API key for user ${userId}`);
    } catch (validationError) {
      logger.error(`TMDB API key validation failed for user ${userId}:`, validationError);
      return c.redirect(
        `/configure/${userId}?error=Invalid TMDB API key - please check and try again`
      );
    }

    // Save the API key to the database
    const success = await configManager.saveTMDBApiKey(userId, apiKey);

    if (!success) {
      logger.warn(`Database save failed for TMDB API key for user ${userId}`);
      return c.redirect(
        `/configure/${userId}?error=Could not save TMDB API key permanently. Please try again.`
      );
    }

    return c.redirect(`/configure/${userId}?message=TMDB configuration saved successfully`);
  } catch (error) {
    logger.error('Error saving TMDB configuration:', error);
    return c.redirect(`/configure/${userId}?error=Failed to save TMDB configuration`);
  }
};
