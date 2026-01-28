# 道具掉落和拾取系统 - 代码审查报告

**审查日期：** 2026-01-28
**审查范围：** ECS 架构下的道具掉落和拾取系统
**参考文档：** [DROP_DESIGN.md](../designs/DROP_DESIGN.md)

---

## 📋 审查文件清单

### 新实现（ECS 架构）
- [x] [src/engine/systems/LootSystem.ts](../../src/engine/systems/LootSystem.ts) - 掉落系统
- [x] [src/engine/systems/PickupSystem.ts](../../src/engine/systems/PickupSystem.ts) - 拾取系统
- [x] [src/engine/blueprints/pickups/buffPickups.ts](../../src/engine/blueprints/pickups/buffPickups.ts) - Buff 道具蓝图
- [x] [src/engine/blueprints/pickups/weaponPickups.ts](../../src/engine/blueprints/pickups/weaponPickups.ts) - 武器道具蓝图
- [x] [src/engine/configs/pickupRegistry.ts](../../src/engine/configs/pickupRegistry.ts) - 拾取物注册表
- [x] [src/engine/configs/droptables/common.ts](../../src/engine/configs/droptables/common.ts) - 掉落表配置
- [x] [src/engine/blueprints/enemies.ts](../../src/engine/blueprints/enemies.ts) - 敌人蓝图
- [x] [src/engine/blueprints/bosses.ts](../../src/engine/blueprints/bosses.ts) - Boss 蓝图

### 旧实现参考
- [x] [docs/designs/DROP_DESIGN.md](../designs/DROP_DESIGN.md) - 设计文档
- [x] [game/config/powerups/drops.ts](../../game/config/powerups/drops.ts) - 旧版掉落配置
- [x] [game/config/powerups/powerups.ts](../../game/config/powerups/powerups.ts) - 旧版道具配置

---

## 🔴 CRITICAL 问题（必须立即修复）

### 1. 保底掉落时间系统不一致

**文件：** [src/engine/systems/LootSystem.ts](../../src/engine/systems/LootSystem.ts)

**问题描述：**
保底掉落系统混用了 `Date.now()` 和 `world.time`，导致时间不一致：

```typescript
// LootSystem.ts:172-175 ❌ 使用系统时间
function shouldTriggerGuaranteedDrop(): boolean {
    const now = Date.now();  // 问题：使用系统时间而非世界时间
    return (now - guaranteedDropState.lastDropTime) >= guaranteedDropState.timer;
}

// LootSystem.ts:164 ✅ 使用世界时间
if (guaranteedDropState.lastDropTime === 0) {
    guaranteedDropState.lastDropTime = world.time;
}

// LootSystem.ts:181 ❌ 又使用系统时间
function resetGuaranteedDropTimer(): void {
    guaranteedDropState.lastDropTime = Date.now();
}

// LootSystem.ts:190 ❌ 使用系统时间
export function enableGuaranteedDrop(timerMs: number = 30000): void {
    guaranteedDropState.lastDropTime = Date.now();
}
```

**影响：**
- ❌ 与 ECS 时间系统不同步
- ❌ 暂停/继续游戏时保底计时器不会暂停
- ❌ 可能导致意外的掉落行为

**建议修复：**
```typescript
// 统一使用 world.time
function shouldTriggerGuaranteedDrop(world: World): boolean {
    const now = world.time;  // ✅ 使用世界时间
    return (now - guaranteedDropState.lastDropTime) >= guaranteedDropState.timer;
}

function resetGuaranteedDropTimer(world: World): void {
    guaranteedDropState.lastDropTime = world.time;  // ✅ 使用世界时间
}

export function enableGuaranteedDrop(world: World, timerMs: number = 30000): void {
    guaranteedDropState.enabled = true;
    guaranteedDropState.timer = timerMs;
    guaranteedDropState.lastDropTime = world.time;  // ✅ 使用世界时间
}
```

**相关代码位置：**
- [LootSystem.ts:160](../../src/engine/systems/LootSystem.ts#L160) - `updateGuaranteedDropTimer`
- [LootSystem.ts:172](../../src/engine/systems/LootSystem.ts#L172) - `shouldTriggerGuaranteedDrop`
- [LootSystem.ts:180](../../src/engine/systems/LootSystem.ts#L180) - `resetGuaranteedDropTimer`
- [LootSystem.ts:187](../../src/engine/systems/LootSystem.ts#L187) - `enableGuaranteedDrop`

---

### 2. 精英敌人掉落表配置错误

**文件：** [src/engine/blueprints/enemies.ts](../../src/engine/blueprints/enemies.ts)

**问题描述：**
所有敌人（包括精英敌人）都使用了 `DROPTABLE_COMMON`，但精英敌人应该使用 `DROPTABLE_ELITE`

```typescript
// enemies.ts:140-164 ❌ 精英炮艇使用了普通掉落表
export const BLUEPRINT_ENEMY_ELITE_GUNBOAT: Blueprint = {
    // ...
    Health: { hp: 100, max: 100 },  // 精英单位
    EnemyTag: { id: EnemyId.ELITE_GUNBOAT },
    DropTable: { table: DROPTABLE_COMMON },  // ❌ 应该用 DROPTABLE_ELITE
    // ...
};

// enemies.ts:260-284 ❌ 堡垒敌人（200血量）也使用了普通掉落表
export const BLUEPRINT_ENEMY_FORTRESS: Blueprint = {
    // ...
    Health: { hp: 200, max: 200 },  // 高血量单位
    DropTable: { table: DROPTABLE_COMMON },  // ❌ 应该用 DROPTABLE_ELITE
    // ...
};
```

**影响：**
- ❌ 精英敌人掉落率过低（90% 不掉落）
- ❌ 玩家击败精英敌人后奖励不合理

**建议修复：**
```typescript
// 精英炮艇 - 应该使用 DROPTABLE_ELITE
export const BLUEPRINT_ENEMY_ELITE_GUNBOAT: Blueprint = {
    // ...
    DropTable: { table: DROPTABLE_ELITE },  // ✅ 精英掉落表
    // ...
};

// 堡垒敌人 - 考虑使用 DROPTABLE_ELITE
export const BLUEPRINT_ENEMY_FORTRESS: Blueprint = {
    // ...
    DropTable: { table: DROPTABLE_ELITE },  // ✅ 堡垒也算精英
    // ...
};
```

**掉落率对比：**
| 敌人类型 | 掉落表 | 不掉落率 | Buff掉落 | 武器掉落 |
|---------|--------|---------|---------|---------|
| 普通怪 | DROPTABLE_COMMON | 90% | 9.5% | 0.5% |
| 精英怪（实际） | DROPTABLE_COMMON ❌ | 90% | 9.5% | 0.5% |
| 精英怪（应该） | DROPTABLE_ELITE ✅ | 30% | 50% | 20% |

**相关代码位置：**
- [enemies.ts:160](../../src/engine/blueprints/enemies.ts#L160) - `BLUEPRINT_ENEMY_ELITE_GUNBOAT`
- [enemies.ts:280](../../src/engine/blueprints/enemies.ts#L280) - `BLUEPRINT_ENEMY_FORTRESS`

---

### 3. 缺失动态掉落率调整功能

**文件：** 对比 [game/config/powerups/drops.ts](../../game/config/powerups/drops.ts)

**问题描述：**
旧版实现了完整的动态掉落率系统，新版完全缺失。

**旧版功能（已实现）：**
```typescript
// game/config/powerups/drops.ts:42-49
export function setDropContext(level: number, score: number, weaponLevel: number, hpRatio: number): void {
    currentLevel = level;
    playerScore = score;
    playerWeaponLevel = weaponLevel;
    playerHpRatio = hpRatio;
    updateDynamicDropWeights();  // 根据上下文调整掉率
}

// drops.ts:64-95 动态调整逻辑
function updateDynamicDropWeights(): void {
    // 根据关卡进度调整僚机道具掉率（第5关开始增加）
    if (currentLevel >= 5) {
        dynamicDropWeights[PowerupType.OPTION] += levelBonus;
    }

    // 玩家分数较低时，提高 Power 道具掉率
    if (playerScore < 10000) {
        dynamicDropWeights[PowerupType.POWER] += 5;
    }

    // 玩家生命值较低时，提高 HP 道具掉率
    if (playerHpRatio < 0.3) {
        dynamicDropWeights[PowerupType.HP] += 10;
        dynamicDropWeights[PowerupType.INVINCIBILITY] += 5;
        dynamicDropWeights[PowerupType.TIME_SLOW] += 5;
    }
}
```

**新版状态：** ❌ 完全缺失

**影响：**
- ❌ 无法根据游戏进程调整难度
- ❌ 无法根据玩家状态提供帮助
- ❌ 游戏体验不如旧版流畅

**建议实现方案：**

**方案 A：在 LootSystem 中添加动态权重**
```typescript
// src/engine/systems/LootSystem.ts
interface DropContext {
    level: number;
    playerScore: number;
    playerWeaponLevel: number;
    playerHpRatio: number;
}

let dropContext: DropContext = {
    level: 1,
    playerScore: 0,
    playerWeaponLevel: 1,
    playerHpRatio: 1.0
};

export function setDropContext(ctx: Partial<DropContext>): void {
    dropContext = { ...dropContext, ...ctx };
}

function getAdjustedDropTable(baseTable: DropItemSpec[]): DropItemSpec[] {
    // 根据上下文调整权重
    const adjustedTable = baseTable.map(item => ({ ...item }));

    // 根据玩家生命值调整 HP 掉率
    if (dropContext.playerHpRatio < 0.3) {
        const hpItem = adjustedTable.find(i => i.item === PickupId.HP);
        if (hpItem) hpItem.weight *= 2.0;  // 翻倍
    }

    return adjustedTable;
}
```

**方案 B：在掉落表配置中支持上下文感知**
```typescript
// src/engine/configs/droptables/contextual.ts
export interface ContextualDropItemSpec extends DropItemSpec {
    conditions?: {
        minLevel?: number;
        maxHpRatio?: number;
        minScore?: number;
        weightMultiplier?: number;
    };
}

export const DROPTABLE_COMMON_CONTEXTUAL: ContextualDropItemSpec[] = [
    {
        item: PickupId.HP,
        weight: 10,
        conditions: {
            maxHpRatio: 0.3,
            weightMultiplier: 3.0  // 低血量时翻3倍
        }
    },
    // ...
];
```

---

## 🟠 HIGH 问题（应该尽快修复）

### 4. 武器配置硬编码在 PickupSystem 中

**文件：** [src/engine/systems/PickupSystem.ts](../../src/engine/systems/PickupSystem.ts)

**问题描述：**
违反"配置逻辑分离"原则，武器配置数据硬编码在系统逻辑中。

```typescript
// PickupSystem.ts:186-208 ❌ 配置硬编码
const CONFIG_MAP: Record<WeaponId, {
    ammoType: AmmoType;
    cooldown: number;
    bulletCount: number;
    spread?: number;
    pattern?: WeaponPattern;
}> = {
    [WeaponId.VULCAN]: { ammoType: AmmoType.VULCAN_SPREAD, cooldown: 150, bulletCount: 3, spread: 20, pattern: WeaponPattern.SPREAD },
    [WeaponId.LASER]: { ammoType: AmmoType.LASER_BEAM, cooldown: 200, bulletCount: 1 },
    // ... 所有武器配置
};
```

**影响：**
- ❌ 违反单一职责原则
- ❌ 难以维护和修改
- ❌ 无法在编辑器中配置
- ❌ 配置和逻辑耦合

**建议重构：**

```typescript
// 1. 创建独立的武器配置文件
// src/engine/configs/weapons.ts
export const WEAPON_CONFIGS: Record<WeaponId, WeaponConfig> = {
    [WeaponId.VULCAN]: {
        ammoType: AmmoType.VULCAN_SPREAD,
        cooldown: 150,
        bulletCount: 3,
        spread: 20,
        pattern: WeaponPattern.SPREAD
    },
    // ...
};

// 2. PickupSystem 只负责逻辑
// src/engine/systems/PickupSystem.ts
import { WEAPON_CONFIGS } from '../configs/weapons';

function getWeaponConfig(weaponId: WeaponId): WeaponConfig {
    return WEAPON_CONFIGS[weaponId];
}
```

**相关代码位置：**
- [PickupSystem.ts:186](../../src/engine/systems/PickupSystem.ts#L186) - `getWeaponConfig`

---

### 5. 魔法数字硬编码

**文件：** [src/engine/systems/PickupSystem.ts](../../src/engine/systems/PickupSystem.ts)

**问题描述：**
多个魔法数字硬编码在代码中，应该使用常量定义。

```typescript
// PickupSystem.ts:72 ❌ 魔法数字
existingWeapon.level = Math.min(existingWeapon.level + 1, 5);  // 5 是什么？

// PickupSystem.ts:74 ❌ 魔法数字
existingWeapon.bulletCount = Math.min(existingWeapon.bulletCount + 1, 7);  // 7 是什么？

// PickupSystem.ts:114 ❌ 魔法数字
health.hp = Math.min(health.hp + 30, health.max);  // 30 是什么？

// PickupSystem.ts:136 ❌ 魔法数字
remaining: 3000  // 3秒无敌

// PickupSystem.ts:145 ❌ 魔法数字
remaining: 5000  // 5秒减速
```

**建议修复：**
```typescript
// src/engine/constants/powerups.ts
export const POWERUP_LIMITS = {
    MAX_WEAPON_LEVEL: 5,
    MAX_BULLET_COUNT: 7,
} as const;

export const BUFF_CONFIG = {
    [BuffType.POWER]: {
        levelIncrease: 1,
        maxLevel: 5
    },
    [BuffType.HP]: {
        healAmount: 30,
    },
    [BuffType.INVINCIBILITY]: {
        duration: 3000,  // 3秒
    },
    [BuffType.TIME_SLOW]: {
        duration: 5000,  // 5秒
    }
} as const;

// 使用
import { POWERUP_LIMITS, BUFF_CONFIG } from '../constants/powerups';

existingWeapon.level = Math.min(existingWeapon.level + 1, POWERUP_LIMITS.MAX_WEAPON_LEVEL);
health.hp = Math.min(health.hp + BUFF_CONFIG[BuffType.HP].healAmount, health.max);
```

**相关代码位置：**
- [PickupSystem.ts:72](../../src/engine/systems/PickupSystem.ts#L72)
- [PickupSystem.ts:74](../../src/engine/systems/PickupSystem.ts#L74)
- [PickupSystem.ts:106](../../src/engine/systems/PickupSystem.ts#L106)
- [PickupSystem.ts:114](../../src/engine/systems/PickupSystem.ts#L114)
- [PickupSystem.ts:136](../../src/engine/systems/PickupSystem.ts#L136)
- [PickupSystem.ts:145](../../src/engine/systems/PickupSystem.ts#L145)

---

### 6. BOMB 道具功能不一致

**文件：** [src/engine/systems/PickupSystem.ts](../../src/engine/systems/PickupSystem.ts)

**问题描述：**
BOMB 道具的功能与设计不一致。

**旧版设计：**
```typescript
// game/config/powerups/powerups.ts:33-44
[PowerupType.BOMB]: {
    name: 'Bomb',
    chineseName: '炸弹',
    describe: '获得一枚炸弹',  // ← 应该增加炸弹计数
}
```

**新版实现：**
```typescript
// PickupSystem.ts:118-124 ❌ 直接触发全屏清屏
case BuffType.BOMB:
    // BOMB: 增加炸弹数量（暂未实现炸弹计数）
    // TODO: 实现炸弹系统
    pushEvent(world, { type: 'ScreenClear' });  // ← 直接清屏
    break;
```

**问题分析：**
- ❌ 缺少 `Bomb` 组件来追踪炸弹数量
- ❌ 拾取炸弹道具应该增加炸弹计数，而不是直接使用
- ❌ 玩家应该能主动选择何时使用炸弹

**建议实现：**

```typescript
// 1. 创建 Bomb 组件
// src/engine/components/Bomb.ts
export class Bomb {
    static check = (comp: Component): comp is Bomb => comp instanceof Bomb;

    count: number;  // 炸弹数量
    maxCount: number;

    constructor(count: number = 0, maxCount: number = 3) {
        this.count = count;
        this.maxCount = maxCount;
    }
}

// 2. PickupSystem 正确处理 BOMB 拾取
case BuffType.BOMB:
    const bomb = playerComps.find(Bomb.check);
    if (bomb) {
        bomb.count = Math.min(bomb.count + 1, bomb.maxCount);
    } else {
        playerComps.push(new Bomb(1, 3));
    }
    break;

// 3. InputSystem 处理炸弹使用（玩家按键）
if (inputState.bombKey && bomb && bomb.count > 0) {
    bomb.count--;
    pushEvent(world, { type: 'ScreenClear' });
}
```

**相关代码位置：**
- [PickupSystem.ts:118](../../src/engine/systems/PickupSystem.ts#L118) - BOMB 处理逻辑

---

### 7. 缺失 OPTION 僚机系统的完整实现

**文件：** [src/engine/systems/PickupSystem.ts](../../src/engine/systems/PickupSystem.ts)

**问题描述：**
OPTION 道具完全没有实现，是空操作。

```typescript
// PickupSystem.ts:126-129 ❌ 完全没有实现
case BuffType.OPTION:
    // OPTION: 增加僚机（暂未实现僚机系统）
    // TODO: 实现僚机系统
    break;  // ← 什么都不做
```

**影响：**
- ❌ 玩家拾取 OPTION 道具后没有任何效果
- ❌ 浪费掉落槽位
- ❌ 精英掉落表中包含 OPTION，但实际无效

**建议方案：**

**方案 A：添加基础僚机系统**
```typescript
// 1. 创建 Option 组件
// src/engine/components/Option.ts
export class Option {
    static check = (comp: Component): comp is Option => comp instanceof Option;

    count: number;
    maxCount: number;

    constructor(count: number = 0, maxCount: number = 4) {
        this.count = count;
        this.maxCount = maxCount;
    }
}

// 2. PickupSystem 处理 OPTION 拾取
case BuffType.OPTION:
    const option = playerComps.find(Option.check);
    if (option) {
        option.count = Math.min(option.count + 1, option.maxCount);
    } else {
        playerComps.push(new Option(1, 4));
    }
    break;

// 3. OptionSystem 控制僚机行为
export function OptionSystem(world: World, dt: number): void {
    const player = findPlayer(world);
    if (!player) return;

    const option = player.components.find(Option.check);
    if (!option || option.count === 0) return;

    // 生成僚机实体并跟随玩家
    // ...
}
```

**方案 B：暂时禁用 OPTION 道具**
```typescript
// 如果暂时无法实现僚机系统，应该从掉落表中移除
// 或者在 PickupSystem 中给出明确提示
case BuffType.OPTION:
    console.warn('OPTION 道具暂未实现，请等待后续版本');
    return;  // 不拾取此道具
    break;
```

**相关代码位置：**
- [PickupSystem.ts:126](../../src/engine/systems/PickupSystem.ts#L126) - OPTION 处理逻辑

---

## 🟡 MEDIUM 问题（可以稍后优化）

### 8. autoPickup 属性未使用

**文件：** [src/engine/blueprints/pickups/buffPickups.ts](../../src/engine/blueprints/pickups/buffPickups.ts)

**问题描述：**
所有道具都设置了 `autoPickup: true`，但没有系统使用这个属性。

```typescript
// buffPickups.ts:23 ⚠️ 配置存在但无逻辑
PickupItem: { kind: 'buff', blueprint: BuffType.POWER, autoPickup: true },
```

**影响：**
- ⚠️ 玩家需要精确移动到道具位置才能拾取
- ⚠️ 游戏体验不够流畅
- ⚠️ 与经典射击游戏的"磁吸拾取"机制不符

**建议实现：**
```typescript
// src/engine/systems/PickupMagnetSystem.ts
export function PickupMagnetSystem(world: World, dt: number): void {
    const pickups = findAllPickups(world);
    const player = findPlayer(world);
    if (!player) return;

    const playerTransform = player.components.find(Transform.check);
    if (!playerTransform) return;

    for (const pickup of pickups) {
        const pickupItem = pickup.components.find(PickupItem.check);
        const transform = pickup.components.find(Transform.check);

        if (!pickupItem || !transform) continue;

        // 只有设置了 autoPickup 的道具才会被磁吸
        if (!pickupItem.autoPickup) continue;

        // 计算距离
        const dx = playerTransform.x - transform.x;
        const dy = playerTransform.y - transform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 150 像素内开始磁吸
        if (dist < 150) {
            const velocity = pickup.components.find(Velocity.check);
            if (velocity) {
                // 向玩家移动
                const speed = 400;  // 磁吸速度
                velocity.vx = (dx / dist) * speed;
                velocity.vy = (dy / dist) * speed;
            }
        }
    }
}
```

**相关代码位置：**
- [buffPickups.ts:23](../../src/engine/blueprints/pickups/buffPickups.ts#L23)
- [weaponPickups.ts:22](../../src/engine/blueprints/pickups/weaponPickups.ts#L22)

---

### 9. 保底掉落计时器更新逻辑问题

**文件：** [src/engine/systems/LootSystem.ts](../../src/engine/systems/LootSystem.ts)

**问题描述：**
只有成功掉落道具时才更新保底计时器，空掉落时不更新。

```typescript
// LootSystem.ts:121-126
if (selectedItem && selectedItem.item !== PickupId.NONE) {
    spawnPickupFromItem(world, selectedItem.item, x, y);
    guaranteedDropState.lastDropTime = world.time;  // ⚠️ 只在这里更新
}
```

**问题分析：**
- 如果随机到 `NONE`，保底计时器不会更新
- 这意味着敌人死亡但没有掉落道具时，保底计时不会推进
- 可能导致保底掉落频率低于预期

**建议：**
```typescript
// 方案 A：无论是否掉落都更新计时器
rollAndSpawnLoot(world, dropTable.table, transform.x, transform.y);
guaranteedDropState.lastDropTime = world.time;  // ✅ 敌人死亡就更新

// 方案 B：只在成功掉落时更新（当前方案），但添加注释
// 保底计时器只在成功掉落时更新，空掉落不计入
if (selectedItem && selectedItem.item !== PickupId.NONE) {
    spawnPickupFromItem(world, selectedItem.item, x, y);
    guaranteedDropState.lastDropTime = world.time;  // 只有实际掉落才重置
}
```

**相关代码位置：**
- [LootSystem.ts:121](../../src/engine/systems/LootSystem.ts#L121)

---

### 10. 道具掉落位置偏移较小

**文件：** [src/engine/systems/LootSystem.ts](../../src/engine/systems/LootSystem.ts)

**问题描述：**
道具掉落位置偏移范围较小，容易导致道具重叠。

```typescript
// LootSystem.ts:141-142
const offsetX = (Math.random() - 0.5) * 20;  // ±10 像素
const offsetY = (Math.random() - 0.5) * 20;  // ±10 像素
```

**问题：**
- 道具尺寸为 24x24 像素
- ±10 像素偏移容易导致重叠
- 多个道具堆叠时玩家只能拾取一个

**建议：**
```typescript
// 增加偏移范围到 40-60 像素
const offsetX = (Math.random() - 0.5) * 60;  // ±30 像素
const offsetY = (Math.random() - 0.5) * 60;  // ±30 像素
```

**相关代码位置：**
- [LootSystem.ts:141](../../src/engine/systems/LootSystem.ts#L141)

---

### 11. 掉落表索引导出问题

**文件：** [src/engine/configs/droptables/common.ts](../../src/engine/configs/droptables/common.ts)

**问题描述：**
定义了 `DROPTABLE_ELITE` 但没有被任何敌人使用。

```typescript
// common.ts:22-30 ⚠️ 定义了但未使用
export const DROPTABLE_ELITE: DropItemSpec[] = [
    { item: PickupId.NONE, weight: 30 },
    { item: PickupId.POWER, weight: 30 },
    { item: PickupId.HP, weight: 10 },
    { item: PickupId.OPTION, weight: 10 },
    { item: PickupId.LASER, weight: 10 },
    { item: PickupId.MISSILE, weight: 10 },
];
```

**影响：**
- 精英敌人使用了普通掉落表（见问题 #2）
- OPTION 道具在精英掉落表中，但实际不会掉落（因为没被使用）

**建议：**
- ✅ 修复精英敌人的掉落表配置（见问题 #2）
- 或暂时删除 `DROPTABLE_ELITE`，等实现后再启用

**相关代码位置：**
- [common.ts:22](../../src/engine/configs/droptables/common.ts#L22) - `DROPTABLE_ELITE`

---

## ✅ 正确的实现（值得肯定）

### 1. ECS 架构清晰
- ✅ 职责分离良好：LootSystem 负责掉落，PickupSystem 负责拾取
- ✅ 使用事件驱动解耦系统
- ✅ 组件化设计易于扩展

### 2. 权重随机算法正确
- ✅ [LootSystem.ts:89-127](../../src/engine/systems/LootSystem.ts#L89-L127) 实现正确
- ✅ 支持权重分配和空掉落

### 3. 蓝图注册表设计合理
- ✅ [pickupRegistry.ts](../../src/engine/configs/pickupRegistry.ts) 设计清晰
- ✅ ID 到蓝图的映射关系明确

### 4. Boss 掉落表配置正确
- ✅ [bosses.ts:53](../../src/engine/blueprints/bosses.ts#L53) 所有 Boss 都正确使用 `DROPTABLE_BOSS`
- ✅ Boss 100% 掉落高级武器

### 5. 类型安全
- ✅ 使用 TypeScript 类型守卫（[PickupSystem.ts:164](../../src/engine/systems/PickupSystem.ts#L164) `isWeaponId`, [PickupSystem.ts:171](../../src/engine/systems/PickupSystem.ts#L171) `isBuffType`）
- ✅ 使用枚举和常量避免魔术字符串

---

## 📊 功能对比总结

| 功能 | 旧版实现 | 新版实现 | 状态 |
|------|---------|---------|------|
| 基础掉落系统 | ✅ | ✅ | ✅ 正常 |
| 权重随机算法 | ✅ | ✅ | ✅ 正常 |
| 武器拾取/升级 | ✅ | ✅ | ✅ 正常 |
| Buff 道具拾取 | ✅ | ✅ | ✅ 正常 |
| **动态掉落率** | ✅ | ❌ | ❌ **缺失** |
| **精英掉落表** | ❌ | ⚠️ | ⚠️ **配置错误** |
| 保底掉落系统 | ❌ | ⚠️ | ⚠️ **时间不一致** |
| **炸弹计数系统** | ⚠️ | ❌ | ❌ **功能不一致** |
| **僚机系统** | ⚠️ | ❌ | ❌ **完全缺失** |
| 自动拾取（磁吸） | ❌ | ⚠️ | ⚠️ 有配置无逻辑 |
| 掉落表配置文件 | ❌ | ✅ | ✅ 已实现 |

---

## 🔧 修复优先级建议

### P0 - 必须立即修复（影响核心功能）
1. ✅ **保底掉落时间系统** - 统一使用 `world.time`
2. ✅ **精英敌人掉落表配置** - 使用 `DROPTABLE_ELITE`
3. ✅ **添加动态掉落率调整功能** - 根据玩家状态调整

### P1 - 应该尽快修复（影响游戏体验）
4. ✅ **分离武器配置到独立文件** - 遵循配置逻辑分离原则
5. ✅ **实现/统一 BOMB 道具** - 添加炸弹计数系统
6. ✅ **添加魔法数字常量** - 提高代码可维护性

### P2 - 可以稍后优化（锦上添花）
7. ⚠️ **实现 OPTION 僚机系统** - 或暂时禁用
8. ⚠️ **实现 autoPickup 磁吸逻辑** - 提升游戏体验
9. ⚠️ **增加掉落位置偏移范围** - 避免道具重叠
10. ⚠️ **优化保底掉落计时器更新逻辑** - 明确设计意图

---

## 📝 待办事项清单

- [ ] **修复保底掉落时间系统**
  - [ ] 将所有 `Date.now()` 替换为 `world.time`
  - [ ] 更新函数签名接收 `world` 参数
  - [ ] 添加单元测试验证时间一致性

- [ ] **修复精英敌人掉落表配置**
  - [ ] `BLUEPRINT_ENEMY_ELITE_GUNBOAT` 改用 `DROPTABLE_ELITE`
  - [ ] `BLUEPRINT_ENEMY_FORTRESS` 改用 `DROPTABLE_ELITE`
  - [ ] 验证其他高血量敌人是否需要调整

- [ ] **实现动态掉落率调整**
  - [ ] 创建 `DropContext` 接口
  - [ ] 实现 `setDropContext` 函数
  - [ ] 实现权重调整逻辑
  - [ ] 集成到 `LootSystem`

- [ ] **分离武器配置**
  - [ ] 创建 `src/engine/configs/weapons.ts`
  - [ ] 从 `PickupSystem` 中迁移配置
  - [ ] 更新导入路径

- [ ] **重构 BOMB 道具**
  - [ ] 创建 `Bomb` 组件
  - [ ] 修改 `PickupSystem` 处理逻辑
  - [ ] 在 `InputSystem` 中添加炸弹使用逻辑

- [ ] **添加常量定义**
  - [ ] 创建 `src/engine/constants/powerups.ts`
  - [ ] 提取所有魔法数字
  - [ ] 更新引用

- [ ] **实现或禁用 OPTION**
  - [ ] 评估僚机系统实现复杂度
  - [ ] 决定实现或禁用
  - [ ] 更新掉落表配置

---

## 🎯 总结

新版 ECS 架构的掉落和拾取系统整体设计良好，代码结构清晰，但存在以下主要问题：

1. **时间系统不一致** - 保底掉落混用 `Date.now()` 和 `world.time`
2. **掉落表配置错误** - 精英敌人使用了普通掉落表
3. **动态掉落率缺失** - 无法根据玩家状态调整掉率
4. **部分功能未实现** - BOMB、OPTION 道具功能不完整

建议按照优先级逐项修复，确保游戏体验的流畅性和可玩性。

---

**审查人：** Claude Code
**审查日期：** 2026-01-28
**下次审查：** 修复完成后
