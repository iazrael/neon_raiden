// src/engine/storage/base/index.ts

export type { IStorageBackend, StorageResult } from './IStorageBackend';
export { LocalStorageBackend } from './LocalStorageBackend';
export { STORAGE_KEYS, CURRENT_SAVE_VERSION } from './constants';
