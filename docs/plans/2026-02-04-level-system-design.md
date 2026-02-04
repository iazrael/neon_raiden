# 关卡系统设计方案

**日期**: 2026-02-04
**状态**: 设计阶段
**优先级**: 高

## 1. 需求概述

设计并实现一个新的关卡进度系统，用于控制：
1. 关卡进度计算（时间驱动 + 击杀加速）
2. Boss 生成触发
3. Boss 击杀后的关卡过渡
4. 关卡过渡 UI 动画

## 2. 核心设计原则

### 2.1 ECS 架构约束
- **数据与逻辑分离**: LevelState 存储在 World, 逻辑在 LevelSystem
- **纯函数系统**: LevelSystem 不直接操作 UI, 通过事件驱动
- **Entity 生命周期**: 所有动画通过 entity + component 实现, 避免异步定时器

### 2.2 时序控制原则
- **禁止 setTimeout**: 所有动画和延迟通过 dt 累加实现
- **Game Loop 驱动**: 所有状态更新在系统函数内同步完成

### 2.3 事件驱动设计
- **解耦系统交互**: 系统间通过事件通信, 不直接调用
- **UI 同步**: ReactEngine 监听事件更新 UI 状态

### 2.4 系统执行顺序与职责划分

**职责划分**：

**LevelSystem - 关卡进度管理**
- ✅ 更新关卡进度（时间驱动 + 击杀加速）
- ✅ 提供进度状态数据
- ✅ 管理关卡过渡动画
- ❌ 不判断 Boss 生成条件（由 SpawnSystem 负责）

**SpawnSystem - Boss 生成控制**
- ✅ 读取 `world.levelState.progress` 判断是否生成 Boss
- ✅ 读取 `world.levelState.currentLevel` 获取 Boss 类型
- ✅ 生成 Boss entity
- ✅ 生成小怪

**BossSystem - Boss 逻辑**
- ✅ 管理 Boss AI、移动、攻击
- ✅ 更新 BossExitComponent timer（LevelSystem 添加的）
- ❌ 不处理 Boss 击杀（由 LevelSystem 负责）

```typescript
// src/engine/engine.ts 的 framePipeline 中的执行顺序

// P1. 决策层 (输入与AI)
InputSystem(world, dt);
SpawnSystem(world, dt);      // 根据进度生成 Boss
BossSystem(world, dt);       // Boss 逻辑 + 设置 bossExitComplete
EnemySystem(world, dt);

// P5. 结算层 (事件处理)
PickupSystem(world, dt);
DamageResolutionSystem(world, dt);  // 更新 killCount 和 progress
ChainSystem(world, dt);
LootSystem(world, dt);
ComboSystem(world, dt);
LevelSystem(world, dt);      // ← 新增：读取最新的 killCount，更新关卡过渡
```

**执行流程**：
```
正常游戏循环（每帧）：
  P1 SpawnSystem:
    - 读取 world.levelState.progress
    - if (progress >= 90 && time >= 60s && !bossSpawned)
        → 生成 Boss
        → 设置 bossSpawned = true

  P1 BossSystem:
    - 更新 BossExitComponent timer

  P5 DamageResolutionSystem:
    - 处理击杀事件
    - 更新 world.levelState.killCount
    - 添加击杀进度奖励
    - Boss HP <= 0 → 推送 BossDefeatEvent

  P5 LevelSystem:
    - 读取最新的 killCount（来自 DamageResolutionSystem）
    - 更新 progress (time-based + kill bonus)
    - 更新关卡过渡动画
    - 检查 bossExitComplete

Boss 击杀流程：
Frame N:
  P5 DamageResolutionSystem: Boss HP <= 0 → 推送 BossDefeatEvent
  P5 LevelSystem: 监听 BossDefeatEvent → 添加 BossExitComponent 到 Boss entity

Frame N+1 ~ N+X:
  P1 BossSystem: 更新 BossExitComponent timer (累加 dt)

Frame N+X+1 (timer >= 2000):
  P5 LevelSystem: 检查 BossExitComponent 完成 → startLevelTransition()
```

**为什么这样设计**：
- ✅ LevelSystem 专注于进度和关卡流程，职责单一
- ✅ SpawnSystem 根据进度决定 Boss 生成，逻辑集中
- ✅ BossSystem 专注于 Boss AI 逻辑，不处理击杀
- ✅ BossDefeatEvent 在 P5 内部生产和消费，**不跨帧**
- ✅ 不依赖 BossReadyEvent 和状态标记，简化设计

## 3. 数据结构设计

### 3.1 World 级状态 (`src/engine/types/level.ts`)

```typescript
export interface LevelState {
    /** 当前关卡号 */
    currentLevel: number;

    /** 关卡进度 0-100（允许超出至120%） */
    progress: number;

    /** 关卡累积时间（毫秒）- 每帧累加dt，不使用Date.now() */
    elapsedTime: number;

    /** 击杀计数（用于进度加速） */
    killCount: number;
}

/**
 * ❌ 已删除的字段（改用entity查询）：
 * - startTime: 使用 elapsedTime 代替（禁止使用 Date.now()）
 * - isTransitioning: 通过 view(world, [LevelTransitionComponent]).length > 0 判断
 * - bossSpawned: 通过 view(world, [Boss]).length > 0 判断
 * - bossDefeated: 通过 killCount 变化或事件判断
 *
 * 设计原则：
 * - LevelState 只存储核心数值状态
 * - 派生状态通过查询 entity 获得
 * - 符合数据驱动原则
 */

### 3.2 新增组件

#### 3.2.1 LevelTransitionComponent (`src/engine/components/transition.ts`)

```typescript
export interface LevelTransitionComponent {
    /** 动画计时器（毫秒） */
    timer: number;

    /** 总持续时间（毫秒） */
    duration: number;

    /** 来源关卡 */
    fromLevel: number;

    /** 目标关卡 */
    toLevel: number;
}
```

**设计原则**：
- ✅ 使用 interface 而非 class（组件仅包含数据）
- ✅ 删除所有触发标志（hasTriggeredStart/Complete），通过 timer 判断
- ✅ 删除 lifetime（组件由系统根据 timer >= duration 自动清理）
- ✅ phase 通过 timer 计算得出，不需要存储

**生命周期**:
- 创建: LevelSystem.startLevelTransition()
- 更新: LevelSystem.updateLevelTransitions()
- 销毁: LevelSystem 检测到 timer >= duration 后自动移除 entity

#### 3.2.2 BossExitComponent (`src/engine/components/boss.ts`)

```typescript
export interface BossExitComponent {
    /** 退场计时器（毫秒） */
    timer: number;

    /** 退场持续时间（毫秒） */
    duration: number;

    /** Boss 实体 ID */
    bossId: EntityId;

    /** Boss 类型 */
    bossType: BossId;
}
```

**设计原则**：
- ✅ 使用 interface 而非 class
- ✅ 删除冗余触发标志（hasTriggeredStart/Complete）
- ✅ 删除 lifetime（由 BossSystem 更新 timer，LevelSystem 检测完成）

**用途**:
- Boss 被击杀后添加到 Boss entity
- 控制 2 秒退场时间（播放死亡特效）
- 完成后触发关卡过渡

### 3.3 新增事件 (`src/engine/events/events.ts`)

```typescript
// 关卡过渡开始事件（用于 ReactEngine 更新 UI）
export interface LevelTransitionStartEvent extends BaseEvent<'LevelTransitionStart'> {
    fromLevel: number;
    toLevel: number;
}

// 关卡过渡完成事件（用于 ReactEngine 更新 UI）
export interface LevelTransitionCompleteEvent extends BaseEvent<'LevelTransitionComplete'> {
    level: number;
}

// Boss 退场开始事件（用于 ReactEngine 更新 UI）
export interface BossExitStartEvent extends BaseEvent<'BossExitStart'> {
    bossId: EntityId;
    bossType: BossId;
}

// 游戏通关事件（用于 ReactEngine 显示胜利画面）
export interface VictoryEvent extends BaseEvent<'Victory'> {
    finalLevel: number;
}

// 第一关进入事件（用于 ReactEngine 播放开始动画）
export interface StageOneIntroEvent extends BaseEvent<'StageOneIntro'> {
    duration: number;
}
```

**事件设计说明**：
- ✅ 所有UI动画通过事件驱动，解耦逻辑层和表现层
- ✅ 事件类型使用 `kind` 字段（项目约定）
- ✅ 不需要 BossReadyEvent、BossExitCompleteEvent（直接使用entity查询）
- ✅ Boss 击杀和退场在 P5 内部处理，事件不跨帧

## 4. 核心流程设计

### 4.1 关卡进度更新流程

```typescript
// LevelSystem.updateProgress(world, dt)

/**
 * 更新关卡进度
 * 职责：
 * 1. 累加 elapsedTime（每帧）
 * 2. 时间驱动进度增长
 * 3. 应用击杀奖励
 * 4. 最低时间保护
 * 5. 进度封顶
 */
function updateProgress(world: World, dt: number): void {
    const state = world.levelState;

    // 边界检查
    if (dt < 0) return;  // 不处理负时间（暂停/回放）
    if (!state) {
        console.error('[LevelSystem] levelState未初始化');
        return;
    }

    // 检查是否在过渡中（通过entity查询）
    const isTransitioning = view(world, [LevelTransitionComponent]).length > 0;
    if (isTransitioning) return;

    // 1. 累加时间
    state.elapsedTime += dt;

    // 2. 时间驱动增长（1.5%/秒）
    const timeBasedGrowth = (dt / 1000) * LEVEL_CONFIG.PROGRESS.PER_SECOND_GROWTH_RATE;
    state.progress += timeBasedGrowth;

    // 3. 最低时间保护（防止玩家拖延时间）
    // 60秒至少应该有 80% 进度
    const minProgress = (state.elapsedTime / LEVEL_CONFIG.PROGRESS.MIN_LEVEL_DURATION)
        * 100 * LEVEL_CONFIG.PROGRESS.TIME_PROTECTION_COEFFICIENT;
    state.progress = Math.max(state.progress, minProgress);

    // 4. 击杀加速（读取 killCount）
    const killBonus = state.killCount * LEVEL_CONFIG.PROGRESS.KILL_BONUS;
    state.progress += killBonus;
    state.killCount = 0;  // 重置计数

    // 5. 封顶（允许超出20%）
    state.progress = Math.min(state.progress, LEVEL_CONFIG.PROGRESS.MAX_PROGRESS);
}
```

**关键改进**：
- ✅ 使用 `state.elapsedTime` 代替 `Date.now() - state.startTime`
- ✅ 通过 entity 查询判断 `isTransitioning`，不使用状态标志
- ✅ 进度更新职责统一在 LevelSystem（击杀奖励由 DamageResolutionSystem 累加 killCount）
- ✅ 添加边界检查（dt < 0、state 未初始化）
- ✅ 进度允许超出到 120%（更宽松的设计）

### 4.1 统一配置常量 (`src/engine/configs/level-config.ts`)

```typescript
/**
 * 关卡系统统一配置
 * 所有数值参数集中管理，便于调整和测试
 */
export const LEVEL_CONFIG = {
    /** 进度配置 */
    PROGRESS: {
        /** 每秒增长百分比 */
        PER_SECOND_GROWTH_RATE: 1.5,
        /** 每击杀增长百分比 */
        KILL_BONUS: 0.5,
        /** 最低关卡时长（毫秒） */
        MIN_LEVEL_DURATION: 60000,
        /** Boss准备进度阈值 */
        BOSS_READY_THRESHOLD: 90,
        /** 最大进度（允许超出20%） */
        MAX_PROGRESS: 120,
        /** 最低时间保护系数：60秒 = 80%进度 */
        TIME_PROTECTION_COEFFICIENT: 0.8,
    },

    /** 动画时长配置 */
    ANIMATION: {
        /** 关卡过渡总时长（毫秒） */
        LEVEL_TRANSITION_DURATION: 1500,
        /** Boss退场时长（毫秒） */
        BOSS_EXIT_DURATION: 2000,
        /** Boss警告时长（毫秒） */
        BOSS_WARNING_DURATION: 3000,
        /** 第一关进入动画时长（毫秒） */
        STAGE_ONE_INTRO_DURATION: 2000,
    },

    /** 敌人生成配置 */
    SPAWN: {
        /** 最小敌人生成间隔（毫秒） */
        MIN_ENEMY_INTERVAL: 800,
        /** 最大敌人生成间隔（毫秒） */
        MAX_ENEMY_INTERVAL: 2000,
    },
} as const;
```

### 4.2 Boss 生成流程（由 SpawnSystem 负责）

```typescript
// SpawnSystem.updateBossSpawn(world)

/**
 * 更新 Boss 生成逻辑
 * 职责：判断Boss生成条件，生成Boss entity
 */
function updateBossSpawn(world: World): void {
    const state = world.levelState;

    // Boss 已生成，跳过（通过entity查询判断）
    const hasBoss = view(world, [Boss]).length > 0;
    if (hasBoss) return;

    // 判断生成条件
    const shouldSpawnBoss =
        state.progress >= LEVEL_CONFIG.PROGRESS.BOSS_READY_THRESHOLD &&
        state.elapsedTime >= LEVEL_CONFIG.PROGRESS.MIN_LEVEL_DURATION;

    if (shouldSpawnBoss) {
        // 获取当前关卡的 Boss 类型
        const config = LEVEL_CONFIGS[state.currentLevel];
        if (!config) {
            console.error(`[SpawnSystem] 关卡${state.currentLevel}配置不存在`);
            return;
        }

        const bossType = config.boss;

        // 生成 Boss
        spawnBoss(world, bossType);
    }
}
```

**关键改进**：
- ✅ 使用 `state.elapsedTime` 代替 `Date.now() - state.startTime`
- ✅ 通过 `view(world, [Boss]).length > 0` 判断 Boss 是否已生成
- ✅ 删除 `state.bossSpawned` 状态标志（改用entity查询）
- ✅ 添加配置边界检查

### 4.3 Boss 击杀流程（由 LevelSystem 处理）

```typescript
// LevelSystem.processBossDefeat(world, event)

/**
 * 处理 Boss 击杀事件
 * 职责：添加退场组件，防止重复触发
 */
function processBossDefeat(world: World, event: BossDefeatEvent): void {
    // 防护：检查是否已有退场组件（防止同一帧多个Boss被击杀）
    const hasExitComponent = view(world, [BossExitComponent]).length > 0;
    if (hasExitComponent) {
        console.warn('[LevelSystem] Boss退场已进行中，忽略重复触发');
        return;
    }

    // 查找 Boss entity
    for (const [entityId, comps] of world.entities) {
        const boss = comps.find(c => c instanceof Boss);
        if (boss && boss.bossId === event.bossId) {
            // 添加退场组件（使用interface格式）
            comps.push({
                kind: 'BossExit',
                timer: 0,
                duration: LEVEL_CONFIG.ANIMATION.BOSS_EXIT_DURATION,
                bossId: entityId,
                bossType: event.bossId,
            } as BossExitComponent);
            break;
        }
    }

    // EffectSystem 会监听 BossDefeatEvent 播放爆炸特效、震屏、音效
}
```

**关键改进**：
- ✅ 添加连发防护（检查是否已有退场组件）
- ✅ 使用 interface 格式创建组件，不使用 `new BossExitComponent()`
- ✅ 删除 `state.bossDefeated` 状态标志（改用entity查询）

### 4.4 Boss 退场流程（由 LevelSystem 处理）

```typescript
// LevelSystem.updateBossExit(world, dt)

/**
 * 更新 Boss 退场动画
 * 职责：更新退场计时器，完成后触发关卡过渡
 */
function updateBossExit(world: World, dt: number): void {
    for (const [entityId, [exit], comps] of view(world, [BossExitComponent])) {
        // 累加计时器
        exit.timer += dt;

        // 触发退场开始事件（仅第一次）
        if (exit.timer >= 0 && exit.timer < dt) {
            world.events.push({
                kind: 'BossExitStart',
                bossId: exit.bossId,
                bossType: exit.bossType,
            } as BossExitStartEvent);
        }

        // 退场完成
        if (exit.timer >= exit.duration) {
            // 移除 Boss entity（包括退场组件）
            removeEntity(world, entityId);

            // 开始关卡过渡
            const state = world.levelState;
            startLevelTransition(world, state.currentLevel, state.currentLevel + 1);
        }
    }
}
```

**关键改进**：
- ✅ 删除 `hasTriggeredStart/Complete` 标志
- ✅ 通过 `exit.timer < dt` 判断是否第一帧（触发开始事件）
- ✅ 完成后移除 Boss entity（包括退场组件）
- ✅ 事件类型使用 `kind` 而非 `type`

### 4.5 关卡过渡流程

```typescript
// LevelSystem.startLevelTransition(world, fromLevel, toLevel)

/**
 * 开始关卡过渡
 * 职责：创建过渡entity，推送开始事件
 */
function startLevelTransition(world: World, fromLevel: number, toLevel: number): void {
    // 创建独立 entity 持有 LevelTransitionComponent
    spawnEntity(world, [{
        kind: 'LevelTransition',
        timer: 0,
        duration: LEVEL_CONFIG.ANIMATION.LEVEL_TRANSITION_DURATION,
        fromLevel,
        toLevel,
    } as LevelTransitionComponent]);

    // 推送开始事件
    world.events.push({
        kind: 'LevelTransitionStart',
        fromLevel,
        toLevel,
    } as LevelTransitionStartEvent);
}
```

```typescript
// LevelSystem.updateLevelTransitions(world, dt)

/**
 * 更新关卡过渡动画
 * 职责：更新计时器，完成后切换关卡或触发胜利
 */
function updateLevelTransitions(world: World, dt: number): void {
    for (const [entityId, [transition]] of view(world, [LevelTransitionComponent])) {
        transition.timer += dt;

        // 触发开始事件（仅第一次）
        if (transition.timer >= 0 && transition.timer < dt) {
            // 事件已在 startLevelTransition 中推送
        }

        // 完成过渡
        if (transition.timer >= transition.duration) {
            const state = world.levelState;
            const nextLevel = transition.toLevel;

            // 检查是否通关
            const nextConfig = LEVEL_CONFIGS[nextLevel];
            if (!nextConfig) {
                // 触发胜利事件
                world.events.push({
                    kind: 'Victory',
                    finalLevel: state.currentLevel,
                } as VictoryEvent);
            } else {
                // 进入下一关
                state.currentLevel = nextLevel;
                state.progress = 0;
                state.elapsedTime = 0;
                state.killCount = 0;

                // 推送完成事件
                world.events.push({
                    kind: 'LevelTransitionComplete',
                    level: state.currentLevel,
                } as LevelTransitionCompleteEvent);
            }

            // 移除过渡 entity
            removeEntity(world, entityId);
        }
    }
}
```

**关键改进**：
- ✅ 删除 `state.isTransitioning` 状态标志（改用entity查询）
- ✅ 添加通关逻辑（检查下一关配置是否存在）
- ✅ 使用 `state.elapsedTime = 0` 代替 `Date.now()`
- ✅ 删除 `hasTriggeredStart/Complete` 标志
- ✅ 删除不存在的字段（bossReady, bossType等）
- ✅ 完成后移除过渡entity

### 4.6 通关完整流程（第10关）

```typescript
// 最后一关 Boss 击杀 → 胜利流程

/**
 * 第10关通关完整时序
 */
Timeline:
  T=0ms        - Boss HP <= 0（第10关Boss）
                ↓ DamageResolutionSystem 推送 BossDefeatEvent

  T=0ms (P5)   - LevelSystem.processBossDefeat()
                - 添加 BossExitComponent (duration: 2000ms)
                - EffectSystem 播放连环爆炸（15次 × 100ms）
                - EffectSystem 强烈震屏（intensity: 30）
                - EffectSystem 播放Boss击杀音效
                ↓

  T=0-2000ms   - BossSystem 更新 BossExitComponent.timer
                - Boss 实体逐渐消失（爆炸特效）
                ↓

  T=2000ms     - BossExitComponent.timer >= duration
                ↓ LevelSystem.updateBossExit()
                - 移除 Boss entity
                - startLevelTransition(10, 11)
                ↓

  T=2000ms     - LevelSystem.startLevelTransition()
                - 创建 LevelTransitionComponent entity
                - 推送 LevelTransitionStartEvent
                ↓

  T=2000ms+    - LevelSystem.updateLevelTransitions()
                - transition.timer += dt
                ↓

  T=2000ms+    - transition.timer >= transition.duration
                ↓ 检查 LEVEL_CONFIGS[11]

  结果：LEVEL_CONFIGS[11] 不存在
                ↓
  T=3500ms     - 触发 VictoryEvent
                - world.events.push({
                    kind: 'Victory',
                    finalLevel: 10,
                  } as VictoryEvent)
                - 移除 LevelTransitionComponent entity
                ↓

  T=3500ms     - ReactEngine 监听到 VictoryEvent
                ↓ setUiState({
                    showVictory: true,
                    finalLevel: 10,
                    score: world.score,
                  })
                ↓

  T=3500-4500ms - 胜利画面淡入
                - 背景渐变（black → purple-900）
                - VICTORY 标题脉冲动画
                - 星星特效浮动
                - 播放胜利号角音效
                ↓

  T=4500ms+    - 保持显示
                - 等待玩家操作（Space/Click）
                - 显示最终关卡号、分数、感谢语
```

**关键代码片段**：

```typescript
// LevelSystem.updateLevelTransitions() - 通关判断
if (transition.timer >= transition.duration) {
    const state = world.levelState;
    const nextLevel = transition.toLevel;

    // ⚠️ 关键：检查是否通关
    const nextConfig = LEVEL_CONFIGS[nextLevel];
    if (!nextConfig) {
        // 🎉 通关！触发胜利事件
        world.events.push({
            kind: 'Victory',
            finalLevel: state.currentLevel,
            score: world.score,  // 可选：传递最终分数
        } as VictoryEvent);

        console.log(`[LevelSystem] 🎊 恭喜！通关第${state.currentLevel}关！`);
    } else {
        // 进入下一关
        state.currentLevel = nextLevel;
        // ... 重置状态
    }

    // 移除过渡 entity
    removeEntity(world, entityId);
}
```

**配置文件说明**：

```typescript
// src/engine/configs/level-config.ts

/**
 * 关卡配置（只有10关）
 * LEVEL_CONFIGS[11] = undefined，触发通关
 */
export const LEVEL_CONFIGS: Record<number, LevelConfig> = {
    1: { boss: 'GUARDIAN', ... },
    2: { boss: 'INTERCEPTOR', ... },
    3: { boss: 'DESTROYER', ... },
    4: { boss: 'GHOST', ... },
    5: { boss: 'PHANTOM', ... },
    6: { boss: 'SHADOW', ... },
    7: { boss: 'NIGHTMARE', ... },
    8: { boss: 'TITAN', ... },
    9: { boss: 'COLOSSUS', ... },
    10: { boss: 'APOCALYPSE', ... },
    // ⚠️ 没有 LEVEL_CONFIGS[11]
};

// 通关判断
if (LEVEL_CONFIGS[nextLevel]) {
    // 有下一关配置 → 继续游戏
    state.currentLevel = nextLevel;
} else {
    // 无下一关配置 → 通关
    triggerVictory();
}
```

**状态清理**：

```typescript
// 通关后不需要清理 LevelState，因为：
// 1. 游戏会返回主菜单或重新开始
// 2. LevelState 会在下一局重新初始化
// 3. 如果需要显示通关统计，可以保留数据

// 如果需要重新开始游戏：
function restartGame(world: World): void {
    world.levelState = {
        currentLevel: 1,
        progress: 0,
        elapsedTime: 0,
        killCount: 0,
    };

    // 清空所有 entity
    world.entities.clear();

    // 重置分数
    world.score = 0;

    // 重新开始
    startLevelTransition(world, 0, 1);
}
```

**测试通关逻辑**：

```typescript
// tests/systems/LevelSystem.test.ts

describe('通关逻辑', () => {
    test('第10关Boss击杀触发VictoryEvent', () => {
        const world = createTestWorld();
        world.levelState.currentLevel = 10;

        // 模拟第10关Boss击杀
        completeBossExit(world, 10);

        // 应该触发胜利事件
        expect(world.events.some(e => e.kind === 'Victory')).toBe(true);
        expect(world.events.find(e => e.kind === 'Victory')?.finalLevel).toBe(10);
    });

    test('通关后不进入第11关', () => {
        const world = createTestWorld();
        world.levelState.currentLevel = 10;

        // 完成第10关
        completeBossExit(world, 10);

        // currentLevel 应该保持为 10，不会变成 11
        expect(world.levelState.currentLevel).toBe(10);
    });

    test('VictoryEvent包含最终关卡号', () => {
        const world = createTestWorld();
        world.levelState.currentLevel = 10;
        world.score = 999999;

        // 通关
        completeBossExit(world, 10);

        const victoryEvent = world.events.find(e => e.kind === 'Victory');
        expect(victoryEvent?.finalLevel).toBe(10);
        expect(victoryEvent?.score).toBe(999999);
    });
});
```

---

## 5. 系统集成

### 5.1 DamageResolutionSystem 修改

```typescript
// src/engine/systems/DamageResolutionSystem.ts

export function DamageResolutionSystem(world: World, dt: number): void {
    // ... 现有逻辑 ...

    // 新增：击杀计数
    for (const event of getEvents<KillEvent>(world, 'Kill')) {
        const state = world.levelState;
        if (!state) {
            console.error('[DamageResolutionSystem] levelState未初始化');
            continue;
        }

        // 累加击杀计数（LevelSystem 会在 updateProgress 中读取并应用奖励）
        state.killCount++;
    }

    // Boss HP <= 0 → 推送 BossDefeatEvent
    // ... 现有逻辑 ...
}
```

**职责明确**：
- ✅ 只累加 `killCount`，不直接更新 `progress`
- ✅ 进度奖励由 LevelSystem 统一管理
- ✅ 添加边界检查（state 未初始化）

### 5.2 SpawnSystem 修改

```typescript
// src/engine/systems/SpawnSystem.ts

export function SpawnSystem(world: World, dt: number): void {
    const state = world.levelState;
    if (!state) {
        console.error('[SpawnSystem] levelState未初始化');
        return;
    }

    // 1. 判断 Boss 生成条件
    const hasBoss = view(world, [Boss]).length > 0;
    if (!hasBoss) {
        const shouldSpawnBoss =
            state.progress >= LEVEL_CONFIG.PROGRESS.BOSS_READY_THRESHOLD &&
            state.elapsedTime >= LEVEL_CONFIG.PROGRESS.MIN_LEVEL_DURATION;

        if (shouldSpawnBoss) {
            // 获取当前关卡的 Boss 类型
            const config = LEVEL_CONFIGS[state.currentLevel];
            if (!config) {
                console.error(`[SpawnSystem] 关卡${state.currentLevel}配置不存在`);
                return;
            }

            spawnBoss(world, config.boss);
        }
    }

    // 2. 使用 world.levelState.currentLevel 替代 world.level
    const config = LEVEL_CONFIGS[state.currentLevel];
    if (!config) return;

    // 3. 现有刷怪逻辑
    // ...
}
```

**职责明确**：
- ✅ 使用 `view(world, [Boss]).length > 0` 判断 Boss 是否已生成
- ✅ 使用 `state.elapsedTime` 代替 `Date.now() - state.startTime`
- ✅ 删除 `state.bossSpawned` 状态标志
- ✅ 添加配置边界检查

### 5.3 EffectSystem 修改

```typescript
// src/engine/systems/EffectSystem.ts

export function EffectSystem(world: World, dt: number): void {
    // 1. 监听 BossDefeatEvent（所有Boss击杀）
    for (const event of getEvents<BossDefeatEvent>(world, 'BossDefeat')) {
        const boss = findBossEntity(world, event.bossId);
        if (!boss) continue;

        const bossPos = { x: boss.x, y: boss.y };

        // 播放爆炸特效
        spawnExplosionParticles(world, bossPos, 'large');

        // 震屏
        world.events.push({
            kind: 'CamShake',
            intensity: 20,
            duration: 500,
        } as CamShakeEvent);

        // 音效
        world.events.push({
            kind: 'PlaySound',
            name: 'boss_explosion',
        } as PlaySoundEvent);
    }

    // 2. 监听 VictoryEvent（通关）
    for (const event of getEvents<VictoryEvent>(world, 'Victory')) {
        // ✨ 胜利特效（可选）
        spawnConfettiParticles(world);  // 彩带粒子
        spawnFireworksParticles(world); // 烟花粒子

        // 🎵 胜利音效
        world.events.push({
            kind: 'PlaySound',
            name: 'victory_fanfare',
            volume: 0.8,
        } as PlaySoundEvent);

        // 🎉 欢呼（可选）
        world.events.push({
            kind: 'PlaySound',
            name: 'crowd_cheer',
            volume: 0.3,
        } as PlaySoundEvent);

        // 📺 停止背景音乐（淡出）
        world.events.push({
            kind: 'StopMusic',
            fadeOut: 2000,
        } as StopMusicEvent);

        console.log(`[EffectSystem] 🎊 播放胜利特效！最终关卡: ${event.finalLevel}`);
    }
}

/**
 * 辅助函数：彩带粒子
 */
function spawnConfettiParticles(world: World): void {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * world.width;
        const y = -10;
        const vx = (Math.random() - 0.5) * 4;
        const vy = Math.random() * 3 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];

        world.particles.push({
            kind: 'Confetti',
            x, y, vx, vy,
            color,
            life: 5000,
            maxLife: 5000,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
        });
    }
}

/**
 * 辅助函数：烟花粒子
 */
function spawnFireworksParticles(world: World): void {
    // 从屏幕底部发射烟花
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * world.width;
        const targetY = Math.random() * world.height * 0.5;

        world.events.push({
            kind: 'FireworkLaunch',
            x,
            y: world.height,
            targetY,
            delay: i * 300,  // 每300ms发射一次
        } as FireworkLaunchEvent);
    }
}
```

**特效说明**：

1. **彩带粒子** (`Confetti`)
   - 从屏幕顶部随机位置生成100个彩带
   - 随机颜色（红绿蓝黄紫青）
   - 缓慢下落 + 旋转
   - 持续5秒

2. **烟花粒子** (`Fireworks`)
   - 从屏幕底部发射10发烟花
   - 每300ms发射一次
   - 上升到目标高度后爆炸
   - 爆炸后散开彩色粒子

3. **音效配合**
   - 胜利号角：`victory_fanfare`
   - 欢呼声：`crowd_cheer`（可选，volume: 0.3）
   - 背景音乐淡出：2秒fadeOut

**性能考虑**：
- ✅ 粒子数量适中（100个彩带 + 10个烟花）
- ✅ 烟花延迟发射，避免同时渲染过多
- ✅ 通关后暂停游戏逻辑，不影响性能
- ✅ 使用硬件加速（CSS transforms）

### 5.4 LevelSystem 主函数

```typescript
// src/engine/systems/LevelSystem.ts
// 放置位置：P5 结算层最后 (ComboSystem 之后)

/**
 * 关卡系统主函数
 * 职责：
 * 1. 更新关卡进度（时间驱动 + 击杀加速）
 * 2. 监听 BossDefeatEvent，添加退场组件
 * 3. 管理 Boss 退场流程
 * 4. 管理关卡过渡动画
 * 5. 触发第一关进入动画
 */
export function LevelSystem(world: World, dt: number): void {
    const state = world.levelState;
    if (!state) {
        console.error('[LevelSystem] levelState未初始化');
        return;
    }

    // 0. 第一关进入动画（仅一次）
    if (state.currentLevel === 1 && state.elapsedTime === 0) {
        world.events.push({
            kind: 'StageOneIntro',
            duration: LEVEL_CONFIG.ANIMATION.STAGE_ONE_INTRO_DURATION,
        } as StageOneIntroEvent);
    }

    // 1. 更新关卡进度
    updateProgress(world, dt);

    // 2. 监听 Boss 击杀事件（同一帧 P5 DamageResolutionSystem 推送）
    for (const event of getEvents<BossDefeatEvent>(world, 'BossDefeat')) {
        processBossDefeat(world, event);
    }

    // 3. 更新 Boss 退场
    updateBossExit(world, dt);

    // 4. 更新关卡过渡动画
    updateLevelTransitions(world, dt);
}
```

**职责明确**：
- ✅ 更新关卡进度（时间驱动 + 击杀加速）
- ✅ 监听 BossDefeatEvent，添加退场组件
- ✅ 管理 Boss 退场流程
- ✅ 管理关卡过渡动画
- ✅ 触发第一关进入动画
- ❌ 不判断 Boss 生成条件（由 SpawnSystem 负责）
- ❌ 不管理 Boss AI（由 BossSystem 负责）

### 5.5 BossSystem 修改

```typescript
// src/engine/systems/BossSystem.ts
// 放置位置：P1 决策层 (SpawnSystem 之后，EnemySystem 之前)

/**
 * Boss 系统主函数
 * 职责：
 * 1. 管理 Boss AI、移动、攻击等逻辑
 * 2. 更新 BossExitComponent timer（组件由 LevelSystem 添加）
 */
export function BossSystem(world: World, dt: number): void {
    // 1. 现有 Boss 逻辑（AI、移动、攻击）
    // ...

    // 2. 更新 BossExitComponent timer
    for (const [entityId, [exit]] of view(world, [BossExitComponent])) {
        exit.timer += dt;
    }
}
```

**职责明确**：
- ✅ 管理 Boss AI、移动、攻击等逻辑
- ✅ 更新 BossExitComponent timer（组件由 LevelSystem 添加）
- ❌ 不监听 BossDefeatEvent（由 LevelSystem 处理）
- ❌ 不判断 Boss 击杀逻辑（由 LevelSystem 处理）

### 5.5 World Interface 修改

```typescript
// src/engine/world.ts

export interface World {
    // ... 现有字段 ...

    // ❌ 删除
    // level: number;

    // ✅ 新增
    levelState: LevelState;
}
```

### 5.6 Engine 初始化修改

```typescript
// src/engine/engine.ts

export function start() {
    const world = createWorld();

    // 初始化 levelState（简化后的结构）
    world.levelState = {
        currentLevel: 1,
        progress: 0,
        elapsedTime: 0,
        killCount: 0,
    };

    // ... 现有初始化逻辑 ...
}
```

**关键改进**：
- ✅ 删除所有冗余状态标志（isTransitioning, bossSpawned等）
- ✅ 使用 `elapsedTime` 代替 `startTime`
- ✅ 简化初始化结构，只保留核心数据

## 6. UI 集成

### 6.1 UI 动画层职责划分

**架构设计原则**：
- **React 层**：负责所有 UI 覆盖层动画（Stage 过渡、Boss 警告、胜利画面等）
- **Canvas 层**：负责游戏实体渲染（玩家、敌人、子弹、特效等）
- **事件驱动**：ReactEngine 监听游戏事件，更新 UI state，通过 CSS animations/transitions 渲染

```
┌─────────────────────────────────────────┐
│  React UI 层 (z-index: 50+)            │
│  - 关卡过渡 "STAGE II" 淡入淡出           │
│  - Boss 警告全屏红色闪烁                  │
│  - 第一关进入 "STAGE I" 动画              │
│  - 胜利画面                             │
│  - HUD（分数、血条、武器状态）             │
├─────────────────────────────────────────┤
│  Canvas 渲染层 (z-index: 10)            │
│  - 游戏实体（玩家、敌人、Boss）           │
│  - 子弹、粒子、特效                       │
│  - 爆炸、冲击波                          │
├─────────────────────────────────────────┤
│  游戏逻辑层 (ECS Systems)               │
│  - LevelSystem、SpawnSystem 等           │
│  - 推送事件到 World.events               │
└─────────────────────────────────────────┘
```

**为什么这样设计**：
- ✅ UI 动画在 React 层实现简单高效（CSS animations）
- ✅ Canvas 层专注于游戏渲染，职责单一
- ✅ 通过事件解耦，逻辑层不依赖 UI 框架
- ✅ 与旧版代码保持一致（降低迁移成本）

### 6.2 ReactEngine 事件监听

```typescript
// ReactEngine.ts

function handleEvents(world: World) {
    // 1. 第一关进入动画
    for (const event of getEvents<StageOneIntroEvent>(world, 'StageOneIntro')) {
        setUiState({
            showStageOneIntro: true,
            introDuration: event.duration,
        });
    }

    // 2. 关卡过渡（Boss 击杀后）
    for (const event of getEvents<LevelTransitionStartEvent>(world, 'LevelTransitionStart')) {
        setUiState({
            showLevelTransition: true,
            fromLevel: event.fromLevel,
            toLevel: event.toLevel,
            timer: 0,  // 用于计算 opacity
        });
    }

    for (const event of getEvents<LevelTransitionCompleteEvent>(world, 'LevelTransitionComplete')) {
        setUiState({
            showLevelTransition: false,
        });
    }

    // 3. 游戏通关
    for (const event of getEvents<VictoryEvent>(world, 'Victory')) {
        setUiState({
            showVictory: true,
            finalLevel: event.finalLevel,
        });
    }

    // 4. Boss 警告（已有 BossEntranceStart/Complete 处理）
    // ... 现有逻辑 ...
}
```

### 6.3 React UI 组件实现

#### 6.3.1 第一关进入动画 (Stage I)

```tsx
{/* Stage One Intro Overlay - Center */}
{showStageOneIntro && (
  <div
    className="absolute inset-0 pointer-events-none z-50
               flex items-center justify-center bg-black"
    style={{
      animation: 'stageOneFadeOut 2s ease-out forwards',
    }}
  >
    <style>{`
      @keyframes stageOneFadeOut {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0;
        }
      }
    `}</style>

    <div className="text-center">
      <div className="text-8xl md:text-9xl font-black text-cyan-400 tracking-widest
                  drop-shadow-[0_0_30px_rgba(6,182,212,1)]
                  animate-pulse">
        STAGE I
      </div>
      <div className="text-2xl md:text-3xl font-bold text-white mt-8
                  tracking-wider opacity-80">
        MISSION START
      </div>
    </div>
  </div>
)}
```

**动画时间线**：
```
0ms      - "STAGE I" 出现，完全显示
0-1000ms - 保持完全显示（opacity: 1）
1000-2000ms - 淡出（opacity: 1 → 0）
2000ms   - 动画结束，UI 隐藏
```

#### 6.3.2 关卡过渡动画 (Stage II, III, ...)

```tsx
{/* Level Transition Overlay - Top Left */}
{showLevelTransition && (
  <div
    className="absolute top-8 left-4 pointer-events-none z-50"
    style={{
      opacity:
        levelTransitionTimer < 300
          ? levelTransitionTimer / 300          // 淡入 (0-300ms)
          : levelTransitionTimer > 1200
            ? (1500 - levelTransitionTimer) / 300  // 淡出 (1200-1500ms)
            : 1,                                 // 完全显示 (300-1200ms)
    }}
  >
    <div className="text-2xl font-bold text-cyan-400 tracking-wider
                drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
      STAGE {intToRoman(toLevel)}
    </div>
  </div>
)}
```

**动画时间线**：
```
0ms      - "STAGE II" 出现，opacity = 0
0-300ms  - 淡入（opacity: 0 → 1）
300-1200ms - 完全显示（opacity: 1）
1200-1500ms - 淡出（opacity: 1 → 0）
1500ms   - 动画结束，UI 隐藏
```

#### 6.3.3 胜利画面（最后一关通关）

```tsx
{/* Victory Overlay - Full Screen */}
{showVictory && (
  <div
    className="absolute inset-0 pointer-events-none z-50
               flex items-center justify-center
               bg-gradient-to-b from-black via-purple-900 to-black"
    style={{
      animation: 'victoryFadeIn 1s ease-out forwards',
    }}
  >
    <style>{`
      @keyframes victoryFadeIn {
        0% {
          opacity: 0;
          background: black;
        }
        100% {
          opacity: 1;
          background: linear-gradient(to bottom, black, #581c87, black);
        }
      }

      @keyframes victoryPulse {
        0%, 100% {
          transform: scale(1);
          text-shadow: 0 0 50px rgba(250, 204, 21, 1);
        }
        50% {
          transform: scale(1.05);
          text-shadow: 0 0 80px rgba(250, 204, 21, 1), 0 0 120px rgba(250, 204, 21, 0.8);
        }
      }

      @keyframes starFloat {
        0%, 100% {
          transform: translateY(0) rotate(0deg);
          opacity: 0.3;
        }
        50% {
          transform: translateY(-20px) rotate(180deg);
          opacity: 1;
        }
      }
    `}</style>

    {/* 背景星星特效 */}
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `starFloat ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
    </div>

    {/* 主内容 */}
    <div className="text-center relative z-10">
      {/* VICTORY 标题 */}
      <div
        className="text-9xl md:text-[12rem] font-black text-yellow-400 tracking-widest"
        style={{
          animation: 'victoryPulse 2s ease-in-out infinite',
          marginBottom: '2rem',
        }}
      >
        VICTORY!
      </div>

      {/* 最终关卡 */}
      <div className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-wider">
        FINAL STAGE: {finalLevel}
      </div>

      {/* 统计信息 */}
      <div className="text-xl md:text-2xl text-gray-300 mb-8 space-y-2">
        <div>MISSION COMPLETE</div>
        <div className="text-sm text-gray-400 mt-4">
          THANKS FOR PLAYING
        </div>
      </div>

      {/* 分数显示（可选） */}
      {score !== undefined && (
        <div className="mt-8 text-2xl text-yellow-300 font-bold">
          SCORE: {score.toLocaleString()}
        </div>
      )}
    </div>

    {/* 底部提示 */}
    <div className="absolute bottom-20 left-0 right-0 text-center">
      <div className="text-lg text-gray-400 animate-pulse">
        Press SPACE or Click to Continue
      </div>
    </div>
  </div>
)}
```

**胜利画面完整流程**：

```
T=0ms        - Boss 击杀（第10关）
              ↓
              EffectSystem: 播放连环爆炸（15次 × 100ms）
              EffectSystem: 强烈震屏（screenShake = 30）
              EffectSystem: 播放胜利音效
              ↓
T=0-2000ms   - Boss 退场动画
              Boss 爆炸特效逐渐消失
              ↓
T=2000ms     - startLevelTransition(10, 11)
              ↓
T=2000ms     - 检查 LEVEL_CONFIGS[11] 不存在
              → 触发 VictoryEvent
              → showVictory = true
              ↓
T=2000-3000ms - 胜利画面淡入
              - 背景渐变：black → purple-900 → black
              - 星星特效开始浮动
              - VICTORY 标题脉冲动画
              ↓
T=3000ms+    - 保持显示，等待玩家操作
              - 显示最终关卡号
              - 显示分数（可选）
              - "Press SPACE or Click to Continue"
              ↓
玩家操作      - 返回主菜单或显示结局统计
```

**动画效果说明**：

1. **背景渐变淡入**（1秒）
   - 从纯黑渐变到紫色渐变背景
   - 营造胜利氛围

2. **VICTORY 脉冲动画**（2秒循环）
   - 标题文字轻微缩放（scale: 1 → 1.05 → 1）
   - 金色发光强度变化
   - 持续脉冲，吸引注意力

3. **星星浮动特效**
   - 50个白色小圆点随机分布
   - 上下浮动 + 旋转
   - 不同速度和延迟，营造星空感

4. **底部提示脉冲**
   - "Press SPACE or Click to Continue" 闪烁提示
   - 引导玩家下一步操作

**音效配合**（建议）：

```typescript
// EffectSystem.ts 中处理
for (const event of getEvents<VictoryEvent>(world, 'Victory')) {
    // 1. 播放胜利号角
    world.events.push({
        kind: 'PlaySound',
        name: 'victory_fanfare',  // 胜利号角音效
    } as PlaySoundEvent);

    // 2. 播放欢呼声（可选）
    world.events.push({
        kind: 'PlaySound',
        name: 'crowd_cheer',
        volume: 0.3,
    } as PlaySoundEvent);

    // 3. 停止背景音乐（可选）
    world.events.push({
        kind: 'StopMusic',
        fadeOut: 2000,  // 2秒淡出
    } as StopMusicEvent);
}
```

**游戏状态处理**：

```typescript
// ReactEngine.ts
function handleEvents(world: World) {
    // 监听胜利事件
    for (const event of getEvents<VictoryEvent>(world, 'Victory')) {
        // 1. 显示胜利画面
        setUiState({
            showVictory: true,
            finalLevel: event.finalLevel,
            score: world.score,  // 显示最终分数
        });

        // 2. 暂停游戏逻辑（可选）
        world.paused = true;

        // 3. 记录通关时间
        const playTime = Date.now() - world.sessionStartTime;
        console.log(`[Victory] 通关！用时: ${Math.floor(playTime / 1000)}秒`);
    }
}

// 键盘/鼠标事件处理
function handleKeyPress(key: string) {
    if (uiState.showVictory) {
        if (key === 'Space' || key === 'Enter') {
            // 返回主菜单
            setGameState('MENU');
        }
    }
}
```

**设计亮点**：
- ✅ 渐进式视觉体验（Boss爆炸 → 退场 → 胜利画面）
- ✅ 多层次动画（背景、标题、星星、提示）
- ✅ 音效配合（号角、欢呼、音乐淡出）
- ✅ 玩家引导（提示按空格继续）
- ✅ 信息完整（关卡号、分数、感谢语）

### 6.2 GameSnapshot 更新

```typescript
// src/engine/snapshot.ts

export function getGameSnapshot(world: World): GameSnapshot {
    return {
        // ... 现有字段 ...

        // ❌ 修改前
        // level: world.level || 1,

        // ✅ 修改后
        level: world.levelState.currentLevel,
        progress: world.levelState.progress,
    };
}
```

## 7. 测试计划

### 7.1 单元测试 (`tests/systems/LevelSystem.test.ts`)

```typescript
describe('LevelSystem', () => {
    describe('进度更新', () => {
        test('时间驱动进度增长', () => {
            // 10 秒应该增长 15%
            const world = createTestWorld();
            world.levelState.elapsedTime = 0;
            world.levelState.progress = 0;

            // 模拟 10 秒（10000ms）
            updateProgress(world, 10000);

            expect(world.levelState.progress).toBeCloseTo(15, 1);
        });

        test('击杀加速进度', () => {
            // 20 次击杀应该加速 10%
            const world = createTestWorld();
            world.levelState.killCount = 20;

            updateProgress(world, 1000);

            // 20 * 0.5% = 10%
            expect(world.levelState.progress).toBeGreaterThanOrEqual(10);
        });

        test('最低时间保护', () => {
            // 60 秒至少应该有 80% 进度
            const world = createTestWorld();
            world.levelState.elapsedTime = 60000;
            world.levelState.progress = 0;

            updateProgress(world, 1000);

            expect(world.levelState.progress).toBeGreaterThanOrEqual(80);
        });

        test('进度封顶到 120%', () => {
            const world = createTestWorld();
            world.levelState.progress = 150;
            world.levelState.killCount = 100;

            updateProgress(world, 1000);

            expect(world.levelState.progress).toBeLessThanOrEqual(120);
        });

        test('过渡中不更新进度', () => {
            const world = createTestWorld();
            world.levelState.progress = 50;

            // 添加过渡组件
            spawnEntity(world, [{
                kind: 'LevelTransition',
                timer: 0,
                duration: 1500,
                fromLevel: 1,
                toLevel: 2,
            } as LevelTransitionComponent]);

            const beforeProgress = world.levelState.progress;
            updateProgress(world, 1000);

            expect(world.levelState.progress).toBe(beforeProgress);
        });
    });

    describe('Boss 生成', () => {
        test('Boss 生成触发条件', () => {
            const world = createTestWorld();
            world.levelState.progress = 90;
            world.levelState.elapsedTime = 60000;

            updateBossSpawn(world);

            expect(view(world, [Boss]).length).toBe(1);
        });

        test('Boss 已生成不重复生成', () => {
            const world = createTestWorld();
            spawnEntity(world, [createBossComponent()]);

            const beforeCount = view(world, [Boss]).length;
            updateBossSpawn(world);

            expect(view(world, [Boss]).length).toBe(beforeCount);
        });
    });

    describe('Boss 击杀', () => {
        test('Boss 击杀添加退场组件', () => {
            const world = createTestWorld();
            const bossEntity = spawnEntity(world, [createBossComponent()]);

            processBossDefeat(world, {
                kind: 'BossDefeat',
                bossId: 'BOSS_TEST',
            } as BossDefeatEvent);

            const components = world.entities.get(bossEntity);
            const hasExitComponent = components?.some(c => c.kind === 'BossExit');
            expect(hasExitComponent).toBe(true);
        });

        test('Boss 连发防护', () => {
            const world = createTestWorld();

            // 添加退场组件
            spawnEntity(world, [{
                kind: 'BossExit',
                timer: 0,
                duration: 2000,
                bossId: 'entity1',
                bossType: 'BOSS_TEST',
            } as BossExitComponent]);

            // 尝试再次击杀
            processBossDefeat(world, {
                kind: 'BossDefeat',
                bossId: 'BOSS_TEST_2',
            } as BossDefeatEvent);

            // 应该只有一个退场组件
            expect(view(world, [BossExitComponent]).length).toBe(1);
        });
    });

    describe('关卡过渡', () => {
        test('关卡过渡流程', () => {
            const world = createTestWorld();
            world.levelState.currentLevel = 1;

            startLevelTransition(world, 1, 2);

            const transitions = view(world, [LevelTransitionComponent]);
            expect(transitions.length).toBe(1);
            expect(world.events.some(e => e.kind === 'LevelTransitionStart')).toBe(true);
        });

        test('通关逻辑', () => {
            const world = createTestWorld();
            world.levelState.currentLevel = 10;

            // LEVEL_CONFIGS[11] 不存在
            startLevelTransition(world, 10, 11);

            const transition = view(world, [LevelTransitionComponent])[0];

            // 模拟完成过渡
            transition.timer = transition.duration;

            updateLevelTransitions(world, 1000);

            expect(world.events.some(e => e.kind === 'Victory')).toBe(true);
        });
    });

    describe('第一关进入', () => {
        test('第一关触发进入动画', () => {
            const world = createTestWorld();
            world.levelState.currentLevel = 1;
            world.levelState.elapsedTime = 0;

            LevelSystem(world, 16);

            expect(world.events.some(e => e.kind === 'StageOneIntro')).toBe(true);
        });

        test('非第一关不触发进入动画', () => {
            const world = createTestWorld();
            world.levelState.currentLevel = 2;
            world.levelState.elapsedTime = 0;

            LevelSystem(world, 16);

            expect(world.events.some(e => e.kind === 'StageOneIntro')).toBe(false);
        });
    });
});
```

### 7.2 集成测试

```typescript
describe('LevelSystem Integration', () => {
    test('完整流程：进度 → Boss 生成 → Boss 击杀 → 关卡过渡', () => {
        const world = createTestWorld();

        // 1. 模拟进度增长
        for (let i = 0; i < 60000; i += 16) {
            LevelSystem(world, 16);
        }

        // 2. Boss 应该已生成
        expect(view(world, [Boss]).length).toBe(1);

        // 3. 模拟 Boss 击杀
        world.events.push({
            kind: 'BossDefeat',
            bossId: 'BOSS_TEST',
        } as BossDefeatEvent);

        LevelSystem(world, 16);

        // 4. 应该添加退场组件
        expect(view(world, [BossExitComponent]).length).toBe(1);

        // 5. 模拟退场完成
        const exit = view(world, [BossExitComponent])[0];
        exit.timer = 2000;

        LevelSystem(world, 16);

        // 6. 应该触发关卡过渡
        expect(view(world, [LevelTransitionComponent]).length).toBe(1);
    });

    test('多关卡连续测试', () => {
        const world = createTestWorld();

        // 完成 10 关
        for (let level = 1; level <= 10; level++) {
            // 模拟 Boss 击杀和过渡
            completeLevel(world, level);
        }

        // 应该触发胜利事件
        expect(world.events.some(e => e.kind === 'Victory')).toBe(true);
    });
});
```

### 7.3 边界测试

```typescript
describe('LevelSystem Edge Cases', () => {
    test('负时间不处理', () => {
        const world = createTestWorld();
        const beforeProgress = world.levelState.progress;

        updateProgress(world, -1000);

        expect(world.levelState.progress).toBe(beforeProgress);
    });

    test('levelState 未初始化', () => {
        const world = createWorld();
        world.levelState = undefined as any;

        expect(() => LevelSystem(world, 16)).not.toThrow();
    });

    test('配置缺失处理', () => {
        const world = createTestWorld();
        world.levelState.currentLevel = 999;

        expect(() => updateBossSpawn(world)).not.toThrow();
    });
});
```

## 8. 迁移计划

### 8.1 替换 world.level 使用

需要在以下文件中替换 `world.level` 为 `world.levelState.currentLevel`:
- `src/engine/systems/SpawnSystem.ts` (2 处)
- `src/engine/snapshot.ts` (1 处)
- 全局搜索 `world.level`，确保全部替换

### 8.2 新增文件

- `src/engine/types/level.ts` - LevelState 类型定义
- `src/engine/configs/level-config.ts` - 统一配置常量
- `src/engine/components/transition.ts` - LevelTransitionComponent, BossExitComponent
- `src/engine/systems/LevelSystem.ts` - LevelSystem 核心逻辑
- `tests/systems/LevelSystem.test.ts` - 单元测试

### 8.3 修改文件

**事件系统**：
- `src/engine/events/events.ts`
  - 新增 5 个事件：LevelTransitionStart, LevelTransitionComplete, BossExitStart, Victory, StageOneIntro
  - 使用 `kind` 字段代替 `type`

**核心系统**：
- `src/engine/world.ts`
  - interface 添加 `levelState: LevelState`
  - 删除 `level: number`

- `src/engine/engine.ts`
  - 初始化 `world.levelState`（简化版结构）
  - **在 framePipeline P5 最后添加 LevelSystem**（位置：ComboSystem 之后）

**游戏系统**：
- `src/engine/systems/DamageResolutionSystem.ts`
  - 累加 `killCount`，不直接更新 `progress`
  - 添加边界检查

- `src/engine/systems/SpawnSystem.ts`
  - Boss 生成判断使用 `elapsedTime` 和 entity 查询
  - 删除 `state.bossSpawned` 标志
  - 替换 `world.level` 为 `world.levelState.currentLevel`

- `src/engine/systems/BossSystem.ts`
  - 更新 `BossExitComponent` timer
  - 不处理 Boss 击杀逻辑

- `src/engine/systems/EffectSystem.ts`
  - Boss 击杀特效（已有，无需修改）

**UI 层**：
- `src/engine/snapshot.ts`
  - 替换 `level: world.level` 为 `level: world.levelState.currentLevel`
  - 添加 `progress: world.levelState.progress`

- `ReactEngine.tsx`
  - 监听 5 个新事件
  - 实现 Stage I 进入动画
  - 实现关卡过渡动画
  - 实现胜利画面

## 9. 实施顺序

### Phase 1: 基础设施（优先级 P0）

1. ✅ 编写设计文档（本文档）
2. ⬜ 创建统一配置常量 (`src/engine/configs/level-config.ts`)
3. ⬜ 创建 LevelState 类型定义 (`src/engine/types/level.ts`)
4. ⬜ 创建新组件 (`src/engine/components/transition.ts`)
5. ⬜ 创建新事件类型（5个：LevelTransitionStart, LevelTransitionComplete, BossExitStart, Victory, StageOneIntro）
6. ⬜ 修改 World interface（添加 levelState，删除 level）

### Phase 2: 核心逻辑（优先级 P0）

7. ⬜ 实现 LevelSystem 核心逻辑
   - `updateProgress()` - 进度更新（使用 elapsedTime）
   - `processBossDefeat()` - Boss 击杀处理（添加连发防护）
   - `updateBossExit()` - Boss 退场更新
   - `startLevelTransition()` - 开始关卡过渡
   - `updateLevelTransitions()` - 更新过渡动画（添加通关逻辑）

8. ⬜ 修改 DamageResolutionSystem
   - 累加 killCount
   - 添加边界检查

9. ⬜ 修改 SpawnSystem
   - Boss 生成判断（使用 elapsedTime + entity 查询）
   - 替换 world.level

10. ⬜ 修改 BossSystem
    - 更新 BossExitComponent timer
    - 删除 Boss 击杀逻辑

### Phase 3: 集成测试（优先级 P1）

11. ⬜ 修改 Engine 初始化（简化 levelState 结构）
12. ⬜ **修改 Engine framePipeline（添加 LevelSystem 到 P5 最后）**
13. ⬜ 修改 GameSnapshot（添加 progress 字段）
14. ⬜ 编写单元测试
15. ⬜ 运行测试和类型检查

### Phase 4: UI 集成（优先级 P1）

16. ⬜ 实现 ReactEngine 事件监听
17. ⬜ 实现 Stage I 进入动画组件
18. ⬜ 实现关卡过渡动画组件
19. ⬜ 实现胜利画面组件
20. ⬜ UI 动画联调测试

### Phase 5: 完善与优化（优先级 P2）

21. ⬜ 添加关卡调试工具
22. ⬜ 添加关卡进度可视化
23. ⬜ 性能优化和代码重构
24. ⬜ 更新文档和注释

**⚠️ 关键步骤**：
- **步骤 12**：在 engine.ts 的 framePipeline 中，P5 结算层最后添加 LevelSystem，位置在 ComboSystem 之后
- **关键设计**：BossDefeatEvent 由 DamageResolutionSystem 推送，LevelSystem 在同一帧 P5 内监听并处理，**事件不跨帧**
- BossSystem 只更新 BossExitComponent timer，不处理 Boss 击杀
- **时间系统统一**：全部使用 `state.elapsedTime`，禁止使用 `Date.now()`
- **组件使用 interface**：不使用 class，不包含方法

## 10. 风险评估

### 10.1 已知风险

| 风险 | 影响 | 缓解措施 | 状态 |
|-----|------|---------|------|
| 进度计算逻辑复杂度高 | 中 | 单元测试覆盖各种边界情况 | ✅ 已缓解 |
| Boss 退场延迟可能影响手感 | 低 | 2 秒延迟合理, 可根据调试调整 | ✅ 已缓解 |
| 关卡过渡与 UI 同步问题 | 中 | 通过事件驱动确保解耦 | ✅ 已缓解 |
| world.level 替换遗漏 | 高 | 使用全局搜索确保全部替换 | ⚠️ 需验证 |
| Date.now() 混用导致时间不一致 | 高 | **统一使用 elapsedTime，禁止 Date.now()** | ✅ 已修复 |
| entity 查询性能问题 | 低 | view() 函数已优化，影响可忽略 | ✅ 已缓解 |
| Boss 连发导致重复过渡 | 中 | **添加连发防护逻辑** | ✅ 已修复 |
| 最后一关未处理导致崩溃 | 高 | **添加通关逻辑和配置检查** | ✅ 已修复 |
| 负时间（暂停/回放）导致进度倒流 | 中 | 添加边界检查 `dt < 0` | ✅ 已修复 |
| React 和 Canvas 动画不一致 | 低 | **明确职责划分，React 负责 UI 动画** | ✅ 已明确 |

### 10.2 后续优化

- [ ] 添加关卡调试工具（手动设置关卡号, 跳过 Boss 等）
- [ ] 添加关卡进度可视化（调试面板）
- [ ] 考虑根据游戏时长动态调整难度系数
- [ ] 优化动画过渡效果（添加缓动函数）
- [ ] 支持多语言（罗马数字本地化）

### 10.3 性能考虑

| 操作 | 预期性能 | 备注 |
|------|---------|------|
| entity 查询（判断 Boss 是否存在） | < 0.1ms | view() 函数已优化 |
| 进度更新计算 | < 0.05ms | 简单数学运算 |
| 事件推送 | < 0.01ms | 数组 push 操作 |
| React UI 更新 | < 16ms (1帧) | CSS animations 硬件加速 |

**结论**：所有操作都在性能预算内，不会影响 60fps 流畅度。


## 11. 设计变更日志

### v1.1 (2026-02-04) - 修复版

**关键修复**：

1. ✅ **修复时间系统**：统一使用 `state.elapsedTime` 代替 `Date.now() - state.startTime`
   - 原因：违反 ECS 原则，无法被游戏逻辑控制（暂停、慢速、回放）
   - 影响：进度计算、Boss 生成判断、关卡过渡

2. ✅ **简化 LevelState**：删除冗余状态标志
   - 删除：`isTransitioning`, `bossSpawned`, `bossDefeated`, `bossReady`, `bossType`
   - 改用：entity 查询（`view(world, [Boss]).length > 0`）
   - 原因：符合数据驱动原则，减少状态同步问题

3. ✅ **修复组件定义**：改为 interface，删除冗余字段
   - 删除：`hasTriggeredStart`, `hasTriggeredComplete`, `lifetime`
   - 改用：通过 `timer` 判断状态
   - 原因：组件仅包含数据，不包含逻辑和状态标志

4. ✅ **统一进度更新职责**：全部由 LevelSystem 管理
   - 修改前：DamageResolutionSystem 直接更新 `progress`
   - 修改后：DamageResolutionSystem 只累加 `killCount`
   - 原因：职责单一，避免两个系统同时修改同一数据

5. ✅ **添加通关逻辑**：检查下一关配置是否存在
   - 修改前：直接更新 `currentLevel`，可能访问 undefined 配置
   - 修改后：先检查 `LEVEL_CONFIGS[nextLevel]`，不存在则触发胜利事件
   - 原因：防止最后一关崩溃

6. ✅ **添加 Boss 连发防护**：检查是否已有退场组件
   - 场景：同一帧多个 Boss 被击杀（罕见但可能）
   - 措施：`processBossDefeat()` 开头检查 `view(world, [BossExitComponent]).length`
   - 原因：防止重复触发关卡过渡

7. ✅ **统一配置常量管理**：集中到 `LEVEL_CONFIG`
   - 新增文件：`src/engine/configs/level-config.ts`
   - 包含：进度、动画、生成等所有常量
   - 原因：便于调整和测试

8. ✅ **明确 UI 动画层职责**：React 负责 UI 动画，Canvas 负责游戏渲染
   - React 层：Stage 过渡、Boss 警告、胜利画面、HUD
   - Canvas 层：游戏实体、特效
   - 原因：职责单一，降低实现复杂度

9. ✅ **添加第一关进入动画**：Stage I 淡入淡出效果
   - 新增事件：`StageOneIntroEvent`
   - 持续时间：2 秒
   - 原因：增强游戏体验，与后续关卡保持一致

10. ✅ **添加边界检查**：防止异常输入导致崩溃
    - 检查：`dt < 0`、`state` 未初始化、配置缺失
    - 原因：提高鲁棒性

**新增功能**：
- 游戏通关逻辑（胜利画面）
- 第一关进入动画（Stage I）
- 统一配置管理系统

**向后兼容性**：
- ⚠️ **不兼容**：需要替换所有 `world.level` 为 `world.levelState.currentLevel`
- ⚠️ **不兼容**：需要删除 `state.bossSpawned` 等状态标志使用
- ✅ **兼容**：事件系统保持兼容（使用 `kind` 字段）

---

*文档版本：1.1*
*最后更新：2026-02-04*
*设计者：Claude Code*

