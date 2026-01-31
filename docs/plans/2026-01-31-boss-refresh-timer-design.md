# Boss 刷新计时器设计方案

**日期:** 2026-01-31
**状态:** 设计完成，待实现

---

## 📋 问题背景

### 当前问题

- `world.time` 是从游戏开始就一直在增长的**全局时间**
- Boss 刷新逻辑使用 `world.time >= spawnTime` 判断（绝对时间）
- **问题：** 第一关正常（0-60秒刷新），但进入第二关时 `world.time` 可能已经 120 秒，而 `spawnTime` 还是 60 秒，导致**一进关就立即刷新 Boss**

### 需求

1. Boss 刷新时间应该是"进入关卡后 X 秒"，而不是"游戏开始后 X 秒"
2. 打败 Boss 后自动进入下一关
3. 进入新关卡时重置 Boss 计时器

---

## 🎯 设计方案

### 方案 A：记录关卡开始时间（已采用）

**核心思想：** 在 BossState 中记录关卡开始时间戳，Boss 刷新使用相对时间计算。

---

## 📐 详细设计

### 1. 数据结构修改

**文件:** `src/engine/types/index.ts`

```typescript
export interface BossState {
    bossId: number;
    timer: number;           // Boss 刷新间隔（毫秒），默认 60000
    spawned: boolean;        // Boss 是否已刷出
    levelStartTime: number;  // 本关开始时间戳（基于 world.time）
    isLevelTransitioning: boolean; // 关卡切换标记（防止切换期间重复触发）
}
```

**说明：**
- `levelStartTime`: 记录进入当前关卡时的 `world.time`
- `isLevelTransitioning`: Boss 死亡后设置标记，防止重复触发关卡切换

---

### 2. Boss 刷新判断逻辑

**文件:** `src/engine/systems/SpawnSystem.ts`

**修改前 (221-227行):**
```typescript
const spawnTime = world.bossState.timer > 0 ? world.bossState.timer : BOSS_SPAWN_TIME;
if (world.time >= spawnTime) {
    world.bossState.spawned = true;
    return true;
}
```

**修改后:**
```typescript
// 计算当前关卡经过的时间
const spawnInterval = world.bossState.timer > 0 ? world.bossState.timer : BOSS_SPAWN_TIME;
const levelElapsedTime = world.time - world.bossState.levelStartTime;
if (levelElapsedTime >= spawnInterval) {
    world.bossState.spawned = true;
    return true;
}
```

**核心改动：**
- `spawnInterval`: boss 刷新间隔（如 60 秒）
- `levelElapsedTime`: 关卡经过时间 = `world.time - levelStartTime`
- 判断条件：关卡经过时间 >= 刷新间隔

---

### 3. 关卡切换时的重置逻辑

#### 3.1 修改 resetBossSpawnState

**文件:** `src/engine/systems/SpawnSystem.ts`

```typescript
export function resetBossSpawnState(world: World): void {
    world.bossState.bossId = 0;
    world.bossState.timer = 0;
    world.bossState.spawned = false;
    world.bossState.levelStartTime = world.time; // 记录新关卡开始时间
    world.bossState.isLevelTransitioning = false; // 重置切换标记
}
```

#### 3.2 修改 createWorld 初始化

**文件:** `src/engine/world.ts`

```typescript
bossState: {
    bossId: 0,
    timer: BOSS_SPAWN_TIME,
    spawned: false,
    levelStartTime: 0, // 第一关从游戏开始时计时
    isLevelTransitioning: false,
},
```

**说明：**
- 第一关 `levelStartTime` 初始化为 `0`，与 `world.time` 从 0 开始一致
- 后续关卡通过 `resetBossSpawnState()` 重置 `levelStartTime`

---

### 4. 关卡切换系统

#### 4.1 创建 LevelSystem

**文件:** `src/engine/systems/LevelSystem.ts` (新建)

```typescript
/**
 * 关卡系统
 *
 * 职责:
 * - 监听 Boss 死亡事件
 * - 触发关卡切换
 * - 重置 Boss 状态和关卡开始时间
 */
import { World } from '../world';
import { BossTag } from '../components';
import { EventTags, getEvents, KillEvent } from '../events';

/**
 * 关卡系统主函数
 * @param world 世界对象
 */
export function LevelSystem(world: World): void {
    // 如果正在切换关卡，跳过检测
    if (world.bossState.isLevelTransitioning) {
        return;
    }

    // 获取本帧的击杀事件
    const killEvents = getEvents<KillEvent>(world, EventTags.Kill);

    for (const event of killEvents) {
        const victimComps = world.entities.get(event.victim);
        if (!victimComps) continue;

        // 检查死亡的是否是 Boss
        const isBoss = victimComps.some(BossTag.check);
        if (isBoss) {
            // Boss 被击败，设置关卡切换标记
            world.bossState.isLevelTransitioning = true;
            console.log('[LevelSystem] Boss defeated, level transition scheduled...');
        }
    }
}
```

#### 4.2 修改 Engine 主循环

**文件:** `src/engine/engine.ts`

**1. 在 framePipeline 中添加 LevelSystem:**

```typescript
private framePipeline(world: World, dt: number) {
    // ... P0-P4 系统

    // P5. 结算层 (事件处理)
    PickupSystem(world, dt);
    DamageResolutionSystem(world, dt);
    LootSystem(world, dt);
    LevelSystem(world);           // ← 新增: 关卡系统
    ComboSystem(world, dt);

    // ... P6-P8 系统

    CleanupSystem(world, dt);

    // ← 在这里处理关卡切换（清理之后）
    this.handleLevelTransitionIfNeeded(world);

    // 渲染系统（最后执行）
    RenderSystem(world, this.getRenderContext(), dt);
}
```

**2. 在 Engine 类中添加关卡切换处理方法:**

```typescript
/**
 * 处理关卡切换（在 CleanupSystem 之后调用）
 * @param world 世界对象
 */
private handleLevelTransitionIfNeeded(world: World): void {
    // 检查是否有 Boss 实体存在
    const bossExists = [...world.entities.values()].some(comps =>
        comps.some(BossTag.check)
    );

    // 如果 Boss 死亡且实体已被清理，执行关卡切换
    if (world.bossState.isLevelTransitioning && !bossExists) {
        world.level += 1;
        resetBossSpawnState(world);
        console.log(`[Engine] Entering level ${world.level}`);

        // TODO: 可以在这里添加其他关卡切换逻辑:
        // - 触发关卡过渡 UI
        // - 重置玩家状态（可选）
        // - 播放过场动画等
    }
}
```

**设计理由：**
- LevelSystem 在 P5 层检测 Boss 死亡，设置 `isLevelTransitioning = true`
- 等待 P8 层 CleanupSystem 清理 Boss 实体
- 在 `handleLevelTransitionIfNeeded` 中检查 Boss 实体已清理，才执行真正的关卡切换
- **避免影响：** 后续系统（RenderSystem, CameraSystem 等）在 Boss 实体清理前仍可正常访问 BossTag/BossState

---

## 🔄 执行流程

### 正常流程（第一关）

1. **游戏开始**
   - `world.time = 0`, `levelStartTime = 0`
   - SpawnSystem 检查：`0 - 0 = 0 < 60000` ✅ 不刷新

2. **60 秒后**
   - `world.time = 60000`, `levelStartTime = 0`
   - SpawnSystem 检查：`60000 - 0 = 60000 >= 60000` ✅ 刷新 Boss

3. **Boss 被击败**
   - DamageResolutionSystem 产生 KillEvent
   - LevelSystem 检测到 BossTag → 设置 `isLevelTransitioning = true`
   - CleanupSystem 清理 Boss 实体
   - `handleLevelTransitionIfNeeded` 检测 Boss 不存在 → `world.level = 2`, `resetBossSpawnState()`
   - `levelStartTime = 60000`（当前 world.time）

### 进入第二关

4. **第二关开始**
   - `world.time = 60000`, `levelStartTime = 60000`
   - SpawnSystem 检查：`60000 - 60000 = 0 < 60000` ✅ 不刷新

5. **第二关 60 秒后**
   - `world.time = 120000`, `levelStartTime = 60000`
   - SpawnSystem 检查：`120000 - 60000 = 60000 >= 60000` ✅ 刷新 Boss

---

## 📁 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/engine/types/index.ts` | 修改 | BossState 接口添加 `levelStartTime` 和 `isLevelTransitioning` 字段 |
| `src/engine/systems/SpawnSystem.ts` | 修改 | 修改 Boss 刷新判断逻辑和 `resetBossSpawnState` 函数 |
| `src/engine/world.ts` | 修改 | `createWorld` 函数初始化新字段 |
| `src/engine/systems/LevelSystem.ts` | 新建 | 关卡系统，监听 Boss 死亡事件 |
| `src/engine/engine.ts` | 修改 | 导入 LevelSystem，添加到 framePipeline，添加 `handleLevelTransitionIfNeeded` 方法 |
| `src/engine/systems/index.ts` | 修改 | 导出 LevelSystem |

---

## ✅ 验收标准

1. **第一关 Boss 正常刷新** - 游戏开始 60 秒后 Boss 出现
2. **第二关 Boss 延迟刷新** - 打败第一关 Boss 后，进入第二关，60 秒后才刷新
3. **关卡正常切换** - Boss 被击败后，`world.level` 自动 +1
4. **不影响其他系统** - Boss 死亡动画、相机效果、清理系统等正常工作

---

## 🔍 参考实现

老系统 (`game/GameEngine.ts`) 的处理方式：

- 第 80 行：`levelStartTime: number = 0` - 记录关卡开始时间
- 第 260 行：`this.levelStartTime = Date.now()` - 游戏开始时初始化
- 第 518 行：`const levelDuration = (Date.now() - this.levelStartTime) / 1000` - 计算关卡经过时间
- 第 919 行：`this.levelStartTime = Date.now()` - 切换关卡时重置时间
- 第 913 行：`this.isLevelTransitioning = true` - 阻止切换期间重复触发
- 第 915-943 行：`setTimeout(() => { level++ }, 3000)` - 延迟 3 秒切换

新系统设计与老系统逻辑一致，但采用 ECS 架构和事件驱动机制。
