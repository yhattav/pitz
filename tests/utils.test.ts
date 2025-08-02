import { describe, it, expect } from 'vitest';
import utils, { isEmpty, isString, isNumber, capitalize } from '../src/utils';

describe('Utils', () => {
  describe('isEmpty', () => {
    it('should return true for empty values', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it('should return false for non-empty values', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty([1, 2, 3])).toBe(false);
      expect(isEmpty({ key: 'value' })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
      expect(isString(String(123))).toBe(true);
    });

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString([])).toBe(false);
      expect(isString({})).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-123)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
    });

    it('should return false for invalid numbers and non-numbers', () => {
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber('123')).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
      expect(isNumber([])).toBe(false);
    });
  });

  describe('capitalize', () => {
    it('should capitalize the first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
      expect(capitalize('a')).toBe('A');
    });

    it('should handle edge cases', () => {
      expect(capitalize('')).toBe('');
      expect(capitalize('H')).toBe('H');
      expect(capitalize('hELLO')).toBe('HELLO');
    });
  });

  describe('default export', () => {
    it('should export all utility functions', () => {
      expect(utils.isEmpty).toBe(isEmpty);
      expect(utils.isString).toBe(isString);
      expect(utils.isNumber).toBe(isNumber);
      expect(utils.capitalize).toBe(capitalize);
    });
  });
});