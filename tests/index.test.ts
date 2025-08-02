import { describe, it, expect } from 'vitest';
import { greet, add, greetWithOptions } from '../src/index';

describe('Index Functions', () => {
  describe('greet', () => {
    it('should return a greeting message', () => {
      expect(greet('World')).toBe('Hello, World!');
    });

    it('should handle empty string', () => {
      expect(greet('')).toBe('Hello, !');
    });
  });

  describe('add', () => {
    it('should add two numbers correctly', () => {
      expect(add(2, 3)).toBe(5);
      expect(add(-1, 1)).toBe(0);
      expect(add(0, 0)).toBe(0);
    });

    it('should handle decimal numbers', () => {
      expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    });
  });

  describe('greetWithOptions', () => {
    it('should use default options', () => {
      expect(greetWithOptions('Alice')).toBe('Hello, Alice!');
    });

    it('should use custom prefix', () => {
      expect(greetWithOptions('Bob', { prefix: 'Hi' })).toBe('Hi, Bob!');
    });

    it('should use custom suffix', () => {
      expect(greetWithOptions('Charlie', { suffix: '.' })).toBe('Hello, Charlie.');
    });

    it('should use both custom prefix and suffix', () => {
      expect(greetWithOptions('David', { prefix: 'Hey', suffix: '!!!' })).toBe('Hey, David!!!');
    });
  });
});