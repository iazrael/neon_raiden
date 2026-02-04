// src/engine/storage/types.ts

import { FighterId, WeaponId, EnemyId, BossId, BuffType } from '../types/ids';

/**
 * 单个可解锁实体的统计数据（用于图鉴 - 武器/道具/敌人/Boss）
 */
export interface EntityStats {
  /** 是否已解锁/遇到 */
  unlocked: boolean;
  /** 首次遇到时间戳（毫秒） */
  firstSeenAt: number;
  /** 最后遇到时间戳（毫秒） */
  lastSeenAt: number;
  /** 遇到次数 */
  encounterCount: number;
  /** 击杀/击败次数 */
  killCount: number;
  /** 对该实体造成的最高单次伤害 */
  highestDamage: number;
  /** 被该实体造成的最高单次伤害 */
  highestDamageReceived: number;
}

/**
 * 单个战机的统计数据
 */
export interface FighterStats {
  /** 是否已解锁该战机 */
  unlocked: boolean;
  /** 首次使用时间戳（毫秒） */
  firstUsedAt: number;
  /** 最后使用时间戳（毫秒） */
  lastUsedAt: number;
  /** 使用该战机游玩次数 */
  playCount: number;
  /** 该战机达到的最高关卡 */
  maxLevel: number;
  /** 该机位的最高分数 */
  highScore: number;
  /** 使用该战机累计击杀小怪数 */
  totalEnemyKills: number;
  /** 使用该战机累计击败Boss数 */
  totalBossKills: number;
  /** 使用该战机造成的最高单次伤害 */
  highestDamage: number;
  /** 使用该战机累计游戏时长（毫秒） */
  totalPlayTimeMs: number;
}

/**
 * 全局游戏进度数据（跨战机的汇总）
 */
export interface GameProgress {
  /** 通关的最高关卡（1-indexed，所有战机中的最高值） */
  maxLevel: number;
  /** 最高分数（所有战机中的最高值） */
  highScore: number;
  /** 总游戏次数 */
  totalPlayCount: number;
  /** 总游戏时长（毫秒） */
  totalPlayTimeMs: number;
}

/**
 * 完整的游戏存档
 */
export interface GameSaveData {
  /** 存档版本号（用于迁移检测） */
  version: number;
  /** 存档创建时间 */
  createdAt: number;
  /** 最后更新时间 */
  updatedAt: number;
  /** 全局游戏进度 */
  progress: GameProgress;
  /** 各战机的统计数据 */
  fighters: Record<FighterId, FighterStats>;
  /** 已解锁的武器统计 */
  weapons: Record<WeaponId, EntityStats>;
  /** 已解锁的道具/Buff统计 */
  items: Record<BuffType, EntityStats>;
  /** 已遇到的敌人统计 */
  enemies: Record<EnemyId, EntityStats>;
  /** 已遇到的Boss统计 */
  bosses: Record<BossId, EntityStats>;
}

/**
 * 创建默认的 EntityStats
 */
export function createDefaultEntityStats(): EntityStats {
  return {
    unlocked: false,
    firstSeenAt: 0,
    lastSeenAt: 0,
    encounterCount: 0,
    killCount: 0,
    highestDamage: 0,
    highestDamageReceived: 0,
  };
}

/**
 * 创建默认的 FighterStats
 */
export function createDefaultFighterStats(unlocked = false): FighterStats {
  return {
    unlocked,
    firstUsedAt: 0,
    lastUsedAt: 0,
    playCount: 0,
    maxLevel: 0,
    highScore: 0,
    totalEnemyKills: 0,
    totalBossKills: 0,
    highestDamage: 0,
    totalPlayTimeMs: 0,
  };
}

/**
 * 创建默认的 GameProgress
 */
export function createDefaultProgress(): GameProgress {
  return {
    maxLevel: 0,
    highScore: 0,
    totalPlayCount: 0,
    totalPlayTimeMs: 0,
  };
}
