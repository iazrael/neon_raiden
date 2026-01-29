# TIME_SLOW 时间减速重构设计文档

**创建日期:** 2026-01-29
**设计者:** Claude Code
**状态:** 待批准
**优先级:** HIGH

---

## 📋 设计概述

**目标:** 重构 TIME_SLOW Buff 实现,从基于组件的状态管理改为独立的 TimeSlow 实体 + 全局 timeScale,符合 ECS 架构原则。

**当前问题:**
- ❌ `Buff.originalValues` 存储受影响敌人列表,破坏 ECS 数据驱动原则
- ❌ 状态管理复杂,需要手动跟踪和清理受影响的实体
- ❌ 清理逻辑容易出错,敌人被移除时可能造成状态不一致

**解决方案:**
- ✅ TIME_SLOW Buff 创建独立的 TimeSlow 实体(包含 TimeSlow + Lifetime 组件)
- ✅ TimeSlowSystem 每帧根据 TimeSlow 实体设置 `world.state.timeScale`
- ✅ 各系统使用 `view()` 查询状态,自己应用 timeScale
- ✅ CleanSystem 自动清理过期的 TimeSlow 实体
- ✅ 删除 `Buff.originalValues` 字段

**核心特性:**
- 全局时间减速(敌人、敌人子弹、背景变慢 50%)
- 玩家 + 玩家子弹免疫(不受影响)
- 多次拾取刷新 Lifetime(不叠加,不增强)
- 完全符合 ECS 数据驱动架构

---

## 🏗️ 架构设计

### 核心组件设计

#### 1. TimeSlow 组件

**文件:** `src/engine/components/combat.ts` (新增)

```typescript
/**
 * TimeSlow 组件 - 时间减速效果
 * 挂载在独立的 TimeSlow 实体上
 */
export class TimeSlow extends Component {
    static check = (comp: Component): comp is TimeSlow => comp instanceof TimeSlow;

    /** 时间缩放比例 (0.5 = 50% 速度) */
    scale: number;

    /** 影响范围 (预留未来扩展区域限制) */
    scope: 'global' | 'area';

    constructor(cfg: { scale: number; scope?: 'global' | 'area' }) {
        super();
        this.scale = cfg.scale;
        this.scope = cfg.scope ?? 'global';
    }
}
```

#### 2. Buff 组件修改

**文件:** `src/engine/components/combat.ts` (修改)

```typescript
export class Buff extends Component {
    constructor(cfg: {
        type: BuffType;
        value: number;
        remaining: number;
    }) {
        super();
        this.type = cfg.type;
        this.value = cfg.value;
        this.remaining = cfg.remaining;
        // ❌ 删除: this.originalValues = {};
    }

    public type: BuffType;
    public value: number;
    public remaining: number;
    // ❌ 删除: public originalValues: Record<string, any>;

    update(dt: number): void {
        this.remaining -= dt;
    }

    isFinished(): boolean {
        return this.remaining <= 0;
    }
}
```

### 蓝图设计

#### 3. BLUEPRINT_TIME_SLOW

**文件:** `src/engine/blueprints/effects.ts` (新增)

```typescript
import { Blueprint } from './base';
import { BUFF_CONFIG } from '../configs/powerups';

/**
 * TimeSlow 实体蓝图
 * 拾取 TIME_SLOW 道具时创建此实体
 */
export const BLUEPRINT_TIME_SLOW: Blueprint = {
    /** 时间减速组件 */
    TimeSlow: {
        scale: 0.5,           // 50% 速度
        scope: 'global'
    },

    /** 生命周期组件 */
    Lifetime: {
        timer: BUFF_CONFIG[BuffType.TIME_SLOW].duration / 1000  // 毫秒转秒
    }
};
```

### 系统设计

#### 4. TimeSlowSystem (新增)

**文件:** `src/engine/systems/TimeSlowSystem.ts` (新建)

```typescript
/**
 * TimeSlowSystem - 时间减速系统
 *
 * 职责:
 * - 查询 TimeSlow 实体,设置全局 world.state.timeScale
 * - 当 TimeSlow 实体不存在时,重置 timeScale 为 1.0
 *
 * 系统类型: 状态层
 * 执行顺序: P0 - 在所有系统之前执行
 */

import { World, view } from '../world';
import { TimeSlow } from '../components';

export function TimeSlowSystem(world: World): void {
    // 使用 view 查询 TimeSlow 实体
    const timeSlowEntities = [...view(world, [TimeSlow])];

    if (timeSlowEntities.length > 0) {
        // 存在 TimeSlow 实体: 应用减速
        const [, [timeSlow]] = timeSlowEntities[0];

        // 限制范围防止异常值
        const safeScale = Math.max(0.1, Math.min(2.0, timeSlow.scale));
        world.state.timeScale = safeScale;
    } else {
        // ❗不存在 TimeSlow 实体: 重置为正常速度
        world.state.timeScale = 1.0;
    }
}
```

#### 5. 辅助函数集合

**文件:** `src/engine/utils/timeUtils.ts` (新建)

```typescript
import { World, EntityId } from '../world';
import { PlayerTag } from '../components';

/**
 * 获取实体的有效时间缩放
 * 玩家实体免疫 timeScale
 */
export function getEffectiveTimeScale(world: World, entityId: EntityId): number {
    const comps = world.entities.get(entityId);
    if (!comps) return 1.0;

    // 玩家免疫
    if (comps.find(PlayerTag.check)) return 1.0;

    // 应用全局 timeScale
    return world.state.timeScale ?? 1.0;
}

/**
 * 检查子弹是否来自玩家
 */
export function isBulletFromPlayer(world: World, ownerId: EntityId): boolean {
    const ownerComps = world.entities.get(ownerId);
    return ownerComps?.find(PlayerTag.check) !== undefined;
}

/**
 * 查找 TimeSlow 实体
 */
export function findTimeSlowEntity(world: World): EntityId | undefined {
    for (const [id, comps] of world.entities) {
        if (comps.find((c: any) => c.constructor.name === 'TimeSlow')) {
            return id;
        }
    }
    return undefined;
}
```

---

## 🔄 系统改造方案

### MovementSystem

**文件:** `src/engine/systems/MovementSystem.ts` (修改)

```typescript
import { getEffectiveTimeScale } from '../utils/timeUtils';

export function MovementSystem(world: World, dt: number): void {
    for (const [id, comps] of view(world, [Velocity, Position])) {
        const velocity = comps.find(Velocity.check) as Velocity;
        const position = comps.find(Position.check) as Position;

        // 获取有效时间缩放(玩家免疫)
        const timeScale = getEffectiveTimeScale(world, id);

        // 应用时间缩放
        position.x += velocity.vx * (dt / 1000) * timeScale;
        position.y += velocity.vy * (dt / 1000) * timeScale;
    }
}
```

### WeaponSystem

**文件:** `src/engine/systems/WeaponSystem.ts` (修改)

```typescript
import { getEffectiveTimeScale } from '../utils/timeUtils';

export function WeaponSystem(world: World, dt: number): void {
    const timeScale = world.state.timeScale ?? 1.0;

    for (const [id, [weapon], comps] of view(world, [Weapon])) {
        // 玩家武器不受影响
        const isPlayer = comps.find(PlayerTag.check);
        const effectiveScale = isPlayer ? 1.0 : timeScale;

        // 武器冷却时间受影响
        weapon.curCD -= dt * effectiveScale;

        if (weapon.curCD <= 0) {
            // 发射逻辑
        }
    }
}
```

### BulletSystem

**文件:** `src/engine/systems/BulletSystem.ts` (修改)

```typescript
import { isBulletFromPlayer } from '../utils/timeUtils';

export function BulletSystem(world: World, dt: number): void {
    const timeScale = world.state.timeScale ?? 1.0;

    for (const [id, [bullet, velocity, position], comps] of
         view(world, [Bullet, Velocity, Position])) {

        // 玩家子弹不受影响
        const isPlayerBullet = isBulletFromPlayer(world, bullet.owner);
        const effectiveScale = isPlayerBullet ? 1.0 : timeScale;

        position.x += velocity.vx * (dt / 1000) * effectiveScale;
        position.y += velocity.vy * (dt / 1000) * effectiveScale;
    }
}
```

### RenderSystem

**文件:** `src/engine/systems/RenderSystem.ts` (修改)

```typescript
import { TimeSlow } from '../components';

/**
 * 时间减速线条状态
 */
interface TimeSlowLine {
    x: number;
    y: number;
    length: number;
    speed: number;
    alpha: number;
}

// 全局状态存储
let timeSlowLines: TimeSlowLine[] = [];

export function RenderSystem(world: World, dt: number, renderCtx?: RenderContext): void {
    const ctx = renderCtx || currentContext;
    if (!ctx) return;

    const { canvas, context, width, height } = ctx;

    // ========== 查询时间减速状态 ==========
    const timeSlowEntities = [...view(world, [TimeSlow])];
    const timeSlowActive = timeSlowEntities.length > 0;
    // ======================================

    // 绘制背景(传入 timeSlowActive)
    drawBackground(context, width, height, timeSlowActive);

    // ... 其余渲染逻辑
}

/**
 * 绘制时间减速特效
 * 复用旧版 RenderSystem 的 falling lines 效果
 */
function drawTimeSlowEffect(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
): void {
    ctx.save();

    // 蓝色色调覆盖
    ctx.fillStyle = 'rgba(200, 230, 255, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // 生成新的线条(最多 20 条)
    if (timeSlowLines.length < 20) {
        timeSlowLines.push({
            x: Math.random() * width,
            y: -50,
            length: Math.random() * 100 + 50,
            speed: Math.random() * 5 + 2,
            alpha: Math.random() * 0.5 + 0.2
        });
    }

    // 绘制线条
    timeSlowLines.forEach(line => {
        line.y += line.speed;
        ctx.strokeStyle = `rgba(173, 216, 230, ${line.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x, line.y + line.length);
        ctx.stroke();
    });

    // 清理超出屏幕的线条
    timeSlowLines = timeSlowLines.filter(line => line.y < height + 100);

    ctx.restore();
}
```

### BuffSystem

**文件:** `src/engine/systems/BuffSystem.ts` (修改)

```typescript
/**
 * 持续效果 Buff 处理器映射表
 * 移除 TIME_SLOW,不再由 BuffSystem 处理
 */
const DURATION_BUFF_HANDLERS: Partial<Record<BuffType, DurationBuffHandler>> = {
    [BuffType.SHIELD]: shieldHandler,
    [BuffType.INVINCIBILITY]: invincibilityHandler,
    // ❌ 删除: [BuffType.TIME_SLOW]: timeSlowHandler
};
```

### PickupSystem

**文件:** `src/engine/systems/PickupSystem.ts` (修改)

```typescript
import { BLUEPRINT_TIME_SLOW } from '../blueprints/effects';
import { findTimeSlowEntity } from '../utils/timeUtils';

/**
 * 处理 TIME_SLOW 道具拾取
 */
function handleTimeSlowPickup(world: World, playerId: EntityId): void {
    const existingTimeSlow = findTimeSlowEntity(world);

    if (existingTimeSlow) {
        // 已存在: 刷新 Lifetime
        const lifetime = world.entities.get(existingTimeSlow)!.find(Lifetime.check);
        if (lifetime) {
            lifetime.timer = BUFF_CONFIG[BuffType.TIME_SLOW].duration / 1000;
        } else {
            console.error('[PickupSystem] TimeSlow 实体缺少 Lifetime 组件');
        }
    } else {
        // 不存在: 创建新的 TimeSlow 实体
        createTimeSlowEntity(world);
    }
}

function createTimeSlowEntity(world: World): void {
    const id = createEntity(world);
    applyBlueprint(world, id, BLUEPRINT_TIME_SLOW);
}
```

---

## 🎬 主循环集成

**文件:** 游戏主循环文件

```typescript
function gameLoop(dt: number): void {
    // P0: 时间减速最先执行(每帧都设置 state.timeScale)
    TimeSlowSystem(world);

    // P1: 物理、移动系统(读取 state.timeScale)
    MovementSystem(world, dt);
    BulletSystem(world, dt);
    WeaponSystem(world, dt);

    // P2: 其他逻辑系统
    InputSystem(world);
    CollisionSystem(world);
    // ...

    // P3: 清理系统(移除过期的 TimeSlow 实体)
    CleanSystem(world, dt);

    // P4: 渲染(RenderSystem 自己查询 TimeSlow 实体)
    RenderSystem(world, dt, renderCtx);
}
```

### 执行流程示例

```
Frame N: TimeSlow 实体存在
├── TimeSlowSystem: world.state.timeScale = 0.5
├── MovementSystem: 敌人速度 50%, 玩家速度 100%
├── WeaponSystem: 敌人武器冷却 0.5x, 玩家武器冷却 1.0x
├── BulletSystem: 敌人子弹速度 50%, 玩家子弹速度 100%
├── RenderSystem: 绘制蓝色光幕 + falling lines
└── CleanSystem: Lifetime 倒计时结束,移除 TimeSlow 实体

Frame N+1: TimeSlow 实体已被清理
├── TimeSlowSystem: world.state.timeScale = 1.0  ✅ 自动重置
├── MovementSystem: 所有实体速度正常
├── WeaponSystem: 所有武器冷却正常
├── BulletSystem: 所有子弹速度正常
├── RenderSystem: 无视觉效果
└── CleanSystem: (无操作)
```

---

## ✅ 实施检查清单

### 阶段 1: 基础组件
- [ ] 创建 TimeSlow 组件 (`src/engine/components/combat.ts`)
- [ ] 删除 Buff 组件的 `originalValues` 字段
- [ ] 创建 `BLUEPRINT_TIME_SLOW` 蓝图 (`src/engine/blueprints/effects.ts`)
- [ ] 创建辅助工具函数 (`src/engine/utils/timeUtils.ts`)

### 阶段 2: 系统
- [ ] 创建 TimeSlowSystem (`src/engine/systems/TimeSlowSystem.ts`)
- [ ] 修改 BuffSystem 移除 TIME_SLOW 处理逻辑
- [ ] 修改 PickupSystem 处理 TIME_SLOW 道具

### 阶段 3: 应用 timeScale
- [ ] 修改 MovementSystem 支持 timeScale
- [ ] 修改 WeaponSystem 支持 timeScale
- [ ] 修改 BulletSystem 支持 timeScale
- [ ] 修改 RenderSystem 支持时间减速视觉效果

### 阶段 4: 集成
- [ ] 更新主循环集成 TimeSlowSystem
- [ ] 更新 World 类型定义添加 `state.timeScale`

### 阶段 5: 测试
- [ ] TimeSlowSystem 单元测试
- [ ] MovementSystem 集成测试
- [ ] 完整流程集成测试
- [ ] 边界情况测试

---

## 🎯 设计优势

### 与现有实现对比

| 方面 | 现有实现 | 新设计 |
|------|---------|--------|
| 状态管理 | `Buff.originalValues` 存储受影响敌人列表 | TimeSlow 实体独立存在 |
| ECS 兼容性 | ❌ 违反数据驱动原则 | ✅ 完全符合 ECS |
| 清理逻辑 | ❌ 手动跟踪和清理 | ✅ CleanSystem 自动清理 |
| 代码复杂度 | ❌ 需要维护 `affectedEnemies` | ✅ 无需额外状态 |
| 可测试性 | ❌ 依赖复杂状态 | ✅ 各系统独立可测 |
| 可扩展性 | ❌ 难以支持区域减速 | ✅ 可轻松扩展 |

### 优势总结

1. **完全符合 ECS 架构** - TimeSlow 是独立实体,有自己的生命周期
2. **简化状态管理** - 无需手动跟踪受影响的实体
3. **易于测试** - 每个系统职责单一
4. **易于扩展** - 未来可支持区域减速、多级减速等

---

## 📚 参考资料

- 现有 TIME_SLOW 实现: `src/engine/systems/BuffSystem.ts:81-132`
- 旧版视觉效果: `game/systems/RenderSystem.ts:138-171`
- Blueprint 系统: `src/engine/blueprints/base.ts`
- Lifetime 组件: `src/engine/components/base.ts:150-164`
