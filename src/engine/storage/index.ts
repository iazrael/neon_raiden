// src/engine/storage/index.ts

// 核心类
export { GameStorage } from './GameStorage';
export type { GameStorageOptions } from './GameStorage';
export { StorageEventListener } from './StorageEventListener';

// 类型定义
export type {
  EntityStats,
  FighterStats,
  GameProgress,
  GameSaveData,
} from './types';
export {
  createDefaultEntityStats,
  createDefaultFighterStats,
  createDefaultProgress,
} from './types';

// 存储后端接口
export type { IStorageBackend, StorageResult } from './base/IStorageBackend';
export { LocalStorageBackend } from './base/LocalStorageBackend';

// 常量
export { STORAGE_KEYS, CURRENT_SAVE_VERSION } from './base/constants';
