import { SettingsStorage } from "./types";
import { AES, enc } from "crypto-js";

interface StorageOptions {
  prefix?: string;
  encryptionKey?: string;
}

export class LocalStorageAdapter implements SettingsStorage {
  private prefix: string;
  private encryptionKey?: string;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || "settings:";
    this.encryptionKey = options.encryptionKey;
    console.log(
      "[STORAGE] Initialized with prefix:",
      this.prefix,
      "encryption:",
      !!this.encryptionKey
    );
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private encrypt(data: unknown): string {
    try {
      // Don't store null or undefined values
      if (data === null || data === undefined) {
        throw new Error("Cannot store null or undefined values");
      }

      const serialized = JSON.stringify(data);
      if (!this.encryptionKey) {
        console.log("[STORAGE] Storing unencrypted:", {
          key: "redacted",
          value: data,
          type: typeof data,
        });
        return serialized;
      }
      console.log("[STORAGE] Storing encrypted data of type:", typeof data);
      return AES.encrypt(serialized, this.encryptionKey).toString();
    } catch (error) {
      console.error("[STORAGE] Encryption failed:", error);
      throw error;
    }
  }

  private decrypt(encrypted: string): unknown {
    try {
      if (!this.encryptionKey) {
        const data = JSON.parse(encrypted);
        // Don't return null or undefined values from storage
        if (data === null || data === undefined) {
          console.log(
            "[STORAGE] Found null/undefined value in storage, treating as not found"
          );
          return null;
        }
        console.log("[STORAGE] Retrieved unencrypted:", {
          key: "redacted",
          value: data,
          type: typeof data,
        });
        return data;
      }
      const decrypted = AES.decrypt(encrypted, this.encryptionKey);
      const data = JSON.parse(decrypted.toString(enc.Utf8));
      // Don't return null or undefined values from storage
      if (data === null || data === undefined) {
        console.log(
          "[STORAGE] Found null/undefined value in storage, treating as not found"
        );
        return null;
      }
      console.log("[STORAGE] Retrieved decrypted data of type:", typeof data);
      return data;
    } catch (error) {
      console.error("[STORAGE] Decryption/parsing failed:", error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);
    try {
      console.log(`[STORAGE] Attempting to get value for key: ${key}`);
      const stored = localStorage.getItem(fullKey);
      if (!stored) {
        console.log(`[STORAGE] No value found for key: ${key}`);
        return null;
      }
      const value = this.decrypt(stored) as T;
      // Don't return null values from storage
      if (value === null || value === undefined) {
        console.log(
          `[STORAGE] Retrieved null/undefined for ${key}, removing from storage`
        );
        localStorage.removeItem(fullKey);
        return null;
      }
      console.log(`[STORAGE] Successfully retrieved value for ${key}:`, {
        value,
        type: typeof value,
      });
      return value;
    } catch (error) {
      console.error(`[STORAGE] Error getting setting ${key}:`, error);
      // On error, remove the potentially corrupted value
      try {
        localStorage.removeItem(fullKey);
        console.log(`[STORAGE] Removed corrupted value for key: ${key}`);
      } catch (e) {
        console.error(
          `[STORAGE] Error removing corrupted value for ${key}:`,
          e
        );
      }
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const fullKey = this.getKey(key);
    try {
      // Don't store null or undefined values
      if (value === null || value === undefined) {
        console.warn(
          `[STORAGE] Skipping storing null/undefined for key: ${key}`
        );
        // Remove any existing value
        localStorage.removeItem(fullKey);
        return;
      }
      console.log(`[STORAGE] Setting value for ${key}:`, {
        value,
        type: typeof value,
      });
      const encrypted = this.encrypt(value);
      localStorage.setItem(fullKey, encrypted);
      console.log(`[STORAGE] Successfully stored value for key: ${key}`);
    } catch (error) {
      console.error(`[STORAGE] Error setting ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.getKey(key);
    try {
      localStorage.removeItem(fullKey);
      console.log(`[STORAGE] Deleted key: ${key}`);
    } catch (error) {
      console.error(`[STORAGE] Error deleting ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      const settingsKeys = keys.filter((key) => key.startsWith(this.prefix));
      console.log(
        `[STORAGE] Clearing ${settingsKeys.length} settings:`,
        settingsKeys
      );
      settingsKeys.forEach((key) => {
        localStorage.removeItem(key);
        console.log(`[STORAGE] Removed key: ${key}`);
      });
    } catch (error) {
      console.error("[STORAGE] Error clearing settings:", error);
      throw error;
    }
  }
}
