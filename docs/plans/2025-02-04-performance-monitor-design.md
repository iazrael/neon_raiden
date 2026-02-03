# 性能监控集成设计

**日期**: 2025-02-04
**状态**: 待实施

## 概述

将现有的 `PerformanceMonitor` 集成到游戏引擎中，提供实时的 FPS 和帧时间监控功能。

## 功能特性

- **简要模式显示**: 仅显示 FPS 和帧时间（如 `60 FPS • 16.7ms`）
- **动态颜色指示**:
  - ≥ 55 FPS: 绿色
  - 30-55 FPS: 黄色
  - < 30 FPS: 红色
- **快捷键切换**: 按 P 键开关性能监控
- **配置化**: 通过 `DebugConfig` 统一管理

## 架构设计

### 1. DebugConfig 扩展

```typescript
// src/engine/config/DebugConfig.ts
export const DebugConfig = {
    render: { enabled: false, logEntities: false },
    physics: { enabled: false },
    /** 性能监控 */
    performance: {
        enabled: false,
        frameTimeThreshold: 16.67,
        reportToConsole: true,
    },
};
```

### 2. Engine 集成

```typescript
// src/engine/engine.ts
import { PerformanceMonitor } from './utils/performance';
import { DebugConfig } from './config/DebugConfig';

export class Engine {
    private performanceMonitor: PerformanceMonitor;

    constructor() {
        this.performanceMonitor = new PerformanceMonitor(DebugConfig.performance);
    }

    // 暴露性能流供 UI 订阅
    get performanceStream() {
        return this.performanceMonitor.stream;
    }
}
```

### 3. GameUI 组件

```tsx
{/* 性能监控 - PAUSE 按钮上方 */}
{state === GameState.PLAYING && performanceData && (
  <div className="absolute bottom-32 left-6 pointer-events-none z-30">
    <div className={`text-sm font-mono font-bold tracking-wider drop-shadow-md ${
      performanceData.fps >= 55 ? 'text-green-400' :
      performanceData.fps >= 30 ? 'text-yellow-400' : 'text-red-400'
    }`}>
      {Math.round(performanceData.fps)} FPS • {performanceData.frameTime.toFixed(1)}ms
    </div>
  </div>
)}
```

### 4. 快捷键

```typescript
// App.tsx - P 键切换
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'p' || e.key === 'P') {
      DebugConfig.performance.enabled = !DebugConfig.performance.enabled;
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

## 系统层级映射

| 层级 | 系统 |
| --- | --- |
| P1 | InputSystem, SpawnSystem, BossSystem, EnemySystem |
| P2 | BuffSystem, WeaponSystem |
| P3 | MovementSystem |
| P4 | BombSystem, CollisionSystem, HomingSystem |
| P5 | PickupSystem, DamageResolutionSystem, ChainSystem, LootSystem, ComboSystem |
| P7 | CameraSystem, EffectSystem, BlinkSystem, AudioSystem |
| P8 | LifetimeSystem, CleanupSystem |

## 数据流

```
Engine.framePipeline
  → PerformanceMonitor.recordSystem(name, layer, durationMs)
  → performance$.next({ frameTime, thresholdExceeded, layers })
  → App 订阅
  → GameUI 显示
```

## 实施清单

- [ ] 扩展 `DebugConfig.ts`
- [ ] 在 `Engine` 中集成 `PerformanceMonitor`
- [ ] 在 `framePipeline` 中添加性能记录
- [ ] 扩展 `GameUIProps` 接口
- [ ] 在 `GameUI` 中添加性能显示组件
- [ ] 在 `App.tsx` 中订阅性能流
- [ ] 添加 P 键切换快捷键
- [ ] 测试并确保 `pnpm test` 和 `pnpm build` 通过
