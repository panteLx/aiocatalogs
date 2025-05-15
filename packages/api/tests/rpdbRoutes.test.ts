import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadUserRPDBApiKey, saveRPDBConfig } from '../routes/rpdbRoutes';
import { configManager } from '../../platforms/cloudflare/configManager';

// Mock the configManager
vi.mock('../../platforms/cloudflare/configManager', () => ({
  configManager: {
    loadRPDBApiKey: vi.fn(),
    saveRPDBApiKey: vi.fn(),
    userExists: vi.fn(),
    clearApiKeyCache: vi.fn(),
  },
}));

// Mock the logger
vi.mock('../../core/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock fetch for validating API key
global.fetch = vi.fn();

describe('RPDB API Routes', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadUserRPDBApiKey', () => {
    it('should return API key when successfully loaded', async () => {
      const mockApiKey = 'test-api-key-123';
      vi.mocked(configManager.loadRPDBApiKey).mockResolvedValue(mockApiKey);

      const result = await loadUserRPDBApiKey('user123');
      expect(result).toBe(mockApiKey);
      expect(configManager.loadRPDBApiKey).toHaveBeenCalledWith('user123');
    });

    it('should return null when error occurs', async () => {
      vi.mocked(configManager.loadRPDBApiKey).mockRejectedValue(new Error('Database error'));

      const result = await loadUserRPDBApiKey('user123');
      expect(result).toBeNull();
      expect(configManager.loadRPDBApiKey).toHaveBeenCalledWith('user123');
    });
  });

  describe('saveRPDBConfig', () => {
    // Mock context object for Hono
    const mockContext = (userId: string, apiKey: string, formData = new FormData()) => {
      formData.append('apiKey', apiKey);

      return {
        req: {
          param: vi.fn().mockReturnValue(userId),
          formData: vi.fn().mockResolvedValue(formData),
        },
        redirect: vi.fn().mockImplementation(url => ({ redirectUrl: url })),
      };
    };

    it('should redirect with error when user does not exist', async () => {
      const ctx = mockContext('nonexistent-user', 'api-key');
      vi.mocked(configManager.userExists).mockResolvedValue(false);

      const result = await saveRPDBConfig(ctx);
      expect(result).toEqual({ redirectUrl: '/configure?error=User not found' });
      expect(configManager.userExists).toHaveBeenCalledWith('nonexistent-user');
    });

    it('should redirect with error when API key is empty', async () => {
      const userId = 'user123';
      const ctx = mockContext(userId, '');
      vi.mocked(configManager.userExists).mockResolvedValue(true);

      const result = await saveRPDBConfig(ctx);
      expect(result).toEqual({
        redirectUrl: `/configure/${userId}?error=RPDB API key cannot be empty`,
      });
    });

    it('should validate API key and save when valid', async () => {
      const userId = 'user123';
      const apiKey = 'valid-api-key';
      const ctx = mockContext(userId, apiKey);

      vi.mocked(configManager.userExists).mockResolvedValue(true);

      // Create a spy for the internal validateRPDBApiKey call
      const validateSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      vi.mocked(configManager.saveRPDBApiKey).mockResolvedValue(true);

      const result = await saveRPDBConfig(ctx);

      // Verify that fetch was called with the expected URL
      expect(validateSpy).toHaveBeenCalledWith(
        expect.stringContaining(`https://api.ratingposterdb.com/${apiKey}/isValid`)
      );
      expect(configManager.saveRPDBApiKey).toHaveBeenCalledWith(userId, apiKey);
      expect(configManager.clearApiKeyCache).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        redirectUrl: `/configure/${userId}?message=RPDB API configuration saved successfully`,
      });
    });

    it('should redirect with error when API key validation fails', async () => {
      const userId = 'user123';
      const apiKey = 'invalid-api-key';
      const ctx = mockContext(userId, apiKey);

      vi.mocked(configManager.userExists).mockResolvedValue(true);

      // Mock fetch to simulate API key validation failure
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const result = await saveRPDBConfig(ctx);

      expect(result).toEqual({
        redirectUrl: `/configure/${userId}?error=Invalid RPDB API key - please check and try again`,
      });
    });

    it('should redirect with error when database save fails', async () => {
      const userId = 'user123';
      const apiKey = 'valid-api-key';
      const ctx = mockContext(userId, apiKey);

      vi.mocked(configManager.userExists).mockResolvedValue(true);

      // Mock successful validation
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      // But database save fails
      vi.mocked(configManager.saveRPDBApiKey).mockResolvedValue(false);

      const result = await saveRPDBConfig(ctx);

      expect(result).toEqual({
        redirectUrl: `/configure/${userId}?error=Could not save RPDB API key permanently. Please try again.`,
      });
    });

    it('should redirect with error when exception occurs', async () => {
      const userId = 'user123';
      const apiKey = 'valid-api-key';
      const ctx = mockContext(userId, apiKey);

      vi.mocked(configManager.userExists).mockResolvedValue(true);

      // Mock successful validation
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      // But database operation throws error
      vi.mocked(configManager.saveRPDBApiKey).mockRejectedValue(new Error('Database error'));

      const result = await saveRPDBConfig(ctx);

      expect(result).toEqual({
        redirectUrl: `/configure/${userId}?error=Failed to save RPDB API key. Please try again.`,
      });
    });
  });
});
