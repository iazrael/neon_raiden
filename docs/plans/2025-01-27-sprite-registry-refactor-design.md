# Sprite Registry 重构设计文档

**日期**: 2025-01-27
**目标**: 统一图片资源管理，简化配置，消除重复声明

---

## 问题分析

当前系统存在以下问题：

1. **三处声明**：同一资源需要在 `assets.ts` 声明路径、`SpriteRenderer.ts` 预加载、blueprint 中使用
2. **Key 不一致**：预加载 key 与文件名映射混乱，如 `bullet_enemy_orb` vs `bullet.laser`
3. **字段混乱**：`Sprite` 组件同时有 `texture`（完整路径）和 `spriteKey`（缓存 key）
4. **Hack 代码**：`RenderSystem.getTextureImage()` 需要尝试多种前缀才能找到图片

---

## 设计方案

### 1. SpriteRegistry - 单一真实来源

所有 sprite 配置集中在一个 Registry 中：

```typescript
interface SpriteEntry {
  key: SpriteKey;      // 唯一标识符（枚举值）
  file: string;        // 文件名
  width: number;       // 原始宽度（像素）
  height: number;      // 原始高度（像素）
  pivotX?: number;     // 默认 pivot（可选）
  pivotY?: number;
}

export const SPRITE_REGISTRY: Record<SpriteKey, SpriteEntry> = {
  [SpriteKey.PLAYER]: {
    key: SpriteKey.PLAYER,
    file: 'player.svg',
    width: 64,
    height: 64,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  // ...
};
```

### 2. SpriteKey 枚举 - 类型安全的引用

```typescript
export enum SpriteKey {
  // Fighters
  PLAYER = 'player',
  OPTION = 'option',

  // Bullets (玩家)
  BULLET_VULCAN = 'bullet.vulcan',
  BULLET_LASER = 'bullet.laser',
  BULLET_MISSILE = 'bullet.missile',
  BULLET_WAVE = 'bullet.wave',
  BULLET_PLASMA = 'bullet.plasma',
  BULLET_TESLA = 'bullet.tesla',
  BULLET_MAGMA = 'bullet.magma',
  BULLET_SHURIKEN = 'bullet.shuriken',

  // Bullets (敌人)
  BULLET_ENEMY_ORB = 'bullet.enemy.orb',
  BULLET_ENEMY_BEAM = 'bullet.enemy.beam',
  BULLET_ENEMY_RAPID = 'bullet.enemy.rapid',
  BULLET_ENEMY_HEAVY = 'bullet.enemy.heavy',
  BULLET_ENEMY_HOMING = 'bullet.enemy.homing',
  BULLET_ENEMY_SPIRAL = 'bullet.enemy.spiral',
  BULLET_ENEMY_MISSILE = 'bullet.enemy.missile',
  BULLET_ENEMY_VOID_ORB = 'bullet.enemy.void_orb',
  BULLET_ENEMY_PULSE = 'bullet.enemy.pulse',

  // Enemies
  ENEMY_NORMAL = 'enemy.normal',
  ENEMY_FAST = 'enemy.fast',
  ENEMY_FORTRESS = 'enemy.fortress',
  ENEMY_GUNBOAT = 'enemy.gunboat',
  ENEMY_INTERCEPTOR = 'enemy.interceptor',
  ENEMY_KAMIKAZE = 'enemy.kamikaze',
  ENEMY_PULSAR = 'enemy.pulsar',
  ENEMY_STALKER = 'enemy.stalker',
  ENEMY_TANK = 'enemy.tank',
  ENEMY_BARRAGE = 'enemy.barrage',
  ENEMY_LAYER = 'enemy.layer',

  // Bosses
  BOSS_GUARDIAN = 'boss.guardian',
  BOSS_INTERCEPTOR = 'boss.interceptor',
  BOSS_DESTROYER = 'boss.destroyer',
  BOSS_DOMINATOR = 'boss.dominator',
  BOSS_OVERLORD = 'boss.overlord',
  BOSS_TITAN = 'boss.titan',
  BOSS_COLOSSUS = 'boss.colossus',
  BOSS_LEVIATHAN = 'boss.leviathan',
  BOSS_ANNIHILATOR = 'boss.annihilator',
  BOSS_APOCALYPSE = 'boss.apocalypse',

  // Powerups
  POWERUP_BOMB = 'powerup.bomb',
  POWERUP_HP = 'powerup.hp',
  POWERUP_INVINCIBILITY = 'powerup.invincibility',
  POWERUP_OPTION = 'powerup.option',
  POWERUP_POWER = 'powerup.power',
  POWERUP_TIME_SLOW = 'powerup.time_slow',
  POWERUP_SHIELD = 'powerup.shield',
}
```

### 3. 路径映射规则

| SpriteKey 前缀 | 目录 | 文件名格式 | 示例 |
|---------------|-----------------|------------|------|
| `player`, `option` | `fighters/` | `{key}.svg` | `player` → `fighters/player.svg` |
| `bullet.{name}` | `bullets/` | `bullet_{name}.svg` | `bullet.laser` → `bullets/bullet_laser.svg` |
| `enemy.{name}` | `enemies/` | `enemy_{name}.svg` | `enemy.normal` → `enemies/enemy_normal.svg` |
| `boss.{name}` | `bosses/` | `boss_{name}.svg` | `boss.guardian` → `bosses/boss_guardian.svg` |
| `powerup.{name}` | `powerups/` | `powerup_{name}.svg` | `powerup.hp` → `powerups/powerup_hp.svg` |

敌人子弹特殊处理：`bullet.enemy.{name}` → `bullets/bullet_enemy_{name}.svg`

### 4. 简化 Sprite 组件

```typescript
export class Sprite extends Component {
  constructor(cfg: {
    // 只需要一个 key
    spriteKey: SpriteKey;
    // 可选覆盖
    scale?: number;
    color?: string;
    rotate90?: number;
    hitFlashUntil?: number;
  }) { /* ... */ }

  public spriteKey: SpriteKey;
  public scale: number;
  public color: string;
  public rotate90: number;
  public hitFlashUntil?: number;

  // getter 方法从 registry 获取
  get width(): number { return SpriteManager.getConfig(this.spriteKey).width; }
  get height(): number { return SpriteManager.getConfig(this.spriteKey).height; }
  get pivotX(): number { return SpriteManager.getConfig(this.spriteKey).pivotX ?? 0.5; }
  get pivotY(): number { return SpriteManager.getConfig(this.spriteKey).pivotY ?? 0.5; }
}
```

### 5. SpriteManager - 新的加载管理器

```typescript
export class SpriteManager {
  private static cache = new Map<SpriteKey, HTMLImageElement>();
  private static loadingPromises = new Map<SpriteKey, Promise<HTMLImageElement>>();

  // 根据 registry 自动预加载所有 sprite
  static async preloadAll(): Promise<void> {
    const entries = Object.values(SPRITE_REGISTRY);
    const promises = entries.map(entry => this.loadSprite(entry));
    await Promise.all(promises);
  }

  // 获取图片
  static get(key: SpriteKey): HTMLImageElement | undefined {
    return this.cache.get(key);
  }

  // 获取 sprite 配置
  static getConfig(key: SpriteKey): SpriteEntry {
    return SPRITE_REGISTRY[key];
  }

  // 获取完整路径
  static getPath(key: SpriteKey): string {
    const entry = SPRITE_REGISTRY[key];
    return this.buildPath(key, entry.file);
  }

  private static buildPath(key: string, file: string): string {
    if (key.startsWith('bullet.enemy.')) {
      return `${BASE_ASSET_PATH}bullets/bullet_enemy_${file.replace('bullet_', '')}`;
    }
    if (key.startsWith('bullet.')) {
      return `${BASE_ASSET_PATH}bullets/${file}`;
    }
    if (key.startsWith('enemy.')) {
      return `${BASE_ASSET_PATH}enemies/${file}`;
    }
    if (key.startsWith('boss.')) {
      return `${BASE_ASSET_PATH}bosses/${file}`;
    }
    if (key.startsWith('powerup.')) {
      return `${BASE_ASSET_PATH}powerups/${file}`;
    }
    // fighters (player, option)
    return `${BASE_ASSET_PATH}fighters/${file}`;
  }
}
```

### 6. 简化 RenderSystem

```typescript
function drawSprite(ctx, item, camX, camY, zoom): void {
  const { transform, sprite } = item;
  const config = SpriteManager.getConfig(sprite.spriteKey);
  const image = SpriteManager.get(sprite.spriteKey);

  const screenX = transform.x - camX;
  const screenY = transform.y - camY;

  const width = config.width * sprite.scale * zoom;
  const height = config.height * sprite.scale * zoom;
  const pivotX = width * (config.pivotX ?? 0.5);
  const pivotY = height * (config.pivotY ?? 0.5);

  ctx.save();
  ctx.translate(screenX, screenY);
  ctx.rotate((transform.rot * Math.PI) / 180);

  if (image?.complete) {
    ctx.drawImage(image, -pivotX, -pivotY, width, height);
  } else {
    ctx.fillStyle = sprite.color || '#fff';
    ctx.fillRect(-pivotX, -pivotY, width, height);
  }

  ctx.restore();
}
```

移除 `getTextureImage()` 和 `loadSpriteByKey()` hack 函数。

---

## 文件结构

```
src/engine/
├── configs/
│   └── sprites/
│       ├── index.ts          # SpriteKey 枚举 + SPRITE_REGISTRY
│       ├── fighters.ts       # 战斗机配置
│       ├── bullets.ts        # 子弹配置 + BULLET_SPRITE_MAP
│       ├── enemies.ts        # 敌人配置
│       ├── bosses.ts         # Boss 配置
│       └── powerups.ts       # 道具配置
├── SpriteManager.ts          # 新：替代 SpriteRenderer
├── components/
│   └── render.ts             # 简化 Sprite 组件
└── systems/
    └── RenderSystem.ts       # 简化渲染逻辑
```

---

## Blueprint 使用变化

### 之前
```typescript
Sprite: {
  texture: ASSETS.ENEMIES.normal,
  srcX: 0, srcY: 0, srcW: 40, srcH: 40,
  scale: 1, pivotX: 0.5, pivotY: 0.5
}
```

### 之后
```typescript
Sprite: { spriteKey: SpriteKey.ENEMY_NORMAL, scale: 1 }
```

---

## 迁移步骤

1. **创建 SpriteRegistry**
   - 创建 `src/engine/configs/sprites/index.ts`
   - 定义 `SpriteKey` 枚举和 `SPRITE_REGISTRY`

2. **创建 SpriteManager**
   - 创建 `src/engine/SpriteManager.ts`
   - 实现 `preloadAll()`, `get()`, `getConfig()`

3. **简化 Sprite 组件**
   - 修改 `src/engine/components/render.ts`
   - 移除 texture, srcX, srcY, srcW, srcH, pivotX, pivotY 字段
   - 添加 getter 方法

4. **简化 RenderSystem**
   - 修改 `src/engine/systems/RenderSystem.ts`
   - 使用 `SpriteManager` 替代 `SpriteRenderer`
   - 移除 `getTextureImage()`, `loadSpriteByKey()`

5. **重构 bullets.ts**
   - 修改 `src/engine/configs/sprites/bullets.ts`
   - 改为 `BULLET_SPRITE_MAP` 映射表

6. **更新所有 blueprint**
   - 修改所有 blueprint 文件中的 Sprite 配置

7. **清理旧文件**
   - 删除 `src/engine/configs/assets.ts`
   - 删除 `src/engine/SpriteRenderer.ts`

8. **更新导出**
   - 修改 `src/engine/configs/index.ts`
   - 导出 `SpriteKey` 和 `SPRITE_REGISTRY`

---

## 需要删除的代码

| 文件 | 删除原因 |
|------|---------|
| `src/engine/configs/assets.ts` | 配置合并到 SpriteRegistry |
| `src/engine/SpriteRenderer.ts` | 替换为 SpriteManager |
| `game/` 目录相关代码 | 过时 |

---

## 需要修改的文件

| 文件 | 修改内容 |
|------|---------|
| `src/engine/components/render.ts` | 简化 Sprite 组件 |
| `src/engine/systems/RenderSystem.ts` | 使用 SpriteManager，移除 hack |
| `src/engine/configs/sprites/bullets.ts` | 重构为映射表 |
| `src/engine/blueprints/enemies.ts` | 简化 Sprite 配置 |
| `src/engine/blueprints/bosses.ts` | 简化 Sprite 配置 |
| `src/engine/blueprints/fighters.ts` | 简化 Sprite 配置 |
| `src/engine/blueprints/pickups/*.ts` | 简化 Sprite 配置 |
| `src/engine/configs/index.ts` | 导出 SpriteKey |
