# 事件系统重构实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 重构事件系统，通过 TypeScript 类型工具自动收集事件类型，消除手动维护 EventTags 和 Event 联合类型的重复工作

**架构:**
- 创建 `src/engine/events/` 目录，包含 `events.ts`（事件定义）和 `index.ts`（自动类型收集）
- 使用映射类型自动从所有导出的事件接口中提取 `GameEvent` 联合类型和 `EventType`
- 保持轻量的 interface 定义风格，不需要额外的工厂函数或类

**技术栈:**
- TypeScript 高级类型（映射类型、条件类型、infer）
- 类型级别的自动反射（参考 `src/engine/blueprints/base.ts` 的模式）

---

## Task 1: 创建新的事件目录结构和基础类型

**文件:**
- Create: `src/engine/events/events.ts`
- Create: `src/engine/events/index.ts`

**Step 1: 创建 events.ts 文件并定义基础类型**

将当前 `src/engine/events.ts` 的内容迁移过来，但添加 `BaseEvent` 接口：

```typescript
// src/engine/events/events.ts

import { EntityId } from "../types";

/**
 * 所有事件的基础接口
 * 使用 extends BaseEvent<'EventName'> 来定义新事件
 */
export interface BaseEvent<T extends string> {
  type: T;
}

// ① 命中（碰撞瞬间）
export interface HitEvent extends BaseEvent<'Hit'> {
  pos: { x: number; y: number }; // 命中坐标
  damage: number;                // 本次伤害值
  owner: EntityId;               // 子弹/技能 owner
  victim: EntityId;              // 被击中实体
}

// ② 击杀（HP ≤ 0）
export interface KillEvent extends BaseEvent<'Kill'> {
  pos: { x: number; y: number }; // 死亡坐标
  victim: EntityId;              // 死亡实体
  killer: EntityId;              // 最后一击 owner（可为 0）
  score: number;                 // 本次击杀得分
}

// ③ 拾取（玩家碰到 PickupItem）
export interface PickupEvent extends BaseEvent<'Pickup'> {
  pos: { x: number; y: number }; // 拾取坐标
  itemId: string;                // 道具/武器/Buff ID
  owner: EntityId;               // 拾取者（玩家）
}

// ④ 武器发射（每发子弹出生）
export interface WeaponFiredEvent extends BaseEvent<'WeaponFired'> {
  pos: { x: number; y: number }; // 发射坐标
  weaponId: string;              // 武器配置 ID
  owner: EntityId;               // 发射者
}

// ⑤ Boss 阶段切换
export interface BossPhaseChangeEvent extends BaseEvent<'BossPhaseChange'> {
  phase: number;                 // 新阶段号（1,2,3…）
  bossId: EntityId;              // Boss 实体 ID
}

// ⑤.1 Boss 特殊事件
export interface BossSpecialEvent extends BaseEvent<'BossSpecialEvent'> {
  event: string;                 // 事件名称（如 'spawn_minions', 'laser_sweep'）
  bossId: EntityId;              // Boss 实体 ID
  phase: number;                 // 触发阶段（0-based）
}

// ⑥ 相机震屏
export interface CamShakeEvent extends BaseEvent<'CamShake'> {
  intensity: number;             // 强度（像素）
  duration: number;              // 持续毫秒
}

// ⑦ 血雾/飙血特效
export interface BloodFogEvent extends BaseEvent<'BloodFog'> {
  pos: { x: number; y: number }; // 特效中心
  level: 1 | 2 | 3;              // 大/中/小
  duration: number;              // 持续毫秒
}

// ⑧ 玩家升级（战机等级提升）
export interface LevelUpEvent extends BaseEvent<'LevelUp'> {
  oldLevel: number;
  newLevel: number;
  source: 'pickup' | 'levelEnd' | 'shop'; // 来源
}

// ⑨ 连击中断
export interface ComboBreakEvent extends BaseEvent<'ComboBreak'> {
  combo: number;                 // 中断前的连击数
  reason: 'timeout' | 'miss' | 'hit'; // 中断原因
}

// ⑩ 清屏事件
export interface ScreenClearEvent extends BaseEvent<'ScreenClear'> {
  // 无额外字段
}

// ⑪ 播放音效事件
export interface PlaySoundEvent extends BaseEvent<'PlaySound'> {
  name: string;
}

// ⑫ 狂暴模式触发事件
export interface BerserkModeEvent extends BaseEvent<'BerserkMode'> {
  pos: { x: number; y: number }; // 触发位置
}

// ⑬ 连击升级事件
export interface ComboUpgradeEvent extends BaseEvent<'ComboUpgrade'> {
  pos: { x: number; y: number }; // 触发位置
  level: number;                 // 新连击等级
  name: string;                  // 连击等级名称
  color: string;                 // 视觉颜色
}

// ⑭ 炸弹爆炸
export interface BombExplodedEvent extends BaseEvent<'BombExploded'> {
  pos: { x: number; y: number }; // 爆炸中心位置（玩家位置）
  playerId: number;              // 使用炸弹的玩家ID
}

// ⑮ 武器特效事件
export interface WeaponEffectEvent extends BaseEvent<'WeaponEffect'> {
  pos: { x: number; y: number }; // 特效位置
  weaponType: string;            // 武器类型
  effectType: 'explosion' | 'chain' | 'burn' | 'bounce'; // 特效类型
}

// ⑯ 护盾破碎特效事件
export interface ShieldBrokenEvent extends BaseEvent<'ShieldBroken'> {
  pos: { x: number; y: number }; // 护盾破碎位置
  owner: EntityId;               // 护盾 owner
}

// ⑰ 时间减速事件
export interface TimeSlowEvent extends BaseEvent<'TimeSlow'> {
  scale: number;                 // 时间缩放比例
  duration: number;              // 持续毫秒
  action: 'start' | 'end';       // 开始或结束
}
```

**Step 2: 创建 index.ts 实现自动类型收集**

```typescript
// src/engine/events/index.ts

import * as Events from './events';

// 重新导出 BaseEvent（方便外部使用）
export { BaseEvent } from './events';

// 重新导出所有事件类型
export * from './events';

/**
 * 自动收集所有事件类型（类似 blueprints/base.ts 的模式）
 *
 * 原理：
 * 1. typeof Events 获取所有导出的事件接口构造函数
 * 2. 映射类型遍历每个导出
 * 3. 条件类型检查是否 extends BaseEvent<infer T>
 * 4. 如果是，提取该事件类型；否则返回 never
 */
type AllEventTypes = {
  [K in keyof typeof Events]: Events[K] extends BaseEvent<infer T>
    ? Events[K]
    : never;
};

/**
 * GameEvent 联合类型
 * 自动包含所有 extends BaseEvent 的事件接口
 */
export type GameEvent = AllEventTypes[keyof typeof Events];

/**
 * EventType 事件类型标签联合
 * 自动提取所有事件的 type 字段值
 * 用于 getEvents 的类型安全
 */
export type EventType = GameEvent['type'];
```

**Step 3: 验证类型正确性（编译时检查）**

运行类型检查：

```bash
pnpm run type-check
```

预期：应该编译成功，没有类型错误（虽然还没有迁移使用方）

**Step 4: 提交**

```bash
git add src/engine/events/
git commit -m "feat(events): 创建新的事件目录结构和自动类型收集机制"
```

---

## Task 2: 更新 world.ts 以使用新的事件类型

**文件:**
- Modify: `src/engine/world.ts:2`
- Modify: `src/engine/world.ts:414-419`

**Step 1: 更新导入语句**

将第 2 行：
```typescript
import { Event as GameEvent } from './events';
```

改为：
```typescript
import { GameEvent, EventType } from './events';
```

**Step 2: 更新 getEvents 函数的注释和类型**

将第 399-419 行的注释和函数签名更新为：

```typescript
/**
 * 获取指定类型的事件（类型安全）
 * @param w World 对象
 * @param eventType 事件类型字符串（如 'Hit', 'Kill'，有自动补全）
 * @returns 匹配的事件数组
 *
 * @example
 * ```ts
 * // 直接使用字符串字面量，有类型检查和自动补全
 * const hitEvents = getEvents<HitEvent>(world, 'Hit');
 *
 * // ❌ 拼写错误会在编译时被捕获
 * const hits = getEvents<HitEvent>(world, 'HIT'); // Error!
 * ```
 */
export function getEvents<T extends GameEvent>(
  w: World,
  eventType: T['type']
): T[] {
  return w.events.filter((e): e is T => e.type === eventType);
}
```

**Step 3: 运行类型检查**

```bash
pnpm run type-check
```

预期：world.ts 本身应该没有类型错误

**Step 4: 提交**

```bash
git add src/engine/world.ts
git commit -m "refactor(world): 更新事件导入以使用新的自动类型收集"
```

---

## Task 3: 更新所有系统文件 - 批量替换导入和用法

**影响文件:**
- Modify: `src/engine/systems/BombSystem.ts`
- Modify: `src/engine/systems/PickupSystem.ts`
- Modify: `src/engine/systems/DamageResolutionSystem.ts`
- Modify: `src/engine/systems/CameraSystem.ts`
- Modify: `src/engine/systems/ComboSystem.ts`
- Modify: `src/engine/systems/LootSystem.ts`
- Modify: `src/engine/systems/boss/BossPhaseSystem.ts`
- Modify: `src/engine/index.ts`

**Step 1: 更新 BombSystem.ts**

将导入语句（第 18 行）：
```typescript
import { BombExplodedEvent, PlaySoundEvent, CamShakeEvent, EventTags, HitEvent } from "../events";
```

改为：
```typescript
import { BombExplodedEvent, PlaySoundEvent, CamShakeEvent, HitEvent } from "../events";
```

移除所有 `as XXXEvent` 类型断言（第 44, 68, 74, 80 行等）：
- 找到所有 `} as XXXEvent;` 并改为 `};`

将所有 `getEvents<XXXEvent>(world, EventTags.XXX)` 改为 `getEvents<XXXEvent>(world, 'XXX')`

**Step 2: 对其他 6 个系统文件重复相同操作**

每个文件执行相同的替换模式：
1. 从导入中移除 `EventTags`
2. 移除所有 `as XXXEvent` 类型断言
3. 将 `EventTags.Hit` 改为 `'Hit'`

**Step 3: 运行类型检查验证所有修改**

```bash
pnpm run type-check
```

预期：所有系统文件应该没有类型错误

**Step 4: 批量提交**

```bash
git add src/engine/systems/
git commit -m "refactor(systems): 移除 EventTags，改用直接字符串字面量"
```

---

## Task 4: 运行完整测试套件验证功能正确性

**Step 1: 运行所有测试**

```bash
pnpm test
```

预期：所有测试应该通过（事件系统的内部实现没有变化，只是类型系统改进）

**Step 2: 如果有测试失败，逐个修复**

常见问题：
- 测试文件中可能也导入了 `EventTags`，需要同样处理
- mock 事件对象时可能需要调整

**Step 3: 确认所有测试通过后提交**

```bash
git add .
git commit -m "test: 修复测试文件中的事件导入"
```

---

## Task 5: 清理旧的事件文件和 EventTags 引用

**文件:**
- Delete: `src/engine/events.ts`

**Step 1: 确认没有其他文件引用旧文件**

搜索可能的引用：
```bash
grep -r "from.*['\"]\.\/events" src/ --exclude-dir=events
```

预期：应该没有任何输出（所有引用都已更新）

**Step 2: 删除旧文件**

```bash
rm src/engine/events.ts
```

**Step 3: 最终验证**

运行完整的类型检查和测试：
```bash
pnpm run type-check && pnpm test
```

预期：全部通过

**Step 4: 提交清理**

```bash
git add src/engine/events.ts
git commit -m "refactor: 删除旧的 events.ts 文件"
```

---

## Task 6: 添加类型测试确保自动收集机制正常工作

**文件:**
- Create: `src/engine/events/events.test.ts`

**Step 1: 编写类型级别的测试**

```typescript
// src/engine/events/events.test.ts

import { GameEvent, EventType, HitEvent, KillEvent } from './index';
import { expectTypeOf } from 'expect-type';

describe('事件类型自动收集', () => {
  it('应该自动从所有事件接口生成 GameEvent 联合类型', () => {
    // 验证 HitEvent 是 GameEvent 的一种
    const hit: GameEvent = {
      type: 'Hit',
      pos: { x: 0, y: 0 },
      damage: 10,
      owner: 1,
      victim: 2,
    } as HitEvent;

    expect(hit.type).toBe('Hit');
  });

  it('EventType 应该包含所有事件的 type 值', () => {
    // 编译时验证：'Hit' 应该是 EventType 的一种
    const hitType: EventType = 'Hit';
    const killType: EventType = 'Kill';

    expect(hitType).toBe('Hit');
    expect(killType).toBe('Kill');
  });

  it('不应该允许错误的 type 值', () => {
    // 这个测试确保类型系统捕获错误
    // @ts-expect-error - 'InvalidEvent' 不是有效的 EventType
    const invalid: EventType = 'InvalidEvent';
  });
});
```

**Step 2: 运行测试验证**

```bash
pnpm test events.test.ts
```

预期：测试通过，且 TypeScript 编译器能正确捕获类型错误

**Step 3: 提交**

```bash
git add src/engine/events/events.test.ts
git commit -m "test(events): 添加类型测试确保自动收集机制正确"
```

---

## Task 7: 更新相关文档

**文件:**
- Create/Update: `docs/architecture/event-system.md`（如果存在）

**Step 1: 创建或更新事件系统文档**

```markdown
# 事件系统

## 设计理念

事件系统使用 TypeScript 高级类型实现自动类型收集，避免了手动维护 EventTags 和联合类型的重复工作。

## 定义新事件

在 `src/engine/events/events.ts` 中添加新事件：

\`\`\`typescript
export interface MyNewEvent extends BaseEvent<'MyNewEvent'> {
  field1: string;
  field2: number;
}
\`\`\`

就这么简单！`GameEvent` 和 `EventType` 会自动包含这个新事件。

## 使用事件

### 发送事件

\`\`\`typescript
import { pushEvent } from '@/engine/world';

pushEvent(world, {
  type: 'MyNewEvent',
  field1: 'value',
  field2: 42,
});
\`\`\`

### 获取事件

\`\`\`typescript
import { getEvents } from '@/engine/world';
import { MyNewEvent } from '@/engine/events';

const events = getEvents<MyNewEvent>(world, 'MyNewEvent');
\`\`\`

## 类型安全

- `type` 字段有自动补全
- 字段类型会在编译时检查
- 错误的事件名会立即被 TypeScript 捕获
```

**Step 2: 提交文档**

```bash
git add docs/
git commit -m "docs: 更新事件系统文档"
```

---

## 总结

完成此计划后，事件系统将具有以下优势：

✅ **简化添加新事件**: 只需定义一个 interface，自动集成到类型系统
✅ **消除重复**: 不再需要手动维护 EventTags 和 Event 联合类型
✅ **更好的类型安全**: 编译时捕获所有类型错误
✅ **更简洁的 API**: 发送事件不需要类型断言，获取事件不需要 EventTags
✅ **保持轻量**: 仍然是纯对象，运行时零开销

**预计影响范围:**
- 新建文件: 3 个（events.ts, index.ts, events.test.ts）
- 修改文件: 9 个系统文件 + 1 个 world.ts
- 删除文件: 1 个（旧 events.ts）

**预计工作量:** 约 30-45 分钟（包含测试和验证）
