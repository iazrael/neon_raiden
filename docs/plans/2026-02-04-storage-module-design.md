# Storage 模块设计文档

## 概述

设计一个持久化存储模块，用于保存游戏进度、图鉴数据等玩家信息。模块采用分层架构，底层抽象存储接口，上层提供游戏数据管理。

## 目录结构

```
src/engine/storage/
├── base/
│   ├── IStorageBackend.ts      # 存储后端抽象接口
│   ├── LocalStorageBackend.ts  # LocalStorage 实现
│   └── constants.ts            # 常量定义
├── GameStorage.ts              # 核心存档管理器
├── StorageEventListener.ts     # 事件监听器
├── types.ts                    # 类型定义
└── index.ts                    # 导出
```

## 数据类型定义

### EntityStats

图鉴实体的统计数据（武器/道具/敌人/Boss）：

```typescript
interface EntityStats {
  unlocked: boolean;           // 是否已解锁/遇到
  firstSeenAt: number;         // 首次遇到时间戳（毫秒）
  lastSeenAt: number;          // 最后遇到时间戳（毫秒）
  encounterCount: number;      // 遇到次数
  killCount: number;           // 击杀/击败次数
  highestDamage: number;       // 对该实体造成的最高单次伤害
  highestDamageReceived: number; // 被该实体造成的最高单次伤害
}
```

### FighterStats

单个战机的统计数据：

```typescript
interface FighterStats {
  unlocked: boolean;           // 是否已解锁该战机
  firstUsedAt: number;         // 首次使用时间戳（毫秒）
  lastUsedAt: number;          // 最后使用时间戳（毫秒）
  playCount: number;           // 使用该战机游玩次数
  maxLevel: number;            // 该战机达到的最高关卡
  highScore: number;           // 该机位的最高分数
  totalEnemyKills: number;     // 使用该战机累计击杀小怪数
  totalBossKills: number;      // 使用该战机累计击败Boss数
  highestDamage: number;       // 使用该战机造成的最高单次伤害
  totalPlayTimeMs: number;     // 使用该战机累计游戏时长（毫秒）
}
```

### GameProgress

全局游戏进度数据（跨战机的汇总）：

```typescript
interface GameProgress {
  maxLevel: number;            // 通关的最高关卡（所有战机中的最高值）
  highScore: number;           // 最高分数（所有战机中的最高值）
  totalPlayCount: number;      // 总游戏次数
  totalPlayTimeMs: number;     // 总游戏时长（毫秒）
}
```

### GameSaveData

完整的游戏存档：

```typescript
interface GameSaveData {
  version: number;             // 存档版本号（用于迁移检测）
  createdAt: number;           // 存档创建时间
  updatedAt: number;           // 最后更新时间
  progress: GameProgress;      // 全局游戏进度
  fighters: Record<FighterId, FighterStats>;   // 各战机的统计数据
  weapons: Record<WeaponId, EntityStats>;      // 武器图鉴数据
  items: Record<BuffType, EntityStats>;       // 道具图鉴数据
  enemies: Record<EnemyId, EntityStats>;      // 敌人图鉴数据
  bosses: Record<BossId, EntityStats>;        // Boss图鉴数据
}
```

## 存储后端抽象层

### IStorageBackend 接口

```typescript
interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface IStorageBackend {
  get<T>(key: string): Promise<StorageResult<T>>;
  set<T>(key: string, value: T): Promise<StorageResult<void>>;
  remove(key: string): Promise<StorageResult<void>>;
  clear(): Promise<StorageResult<void>>;
  isAvailable(): boolean;
}
```

### LocalStorageBackend

默认实现，使用浏览器 LocalStorage：
- 支持键名前缀（避免与其他应用冲突）
- 自动序列化/反序列化 JSON
- 错误处理和异常捕获

## GameStorage 核心管理器

### 设计模式

- **单例模式**：全局唯一实例
- **依赖注入**：存储后端可配置

### 核心方法

| 方法 | 用途 |
|------|------|
| `initialize(options)` | 初始化单例 |
| `load()` | 加载存档 |
| `save(data)` | 保存存档（实时保存） |
| `reset()` | 重置存档 |
| `getData()` | 获取当前存档数据 |
| `getFighterStats(id)` | 获取战机统计 |
| `getWeaponStats(id)` | 获取武器统计 |
| `getEnemyStats(id)` | 获取敌人统计 |
| `getBossStats(id)` | 获取Boss统计 |
| `getProgress()` | 获取全局进度 |
| `updateFighterStats(id, updates)` | 更新战机统计 |
| `recordWeapon(id, damage)` | 记录武器遇到/解锁 |
| `recordEnemy(id, killed, damage)` | 记录敌人遇到/击杀 |
| `recordBoss(id, killed, damage)` | 记录Boss遇到/击杀 |
| `recordItem(type)` | 记录道具拾取 |
| `updateHighScore(level, score)` | 更新最高分/最高关卡 |

### 版本兼容策略

- 检测存档版本号
- 版本不匹配时触发回调
- 返回默认存档，保留旧存档

## 事件系统集成

通过监听现有游戏事件自动更新存档数据：

| 现有事件 | 用途 |
|---------|------|
| `HitEvent` | 记录最高伤害 |
| `KillEvent` | 记录击杀小怪 |
| `PickupEvent` | 记录武器/道具拾取 |
| `BossDefeatEvent` | 记录Boss击杀 |
| `BossEntranceStartEvent` | 记录Boss遇到 |
| `VictoryEvent` | 记录通关 |
| `DefeatEvent` | 结束游戏会话 |

### StorageEventListener

- 跟踪当前游戏会话（战机、开始时间、击杀数等）
- 监听游戏事件自动更新存档
- 游戏结束时保存会话统计数据

## 集成到 ReactEngine

```typescript
// 初始化
this.storage = GameStorage.initialize({
  version: CURRENT_SAVE_VERSION,
  backend: new LocalStorageBackend('neon_raiden_'),
  onVersionMismatch: (current, saved) => { /* 处理版本不匹配 */ },
});
await this.storage.load();

// 注册事件监听器
this.storageListener = new StorageEventListener(this.storage);
this.storageListener.register(world);

// 游戏流程
startGame(fighterId)      // 开始新游戏会话
endGame(score, level)     // 结束游戏会话
```

## 使用示例（图鉴模块）

```typescript
import { GameStorage } from '@/engine/storage';

const storage = GameStorage.getInstance();

// 获取所有已解锁的武器
const weaponStats = storage.getData().weapons;
const unlockedWeapons = Object.entries(weaponStats)
  .filter(([_, stats]) => stats.unlocked);

// 获取战机统计
const fighterStats = storage.getFighterStats(FighterId.NEON);
console.log(`击杀数: ${fighterStats.totalEnemyKills}`);
console.log(`最高关卡: ${fighterStats.maxLevel}`);

// 获取全局最高分
const progress = storage.getProgress();
console.log(`最高分: ${progress.highScore}`);
```

## 设计决策

| 决策 | 理由 |
|------|------|
| 抽象存储后层 | 便于未来切换到 IndexedDB 或云端存储 |
| 实时保存 | 确保数据不丢失 |
| 单存档 | 简化实现，满足当前需求 |
| 版本检测+提示 | 平衡用户体验和实现复杂度 |
| 事件驱动更新 | 解耦存储逻辑与游戏系统 |
| 完整统计 | 支持丰富的图鉴功能 |

## 未来扩展

- IndexedDB 后端实现（更大存储空间）
- 多槽位存档支持
- 数据迁移机制（旧存档自动升级）
- 云端同步支持
