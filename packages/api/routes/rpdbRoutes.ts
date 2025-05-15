import { configManager } from '../../platforms/cloudflare/configManager';
import { logger } from '../../core/utils/logger';

// Helper function to load RPDB API key for a user
export async function loadUserRPDBApiKey(userId: string): Promise<string | null> {
  try {
    return await configManager.loadRPDBApiKey(userId);
  } catch (error) {
    logger.error('Error loading RPDB API key:', error);
    return null;
  }
}

// Helper function to validate an RPDB API key
async function validateRPDBApiKey(apiKey: string): Promise<boolean> {
  try {
    // Validation to the RPDB API
    const testUrl = `https://api.ratingposterdb.com/${apiKey}/isValid`;

    const response = await fetch(testUrl);
    if (response.ok && response.status === 200) {
      return true;
    }

    logger.warn(`RPDB API key validation failed: ${response.status} ${response.statusText}`);
    return false;
  } catch (error) {
    logger.error('Error validating RPDB API key:', error);
    return false;
  }
}

// Save RPDB API configuration
export const saveRPDBConfig = async (c: any) => {
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
      return c.redirect(`/configure/${userId}?error=RPDB API key cannot be empty`);
    }

    // Validate the API key by making a test call to the RPDB API
    try {
      const isValid = await validateRPDBApiKey(apiKey);
      if (!isValid) {
        logger.warn(`RPDB API key validation failed for user ${userId}`);
        return c.redirect(
          `/configure/${userId}?error=Invalid RPDB API key - please check and try again`
        );
      }
      logger.info(`Successfully validated RPDB API key for user ${userId}`);
    } catch (validationError) {
      logger.error(`RPDB API key validation failed for user ${userId}:`, validationError);
      return c.redirect(
        `/configure/${userId}?error=Invalid RPDB API key - please check and try again`
      );
    }

    // Save the API key to the database
    const success = await configManager.saveRPDBApiKey(userId, apiKey);

    if (!success) {
      logger.warn(`Database save failed for RPDB API key for user ${userId}`);
      // Inform the user that there was a problem
      return c.redirect(
        `/configure/${userId}?error=Could not save RPDB API key permanently. Please try again.`
      );
    }

    // Clear the API key cache to ensure the new key is used immediately
    configManager.clearApiKeyCache(userId);

    return c.redirect(`/configure/${userId}?message=RPDB API configuration saved successfully`);
  } catch (error) {
    logger.error(`Error saving RPDB API key for user ${userId}:`, error);
    return c.redirect(`/configure/${userId}?error=Failed to save RPDB API key. Please try again.`);
  }
};
