# 事件系统

## 设计理念

事件系统使用 TypeScript 高级类型实现自动类型收集，避免了手动维护 EventTags 和联合类型的重复工作。

### 核心优势

- ✅ **简化添加新事件**: 只需定义一个 interface，自动集成到类型系统
- ✅ **消除重复**: 不再需要手动维护 EventTags 和 Event 联合类型
- ✅ **更好的类型安全**: 编译时捕获所有类型错误
- ✅ **更简洁的 API**: 发送事件不需要类型断言，获取事件不需要 EventTags
- ✅ **保持轻量**: 仍然是纯对象，运行时零开销

## 架构

### 文件结构

```
src/engine/events/
├── events.ts    # 所有事件定义
└── index.ts     # 自动类型收集和导出
```

### 类型收集机制

参考 `src/engine/blueprints/base.ts` 的模式，使用映射类型自动收集事件：

```typescript
// src/engine/events/index.ts

import * as Events from './events';

// 自动收集所有 extends BaseEvent 的事件类型
type AllEventTypes = {
  [K in keyof typeof Events]: Events[K] extends BaseEvent<infer T>
    ? Events[K]
    : never;
};

// GameEvent 联合类型
export type GameEvent = AllEventTypes[keyof typeof Events];

// EventType 事件类型标签联合
export type EventType = GameEvent['type'];
```

## 定义新事件

在 `src/engine/events/events.ts` 中添加新事件：

```typescript
export interface MyNewEvent extends BaseEvent<'MyNewEvent'> {
  field1: string;
  field2: number;
}
```

就这么简单！`GameEvent` 和 `EventType` 会自动包含这个新事件。

### 完整示例

```typescript
// src/engine/events/events.ts

import { EntityId } from "../types";

// 基础事件接口
export interface BaseEvent<T extends string> {
  type: T;
}

// 定义新事件
export interface PlayerScoreEvent extends BaseEvent<'PlayerScore'> {
  playerId: EntityId;
  score: number;
  reason: string;
}
```

## 使用事件

### 发送事件

```typescript
import { pushEvent } from '@/engine/world';

// 不需要类型断言！TypeScript 自动推断类型
pushEvent(world, {
  type: 'PlayerScore',
  playerId: 1,
  score: 100,
  reason: 'kill_enemy'
});

// ❌ 编译错误：缺少必需字段
pushEvent(world, {
  type: 'PlayerScore',
  playerId: 1
  // Error: missing 'score' and 'reason'
});

// ❌ 编译错误：类型不匹配
pushEvent(world, {
  type: 'PlayerScore',
  playerId: 1,
  score: '100',  // Error: string is not assignable to number
  reason: 'kill'
});

// ❌ 编译错误：拼写错误
pushEvent(world, {
  type: 'PlayerSocre',  // Error: 'PlayerSocre' is not assignable to EventType
  playerId: 1,
  score: 100,
  reason: 'kill'
});
```

### 获取事件

```typescript
import { getEvents } from '@/engine/world';
import { PlayerScoreEvent } from '@/engine/events';

// 直接使用字符串字面量，有类型检查和自动补全
const scoreEvents = getEvents<PlayerScoreEvent>(world, 'PlayerScore');

// 遍历事件
for (const event of scoreEvents) {
  console.log(event.score); // 类型安全！
}

// ❌ 编译错误：拼写错误会在编译时被捕获
const events = getEvents<PlayerScoreEvent>(world, 'PlayerSocre');
// Error: 'PlayerSocre' is not assignable to PlayerScoreEvent['type']
```

## 类型安全

### 编译时检查

- ✅ `type` 字段有自动补全（IDE 会提示所有可用的事件类型）
- ✅ 字段类型会在编译时检查
- ✅ 错误的事件名会立即被 TypeScript 捕获
- ✅ 缺少必需字段会报错
- ✅ 字段类型不匹配会报错

### 运行时行为

事件系统仍然使用纯对象，运行时没有额外开销：

```typescript
// 运行时：普通 JavaScript 对象
{
  type: 'Hit',
  pos: { x: 100, y: 200 },
  damage: 10,
  owner: 1,
  victim: 2
}
```

## 现有事件列表

以下是当前系统中定义的所有事件（按字母顺序）：

| 事件名称 | 说明 | 主要字段 |
|---------|------|---------|
| `BaseEvent` | 基础事件接口 | `type: T` |
| `HitEvent` | 命中（碰撞瞬间） | `pos`, `damage`, `owner`, `victim` |
| `KillEvent` | 击杀（HP ≤ 0） | `pos`, `victim`, `killer`, `score` |
| `PickupEvent` | 拾取道具 | `pos`, `itemId`, `owner` |
| `WeaponFiredEvent` | 武器发射 | `pos`, `weaponId`, `owner` |
| `BossPhaseChangeEvent` | Boss 阶段切换 | `phase`, `bossId` |
| `BossSpecialEvent` | Boss 特殊事件 | `event`, `bossId`, `phase` |
| `CamShakeEvent` | 相机震屏 | `intensity`, `duration` |
| `BloodFogEvent` | 血雾/飙血特效 | `pos`, `level`, `duration` |
| `LevelUpEvent` | 玩家升级 | `oldLevel`, `newLevel`, `source` |
| `ComboBreakEvent` | 连击中断 | `combo`, `reason` |
| `ScreenClearEvent` | 清屏事件 | 无额外字段 |
| `PlaySoundEvent` | 播放音效 | `name` |
| `BerserkModeEvent` | 狂暴模式触发 | `pos` |
| `ComboUpgradeEvent` | 连击升级 | `pos`, `level`, `name`, `color` |
| `BombExplodedEvent` | 炸弹爆炸 | `pos`, `playerId` |
| `WeaponEffectEvent` | 武器特效 | `pos`, `weaponType`, `effectType` |
| `ShieldBrokenEvent` | 护盾破碎 | `pos`, `owner` |
| `TimeSlowEvent` | 时间减速 | `scale`, `duration`, `action` |

## 迁移指南

如果你需要将使用旧 EventTags 的代码迁移到新系统：

### 修改前

```typescript
import { HitEvent, EventTags } from '../events';

// 发送事件需要类型断言
pushEvent(world, {
  type: 'Hit',
  pos: { x: 0, y: 0 },
  damage: 10,
  owner: 1,
  victim: 2
} as HitEvent);

// 获取事件需要 EventTags
const hits = getEvents<HitEvent>(world, EventTags.Hit);
```

### 修改后

```typescript
import { HitEvent } from '../events';

// 发送事件不需要类型断言
pushEvent(world, {
  type: 'Hit',
  pos: { x: 0, y: 0 },
  damage: 10,
  owner: 1,
  victim: 2
});

// 获取事件使用字符串字面量
const hits = getEvents<HitEvent>(world, 'Hit');
```

### 迁移步骤

1. 更新导入：移除 `EventTags`，更新路径为包含 `/index`
2. 移除所有 `as XXXEvent` 类型断言
3. 将 `EventTags.XXX` 改为 `'XXX'` 字符串字面量
4. 运行 `pnpm run lint` 验证类型检查
5. 运行 `pnpm test` 确保功能正常

## 测试

事件系统包含类型测试，确保自动类型收集机制正常工作：

```bash
pnpm test event-types.test.ts
```

测试内容：
- 验证 GameEvent 联合类型包含所有事件
- 验证 EventType 包含所有事件类型标签
- 验证类型系统能捕获错误的事件名
