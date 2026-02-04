# Storage 模块实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现游戏持久化存储模块，支持玩家进度和图鉴数据的保存与读取。

**Architecture:**
- 底层抽象存储接口 `IStorageBackend`，默认实现 `LocalStorageBackend`
- 中间层 `GameStorage` 单例管理存档数据
- 顶层 `StorageEventListener` 监听游戏事件自动更新存档

**Tech Stack:** TypeScript, 浏览器 LocalStorage API

---

## Task 1: 创建类型定义文件

**Files:**
- Create: `src/engine/storage/types.ts`

**Step 1: 创建类型定义**

```typescript
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
```

**Step 2: 类型检查**

Run: `pnpm type-check`
Expected: PASS（或仅报告未使用类型的警告，这是正常的）

**Step 3: Commit**

```bash
git add src/engine/storage/types.ts
git commit -m "feat: 添加存储模块类型定义"
```

---

## Task 2: 创建存储后端接口和常量

**Files:**
- Create: `src/engine/storage/base/constants.ts`
- Create: `src/engine/storage/base/IStorageBackend.ts`

**Step 1: 创建常量文件**

```typescript
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
```

**Step 2: 创建存储后端接口**

```typescript
// src/engine/storage/base/IStorageBackend.ts

/**
 * 存储操作结果
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 存储后端抽象接口
 * 所有存储后端必须实现此接口
 */
export interface IStorageBackend {
  /**
   * 读取数据
   * @param key 存储键名
   */
  get<T>(key: string): Promise<StorageResult<T>>;

  /**
   * 写入数据
   * @param key 存储键名
   * @param value 要存储的值（会被序列化为JSON）
   */
  set<T>(key: string, value: T): Promise<StorageResult<void>>;

  /**
   * 删除数据
   * @param key 存储键名
   */
  remove(key: string): Promise<StorageResult<void>>;

  /**
   * 清空所有数据
   */
  clear(): Promise<StorageResult<void>>;

  /**
   * 检查是否支持该存储后端
   */
  isAvailable(): boolean;
}
```

**Step 3: 类型检查**

Run: `pnpm type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add src/engine/storage/base/constants.ts src/engine/storage/base/IStorageBackend.ts
git commit -m "feat: 添加存储后端接口和常量定义"
```

---

## Task 3: 实现 LocalStorageBackend

**Files:**
- Create: `src/engine/storage/base/LocalStorageBackend.ts`
- Create: `src/engine/storage/base/index.ts`

**Step 1: 实现 LocalStorageBackend**

```typescript
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
```

**Step 2: 创建 base 目录导出文件**

```typescript
// src/engine/storage/base/index.ts

export { IStorageBackend, type StorageResult } from './IStorageBackend';
export { LocalStorageBackend } from './LocalStorageBackend';
export { STORAGE_KEYS, CURRENT_SAVE_VERSION } from './constants';
```

**Step 3: 类型检查**

Run: `pnpm type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add src/engine/storage/base/LocalStorageBackend.ts src/engine/storage/base/index.ts
git commit -m "feat: 实现 LocalStorage 存储后端"
```

---

## Task 4: 实现 GameStorage 核心类

**Files:**
- Create: `src/engine/storage/GameStorage.ts`

**Step 1: 实现 GameStorage 类**

```typescript
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
```

**Step 2: 类型检查**

Run: `pnpm type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/engine/storage/GameStorage.ts
git commit -m "feat: 实现 GameStorage 核心管理器"
```

---

## Task 5: 实现 StorageEventListener

**Files:**
- Create: `src/engine/storage/StorageEventListener.ts`

**Step 1: 实现 StorageEventListener**

```typescript
// src/engine/storage/StorageEventListener.ts

import type { GameStorage } from './GameStorage';
import type {
  HitEvent,
  KillEvent,
  PickupEvent,
  BossDefeatEvent,
  BossEntranceStartEvent,
  VictoryEvent,
  DefeatEvent,
} from '../events/events';
import { FighterId, WeaponId, BuffType } from '../types/ids';
import type { World } from '../world';
import { getEvents } from '../events';
import { getComponents } from '../world';

/**
 * 存储事件监听器
 * 监听游戏事件并自动更新存档数据
 */
export class StorageEventListener {
  private storage: GameStorage;
  private currentFighterId: FighterId;
  private currentGameStartTime: number = 0;
  private currentSessionKills: number = 0;
  private currentSessionBossKills: number = 0;
  private currentSessionDamage: number = 0;
  private currentSessionScore: number = 0;
  private currentLevel: number = 1;

  constructor(storage: GameStorage) {
    this.storage = storage;
    this.currentFighterId = FighterId.NEON;
  }

  /**
   * 设置当前游戏的战机
   */
  setCurrentFighter(fighterId: FighterId): void {
    this.currentFighterId = fighterId;
  }

  /**
   * 开始游戏会话
   */
  startGameSession(): void {
    this.currentGameStartTime = Date.now();
    this.currentSessionKills = 0;
    this.currentSessionBossKills = 0;
    this.currentSessionDamage = 0;
    this.currentSessionScore = 0;
    this.currentLevel = 1;
  }

  /**
   * 设置当前关卡
   */
  setCurrentLevel(level: number): void {
    this.currentLevel = level;
  }

  /**
   * 结束游戏会话并保存
   */
  async endGameSession(finalScore: number, finalLevel: number): Promise<void> {
    const playTimeMs = Date.now() - this.currentGameStartTime;
    const stats = this.storage.getFighterStats(this.currentFighterId);

    await this.storage.updateFighterStats(this.currentFighterId, {
      lastUsedAt: Date.now(),
      playCount: stats.playCount + 1,
      totalPlayTimeMs: stats.totalPlayTimeMs + playTimeMs,
      totalEnemyKills: stats.totalEnemyKills + this.currentSessionKills,
      totalBossKills: stats.totalBossKills + this.currentSessionBossKills,
      highScore: Math.max(stats.highScore, finalScore),
      maxLevel: Math.max(stats.maxLevel, finalLevel),
      highestDamage: Math.max(stats.highestDamage, this.currentSessionDamage),
    });

    // 更新全局进度
    await this.storage.updateHighScore(finalLevel, finalScore);

    // 更新全局游戏次数
    const data = this.storage.getData();
    data.progress.totalPlayCount += 1;
    data.progress.totalPlayTimeMs += playTimeMs;
    await this.storage.save(data);
  }

  /**
   * 注册事件监听
   */
  register(world: World): void {
    const events = getEvents(world);

    // 监听命中事件（记录最高伤害）
    events.on<HitEvent>('Hit', (e) => this.onHit(e, world));

    // 监听击杀事件
    events.on<KillEvent>('Kill', (e) => this.onKill(e, world));

    // 监听拾取事件
    events.on<PickupEvent>('Pickup', (e) => this.onPickup(e));

    // 监听 Boss 进场（记录遇到）
    events.on<BossEntranceStartEvent>('BossEntranceStart', (e) =>
      this.onBossEntrance(e)
    );

    // 监听 Boss 击杀
    events.on<BossDefeatEvent>('BossDefeat', (e) => this.onBossDefeat(e));

    // 监听游戏胜利
    events.on<VictoryEvent>('Victory', (e) => this.onVictory(e));

    // 监听游戏失败
    events.on<DefeatEvent>('Defeat', () => this.onDefeat());

    // 监听关卡过渡
    events.on<any>('LevelTransitionComplete', (e: any) => {
      if (e.level) {
        this.setCurrentLevel(e.level);
      }
    });
  }

  /**
   * 处理命中事件 - 记录最高伤害
   */
  private async onHit(event: HitEvent, world: World): void {
    const damage = event.damage;
    this.currentSessionDamage = Math.max(this.currentSessionDamage, damage);

    // 更新战机最高伤害
    const stats = this.storage.getFighterStats(this.currentFighterId);
    if (damage > stats.highestDamage) {
      await this.storage.updateFighterStats(this.currentFighterId, {
        highestDamage: damage,
      });
    }
  }

  /**
   * 处理击杀事件
   */
  private async onKill(event: KillEvent, world: World): void {
    this.currentSessionKills++;
    this.currentSessionScore += event.score;

    // 查询被击杀实体的类型
    const components = getComponents(world);
    const victimMeta = components.meta.get(event.victim);

    if (victimMeta?.enemyId) {
      const enemyId = victimMeta.enemyId;
      await this.storage.recordEnemy(
        enemyId,
        true,
        this.currentSessionDamage,
        0
      );
    }
  }

  /**
   * 处理拾取事件
   */
  private async onPickup(event: PickupEvent): void {
    const itemId = event.itemId;

    // 判断是武器还是道具
    if (itemId.startsWith('pickup_weapon_')) {
      const weaponIdStr = itemId.replace('pickup_weapon_', '') as WeaponId;
      await this.storage.recordWeapon(weaponIdStr, this.currentSessionDamage);
    } else if (itemId.startsWith('pickup_buff_')) {
      const buffTypeStr = itemId.replace('pickup_buff_', '') as BuffType;
      await this.storage.recordItem(buffTypeStr);
    }
  }

  /**
   * 处理 Boss 进场 - 记录遇到
   */
  private async onBossEntrance(event: BossEntranceStartEvent): void {
    await this.storage.recordBoss(event.bossId, false);
  }

  /**
   * 处理 Boss 击杀
   */
  private async onBossDefeat(event: BossDefeatEvent): void {
    this.currentSessionBossKills++;
    await this.storage.recordBoss(
      event.bossId,
      true,
      this.currentSessionDamage
    );
  }

  /**
   * 处理游戏胜利
   */
  private async onVictory(event: VictoryEvent): void {
    await this.endGameSession(this.currentSessionScore, event.finalLevel);
  }

  /**
   * 处理游戏失败
   */
  private async onDefeat(): void {
    await this.endGameSession(this.currentSessionScore, this.currentLevel);
  }
}
```

**Step 2: 类型检查**

Run: `pnpm type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/engine/storage/StorageEventListener.ts
git commit -m "feat: 实现存储事件监听器"
```

---

## Task 6: 创建模块导出文件

**Files:**
- Create: `src/engine/storage/index.ts`

**Step 1: 创建导出文件**

```typescript
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
export { IStorageBackend, type StorageResult } from './base/IStorageBackend';
export { LocalStorageBackend } from './base/LocalStorageBackend';

// 常量
export { STORAGE_KEYS, CURRENT_SAVE_VERSION } from './base/constants';
```

**Step 2: 更新 engine/index.ts 导出**

在 `src/engine/index.ts` 中添加 storage 导出：

```typescript
// ... 其他导出

export * from './storage';
```

**Step 3: 类型检查**

Run: `pnpm type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add src/engine/storage/index.ts src/engine/index.ts
git commit -m "feat: 添加存储模块导出"
```

---

## Task 7: 编写单元测试

**Files:**
- Create: `tests/unit/storage/GameStorage.test.ts`
- Create: `tests/unit/storage/LocalStorageBackend.test.ts`

**Step 1: 创建 LocalStorageBackend 测试**

```typescript
// tests/unit/storage/LocalStorageBackend.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalStorageBackend } from '@/engine/storage/base/LocalStorageBackend';

describe('LocalStorageBackend', () => {
  let backend: LocalStorageBackend;

  beforeEach(() => {
    backend = new LocalStorageBackend('test_');
  });

  afterEach(() => {
    backend.clear();
  });

  it('should be available in test environment', () => {
    expect(backend.isAvailable()).toBe(true);
  });

  it('should store and retrieve data', async () => {
    const testData = { foo: 'bar', num: 42 };
    const setResult = await backend.set('test_key', testData);
    expect(setResult.success).toBe(true);

    const getResult = await backend.get<typeof testData>('test_key');
    expect(getResult.success).toBe(true);
    expect(getResult.data).toEqual(testData);
  });

  it('should return error for non-existent key', async () => {
    const result = await backend.get('non_existent');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Key not found');
  });

  it('should remove data', async () => {
    await backend.set('to_remove', { data: 'test' });
    const removeResult = await backend.remove('to_remove');
    expect(removeResult.success).toBe(true);

    const getResult = await backend.get('to_remove');
    expect(getResult.success).toBe(false);
  });

  it('should clear all prefixed keys', async () => {
    await backend.set('key1', 'data1');
    await backend.set('key2', 'data2');

    const clearResult = await backend.clear();
    expect(clearResult.success).toBe(true);

    expect(await backend.get('key1')).toEqual({ success: false, error: 'Key not found' });
    expect(await backend.get('key2')).toEqual({ success: false, error: 'Key not found' });
  });

  it('should use prefix for keys', async () => {
    const backend1 = new LocalStorageBackend('prefix1_');
    const backend2 = new LocalStorageBackend('prefix2_');

    await backend1.set('same_key', 'value1');
    await backend2.set('same_key', 'value2');

    const result1 = await backend1.get('same_key');
    const result2 = await backend2.get('same_key');

    expect(result1.data).toBe('value1');
    expect(result2.data).toBe('value2');
  });
});
```

**Step 2: 创建 GameStorage 测试**

```typescript
// tests/unit/storage/GameStorage.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { GameStorage } from '@/engine/storage/GameStorage';
import { LocalStorageBackend } from '@/engine/storage/base/LocalStorageBackend';
import { FighterId, WeaponId, EnemyId, BossId, BuffType } from '@/engine/types/ids';
import type { IStorageBackend } from '@/engine/storage/base/IStorageBackend';

// Mock storage backend for testing
class MockStorageBackend implements IStorageBackend {
  private store: Record<string, any> = {};

  isAvailable(): boolean {
    return true;
  }

  async get<T>(key: string): Promise<{ success: boolean; data?: T; error?: string }> {
    if (this.store[key] === undefined) {
      return { success: false, error: 'Key not found' };
    }
    return { success: true, data: this.store[key] as T };
  }

  async set<T>(key: string, value: T): Promise<{ success: boolean; error?: string }> {
    this.store[key] = value;
    return { success: true };
  }

  async remove(key: string): Promise<{ success: boolean; error?: string }> {
    delete this.store[key];
    return { success: true };
  }

  async clear(): Promise<{ success: boolean; error?: string }> {
    this.store = {};
    return { success: true };
  }
}

describe('GameStorage', () => {
  let storage: GameStorage;
  let mockBackend: MockStorageBackend;

  beforeEach(() => {
    // Reset singleton
    GameStorage.resetInstance();
    mockBackend = new MockStorageBackend();
    storage = GameStorage.initialize({
      version: 1,
      backend: mockBackend,
    });
  });

  it('should create singleton instance', () => {
    const instance1 = GameStorage.getInstance();
    const instance2 = GameStorage.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should load default save data on first load', async () => {
    const data = await storage.load();

    expect(data.version).toBe(1);
    expect(data.progress.maxLevel).toBe(0);
    expect(data.progress.highScore).toBe(0);
    expect(data.fighters[FighterId.NEON].unlocked).toBe(true);
  });

  it('should save and load data', async () => {
    await storage.load();
    await storage.updateHighScore(5, 10000);

    // Create new instance to simulate reload
    GameStorage.resetInstance();
    const storage2 = GameStorage.initialize({
      version: 1,
      backend: mockBackend,
    });
    const data = await storage2.load();

    expect(data.progress.maxLevel).toBe(5);
    expect(data.progress.highScore).toBe(10000);
  });

  it('should handle version mismatch', async () => {
    let mismatchCalled = false;
    storage = GameStorage.initialize({
      version: 2,
      backend: mockBackend,
      onVersionMismatch: (current, saved) => {
        mismatchCalled = true;
        expect(current).toBe(2);
        expect(saved).toBe(1);
      },
    });

    // Simulate old save data
    await mockBackend.set('game_save', {
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      progress: { maxLevel: 3, highScore: 5000, totalPlayCount: 1, totalPlayTimeMs: 60000 },
      fighters: {},
      weapons: {},
      items: {},
      enemies: {},
      bosses: {},
    });

    const data = await storage.load();

    expect(mismatchCalled).toBe(true);
    expect(data.version).toBe(2); // Should return default save
  });

  it('should record weapon pickup', async () => {
    await storage.load();
    await storage.recordWeapon(WeaponId.LASER, 1000);

    const stats = storage.getWeaponStats(WeaponId.LASER);
    expect(stats.unlocked).toBe(true);
    expect(stats.encounterCount).toBe(1);
    expect(stats.highestDamage).toBe(1000);
  });

  it('should record enemy kill', async () => {
    await storage.load();
    await storage.recordEnemy(EnemyId.NORMAL, true, 500, 100);

    const stats = storage.getEnemyStats(EnemyId.NORMAL);
    expect(stats.unlocked).toBe(true);
    expect(stats.killCount).toBe(1);
    expect(stats.highestDamage).toBe(500);
    expect(stats.highestDamageReceived).toBe(100);
  });

  it('should record boss defeat', async () => {
    await storage.load();
    await storage.recordBoss(BossId.GUARDIAN, true, 2000, 500);

    const stats = storage.getBossStats(BossId.GUARDIAN);
    expect(stats.unlocked).toBe(true);
    expect(stats.killCount).toBe(1);
    expect(stats.highestDamage).toBe(2000);
  });

  it('should update fighter stats', async () => {
    await storage.load();
    await storage.updateFighterStats(FighterId.NEON, {
      totalEnemyKills: 100,
      totalBossKills: 5,
    });

    const stats = storage.getFighterStats(FighterId.NEON);
    expect(stats.totalEnemyKills).toBe(100);
    expect(stats.totalBossKills).toBe(5);
  });

  it('should reset save data', async () => {
    await storage.load();
    await storage.updateHighScore(10, 50000);
    await storage.reset();

    const data = storage.getData();
    expect(data.progress.maxLevel).toBe(0);
    expect(data.progress.highScore).toBe(0);
  });
});
```

**Step 3: 运行测试**

Run: `pnpm test tests/unit/storage/`
Expected: PASS

**Step 4: Commit**

```bash
git add tests/unit/storage/
git commit -m "test: 添加存储模块单元测试"
```

---

## Task 8: 集成到 ReactEngine

**Files:**
- Modify: `src/engine/ReactEngine.ts`

**Step 1: 添加存储初始化**

在 `ReactEngine.ts` 中添加存储相关的属性和方法：

```typescript
// 在类属性中添加
import { GameStorage, StorageEventListener, CURRENT_SAVE_VERSION, LocalStorageBackend } from './storage';

export class ReactEngine {
  // ... 现有属性

  private storage: GameStorage | null = null;
  private storageListener: StorageEventListener | null = null;

  // ... 现有方法

  /**
   * 初始化存储系统
   */
  private async initStorage(): Promise<void> {
    this.storage = GameStorage.initialize({
      version: CURRENT_SAVE_VERSION,
      backend: new LocalStorageBackend('neon_raiden_'),
      onVersionMismatch: (current, saved) => {
        console.warn(`[Storage] 存档版本不匹配: ${saved} -> ${current}`);
        // TODO: 可以触发 UI 提示
      },
    });

    await this.storage.load();

    // 初始化事件监听器
    this.storageListener = new StorageEventListener(this.storage);
    this.storageListener.register(this.world);
  }

  /**
   * 开始新游戏
   */
  startGame(fighterId: FighterId = FighterId.NEON): void {
    this.storageListener?.setCurrentFighter(fighterId);
    this.storageListener?.startGameSession();
  }

  /**
   * 获取存储实例（供其他模块使用）
   */
  getStorage(): GameStorage {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }
    return this.storage;
  }
}
```

**Step 2: 在 initialize 方法中调用 initStorage**

```typescript
async initialize(): Promise<void> {
  // ... 现有初始化代码

  await this.initStorage();

  // ... 其他初始化代码
}
```

**Step 3: 类型检查**

Run: `pnpm type-check`
Expected: PASS

**Step 4: 运行所有测试**

Run: `pnpm test`
Expected: PASS

**Step 5: Lint 检查**

Run: `pnpm lint`
Expected: PASS

**Step 6: Build 检查**

Run: `pnpm build`
Expected: PASS

**Step 7: Commit**

```bash
git add src/engine/ReactEngine.ts
git commit -m "feat: 集成存储模块到 ReactEngine"
```

---

## 完成检查

**Step 1: 最终验证**

运行以下命令确保一切正常：

```bash
# 类型检查
pnpm type-check

# 单元测试
pnpm test

# Lint
pnpm lint

# Build
pnpm build
```

Expected: 全部通过

**Step 2: 最终 Commit**

```bash
git add docs/plans/2026-02-04-storage-module-design.md
git commit -m "docs: 添加存储模块设计文档"
```

---

## 总结

完成此计划后，你将拥有：

1. **完整的存储模块**：支持游戏进度和图鉴数据的持久化
2. **抽象存储接口**：便于未来扩展其他存储后端
3. **事件驱动更新**：通过监听游戏事件自动更新存档
4. **完整的单元测试**：确保代码质量
5. **设计文档**：记录设计决策和架构

后续图鉴模块可以直接使用 `GameStorage.getInstance()` 获取存档数据进行展示。
