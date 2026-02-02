# 闪烁组件设计文档

**日期**: 2026-02-02
**状态**: 设计中

## 概述

设计一个通用的闪烁（Blink）组件，替代现有绑定在 `Sprite` 组件中的 `hitFlashUntil` 字段。新设计遵循 ECS 架构，将闪烁效果作为独立的视觉组件，可动态添加到任何实体上。

## 背景问题

### 现有实现问题

1. **耦合度高**: `hitFlashUntil` 字段直接绑定在 `Sprite` 组件中，限制了使用范围
2. **灵活性差**: 只有单一截止时间，无法控制频率、颜色等参数
3. **逻辑混杂**: `isFlashing` 等计算逻辑放在组件中，违反 ECS 原则

### 目标

- 解耦闪烁效果与 `Sprite` 组件
- 支持自定义持续时间、频率、颜色
- 纯数据组件，逻辑由 System 处理

## 设计

### 1. 组件定义

**文件**: `src/engine/components/visual.ts`

```typescript
/**
 * 闪烁模式枚举
 */
export enum BlinkMode {
    /** 硬切换：完全可见/完全不可见交替 */
    HARD = 'hard',
    /** 软渐变：透明度在两个值之间平滑过渡 */
    SOFT = 'soft',
}

/**
 * 闪烁颜色配置
 */
export interface BlinkColors {
    /** 闪烁时显示的颜色 */
    visible: string;
    /** 隐藏时的颜色 */
    hidden: string;
}

/**
 * 闪烁组件 - 控制实体的明暗闪烁效果
 *
 * 纯数据组件，逻辑由 BlinkSystem 处理
 *
 * @example
 * // 受伤闪烁
 * addComponent(world, playerId, new Blink({
 *     durationMs: 500,
 *     intervalMs: 100,
 *     colors: { visible: '#ffffff', hidden: 'transparent' },
 *     mode: BlinkMode.HARD
 * }));
 */
export class Blink extends Component {
    constructor(cfg: {
        /** 闪烁持续时间（毫秒） */
        durationMs: number;
        /** 闪烁间隔（毫秒）- 每次完整可见+隐藏的周期 */
        intervalMs: number;
        /** 颜色配置 */
        colors?: BlinkColors;
        /** 闪烁模式 */
        mode?: BlinkMode;
    }) {
        super();
        this.durationMs = cfg.durationMs;
        this.intervalMs = cfg.intervalMs;
        this.colors = cfg.colors ?? { visible: '#ffffff', hidden: 'transparent' };
        this.mode = cfg.mode ?? BlinkMode.HARD;
        this.elapsedMs = 0;
    }

    /** 闪烁持续时间（毫秒） */
    public durationMs: number;

    /** 闪烁间隔（毫秒） */
    public intervalMs: number;

    /** 颜色配置 */
    public colors: BlinkColors;

    /** 闪烁模式 */
    public mode: BlinkMode;

    /** 已经过的时间（毫秒）- 由 BlinkSystem 更新 */
    public elapsedMs: number;

    static check(c: any): c is Blink { return c instanceof Blink; }
}
```

### 2. 系统实现

**文件**: `src/engine/systems/BlinkSystem.ts`

```typescript
/**
 * 闪烁系统 - 处理闪烁效果的更新与清理
 *
 * 职责：
 * 1. 更新所有 Blink 组件的 elapsedMs
 * 2. 闪烁完成后移除组件
 *
 * @param world 世界对象
 * @param deltaTimeMs 增量时间（毫秒）
 */
export function BlinkSystem(world: World, deltaTimeMs: number): void {
    const entities = view(world, [Blink]);

    for (const entityId of entities) {
        const blink = getComponent(world, entityId, Blink);
        if (!blink) continue;

        blink.elapsedMs += deltaTimeMs;

        // 闪烁完成，移除组件
        if (blink.elapsedMs >= blink.durationMs) {
            removeComponent(world, entityId, Blink);
        }
    }
}
```

### 3. 渲染集成

**文件**: `src/engine/systems/RenderSystem.ts`

在渲染实体时检查 `Blink` 组件并应用效果：

```typescript
import { Blink, BlinkMode } from '../components/visual';

// 渲染单个实体时
const blink = getComponent(world, entityId, Blink);
if (blink) {
    const displayColor = calculateBlinkColor(blink);
    if (displayColor === 'transparent') {
        continue; // 跳过渲染
    }
    // 应用闪烁颜色覆盖
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = displayColor;
    // ...
}
```

**颜色计算工具函数**：

```typescript
/**
 * 计算闪烁当前颜色
 */
function calculateBlinkColor(blink: Blink): string {
    if (blink.elapsedMs >= blink.durationMs) {
        return blink.colors.visible;
    }

    const phase = blink.elapsedMs % blink.intervalMs;
    const halfInterval = blink.intervalMs / 2;

    if (blink.mode === BlinkMode.HARD) {
        // 硬切换：前半段可见，后半段隐藏
        return phase < halfInterval ? blink.colors.visible : blink.colors.hidden;
    } else {
        // SOFT 模式：正弦波平滑过渡
        const ratio = (1 - Math.cos((phase / blink.intervalMs) * Math.PI * 2)) / 2;
        return interpolateAlpha(blink.colors.visible, ratio);
    }
}
```

### 4. 使用场景

```typescript
// 受伤闪烁
function takeDamage(world: World, entityId: EntityId, amount: number) {
    // 扣血逻辑...

    addComponent(world, entityId, new Blink({
        durationMs: 500,
        intervalMs: 100,
        colors: { visible: '#ffffff', hidden: 'rgba(255,255,255,0.1)' },
        mode: BlinkMode.HARD,
    }));
}

// 无敌道具
function applyInvulnerability(world: World, playerId: EntityId) {
    addComponent(world, playerId, new Blink({
        durationMs: 5000,
        intervalMs: 150,
        colors: { visible: '#FFD700', hidden: 'rgba(255,215,0,0.2)' },
        mode: BlinkMode.SOFT,
    }));
}

// 升级效果
function levelUp(world: World, playerId: EntityId) {
    addComponent(world, playerId, new Blink({
        durationMs: 300,
        intervalMs: 80,
        colors: { visible: '#00ffff', hidden: 'transparent' },
        mode: BlinkMode.HARD,
    }));
}
```

## 实现计划

1. 在 `src/engine/components/visual.ts` 中添加 `Blink` 组件和 `BlinkMode` 枚举
2. 创建 `src/engine/systems/BlinkSystem.ts`
3. 在主循环中调用 `BlinkSystem`
4. 修改 `RenderSystem` 支持闪烁效果渲染
5. 更新现有使用 `hitFlashUntil` 的代码
6. 添加单元测试

## 迁移清单

- [ ] `Sprite.hitFlashUntil` → `Blink` 组件
- [ ] `Sprite.isFlashing` → `BlinkSystem` 处理
- [ ] 受伤逻辑（`CollisionSystem` 等）
- [ ] 升级逻辑（`LevelUpSystem` 等）
- [ ] 无敌道具逻辑（`PickupSystem`）
