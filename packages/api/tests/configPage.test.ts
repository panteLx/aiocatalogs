import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  convertStremioUrl,
  handleAddCatalog,
  handleRemoveCatalog,
  handleMoveCatalogUp,
  handleMoveCatalogDown,
  handleToggleRandomize,
  handleRenameCatalog,
} from '../routes/configPage';

describe('Config Page Helper Functions', () => {
  describe('convertStremioUrl', () => {
    it('converts stremio:// URLs to https://', () => {
      const stremioUrl = 'stremio://addon.example.com/manifest.json';
      const result = convertStremioUrl(stremioUrl);
      expect(result).toBe('https://addon.example.com/manifest.json');
    });

    it('does not modify non-stremio URLs', () => {
      const normalUrl = 'https://addon.example.com/manifest.json';
      const result = convertStremioUrl(normalUrl);
      expect(result).toBe(normalUrl);
    });
  });

  describe('handleAddCatalog', () => {
    const userId = 'test-user';
    const validUrl = 'https://addon.example.com/manifest.json';
    const mockManifest = { name: 'Test Addon', id: 'test.addon' };

    let mockFetchCatalogManifest: any;
    let mockAddCatalog: any;
    let mockClearCache: any;

    beforeEach(() => {
      mockFetchCatalogManifest = vi.fn().mockResolvedValue(mockManifest);
      mockAddCatalog = vi.fn().mockResolvedValue(true);
      mockClearCache = vi.fn();
    });

    it('returns error when no URL is provided', async () => {
      const result = await handleAddCatalog(
        userId,
        '',
        mockFetchCatalogManifest,
        mockAddCatalog,
        mockClearCache
      );

      expect(result).toEqual({ success: false, error: 'No catalog URL provided' });
      expect(mockFetchCatalogManifest).not.toHaveBeenCalled();
    });

    it('successfully adds a catalog', async () => {
      const result = await handleAddCatalog(
        userId,
        validUrl,
        mockFetchCatalogManifest,
        mockAddCatalog,
        mockClearCache
      );

      expect(mockFetchCatalogManifest).toHaveBeenCalledWith(validUrl);
      expect(mockAddCatalog).toHaveBeenCalledWith(userId, mockManifest);
      expect(mockClearCache).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        success: true,
        message: `Successfully added catalog: ${mockManifest.name}`,
      });
    });

    it('handles errors when fetching manifest fails', async () => {
      mockFetchCatalogManifest = vi.fn().mockResolvedValue(null);

      const result = await handleAddCatalog(
        userId,
        validUrl,
        mockFetchCatalogManifest,
        mockAddCatalog,
        mockClearCache
      );

      expect(result).toEqual({ success: false, error: 'Failed to fetch catalog manifest' });
    });

    it('handles errors when adding catalog fails', async () => {
      mockAddCatalog = vi.fn().mockResolvedValue(false);

      const result = await handleAddCatalog(
        userId,
        validUrl,
        mockFetchCatalogManifest,
        mockAddCatalog,
        mockClearCache
      );

      expect(result).toEqual({ success: false, error: 'Failed to add catalog' });
    });

    it('handles exceptions during add catalog process', async () => {
      mockFetchCatalogManifest = vi.fn().mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await handleAddCatalog(
        userId,
        validUrl,
        mockFetchCatalogManifest,
        mockAddCatalog,
        mockClearCache
      );

      expect(result).toEqual({
        success: false,
        error: 'Failed to add catalog: Error: Network error',
      });
    });
  });

  describe('handleRemoveCatalog', () => {
    const userId = 'test-user';
    const catalogId = 'test.catalog';
    let mockRemoveCatalog: any;
    let mockClearCache: any;

    beforeEach(() => {
      mockRemoveCatalog = vi.fn().mockResolvedValue(true);
      mockClearCache = vi.fn();
    });

    it('returns error when no catalog ID is provided', async () => {
      const result = await handleRemoveCatalog(userId, '', mockRemoveCatalog, mockClearCache);

      expect(result).toEqual({ success: false, error: 'No catalog ID provided' });
      expect(mockRemoveCatalog).not.toHaveBeenCalled();
    });

    it('successfully removes a catalog', async () => {
      const result = await handleRemoveCatalog(
        userId,
        catalogId,
        mockRemoveCatalog,
        mockClearCache
      );

      expect(mockRemoveCatalog).toHaveBeenCalledWith(userId, catalogId);
      expect(mockClearCache).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ success: true, message: 'Successfully removed catalog' });
    });

    it('handles errors when removing catalog fails', async () => {
      mockRemoveCatalog = vi.fn().mockResolvedValue(false);

      const result = await handleRemoveCatalog(
        userId,
        catalogId,
        mockRemoveCatalog,
        mockClearCache
      );

      expect(result).toEqual({ success: false, error: 'Failed to remove catalog' });
    });

    it('handles exceptions during remove catalog process', async () => {
      mockRemoveCatalog = vi.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await handleRemoveCatalog(
        userId,
        catalogId,
        mockRemoveCatalog,
        mockClearCache
      );

      expect(result).toEqual({
        success: false,
        error: 'Failed to remove catalog: Error: Database error',
      });
    });
  });

  describe('handleMoveCatalogUp', () => {
    const userId = 'test-user';
    const catalogId = 'test.catalog';
    let mockMoveCatalogUp: any;
    let mockClearCache: any;

    beforeEach(() => {
      mockMoveCatalogUp = vi.fn().mockResolvedValue(true);
      mockClearCache = vi.fn();
    });

    it('returns error when no catalog ID is provided', async () => {
      const result = await handleMoveCatalogUp(userId, '', mockMoveCatalogUp, mockClearCache);

      expect(result).toEqual({ success: false, error: 'No catalog ID provided' });
      expect(mockMoveCatalogUp).not.toHaveBeenCalled();
    });

    it('successfully moves a catalog up', async () => {
      const result = await handleMoveCatalogUp(
        userId,
        catalogId,
        mockMoveCatalogUp,
        mockClearCache
      );

      expect(mockMoveCatalogUp).toHaveBeenCalledWith(userId, catalogId);
      expect(mockClearCache).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ success: true, message: 'Successfully moved catalog up' });
    });

    it('handles errors when moving catalog up fails', async () => {
      mockMoveCatalogUp = vi.fn().mockResolvedValue(false);

      const result = await handleMoveCatalogUp(
        userId,
        catalogId,
        mockMoveCatalogUp,
        mockClearCache
      );

      expect(result).toEqual({ success: false, error: 'Failed to move catalog up' });
    });

    it('handles exceptions during move catalog up process', async () => {
      mockMoveCatalogUp = vi.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await handleMoveCatalogUp(
        userId,
        catalogId,
        mockMoveCatalogUp,
        mockClearCache
      );

      expect(result).toEqual({
        success: false,
        error: 'Failed to move catalog up: Error: Database error',
      });
    });
  });

  describe('handleMoveCatalogDown', () => {
    const userId = 'test-user';
    const catalogId = 'test.catalog';
    let mockMoveCatalogDown: any;
    let mockClearCache: any;

    beforeEach(() => {
      mockMoveCatalogDown = vi.fn().mockResolvedValue(true);
      mockClearCache = vi.fn();
    });

    it('returns error when no catalog ID is provided', async () => {
      const result = await handleMoveCatalogDown(userId, '', mockMoveCatalogDown, mockClearCache);

      expect(result).toEqual({ success: false, error: 'No catalog ID provided' });
      expect(mockMoveCatalogDown).not.toHaveBeenCalled();
    });

    it('successfully moves a catalog down', async () => {
      const result = await handleMoveCatalogDown(
        userId,
        catalogId,
        mockMoveCatalogDown,
        mockClearCache
      );

      expect(mockMoveCatalogDown).toHaveBeenCalledWith(userId, catalogId);
      expect(mockClearCache).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ success: true, message: 'Successfully moved catalog down' });
    });

    it('handles errors when moving catalog down fails', async () => {
      mockMoveCatalogDown = vi.fn().mockResolvedValue(false);

      const result = await handleMoveCatalogDown(
        userId,
        catalogId,
        mockMoveCatalogDown,
        mockClearCache
      );

      expect(result).toEqual({ success: false, error: 'Failed to move catalog down' });
    });

    it('handles exceptions during move catalog down process', async () => {
      mockMoveCatalogDown = vi.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await handleMoveCatalogDown(
        userId,
        catalogId,
        mockMoveCatalogDown,
        mockClearCache
      );

      expect(result).toEqual({
        success: false,
        error: 'Failed to move catalog down: Error: Database error',
      });
    });
  });

  describe('handleToggleRandomize', () => {
    const userId = 'test-user';
    const catalogId = 'test.catalog';
    let mockToggleRandomize: any;
    let mockClearCache: any;

    beforeEach(() => {
      mockToggleRandomize = vi.fn().mockResolvedValue(true);
      mockClearCache = vi.fn();
    });

    it('returns error when no catalog ID is provided', async () => {
      const result = await handleToggleRandomize(userId, '', mockToggleRandomize, mockClearCache);

      expect(result).toEqual({
        success: false,
        error: 'No catalog ID provided - Failed to toggle randomization',
      });
      expect(mockToggleRandomize).not.toHaveBeenCalled();
    });

    it('successfully toggles randomization', async () => {
      const result = await handleToggleRandomize(
        userId,
        catalogId,
        mockToggleRandomize,
        mockClearCache
      );

      expect(mockToggleRandomize).toHaveBeenCalledWith(userId, catalogId);
      expect(mockClearCache).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ success: true, message: 'Successfully toggled randomization' });
    });

    it('handles errors when toggling randomization fails', async () => {
      mockToggleRandomize = vi.fn().mockResolvedValue(false);

      const result = await handleToggleRandomize(
        userId,
        catalogId,
        mockToggleRandomize,
        mockClearCache
      );

      expect(result).toEqual({ success: false, error: 'Failed to toggle randomization' });
    });

    it('handles exceptions during toggle randomize process', async () => {
      mockToggleRandomize = vi.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await handleToggleRandomize(
        userId,
        catalogId,
        mockToggleRandomize,
        mockClearCache
      );

      expect(result).toEqual({
        success: false,
        error: 'Failed to toggle randomization: Error: Database error',
      });
    });
  });

  describe('handleRenameCatalog', () => {
    const userId = 'test-user';
    const catalogId = 'test.catalog';
    const newName = 'New Catalog Name';
    let mockRenameCatalog: any;
    let mockClearCache: any;

    beforeEach(() => {
      mockRenameCatalog = vi.fn().mockResolvedValue(true);
      mockClearCache = vi.fn();
    });

    it('returns error when no catalog ID is provided', async () => {
      const result = await handleRenameCatalog(
        userId,
        '',
        newName,
        mockRenameCatalog,
        mockClearCache
      );

      expect(result).toEqual({ success: false, error: 'No catalog ID provided' });
      expect(mockRenameCatalog).not.toHaveBeenCalled();
    });

    it('successfully renames a catalog', async () => {
      const result = await handleRenameCatalog(
        userId,
        catalogId,
        newName,
        mockRenameCatalog,
        mockClearCache
      );

      expect(mockRenameCatalog).toHaveBeenCalledWith(userId, catalogId, newName);
      expect(mockClearCache).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ success: true, message: 'Successfully renamed catalog' });
    });

    it('handles errors when renaming catalog fails', async () => {
      mockRenameCatalog = vi.fn().mockResolvedValue(false);

      const result = await handleRenameCatalog(
        userId,
        catalogId,
        newName,
        mockRenameCatalog,
        mockClearCache
      );

      expect(result).toEqual({ success: false, error: 'Failed to rename catalog' });
    });

    it('handles exceptions during rename catalog process', async () => {
      mockRenameCatalog = vi.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await handleRenameCatalog(
        userId,
        catalogId,
        newName,
        mockRenameCatalog,
        mockClearCache
      );

      expect(result).toEqual({
        success: false,
        error: 'Failed to rename catalog: Error: Database error',
      });
    });
  });
});
