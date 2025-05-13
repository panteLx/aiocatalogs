import { describe, it, expect } from 'vitest';
import * as apiExports from '../index';

describe('API Package Exports', () => {
  it('should export configPage functions', () => {
    // Verify that the API package exports the configPage functions
    expect(apiExports).toHaveProperty('getConfigPage');
    expect(apiExports).toHaveProperty('addCatalog');
    expect(apiExports).toHaveProperty('removeCatalog');
    expect(apiExports).toHaveProperty('moveCatalogUp');
    expect(apiExports).toHaveProperty('moveCatalogDown');
    expect(apiExports).toHaveProperty('toggleCatalogRandomize');
    expect(apiExports).toHaveProperty('renameCatalog');
  });
});
