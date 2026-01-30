# VisualEffectSystem 重构实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 将特效逻辑从 RenderSystem 重构到独立的 VisualEffectSystem，实现职责分离：
- VisualEffectSystem 负责创建和更新特效数据
- RenderSystem 只负责渲染

**架构:**
- 创建 `VisualEffect` 组件，包含 `particles`、`lines`、`circles` 三种特效数据数组
- 创建 `VisualEffectSystem`，提供统一的创建 API（`spawnParticles`、`spawnLines`、`spawnCircles`）和更新逻辑
- 其他系统（TimeSlowSystem、EffectPlayer 等）调用 VisualEffectSystem 的 API 来创建特效
- `RenderSystem` 只遍历 `VisualEffect` 组件并绘制

**技术栈:** TypeScript, Canvas 2D, 现有 ECS 架构

---

## 数据结构设计

```typescript
// 粒子数据（点）
interface VisualParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;      // 剩余生命周期（毫秒）
    maxLife: number;   // 总生命周期（毫秒）
    color: string;
    size: number;
}

// 线条数据（垂直下落线，用于 timeSlow 效果）
interface VisualLine {
    x: number;
    y: number;
    length: number;
    speed: number;
    alpha: number;
}

// 圆环数据（冲击波）
interface VisualCircle {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    life: number;      // 0-1
    color: string;
    width: number;
}

// VisualEffect 组件
class VisualEffect extends Component {
    particles: VisualParticle[] = [];
    lines: VisualLine[] = [];
    circles: VisualCircle[] = [];
}
```

---

## Task 1: 创建 VisualEffect 组件

**文件:**
- 创建: `src/engine/components/visual.ts`

**Step 1: 创建基础数据结构和组件**

```typescript
// src/engine/components/visual.ts
import { Component } from '../types/base';

/**
 * 视觉粒子数据
 */
export interface VisualParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;      // 剩余生命周期（毫秒）
    maxLife: number;   // 总生命周期（毫秒）
    color: string;
    size: number;
}

/**
 * 视觉线条数据（用于 timeSlow 等效果）
 */
export interface VisualLine {
    x: number;
    y: number;
    length: number;
    speed: number;
    alpha: number;
}

/**
 * 视觉圆环数据（用于冲击波等效果）
 */
export interface VisualCircle {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    life: number;      // 0-1
    color: string;
    width: number;
}

/**
 * 视觉特效组件
 *
 * 存储批量渲染的视觉特效数据，避免为每个粒子/线条创建实体
 *
 * 系统类型：表现层
 * 执行顺序：VisualEffectSystem 更新 → RenderSystem 渲染
 */
export class VisualEffect extends Component {
    constructor() {
        super();
        this.particles = [];
        this.lines = [];
        this.circles = [];
    }

    /** 粒子数组 */
    particles: VisualParticle[];
    /** 线条数组 */
    lines: VisualLine[];
    /** 圆环数组 */
    circles: VisualCircle[];

    static check(c: any): c is VisualEffect { return c instanceof VisualEffect; }
}
```

**Step 2: 更新 components/index.ts**

修改 `src/engine/components/index.ts`:

```typescript
export * from './base';
export * from './combat';
export * from './movement';
export * from './meta';
export * from './render';
export * from './visual';  // 新增
```

**Step 3: 运行类型检查**

```bash
pnpm run type-check
```

预期：PASS

**Step 4: 提交**

```bash
git add src/engine/components/visual.ts src/engine/components/index.ts
git commit -m "feat(components): 添加 VisualEffect 组件"
```

---

## Task 2: 创建 VisualEffectSystem（创建 + 更新 API）

**文件:**
- 创建: `src/engine/systems/VisualEffectSystem.ts`

**Step 1: 创建 VisualEffectSystem 框架**

```typescript
// src/engine/systems/VisualEffectSystem.ts
/**
 * 视觉特效系统 (VisualEffectSystem)
 *
 * 职责：
 * - 提供统一的特效创建 API（spawnParticles、spawnLines、spawnCircles）
 * - 更新 VisualEffect 组件中的所有特效数据
 * - 更新粒子位置、生命周期
 * - 更新线条位置
 * - 更新圆环动画
 * - 清理过期的特效数据
 *
 * 系统类型：表现层
 * 执行顺序：P7 - 在 DamageResolutionSystem 之后，RenderSystem 之前
 */

import { World, view } from '../world';
import { VisualEffect, VisualParticle, VisualLine, VisualCircle } from '../components/visual';

// ========== 创建 API ==========

/**
 * 生成粒子特效
 * @param world 世界对象
 * @param x X 坐标
 * @param y Y 坐标
 * @param count 粒子数量
 * @param config 粒子配置
 */
export function spawnParticles(
    world: World,
    x: number,
    y: number,
    count: number,
    config: {
        speedMin?: number;
        speedMax?: number;
        life: number;
        color: string;
        sizeMin?: number;
        sizeMax?: number;
    }
): void {
    for (const [_id, [effect]] of view(world, [VisualEffect])) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (config.speedMin ?? 2) + Math.random() * ((config.speedMax ?? 5) - (config.speedMin ?? 2));

            effect.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: config.life,
                maxLife: config.life,
                color: config.color,
                size: (config.sizeMin ?? 2) + Math.random() * ((config.sizeMax ?? 5) - (config.sizeMin ?? 2)),
            } as VisualParticle);
        }
        return;
    }
}

/**
 * 生成时间减速线条
 * @param world 世界对象
 * @param width 画布宽度
 * @param maxHeight 最大数量
 */
export function spawnTimeSlowLines(world: World, width: number, maxHeight: number = 20): void {
    for (const [_id, [effect]] of view(world, [VisualEffect])) {
        // 补充到最大数量
        while (effect.lines.length < maxHeight) {
            effect.lines.push({
                x: Math.random() * width,
                y: -50,
                length: Math.random() * 100 + 50,
                speed: Math.random() * 5 + 2,
                alpha: Math.random() * 0.5 + 0.2,
            } as VisualLine);
        }
        return;
    }
}

/**
 * 清空时间减速线条
 * @param world 世界对象
 */
export function clearTimeSlowLines(world: World): void {
    for (const [_id, [effect]] of view(world, [VisualEffect])) {
        effect.lines = [];
    }
}

/**
 * 生成冲击波圆环
 * @param world 世界对象
 * @param x X 坐标
 * @param y Y 坐标
 * @param color 颜色
 * @param maxRadius 最大半径
 * @param width 线宽
 */
export function spawnCircle(
    world: World,
    x: number,
    y: number,
    color: string = '#ffffff',
    maxRadius: number = 150,
    width: number = 5
): void {
    for (const [_id, [effect]] of view(world, [VisualEffect])) {
        effect.circles.push({
            x,
            y,
            radius: 10,
            maxRadius,
            life: 1.0,
            color,
            width,
        } as VisualCircle);
        return;
    }
}

// ========== 更新逻辑 ==========

/**
 * 更新粒子位置和生命周期
 */
function updateParticles(particles: VisualParticle[], dt: number): void {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // 更新位置
        p.x += p.vx * (dt / 1000);
        p.y += p.vy * (dt / 1000);

        // 更新生命周期
        p.life -= dt;

        // 清理过期粒子
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

/**
 * 更新线条位置
 */
function updateLines(lines: VisualLine[], height: number): void {
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];

        // 更新位置
        line.y += line.speed;

        // 清理超出屏幕的线条
        if (line.y > height + 100) {
            lines.splice(i, 1);
        }
    }
}

/**
 * 更新圆环动画
 */
function updateCircles(circles: VisualCircle[], dt: number): void {
    const timeScale = dt / 16.66;

    for (let i = circles.length - 1; i >= 0; i--) {
        const circle = circles[i];

        // 更新半径
        circle.radius += (circle.maxRadius - circle.radius) * 0.1 * timeScale;

        // 更新生命周期
        circle.life -= 0.02 * timeScale;

        // 清理过期圆环
        if (circle.life <= 0) {
            circles.splice(i, 1);
        }
    }
}

/**
 * 视觉特效系统主函数
 */
export function VisualEffectSystem(world: World, dt: number): void {
    const height = world.height;

    for (const [_id, [effect]] of view(world, [VisualEffect])) {
        // 更新粒子
        if (effect.particles.length > 0) {
            updateParticles(effect.particles, dt);
        }

        // 更新线条
        if (effect.lines.length > 0) {
            updateLines(effect.lines, height);
        }

        // 更新圆环
        if (effect.circles.length > 0) {
            updateCircles(effect.circles, dt);
        }
    }
}
```

**Step 2: 更新 systems/index.ts**

修改 `src/engine/systems/index.ts`，在表现层添加导出：

```typescript
// P7: 表现层
export * from './CameraSystem';
export {
    VisualEffectSystem,
    spawnParticles,
    spawnTimeSlowLines,
    clearTimeSlowLines,
    spawnCircle
} from './VisualEffectSystem';
export { EffectPlayer, updateParticles } from './EffectPlayer';
export { AudioSystem, ... } from './AudioSystem';
export * from './RenderSystem';
```

**Step 3: 运行类型检查**

```bash
pnpm run type-check
```

预期：PASS

**Step 4: 提交**

```bash
git add src/engine/systems/VisualEffectSystem.ts src/engine/systems/index.ts
git commit -m "feat(systems): 添加 VisualEffectSystem（创建+更新API）"
```

---

## Task 3: 在 World 中添加 VisualEffect 实体

**文件:**
- 修改: `src/engine/world.ts`
- 修改: `src/engine/engine.ts`

**Step 1: 添加 VisualEffect 实体 ID 到 World**

在 `World` 接口中添加 `visualEffectId` 字段：

```typescript
// src/engine/world.ts
export interface World {
    // ... 现有字段 ...
    playerId: EntityId;
    visualEffectId: EntityId;  // 新增：视觉特效实体 ID
    // ... 其他字段 ...
}
```

**Step 2: 更新 createWorld 函数**

```typescript
export function createWorld(): World {
    return {
        time: 0,
        entities: new Map(),
        events: [],
        score: 0,
        level: 1,
        playerId: 0,
        visualEffectId: 0,  // 新增
        playerLevel: 1,
        difficulty: 1,
        // ... 其他字段 ...
    };
}
```

**Step 3: 在 engine.ts 初始化时创建 VisualEffect 实体**

修改 `src/engine/engine.ts`，找到初始化代码：

```typescript
import { VisualEffect } from './components/visual';
import { addComponent } from './world';

// 在初始化函数中添加
export function initGame(canvas: HTMLCanvasElement): World {
    const world = createWorld();
    world.width = canvas.width;
    world.height = canvas.height;

    // 创建视觉特效实体
    world.visualEffectId = generateId();
    addComponent(world, world.visualEffectId, new VisualEffect());

    // ... 其他初始化代码 ...
}
```

**Step 4: 运行类型检查**

```bash
pnpm run type-check
```

预期：PASS

**Step 5: 提交**

```bash
git add src/engine/world.ts src/engine/engine.ts
git commit -m "feat(world): 添加 VisualEffect 实体初始化"
```

---

## Task 4: 迁移 timeSlowLines 逻辑

**文件:**
- 修改: `src/engine/systems/TimeSlowSystem.ts`
- 修改: `src/engine/systems/RenderSystem.ts`

**Step 1: 修改 TimeSlowSystem 使用 VisualEffectSystem API**

```typescript
// 在 TimeSlowSystem.ts 中添加
import { spawnTimeSlowLines, clearTimeSlowLines } from './VisualEffectSystem';

// 时间减速激活时调用 spawnTimeSlowLines
// 在适当的地方调用：
spawnTimeSlowLines(world, world.width, 20);

// 时间减速结束时调用 clearTimeSlowLines
clearTimeSlowLines(world);
```

**Step 2: 修改 RenderSystem 移除 timeSlowLines 逻辑**

从 `RenderSystem.ts` 中删除 `updateTimeSlowLines` 函数，修改 `drawTimeSlowEffect` 从 `VisualEffect` 组件读取：

```typescript
// 删除 updateTimeSlowLines 函数 (第 182-207 行)

// 修改 drawTimeSlowEffect
import { VisualEffect, VisualLine } from '../components/visual';
import { view } from '../world';

function drawTimeSlowEffect(ctx: CanvasRenderingContext2D, world: World): void {
    // 从 VisualEffect 组件获取线条
    let lines: VisualLine[] = [];
    for (const [_id, [effect]] of view(world, [VisualEffect])) {
        lines = effect.lines;
        break;
    }

    ctx.save();

    // 蓝色色调覆盖
    ctx.fillStyle = 'rgba(200, 230, 255, 0.1)';
    ctx.fillRect(0, 0, world.width, world.height);

    // 绘制线条
    for (const line of lines) {
        ctx.strokeStyle = `rgba(173, 216, 230, ${line.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x, line.y + line.length);
        ctx.stroke();
    }

    ctx.restore();
}
```

**Step 3: 修改 RenderSystem 主函数**

移除对 `world.renderState.timeSlowLines` 的直接操作：

```typescript
// 在 RenderSystem 主函数中，删除这段代码：
// if (!queue.timeSlowActive) {
//     timeSlowLines.length = 0;
// } else {
//     updateTimeSlowLines(world, canvas.width, canvas.height);
// }
```

**Step 4: 更新 world.ts 移除 timeSlowLines**

从 `RenderState` 接口中移除 `timeSlowLines`：

```typescript
// src/engine/world.ts
// 删除 TimeSlowLine 接口定义（第 5-12 行）

// 修改 RenderState
export interface RenderState {
    camera: CameraState;
    // 删除: timeSlowLines: TimeSlowLine[];
}

// 修改 createWorld
renderState: {
    camera: {
        x: 0,
        y: 0,
        shakeX: 0,
        shakeY: 0,
        zoom: 1.0,
        shakeTimer: 0,
        shakeIntensity: 0,
    },
    // 删除: timeSlowLines: [],
},
```

**Step 5: 运行类型检查**

```bash
pnpm run type-check
```

预期：PASS

**Step 6: 运行测试**

```bash
pnpm test -- tests/systems/RenderSystem.test.ts
```

预期：PASS

**Step 7: 提交**

```bash
git add src/engine/systems/TimeSlowSystem.ts src/engine/systems/RenderSystem.ts src/engine/world.ts
git commit -m "refactor: 将 timeSlowLines 迁移到 VisualEffect"
```

---

## Task 5: 迁移 Shockwave 逻辑

**文件:**
- 修改: `src/engine/systems/EffectPlayer.ts`
- 修改: `src/engine/systems/RenderSystem.ts`

**Step 1: 修改 EffectPlayer 使用 spawnCircle API**

```typescript
// src/engine/systems/EffectPlayer.ts
import { spawnCircle } from './VisualEffectSystem';

// 修改 spawnShockwave 函数
export function spawnShockwave(
    world: World,
    x: number,
    y: number,
    color: string = '#ffffff',
    maxRadius: number = 150,
    width: number = 5
): void {
    spawnCircle(world, x, y, color, maxRadius, width);
}
```

**Step 2: 修改 RenderSystem 绘制圆环**

添加从 `VisualEffect` 绘制圆环的函数：

```typescript
import { VisualEffect } from '../components/visual';
import { view } from '../world';

function drawVisualEffectCircles(
    ctx: CanvasRenderingContext2D,
    world: World,
    camX: number,
    camY: number
): void {
    for (const [_id, [effect]] of view(world, [VisualEffect])) {
        for (const circle of effect.circles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, circle.life);
            ctx.shadowColor = circle.color;
            ctx.shadowBlur = 15;
            ctx.lineWidth = circle.width;
            ctx.strokeStyle = circle.color;
            ctx.beginPath();
            ctx.arc(circle.x - camX, circle.y - camY, circle.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}
```

**Step 3: 在 RenderSystem 主函数中调用**

```typescript
// 在 RenderSystem 主函数中，绘制粒子之前调用
export function RenderSystem(
    world: World,
    renderCtx: RenderContext,
    dt: number
): void {
    // ... 前面的代码 ...

    // 7. 绘制 VisualEffect 圆环
    drawVisualEffectCircles(context, world, camX, camY);

    // 8. 绘制旧的 Shockwave 实体（兼容过渡期，后续移除）
    for (const item of queue.shockwaves) {
        drawShockwave(context, item, camX, camY);
    }

    // ... 后面的代码 ...
}
```

**Step 4: 运行测试**

```bash
pnpm test -- tests/systems/EffectPlayer.test.ts
pnpm test -- tests/systems/RenderSystem.test.ts
```

预期：PASS

**Step 5: 提交**

```bash
git add src/engine/systems/EffectPlayer.ts src/engine/systems/RenderSystem.ts
git commit -m "refactor: 将 Shockwave 迁移到 VisualEffect"
```

---

## Task 6: 迁移粒子逻辑

**文件:**
- 修改: `src/engine/systems/EffectPlayer.ts`
- 修改: `src/engine/systems/RenderSystem.ts`

**Step 1: 修改 EffectPlayer 使用 spawnParticles API**

```typescript
// src/engine/systems/EffectPlayer.ts
import { spawnParticles } from './VisualEffectSystem';

// 修改 spawnExplosionParticles 函数
function spawnExplosionParticles(world: World, x: number, y: number, config: typeof EXPLOSION_PARTICLES[keyof typeof EXPLOSION_PARTICLES]): void {
    if (PARTICLE_DEBUG.enabled && PARTICLE_DEBUG.logSpawns) {
        console.log(`[EffectPlayer] 生成爆炸粒子: ${config.count}个, 位置(${x.toFixed(1)}, ${y.toFixed(1)}), 颜色=${config.color}`);
    }

    spawnParticles(world, x, y, config.count, {
        speedMin: config.speedMin,
        speedMax: config.speedMax,
        life: config.life,
        color: config.color,
        sizeMin: config.sizeMin,
        sizeMax: config.sizeMax,
    });
}
```

**Step 2: 在 RenderSystem 中添加绘制 VisualParticle**

```typescript
import { VisualEffect } from '../components/visual';
import { view } from '../world';

function drawVisualEffectParticles(
    ctx: CanvasRenderingContext2D,
    world: World,
    camX: number,
    camY: number
): void {
    for (const [_id, [effect]] of view(world, [VisualEffect])) {
        for (const p of effect.particles) {
            const alpha = Math.max(0, p.life / p.maxLife);

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x - camX, p.y - camY, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}
```

**Step 3: 在 RenderSystem 主函数中调用**

```typescript
// 在 RenderSystem 主函数中，绘制粒子之前调用
export function RenderSystem(
    world: World,
    renderCtx: RenderContext,
    dt: number
): void {
    // ... 前面的代码 ...

    // 6. 绘制 VisualEffect 粒子
    context.globalCompositeOperation = 'lighter';
    drawVisualEffectParticles(context, world, camX, camY);

    // 7. 绘制旧的粒子实体（兼容过渡期，用于帧动画粒子）
    for (const item of queue.particles) {
        drawParticle(context, item, camX, camY);
    }
    context.globalCompositeOperation = 'source-over';

    // ... 后面的代码 ...
}
```

**Step 4: 运行测试**

```bash
pnpm test -- tests/systems/EffectPlayer.test.ts
pnpm test -- tests/systems/RenderSystem.test.ts
```

预期：PASS

**Step 5: 提交**

```bash
git add src/engine/systems/EffectPlayer.ts src/engine/systems/RenderSystem.ts
git commit -m "refactor: 将物理粒子迁移到 VisualEffect"
```

---

## Task 7: 在主循环中集成 VisualEffectSystem

**文件:**
- 修改: `src/engine/engine.ts`

**Step 1: 导入 VisualEffectSystem**

```typescript
import { VisualEffectSystem } from './systems/VisualEffectSystem';
```

**Step 2: 在游戏循环中添加 VisualEffectSystem 调用**

找到 `gameLoop` 函数，在 `RenderSystem` 之前添加：

```typescript
export function gameLoop(world: World, canvas: HTMLCanvasElement): void {
    // ... P1-P6 系统调用 ...

    // P7: 表现层
    CameraSystem(world, dt);
    AudioSystem(world, dt);
    EffectPlayer(world, dt);
    VisualEffectSystem(world, dt);  // 新增：在 RenderSystem 之前
    RenderSystem(world, renderContext, dt);

    // P8: 清理层
    LifetimeSystem(world, dt);
    CleanupSystem(world);
}
```

**Step 3: 运行完整测试**

```bash
pnpm test
```

预期：所有测试 PASS

**Step 4: 手动测试游戏**

```bash
pnpm run dev
```

验证：
- 时间减速效果正常显示
- 爆炸粒子正常显示
- 冲击波正常显示

**Step 5: 提交**

```bash
git add src/engine/engine.ts
git commit -m "feat(engine): 在主循环中集成 VisualEffectSystem"
```

---

## Task 8: 创建 VisualEffectSystem 单元测试

**文件:**
- 创建: `tests/systems/VisualEffectSystem.test.ts`

**Step 1: 编写测试文件**

```typescript
/**
 * VisualEffectSystem 单元测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createWorld, generateId, World } from '../../src/engine/world';
import { VisualEffectSystem, spawnParticles, spawnTimeSlowLines, clearTimeSlowLines, spawnCircle } from '../../src/engine/systems/VisualEffectSystem';
import { VisualEffect } from '../../src/engine/components/visual';
import { addComponent } from '../../src/engine/world';

describe('VisualEffectSystem', () => {
    let world: World;
    let visualEffect: VisualEffect;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;

        // 创建 VisualEffect 实体
        const id = generateId();
        visualEffect = new VisualEffect();
        addComponent(world, id, visualEffect);
        world.visualEffectId = id;
    });

    describe('spawnParticles API', () => {
        it('应该创建正确数量的粒子', () => {
            spawnParticles(world, 100, 200, 10, {
                life: 1000,
                color: '#ff0000',
            });

            expect(visualEffect.particles.length).toBe(10);
        });

        it('应该正确设置粒子初始位置', () => {
            spawnParticles(world, 100, 200, 5, {
                life: 1000,
                color: '#ff0000',
            });

            for (const p of visualEffect.particles) {
                expect(p.x).toBe(100);
                expect(p.y).toBe(200);
            }
        });
    });

    describe('spawnTimeSlowLines API', () => {
        it('应该补充到指定数量的线条', () => {
            spawnTimeSlowLines(world, 800, 20);

            expect(visualEffect.lines.length).toBe(20);
        });

        it('多次调用应该维持最大数量', () => {
            spawnTimeSlowLines(world, 800, 10);
            expect(visualEffect.lines.length).toBe(10);

            spawnTimeSlowLines(world, 800, 10);
            expect(visualEffect.lines.length).toBe(10); // 不会重复添加
        });

        it('clearTimeSlowLines 应该清空所有线条', () => {
            spawnTimeSlowLines(world, 800, 20);
            expect(visualEffect.lines.length).toBe(20);

            clearTimeSlowLines(world);
            expect(visualEffect.lines.length).toBe(0);
        });
    });

    describe('spawnCircle API', () => {
        it('应该创建圆环', () => {
            spawnCircle(world, 100, 200, '#ff0000', 150, 5);

            expect(visualEffect.circles.length).toBe(1);
            expect(visualEffect.circles[0].x).toBe(100);
            expect(visualEffect.circles[0].y).toBe(200);
            expect(visualEffect.circles[0].color).toBe('#ff0000');
            expect(visualEffect.circles[0].maxRadius).toBe(150);
            expect(visualEffect.circles[0].width).toBe(5);
        });

        it('应该使用默认参数', () => {
            spawnCircle(world, 100, 200);

            expect(visualEffect.circles[0].color).toBe('#ffffff');
            expect(visualEffect.circles[0].maxRadius).toBe(150);
            expect(visualEffect.circles[0].width).toBe(5);
        });
    });

    describe('粒子更新', () => {
        it('应该更新粒子位置', () => {
            spawnParticles(world, 100, 200, 1, {
                speedMin: 50,
                speedMax: 50,
                life: 1000,
                color: '#ff0000',
            });

            VisualEffectSystem(world, 100); // 100ms

            expect(visualEffect.particles[0].x).not.toBe(100);
            expect(visualEffect.particles[0].y).not.toBe(200);
        });

        it('应该减少粒子生命周期', () => {
            spawnParticles(world, 0, 0, 1, {
                life: 500,
                color: '#ff0000',
            });

            VisualEffectSystem(world, 100);

            expect(visualEffect.particles[0].life).toBe(400);
        });

        it('应该清理过期的粒子', () => {
            spawnParticles(world, 0, 0, 1, {
                life: 50,
                color: '#ff0000',
            });

            VisualEffectSystem(world, 100);

            expect(visualEffect.particles.length).toBe(0);
        });
    });

    describe('线条更新', () => {
        it('应该更新线条位置', () => {
            spawnTimeSlowLines(world, 800, 1);
            const initialY = visualEffect.lines[0].y;

            VisualEffectSystem(world, 16);

            expect(visualEffect.lines[0].y).toBeGreaterThan(initialY);
        });

        it('应该清理超出屏幕的线条', () => {
            spawnTimeSlowLines(world, 800, 1);
            visualEffect.lines[0].y = 700; // 超出 height (600) + 100

            VisualEffectSystem(world, 16);

            expect(visualEffect.lines.length).toBe(0);
        });
    });

    describe('圆环更新', () => {
        it('应该增加圆环半径', () => {
            spawnCircle(world, 0, 0);
            const initialRadius = visualEffect.circles[0].radius;

            VisualEffectSystem(world, 16);

            expect(visualEffect.circles[0].radius).toBeGreaterThan(initialRadius);
        });

        it('应该减少圆环生命周期', () => {
            spawnCircle(world, 0, 0);
            const initialLife = visualEffect.circles[0].life;

            VisualEffectSystem(world, 16);

            expect(visualEffect.circles[0].life).toBeLessThan(initialLife);
        });

        it('应该清理过期的圆环', () => {
            spawnCircle(world, 0, 0);
            visualEffect.circles[0].life = 0.01;

            VisualEffectSystem(world, 16);

            expect(visualEffect.circles.length).toBe(0);
        });
    });

    describe('边界情况', () => {
        it('空的 VisualEffect 不应该崩溃', () => {
            expect(() => VisualEffectSystem(world, 16)).not.toThrow();
        });

        it('没有 VisualEffect 实体不应该崩溃', () => {
            world.entities.clear();
            expect(() => VisualEffectSystem(world, 16)).not.toThrow();
            expect(() => spawnParticles(world, 0, 0, 1, { life: 100, color: '#fff' })).not.toThrow();
            expect(() => spawnTimeSlowLines(world, 800)).not.toThrow();
            expect(() => spawnCircle(world, 0, 0)).not.toThrow();
        });
    });
});
```

**Step 2: 运行测试**

```bash
pnpm test -- tests/systems/VisualEffectSystem.test.ts
```

预期：所有测试 PASS

**Step 3: 提交**

```bash
git add tests/systems/VisualEffectSystem.test.ts
git commit -m "test: 添加 VisualEffectSystem 单元测试"
```

---

## Task 9: 清理旧代码

**文件:**
- 修改: `src/engine/systems/RenderSystem.ts`
- 修改: `src/engine/systems/index.ts`

**Step 1: 从 RenderSystem 移除旧的渲染逻辑**

从 `RenderQueue` 接口移除 shockwaves，更新主函数：

```typescript
// 修改 RenderQueue 接口
interface RenderQueue {
    sprites: RenderItem[];
    particles: RenderItem[];  // 保留：用于帧动画粒子
    shockwaves: RenderItem[];  // 保留用于过渡期，后续可删除
    playerEffect: PlayerEffectData | null;
    bossInfo: BossInfo | null;
    timeSlowActive: boolean;
}
```

**Step 2: 运行测试**

```bash
pnpm test
```

预期：所有测试 PASS

**Step 3: 提交**

```bash
git add src/engine/systems/RenderSystem.ts
git commit -m "refactor(RenderSystem): 更新渲染流程使用 VisualEffect"
```

---

## Task 10: 最终验证和文档更新

**Step 1: 运行所有测试**

```bash
pnpm test
```

预期：所有测试 PASS

**Step 2: 运行类型检查**

```bash
pnpm run type-check
```

预期：PASS

**Step 3: 手动测试游戏**

```bash
pnpm run dev
```

验证清单：
- [ ] 爆炸粒子效果正常
- [ ] 时间减速线条效果正常
- [ ] 冲击波效果正常
- [ ] 粒子随时间正确淡出
- [ ] 过期特效正确清理
- [ ] 游戏性能正常

**Step 4: 更新系统注释**

```typescript
// RenderSystem.ts
/**
 * 渲染系统 (RenderSystem)
 *
 * 职责：
 * - 遍历所有有 Sprite 组件的实体并绘制
 * - 绘制帧动画粒子（保留旧实现用于复杂帧动画）
 * - 绘制 VisualEffect 组件中的特效数据（粒子、线条、圆环）
 * - 绘制背景星空效果
 * - 绘制护盾、无敌状态等特效
 * - 绘制 Boss 血条
 * - 根据 Camera 偏移调整绘制位置（仅震屏，相机固定）
 * - 按固定顺序渲染（背景 < 精灵 < 玩家特效 < 粒子 < UI）
 *
 * 系统类型：表现层
 * 执行顺序：P7 - 在 VisualEffectSystem 之后
 */

// VisualEffectSystem.ts
/**
 * 视觉特效系统 (VisualEffectSystem)
 *
 * 职责：
 * - 提供统一的特效创建 API（spawnParticles、spawnLines、spawnCircles）
 * - 更新 VisualEffect 组件中的所有特效数据
 * - 更新粒子位置、生命周期
 * - 更新线条位置
 * - 更新圆环动画
 * - 清理过期的特效数据
 *
 * 系统类型：表现层
 * 执行顺序：P7 - 在 EffectPlayer 之后，RenderSystem 之前
 */
```

**Step 5: 提交最终更改**

```bash
git add src/engine/systems/RenderSystem.ts src/engine/systems/VisualEffectSystem.ts
git commit -m "docs: 更新系统注释文档"
```

---

## 总结

完成此计划后：

1. **职责分离清晰**：
   - `VisualEffectSystem` 负责创建和更新特效状态
   - `RenderSystem` 只负责绘制
   - `EffectPlayer` 负责监听事件，调用 VisualEffectSystem 的 API

2. **API 统一**：
   - `spawnParticles()` - 创建粒子特效
   - `spawnTimeSlowLines()` / `clearTimeSlowLines()` - 管理时间减速线条
   - `spawnCircle()` - 创建冲击波圆环

3. **性能优化**：
   - 批量渲染避免大量小实体
   - 特效数据紧凑存储在数组中

4. **可扩展性**：
   - 新增特效类型只需在 `VisualEffect` 添加新数组
   - 在 `VisualEffectSystem` 添加对应的 spawn API
   - 更新和渲染逻辑分离，易于维护

5. **后续工作**（非本计划范围）：
   - 考虑将帧动画粒子也迁移到 `VisualEffect`
   - 完全移除旧的多余代码
   - 添加更多特效类型（如：文字飘字、屏幕震动等）
