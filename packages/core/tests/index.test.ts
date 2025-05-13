import { describe, it, expect } from 'vitest';
import * as coreExports from '../index';

describe('Core Package Exports', () => {
  it('should export BaseConfigManager', () => {
    expect(coreExports.BaseConfigManager).toBeDefined();
  });

  it('should export BaseCatalogAggregator', () => {
    expect(coreExports.BaseCatalogAggregator).toBeDefined();
  });

  it('should export manifestBuilder utilities', () => {
    expect(coreExports.buildManifest).toBeDefined();
    expect(coreExports.ADDON_ID).toBeDefined();
  });
});
