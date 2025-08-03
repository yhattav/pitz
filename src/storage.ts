/**
 * Storage implementations for the Pitz settings library
 * Framework-agnostic storage adapters
 */

import { SettingsStorage, SettingValue } from './types';

interface StorageOptions {
  prefix?: string;
  encryptionKey?: string;
}

/**
 * Encryption utilities (simplified - in production consider using Web Crypto API)
 */
class SimpleEncryption {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  encrypt(data: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i);
      const keyChar = this.key.charCodeAt(i % this.key.length);
      result += String.fromCharCode(charCode ^ keyChar);
    }
    return btoa(result);
  }

  decrypt(encrypted: string): string {
    const data = atob(encrypted);
    let result = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i);
      const keyChar = this.key.charCodeAt(i % this.key.length);
      result += String.fromCharCode(charCode ^ keyChar);
    }
    return result;
  }
}

/**
 * LocalStorage adapter with optional encryption
 */
export class LocalStorageAdapter implements SettingsStorage {
  private prefix: string;
  private encryption?: SimpleEncryption;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || 'pitz:';
    
    if (options.encryptionKey) {
      this.encryption = new SimpleEncryption(options.encryptionKey);
    }
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private serialize(data: SettingValue): string {
    try {
      // Don't store null or undefined values
      if (data === null || data === undefined) {
        throw new Error('Cannot store null or undefined values');
      }

      const serialized = JSON.stringify(data);
      
      if (!this.encryption) {
        return serialized;
      }
      
      return this.encryption.encrypt(serialized);
    } catch (error) {
      console.error('[PITZ-STORAGE] Serialization failed:', error);
      throw error;
    }
  }

  private deserialize(stored: string): SettingValue {
    try {
      let data: string;
      
      if (!this.encryption) {
        data = stored;
      } else {
        data = this.encryption.decrypt(stored);
      }
      
      const parsed = JSON.parse(data);
      
      // Don't return null or undefined values from storage
      if (parsed === null || parsed === undefined) {
        throw new Error('Invalid null/undefined value in storage');
      }
      
      return parsed as SettingValue;
    } catch (error) {
      console.error('[PITZ-STORAGE] Deserialization failed:', error);
      throw error;
    }
  }

  async get<T extends SettingValue>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);
    try {
      const stored = localStorage.getItem(fullKey);
      if (!stored) {
        return null;
      }
      
      const value = this.deserialize(stored) as T;
      return value;
    } catch (error) {
      console.error(`[PITZ-STORAGE] Error getting setting ${key}:`, error);
      // On error, remove the potentially corrupted value
      try {
        localStorage.removeItem(fullKey);
      } catch (e) {
        console.error(`[PITZ-STORAGE] Error removing corrupted value for ${key}:`, e);
      }
      return null;
    }
  }

  async set<T extends SettingValue>(key: string, value: T): Promise<void> {
    const fullKey = this.getKey(key);
    try {
      // Don't store null or undefined values
      if (value === null || value === undefined) {
        console.warn(`[PITZ-STORAGE] Skipping storing null/undefined for key: ${key}`);
        localStorage.removeItem(fullKey);
        return;
      }
      
      const serialized = this.serialize(value);
      localStorage.setItem(fullKey, serialized);
    } catch (error) {
      console.error(`[PITZ-STORAGE] Error setting ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.getKey(key);
    try {
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error(`[PITZ-STORAGE] Error deleting ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      const settingsKeys = keys.filter((key) => key.startsWith(this.prefix));
      
      settingsKeys.forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('[PITZ-STORAGE] Error clearing settings:', error);
      throw error;
    }
  }
}

/**
 * Memory storage adapter for testing or environments without localStorage
 */
export class MemoryStorageAdapter implements SettingsStorage {
  private storage = new Map<string, SettingValue>();
  private prefix: string;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || 'pitz:';
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T extends SettingValue>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);
    const value = this.storage.get(fullKey);
    return (value as T) || null;
  }

  async set<T extends SettingValue>(key: string, value: T): Promise<void> {
    if (value === null || value === undefined) {
      await this.delete(key);
      return;
    }
    
    const fullKey = this.getKey(key);
    this.storage.set(fullKey, value);
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.getKey(key);
    this.storage.delete(fullKey);
  }

  async clear(): Promise<void> {
    const keys = Array.from(this.storage.keys());
    const settingsKeys = keys.filter((key) => key.startsWith(this.prefix));
    
    settingsKeys.forEach((key) => {
      this.storage.delete(key);
    });
  }
}

/**
 * IndexedDB storage adapter for larger data storage
 */
export class IndexedDBStorageAdapter implements SettingsStorage {
  private dbName: string;
  private storeName: string;
  private version: number;
  private prefix: string;

  constructor(options: StorageOptions & { 
    dbName?: string; 
    storeName?: string; 
    version?: number; 
  } = {}) {
    this.dbName = options.dbName || 'pitz-settings';
    this.storeName = options.storeName || 'settings';
    this.version = options.version || 1;
    this.prefix = options.prefix || 'pitz:';
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async get<T extends SettingValue>(key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      const fullKey = this.getKey(key);
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(fullKey);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? (result as T) : null);
        };
      });
    } catch (error) {
      console.error(`[PITZ-STORAGE] IndexedDB get error for ${key}:`, error);
      return null;
    }
  }

  async set<T extends SettingValue>(key: string, value: T): Promise<void> {
    if (value === null || value === undefined) {
      await this.delete(key);
      return;
    }

    const db = await this.getDB();
    const fullKey = this.getKey(key);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, fullKey);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.getDB();
    const fullKey = this.getKey(key);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(fullKey);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // Get all keys
      const request = store.getAllKeys();
      request.onsuccess = () => {
        const keys = request.result as string[];
        const settingsKeys = keys.filter((key) => key.startsWith(this.prefix));
        
        // Delete each matching key
        let deleteCount = 0;
        if (settingsKeys.length === 0) {
          resolve();
          return;
        }
        
        settingsKeys.forEach((key) => {
          const deleteRequest = store.delete(key);
          deleteRequest.onsuccess = () => {
            deleteCount++;
            if (deleteCount === settingsKeys.length) {
              resolve();
            }
          };
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
      };
      request.onerror = () => reject(request.error);
    });
  }
}