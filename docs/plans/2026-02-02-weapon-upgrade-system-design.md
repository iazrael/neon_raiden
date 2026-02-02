# 武器升级系统设计文档

**版本**：v1.0
**日期**：2026-02-02
**作者**：Claude Code
**状态**：设计阶段

---

## 目录

- [1. 概述](#1-概述)
- [2. 设计目标](#2-设计目标)
- [3. 类型定义](#3-类型定义)
- [4. 配置数据](#4-配置数据)
- [5. 组件设计](#5-组件设计)
- [6. 系统设计](#6-系统设计)
- [7. 数据流](#7-数据流)
- [8. 实施计划](#8-实施计划)

---

## 1. 概述

### 1.1 背景

新版本（`src/engine/`）的武器系统采用了 ECS 架构，实现了武器-弹药分离设计。但当前升级系统不完整，仅支持伤害倍率和射速倍率，缺失老版本（`game/`）中的关键升级属性：

- 子弹数量升级（VULCAN, MISSILE, MAGMA, SHURIKEN）
- 导弹索敌/转向属性升级（MISSILE）
- 特斯拉连锁属性升级（TESLA）
- 激光光束/宽度属性升级（LASER）

### 1.2 设计范围

本设计采用 **方案 A**：扩展 `WEAPON_UPGRADE_TABLE`，增加按等级变化的属性。

**包含范围**：
- ✅ 核心属性：`bulletCount`, `spread`, `sizeMultiplier`
- ✅ 武器专属属性：MISSILE 的 `homing`, TESLA 的 `chain`, LASER 的 `laser`

**不包含范围**（可后续扩展）：
- ⏸️ 穿透加成 (`pierceBonus`) - 已通过 `WeaponSpec` 支持
- ⏸️ 反弹加成 (`bouncesBonus`) - 已通过 `WeaponSpec` 支持
- ⏸️ 速度倍率 (`speedMultiplier`) - 后续需求

---

## 2. 设计目标

### 2.1 功能目标

| 目标 | 描述 | 优先级 |
|------|------|--------|
| 完整升级属性 | 支持老版本所有升级属性 | P0 |
| 类型安全 | 使用 TypeScript 严格类型检查 | P0 |
| ECS 兼容 | 符合现有 ECS 架构规范 | P0 |
| 可扩展性 | 便于后续添加新属性 | P1 |
| 性能 | 最小化运行时开销 | P1 |

### 2.2 非功能目标

- **可维护性**：配置与逻辑分离，修改升级参数无需改代码
- **可测试性**：升级逻辑纯函数化，便于单元测试
- **向后兼容**：不破坏现有武器基础功能

---

## 3. 类型定义

### 3.1 专属属性类型

在 `src/engine/blueprints/base.ts` 中定义：

```typescript
/**
 * 导弹索敌属性
 */
export interface HomingUpgrade {
  /** 索敌范围（像素） */
  searchRange: number;
  /** 转向速度（弧度/帧） */
  turnSpeed: number;
}

/**
 * 特斯拉连锁属性
 */
export interface ChainUpgrade {
  /** 连锁次数 */
  count: number;
  /** 连锁范围（像素） */
  range: number;
}

/**
 * 激光光束属性
 */
export interface LaserUpgrade {
  /** 光束数量 */
  beamCount: number;
  /** 宽度倍率 */
  widthMultiplier: number;
}
```

### 3.2 扩展的升级配置类型

```typescript
/**
 * 扩展的单级升级配置
 */
export interface WeaponLevelUpgrade {
  /** 等级 */
  level: number;
  /** 伤害倍率 */
  damageMultiplier: number;
  /** 射速倍率 */
  fireRateMultiplier: number;

  // === 核心属性（可选） ===
  /** 发射子弹数量（覆盖 WeaponSpec.bulletCount） */
  bulletCount?: number;
  /** 散射角度（度数，覆盖 WeaponSpec.spread） */
  spread?: number;
  /** 尺寸倍率（影响 Sprite.scale 和 HitBox.radius） */
  sizeMultiplier?: number;

  // === 专属属性（可选） ===
  /** 导弹索敌配置 */
  homing?: HomingUpgrade;
  /** 特斯拉连锁配置 */
  chain?: ChainUpgrade;
  /** 激光光束配置 */
  laser?: LaserUpgrade;
}

/**
 * 武器升级规格
 */
export interface WeaponUpgradeSpec {
  /** 武器 ID */
  id: WeaponId;
  /** 各等级升级配置 */
  levels: WeaponLevelUpgrade[];
}
```

### 3.3 组件类型

在 `src/engine/components/combat.ts` 中定义：

```typescript
/**
 * 导弹索敌组件
 * 用于自动追踪敌人的子弹
 */
export interface Homing {
  /** 索敌范围（像素） */
  searchRange: number;
  /** 转向速度（弧度/帧） */
  turnSpeed: number;
  /** 当前锁定目标（运行时） */
  targetId?: number;
}

/**
 * 特斯拉连锁组件
 * 用于命中后在敌人间跳跃的子弹
 */
export interface Chain {
  /** 剩余连锁次数 */
  count: number;
  /** 连锁范围（像素） */
  range: number;
  /** 已连锁过的实体ID列表（防重复） */
  chainedIds?: Set<number>;
}
```

---

## 4. 配置数据

### 4.1 完整升级配置表

```typescript
// src/engine/configs/weapon-upgrades.ts

export const WEAPON_UPGRADE_TABLE: Record<WeaponId, WeaponUpgradeSpec> = {
  // ==================== VULCAN ====================
  [WeaponId.VULCAN]: {
    id: WeaponId.VULCAN,
    levels: [
      { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0, bulletCount: 1, spread: 0 },
      { level: 2, damageMultiplier: 1.1, fireRateMultiplier: 1.05, bulletCount: 2, spread: 3 },
      { level: 3, damageMultiplier: 1.2, fireRateMultiplier: 1.1, bulletCount: 3, spread: 6 },
      { level: 4, damageMultiplier: 1.3, fireRateMultiplier: 1.15, bulletCount: 4, spread: 9 },
      { level: 5, damageMultiplier: 1.4, fireRateMultiplier: 1.2, bulletCount: 5, spread: 12 },
      { level: 6, damageMultiplier: 1.5, fireRateMultiplier: 1.25, bulletCount: 6, spread: 15 },
    ],
  },

  // ==================== LASER ====================
  [WeaponId.LASER]: {
    id: WeaponId.LASER,
    levels: [
      { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0, laser: { beamCount: 1, widthMultiplier: 1.0 } },
      { level: 2, damageMultiplier: 1.3, fireRateMultiplier: 1.15, laser: { beamCount: 1, widthMultiplier: 1.5 } },
      { level: 3, damageMultiplier: 1.6, fireRateMultiplier: 1.3, laser: { beamCount: 2, widthMultiplier: 2.0 } },
    ],
  },

  // ==================== MISSILE ====================
  [WeaponId.MISSILE]: {
    id: WeaponId.MISSILE,
    levels: [
      {
        level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0, bulletCount: 1,
        homing: { searchRange: 600, turnSpeed: 0.15 }
      },
      {
        level: 2, damageMultiplier: 1.4, fireRateMultiplier: 1.2, bulletCount: 2,
        homing: { searchRange: 600, turnSpeed: 0.15 }
      },
      {
        level: 3, damageMultiplier: 1.8, fireRateMultiplier: 1.4, bulletCount: 3,
        homing: { searchRange: 700, turnSpeed: 0.20 }
      },
    ],
  },

  // ==================== WAVE ====================
  [WeaponId.WAVE]: {
    id: WeaponId.WAVE,
    levels: [
      { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0, sizeMultiplier: 1.0 },
      { level: 2, damageMultiplier: 1.3, fireRateMultiplier: 1.15, sizeMultiplier: 1.3 },
      { level: 3, damageMultiplier: 1.6, fireRateMultiplier: 1.3, sizeMultiplier: 1.6 },
    ],
  },

  // ==================== PLASMA ====================
  [WeaponId.PLASMA]: {
    id: WeaponId.PLASMA,
    levels: [
      { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0, sizeMultiplier: 1.0 },
      { level: 2, damageMultiplier: 1.25, fireRateMultiplier: 1.1, sizeMultiplier: 1.3 },
      { level: 3, damageMultiplier: 1.5, fireRateMultiplier: 1.2, sizeMultiplier: 1.6 },
      { level: 4, damageMultiplier: 1.75, fireRateMultiplier: 1.3, sizeMultiplier: 1.9 },
      { level: 5, damageMultiplier: 2.0, fireRateMultiplier: 1.4, sizeMultiplier: 2.2 },
      { level: 6, damageMultiplier: 2.5, fireRateMultiplier: 1.5, sizeMultiplier: 2.5 },
    ],
  },

  // ==================== TESLA ====================
  [WeaponId.TESLA]: {
    id: WeaponId.TESLA,
    levels: [
      { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0, chain: { count: 2, range: 500 } },
      { level: 2, damageMultiplier: 1.2, fireRateMultiplier: 1.1, chain: { count: 3, range: 700 } },
      { level: 3, damageMultiplier: 1.4, fireRateMultiplier: 1.2, chain: { count: 3, range: 1000 } },
      { level: 4, damageMultiplier: 1.6, fireRateMultiplier: 1.3, chain: { count: 4, range: 1200 } },
      { level: 5, damageMultiplier: 1.8, fireRateMultiplier: 1.4, chain: { count: 4, range: 1500 } },
      { level: 6, damageMultiplier: 2.0, fireRateMultiplier: 1.5, chain: { count: 5, range: 1700 } },
    ],
  },

  // ==================== MAGMA ====================
  [WeaponId.MAGMA]: {
    id: WeaponId.MAGMA,
    levels: [
      { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0, bulletCount: 2, spread: 15 },
      { level: 2, damageMultiplier: 1.2, fireRateMultiplier: 1.1, bulletCount: 2, spread: 20 },
      { level: 3, damageMultiplier: 1.4, fireRateMultiplier: 1.2, bulletCount: 3, spread: 25 },
      { level: 4, damageMultiplier: 1.6, fireRateMultiplier: 1.3, bulletCount: 3, spread: 30 },
      { level: 5, damageMultiplier: 1.8, fireRateMultiplier: 1.4, bulletCount: 4, spread: 35 },
      { level: 6, damageMultiplier: 2.0, fireRateMultiplier: 1.5, bulletCount: 4, spread: 40 },
    ],
  },

  // ==================== SHURIKEN ====================
  [WeaponId.SHURIKEN]: {
    id: WeaponId.SHURIKEN,
    levels: [
      { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0, bulletCount: 1, spread: 0 },
      { level: 2, damageMultiplier: 1.2, fireRateMultiplier: 1.1, bulletCount: 2, spread: 10 },
      { level: 3, damageMultiplier: 1.4, fireRateMultiplier: 1.2, bulletCount: 3, spread: 15 },
      { level: 4, damageMultiplier: 1.6, fireRateMultiplier: 1.3, bulletCount: 3, spread: 20 },
      { level: 5, damageMultiplier: 1.8, fireRateMultiplier: 1.4, bulletCount: 4, spread: 25 },
      { level: 6, damageMultiplier: 2.0, fireRateMultiplier: 1.5, bulletCount: 4, spread: 30 },
    ],
  },
};
```

### 4.2 辅助函数

```typescript
/**
 * 获取指定武器等级的升级配置
 * @param weaponId 武器 ID
 * @param level 武器等级（从 1 开始）
 * @returns 升级配置，如果未找到则返回默认值
 */
export function getWeaponUpgrade(
  weaponId: WeaponId,
  level: number
): WeaponLevelUpgrade {
  const weaponUpgrades = WEAPON_UPGRADE_TABLE[weaponId];
  if (!weaponUpgrades) {
    return {
      level: 1,
      damageMultiplier: 1.0,
      fireRateMultiplier: 1.0,
    };
  }
  const levelSpec = weaponUpgrades.levels.find((l) => l.level === level);
  return (
    levelSpec || {
      level: 1,
      damageMultiplier: 1.0,
      fireRateMultiplier: 1.0,
    }
  );
}
```

---

## 5. 组件设计

### 5.1 Homing 组件

| 字段 | 类型 | 说明 |
|------|------|------|
| `searchRange` | `number` | 索敌范围（像素），在该范围内搜索敌人 |
| `turnSpeed` | `number` | 转向速度（弧度/帧），控制导弹转向灵敏度 |
| `targetId` | `number \| undefined` | 当前锁定目标的实体 ID（运行时动态更新） |

**行为**：
- 由 `HomingSystem` 每帧更新
- 自动搜索范围内最近的敌人
- 平滑调整飞行方向朝向目标

### 5.2 Chain 组件

| 字段 | 类型 | 说明 |
|------|------|------|
| `count` | `number` | 剩余连锁次数，每次命中后递减 |
| `range` | `number` | 连锁范围（像素），在此范围内寻找下一个目标 |
| `chainedIds` | `Set<number>` | 已连锁过的实体 ID 列表，防止重复连锁 |

**行为**：
- 由 `ChainSystem` 在子弹命中时触发
- 生成新的连锁子弹飞向下一个目标
- 记录已连锁目标防止重复

---

## 6. 系统设计

### 6.1 WeaponSystem 修改

#### 6.1.1 fireWeapon 函数

```typescript
function fireWeapon(
    world: World,
    entity: {
        id: number;
        transform: Transform;
        weapon: Weapon;
        intent?: FireIntent;
        isPlayer: boolean;
    }
): void {
    const { id, transform, weapon, intent } = entity;

    // 获取配置
    const ammoSpec = AMMO_TABLE[weapon.ammoType];
    if (!ammoSpec) return;

    const weaponSpec = ALL_WEAPONS_TABLE[weapon.id];
    if (!weaponSpec) return;

    // 获取升级配置（扩展后的）
    const upgradeConfig = getWeaponUpgrade(weapon.id, weapon.level || 1);

    // === 应用扩展属性 ===
    // 优先使用升级配置，否则使用武器基础配置
    const bulletCount = upgradeConfig.bulletCount ?? weaponSpec.bulletCount ?? 1;
    const spread = upgradeConfig.spread ?? weaponSpec.spread ?? 0;
    const sizeMultiplier = upgradeConfig.sizeMultiplier ?? 1.0;

    // 计算发射角度
    let baseAngle = intent.angle ?? -Math.PI / 2;
    if (entity.isPlayer && intent.angle === undefined) {
        baseAngle = -Math.PI / 2;
    } else if (!entity.isPlayer && intent.angle === undefined) {
        baseAngle = Math.PI / 2;
    }

    const fireContext: FireContext = {
        world,
        transform,
        weapon,
        weaponSpec,
        ammoSpec,
        upgradeConfig,
        sizeMultiplier,
        ownerId: id,
        isPlayer: entity.isPlayer,
    };

    // 根据弹幕模式生成子弹
    if (weaponSpec.pattern === 'radial') {
        fireRadial(fireContext, bulletCount);
    } else if (weaponSpec.pattern === 'spiral') {
        fireSpiral(fireContext, bulletCount, spread, baseAngle);
    } else if (weaponSpec.pattern === 'random') {
        fireRandom(fireContext, bulletCount, spread, baseAngle);
    } else {
        fireSpread(fireContext, bulletCount, spread, baseAngle);
    }

    // 重置冷却
    weapon.curCD = weapon.cooldown / upgradeConfig.fireRateMultiplier;

    // 生成武器发射事件
    pushEvent(world, {
        type: 'WeaponFired',
        pos: { x: transform.x, y: transform.y },
        weaponId: weapon.id,
        owner: id,
    } as WeaponFiredEvent);
}
```

#### 6.1.2 createBullet 函数

```typescript
interface FireContext {
    world: World;
    transform: Transform;
    weapon: Weapon;
    weaponSpec: WeaponSpec;
    ammoSpec: AmmoSpec;
    upgradeConfig: WeaponLevelUpgrade;
    sizeMultiplier: number;
    ownerId: number;
    isPlayer: boolean;
}

function createBullet(ctx: FireContext, angle: number): void {
    const { world, transform, weapon, weaponSpec, ammoSpec, upgradeConfig, sizeMultiplier, ownerId } = ctx;

    // 计算最终属性
    const finalDamage = ammoSpec.damage * upgradeConfig.damageMultiplier;
    const finalPierce = ammoSpec.pierce + (weaponSpec.pierceBonus ?? 0);
    const finalBounces = ammoSpec.bounces + (weaponSpec.bouncesBonus ?? 0);

    // 计算速度向量
    const vx = Math.cos(angle) * ammoSpec.speed;
    const vy = Math.sin(angle) * ammoSpec.speed;

    // === 构建蓝图 ===
    const bulletBlueprint: Blueprint = {
        Transform: { x: transform.x, y: transform.y, rot: angle },
        Velocity: { vx, vy },
        Sprite: {
            spriteKey: spriteSpec.spriteKey,
            color: spriteSpec.color,
            scale: sizeMultiplier,
        },
        Bullet: {
            owner: ownerId,
            ammoType: weapon.ammoType,
            damage: finalDamage,
            pierceLeft: finalPierce,
            bouncesLeft: finalBounces,
        },
        HitBox: {
            shape: 'circle',
            radius: ammoSpec.radius * sizeMultiplier,
            layer: ctx.isPlayer ? CollisionLayer.PlayerBullet : CollisionLayer.EnemyBullet,
        },
        Lifetime: { timer: 3000 },
    };

    // === 添加专属组件 ===
    if (upgradeConfig.homing) {
        bulletBlueprint.Homing = {
            searchRange: upgradeConfig.homing.searchRange,
            turnSpeed: upgradeConfig.homing.turnSpeed,
        };
    }

    if (upgradeConfig.chain) {
        bulletBlueprint.Chain = {
            count: upgradeConfig.chain.count,
            range: upgradeConfig.chain.range,
            chainedIds: new Set(),
        };
    }

    spawnBullet(world, bulletBlueprint, transform.x, transform.y, angle);
}
```

### 6.2 HomingSystem（新增）

**文件**：`src/engine/systems/HomingSystem.ts`

```typescript
/**
 * 导弹索敌系统
 *
 * 职责：
 * - 为带有 Homing 组件的子弹自动寻找最近敌人
 * - 调整飞行方向朝向目标
 *
 * 系统类型：行为层
 * 执行顺序：P4 - 在 VelocitySystem 之后
 */

import { World, view, getEntity, getComponents } from '../world';
import { Transform, Velocity, Homing, Health, EnemyTag } from '../components';
import { getDistance } from '../utils/math';

export function HomingSystem(world: World, dt: number): void {
    for (const [bulletId, [transform, velocity, homing]] of
        view(world, [Transform, Velocity, Homing])) {

        // 验证目标有效性
        if (homing.targetId !== undefined) {
            const target = getEntity(world, homing.targetId);
            const [targetHealth] = getComponents(target, [Health]);
            if (!target || !targetHealth || targetHealth.hp <= 0) {
                homing.targetId = undefined;
            }
        }

        // 搜索新目标
        if (homing.targetId === undefined) {
            let nearestDist = homing.searchRange;
            let nearestId: number | undefined;

            for (const [enemyId, [enemyTransform]] of view(world, [Transform])) {
                // 只追踪敌人
                const enemy = getEntity(world, enemyId);
                if (!enemy || !enemy.some(EnemyTag.check)) continue;

                const dist = getDistance(transform, enemyTransform);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestId = enemyId;
                }
            }
            homing.targetId = nearestId;
        }

        // 调整方向朝向目标
        if (homing.targetId !== undefined) {
            const target = getEntity(world, homing.targetId);
            const [targetTransform] = getComponents(target, [Transform]);

            const dx = targetTransform.x - transform.x;
            const dy = targetTransform.y - transform.y;
            const targetAngle = Math.atan2(dy, dx);

            // 平滑转向
            const currentAngle = Math.atan2(velocity.vy, velocity.vx);
            let angleDiff = targetAngle - currentAngle;
            // 归一化到 [-PI, PI]
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            const maxTurn = homing.turnSpeed;
            const newAngle = currentAngle + Math.max(-maxTurn, Math.min(maxTurn, angleDiff));

            const speed = Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2);
            velocity.vx = Math.cos(newAngle) * speed;
            velocity.vy = Math.sin(newAngle) * speed;
        }
    }
}
```

### 6.3 ChainSystem（新增）

**文件**：`src/engine/systems/ChainSystem.ts`

```typescript
/**
 * 特斯拉连锁系统
 *
 * 职责：
 * - 处理带有 Chain 组件的子弹命中后的连锁逻辑
 * - 在范围内寻找下一个未连锁的敌人并生成连锁子弹
 *
 * 系统类型：事件响应层
 * 执行顺序：P5 - 在 CollisionSystem 之后
 */

import { World, view, getEntity, getComponents, pushEvent } from '../world';
import { Transform, Chain, Health } from '../components';
import { getDistance } from '../utils/math';

/** 连锁闪电事件类型 */
export interface ChainLightningEvent {
    type: 'ChainLightning';
    fromX: number;
    fromY: number;
    toId: number;
    count: number;
    range: number;
    damage: number;
    chainedIds: Set<number>;
}

export function ChainSystem(world: World, dt: number): void {
    // 处理连锁闪电事件
    const events = world.events.filter(
        (e): e is ChainLightningEvent => e.type === 'ChainLightning'
    );

    for (const event of events) {
        const fromX = event.fromX;
        const fromY = event.fromY;
        const count = event.count;
        const range = event.range;

        if (count <= 0) continue;

        // 找到目标位置
        const target = getEntity(world, event.toId);
        if (!target) continue;
        const [targetTransform, targetHealth] = getComponents(target, [Transform, Health]);
        if (!targetTransform || !targetHealth || targetHealth.hp <= 0) continue;

        // 造成伤害
        targetHealth.hp -= event.damage;

        // 生成下一级连锁
        if (count > 1) {
            let nearestDist = range;
            let nearestId: number | undefined;
            const fromPos = { x: targetTransform.x, y: targetTransform.y };

            for (const [enemyId, [enemyTransform, enemyHealth]] of view(world, [Transform, Health])) {
                // 跳过已连锁的和已死亡的
                if (event.chainedIds.has(enemyId)) continue;
                if (enemyHealth.hp <= 0) continue;

                const dist = getDistance(fromPos, enemyTransform);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestId = enemyId;
                }
            }

            if (nearestId !== undefined) {
                const newChainedIds = new Set(event.chainedIds);
                newChainedIds.add(event.toId);

                pushEvent(world, {
                    type: 'ChainLightning',
                    fromX: targetTransform.x,
                    fromY: targetTransform.y,
                    toId: nearestId,
                    count: count - 1,
                    range,
                    damage: event.damage,
                    chainedIds: newChainedIds,
                });
            }
        }
    }

    // 清理已处理的事件
    world.events = world.events.filter(e => e.type !== 'ChainLightning');
}

/**
 * 触发连锁闪电（供 CollisionSystem 调用）
 */
export function triggerChainLightning(
    world: World,
    bulletX: number,
    bulletY: number,
    count: number,
    range: number,
    damage: number,
    firstTargetId: number
): void {
    pushEvent(world, {
        type: 'ChainLightning',
        fromX: bulletX,
        fromY: bulletY,
        toId: firstTargetId,
        count,
        range,
        damage,
        chainedIds: new Set([firstTargetId]),
    });
}
```

---

## 7. 数据流

### 7.1 武器发射流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                          武器发射数据流                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Input: FireIntent + Weapon Component                               │
│                          │                                         │
│                          ▼                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │           WeaponSystem.fireWeapon()                          │   │
│  │                                                             │   │
│  │  1. 获取配置                                                │   │
│  │     ├── weaponSpec = WEAPON_TABLE[weapon.id]                │   │
│  │     ├── ammoSpec = AMMO_TABLE[weapon.ammoType]              │   │
│  │     └── upgradeConfig = getWeaponUpgrade(weapon.id, level)   │   │
│  │                                                             │   │
│  │  2. 应用升级属性                                            │   │
│  │     ├── bulletCount = upgradeConfig.bulletCount ?? 1        │   │
│  │     ├── spread = upgradeConfig.spread ?? 0                  │   │
│  │     ├── sizeMultiplier = upgradeConfig.sizeMultiplier ?? 1  │   │
│  │     └── 专属属性 (homing/chain/laser)                       │   │
│  │                                                             │   │
│  │  3. 生成子弹                                                │   │
│  │     └── createBullet(ctx, angle)                            │   │
│  │         ├── 计算最终伤害                                    │   │
│  │         ├── 应用尺寸倍率                                    │   │
│  │         ├── 添加专属组件                                    │   │
│  │         └── spawnBullet()                                   │   │
│  │                                                             │   │
│  │  4. 重置冷却                                                │   │
│  │     └── curCD = cooldown / fireRateMultiplier               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                          │                                         │
│                          ▼                                         │
│  Output: Bullet Entity                                             │
│    ├── Transform                                                   │
│    ├── Velocity                                                   │
│    ├── Sprite (scale applied)                                     │
│    ├── Bullet (damage applied)                                    │
│    ├── HitBox (radius scaled)                                     │
│    └── Homing/Chain (if applicable)                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 导弹索敌流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                       HomingSystem 每帧执行                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  For each Bullet with Homing Component:                             │
│                                                                     │
│  1. 验证现有目标                                                    │
│     ├── targetId 存在?                                             │
│     ├── 目标实体存在?                                               │
│     └── 目标 Health > 0?                                           │
│         │ 无效 ────────────────────────────┐                       │
│         ▼                               │                         │
│  2. 搜索新目标                           │                         │
│     ├── 遍历所有 Transform + EnemyTag    │                         │
│     ├── 计算距离                         │                         │
│     └── 选择最近的 (dist < searchRange)  │                         │
│         │                               │                         │
│         ▼                               │                         │
│  3. 调整飞行方向                         │◄────────────────────────┘
│     ├── 计算 targetAngle                │
│     ├── 计算 angleDiff                   │
│     ├── 限制转向角度 (≤ turnSpeed)      │
│     └── 更新 Velocity.vx/vy             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.3 特斯拉连锁流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ChainSystem 事件驱动                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Event: ChainLightning                                              │
│    ├── fromX, fromY: 连锁起点                                       │
│    ├── toId: 目标实体 ID                                            │
│    ├── count: 剩余连锁次数                                          │
│    ├── range: 连锁范围                                              │
│    ├── damage: 伤害                                                 │
│    └── chainedIds: 已连锁实体集合                                   │
│                                                                     │
│  处理流程:                                                          │
│                                                                     │
│  1. 对目标造成伤害                                                  │
│     │                                                               │
│     ▼                                                               │
│  2. count > 0 ?                                                     │
│     │                                                               │
│     ├── YES ──> 搜索下一个目标                                     │
│     │            ├── 排除 chainedIds 中的实体                      │
│     │            ├── 排除已死亡实体                                │
│     │            └── 选择最近的 (dist < range)                     │
│     │                   │                                          │
│     │                   ▼                                          │
│     │            生成新的 ChainLightning 事件                      │
│     │            ├── count - 1                                     │
│     │            ├── chainedIds.add(toId)                         │
│     │            └── 递归处理                                      │
│     │                                                              │
│     └── NO ──> 结束连锁                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. 实施计划

### 8.1 文件修改清单

| 文件 | 操作 | 优先级 |
|------|------|--------|
| `src/engine/blueprints/base.ts` | 修改：添加类型定义 | P0 |
| `src/engine/configs/weapon-upgrades.ts` | 重写：新配置数据 | P0 |
| `src/engine/components/combat.ts` | 修改：添加 Homing/Chain | P0 |
| `src/engine/systems/WeaponSystem.ts` | 修改：应用扩展属性 | P0 |
| `src/engine/systems/HomingSystem.ts` | 新增：索敌系统 | P0 |
| `src/engine/systems/ChainSystem.ts` | 新增：连锁系统 | P0 |
| `src/engine/systems/index.ts` | 修改：导出新系统 | P0 |
| `src/engine/events.ts` | 修改：添加 ChainLightningEvent | P1 |

### 8.2 实施顺序

```
阶段 1: 类型定义 (30 min)
├── 修改 base.ts 添加类型接口
└── 验证类型检查通过

阶段 2: 配置数据 (1 hour)
├── 重写 weapon-upgrades.ts
├── 实现 getWeaponUpgrade 函数
└── 验证配置数据完整性

阶段 3: 组件定义 (30 min)
├── 在 combat.ts 添加 Homing 组件
├── 在 combat.ts 添加 Chain 组件
└── 验证组件导出

阶段 4: 武器系统 (1.5 hours)
├── 修改 WeaponSystem.fireWeapon()
├── 修改 createBullet()
├── 更新 FireContext 接口
└── 验证编译通过

阶段 5: 行为系统 (2 hours)
├── 实现 HomingSystem
├── 实现 ChainSystem
├── 添加事件类型
└── 验证系统导出

阶段 6: 集成测试 (1 hour)
├── 注册新系统到主循环
├── 测试各武器升级效果
└── 修复发现的问题
```

### 8.3 测试计划

| 测试项 | 测试内容 | 预期结果 |
|--------|----------|----------|
| VULCAN 升级 | 子弹数量随等级增加 | Lv1=1发, Lv6=6发 |
| VULCAN 升级 | 散射角度随等级增加 | Lv1=0°, Lv6=15° |
| MISSILE 升级 | 子弹数量 + 索敌范围 | Lv1=1发, Lv3=3发, 范围增大 |
| MISSILE 索敌 | 自动追踪敌人 | 子弹转向最近敌人 |
| TESLA 升级 | 连锁次数 + 范围 | Lv1=2次, Lv6=5次 |
| TESLA 连锁 | 命中后连锁下一个敌人 | 在范围内跳跃 |
| LASER 升级 | 光束数量 + 宽度 | Lv1=1束, Lv3=2束 |
| PLASMA 升级 | 尺寸倍率 | Lv1=1.0x, Lv6=2.5x |
| 伤害倍率 | 所有武器 | 伤害随等级正确倍增 |
| 射速倍率 | 所有武器 | 冷却随等级正确缩减 |

---

## 附录

### A. 与老版本映射关系

| 老版本 | 新版本 | 实现方式 |
|--------|--------|----------|
| `WeaponUpgradeConfig.bulletCount` | `upgradeConfig.bulletCount` | 直接覆盖 `WeaponSpec.bulletCount` |
| `WeaponUpgradeConfig.searchRange` | `upgradeConfig.homing.searchRange` | 添加 `Homing` 组件 |
| `WeaponUpgradeConfig.turnSpeed` | `upgradeConfig.homing.turnSpeed` | 添加 `Homing` 组件 |
| `WeaponUpgradeConfig.chainCount` | `upgradeConfig.chain.count` | 添加 `Chain` 组件 |
| `WeaponUpgradeConfig.chainRange` | `upgradeConfig.chain.range` | 添加 `Chain` 组件 |
| `WeaponUpgradeConfig.bulletWidth` | `upgradeConfig.sizeMultiplier` | 影响 `Sprite.scale` |
| `WeaponUpgradeConfig.beamCount` | `upgradeConfig.laser.beamCount` | 特殊处理多光束发射 |
| `baseDamage + level × damagePerLevel` | `damage × damageMultiplier` | 乘法模式 |
| `baseFireRate - level × ratePerLevel` | `cooldown / fireRateMultiplier` | 除法模式 |

### B. 配置对比示例

#### VULCAN 对比

| 等级 | 老版本 bulletCount | 新版本 bulletCount | 老版本 spread | 新版本 spread |
|------|-------------------|-------------------|--------------|--------------|
| 1 | 1 | 1 | - | 0° |
| 2 | 2 | 2 | - | 3° |
| 3 | 3 | 3 | - | 6° |
| 4 | 4 | 4 | - | 9° |
| 5 | 5 | 5 | - | 12° |
| 6 | 6 | 6 | - | 15° |

#### MISSILE 对比

| 等级 | bulletCount | searchRange | turnSpeed |
|------|-------------|-------------|-----------|
| 1 | 1 | 600 | 0.15 |
| 2 | 2 | 600 | 0.15 |
| 3 | 3 | 700 | 0.20 |

#### TESLA 对比

| 等级 | chainCount | chainRange |
|------|------------|------------|
| 1 | 2 | 500 |
| 2 | 3 | 700 |
| 3 | 3 | 1000 |
| 4 | 4 | 1200 |
| 5 | 4 | 1500 |
| 6 | 5 | 1700 |

---

**文档结束**
