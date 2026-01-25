# 武器和子弹系统重构设计

**日期**: 2025-01-25
**状态**: 设计完成，待实现

---

## 背景

当前武器和子弹系统存在职责不清、配置重复的问题：
- `pierce` 和 `bounces` 同时出现在 `WeaponSpec` 和 `AmmoSpec` 中
- 子弹外观配置分散在多个文件
- 武器加成计算逻辑不明确
- 升级系统缺乏统一的配置结构

---

## 设计目标

1. **职责分离** - 弹药数值、外观配置、武器配置各司其职
2. **配置复用** - 多种子弹类型可共用同一纹理（颜色、大小不同）
3. **升级支持** - 武器升级通过加成倍率实现，而非硬编码
4. **简洁清晰** - 每个配置表只关注自己的领域

---

## 架构设计

### 配置表职责划分

```
┌────────────────────┬─────────────────────────────────────┐
│ 配置表              │ 职责                                 │
├────────────────────┼─────────────────────────────────────┤
│ AMMO_TABLE          │ 弹药数值：damage, speed, pierce,    │
│                     │ bounces, radius, onHit              │
├────────────────────┼─────────────────────────────────────┤
│ BULLET_SPRITE_CONFIG│ 弹药外观：texture, color, srcW, srcH,│
│                     │ pivotX, pivotY                      │
├────────────────────┼─────────────────────────────────────┤
│ WEAPON_TABLE        │ 武器配置：ammoType, cooldown,       │
│                     │ pattern, bulletCount, spread,       │
│                     │ pierceBonus, bouncesBonus           │
├────────────────────┼─────────────────────────────────────┤
│ WEAPON_UPGRADE_TABLE│ 升级配置：每级的 damageMultiplier,  │
│                     │ fireRateMultiplier                  │
└────────────────────┴─────────────────────────────────────┘
```

### 数据流

```
WeaponSystem 发射子弹：

1. 获取配置
   ammoSpec = AMMO_TABLE[weapon.ammoType]
   weaponSpec = WEAPON_TABLE[weapon.id]
   upgradeSpec = WEAPON_UPGRADE_TABLE[weapon.id][level - 1]
   spriteSpec = BULLET_SPRITE_CONFIG[weapon.ammoType]

2. 计算最终属性
   damage     = ammoSpec.damage × upgradeSpec.damageMultiplier
   pierce     = ammoSpec.pierce + weaponSpec.pierceBonus
   bounces    = ammoSpec.bounces + weaponSpec.bouncesBonus
   cooldown   = weaponSpec.cooldown / upgradeSpec.fireRateMultiplier
   speed      = ammoSpec.speed (无加成)
   radius     = ammoSpec.radius (无加成)

3. 创建子弹实体
```

---

## 类型定义

### AmmoSpec（弹药数值配置）

```typescript
export interface AmmoSpec {
    id: AmmoType;               // 弹种唯一键
    damage: number;             // 基础伤害
    radius: number;             // 碰撞盒半径（像素）
    speed: number;              // 飞行速度（像素/秒）
    pierce: number;             // 基础穿透次数
    bounces: number;            // 基础反弹次数
    onHit: string[];            // 命中效果 ID 列表
}
```

### SpriteSpec（子弹外观配置）

```typescript
export interface SpriteSpec {
    texture: string;            // 纹理路径
    color: string;              // 着色颜色（hex + alpha）
    srcW: number;               // 源矩形宽度（单帧纹理，srcX/srcY 固定为 0）
    srcH: number;               // 源矩形高度
    pivotX: number;             // 旋转轴心 X（0-1，默认 0.5）
    pivotY: number;             // 旋转轴心 Y（0-1，默认 0.5）
}
```

### WeaponSpec（武器配置）

```typescript
export interface WeaponSpec {
    id: WeaponId;
    ammoType: AmmoType;         // 使用的弹药类型
    cooldown: number;           // 基础冷却时间（毫秒）
    curCD?: number;             // 当前冷却时间（运行时）
    maxLevel?: number;          // 最大等级

    // 弹幕模式
    pattern: WeaponPattern;     // SPREAD | AIMED | RADIAL | SPIRAL | RANDOM
    bulletCount: number;        // 每次发射的子弹数量
    spread?: number;            // 扩散角度（度），默认 0

    // 加成（在弹药基础值上增加）
    pierceBonus: number;        // 穿透次数加成，默认 0
    bouncesBonus: number;       // 反弹次数加成，默认 0
}
```

### WeaponUpgradeSpec（升级配置）

```typescript
export interface WeaponUpgradeSpec {
    id: WeaponId;
    levels: WeaponLevelSpec[];  // 每个等级的加成配置
}

export interface WeaponLevelSpec {
    level: number;              // 等级（从 1 开始）
    damageMultiplier: number;   // 伤害倍率（如 1.0, 1.3, 1.6...）
    fireRateMultiplier: number; // 射速倍率（如 1.0, 1.2, 1.5...）
}
```

---

## 文件结构

```
src/engine/
├── configs/
│   ├── sprites/
│   │   └── bullets.ts          → BULLET_SPRITE_CONFIG
│   ├── ammo.ts                 → AMMO_TABLE
│   ├── weapons.ts              → WEAPON_TABLE
│   └── weapon-upgrades.ts      → WEAPON_UPGRADE_TABLE（新增）
├── blueprints/
│   └── base.ts                 → 类型定义
└── systems/
    └── WeaponSystem.ts         → 发射逻辑
```

---

## 关键修改点

### 1. WeaponSystem.ts

- 移除 `AMMO_SPRITE_MAP`，改用 `BULLET_SPRITE_CONFIG`
- 发射时查找所有相关配置
- 计算最终子弹属性：弹药基础 × 升级倍率 + 武器加成
- 移除硬编码的 `srcX: 0, srcY: 0, srcW: 16, srcH: 16`

### 2. configs/sprites/bullets.ts

- 移除 `size: { width, height }`，改为 `srcW, srcH`
- 重命名为 `BULLET_SPRITE_CONFIG`
- 导出 `SpriteSpec` 类型

### 3. blueprints/ammo.ts

- `AmmoSpec` 只保留数值属性
- 移除任何外观相关配置

### 4. blueprints/weapons.ts

- 移除 `damageMultiplier`、`fireRateMultiplier`（移至升级表）
- 将 `pierce`、`bounces` 改为 `pierceBonus`、`bouncesBonus`
- 设置默认值为 0

### 5. 新建 configs/weapon-upgrades.ts

- 定义 `WEAPON_UPGRADE_TABLE`
- 为每种武器配置各等级的加成倍率

---

## 示例配置

### 升级配置示例

```typescript
export const WEAPON_UPGRADE_TABLE: Record<WeaponId, WeaponUpgradeSpec> = {
    [WeaponId.VULCAN]: {
        id: WeaponId.VULCAN,
        levels: [
            { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0 },
            { level: 2, damageMultiplier: 1.2, fireRateMultiplier: 1.1 },
            { level: 3, damageMultiplier: 1.4, fireRateMultiplier: 1.2 },
            { level: 4, damageMultiplier: 1.6, fireRateMultiplier: 1.3 },
            { level: 5, damageMultiplier: 1.8, fireRateMultiplier: 1.4 },
            { level: 6, damageMultiplier: 2.0, fireRateMultiplier: 1.5 },
        ],
    },
    // ...
};
```

### 外观配置示例

```typescript
export const BULLET_SPRITE_CONFIG: Record<AmmoType, SpriteSpec> = {
    [AmmoType.VULCAN_SPREAD]: {
        texture: ASSETS.BULLETS.vulcan,
        color: '#ebdd17ff',
        srcW: 10, srcH: 20,
        pivotX: 0.5, pivotY: 0.5,
    },
    // 敌人子弹共用纹理，颜色不同
    [AmmoType.ENEMY_ORB_RED]: {
        texture: ASSETS.ENEMIE_BULLETS.orb,
        color: '#ff9999',
        srcW: 14, srcH: 14,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.ENEMY_ORB_BLUE]: {
        texture: ASSETS.ENEMIE_BULLETS.orb,
        color: '#9999ff',
        srcW: 14, srcH: 14,
        pivotX: 0.5, pivotY: 0.5,
    },
    // ...
};
```

---

## 实现计划

1. [ ] 修改 `blueprints/base.ts` - 更新类型定义
2. [ ] 修改 `configs/sprites/bullets.ts` - 改为 BULLET_SPRITE_CONFIG
3. [ ] 修改 `blueprints/ammo.ts` - 移除外观，只保留数值
4. [ ] 修改 `blueprints/weapons.ts` - 更新武器配置
5. [ ] 新建 `configs/weapon-upgrades.ts` - 升级配置表
6. [ ] 修改 `systems/WeaponSystem.ts` - 按新设计计算属性
7. [ ] 检查并更新相关导出和引用
8. [ ] 运行类型检查和测试
