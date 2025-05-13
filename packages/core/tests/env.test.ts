import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getEnv, hasEnv, getEnvAsNumber, getEnvAsBoolean, checkRequiredEnv } from '../utils/env';

describe('Environment Utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv;
  });

  describe('getEnv', () => {
    it('should get an environment variable', () => {
      process.env.TEST_VAR = 'test-value';
      expect(getEnv('TEST_VAR')).toBe('test-value');
    });

    it('should return default value when environment variable is not set', () => {
      delete process.env.TEST_VAR;
      expect(getEnv('TEST_VAR', 'default-value')).toBe('default-value');
    });

    it('should return undefined when environment variable is not set and no default is provided', () => {
      delete process.env.TEST_VAR;
      expect(getEnv('TEST_VAR')).toBeUndefined();
    });
  });

  describe('hasEnv', () => {
    it('should return true when environment variable exists', () => {
      process.env.TEST_VAR = 'test-value';
      expect(hasEnv('TEST_VAR')).toBe(true);
    });

    it('should return false when environment variable does not exist', () => {
      delete process.env.TEST_VAR;
      expect(hasEnv('TEST_VAR')).toBe(false);
    });
  });

  describe('getEnvAsNumber', () => {
    it('should convert environment variable to number', () => {
      process.env.TEST_NUM = '123';
      expect(getEnvAsNumber('TEST_NUM')).toBe(123);
    });

    it('should return default value when environment variable is not a valid number', () => {
      process.env.TEST_NUM = 'not-a-number';
      expect(getEnvAsNumber('TEST_NUM', 456)).toBe(456);
    });

    it('should return default value when environment variable is not set', () => {
      delete process.env.TEST_NUM;
      expect(getEnvAsNumber('TEST_NUM', 789)).toBe(789);
    });

    it('should return undefined when environment variable is invalid and no default is provided', () => {
      process.env.TEST_NUM = 'not-a-number';
      expect(getEnvAsNumber('TEST_NUM')).toBeUndefined();
    });
  });

  describe('getEnvAsBoolean', () => {
    it('should convert "true" to true', () => {
      process.env.TEST_BOOL = 'true';
      expect(getEnvAsBoolean('TEST_BOOL')).toBe(true);
    });

    it('should convert "TRUE" to true (case insensitive)', () => {
      process.env.TEST_BOOL = 'TRUE';
      expect(getEnvAsBoolean('TEST_BOOL')).toBe(true);
    });

    it('should convert any other value to false', () => {
      process.env.TEST_BOOL = 'false';
      expect(getEnvAsBoolean('TEST_BOOL')).toBe(false);

      process.env.TEST_BOOL = 'something';
      expect(getEnvAsBoolean('TEST_BOOL')).toBe(false);
    });

    it('should return default value when environment variable is not set', () => {
      delete process.env.TEST_BOOL;
      expect(getEnvAsBoolean('TEST_BOOL', true)).toBe(true);
      expect(getEnvAsBoolean('TEST_BOOL', false)).toBe(false);
    });
  });

  describe('checkRequiredEnv', () => {
    it('should return valid when all required variables exist', () => {
      process.env.REQUIRED_VAR1 = 'value1';
      process.env.REQUIRED_VAR2 = 'value2';

      const result = checkRequiredEnv(['REQUIRED_VAR1', 'REQUIRED_VAR2']);

      expect(result.isValid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should return invalid with missing variables list', () => {
      process.env.REQUIRED_VAR1 = 'value1';
      delete process.env.REQUIRED_VAR2;

      const result = checkRequiredEnv(['REQUIRED_VAR1', 'REQUIRED_VAR2', 'REQUIRED_VAR3']);

      expect(result.isValid).toBe(false);
      expect(result.missing).toEqual(['REQUIRED_VAR2', 'REQUIRED_VAR3']);
    });
  });
});
