# 性能监控系统设计

## 概述

为游戏引擎的 `framePipeline` 添加性能监控能力，统计各系统执行耗时，当帧时间超过 60fps 阈值（16.67ms）时打印警告并输出各模块耗时详情。

## 需求

1. 统计 loop 里各个模块（系统）的耗时
2. 当帧时间超过 16.67ms 时，打印警告和各模块耗时
3. 混合监控模式：默认显示层级聚合，超阈值时自动展开显示系统详情
4. 提供可订阅的性能数据流，用于 HUD 帧率显示
5. 每帧统计，但可通过配置关闭

## 核心架构

### 类型定义

```typescript
/**
 * 性能监控配置
 */
interface PerformanceConfig {
  /** 是否启用监控 */
  enabled: boolean;
  /** 帧时间阈值（ms），超过此值触发警告 */
  frameTimeThreshold: number;
  /** 是否输出到控制台 */
  reportToConsole: boolean;
}

/**
 * 系统耗时记录
 */
interface SystemMetric {
  /** 系统名称 */
  name: string;
  /** 耗时（毫秒） */
  durationMs: number;
  /** 所属层级（P1-P8） */
  layer: string;
}

/**
 * 层级聚合数据
 */
interface LayerMetrics {
  /** 该层级总耗时 */
  totalMs: number;
  /** 该层级下各系统耗时 */
  systems: SystemMetric[];
}

/**
 * 帧性能快照
 */
interface FrameSnapshot {
  /** 总帧时间（ms） */
  frameTime: number;
  /** 是否超过阈值 */
  thresholdExceeded: boolean;
  /** 各层级聚合数据 */
  layers: Record<string, LayerMetrics>;
}
```

### PerformanceMonitor 类

```typescript
/**
 * 性能监控器
 *
 * 职责：
 * - 记录每个系统的执行时间
 * - 按层级聚合数据
 * - 超阈值时触发警告并输出流
 * - 提供配置开关
 */
export class PerformanceMonitor {
  private config: PerformanceConfig;
  private performance$ = new BehaviorSubject<FrameSnapshot | null>(null);

  /** 当前帧的临时数据 */
  private currentFrameSystems: SystemMetric[] = [];
  private currentFrameStart = 0;

  constructor(config: PerformanceConfig) {
    this.config = config;
  }

  /** 帧开始 */
  startFrame(): void {
    if (!this.config.enabled) return;
    this.currentFrameStart = performance.now();
    this.currentFrameSystems = [];
  }

  /** 记录系统耗时 */
  recordSystem(name: string, layer: string, durationMs: number): void {
    if (!this.config.enabled) return;
    this.currentFrameSystems.push({ name, durationMs, layer });
  }

  /** 帧结束，结算并输出 */
  endFrame(frameTime: number): void {
    if (!this.config.enabled) return;

    const exceeded = frameTime > this.config.frameTimeThreshold;
    const layers = this.aggregateByLayer(this.currentFrameSystems);

    const snapshot: FrameSnapshot = { frameTime, thresholdExceeded: exceeded, layers };
    this.performance$.next(snapshot);

    if (exceeded && this.config.reportToConsole) {
      this.reportWarning(frameTime, layers);
    }
  }

  /** 按层级聚合数据 */
  private aggregateByLayer(systems: SystemMetric[]): Record<string, LayerMetrics> {
    const layers: Record<string, LayerMetrics> = {};

    for (const sys of systems) {
      if (!layers[sys.layer]) {
        layers[sys.layer] = { totalMs: 0, systems: [] };
      }
      layers[sys.layer].totalMs += sys.durationMs;
      layers[sys.layer].systems.push(sys);
    }

    return layers;
  }

  /** 打印警告 */
  private reportWarning(frameTime: number, layers: Record<string, LayerMetrics>): void {
    const fps = (1000 / frameTime).toFixed(1);

    console.warn(
      `%c⚠️ 帧耗时超标: ${frameTime.toFixed(2)}ms (${fps} FPS)`,
      'color: #ff6b6b; font-weight: bold;'
    );

    const sortedLayers = Object.entries(layers).sort((a, b) => b[1].totalMs - a[1].totalMs);

    for (const [layerName, data] of sortedLayers) {
      const isSlowLayer = data.totalMs > 2;

      console.groupCollapsed(
        `%c${layerName}: ${data.totalMs.toFixed(2)}ms`,
        isSlowLayer ? 'color: #ff6b6b;' : 'color: #51cf66;'
      );

      const slowSystems = data.systems.filter(s => s.durationMs > 0.5);
      for (const sys of slowSystems) {
        const color = sys.durationMs > 2 ? '#ff6b6b' : '#ffd43b';
        console.log(`  %c${sys.name}: ${sys.durationMs.toFixed(2)}ms`, `color: ${color}`);
      }

      console.groupEnd();
    }
  }

  /** 获取性能流 */
  get stream(): BehaviorSubject<FrameSnapshot | null> {
    return this.performance$;
  }

  /** 运行时更新配置 */
  updateConfig(partial: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...partial };
  }
}
```

## 系统集成

### World 扩展

为了统一所有系统的签名，将 `RenderContext` 添加到 `World`：

```typescript
// world.ts
export interface World {
  // ... 现有属性
  /** 渲染上下文（由 RenderSystem 使用） */
  renderContext?: RenderContext;
}
```

### Engine 集成

```typescript
export class Engine {
  // ... 现有属性

  // 性能监控
  private perfMonitor = new PerformanceMonitor({
    enabled: false,           // 默认关闭
    frameTimeThreshold: 16.67,
    reportToConsole: true,
  });

  /** 性能数据流（外部可订阅） */
  public readonly performance$ = this.perfMonitor.stream;

  /** 启用/禁用性能监控 */
  public setPerformanceMonitoring(enabled: boolean): void {
    this.perfMonitor.updateConfig({ enabled });
    console.log('[Engine] Performance Monitoring:', enabled ? 'ENABLED' : 'DISABLED');
  }

  private framePipeline(world: World, dt: number) {
    const frameStart = performance.now();
    this.perfMonitor.startFrame();

    // P1. 决策层
    this.runSystem('InputSystem', 'P1', InputSystem, world, dt);
    this.runSystem('SpawnSystem', 'P1', SpawnSystem, world, dt);
    this.runSystem('BossSystem', 'P1', BossSystem, world, dt);
    this.runSystem('EnemySystem', 'P1', EnemySystem, world, dt);

    // P2. 状态层
    this.runSystem('BuffSystem', 'P2', BuffSystem, world, dt);
    this.runSystem('WeaponSystem', 'P2', WeaponSystem, world, dt);

    // P3. 物理层
    this.runSystem('MovementSystem', 'P3', MovementSystem, world, dt);

    // P4. 交互层
    this.runSystem('BombSystem', 'P4', BombSystem, world, dt);
    this.runSystem('CollisionSystem', 'P4', CollisionSystem, world, dt);
    this.runSystem('HomingSystem', 'P4', HomingSystem, world, dt);

    // P5. 结算层
    this.runSystem('PickupSystem', 'P5', PickupSystem, world, dt);
    this.runSystem('DamageResolutionSystem', 'P5', DamageResolutionSystem, world, dt);
    this.runSystem('ChainSystem', 'P5', ChainSystem, world, dt);
    this.runSystem('LootSystem', 'P5', LootSystem, world, dt);
    this.runSystem('ComboSystem', 'P5', ComboSystem, world, dt);

    // P7. 表现层
    this.runSystem('CameraSystem', 'P7', CameraSystem, world, dt);
    this.runSystem('EffectPlayer', 'P7', EffectPlayer, world, dt);
    this.runSystem('BlinkSystem', 'P7', BlinkSystem, world, dt);
    this.runSystem('VisualEffectSystem', 'P7', VisualEffectSystem, world, dt);
    this.runSystem('AudioSystem', 'P7', AudioSystem, world, dt);

    // P8. 清理层 + 渲染
    this.runSystem('LifetimeSystem', 'P8', LifetimeSystem, world, dt);
    this.runSystem('CleanupSystem', 'P8', CleanupSystem, world, dt);
    this.runSystem('RenderSystem', 'P8', RenderSystem, world, dt);

    const frameTime = performance.now() - frameStart;
    this.perfMonitor.endFrame(frameTime);
  }

  /** 辅助方法：运行并计时单个系统 */
  private runSystem<T extends (world: World, dt: number) => void>(
    name: string,
    layer: string,
    fn: T,
    world: World,
    dt: number
  ): void {
    const start = performance.now();
    fn(world, dt);
    const duration = performance.now() - start;
    this.perfMonitor.recordSystem(name, layer, duration);
  }
}
```

### RenderSystem 适配

```typescript
// RenderSystem 改造前
export function RenderSystem(world: World, ctx: RenderContext, dt: number) {
  // ...
}

// 改造后
export function RenderSystem(world: World, dt: number) {
  const ctx = world.renderContext;
  if (!ctx) return;
  // ... 原有逻辑
}
```

## 输出示例

当帧时间超过阈值时，控制台输出：

```
⚠️ 帧耗时超标: 18.42ms (54.3 FPS)
▼ P2: 5.23ms
    WeaponSystem: 4.12ms
    BuffSystem: 1.11ms
▼ P4: 4.56ms
    CollisionSystem: 3.89ms
    HomingSystem: 0.67ms
▼ P8: 3.21ms
    RenderSystem: 3.21ms
```

## 使用方式

### 启用监控

```typescript
// 启用性能监控
engine.setPerformanceMonitoring(true);
```

### 订阅性能数据（HUD 帧率显示）

```typescript
engine.performance$.subscribe(snapshot => {
  if (snapshot) {
    const fps = (1000 / snapshot.frameTime).toFixed(1);
    updateFPSDisplay(fps);
  }
});
```

## 层级划分

| 层级 | 职责 | 系统 |
| --- | --- | --- |
| **P1** | 决策层（输入与AI） | InputSystem, SpawnSystem, BossSystem, EnemySystem |
| **P2** | 状态层（数值更新） | BuffSystem, WeaponSystem |
| **P3** | 物理层（位移） | MovementSystem |
| **P4** | 交互层（核心碰撞） | BombSystem, CollisionSystem, HomingSystem |
| **P5** | 结算层（事件处理） | PickupSystem, DamageResolutionSystem, ChainSystem, LootSystem, ComboSystem |
| **P7** | 表现层（视听反馈） | CameraSystem, EffectPlayer, BlinkSystem, VisualEffectSystem, AudioSystem |
| **P8** | 清理层（生命周期） | LifetimeSystem, CleanupSystem, RenderSystem |

## 设计决策

1. **混合监控模式**：平时只看层级信息简洁清晰，出现性能问题时自动展开细节方便排查
2. **固定阈值**：16.67ms（60fps），简单直接
3. **每帧统计**：精确实时，通过配置开关控制开销
4. **统一系统签名**：将 `RenderContext` 放入 `World`，简化包装逻辑
5. **可配置性**：运行时动态开关，不影响正常游戏性能
