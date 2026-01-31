# 流星背景效果实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 为新 ECS 系统添加流星背景效果，复用老系统参数（每 200ms 有 10% 概率生成流星，速度 10-20 像素/帧，拖尾长度 20-70 像素）。

**架构:**
- 扩展现有 `VisualEffect` 组件，添加 `meteors` 数组
- 在 `VisualEffectSystem` 中添加流星生成、更新和清理逻辑
- 在 `RenderSystem` 中添加流星渲染函数（绘制拖尾线条）

**技术栈:** TypeScript, Canvas 2D, 现有 ECS 架构

---

## 数据结构设计

```typescript
// 流星数据
interface VisualMeteor {
    x: number;        // 当前X坐标
    y: number;        // 当前Y坐标
    length: number;   // 拖尾长度（像素）
    vx: number;       // X轴速度（像素/秒）
    vy: number;       // Y轴速度（像素/秒）
}
```

**参数来源（老系统）：**
```typescript
// 生成参数
spawnInterval: 200        // 检查间隔（毫秒）
spawnChance: 0.1          // 生成概率 10%
spawnY: -100              // 初始Y坐标（屏幕上方）
lengthMin: 20             // 最小拖尾长度
lengthMax: 70             // 最大拖尾长度
vxMin: -2.5               // 最小X速度
vxMax: 2.5                // 最大X速度
vyMin: 10                 // 最小Y速度
vyMax: 20                 // 最大Y速度

// 清理条件
y > height + 100          // 超出屏幕下方
x < -100                  // 超出屏幕左侧
```

---

## Task 1: 扩展 VisualEffect 组件

**文件:**
- 修改: `src/engine/components/visual.ts`

**Step 1: 添加 VisualMeteor 接口**

在 `visual.ts` 中，在 `VisualCircle` 接口之后添加：

```typescript
/** 视觉流星 - 背景流星效果 */
export interface VisualMeteor {
    /** X坐标 */
    x: number;
    /** Y坐标 */
    y: number;
    /** 拖尾长度 */
    length: number;
    /** X轴速度（像素/秒） */
    vx: number;
    /** Y轴速度（像素/秒） */
    vy: number;
}
```

**Step 2: 修改 VisualEffect 类，添加 meteors 属性**

在 `VisualEffect` 类中，添加 `meteors` 数组：

```typescript
export class VisualEffect extends Component {
    constructor(cfg?: {
        particles?: VisualParticle[];
        lines?: VisualLine[];
        circles?: VisualCircle[];
        meteors?: VisualMeteor[];        // 新增
    }) {
        super();
        this.particles = cfg?.particles ?? [];
        this.lines = cfg?.lines ?? [];
        this.circles = cfg?.circles ?? [];
        this.meteors = cfg?.meteors ?? [];  // 新增
    }

    /** 粒子数组 */
    particles: VisualParticle[];
    /** 线条数组（时间减速等） */
    lines: VisualLine[];
    /** 圆环数组（冲击波等） */
    circles: VisualCircle[];
    /** 流星数组（背景流星效果） */
    meteors: VisualMeteor[];  // 新增

    // ... 其他代码保持不变
}
```

**Step 3: 验证类型检查**

运行: `pnpm run type-check`

预期: 无类型错误

**Step 4: 提交**

```bash
git add src/engine/components/visual.ts
git commit -m "feat(components): 添加 VisualMeteor 接口和 meteors 属性"
```

---

## Task 2: 扩展 VisualEffectSystem

**文件:**
- 修改: `src/engine/systems/VisualEffectSystem.ts`

**Step 1: 添加流星生成函数**

在文件中，`spawnCircle` 函数之后添加：

```typescript
/**
 * 生成流星
 * @param world 世界对象
 * @param width 画布宽度
 * @param height 画布高度
 * @param dt 距离上次调用的时间（毫秒）
 * @param timer 累积计时器（引用传递）
 */
export function spawnMeteor(
    world: World,
    width: number,
    height: number,
    dt: number,
    timer: { value: number },
): void {
    // 累加计时器
    timer.value += dt;

    // 每 200ms 检查一次
    const SPAWN_INTERVAL = 200;
    if (timer.value < SPAWN_INTERVAL) {
        return;
    }
    timer.value = 0;

    // 10% 概率生成
    const SPAWN_CHANCE = 0.1;
    if (Math.random() >= SPAWN_CHANCE) {
        return;
    }

    const [effect] = getComponents(world, world.visualEffectId, [VisualEffect]);
    if (!effect) {
        return;
    }

    // 生成流星（复用老系统参数）
    effect.meteors.push({
        x: Math.random() * width,
        y: -100,
        length: Math.random() * 50 + 20,  // 20-70
        vx: (Math.random() - 0.5) * 5,    // -2.5 到 2.5
        vy: Math.random() * 10 + 10,      // 10-20
    });
}
```

**Step 2: 添加流星更新函数**

在文件中，`updateCircles` 函数之后添加：

```typescript
/**
 * 更新流星位置
 */
function updateMeteors(
    meteors: VisualMeteor[],
    width: number,
    height: number,
    dt: number,
): void {
    const timeScale = dt / (1000 / 60); // 60 fps

    for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];

        // 更新位置
        m.x += m.vx * timeScale;
        m.y += m.vy * timeScale;

        // 清理超出屏幕的流星
        if (m.y > height + 100 || m.x < -100 || m.x > width + 100) {
            meteors.splice(i, 1);
        }
    }
}
```

**Step 3: 修改 VisualEffectSystem 主函数**

在主函数中添加流星更新逻辑：

```typescript
export function VisualEffectSystem(world: World, dt: number): void {
    const width = world.width;
    const height = world.height;
    const [effect] = getComponents(world, world.visualEffectId, [VisualEffect]);
    if (!effect) {
        return;
    }

    // 更新粒子
    if (effect.particles.length > 0) {
        updateParticles(effect.particles, dt);
    }

    // 更新线条
    if (effect.lines.length > 0) {
        updateLines(effect.lines, height, dt);
    }

    // 更新圆环
    if (effect.circles.length > 0) {
        updateCircles(effect.circles, dt);
    }

    // 更新流星
    if (effect.meteors.length > 0) {
        updateMeteors(effect.meteors, width, height, dt);
    }
}
```

**Step 4: 导出新函数**

确保 `spawnMeteor` 被导出（文件顶部的 export 函数列表不需要修改，因为使用的是命名导出）。

**Step 5: 验证类型检查**

运行: `pnpm run type-check`

预期: 无类型错误

**Step 6: 提交**

```bash
git add src/engine/systems/VisualEffectSystem.ts
git commit -m "feat(VisualEffectSystem): 添加流星生成和更新逻辑"
```

---

## Task 3: 扩展 RenderSystem

**文件:**
- 修改: `src/engine/systems/RenderSystem.ts`

**Step 1: 添加流星渲染函数**

在 `drawTimeSlowEffect` 函数之后添加：

```typescript
/**
 * 绘制流星背景效果
 */
function drawMeteors(
    ctx: CanvasRenderingContext2D,
    meteors: VisualMeteor[],
    timeScale: number,
): void {
    if (meteors.length === 0) {
        return;
    }

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;

    for (const m of meteors) {
        ctx.beginPath();
        // 从当前位置向速度反方向延伸，形成拖尾
        const tailX = m.x - m.vx * 5 * timeScale;
        const tailY = m.y - m.vy * 5 * timeScale;
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
    }

    ctx.restore();
}
```

**Step 2: 在 drawBackground 函数中添加流星参数**

修改 `drawBackground` 函数签名，添加 `meteors` 参数：

```typescript
function drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    timeSlowActive: boolean,
    meteors: VisualMeteor[],  // 新增
): void {
    // ... 现有代码保持不变
}
```

**Step 3: 在 drawBackground 函数末尾调用 drawMeteors**

在 `drawBackground` 函数末尾（近处星星绘制之后）添加：

```typescript
    // 近处的星星（快速）
    ctx.fillStyle = "rgba(200, 230, 255, 0.8)";
    for (let i = 0; i < 30; i++) {
        const speed = (i % 3) + 2;
        const sx = (i * 57) % width;
        const sy = (i * 31 + t * 60 * speed * timeScale) % height;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // 绘制流星
    drawMeteors(ctx, meteors, timeScale);
}
```

**Step 4: 修改 collectRenderItems 函数，收集流星数据**

修改 `RenderQueue` 接口，添加 `meteors` 字段：

```typescript
interface RenderQueue {
    sprites: RenderItem[];
    playerEffect: PlayerEffectData | null;
    bossInfo: BossInfo | null;
    timeSlowActive: boolean;
    visualEffect: VisualEffect;
    meteors: VisualMeteor[];  // 新增
}
```

在 `collectRenderItems` 函数中初始化 `meteors`：

```typescript
function collectRenderItems(world: World): RenderQueue {
    const queue: RenderQueue = {
        sprites: [],
        playerEffect: null,
        bossInfo: null,
        timeSlowActive: false,
        visualEffect: null,
        meteors: [],  // 新增
    };
    const [effect] = getComponents(world, world.visualEffectId, [VisualEffect]);
    queue.visualEffect = effect;
    queue.meteors = effect?.meteors ?? [];  // 新增

    // ... 其余代码保持不变
}
```

**Step 5: 修改 RenderSystem 主函数，传递流星数据**

```typescript
export function RenderSystem(
    world: World,
    renderCtx: RenderContext,
    dt: number,
): void {
    const { canvas, context, width, height } = renderCtx;
    const { camera } = world.renderState;

    // 调试日志
    if (DebugConfig.render.enabled && DebugConfig.render.logEntities) {
        console.log("[RenderSystem] Entities:", world.entities.size);
    }

    // 1. 单次收集所有渲染项
    const queue = collectRenderItems(world);

    // 2. 绘制背景（传递流星数据）
    drawBackground(context, width, height, queue.timeSlowActive, queue.meteors);

    // ... 其余代码保持不变
}
```

**Step 6: 验证类型检查**

运行: `pnpm run type-check`

预期: 无类型错误

**Step 7: 提交**

```bash
git add src/engine/systems/RenderSystem.ts
git commit -m "feat(RenderSystem): 添加流星渲染逻辑"
```

---

## Task 4: 在主循环中集成流星生成

**文件:**
- 修改: `src/engine/main.ts`（或相应的主循环文件）

**Step 1: 找到主循环中 VisualEffectSystem 的调用位置**

查找类似 `VisualEffectSystem(world, dt)` 的代码。

**Step 2: 添加流星生成调用**

在 `VisualEffectSystem` 调用之前，添加流星生成逻辑：

```typescript
// 创建流星计时器（在文件顶部或其他合适位置）
const meteorTimer = { value: 0 };

// 在主循环中
spawnMeteor(world, world.width, world.height, dt, meteorTimer);
VisualEffectSystem(world, dt);
```

**Step 3: 验证类型检查**

运行: `pnpm run type-check`

预期: 无类型错误

**Step 4: 运行游戏验证流星效果**

运行: `pnpm run dev`

预期: 游戏背景中偶尔出现流星，从屏幕上方划过，带有白色拖尾效果。

**Step 5: 提交**

```bash
git add src/engine/main.ts
git commit -m "feat(main): 集成流星生成逻辑到主循环"
```

---

## Task 5: 可选优化 - 时间减速影响流星

**文件:**
- 修改: `src/engine/systems/RenderSystem.ts`

**Step 1: 修改 drawMeteors 函数，让流星受时间减速影响**

```typescript
/**
 * 绘制流星背景效果
 */
function drawMeteors(
    ctx: CanvasRenderingContext2D,
    meteors: VisualMeteor[],
    timeSlowActive: boolean,  // 新增参数
): void {
    if (meteors.length === 0) {
        return;
    }

    // 时间减速时流星变慢
    const timeScale = timeSlowActive ? 0.5 : 1.0;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;

    for (const m of meteors) {
        ctx.beginPath();
        const tailX = m.x - m.vx * 5 * timeScale;
        const tailY = m.y - m.vy * 5 * timeScale;
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
    }

    ctx.restore();
}
```

**Step 2: 修改 drawBackground 调用**

```typescript
drawMeteors(ctx, meteors, timeSlowActive);
```

**Step 3: 提交**

```bash
git add src/engine/systems/RenderSystem.ts
git commit -m "feat(RenderSystem): 流星受时间减速影响"
```

---

## 验收标准

完成所有任务后，验证以下功能：

1. **流星生成**: 游戏运行时，背景中偶尔出现白色流星
2. **拖尾效果**: 流星带有向后的拖尾线条
3. **自动清理**: 流星超出屏幕后自动消失
4. **时间减速**: （可选）时间减速时流星移动变慢
5. **类型检查**: `pnpm run type-check` 无错误
6. **测试通过**: `pnpm test` 全部通过

---

## 完成后清理

1. 移除任何调试日志
2. 确保所有代码符合项目 ESLint 规则
3. 创建最终的 git commit
