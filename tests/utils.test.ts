import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageAdapter, MemoryStorageAdapter } from '../src/storage';
import { RelevanceEngine } from '../src/relevance';
import { RelevanceTemplates } from '../src/templates';
import { throttle } from '../src/utils';
import type { SettingsStructure, SettingDefinition } from '../src/types';

// Mock localStorage for testing in Node.js environment
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Also mock window for browser compatibility tests
Object.defineProperty(global, 'window', {
  value: { localStorage: localStorageMock },
  writable: true,
});

describe('Storage Adapters', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  describe('MemoryStorageAdapter', () => {
    let storage: MemoryStorageAdapter;

    beforeEach(() => {
      storage = new MemoryStorageAdapter();
    });

    it('should store and retrieve values', async () => {
      await storage.set('test.key', 'test value');
      const value = await storage.get('test.key');
      expect(value).toBe('test value');
    });

    it('should return null for non-existent keys', async () => {
      const value = await storage.get('non.existent');
      expect(value).toBe(null);
    });

    it('should delete values', async () => {
      await storage.set('test.delete', 'value');
      await storage.delete('test.delete');
      const value = await storage.get('test.delete');
      expect(value).toBe(null);
    });

    it('should clear all values with prefix', async () => {
      await storage.set('test1', 'value1');
      await storage.set('test2', 'value2');
      await storage.clear();
      
      expect(await storage.get('test1')).toBe(null);
      expect(await storage.get('test2')).toBe(null);
    });

    it('should handle different data types', async () => {
      await storage.set('string', 'text');
      await storage.set('number', 42);
      await storage.set('boolean', true);

      expect(await storage.get('string')).toBe('text');
      expect(await storage.get('number')).toBe(42);
      expect(await storage.get('boolean')).toBe(true);
    });
  });

  describe('LocalStorageAdapter', () => {
    let storage: LocalStorageAdapter;

    beforeEach(() => {
      storage = new LocalStorageAdapter();
    });

    it('should use localStorage with prefix', async () => {
      await storage.set('test.key', 'test value');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pitz:test.key',
        JSON.stringify('test value')
      );
    });

    it('should retrieve values from localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify('stored value'));
      
      const value = await storage.get('test.key');
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('pitz:test.key');
      expect(value).toBe('stored value');
    });

    it('should handle encrypted storage', async () => {
      const encryptedStorage = new LocalStorageAdapter({ encryptionKey: 'secret' });
      
      await encryptedStorage.set('encrypted.key', 'secret data');
      
      // Should call setItem with encrypted data (not plain JSON)
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const [key, value] = localStorageMock.setItem.mock.calls[0];
      expect(key).toBe('pitz:encrypted.key');
      expect(value).not.toBe(JSON.stringify('secret data')); // Should be encrypted
    });

    it('should handle corrupted data gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const value = await storage.get('corrupted.key');
      
      expect(value).toBe(null);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('pitz:corrupted.key');
    });
  });
});

describe('Relevance Engine', () => {
  const mockStructure: SettingsStructure = {
    tabs: [
      {
        id: 'test',
        label: 'Test',
        icon: 'test',
        groups: [
          {
            title: 'Group 1',
            settings: [
              { key: 'setting1' },
              { 
                key: 'setting2',
                isRelevant: (settings) => !!settings['setting1']
              }
            ]
          }
        ]
      }
    ]
  };

  const mockDefinitions: SettingDefinition[] = [
    {
      key: 'setting1',
      type: 'boolean',
      defaultValue: false,
    },
    {
      key: 'setting2',
      type: 'string',
      defaultValue: 'test',
      isRelevant: (settings) => !!settings['setting1']
    }
  ];

  describe('evaluate', () => {
    it('should evaluate relevance based on definition', () => {
      const settings = { setting1: true };
      
      const result = RelevanceEngine.evaluate(
        'setting2',
        mockStructure,
        mockDefinitions,
        settings
      );
      
      expect(result).toBe(true);
    });

    it('should return false when relevance condition is not met', () => {
      const settings = { setting1: false };
      
      const result = RelevanceEngine.evaluate(
        'setting2',
        mockStructure,
        mockDefinitions,
        settings
      );
      
      expect(result).toBe(false);
    });

    it('should return true for settings without relevance conditions', () => {
      const settings = {};
      
      const result = RelevanceEngine.evaluate(
        'setting1',
        mockStructure,
        mockDefinitions,
        settings
      );
      
      expect(result).toBe(true);
    });
  });

  describe('getVisibleSettings', () => {
    it('should return only visible settings', () => {
      const settings = { setting1: true };
      
      const visible = RelevanceEngine.getVisibleSettings(
        mockStructure,
        mockDefinitions,
        settings
      );
      
      expect(visible).toEqual(['setting1', 'setting2']);
    });

    it('should filter out non-relevant settings', () => {
      const settings = { setting1: false };
      
      const visible = RelevanceEngine.getVisibleSettings(
        mockStructure,
        mockDefinitions,
        settings
      );
      
      expect(visible).toEqual(['setting1']);
    });
  });

  describe('batchEvaluate', () => {
    it('should evaluate multiple settings at once', () => {
      const settings = { setting1: true };
      
      const results = RelevanceEngine.batchEvaluate(
        ['setting1', 'setting2'],
        mockStructure,
        mockDefinitions,
        settings
      );
      
      expect(results).toEqual({
        setting1: true,
        setting2: true
      });
    });
  });
});

describe('Relevance Templates', () => {
  const testSettings = {
    enabled: true,
    disabled: false,
    quality: 'high',
    volume: 75,
    count: 5
  };

  describe('basic templates', () => {
    it('should test dependsOn', () => {
      const dependsOnEnabled = RelevanceTemplates.dependsOn('enabled');
      expect(dependsOnEnabled(testSettings)).toBe(true);
      
      const dependsOnDisabled = RelevanceTemplates.dependsOn('disabled');
      expect(dependsOnDisabled(testSettings)).toBe(false);
    });

    it('should test equals', () => {
      const equalsHigh = RelevanceTemplates.equals('quality', 'high');
      expect(equalsHigh(testSettings)).toBe(true);
      
      const equalsLow = RelevanceTemplates.equals('quality', 'low');
      expect(equalsLow(testSettings)).toBe(false);
    });

    it('should test greaterThan', () => {
      const greaterThan50 = RelevanceTemplates.greaterThan('volume', 50);
      expect(greaterThan50(testSettings)).toBe(true);
      
      const greaterThan100 = RelevanceTemplates.greaterThan('volume', 100);
      expect(greaterThan100(testSettings)).toBe(false);
    });

    it('should test inRange', () => {
      const inRange = RelevanceTemplates.inRange('count', 0, 10);
      expect(inRange(testSettings)).toBe(true);
      
      const outOfRange = RelevanceTemplates.inRange('count', 10, 20);
      expect(outOfRange(testSettings)).toBe(false);
    });

    it('should test oneOf', () => {
      const oneOfValid = RelevanceTemplates.oneOf('quality', ['high', 'medium']);
      expect(oneOfValid(testSettings)).toBe(true);
      
      const oneOfInvalid = RelevanceTemplates.oneOf('quality', ['low', 'medium']);
      expect(oneOfInvalid(testSettings)).toBe(false);
    });
  });

  describe('logical templates', () => {
    it('should test allOf', () => {
      const allConditions = RelevanceTemplates.allOf(
        RelevanceTemplates.dependsOn('enabled'),
        RelevanceTemplates.equals('quality', 'high')
      );
      expect(allConditions(testSettings)).toBe(true);
      
      const failingConditions = RelevanceTemplates.allOf(
        RelevanceTemplates.dependsOn('disabled'),
        RelevanceTemplates.equals('quality', 'high')
      );
      expect(failingConditions(testSettings)).toBe(false);
    });

    it('should test anyOf', () => {
      const anyConditions = RelevanceTemplates.anyOf(
        RelevanceTemplates.dependsOn('disabled'),
        RelevanceTemplates.equals('quality', 'high')
      );
      expect(anyConditions(testSettings)).toBe(true);
      
      const allFailingConditions = RelevanceTemplates.anyOf(
        RelevanceTemplates.dependsOn('disabled'),
        RelevanceTemplates.equals('quality', 'low')
      );
      expect(allFailingConditions(testSettings)).toBe(false);
    });

    it('should test not', () => {
      const notDisabled = RelevanceTemplates.not(
        RelevanceTemplates.dependsOn('disabled')
      );
      expect(notDisabled(testSettings)).toBe(true);
      
      const notEnabled = RelevanceTemplates.not(
        RelevanceTemplates.dependsOn('enabled')
      );
      expect(notEnabled(testSettings)).toBe(false);
    });
  });

  describe('utility templates', () => {
    it('should provide always and never', () => {
      expect(RelevanceTemplates.always()(testSettings)).toBe(true);
      expect(RelevanceTemplates.never()(testSettings)).toBe(false);
    });
  });
});

describe('Utility Functions', () => {
  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);
      
      // Call multiple times rapidly
      throttledFn('call1');
      throttledFn('call2');
      throttledFn('call3');
      
      // Should be called once immediately (leading edge)
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call1');
      
      // Wait for throttle period to complete
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be called once more (trailing edge)
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('call3');
    });

    it('should call function again after throttle period', async () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 50);
      
      throttledFn('first');
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // Wait for throttle period to expire
      await new Promise(resolve => setTimeout(resolve, 60));
      
      throttledFn('second');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('second');
    });
  });
});