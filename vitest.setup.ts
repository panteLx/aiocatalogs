import { vi, afterEach } from 'vitest';

// Setup global mocks for tests

// Mock console methods to avoid cluttering test output
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'debug').mockImplementation(() => {});

// Common globals needed for tests
global.fetch = vi.fn();

// Cleanup between tests
afterEach(() => {
  vi.clearAllMocks();
});
