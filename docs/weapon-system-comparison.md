# 武器系统新旧版本对比分析

> 本文档对比分析老版本（`game/`）和新版本（`src/engine/`）的武器、子弹和升级配置及实现的异同，为新版本的武器实现方案提供决策依据。

## 目录

- [1. 架构设计差异](#1-架构设计差异)
- [2. 武器配置对比](#2-武器配置对比)
- [3. 子弹配置对比](#3-子弹配置对比)
- [4. 升级系统对比](#4-升级系统对比)
- [5. 新旧版本映射表](#5-新旧版本映射表)
- [6. 新版本实现方案建议](#6-新版本实现方案建议)

---

## 1. 架构设计差异

### 1.1 老版本架构（game/）

```
WeaponConfig ──┐
               ├──> WeaponSystem.firePlayerWeapon()
BulletConfigs ─┘        │
                        ├──> 伤害: baseDamage + (level × damagePerLevel)
                        ├──> 射速: baseFireRate - (level × ratePerLevel)
                        └──> 增强效果: bulletCount, bulletWidth, chainCount...
```

**特点**：
- 武器和子弹配置**耦合**在一起
- `WeaponConfig` 直接内嵌 `bullet: BulletConfigs[XXX]`
- 伤害计算采用**加法模式**（线性增长）
- 升级增强采用**直接属性修改**模式

### 1.2 新版本架构（src/engine/）

```
WEAPON_TABLE ──> WeaponSpec ───┐
                                 ├──> WeaponSystem.fireWeapon()
AMMO_TABLE ───> AmmoSpec ───────┘      │
                                         ├──> 伤害: ammo.damage × damageMultiplier
                                         ├──> 冷却: weapon.cooldown / fireRateMultiplier
                                         └──> 属性: ammo.pierce + weapon.pierceBonus
```

**特点**：
- 武器和弹药配置**完全分离**
- `WeaponSpec` 通过 `ammoType` 引用 `AmmoSpec`
- 伤害计算采用**乘法模式**（百分比倍率）
- 升级增强采用**倍率叠加**模式

---

## 2. 武器配置对比

### 2.1 老版本 WeaponConfig（game/config/weapons/weapons.ts）

| 字段 | 说明 | 示例值（VULCAN） |
|------|------|------------------|
| `type` | 武器类型枚举 | `WeaponType.VULCAN` |
| `baseDamage` | 基础伤害 | `12` |
| `damagePerLevel` | 每级增加伤害 | `3` |
| `speed` | 子弹速度 | `15` |
| `baseFireRate` | 基础射速（毫秒） | `150` |
| `ratePerLevel` | 每级射速提升（毫秒减少） | `2` |
| `bullet` | 子弹配置引用 | `BulletConfigs[BulletType.VULCAN]` |
| `maxLevel` | 最大等级 | `6` |
| `attenuation` | 穿透伤害衰减 | `0.25` (LASER) |

**伤害计算公式**：
```typescript
damage = baseDamage + (weaponLevel × damagePerLevel)
// VULCAN Lv6: 12 + (6 × 3) = 30
```

**射速计算公式**：
```typescript
fireRate = Math.max(30, baseFireRate - (weaponLevel × ratePerLevel))
// VULCAN Lv6: Math.max(30, 150 - (6 × 2)) = 138ms
```

### 2.2 新版本 WeaponSpec（src/engine/blueprints/weapons.ts）

| 字段 | 说明 | 示例值（VULCAN） |
|------|------|------------------|
| `id` | 武器ID枚举 | `WeaponId.VULCAN` |
| `ammoType` | 弹药类型引用 | `AmmoType.VULCAN_SPREAD` |
| `cooldown` | 基础冷却（毫秒） | `150` |
| `maxLevel` | 最大等级 | `6` |
| `pattern` | 弹幕模式 | `WeaponPattern.SPREAD` |
| `bulletCount` | 发射数量 | `1` |
| `spread` | 散射角度 | `0` |
| `pierceBonus` | 穿透加成 | `0` |
| `bouncesBonus` | 反弹加成 | `0` |

**特点**：
- **不包含伤害、速度**等弹药属性（已分离到 AmmoSpec）
- 只定义**发射行为**（冷却、数量、模式、加成）

---

## 3. 子弹配置对比

### 3.1 老版本 BulletConfigs（game/config/weapons/bullets.ts）

| 字段 | 说明 | 示例值（VULCAN） |
|------|------|------------------|
| `type` | 子弹类型枚举 | `BulletType.VULCAN` |
| `id` | 唯一标识 | `'bullet_vulcan'` |
| `name` | 英文名 | `'Vulcan Bullet'` |
| `chineseName` | 中文名 | `'中子火神炮'` |
| `describe` | 描述 | 文本描述 |
| `color` | 颜色 | `'#ebdd17ff'` |
| `size` | 尺寸 | `{ width: 10, height: 20 }` |
| `sprite` | 精灵键 | `'bullet_vulcan'` |

### 3.2 新版本 AmmoSpec（src/engine/blueprints/ammo.ts）

| 字段 | 说明 | 示例值（VULCAN_SPREAD） |
|------|------|-------------------------|
| `id` | 弹药类型枚举 | `AmmoType.VULCAN_SPREAD` |
| `damage` | 基础伤害 | `12` |
| `radius` | 碰撞盒半径 | `6` |
| `speed` | 飞行速度（像素/秒） | `800` |
| `pierce` | 可穿透敌人数 | `0` |
| `bounces` | 可反弹次数 | `0` |
| `onHit` | 命中效果ID列表 | `[]` 或 `['explosion']` |

**关键差异**：
- 新版本**包含伤害、速度**等游戏性属性
- 新版本使用**半径**而非尺寸矩形
- 新版本有 **`pierce`/`bounces`** 机制
- 新版本支持 **`onHit` 效果系统**（爆炸、持续伤害等）

---

## 4. 升级系统对比

### 4.1 老版本 WeaponUpgradeConfig（game/config/weapons/upgrades.ts）

**结构**：每个武器有 1-9 级的增强配置

```typescript
// VULCAN 升级配置
{
  1: { bulletCount: 1 },
  2: { bulletCount: 2 },
  3: { bulletCount: 3 },
  ...
  9: { bulletCount: 9 }
}

// MISSILE 升级配置
{
  1: { bulletCount: 1, searchRange: 600, turnSpeed: 4 },
  2: { bulletCount: 2, searchRange: 600, turnSpeed: 4 },
  3: { bulletCount: 3, searchRange: 700, turnSpeed: 8 },
  ...
}

// TESLA 升级配置
{
  1: { chainCount: 2, chainRange: 500 },
  2: { chainCount: 3, chainRange: 700 },
  ...
}
```

**增强属性类型**：
| 属性 | 适用武器 | 效果 |
|------|----------|------|
| `bulletCount` | VULCAN, MISSILE, MAGMA, SHURIKEN | 增加发射子弹数量 |
| `bulletWidth/Height` | LASER, PLASMA, WAVE | 增加子弹尺寸 |
| `beamCount` | LASER | 增加光束数量 |
| `searchRange` | MISSILE | 增加索敌范围 |
| `turnSpeed` | MISSILE | 增加转向速度 |
| `chainCount` | TESLA | 增加连锁次数 |
| `chainRange` | TESLA | 增加连锁范围 |

### 4.2 新版本 WEAPON_UPGRADE_TABLE（src/engine/configs/weapon-upgrades.ts）

**结构**：每个武器只有倍率升级配置

```typescript
// VULCAN 升级配置
{
  levels: [
    { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0 },
    { level: 2, damageMultiplier: 1.2, fireRateMultiplier: 1.1 },
    { level: 3, damageMultiplier: 1.4, fireRateMultiplier: 1.2 },
    ...
  ]
}
```

**增强属性类型**：
| 属性 | 说明 |
|------|------|
| `damageMultiplier` | 伤害倍率（弹药伤害 × 此倍率） |
| `fireRateMultiplier` | 射速倍率（冷却 / 此倍率） |

**当前缺失**：
- ❌ **子弹数量升级**
- ❌ **子弹尺寸升级**
- ❌ **导弹索敌范围/转向速度升级**
- ❌ **特斯拉连锁次数/范围升级**

### 4.3 新版本 WeaponGrowthData（src/engine/configs/weaponGrowth.ts）

**状态**：已定义但**未被使用**

```typescript
// 定义了类似老版本的字段
{
  baseDamage: 2,        // 基础伤害
  damagePerLevel: 3,    // 每级增加伤害
  speed: 15,            // 子弹速度
  baseFireRate: 150,    // 基础射速
  ratePerLevel: 2,      // 每级射速提升
}
```

**问题**：与 `WEAPON_UPGRADE_TABLE` 的倍率模式**冲突**

---

## 5. 新旧版本映射表

### 5.1 伤害系统映射

| 项目 | 老版本 | 新版本（当前） | 新版本（建议） |
|------|--------|----------------|----------------|
| 伤害来源 | `WeaponConfig.baseDamage` | `AmmoSpec.damage` | 保持新版本 |
| 升级方式 | `baseDamage + (level × damagePerLevel)` | `damage × damageMultiplier` | 需补充子弹数量等属性升级 |
| VULCAN Lv6 伤害 | 12 + 6×3 = **30** | 12 × 2.0 = **24** | 需对齐 |

### 5.2 射速系统映射

| 项目 | 老版本 | 新版本（当前） |
|------|--------|----------------|
| 射速来源 | `WeaponConfig.baseFireRate` | `WeaponSpec.cooldown` |
| 升级方式 | `baseFireRate - (level × ratePerLevel)` | `cooldown / fireRateMultiplier` |
| VULCAN Lv6 射速 | 150 - 6×2 = **138ms** | 150 / 1.5 = **100ms** |

> **注意**：新版本的射速提升**比老版本更快**

### 5.3 特殊属性映射

| 属性 | 老版本位置 | 新版本位置 | 状态 |
|------|-----------|-----------|------|
| 子弹数量 | `WeaponUpgradeConfig.bulletCount` | `WeaponSpec.bulletCount` | ⚠️ **静态，未按等级变化** |
| 索敌范围 | `WeaponUpgradeConfig.searchRange` | ❌ 不存在 | **需新增** |
| 转向速度 | `WeaponUpgradeConfig.turnSpeed` | ❌ 不存在 | **需新增** |
| 连锁次数 | `WeaponUpgradeConfig.chainCount` | ❌ 不存在 | **需新增** |
| 连锁范围 | `WeaponUpgradeConfig.chainRange` | ❌ 不存在 | **需新增** |
| 穿透次数 | ❌ 不存在 | `AmmoSpec.pierce` + `WeaponSpec.pierceBonus` | ✅ 新增功能 |
| 反弹次数 | ❌ 不存在 | `AmmoSpec.bounces` + `WeaponSpec.bouncesBonus` | ✅ 新增功能 |
| 穿透衰减 | `WeaponConfig.attenuation` | ❌ 不存在 | **需新增** |

---

## 6. 新版本实现方案建议

### 6.1 核心结论

新版本的 ECS 架构和**弹药-武器分离设计**是正确的方向，但**升级系统不完整**。需要补充以下功能：

1. **完整的升级属性配置**（不仅是倍率）
2. **按等级变化的弹幕参数**（子弹数量、尺寸等）
3. **特殊武器属性**（索敌、连锁等）

### 6.2 建议方案 A：扩展 WEAPON_UPGRADE_TABLE

保留当前倍率模式，扩展支持更多属性：

```typescript
// 建议的新结构
export const WEAPON_UPGRADE_TABLE: Record<WeaponId, WeaponUpgradeSpec> = {
  [WeaponId.VULCAN]: {
    id: WeaponId.VULCAN,
    levels: [
      {
        level: 1,
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        // 新增：按等级变化的属性
        bulletCount: 1,        // 发射数量
        spread: 0,             // 散射角度
        sizeMultiplier: 1.0,   // 尺寸倍率
      },
      {
        level: 2,
        damageMultiplier: 1.1,
        fireRateMultiplier: 1.05,
        bulletCount: 2,
        spread: 5,
      },
      // ...
    ],
  },

  [WeaponId.MISSILE]: {
    id: WeaponId.MISSILE,
    levels: [
      {
        level: 1,
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        bulletCount: 1,
        // 新增：导弹专用属性
        homing: {
          searchRange: 600,
          turnSpeed: 4,
        },
      },
      // ...
    ],
  },

  [WeaponId.TESLA]: {
    id: WeaponId.TESLA,
    levels: [
      {
        level: 1,
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        // 新增：特斯拉专用属性
        chain: {
          count: 2,
          range: 500,
        },
      },
      // ...
    ],
  },
};
```

### 6.3 建议方案 B：使用 WeaponGrowthData + 倍率混合

结合两种模式的优点：

```typescript
// 保留倍率用于全局属性
export const WEAPON_MULTIPLIER_TABLE: Record<WeaponId, MultiplierSpec> = {
  [WeaponId.VULCAN]: {
    damagePerLevel: 1.1,      // 每级 +10% 伤害
    fireRatePerLevel: 1.05,   // 每级 +5% 射速
  },
};

// 使用增长数据用于线性属性
export const WEAPON_GROWTH_DATA: Record<WeaponId, GrowthSpec> = {
  [WeaponId.VULCAN]: {
    bulletCountPerLevel: [1, 2, 3, 4, 5, 6],  // 每级的子弹数量
    spreadPerLevel: [0, 5, 10, 15, 20, 25],   // 每级的散射角
  },
};
```

### 6.4 建议：完整升级配置表

为了与老版本对齐，以下是完整的升级映射：

#### VULCAN（火神炮）

| 等级 | 老版本 bulletCount | 新版本（应配置） | 射速（老） | 射速（新） |
|------|-------------------|-----------------|-----------|-----------|
| 1 | 1 | 1 | 150ms | 150ms |
| 2 | 2 | 2 | 148ms | 136ms |
| 3 | 3 | 3 | 146ms | 125ms |
| 4 | 4 | 4 | 144ms | 115ms |
| 5 | 5 | 5 | 142ms | 107ms |
| 6 | 6 | 6 | 140ms | 100ms |

#### MISSILE（导弹）

| 等级 | bulletCount | searchRange | turnSpeed |
|------|-------------|-------------|-----------|
| 1 | 1 | 600 | 4 |
| 2 | 2 | 600 | 4 |
| 3 | 3 | 700 | 8 |

#### TESLA（特斯拉）

| 等级 | chainCount | chainRange |
|------|------------|------------|
| 1 | 2 | 500 |
| 2 | 3 | 700 |
| 3 | 3 | 1000 |
| 4 | 4 | 1200 |
| 5 | 4 | 1500 |
| 6 | 5 | 1700 |

### 6.5 代码修改建议

**修改 `src/engine/systems/WeaponSystem.ts`**：

```typescript
// 当前代码
const bulletCount = weaponSpec.bulletCount || 1;  // 静态值

// 建议修改
const upgradeConfig = getWeaponUpgrade(weapon.id, weapon.level);
const bulletCount = upgradeConfig.bulletCount ?? weaponSpec.bulletCount ?? 1;

// 支持动态 spread
const spread = upgradeConfig.spread ?? weaponSpec.spread ?? 0;

// 支持导弹专用属性
if (weapon.id === WeaponId.MISSILE && upgradeConfig.homing) {
  const { searchRange, turnSpeed } = upgradeConfig.homing;
  // 传递给 Bullet 组件
}
```

### 6.6 待实现功能清单

| 优先级 | 功能 | 老版本 | 新版本 |
|--------|------|--------|--------|
| 🔴 高 | VULCAN 子弹数量升级 | ✅ | ❌ |
| 🔴 高 | MISSILE 索敌/转向升级 | ✅ | ❌ |
| 🔴 高 | TESLA 连锁升级 | ✅ | ❌ |
| 🔴 高 | LASER 光束数量/宽度升级 | ✅ | ❌ |
| 🟡 中 | WAVE 宽度升级 | ✅ | ❌ |
| 🟡 中 | PLASMA 尺寸升级 | ✅ | ❌ |
| 🟡 中 | MAGMA 子弹数量升级 | ✅ | ❌ |
| 🟡 中 | SHURIKEN 子弹数量升级 | ✅ | ❌ |
| 🟢 低 | 穿透衰减机制 | ✅ | ❌ |

---

## 附录：完整对比表

### A.1 武器类型对照

| 老版本 WeaponType | 新版本 WeaponId | 新版本 AmmoType |
|-------------------|-----------------|-----------------|
| `VULCAN` | `VULCAN` | `VULCAN_SPREAD` |
| `LASER` | `LASER` | `LASER_BEAM` |
| `MISSILE` | `MISSILE` | `MISSILE_HOMING` |
| `WAVE` | `WAVE` | `WAVE_PULSE` |
| `PLASMA` | `PLASMA` | `PLASMA_ORB` |
| `TESLA` | `TESLA` | `TESLA_CHAIN` |
| `MAGMA` | `MAGMA` | `MAGMA_POOL` |
| `SHURIKEN` | `SHURIKEN` | `SHURIKEN_BOUNCE` |

### A.2 数据流向对比

```
老版本数据流向：
WeaponConfig ──> WeaponSystem ──> Entity (子弹)
    │                 │
    └── baseDamage    └── damage = baseDamage + (level × damagePerLevel)
    └── baseFireRate      └── fireRate = baseFireRate - (level × ratePerLevel)

新版本数据流向：
WeaponSpec ──> WeaponSystem ──> Entity (子弹)
    │                 │
    └── ammoType ──────┤
                      └── finalDamage = ammoSpec.damage × damageMultiplier
AmmoSpec ──────────────┤
                      └── finalCD = weaponSpec.cooldown / fireRateMultiplier
```

---

**文档版本**：v1.0
**生成日期**：2026-02-02
**作者**：Claude Code Analysis
