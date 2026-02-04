// src/engine/storage/base/LocalStorageBackend.ts

import type { IStorageBackend, StorageResult } from './IStorageBackend';

/**
 * LocalStorage 存储后端实现
 */
export class LocalStorageBackend implements IStorageBackend {
  private readonly prefix: string;

  constructor(prefix: string = 'neon_raiden_') {
    this.prefix = prefix;
  }

  isAvailable(): boolean {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return false;
    }
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private getKey(key: string): string {
    return this.prefix + key;
  }

  async get<T>(key: string): Promise<StorageResult<T>> {
    try {
      const raw = localStorage.getItem(this.getKey(key));
      if (!raw) {
        return { success: false, error: 'Key not found' };
      }
      return { success: true, data: JSON.parse(raw) as T };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async set<T>(key: string, value: T): Promise<StorageResult<void>> {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async remove(key: string): Promise<StorageResult<void>> {
    try {
      localStorage.removeItem(this.getKey(key));
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async clear(): Promise<StorageResult<void>> {
    try {
      // 只清除带前缀的键
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
