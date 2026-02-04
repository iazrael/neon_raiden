# 关卡系统实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 实现关卡进度系统、Boss 生成触发、Boss 击杀后的关卡过渡、关卡过渡 UI 动画，以及游戏通关逻辑。

**架构：** 严格遵循 ECS 架构，数据与逻辑分离。LevelState 存储在 World，逻辑在 LevelSystem。所有动画通过 entity + component 实现，避免异步定时器。系统间通过事件通信，React 层负责 UI 动画。

**技术栈：** TypeScript, ECS 模式, Jest 测试框架

---

## 前置说明

### TDD 要求
- **每个功能必须先写失败的测试**
- **观看测试失败后再编写实现**
- **只编写能让测试通过的最少代码**
- **每个任务完成后立即提交**

### 文件结构约定
- 组件：`src/engine/components/`
- 系统：`src/engine/systems/`
- 配置：`src/engine/configs/`
- 类型：`src/engine/types/`
- 事件：`src/engine/events/`
- 测试：`tests/systems/`

### 时间单位
所有时间相关变量、参数与计算统一使用**毫秒 (ms)**，变量名建议以 `ms` 结尾。

---

## Phase 1: 基础设施

### Task 1: 创建统一配置常量

**文件：**
- 创建: `src/engine/configs/level-config.ts`

**Step 1: 编写测试**

创建 `tests/configs/level-config.test.ts`:

```typescript
import { LEVEL_CONFIG } from '../../src/engine/configs/level-config';

describe('LEVEL_CONFIG', () => {
  test('进度配置存在', () => {
    expect(LEVEL_CONFIG.PROGRESS).toBeDefined();
    expect(LEVEL_CONFIG.PROGRESS.PER_SECOND_GROWTH_RATE).toBe(1.5);
    expect(LEVEL_CONFIG.PROGRESS.KILL_BONUS).toBe(0.5);
    expect(LEVEL_CONFIG.PROGRESS.MIN_LEVEL_DURATION).toBe(60000);
    expect(LEVEL_CONFIG.PROGRESS.BOSS_READY_THRESHOLD).toBe(90);
    expect(LEVEL_CONFIG.PROGRESS.MAX_PROGRESS).toBe(120);
  });

  test('动画时长配置存在', () => {
    expect(LEVEL_CONFIG.ANIMATION.LEVEL_TRANSITION_DURATION).toBe(1500);
    expect(LEVEL_CONFIG.ANIMATION.BOSS_EXIT_DURATION).toBe(2000);
    expect(LEVEL_CONFIG.ANIMATION.BOSS_WARNING_DURATION).toBe(3000);
    expect(LEVEL_CONFIG.ANIMATION.STAGE_ONE_INTRO_DURATION).toBe(2000);
  });

  test('生成配置存在', () => {
    expect(LEVEL_CONFIG.SPAWN.MIN_ENEMY_INTERVAL).toBe(800);
    expect(LEVEL_CONFIG.SPAWN.MAX_ENEMY_INTERVAL).toBe(2000);
  });

  test('配置为只读', () => {
    expect(() => {
      (LEVEL_CONFIG as any).PROGRESS.PER_SECOND_GROWTH_RATE = 999;
    }).not.toThrow();
    // 值应该保持不变（as const 保证）
    expect(LEVEL_CONFIG.PROGRESS.PER_SECOND_GROWTH_RATE).toBe(1.5);
  });
});
```

**Step 2: 运行测试验证失败**

```bash
pnpm test tests/configs/level-config.test.ts
```

预期: FAIL with "Cannot find module '../../src/engine/configs/level-config'"

**Step 3: 编写最小实现**

创建 `src/engine/configs/level-config.ts`:

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

**Step 4: 运行测试验证通过**

```bash
pnpm test tests/configs/level-config.test.ts
```

预期: PASS

**Step 5: 提交**

```bash
git add src/engine/configs/level-config.ts tests/configs/level-config.test.ts
git commit -m "feat: 添加关卡系统统一配置常量"
```

---

### Task 2: 创建 LevelState 类型定义

**文件：**
- 创建: `src/engine/types/level.ts`
- 修改: `src/engine/world.ts`

**Step 1: 编写测试**

创建 `tests/types/level.test.ts`:

```typescript
import { LevelState } from '../../src/engine/types/level';

describe('LevelState', () => {
  test('可以创建 LevelState 对象', () => {
    const state: LevelState = {
      currentLevel: 1,
      progress: 0,
      elapsedTime: 0,
      killCount: 0,
    };

    expect(state.currentLevel).toBe(1);
    expect(state.progress).toBe(0);
    expect(state.elapsedTime).toBe(0);
    expect(state.killCount).toBe(0);
  });

  test('progress 允许超出 100', () => {
    const state: LevelState = {
      currentLevel: 1,
      progress: 120,
      elapsedTime: 60000,
      killCount: 0,
    };

    expect(state.progress).toBe(120);
  });

  test('elapsedTime 单位为毫秒', () => {
    const state: LevelState = {
      currentLevel: 1,
      progress: 50,
      elapsedTime: 30000, // 30秒
      killCount: 0,
    };

    expect(state.elapsedTime).toBe(30000);
  });
});
```

**Step 2: 运行测试验证失败**

```bash
pnpm test tests/types/level.test.ts
```

预期: FAIL with "Cannot find module '../../src/engine/types/level'"

**Step 3: 编写最小实现**

创建 `src/engine/types/level.ts`:

```typescript
/**
 * 关卡状态
 * 存储当前关卡的核心数值状态
 */
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
```

修改 `src/engine/world.ts`，在 World interface 中添加 levelState 字段（先不删除 level 字段，避免破坏现有代码）:

```typescript
import { LevelState } from './types/level';

export interface World {
    // ... 现有字段 ...

    // ✅ 新增
    levelState: LevelState;
}
```

**Step 4: 运行测试验证通过**

```bash
pnpm test tests/types/level.test.ts
```

预期: PASS

**Step 5: 提交**

```bash
git add src/engine/types/level.ts src/engine/world.ts tests/types/level.test.ts
git commit -m "feat: 添加 LevelState 类型定义"
```

---

### Task 3: 创建关卡过渡组件

**文件：**
- 创建: `src/engine/components/transition.ts`

**Step 1: 编写测试**

创建 `tests/components/transition.test.ts`:

```typescript
import { LevelTransitionComponent, BossExitComponent } from '../../src/engine/components/transition';

describe('LevelTransitionComponent', () => {
  test('可以创建 LevelTransitionComponent', () => {
    const component: LevelTransitionComponent = {
      kind: 'LevelTransition',
      timer: 0,
      duration: 1500,
      fromLevel: 1,
      toLevel: 2,
    };

    expect(component.kind).toBe('LevelTransition');
    expect(component.timer).toBe(0);
    expect(component.duration).toBe(1500);
    expect(component.fromLevel).toBe(1);
    expect(component.toLevel).toBe(2);
  });

  test('通过 timer 判断状态', () => {
    const component: LevelTransitionComponent = {
      kind: 'LevelTransition',
      timer: 750,
      duration: 1500,
      fromLevel: 1,
      toLevel: 2,
    };

    // timer < duration 表示未完成
    expect(component.timer < component.duration).toBe(true);
  });
});

describe('BossExitComponent', () => {
  test('可以创建 BossExitComponent', () => {
    const component: BossExitComponent = {
      kind: 'BossExit',
      timer: 0,
      duration: 2000,
      bossId: 'entity123',
      bossType: 'GUARDIAN',
    };

    expect(component.kind).toBe('BossExit');
    expect(component.timer).toBe(0);
    expect(component.duration).toBe(2000);
    expect(component.bossId).toBe('entity123');
    expect(component.bossType).toBe('GUARDIAN');
  });
});
```

**Step 2: 运行测试验证失败**

```bash
pnpm test tests/components/transition.test.ts
```

预期: FAIL with "Cannot find module '../../src/engine/components/transition'"

**Step 3: 编写最小实现**

创建 `src/engine/components/transition.ts`:

```typescript
/**
 * 关卡过渡组件
 * 控制关卡切换动画的计时器
 */
export interface LevelTransitionComponent {
    /** 组件类型标识 */
    kind: 'LevelTransition';

    /** 动画计时器（毫秒） */
    timer: number;

    /** 总持续时间（毫秒） */
    duration: number;

    /** 来源关卡 */
    fromLevel: number;

    /** 目标关卡 */
    toLevel: number;
}

/**
 * Boss 退场组件
 * 控制 Boss 被击杀后的退场动画
 */
export interface BossExitComponent {
    /** 组件类型标识 */
    kind: 'BossExit';

    /** 退场计时器（毫秒） */
    timer: number;

    /** 退场持续时间（毫秒） */
    duration: number;

    /** Boss 实体 ID */
    bossId: string;

    /** Boss 类型 */
    bossType: string;
}
```

**Step 4: 运行测试验证通过**

```bash
pnpm test tests/components/transition.test.ts
```

预期: PASS

**Step 5: 提交**

```bash
git add src/engine/components/transition.ts tests/components/transition.test.ts
git commit -m "feat: 添加关卡过渡和 Boss 退场组件"
```

---

### Task 4: 添加新事件类型

**文件：**
- 修改: `src/engine/events/events.ts`

**Step 1: 编写测试**

创建 `tests/events/level-events.test.ts`:

```typescript
import {
  LevelTransitionStartEvent,
  LevelTransitionCompleteEvent,
  BossExitStartEvent,
  VictoryEvent,
  StageOneIntroEvent,
} from '../../src/engine/events/events';

describe('关卡事件类型', () => {
  test('LevelTransitionStartEvent 结构正确', () => {
    const event: LevelTransitionStartEvent = {
      kind: 'LevelTransitionStart',
      fromLevel: 1,
      toLevel: 2,
    };

    expect(event.kind).toBe('LevelTransitionStart');
    expect(event.fromLevel).toBe(1);
    expect(event.toLevel).toBe(2);
  });

  test('LevelTransitionCompleteEvent 结构正确', () => {
    const event: LevelTransitionCompleteEvent = {
      kind: 'LevelTransitionComplete',
      level: 2,
    };

    expect(event.kind).toBe('LevelTransitionComplete');
    expect(event.level).toBe(2);
  });

  test('BossExitStartEvent 结构正确', () => {
    const event: BossExitStartEvent = {
      kind: 'BossExitStart',
      bossId: 'entity123',
      bossType: 'GUARDIAN',
    };

    expect(event.kind).toBe('BossExitStart');
    expect(event.bossId).toBe('entity123');
    expect(event.bossType).toBe('GUARDIAN');
  });

  test('VictoryEvent 结构正确', () => {
    const event: VictoryEvent = {
      kind: 'Victory',
      finalLevel: 10,
    };

    expect(event.kind).toBe('Victory');
    expect(event.finalLevel).toBe(10);
  });

  test('StageOneIntroEvent 结构正确', () => {
    const event: StageOneIntroEvent = {
      kind: 'StageOneIntro',
      duration: 2000,
    };

    expect(event.kind).toBe('StageOneIntro');
    expect(event.duration).toBe(2000);
  });
});
```

**Step 2: 运行测试验证失败**

```bash
pnpm test tests/events/level-events.test.ts
```

预期: FAIL with event types 未定义

**Step 3: 编写最小实现**

修改 `src/engine/events/events.ts`，添加新事件类型:

```typescript
// ... 现有事件 ...

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
    bossId: string;
    bossType: string;
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

**Step 4: 运行测试验证通过**

```bash
pnpm test tests/events/level-events.test.ts
```

预期: PASS

**Step 5: 提交**

```bash
git add src/engine/events/events.ts tests/events/level-events.test.ts
git commit -m "feat: 添加关卡系统相关事件类型"
```

---

## Phase 2: LevelSystem 核心逻辑

### Task 5: 实现进度更新功能

**文件：**
- 创建: `src/engine/systems/LevelSystem.ts`
- 测试: `tests/systems/LevelSystem.test.ts`

**Step 1: 编写测试**

创建 `tests/systems/LevelSystem.progress.test.ts`:

```typescript
import { createWorld } from '../../src/engine/world';
import { LevelSystem } from '../../src/engine/systems/LevelSystem';
import { LevelTransitionComponent } from '../../src/engine/components/transition';
import { LEVEL_CONFIG } from '../../src/engine/configs/level-config';
import { spawnEntity } from '../../src/engine/world';

function createTestWorld() {
  const world = createWorld();
  world.levelState = {
    currentLevel: 1,
    progress: 0,
    elapsedTime: 0,
    killCount: 0,
  };
  return world;
}

describe('LevelSystem - 进度更新', () => {
  test('时间驱动进度增长（10秒增长15%）', () => {
    const world = createTestWorld();
    world.levelState.elapsedTime = 0;
    world.levelState.progress = 0;

    // 模拟 10 秒（10000ms）
    const dt = 10000;
    LevelSystem(world, dt);

    // 10秒 * 1.5%/秒 = 15%
    expect(world.levelState.progress).toBeCloseTo(15, 1);
  });

  test('击杀加速进度（20次击杀加速10%）', () => {
    const world = createTestWorld();
    world.levelState.killCount = 20;

    LevelSystem(world, 1000);

    // 20 * 0.5% = 10%
    expect(world.levelState.progress).toBeGreaterThanOrEqual(10);
    // killCount 应该被重置
    expect(world.levelState.killCount).toBe(0);
  });

  test('最低时间保护（60秒至少80%进度）', () => {
    const world = createTestWorld();
    world.levelState.elapsedTime = 60000;
    world.levelState.progress = 0;

    LevelSystem(world, 1000);

    expect(world.levelState.progress).toBeGreaterThanOrEqual(80);
  });

  test('进度封顶到 120%', () => {
    const world = createTestWorld();
    world.levelState.progress = 150;
    world.levelState.killCount = 100;

    LevelSystem(world, 1000);

    expect(world.levelState.progress).toBeLessThanOrEqual(120);
  });

  test('过渡中不更新进度', () => {
    const world = createTestWorld();
    world.levelState.progress = 50;

    // 添加过渡组件
    const entityId = spawnEntity(world, [{
      kind: 'LevelTransition',
      timer: 0,
      duration: 1500,
      fromLevel: 1,
      toLevel: 2,
    } as LevelTransitionComponent]);

    const beforeProgress = world.levelState.progress;
    LevelSystem(world, 1000);

    expect(world.levelState.progress).toBe(beforeProgress);
  });

  test('负时间不处理', () => {
    const world = createTestWorld();
    const beforeProgress = world.levelState.progress;

    LevelSystem(world, -1000);

    expect(world.levelState.progress).toBe(beforeProgress);
  });

  test('elapsedTime 累加', () => {
    const world = createTestWorld();
    world.levelState.elapsedTime = 1000;

    LevelSystem(world, 500);

    expect(world.levelState.elapsedTime).toBe(1500);
  });
});
```

**Step 2: 运行测试验证失败**

```bash
pnpm test tests/systems/LevelSystem.progress.test.ts
```

预期: FAIL with "Cannot find module '../../src/engine/systems/LevelSystem'"

**Step 3: 编写最小实现**

创建 `src/engine/systems/LevelSystem.ts`:

```typescript
import { World } from '../world';
import { LEVEL_CONFIG } from '../configs/level-config';
import { view } from '../world';
import { LevelTransitionComponent } from '../components/transition';

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

    // 1. 更新关卡进度
    updateProgress(world, dt);

    // 其他功能在后续任务中实现...
}
```

**Step 4: 运行测试验证通过**

```bash
pnpm test tests/systems/LevelSystem.progress.test.ts
```

预期: PASS

**Step 5: 提交**

```bash
git add src/engine/systems/LevelSystem.ts tests/systems/LevelSystem.progress.test.ts
git commit -m "feat: 实现关卡进度更新功能"
```

---

### Task 6: 实现 Boss 击杀处理功能

**文件：**
- 修改: `src/engine/systems/LevelSystem.ts`

**Step 1: 编写测试**

创建 `tests/systems/LevelSystem.boss-defeat.test.ts`:

```typescript
import { createWorld } from '../../src/engine/world';
import { LevelSystem } from '../../src/engine/systems/LevelSystem';
import { Boss } from '../../src/engine/components/boss';
import { BossExitComponent } from '../../src/engine/components/transition';
import { LEVEL_CONFIG } from '../../src/engine/configs/level-config';
import { spawnEntity } from '../../src/engine/world';
import { getEvents } from '../../src/engine/world';

function createTestWorld() {
  const world = createWorld();
  world.levelState = {
    currentLevel: 1,
    progress: 0,
    elapsedTime: 0,
    killCount: 0,
  };
  return world;
}

describe('LevelSystem - Boss 击杀处理', () => {
  test('Boss 击杀添加退场组件', () => {
    const world = createTestWorld();

    // 创建 Boss entity
    const bossEntity = spawnEntity(world, [{
      kind: 'Boss',
      bossId: 'GUARDIAN',
      hp: 100,
      maxHp: 100,
    } as Boss]);

    // 推送 Boss 击杀事件
    world.events.push({
      kind: 'BossDefeat',
      bossId: 'GUARDIAN',
    });

    LevelSystem(world, 16);

    // Boss 应该有退场组件
    const components = world.entities.get(bossEntity);
    const hasExitComponent = components?.some(c => c.kind === 'BossExit');
    expect(hasExitComponent).toBe(true);
  });

  test('Boss 连发防护（同一帧多个Boss被击杀）', () => {
    const world = createTestWorld();

    // 添加退场组件
    spawnEntity(world, [{
      kind: 'BossExit',
      timer: 0,
      duration: 2000,
      bossId: 'entity1',
      bossType: 'BOSS_TEST',
    } as BossExitComponent]);

    // 推送另一个 Boss 击杀事件
    world.events.push({
      kind: 'BossDefeat',
      bossId: 'BOSS_TEST_2',
    });

    const beforeExitCount = view(world, [BossExitComponent]).length;

    LevelSystem(world, 16);

    // 应该只有一个退场组件
    const afterExitCount = view(world, [BossExitComponent]).length;
    expect(afterExitCount).toBe(beforeExitCount);
  });

  test('Boss 击杀推送 BossExitStartEvent', () => {
    const world = createTestWorld();

    spawnEntity(world, [{
      kind: 'Boss',
      bossId: 'GUARDIAN',
      hp: 100,
      maxHp: 100,
    } as Boss]);

    world.events.push({
      kind: 'BossDefeat',
      bossId: 'GUARDIAN',
    });

    LevelSystem(world, 16);

    // 应该推送 BossExitStartEvent
    const exitEvents = getEvents(world, 'BossExitStart');
    expect(exitEvents.length).toBeGreaterThan(0);
  });
});
```

**Step 2: 运行测试验证失败**

```bash
pnpm test tests/systems/LevelSystem.boss-defeat.test.ts
```

预期: FAIL (Boss 击杀处理逻辑未实现)

**Step 3: 编写最小实现**

修改 `src/engine/systems/LevelSystem.ts`，添加 Boss 击杀处理:

```typescript
import { World } from '../world';
import { LEVEL_CONFIG } from '../configs/level-config';
import { view, getEvents, removeEntity } from '../world';
import { LevelTransitionComponent, BossExitComponent } from '../components/transition';
import { BossDefeatEvent } from '../events/events';

// ... updateProgress 函数保持不变 ...

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
        const boss = comps.find(c => (c as any).kind === 'Boss' && (c as any).bossId === event.bossId);
        if (boss) {
            // 添加退场组件
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
}

/**
 * 更新 Boss 退场动画
 * 职责：更新退场计时器，完成后触发关卡过渡
 */
function updateBossExit(world: World, dt: number): void {
    for (const [entityId, comps] of world.entities) {
        const exitIndex = comps.findIndex(c => (c as any).kind === 'BossExit');
        if (exitIndex === -1) continue;

        const exit = comps[exitIndex] as BossExitComponent;

        // 累加计时器
        exit.timer += dt;

        // 触发退场开始事件（仅第一次）
        if (exit.timer >= 0 && exit.timer < dt) {
            world.events.push({
                kind: 'BossExitStart',
                bossId: exit.bossId,
                bossType: exit.bossType,
            });
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

// ... LevelSystem 主函数修改 ...
export function LevelSystem(world: World, dt: number): void {
    const state = world.levelState;
    if (!state) {
        console.error('[LevelSystem] levelState未初始化');
        return;
    }

    // 1. 更新关卡进度
    updateProgress(world, dt);

    // 2. 监听 Boss 击杀事件
    for (const event of getEvents<BossDefeatEvent>(world, 'BossDefeat')) {
        processBossDefeat(world, event);
    }

    // 3. 更新 Boss 退场
    updateBossExit(world, dt);

    // 其他功能在后续任务中实现...
}
```

**Step 4: 运行测试验证通过**

```bash
pnpm test tests/systems/LevelSystem.boss-defeat.test.ts
```

预期: PASS

**Step 5: 提交**

```bash
git add src/engine/systems/LevelSystem.ts tests/systems/LevelSystem.boss-defeat.test.ts
git commit -m "feat: 实现 Boss 击杀处理和退场功能"
```

---

### Task 7: 实现关卡过渡功能

**文件：**
- 修改: `src/engine/systems/LevelSystem.ts`

**Step 1: 编写测试**

创建 `tests/systems/LevelSystem.transition.test.ts`:

```typescript
import { createWorld } from '../../src/engine/world';
import { LevelSystem } from '../../src/engine/systems/LevelSystem';
import { LevelTransitionComponent } from '../../src/engine/components/transition';
import { spawnEntity } from '../../src/engine/world';
import { getEvents } from '../../src/engine/world';

function createTestWorld() {
  const world = createWorld();
  world.levelState = {
    currentLevel: 1,
    progress: 0,
    elapsedTime: 0,
    killCount: 0,
  };
  return world;
}

describe('LevelSystem - 关卡过渡', () => {
  test('开始关卡过渡创建过渡组件', () => {
    const world = createTestWorld();
    world.levelState.currentLevel = 1;

    // 直接调用 startLevelTransition（通过测试导出）
    const { startLevelTransition } = require('../../src/engine/systems/LevelSystem');
    startLevelTransition(world, 1, 2);

    const transitions = view(world, [LevelTransitionComponent]);
    expect(transitions.length).toBe(1);

    const transition = transitions[0][1] as LevelTransitionComponent;
    expect(transition.fromLevel).toBe(1);
    expect(transition.toLevel).toBe(2);
    expect(world.events.some(e => e.kind === 'LevelTransitionStart')).toBe(true);
  });

  test('关卡过渡更新 currentLevel', () => {
    const world = createTestWorld();
    world.levelState.currentLevel = 1;

    // 创建过渡组件
    const transitionEntity = spawnEntity(world, [{
      kind: 'LevelTransition',
      timer: 0,
      duration: 1500,
      fromLevel: 1,
      toLevel: 2,
    } as LevelTransitionComponent]);

    // 模拟过渡完成
    world.entities.forEach((comps, entityId) => {
      comps.forEach(c => {
        if ((c as any).kind === 'LevelTransition') {
          (c as LevelTransitionComponent).timer = 1500;
        }
      });
    });

    LevelSystem(world, 16);

    // currentLevel 应该更新
    expect(world.levelState.currentLevel).toBe(2);
    expect(world.levelState.progress).toBe(0);
    expect(world.levelState.elapsedTime).toBe(0);

    // 过渡 entity 应该被移除
    expect(world.entities.has(transitionEntity)).toBe(false);
  });

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

  test('关卡过渡完成推送事件', () => {
    const world = createTestWorld();
    world.levelState.currentLevel = 1;

    spawnEntity(world, [{
      kind: 'LevelTransition',
      timer: 0,
      duration: 1500,
      fromLevel: 1,
      toLevel: 2,
    } as LevelTransitionComponent]);

    // 完成过渡
    world.entities.forEach(comps => {
      comps.forEach(c => {
        if ((c as any).kind === 'LevelTransition') {
          (c as LevelTransitionComponent).timer = 1500;
        }
      });
    });

    LevelSystem(world, 16);

    expect(world.events.some(e => e.kind === 'LevelTransitionComplete')).toBe(true);
  });
});
```

**Step 2: 运行测试验证失败**

```bash
pnpm test tests/systems/LevelSystem.transition.test.ts
```

预期: FAIL (关卡过渡逻辑未实现)

**Step 3: 编写最小实现**

修改 `src/engine/systems/LevelSystem.ts`，添加关卡过渡逻辑:

```typescript
import { World } from '../world';
import { LEVEL_CONFIG } from '../configs/level-config';
import { view, getEvents, removeEntity, spawnEntity } from '../world';
import { LevelTransitionComponent, BossExitComponent } from '../components/transition';
import { BossDefeatEvent, LevelTransitionStartEvent, LevelTransitionCompleteEvent, StageOneIntroEvent, VictoryEvent } from '../events/events';

// ... 之前实现的函数 ...

/**
 * 开始关卡过渡
 * 职责：创建过渡entity，推送开始事件
 */
export function startLevelTransition(world: World, fromLevel: number, toLevel: number): void {
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

/**
 * 更新关卡过渡动画
 * 职责：更新计时器，完成后切换关卡或触发胜利
 */
function updateLevelTransitions(world: World, dt: number): void {
    for (const [entityId, comps] of world.entities) {
        const transitionIndex = comps.findIndex(c => (c as any).kind === 'LevelTransition');
        if (transitionIndex === -1) continue;

        const transition = comps[transitionIndex] as LevelTransitionComponent;
        transition.timer += dt;

        // 完成过渡
        if (transition.timer >= transition.duration) {
            const state = world.levelState;
            const nextLevel = transition.toLevel;

            // 检查是否通关（LEVEL_CONFIGS 由外部导入）
            // 注意：这里需要导入 LEVEL_CONFIGS，暂时先假设总是有下一关
            state.currentLevel = nextLevel;
            state.progress = 0;
            state.elapsedTime = 0;
            state.killCount = 0;

            // 推送完成事件
            world.events.push({
                kind: 'LevelTransitionComplete',
                level: state.currentLevel,
            } as LevelTransitionCompleteEvent);

            // 移除过渡 entity
            removeEntity(world, entityId);
        }
    }
}

// 修改 LevelSystem 主函数
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

    // 2. 监听 Boss 击杀事件
    for (const event of getEvents<BossDefeatEvent>(world, 'BossDefeat')) {
        processBossDefeat(world, event);
    }

    // 3. 更新 Boss 退场
    updateBossExit(world, dt);

    // 4. 更新关卡过渡动画
    updateLevelTransitions(world, dt);
}
```

**Step 4: 运行测试验证通过**

```bash
pnpm test tests/systems/LevelSystem.transition.test.ts
```

预期: PASS

**Step 5: 提交**

```bash
git add src/engine/systems/LevelSystem.ts tests/systems/LevelSystem.transition.test.ts
git commit -m "feat: 实现关卡过渡功能"
```

---

### Task 8: 实现通关逻辑

**文件：**
- 修改: `src/engine/systems/LevelSystem.ts`
- 修改: `src/engine/configs/level-config.ts`

**Step 1: 编写测试**

创建 `tests/systems/LevelSystem.victory.test.ts`:

```typescript
import { createWorld } from '../../src/engine/world';
import { LevelSystem, startLevelTransition } from '../../src/engine/systems/LevelSystem';
import { LevelTransitionComponent } from '../../src/engine/components/transition';
import { spawnEntity } from '../../src/engine/world';
import { getEvents } from '../../src/engine/world';

function createTestWorld() {
  const world = createWorld();
  world.levelState = {
    currentLevel: 10,
    progress: 0,
    elapsedTime: 0,
    killCount: 0,
  };
  return world;
}

describe('LevelSystem - 通关逻辑', () => {
  test('第10关Boss击杀触发VictoryEvent', () => {
    const world = createTestWorld();

    // 开始过渡到第11关（不存在）
    startLevelTransition(world, 10, 11);

    // 完成过渡
    world.entities.forEach(comps => {
      comps.forEach(c => {
        if ((c as any).kind === 'LevelTransition') {
          (c as LevelTransitionComponent).timer = 1500;
        }
      });
    });

    LevelSystem(world, 16);

    // 应该触发胜利事件
    expect(world.events.some(e => e.kind === 'Victory')).toBe(true);
    const victoryEvent = world.events.find(e => e.kind === 'Victory');
    expect(victoryEvent?.finalLevel).toBe(10);
  });

  test('通关后不进入第11关', () => {
    const world = createTestWorld();

    startLevelTransition(world, 10, 11);

    world.entities.forEach(comps => {
      comps.forEach(c => {
        if ((c as any).kind === 'LevelTransition') {
          (c as LevelTransitionComponent).timer = 1500;
        }
      });
    });

    LevelSystem(world, 16);

    // currentLevel 应该保持为 10，不会变成 11
    expect(world.levelState.currentLevel).toBe(10);
  });

  test('正常关卡过渡正确更新 currentLevel', () => {
    const world = createTestWorld();
    world.levelState.currentLevel = 1;

    spawnEntity(world, [{
      kind: 'LevelTransition',
      timer: 0,
      duration: 1500,
      fromLevel: 1,
      toLevel: 2,
    } as LevelTransitionComponent]);

    world.entities.forEach(comps => {
      comps.forEach(c => {
        if ((c as any).kind === 'LevelTransition') {
          (c as LevelTransitionComponent).timer = 1500;
        }
      });
    });

    LevelSystem(world, 16);

    expect(world.levelState.currentLevel).toBe(2);
  });
});
```

**Step 2: 运行测试验证失败**

```bash
pnpm test tests/systems/LevelSystem.victory.test.ts
```

预期: FAIL (通关逻辑未实现)

**Step 3: 编写最小实现**

首先，在 `src/engine/configs/level-config.ts` 中添加关卡配置:

```typescript
// ... LEVEL_CONFIG 保持不变 ...

/**
 * 关卡配置
 * 只有10关，LEVEL_CONFIGS[11] 不存在，触发通关
 */
export const LEVEL_CONFIGS: Record<number, { boss: string }> = {
    1: { boss: 'GUARDIAN' },
    2: { boss: 'INTERCEPTOR' },
    3: { boss: 'DESTROYER' },
    4: { boss: 'GHOST' },
    5: { boss: 'PHANTOM' },
    6: { boss: 'SHADOW' },
    7: { boss: 'NIGHTMARE' },
    8: { boss: 'TITAN' },
    9: { boss: 'COLOSSUS' },
    10: { boss: 'APOCALYPSE' },
    // ⚠️ 没有 LEVEL_CONFIGS[11]
};
```

然后修改 `src/engine/systems/LevelSystem.ts` 中的 `updateLevelTransitions`:

```typescript
import { LEVEL_CONFIGS } from '../configs/level-config';

// ... 其他导入保持不变 ...

function updateLevelTransitions(world: World, dt: number): void {
    for (const [entityId, comps] of world.entities) {
        const transitionIndex = comps.findIndex(c => (c as any).kind === 'LevelTransition');
        if (transitionIndex === -1) continue;

        const transition = comps[transitionIndex] as LevelTransitionComponent;
        transition.timer += dt;

        // 完成过渡
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
                } as VictoryEvent);

                console.log(`[LevelSystem] 🎊 恭喜！通关第${state.currentLevel}关！`);
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

**Step 4: 运行测试验证通过**

```bash
pnpm test tests/systems/LevelSystem.victory.test.ts
```

预期: PASS

**Step 5: 提交**

```bash
git add src/engine/configs/level-config.ts src/engine/systems/LevelSystem.ts tests/systems/LevelSystem.victory.test.ts
git commit -m "feat: 实现游戏通关逻辑"
```

---

## Phase 3: 系统集成

### Task 9: 修改 DamageResolutionSystem

**文件：**
- 修改: `src/engine/systems/DamageResolutionSystem.ts`

**Step 1: 编写测试**

假设已有测试，添加新的测试用例:

创建 `tests/systems/DamageResolutionSystem.kill-count.test.ts`:

```typescript
import { createWorld } from '../../src/engine/world';
import { DamageResolutionSystem } from '../../src/engine/systems/DamageResolutionSystem';
import { spawnEntity } from '../../src/engine/world';

function createTestWorld() {
  const world = createWorld();
  world.levelState = {
    currentLevel: 1,
    progress: 0,
    elapsedTime: 0,
    killCount: 0,
  };
  return world;
}

describe('DamageResolutionSystem - 击杀计数', () => {
  test('击杀事件累加 killCount', () => {
    const world = createTestWorld();

    // 推送 5 个击杀事件
    for (let i = 0; i < 5; i++) {
      world.events.push({
        kind: 'Kill',
        entityId: `enemy${i}`,
      });
    }

    DamageResolutionSystem(world, 16);

    expect(world.levelState.killCount).toBe(5);
  });

  test('击杀计数在进度更新后被重置', () => {
    const world = createTestWorld();

    world.events.push({
      kind: 'Kill',
      entityId: 'enemy1',
    });

    world.events.push({
      kind: 'Kill',
      entityId: 'enemy2',
    });

    DamageResolutionSystem(world, 16);

    expect(world.levelState.killCount).toBe(2);

    // LevelSystem 会重置 killCount
    // 这里只测试 DamageResolutionSystem 的职责
  });
});
```

**Step 2: 运行测试验证失败**

```bash
pnpm test tests/systems/DamageResolutionSystem.kill-count.test.ts
```

预期: FAIL (击杀计数功能未实现)

**Step 3: 编写最小实现**

修改 `src/engine/systems/DamageResolutionSystem.ts`，添加击杀计数:

```typescript
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

    // ... 其他现有逻辑 ...
}
```

**Step 4: 运行测试验证通过**

```bash
pnpm test tests/systems/DamageResolutionSystem.kill-count.test.ts
```

预期: PASS

**Step 5: 提交**

```bash
git add src/engine/systems/DamageResolutionSystem.ts tests/systems/DamageResolutionSystem.kill-count.test.ts
git commit -m "feat: 添加击杀计数功能"
```

---

### Task 10: 修改 SpawnSystem

**文件：**
- 修改: `src/engine/systems/SpawnSystem.ts`

**Step 1: 编写测试**

创建 `tests/systems/SpawnSystem.level.test.ts`:

```typescript
import { createWorld } from '../../src/engine/world';
import { SpawnSystem } from '../../src/engine/systems/SpawnSystem';
import { Boss } from '../../src/engine/components/boss';
import { view } from '../../src/engine/world';
import { LEVEL_CONFIG, LEVEL_CONFIGS } from '../../src/engine/configs/level-config';

function createTestWorld() {
  const world = createWorld();
  world.levelState = {
    currentLevel: 1,
    progress: 0,
    elapsedTime: 0,
    killCount: 0,
  };
  return world;
}

describe('SpawnSystem - Boss 生成', () => {
  test('Boss 生成触发条件（进度>=90% 且 时间>=60秒）', () => {
    const world = createTestWorld();
    world.levelState.progress = 90;
    world.levelState.elapsedTime = 60000;

    SpawnSystem(world, 16);

    // 应该生成 Boss
    expect(view(world, [Boss]).length).toBe(1);
  });

  test('Boss 已生成不重复生成', () => {
    const world = createTestWorld();
    world.levelState.progress = 90;
    world.levelState.elapsedTime = 60000;

    // 手动添加 Boss
    // (这里需要 spawnEntity 函数)

    const beforeCount = view(world, [Boss]).length;
    SpawnSystem(world, 16);

    expect(view(world, [Boss]).length).toBe(beforeCount);
  });

  test('使用 levelState.currentLevel', () => {
    const world = createTestWorld();
    world.levelState.currentLevel = 5;
    world.levelState.progress = 90;
    world.levelState.elapsedTime = 60000;

    SpawnSystem(world, 16);

    const bosses = view(world, [Boss]);
    expect(bosses.length).toBe(1);
    // Boss 类型应该是第5关的 boss
    const boss = bosses[0][1].find(c => (c as any).kind === 'Boss') as Boss;
    expect(boss.bossId).toBe(LEVEL_CONFIGS[5].boss);
  });
});
```

**Step 2: 运行测试验证失败**

```bash
pnpm test tests/systems/SpawnSystem.level.test.ts
```

预期: FAIL (Boss 生成逻辑未修改)

**Step 3: 编写最小实现**

修改 `src/engine/systems/SpawnSystem.ts`:

```typescript
import { LEVEL_CONFIG, LEVEL_CONFIGS } from '../configs/level-config';
import { Boss } from '../components/boss';
import { view } from '../world';

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

            // 生成 Boss (这里需要调用现有的 spawnBoss 函数)
            // spawnBoss(world, config.boss);
        }
    }

    // 2. 替换 world.level 为 world.levelState.currentLevel
    // ... 其他刷怪逻辑 ...
}
```

**Step 4: 运行测试验证通过**

```bash
pnpm test tests/systems/SpawnSystem.level.test.ts
```

预期: PASS

**Step 5: 提交**

```bash
git add src/engine/systems/SpawnSystem.ts tests/systems/SpawnSystem.level.test.ts
git commit -m "feat: 修改 SpawnSystem 支持新的关卡系统"
```

---

### Task 11: 修改 BossSystem

**文件：**
- 修改: `src/engine/systems/BossSystem.ts`

**Step 1: 编写测试**

创建 `tests/systems/BossSystem.exit-timer.test.ts`:

```typescript
import { createWorld } from '../../src/engine/world';
import { BossSystem } from '../../src/engine/systems/BossSystem';
import { BossExitComponent } from '../../src/engine/components/transition';
import { spawnEntity } from '../../src/engine/world';

describe('BossSystem - Boss 退场计时器', () => {
  test('更新 BossExitComponent timer', () => {
    const world = createWorld();

    spawnEntity(world, [{
      kind: 'BossExit',
      timer: 0,
      duration: 2000,
      bossId: 'entity1',
      bossType: 'GUARDIAN',
    } as BossExitComponent]);

    BossSystem(world, 500);

    // timer 应该累加 500ms
    const exits = view(world, [BossExitComponent]);
    expect(exits.length).toBe(1);
    const exit = exits[0][1][0] as BossExitComponent;
    expect(exit.timer).toBe(500);
  });

  test('多次累加 timer', () => {
    const world = createWorld();

    spawnEntity(world, [{
      kind: 'BossExit',
      timer: 1000,
      duration: 2000,
      bossId: 'entity1',
      bossType: 'GUARDIAN',
    } as BossExitComponent]);

    BossSystem(world, 500);

    const exits = view(world, [BossExitComponent]);
    const exit = exits[0][1][0] as BossExitComponent;
    expect(exit.timer).toBe(1500);
  });
});
```

**Step 2: 运行测试验证失败**

```bash
pnpm test tests/systems/BossSystem.exit-timer.test.ts
```

预期: FAIL (BossExitComponent timer 更新逻辑未实现)

**Step 3: 编写最小实现**

修改 `src/engine/systems/BossSystem.ts`:

```typescript
import { BossExitComponent } from '../components/transition';
import { view } from '../world';

export function BossSystem(world: World, dt: number): void {
    // 1. 现有 Boss 逻辑（AI、移动、攻击）
    // ...

    // 2. 更新 BossExitComponent timer
    for (const [entityId, comps] of world.entities) {
        const exitIndex = comps.findIndex(c => (c as any).kind === 'BossExit');
        if (exitIndex !== -1) {
            const exit = comps[exitIndex] as BossExitComponent;
            exit.timer += dt;
        }
    }
}
```

**Step 4: 运行测试验证通过**

```bash
pnpm test tests/systems/BossSystem.exit-timer.test.ts
```

预期: PASS

**Step 5: 提交**

```bash
git add src/engine/systems/BossSystem.ts tests/systems/BossSystem.exit-timer.test.ts
git commit -m "feat: 添加 BossExitComponent timer 更新逻辑"
```

---

### Task 12: 修改 Engine 初始化和帧循环

**文件：**
- 修改: `src/engine/engine.ts`

**Step 1: 编写测试**

创建 `tests/engine/engine-init.test.ts`:

```typescript
import { createWorld } from '../../src/engine/world';
import { start } from '../../src/engine/engine';

describe('Engine - 初始化', () => {
  test('levelState 正确初始化', () => {
    const world = createWorld();

    // 模拟 start 函数的初始化逻辑
    world.levelState = {
      currentLevel: 1,
      progress: 0,
      elapsedTime: 0,
      killCount: 0,
    };

    expect(world.levelState).toBeDefined();
    expect(world.levelState.currentLevel).toBe(1);
    expect(world.levelState.progress).toBe(0);
    expect(world.levelState.elapsedTime).toBe(0);
    expect(world.levelState.killCount).toBe(0);
  });
});
```

**Step 2: 运行测试验证失败**

```bash
pnpm test tests/engine/engine-init.test.ts
```

预期: 如果初始化未实现则 FAIL

**Step 3: 编写最小实现**

修改 `src/engine/engine.ts`:

```typescript
import { LevelSystem } from './systems/LevelSystem';

export function start() {
    const world = createWorld();

    // 初始化 levelState
    world.levelState = {
        currentLevel: 1,
        progress: 0,
        elapsedTime: 0,
        killCount: 0,
    };

    // ... 其他初始化逻辑 ...
}

// 在 framePipeline 中添加 LevelSystem（P5 最后）
function framePipeline(world: World, dt: number) {
    // P1. 决策层
    InputSystem(world, dt);
    SpawnSystem(world, dt);
    BossSystem(world, dt);
    EnemySystem(world, dt);

    // ... P2, P3, P4 ...

    // P5. 结算层
    PickupSystem(world, dt);
    DamageResolutionSystem(world, dt);
    ChainSystem(world, dt);
    LootSystem(world, dt);
    ComboSystem(world, dt);
    LevelSystem(world, dt);  // ← 新增：关卡系统
}
```

**Step 4: 运行测试验证通过**

```bash
pnpm test tests/engine/engine-init.test.ts
pnpm test
```

预期: 全部 PASS

**Step 5: 提交**

```bash
git add src/engine/engine.ts tests/engine/engine-init.test.ts
git commit -m "feat: 在 Engine 中初始化 levelState 并集成 LevelSystem"
```

---

### Task 13: 修改 GameSnapshot

**文件：**
- 修改: `src/engine/snapshot.ts`

**Step 1: 编写测试**

创建 `tests/snapshot/snapshot.test.ts`:

```typescript
import { createWorld } from '../../src/engine/world';
import { getGameSnapshot } from '../../src/engine/snapshot';

describe('GameSnapshot', () => {
  test('包含 levelState 信息', () => {
    const world = createWorld();
    world.levelState = {
      currentLevel: 5,
      progress: 75.5,
      elapsedTime: 45000,
      killCount: 0,
    };

    const snapshot = getGameSnapshot(world);

    expect(snapshot.level).toBe(5);
    expect(snapshot.progress).toBe(75.5);
  });

  test('progress 允许小数', () => {
    const world = createWorld();
    world.levelState.progress = 87.3;

    const snapshot = getGameSnapshot(world);

    expect(snapshot.progress).toBeCloseTo(87.3, 1);
  });
});
```

**Step 2: 运行测试验证失败**

```bash
pnpm test tests/snapshot/snapshot.test.ts
```

预期: FAIL

**Step 3: 编写最小实现**

修改 `src/engine/snapshot.ts`:

```typescript
export function getGameSnapshot(world: World): GameSnapshot {
    return {
        // ... 其他字段 ...

        // ❌ 修改前
        // level: world.level || 1,

        // ✅ 修改后
        level: world.levelState.currentLevel,
        progress: world.levelState.progress,
    };
}
```

**Step 4: 运行测试验证通过**

```bash
pnpm test tests/snapshot/snapshot.test.ts
```

预期: PASS

**Step 5: 提交**

```bash
git add src/engine/snapshot.ts tests/snapshot/snapshot.test.ts
git commit -m "feat: 更新 GameSnapshot 支持新的关卡系统"
```

---

## Phase 4: UI 集成

### Task 14: 实现 ReactEngine 事件监听

**文件：**
- 修改: `ReactEngine.tsx` (或类似文件)

**Step 1: 编写测试**

UI 组件测试通常使用 React Testing Library，这里提供测试思路:

```typescript
describe('ReactEngine - 关卡事件处理', () => {
  test('StageOneIntro 事件设置 UI 状态', () => {
    // 创建 world
    // 推送 StageOneIntro 事件
    // 调用 handleEvents
    // 验证 UI state 更新
  });

  test('LevelTransitionStart 事件设置过渡 UI', () => {
    // 类似测试
  });

  test('Victory 事件显示胜利画面', () => {
    // 类似测试
  });
});
```

**Step 2: 运行测试验证失败**

**Step 3: 编写最小实现**

修改 `ReactEngine.tsx`:

```typescript
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
            timer: 0,
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

    // 4. Boss 退场开始
    for (const event of getEvents<BossExitStartEvent>(world, 'BossExitStart')) {
        // 可以显示 Boss 退场特效提示
        console.log(`[UI] Boss ${event.bossType} 退场开始`);
    }
}
```

**Step 4: 运行测试验证通过**

**Step 5: 提交**

```bash
git add ReactEngine.tsx
git commit -m "feat: 添加关卡事件 UI 监听"
```

---

### Task 15-17: 实现 UI 组件

这三个任务涉及 React UI 组件实现，按照设计文档中的代码实现：
- Task 15: Stage I 进入动画组件
- Task 16: 关卡过渡动画组件
- Task 17: 胜利画面组件

由于这些是纯 UI 组件，建议直接实现并进行视觉验证，TDD 重点在事件流正确性。

---

## Phase 5: 完善与优化

### Task 18: 全局替换 world.level

**文件：**
- 全局搜索并替换

**Step 1: 搜索所有使用**

```bash
grep -r "world\.level" src/
```

**Step 2: 逐个替换**

将 `world.level` 替换为 `world.levelState.currentLevel`

**Step 3: 删除 World interface 中的 level 字段**

```typescript
export interface World {
    // ... 其他字段 ...

    // ❌ 删除
    // level: number;

    // ✅ 保留
    levelState: LevelState;
}
```

**Step 4: 运行完整测试**

```bash
pnpm test
pnpm build
```

**Step 5: 提交**

```bash
git add -A
git commit -m "refactor: 完全迁移到 levelState，删除旧的 level 字段"
```

---

### Task 19: 添加集成测试

**文件：**
- 创建: `tests/integration/level-flow.test.ts`

**Step 1: 编写测试**

```typescript
describe('关卡系统完整流程集成测试', () => {
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
      bossId: 'GUARDIAN',
    });

    LevelSystem(world, 16);

    // 4. 应该添加退场组件
    expect(view(world, [BossExitComponent]).length).toBe(1);

    // 5. 模拟退场完成
    // ... 完成测试逻辑
  });

  test('多关卡连续测试（第1关到第10关）', () => {
    // 完整流程测试
  });
});
```

**Step 2-5: TDD 流程**

按照标准 TDD 流程实现和验证。

---

### Task 20: 性能测试和边界测试

**文件：**
- 创建: `tests/performance/level-system.test.ts`

测试 entity 查询性能、大量事件处理等。

---

### Task 21-24: 文档和优化

- Task 21: 添加关卡调试工具
- Task 22: 添加关卡进度可视化
- Task 23: 性能优化和代码重构
- Task 24: 更新文档和注释

这些任务根据实际需求决定是否实施。

---

## 验收标准

完成所有任务后，系统应该满足：

1. ✅ 所有测试通过 (`pnpm test`)
2. ✅ 类型检查通过 (`pnpm type-check`)
3. ✅ 构建成功 (`pnpm build`)
4. ✅ 关卡进度正确计算（时间驱动 + 击杀加速）
5. ✅ Boss 在进度>=90% 且 时间>=60秒时生成
6. ✅ Boss 击杀后正确触发退场动画
7. ✅ 退场完成后正确过渡到下一关
8. ✅ 第10关完成后触发胜利事件
9. ✅ UI 正确显示关卡过渡动画
10. ✅ 无控制台错误或警告

---

## 风险和注意事项

1. **时间系统统一**：确保所有时间计算使用 `elapsedTime`，禁止使用 `Date.now()`
2. **事件不跨帧**：BossDefeatEvent 在 P5 内部生产和消费
3. **组件使用 interface**：不使用 class，组件仅包含数据
4. **entity 查询判断状态**：不使用状态标志，通过 entity 查询判断
5. **连发防护**：Boss 击杀添加防护逻辑，避免重复触发

---

*文档版本：1.0*
*创建日期：2026-02-04*
