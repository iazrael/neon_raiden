# 统一武器系统设计

**日期**: 2025-01-26
**状态**: 已批准

## 问题背景

当前 `WeaponSystem` 只处理玩家武器发射，无法处理敌人和 Boss 武器。核心原因是：

1. `Weapon.id` 类型已支持 `WeaponId | EnemyWeaponId`
2. 但系统只查询 `WEAPON_TABLE`（玩家武器），不查询 `ENEMY_WEAPON_TABLE`
3. `WeaponSpec` 和 `EnemyWeaponSpec` 是两个独立类型，无法统一查询

## 设计方案

### 方案选择：统一武器表

将两个表合并为统一的类型系统，使用 `ALL_WEAPONS_TABLE` 进行查询。

### 类型定义重构

**文件**: `src/engine/blueprints/base.ts`

```typescript
// 统一的武器规格（玩家 + 敌人）
export interface WeaponSpec {
    /** 武器 ID（玩家或敌人） */
    id: WeaponId | EnemyWeaponId;
    /** 使用的弹药类型 */
    ammoType: AmmoType;
    /** 基础冷却时间（毫秒） */
    cooldown: number;
    /** 当前冷却时间（运行时，可选） */
    curCD?: number;
    /** 弹幕模式 */
    pattern: WeaponPattern;
    /** 每次发射的子弹数量 */
    bulletCount: number;
    /** 扩散角度（度），可选 */
    spread?: number;
    /** 穿透次数加成（仅玩家武器使用） */
    pierceBonus?: number;
    /** 反弹次数加成（仅玩家武器使用） */
    bouncesBonus?: number;
    /** 最大等级（仅玩家武器使用） */
    maxLevel?: number;
}

// 删除 EnemyWeaponSpec 接口
```

### 武器表更新

**文件**: `src/engine/blueprints/weapons.ts`

```typescript
// 类型更新为统一类型
export const WEAPON_TABLE: Record<string, WeaponSpec> = {
    // ... 玩家武器
};

export const ENEMY_WEAPON_TABLE: Record<string, WeaponSpec> = {
    // ... 敌人武器
};

// 统一表已有，只需确认类型正确
export const ALL_WEAPONS_TABLE: Record<string, WeaponSpec> = {
    ...WEAPON_TABLE,
    ...ENEMY_WEAPON_TABLE,
};
```

### 武器系统修改

**文件**: `src/engine/systems/WeaponSystem.ts`

1. **导入统一表**:
```typescript
import { WEAPON_TABLE, ALL_WEAPONS_TABLE } from '../blueprints/weapons';
```

2. **使用统一表查询**:
```typescript
const weaponSpec = ALL_WEAPONS_TABLE[weapon.id];
```

3. **处理可选字段**:
```typescript
const finalPierce = ammoSpec.pierce + (weaponSpec.pierceBonus ?? 0);
const finalBounces = ammoSpec.bounces + (weaponSpec.bouncesBonus ?? 0);
```

4. **保持 getWeaponUpgrade 不变**:
```typescript
const upgradeSpec = entity.isPlayer && weapon.id in WEAPON_UPGRADE_TABLE
    ? getWeaponUpgrade(weapon.id as WeaponId, weapon.level || 1)
    : { damageMultiplier: 1.0, fireRateMultiplier: 1.0 };
```

## 修改文件清单

| 文件 | 修改内容 |
|------|----------|
| `src/engine/blueprints/base.ts` | 删除 `EnemyWeaponSpec`，扩展 `WeaponSpec` |
| `src/engine/blueprints/weapons.ts` | 更新类型注解 |
| `src/engine/systems/WeaponSystem.ts` | 使用 `ALL_WEAPONS_TABLE`，处理可选字段 |

## 影响范围

- **改动力度**: 类型定义 1 文件，武器系统 ~10 行
- **向后兼容**: 是，`WeaponSpec` 字段全部可选，敌人武器不需要额外字段
- **性能**: 无影响，合并表在编译时完成

## 后续验证

1. 确认敌人武器能正常发射
2. 确认玩家武器升级功能正常
3. 确认 Boss 武器（各种弹幕模式）正常工作
