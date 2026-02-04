// src/engine/storage/base/constants.ts

/**
 * 存储键名
 */
export const STORAGE_KEYS = {
  /** 游戏存档主数据 */
  GAME_SAVE: 'game_save',
  /** 存档版本（用于快速检测） */
  SAVE_VERSION: 'save_version',
} as const;

/**
 * 当前存档版本号
 * 每次存档格式不兼容的修改时需要递增此值
 */
export const CURRENT_SAVE_VERSION = 1;
