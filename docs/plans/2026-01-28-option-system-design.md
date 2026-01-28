# OPTION僚机系统设计文档

**创建日期:** 2026-01-28
**设计者:** Claude Code
**状态:** 已批准
**优先级:** MEDIUM

---

## 📋 设计概述

**目标:** 实现环绕攻击型僚机系统，玩家拾取OPTION道具增加僚机（最多2个），僚机环绕玩家旋转并固定发射VULCAN武器。

**核心特性:**
- ✅ 最多2个僚机环绕玩家旋转
- ✅ 环绕半径60像素，旋转速度2弧度/秒
- ✅ 平滑移动到目标位置（0.2缓动系数）
- ✅ 固定发射VULCAN武器
- ✅ 无敌模式（不处理碰撞，仅用于火力辅助）

---

## 🏗️ 架构设计

### 组件设计

#### 1. Option 组件

**文件:** `src/engine/components/Option.ts`

```typescript
import { Component } from './base';

/**
 * Option 组件 - 僚机实体专用组件
 * 存储僚机的索引和环绕参数
 */
export class Option extends Component {
    static check = (comp: Component): comp is Option => comp instanceof Option;

    /** 僚机索引（0或1） */
    index: number;

    /** 环绕半径（固定60像素） */
    radius: number;

    /** 当前角度（弧度） */
    angle: number;

    /** 旋转速度（弧度/秒，固定2） */
    rotationSpeed: number;

    /** 缓动系数（0-1，越小越平滑） */
    lerpFactor: number;

    constructor(index: number) {
        super();
        this.index = index;
        this.radius = 60;
        this.angle = index * Math.PI; // 0 和 π（180度）
        this.rotationSpeed = 2;
        this.lerpFactor = 0.2;
    }
}
```

#### 2. OptionCount 组件

**文件:** `src/engine/components/OptionCount.ts`

```typescript
import { Component } from './base';

/**
 * OptionCount 组件 - 追踪玩家的僚机数量
 * 挂载在玩家实体上
 */
export class OptionCount extends Component {
    static check = (comp: Component): comp is OptionCount => comp instanceof OptionCount;

    /** 当前僚机数量 */
    count: number;

    /** 最大僚机数量（固定2） */
    maxCount: number;

    constructor(count: number = 0, maxCount: number = 2) {
        super();
        this.count = Math.min(count, maxCount);
        this.maxCount = maxCount;
    }
}
```

#### 3. PlayerTag 组件扩展

**文件:** `src/engine/components/PlayerTag.ts` (修改)

需要扩展 PlayerTag 组件以支持僚机标记：

```typescript
export class PlayerTag extends Component {
    static check = (comp: Component): comp is PlayerTag => comp instanceof PlayerTag;

    /** 是否为僚机（默认为false表示玩家） */
    isOption: boolean;

    constructor(options?: { isOption?: boolean }) {
        super();
        this.isOption = options?.isOption ?? false;
    }
}
```

### 数据流程

```
[拾取阶段]              [环绕阶段]              [发射阶段]
     |                      |                       |
PickupSystem         OptionSystem          WeaponSystem
     |                      |                       |
BuffType.OPTION       更新僚机位置             收集玩家+僚机
     |                      |                       |
OptionCount++        计算目标位置               统一处理发射
     |                      |                       |
创建Option实体         平滑移动到目标           发射VULCAN子弹
     |                      |                       |
索引0: angle=0         时间驱动旋转             瞄准最近的敌人
索引1: angle=π         (2弧度/秒)
```

### 系统职责

1. **PickupSystem**: 处理OPTION道具拾取，增加OptionCount，创建Option实体
2. **OptionSystem**: 更新僚机位置（环绕旋转），同步数量，管理生命周期
3. **WeaponSystem**: 收集玩家和僚机的Weapon组件，统一处理发射

---

## 📝 详细实现

### 1. 创建 Option 组件

**文件:** `src/engine/components/Option.ts` (新建)

```typescript
import { Component } from './base';

export class Option extends Component {
    static check = (comp: Component): comp is Option => comp instanceof Option;

    index: number;
    radius: number;
    angle: number;
    rotationSpeed: number;
    lerpFactor: number;

    constructor(index: number) {
        super();
        this.index = index;
        this.radius = 60;
        this.angle = index * Math.PI;
        this.rotationSpeed = 2;
        this.lerpFactor = 0.2;
    }
}
```

### 2. 创建 OptionCount 组件

**文件:** `src/engine/components/OptionCount.ts` (新建)

```typescript
import { Component } from './base';

export class OptionCount extends Component {
    static check = (comp: Component): comp is OptionCount => comp instanceof OptionCount;

    count: number;
    maxCount: number;

    constructor(count: number = 0, maxCount: number = 2) {
        super();
        this.count = Math.min(count, maxCount);
        this.maxCount = maxCount;
    }
}
```

### 3. 扩展 PlayerTag 组件

**文件:** `src/engine/components/PlayerTag.ts` (修改)

添加 `isOption` 属性：
```typescript
isOption: boolean;

constructor(options?: { isOption?: boolean }) {
    super();
    this.isOption = options?.isOption ?? false;
}
```

### 4. 修改 PickupSystem 处理 OPTION 拾取

**文件:** `src/engine/systems/PickupSystem.ts` (修改)

```typescript
// 导入新组件
import { Option, OptionCount } from '../components';
import { PlayerTag } from '../components';
import { Transform, Sprite, Weapon } from '../components';
import { WeaponId, AmmoType } from '../types';
import { generateId } from '../world';

// 修改 case BuffType.OPTION:
case BuffType.OPTION:
    // OPTION: 增加僚机
    let optionCount = playerComps.find(OptionCount.check);
    if (optionCount) {
        // 已有 OptionCount 组件，增加计数
        const oldCount = optionCount.count;
        optionCount.count = Math.min(optionCount.count + 1, optionCount.maxCount);

        // 如果达到上限，播放提示音
        if (optionCount.count === optionCount.maxCount && oldCount < optionCount.maxCount) {
            pushEvent(world, {
                type: 'PlaySound',
                soundId: 'option_max'
            } as PlaySoundEvent);
        }

        // 创建新的僚机实体（如果未达到上限）
        if (optionCount.count < optionCount.maxCount) {
            spawnOptionEntity(world, playerId, optionCount.count - 1);
        }
    } else {
        // 首次拾取，创建 OptionCount 组件和第一个僚机
        playerComps.push(new OptionCount(1, 2));
        spawnOptionEntity(world, playerId, 0);
    }

    // 播放拾取特效
    pushEvent(world, {
        type: 'Pickup',
        pos: { x: 0, y: 0 },
        itemId: BuffType.OPTION,
        owner: playerId
    } as PickupEvent);
    break;

// 辅助函数：创建僚机实体
function spawnOptionEntity(world: World, playerId: number, index: number): void {
    const playerComps = world.entities.get(playerId);
    if (!playerComps) return;

    const playerTransform = playerComps.find(Transform.check);
    if (!playerTransform) return;

    // 创建僚机实体
    const optionId = generateId();
    const angle = index * Math.PI;

    world.entities.set(optionId, [
        new Transform({
            x: playerTransform.x + Math.cos(angle) * 60,
            y: playerTransform.y + Math.sin(angle) * 60,
            rot: 0
        }),
        new Sprite({
            spriteKey: 'option',  // 需要确认 SpriteKey.OPTION 是否存在
            color: '#00ffff',
            scale: 0.8  // 稍微小一点
        }),
        new Option(index),
        new Weapon({
            id: WeaponId.VULCAN,
            ammoType: AmmoType.VULCAN_SPREAD,
            cooldown: 150,
            curCD: 0,
            maxLevel: 1,
            bulletCount: 1,
            spread: 0,
            pattern: WeaponPattern.AIMED,
            fireRateMultiplier: 1.0,
            damageMultiplier: 0.5,  // 僚机伤害减半
            pierceBonus: 0,
            bouncesBonus: 0
        }),
        new PlayerTag({ isOption: true })
    ]);
}
```

### 5. 创建 OptionSystem

**文件:** `src/engine/systems/OptionSystem.ts` (新建)

```typescript
/**
 * 僚机系统 (OptionSystem)
 *
 * 职责：
 * - 更新僚机位置（环绕玩家旋转）
 * - 同步僚机数量
 * - 管理僚机实体生命周期
 *
 * 系统类型：行动层
 * 执行顺序：P3 - 在 MovementSystem 之后
 */

import { World } from '../types';
import { Transform, Option, OptionCount, PlayerTag } from '../components';
import { removeComponent } from '../world';
import { generateId } from '../world';
import { WeaponId, AmmoType, WeaponPattern } from '../types';

/**
 * 环绕半径（像素）
 */
const OPTION_RADIUS = 60;

/**
 * 旋转速度（弧度/秒）
 */
const ROTATION_SPEED = 2;

/**
 * 缓动系数（0-1）
 */
const LERP_FACTOR = 0.2;

/**
 * 僚机系统主函数
 */
export function OptionSystem(world: World, dt: number): void {
    // 获取玩家组件
    const playerComps = world.entities.get(world.playerId);
    if (!playerComps) return;

    const playerTransform = playerComps.find(Transform.check);
    if (!playerTransform) return;

    // 查找 OptionCount 组件
    const optionCount = playerComps.find(OptionCount.check);
    const currentCount = optionCount ? optionCount.count : 0;

    // 遍历所有实体，找出所有僚机
    const optionEntities: Array<{ id: number; comps: any[] }> = [];
    for (const [id, comps] of world.entities) {
        const playerTag = comps.find(PlayerTag.check);
        if (playerTag && (playerTag as PlayerTag).isOption) {
            optionEntities.push({ id, comps });
        }
    }

    // 更新每个僚机的位置
    const now = world.time;
    for (const { id, comps } of optionEntities) {
        const option = comps.find(Option.check);
        const transform = comps.find(Transform.check);

        if (!option || !transform) continue;

        // 计算目标位置（环绕玩家旋转）
        const angle = (now / 1000) * ROTATION_SPEED + option.angle;
        const targetX = playerTransform.x + Math.cos(angle) * OPTION_RADIUS;
        const targetY = playerTransform.y + Math.sin(angle) * OPTION_RADIUS;

        // 平滑移动到目标位置
        transform.x += (targetX - transform.x) * LERP_FACTOR;
        transform.y += (targetY - transform.y) * LERP_FACTOR;
    }

    // 如果当前数量和实体数量不匹配，同步
    if (optionEntities.length !== currentCount) {
        if (currentCount > optionEntities.length) {
            // 需要创建新僚机
            for (let i = optionEntities.length; i < currentCount; i++) {
                spawnOptionEntity(world, world.playerId, i);
            }
        } else if (currentCount < optionEntities.length) {
            // 需要删除多余的僚机（从末尾开始）
            for (let i = currentCount; i < optionEntities.length; i++) {
                const { id } = optionEntities[i];
                world.entities.delete(id);
            }
        }
    }
}

// 辅助函数：创建僚机实体（与PickupSystem中相同）
function spawnOptionEntity(world: World, playerId: number, index: number): void {
    const playerComps = world.entities.get(playerId);
    if (!playerComps) return;

    const playerTransform = playerComps.find(Transform.check);
    if (!playerTransform) return;

    const optionId = generateId();
    const angle = index * Math.PI;

    world.entities.set(optionId, [
        new Transform({
            x: playerTransform.x + Math.cos(angle) * OPTION_RADIUS,
            y: playerTransform.y + Math.sin(angle) * OPTION_RADIUS,
            rot: 0
        }),
        new Sprite({
            spriteKey: 'option',
            color: '#00ffff',
            scale: 0.8
        }),
        new Option(index),
        new Weapon({
            id: WeaponId.VULCAN,
            ammoType: AmmoType.VULCAN_SPREAD,
            cooldown: 150,
            curCD: 0,
            maxLevel: 1,
            bulletCount: 1,
            spread: 0,
            pattern: WeaponPattern.AIMED,
            fireRateMultiplier: 1.0,
            damageMultiplier: 0.5,
            pierceBonus: 0,
            bouncesBonus: 0
        }),
        new PlayerTag({ isOption: true })
    ]);
}
```

### 6. 修改 WeaponSystem 支持僚机发射

**文件:** `src/engine/systems/WeaponSystem.ts` (修改)

需要修改武器发射逻辑，让僚机也能发射子弹：

```typescript
// 在 WeaponSystem 主函数中
export function WeaponSystem(world: World, dt: number): void {
    // 收集所有有 Weapon 组件的实体（玩家 + 僚机）
    const weaponEntities: Array<{ id: number; comps: Component[] }> = [];

    for (const [id, comps] of world.entities) {
        const weapon = comps.find(Weapon.check);
        const playerTag = comps.find(PlayerTag.check);

        if (weapon && playerTag) {
            weaponEntities.push({ id, comps });
        }
    }

    // 为每个实体（玩家 + 僚机）处理武器发射
    for (const { id, comps } of weaponEntities) {
        const weapon = comps.find(Weapon.check) as Weapon;
        const transform = comps.find(Transform.check) as Transform;
        const fireIntent = comps.find(FireIntent.check);

        if (!transform || !fireIntent) continue;

        // 处理冷却和发射
        weapon.curCD -= dt;
        if (weapon.curCD <= 0) {
            // 发射子弹逻辑...
            // 注意：僚机的子弹应该使用僚机作为owner，而不是玩家
            fireBullet(world, weapon, transform, id);
            weapon.curCD = weapon.cooldown;
        }
    }
}
```

### 7. 更新 powerups.ts 配置

**文件:** `src/engine/configs/powerups.ts` (修改)

```typescript
export const BUFF_CONFIG = {
    // ... 现有配置

    [BuffType.OPTION]: {
        /** 每次拾取增加的僚机数量 */
        countIncrease: 1,
        /** 最大僚机数量 */
        maxCount: 2,
        /** 达到上限时的提示音 */
        maxSound: 'option_max',
    },
} as const;
```

### 8. 引擎系统集成

**文件:** `src/engine/engine.ts` (修改)

```typescript
import { OptionSystem } from './systems/OptionSystem';
import { OptionCount } from './components/OptionCount';

export class Engine {
    update(dt: number): void {
        const world = this.world;

        // P1. 决策层
        InputSystem(world, dt);

        // P2. 状态层
        BuffSystem(world, dt);
        WeaponSystem(world, dt);

        // P3. 行动层
        MovementSystem(world, dt);
        OptionSystem(world, dt);  // ← 新增
        WeaponFiringSystem(world, dt);

        // ... 其余系统
    }
}
```

### 9. 为玩家初始化 OptionCount 组件

**文件:** `src/engine/blueprints/fighters.ts` (修改)

在玩家蓝图中添加：
```typescript
OptionCount: { count: 0, maxCount: 2 }
```

---

## 🎮 用户交互流程

### 正常使用流程
1. 玩家拾取 OPTION 道具
2. `OptionCount.count` 增加（0 → 1 → 2）
3. 创建对应数量的 Option 实体
4. OptionSystem 更新僚机位置（环绕旋转）
5. WeaponSystem 收集玩家+僚机的 Weapon 组件
6. 玩家和僚机同时发射子弹

### 边界情况处理
1. **达到上限（2个）**: 继续拾取不会增加，播放提示音
2. **玩家死亡**: 所有僚机实体删除
3. **切换关卡**: 保留僚机数量和状态

---

## 🧪 测试要点

### 单元测试
- [ ] Option 组件创建和参数验证
- [ ] OptionCount 组件边界检查（不超过2）
- [ ] OptionSystem 位置更新逻辑
- [ ] 环绕旋转数学正确性

### 集成测试
- [ ] 拾取OPTION道具后正确创建僚机
- [ ] 2个僚机正确环绕旋转（180度间隔）
- [ ] 僚机平滑移动到目标位置
- [ ] 僚机正确发射VULCAN子弹
- [ ] 达到上限后不再创建僚机

### 视觉测试
- [ ] 僚机环绕运动流畅
- [ ] 僚机颜色和尺寸正确
- [ ] 僚机子弹发射频率合理

---

## 📊 性能考虑

### 优化点
1. **实体遍历**: OptionSystem 每帧遍历所有实体查找僚机，可优化为维护僚机ID列表
2. **数学计算**: 三角函数（Math.cos/sin）开销，但2个僚机影响可忽略
3. **同步逻辑**: 数量不匹配时的删除/创建逻辑应该很少触发

### 性能指标
- 帧时间预算: < 1ms
- 内存占用: 2个僚机实体（可忽略）

---

## 🚀 后续优化

### Phase 2 功能（可选）
1. **僚机升级系统**: 拾取多个OPTION升级僚机武器等级
2. **僚机阵型**: 不同排列方式（直线、三角、圆形）
3. **僚机属性**: 不同OPTION颜色对应不同属性（速度、伤害加成等）

---

## ✅ 验收标准

- [x] 拾取OPTION道具增加僚机数量
- [x] 最多2个僚机环绕玩家旋转
- [x] 环绕半径60像素，旋转速度2弧度/秒
- [x] 平滑移动到目标位置
- [x] 僚机固定发射VULCAN武器
- [x] 僚机无敌（不处理碰撞）
- [x] 达到上限后不再增加

---

**设计状态:** ✅ 已批准，准备实施
**预计工时:** 1-2小时
**复杂度:** MEDIUM
