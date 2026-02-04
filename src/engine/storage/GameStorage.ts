// src/engine/storage/GameStorage.ts

import type { IStorageBackend } from './base/IStorageBackend';
import { LocalStorageBackend } from './base/LocalStorageBackend';
import { STORAGE_KEYS } from './base/constants';
import type {
  EntityStats,
  FighterStats,
  GameProgress,
  GameSaveData,
} from './types';
import {
  createDefaultEntityStats,
  createDefaultFighterStats,
  createDefaultProgress,
} from './types';
import { FighterId, WeaponId, EnemyId, BossId, BuffType } from '../types/ids';

/**
 * 存档配置选项
 */
export interface GameStorageOptions {
  /** 存储后端，默认使用 LocalStorage */
  backend?: IStorageBackend;
  /** 当前存档版本号 */
  version: number;
  /** 存档键名 */
  saveKey?: string;
  /** 版本不兼容时的回调 */
  onVersionMismatch?: (currentVersion: number, saveVersion: number) => void;
}

/**
 * 游戏存档管理器（单例）
 */
export class GameStorage {
  private static instance: GameStorage | null = null;
  private backend: IStorageBackend;
  private version: number;
  private saveKey: string;
  private cache: GameSaveData | null = null;
  private onVersionMismatch?: (currentVersion: number, saveVersion: number) => void;

  private constructor(options: GameStorageOptions) {
    this.backend = options.backend ?? new LocalStorageBackend();
    this.version = options.version;
    this.saveKey = options.saveKey ?? STORAGE_KEYS.GAME_SAVE;
    this.onVersionMismatch = options.onVersionMismatch;
  }

  /**
   * 初始化单例
   */
  static initialize(options: GameStorageOptions): GameStorage {
    if (!GameStorage.instance) {
      GameStorage.instance = new GameStorage(options);
    }
    return GameStorage.instance;
  }

  /**
   * 获取单例实例
   */
  static getInstance(): GameStorage {
    if (!GameStorage.instance) {
      throw new Error('GameStorage not initialized. Call initialize() first.');
    }
    return GameStorage.instance;
  }

  /**
   * 重置单例（主要用于测试）
   */
  static resetInstance(): void {
    GameStorage.instance = null;
  }

  // === 核心方法 ===

  /**
   * 加载存档
   * @returns 存档数据，如果不存在或版本不兼容则返回默认数据
   */
  async load(): Promise<GameSaveData> {
    const result = await this.backend.get<GameSaveData>(this.saveKey);

    if (!result.success || !result.data) {
      // 首次游戏，返回默认存档
      this.cache = this.createDefaultSave();
      return this.cache;
    }

    // 版本检测
    if (result.data.version !== this.version) {
      this.onVersionMismatch?.(this.version, result.data.version);
      // 返回默认存档，保留旧存档让用户决定
      this.cache = this.createDefaultSave();
      return this.cache;
    }

    this.cache = this.mergeWithDefaults(result.data);
    return this.cache;
  }

  /**
   * 保存存档（实时保存，直接写入存储）
   */
  async save(data: GameSaveData): Promise<boolean> {
    // 更新时间戳
    data.updatedAt = Date.now();

    const result = await this.backend.set(this.saveKey, data);
    if (result.success) {
      this.cache = data;
    }
    return result.success;
  }

  /**
   * 重置存档
   */
  async reset(): Promise<boolean> {
    this.cache = this.createDefaultSave();
    return await this.save(this.cache);
  }

  // === 便捷访问方法 ===

  /**
   * 获取当前存档数据（优先使用缓存）
   */
  getData(): GameSaveData {
    if (!this.cache) {
      throw new Error('Save data not loaded. Call load() first.');
    }
    return this.cache;
  }

  /**
   * 获取战机统计
   */
  getFighterStats(fighterId: FighterId): FighterStats {
    return this.getData().fighters[fighterId];
  }

  /**
   * 获取武器统计
   */
  getWeaponStats(weaponId: WeaponId): EntityStats {
    return this.getData().weapons[weaponId];
  }

  /**
   * 获取道具统计
   */
  getItemStats(itemType: BuffType): EntityStats {
    return this.getData().items[itemType];
  }

  /**
   * 获取敌人统计
   */
  getEnemyStats(enemyId: EnemyId): EntityStats {
    return this.getData().enemies[enemyId];
  }

  /**
   * 获取Boss统计
   */
  getBossStats(bossId: BossId): EntityStats {
    return this.getData().bosses[bossId];
  }

  /**
   * 获取全局进度
   */
  getProgress(): GameProgress {
    return this.getData().progress;
  }

  // === 更新方法 ===

  /**
   * 更新战机统计
   */
  async updateFighterStats(
    fighterId: FighterId,
    updates: Partial<FighterStats>
  ): Promise<boolean> {
    const data = this.getData();
    data.fighters[fighterId] = { ...data.fighters[fighterId], ...updates };
    return await this.save(data);
  }

  /**
   * 记录武器遇到/解锁
   */
  async recordWeapon(weaponId: WeaponId, damage: number = 0): Promise<boolean> {
    const data = this.getData();
    const stats = data.weapons[weaponId];
    const now = Date.now();

    data.weapons[weaponId] = {
      ...stats,
      unlocked: true,
      firstSeenAt: stats.firstSeenAt || now,
      lastSeenAt: now,
      encounterCount: stats.encounterCount + 1,
      highestDamage: Math.max(stats.highestDamage, damage),
    };

    return await this.save(data);
  }

  /**
   * 记录道具拾取
   */
  async recordItem(itemType: BuffType): Promise<boolean> {
    const data = this.getData();
    const stats = data.items[itemType];
    const now = Date.now();

    data.items[itemType] = {
      ...stats,
      unlocked: true,
      firstSeenAt: stats.firstSeenAt || now,
      lastSeenAt: now,
      encounterCount: stats.encounterCount + 1,
    };

    return await this.save(data);
  }

  /**
   * 记录敌人遇到/击杀
   */
  async recordEnemy(
    enemyId: EnemyId,
    killed: boolean = false,
    damage: number = 0,
    damageReceived: number = 0
  ): Promise<boolean> {
    const data = this.getData();
    const stats = data.enemies[enemyId];
    const now = Date.now();

    data.enemies[enemyId] = {
      ...stats,
      unlocked: true,
      firstSeenAt: stats.firstSeenAt || now,
      lastSeenAt: now,
      encounterCount: stats.encounterCount + 1,
      killCount: killed ? stats.killCount + 1 : stats.killCount,
      highestDamage: Math.max(stats.highestDamage, damage),
      highestDamageReceived: Math.max(stats.highestDamageReceived, damageReceived),
    };

    return await this.save(data);
  }

  /**
   * 记录Boss遇到/击杀
   */
  async recordBoss(
    bossId: BossId,
    killed: boolean = false,
    damage: number = 0,
    damageReceived: number = 0
  ): Promise<boolean> {
    const data = this.getData();
    const stats = data.bosses[bossId];
    const now = Date.now();

    data.bosses[bossId] = {
      ...stats,
      unlocked: true,
      firstSeenAt: stats.firstSeenAt || now,
      lastSeenAt: now,
      encounterCount: stats.encounterCount + 1,
      killCount: killed ? stats.killCount + 1 : stats.killCount,
      highestDamage: Math.max(stats.highestDamage, damage),
      highestDamageReceived: Math.max(stats.highestDamageReceived, damageReceived),
    };

    return await this.save(data);
  }

  /**
   * 更新最高分/最高关卡
   */
  async updateHighScore(level: number, score: number): Promise<boolean> {
    const data = this.getData();

    // 更新全局进度
    data.progress.maxLevel = Math.max(data.progress.maxLevel, level);
    data.progress.highScore = Math.max(data.progress.highScore, score);

    return await this.save(data);
  }

  // === 私有方法 ===

  /**
   * 创建默认存档数据
   */
  private createDefaultSave(): GameSaveData {
    const now = Date.now();

    return {
      version: this.version,
      createdAt: now,
      updatedAt: now,
      progress: createDefaultProgress(),
      fighters: this.createDefaultFightersStats(),
      weapons: this.createDefaultEntityStatsRecord<WeaponId>(),
      items: this.createDefaultEntityStatsRecord<BuffType>(),
      enemies: this.createDefaultEntityStatsRecord<EnemyId>(),
      bosses: this.createDefaultEntityStatsRecord<BossId>(),
    };
  }

  /**
   * 将加载的存档与默认值合并（处理新增的枚举值）
   */
  private mergeWithDefaults(loaded: GameSaveData): GameSaveData {
    const defaults = this.createDefaultSave();

    return {
      ...loaded,
      fighters: { ...defaults.fighters, ...loaded.fighters },
      weapons: { ...defaults.weapons, ...loaded.weapons },
      items: { ...defaults.items, ...loaded.items },
      enemies: { ...defaults.enemies, ...loaded.enemies },
      bosses: { ...defaults.bosses, ...loaded.bosses },
    };
  }

  /**
   * 创建默认的战机统计
   */
  private createDefaultFightersStats(): Record<FighterId, FighterStats> {
    const stats: Record<string, FighterStats> = {};

    // 默认解锁第一个战机
    const fighterIds = Object.values(FighterId);
    for (const id of fighterIds) {
      stats[id] = createDefaultFighterStats(id === FighterId.NEON);
    }

    return stats as Record<FighterId, FighterStats>;
  }

  /**
   * 创建默认的实体统计记录
   */
  private createDefaultEntityStatsRecord<T extends string>(): Record<T, EntityStats> {
    const record: Record<string, EntityStats> = {};
    return record as Record<T, EntityStats>;
  }
}
