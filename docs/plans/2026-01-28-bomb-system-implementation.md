# 炸弹系统实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 实现传统STG风格的炸弹系统，玩家拾取炸弹道具增加库存（最多9颗），按B键触发全屏爆炸清除敌人。

**架构:** 基于现有ECS架构，通过新增Bomb组件追踪库存，BombSystem处理输入逻辑，利用现有事件系统（BombExplodedEvent）解耦爆炸触发和伤害处理。

**技术栈:** TypeScript, ECS (Entity Component System), Canvas 2D

---

## 前置检查

**验证需求文档:**
- 阅读: `docs/plans/2026-01-28-bomb-system-design.md`
- 确认理解: 炸弹拾取/使用/特效/伤害的完整流程

**验证现有代码:**
- 检查: `src/engine/components/movement.ts:72` - BombIntent 已存在 ✅
- 检查: `src/engine/systems/InputSystem.ts:63-71` - B键监听已实现 ✅
- 检查: `src/engine/systems/EffectPlayer.ts` - 特效框架已就绪 ✅

---

## Task 1: 创建 Bomb 组件

**Files:**
- Create: `src/engine/components/Bomb.ts`
- Modify: `src/engine/components/index.ts`

**Step 1: 创建组件文件**

创建 `src/engine/components/Bomb.ts`:

```typescript
import { Component } from './base';

/**
 * Bomb 组件 - 追踪玩家的炸弹库存
 */
export class Bomb extends Component {
    static check = (comp: Component): comp is Bomb => comp instanceof Bomb;

    /** 当前炸弹数量 */
    count: number;

    /** 最大持有数量（固定为9） */
    maxCount: number;

    constructor(count: number = 0, maxCount: number = 9) {
        super();
        this.count = Math.min(count, maxCount);
        this.maxCount = maxCount;
    }
}
```

**Step 2: 导出组件**

修改 `src/engine/components/index.ts`，添加导出：

```typescript
export * from './Bomb';
```

添加位置：在其他组件导出之后

**Step 3: 验证类型检查**

```bash
npm run type-check
```

Expected: 无类型错误

**Step 4: 提交**

```bash
git add src/engine/components/Bomb.ts src/engine/components/index.ts
git commit -m "feat(components): 添加Bomb组件用于追踪炸弹库存"
```

---

## Task 2: 添加 BombExplodedEvent 事件

**Files:**
- Modify: `src/engine/events.ts`

**Step 1: 添加事件类型到 Event 联合类型**

在 `src/engine/events.ts` 中找到 `export type Event = ...` 定义，添加 `| BombExplodedEvent`:

```typescript
export type Event =
    | HitEvent
    | KillEvent
    | PickupEvent
    | WeaponFiredEvent
    | BossPhaseChangeEvent
    | BossSpecialEvent
    | CamShakeEvent
    | BloodFogEvent
    | LevelUpEvent
    | ComboBreakEvent
    | ScreenClearEvent
    | PlaySoundEvent
    | BerserkModeEvent
    | ComboUpgradeEvent
    | BombExplodedEvent;  // 新增
```

**Step 2: 添加事件标签**

在 `src/engine/events.ts` 中找到 `export const EventTags = ...` 定义，添加标签：

```typescript
export const EventTags = {
    Hit: 'Hit',
    Kill: 'Kill',
    Pickup: 'Pickup',
    WeaponFired: 'WeaponFired',
    BossPhaseChange: 'BossPhaseChange',
    BossSpecialEvent: 'BossSpecialEvent',
    CamShake: 'CamShake',
    BloodFog: 'BloodFog',
    LevelUp: 'LevelUp',
    ComboBreak: 'ComboBreak',
    ScreenClear: 'ScreenClear',
    PlaySound: 'PlaySound',
    BerserkMode: 'BerserkMode',
    ComboUpgrade: 'ComboUpgrade',
    BombExploded: 'BombExploded',  // 新增
} as const;
```

**Step 3: 定义事件接口**

在 `src/engine/events.ts` 文件末尾（在 `ComboUpgradeEvent` 定义之后）添加：

```typescript
// ⑧ 炸弹爆炸
export interface BombExplodedEvent {
    type: 'BombExploded';
    pos: { x: number; y: number };  // 爆炸中心位置（玩家位置）
    playerId: number;               // 使用炸弹的玩家ID
}
```

**Step 4: 验证类型检查**

```bash
npm run type-check
```

Expected: 无类型错误

**Step 5: 提交**

```bash
git add src/engine/events.ts
git commit -m "feat(events): 添加BombExplodedEvent事件"
```

---

## Task 3: 修改 PickupSystem 处理 BOMB 拾取

**Files:**
- Modify: `src/engine/systems/PickupSystem.ts`

**Step 1: 导入 Bomb 组件**

在 `src/engine/systems/PickupSystem.ts` 顶部导入区域添加：

```typescript
import { Bomb } from '../components/Bomb';
```

添加位置：在现有组件导入之后

**Step 2: 修改 applyBuffPickup 函数中的 BOMB 分支**

找到 `case BuffType.BOMB:` 分支（约第120行），替换为：

```typescript
        case BuffType.BOMB:
            // BOMB: 增加炸弹数量
            let bomb = playerComps.find(Bomb.check);
            if (bomb) {
                // 已有 Bomb 组件，增加计数
                const oldCount = bomb.count;
                bomb.count = Math.min(bomb.count + 1, bomb.maxCount);

                // 如果达到上限，播放提示音
                if (bomb.count === bomb.maxCount && oldCount < bomb.maxCount) {
                    pushEvent(world, {
                        type: 'PlaySound',
                        soundId: 'bomb_max'
                    } as PlaySoundEvent);
                }
            } else {
                // 首次拾取，创建 Bomb 组件
                playerComps.push(new Bomb(1, 9));
            }

            // 播放拾取特效
            pushEvent(world, {
                type: 'Pickup',
                pos: { x: 0, y: 0 },
                itemId: BuffType.BOMB,
                owner: playerId
            } as PickupEvent);
            break;
```

**Step 3: 验证类型检查**

```bash
npm run type-check
```

Expected: 无类型错误

**Step 4: 提交**

```bash
git add src/engine/systems/PickupSystem.ts
git commit -m "feat(PickupSystem): 拾取BOMB道具时增加炸弹库存"
```

---

## Task 4: 创建 BombSystem

**Files:**
- Create: `src/engine/systems/BombSystem.ts`
- Modify: `src/engine/systems/index.ts`

**Step 1: 创建 BombSystem 文件**

创建 `src/engine/systems/BombSystem.ts`:

```typescript
/**
 * 炸弹系统 (BombSystem)
 *
 * 职责：
 * - 监听玩家的 BombIntent 组件
 * - 检查是否有足够的炸弹库存
 * - 触发炸弹爆炸效果和伤害
 * - 管理炸弹冷却时间（防止连发）
 *
 * 系统类型：交互层
 * 执行顺序：P4 - 在 CollisionSystem 之后
 */

import { World } from '../types';
import { Bomb, BombIntent, Transform } from '../components';
import { removeComponent } from '../world';
import { pushEvent } from '../world';
import { BombExplodedEvent, PlaySoundEvent, CamShakeEvent, EventTags } from '../events';

/**
 * 炸弹使用冷却时间（毫秒）
 * 防止玩家一帧内消耗所有炸弹
 */
const BOMB_COOLDOWN = 500;

/**
 * 上次使用炸弹的时间戳
 */
let lastBombTime = 0;

/**
 * 炸弹系统主函数
 */
export function BombSystem(world: World, dt: number): void {
    // 获取玩家组件
    const playerComps = world.entities.get(world.playerId);
    if (!playerComps) return;

    // 检查是否有炸弹意图
    const bombIntent = playerComps.find(BombIntent.check);
    if (!bombIntent) return;

    // 检查是否有炸弹库存组件
    const bomb = playerComps.find(Bomb.check);
    if (!bomb || bomb.count <= 0) {
        // 没有炸弹，移除意图并播放"空弹"音效
        removeComponent(world, world.playerId, bombIntent);
        pushEvent(world, {
            type: 'PlaySound',
            soundId: 'bomb_empty'
        } as PlaySoundEvent);
        return;
    }

    // 检查冷却时间
    const now = world.time;
    if (now - lastBombTime < BOMB_COOLDOWN) {
        return; // 冷却中，不响应
    }

    // === 消耗炸弹 ===
    bomb.count--;
    lastBombTime = now;

    // 移除意图（单次触发）
    removeComponent(world, world.playerId, bombIntent);

    // === 触发爆炸 ===
    // 1. 发送炸弹爆炸事件
    const playerTransform = playerComps.find(Transform.check);
    pushEvent(world, {
        type: 'BombExploded',
        pos: playerTransform ? { x: playerTransform.x, y: playerTransform.y } : { x: 0, y: 0 },
        playerId: world.playerId
    } as BombExplodedEvent);

    // 2. 触发震屏
    pushEvent(world, {
        type: 'CamShake',
        intensity: 10,  // 10px 震动
        duration: 0.5   // 0.5秒
    } as CamShakeEvent);

    // 3. 播放爆炸音效
    pushEvent(world, {
        type: 'PlaySound',
        soundId: 'bomb_explode_large'
    } as PlaySoundEvent);
}
```

**Step 2: 导出系统**

修改 `src/engine/systems/index.ts`，添加导出：

```typescript
export * from './BombSystem';
```

**Step 3: 验证类型检查**

```bash
npm run type-check
```

Expected: 无类型错误

**Step 4: 提交**

```bash
git add src/engine/systems/BombSystem.ts src/engine/systems/index.ts
git commit -m "feat(systems): 添加BombSystem处理炸弹使用逻辑"
```

---

## Task 5: 扩展 EffectPlayer 添加炸弹特效

**Files:**
- Modify: `src/engine/systems/EffectPlayer.ts`

**Step 1: 添加特效配置**

在 `src/engine/systems/EffectPlayer.ts` 的 `EFFECT_CONFIGS` 对象中添加（约第125行之后）：

```typescript
    // 炸弹爆炸特效
    bomb_explosion: {
        scale: 5,           // 超大尺寸
        color: '#ffaa00',   // 橙黄色爆炸
        frames: 30,         // 30帧动画
        fps: 30,            // 30fps播放
        lifetime: 1.0       // 持续1秒
    },

    // 全屏闪光特效
    screen_flash: {
        scale: 20,          // 覆盖全屏
        color: '#ffffff',   // 白色闪光
        frames: 5,          // 快速闪烁
        fps: 30,
        lifetime: 0.2       // 0.2秒
    }
```

**Step 2: 导入事件类型**

在 `src/engine/systems/EffectPlayer.ts` 顶部导入区域添加 `BombExplodedEvent`:

```typescript
import { HitEvent, KillEvent, PickupEvent, BossPhaseChangeEvent, CamShakeEvent, BloodFogEvent, LevelUpEvent, ComboUpgradeEvent, BerserkModeEvent, BombExplodedEvent } from '../events';
```

**Step 3: 在 EffectPlayer 主函数中添加事件处理**

在 `src/engine/systems/EffectPlayer.ts` 的 `EffectPlayer` 函数的 switch 语句中添加（约第167行之后）：

```typescript
            case 'BombExploded':
                handleBombExplodedEvent(world, event as BombExplodedEvent);
                break;
```

**Step 4: 实现事件处理函数**

在 `src/engine/systems/EffectPlayer.ts` 文件末尾添加函数：

```typescript
/**
 * 处理炸弹爆炸事件
 */
function handleBombExplodedEvent(world: World, event: BombExplodedEvent): void {
    // 生成全屏闪光特效
    spawnParticle(world, 'screen_flash', world.width / 2, world.height / 2);

    // 在爆炸位置生成超大型爆炸粒子
    spawnParticle(world, 'bomb_explosion', event.pos.x, event.pos.y);

    // 在屏幕四周生成额外的爆炸装饰
    const margin = 100;
    spawnParticle(world, 'explosion_large', margin, margin);
    spawnParticle(world, 'explosion_large', world.width - margin, margin);
    spawnParticle(world, 'explosion_large', margin, world.height - margin);
    spawnParticle(world, 'explosion_large', world.width - margin, world.height - margin);
}
```

**Step 5: 验证类型检查**

```bash
npm run type-check
```

Expected: 无类型错误

**Step 6: 提交**

```bash
git add src/engine/systems/EffectPlayer.ts
git commit -m "feat(EffectPlayer): 添加炸弹爆炸特效（全屏闪光+大型粒子）"
```

---

## Task 6: 扩展 DamageResolutionSystem 处理炸弹伤害

**Files:**
- Modify: `src/engine/systems/DamageResolutionSystem.ts`

**Step 1: 导入事件和工具函数**

在 `src/engine/systems/DamageResolutionSystem.ts` 顶部添加导入：

```typescript
import { BombExplodedEvent, EventTags } from '../events';
import { getEvents } from '../world';
```

**Step 2: 在主函数中添加炸弹事件处理**

在 `DamageResolutionSystem` 主函数末尾（在现有代码之后）添加：

```typescript
    // 处理炸弹爆炸事件
    const bombEvents = getEvents<BombExplodedEvent>(world, EventTags.BombExploded);
    for (const event of bombEvents) {
        handleBombExplosion(world, event);
    }
```

**Step 3: 实现炸弹爆炸处理函数**

在 `src/engine/systems/DamageResolutionSystem.ts` 文件末尾添加函数：

```typescript
/**
 * 处理炸弹爆炸 - 对所有敌人造成致命伤害
 */
function handleBombExplosion(world: World, event: BombExplodedEvent): void {
    // 遍历所有实体，找到敌人
    for (const [enemyId, comps] of world.entities) {
        // 检查是否是敌人（有 EnemyTag 组件）
        const hasEnemyTag = comps.some(c =>
            c.constructor.name === 'EnemyTag' ||
            (c as any).id?.startsWith?.('ENEMY_')
        );

        if (!hasEnemyTag) continue;

        // 获取敌人的生命值组件
        const health = comps.find(c => c.constructor.name === 'Health');
        if (!health) continue;

        // 造成致命伤害（直接扣完所有血量）
        const maxHp = (health as any).max || 100;
        pushEvent(world, {
            type: 'Damage',
            victim: enemyId,
            amount: maxHp * 2,  // 造成200%最大生命值的伤害，确保击杀
            source: world.playerId,
            damageType: 'bomb'
        } as DamageEvent);
    }

    // 对 Boss 也造成大量伤害（但不一定一击必杀）
    // 注意：Boss 需要通过特定方式识别，这里暂时跳过
    // TODO: 添加 Boss 识别逻辑
}
```

**Step 4: 验证类型检查**

```bash
npm run type-check
```

Expected: 无类型错误（如果 DamageEvent 未定义，可能需要导入或使用正确的事件名）

**Step 5: 提交**

```bash
git add src/engine/systems/DamageResolutionSystem.ts
git commit -m "feat(DamageResolutionSystem): 处理炸弹爆炸伤害（敌人一击必杀）"
```

---

## Task 7: 更新 powerups.ts 配置

**Files:**
- Modify: `src/engine/configs/powerups.ts`

**Step 1: 添加 BOMB 配置**

在 `src/engine/configs/powerups.ts` 的 `BUFF_CONFIG` 对象中添加：

```typescript
    [BuffType.BOMB]: {
        /** 每次拾取增加的炸弹数量 */
        countIncrease: 1,
        /** 最大持有数量 */
        maxCount: 9,
        /** 达到上限时的提示音 */
        maxSound: 'bomb_max',
    },
```

添加位置：在现有配置项之后，确保在闭合的 `} as const;` 之前

**Step 2: 验证类型检查**

```bash
npm run type-check
```

Expected: 无类型错误

**Step 3: 提交**

```bash
git add src/engine/configs/powerups.ts
git commit -m "feat(configs): 添加BOMB道具配置"
```

---

## Task 8: 引擎系统集成

**Files:**
- Modify: `src/engine/engine.ts`

**Step 1: 导入 BombSystem 和 Bomb 组件**

在 `src/engine/engine.ts` 顶部导入区域添加：

```typescript
import { BombSystem } from './systems/BombSystem';
import { Bomb } from './components/Bomb';
```

**Step 2: 在 update 方法中添加 BombSystem**

在 `src/engine/engine.ts` 的 `update` 方法中找到 `CollisionSystem(world, dt);` 调用，在其后添加：

```typescript
        BombSystem(world, dt);
```

添加位置：在 P4 交互层，CollisionSystem 之后

**Step 3: 验证类型检查**

```bash
npm run type-check
```

Expected: 无类型错误

**Step 4: 运行构建**

```bash
npm run build
```

Expected: 构建成功，无错误

**Step 5: 提交**

```bash
git add src/engine/engine.ts
git commit -m "feat(engine): 集成BombSystem到主循环"
```

---

## Task 9: 为玩家实体初始化 Bomb 组件

**Files:**
- Modify: 需要先找到玩家实体创建的位置

**Step 1: 查找玩家实体创建代码**

```bash
grep -r "new Player" src/engine/
```

或

```bash
grep -r "PlayerTag" src/engine/blueprints/
```

找到玩家蓝图或创建玩家实体的代码位置

**Step 2: 添加 Bomb 组件到玩家实体**

根据找到的位置，在玩家实体创建时添加 Bomb 组件：

```typescript
Bomb: { count: 0, maxCount: 9 },
```

或在代码中：
```typescript
new Bomb(0, 9)
```

**Step 3: 验证类型检查**

```bash
npm run type-check
```

Expected: 无类型错误

**Step 4: 提交**

```bash
git add <找到的玩家创建文件>
git commit -m "feat(player): 为玩家初始化Bomb组件（0颗炸弹，最多9颗）"
```

---

## Task 10: 集成测试和文档更新

**Files:**
- Modify: `src/engine/README.md` 或相关文档
- Create: 手动测试文档

**Step 1: 更新系统架构文档**

在相关文档中添加 BombSystem 的说明：

```markdown
### BombSystem (炸弹系统)
- 职责：处理玩家炸弹使用逻辑
- 触发方式：玩家按 B 键
- 效果：全屏爆炸清除敌人
- 依赖：Bomb 组件、BombIntent 组件
```

**Step 2: 创建手动测试清单**

创建 `docs/tests/bomb-system-test-checklist.md`:

```markdown
# 炸弹系统测试清单

## 基础功能测试
- [ ] 拾取 BOMB 道具后，炸弹计数从 0 增加到 1
- [ ] 连续拾取 9 个 BOMB 道具，计数达到 9
- [ ] 拾取第 10 个 BOMB 道具，计数保持 9（达到上限）
- [ ] 按 B 键，炸弹计数减少 1
- [ ] 没有炸弹时按 B 键，播放空弹音效
- [ ] 快速连按 B 键，受 500ms 冷却时间限制

## 伤害测试
- [ ] 炸弹爆炸后，普通敌人被一击必杀
- [ ] 炸弹爆炸后，屏幕上所有敌人被清除

## 特效测试
- [ ] 炸弹爆炸时，全屏闪光明显
- [ ] 炸弹爆炸时，玩家位置有超大型爆炸粒子
- [ ] 炸弹爆炸时，屏幕四角有装饰性爆炸
- [ ] 炸弹爆炸时，震屏 10px 持续 0.5 秒

## 边界情况测试
- [ ] 游戏开始时，玩家炸弹计数为 0
- [ ] 暂停游戏时，炸弹冷却时间也暂停
- [ ] 炸弹爆炸后，KillEvent 正确触发
- [ ] 炸弹爆炸后，敌人正确掉落道具
```

**Step 3: 运行所有测试**

```bash
npm test
```

Expected: 所有测试通过

**Step 4: 构建并验证**

```bash
npm run build
npm run type-check
```

Expected: 无错误

**Step 5: 提交**

```bash
git add docs/tests/bomb-system-test-checklist.md
git add <更新的文档>
git commit -m "docs: 添加炸弹系统测试清单和文档更新"
```

---

## Task 11: 代码审查和最终验证

**Step 1: 代码审查清单**

检查以下内容：
- [ ] 所有导入语句正确
- [ ] 类型定义完整（无 any 类型）
- [ ] 事件处理逻辑正确
- [ ] 边界情况处理（没有炸弹、达到上限、冷却时间）
- [ ] 性能考虑（事件过滤、避免不必要的遍历）
- [ ] 代码风格一致（命名、注释、格式）

**Step 2: 最终集成测试**

启动游戏，手动测试：
1. 拾取炸弹道具
2. 观察炸弹计数增加
3. 按 B 键使用炸弹
4. 观察爆炸特效和敌人清除
5. 验证冷却时间

**Step 3: 性能验证**

使用浏览器开发者工具：
- 检查炸弹爆炸时的帧率
- 确认没有内存泄漏
- 确认事件队列正常工作

**Step 4: 最终提交**

```bash
git add .
git commit -m "feat(bomb): 完成炸弹系统实现

特性：
- 拾取 BOMB 道具增加库存（最多9颗）
- 按 B 键使用炸弹触发全屏爆炸
- 普通敌人一击必杀
- 全屏闪光+大型爆炸粒子+震屏10px/0.5s
- 500ms冷却时间防止连发

详见：docs/plans/2026-01-28-bomb-system-design.md
测试清单：docs/tests/bomb-system-test-checklist.md
"
```

---

## 附录：文件结构总览

```
src/engine/
├── components/
│   ├── Bomb.ts                    [新建] 炸弹库存组件
│   └── index.ts                   [修改] 导出 Bomb
├── systems/
│   ├── BombSystem.ts              [新建] 炸弹使用系统
│   ├── PickupSystem.ts            [修改] 处理 BOMB 拾取
│   ├── EffectPlayer.ts            [修改] 添加爆炸特效
│   ├── DamageResolutionSystem.ts  [修改] 处理炸弹伤害
│   └── index.ts                   [修改] 导出 BombSystem
├── configs/
│   └── powerups.ts                [修改] 添加 BOMB 配置
├── events.ts                      [修改] 添加 BombExplodedEvent
└── engine.ts                      [修改] 集成 BombSystem

docs/
├── plans/
│   └── 2026-01-28-bomb-system-implementation.md  [本文件]
└── tests/
    └── bomb-system-test-checklist.md            [新建]
```

---

## 执行顺序

严格按照 Task 1 → Task 2 → ... → Task 11 的顺序执行。

每个 Task 完成后提交，确保可以随时回滚。

遇到问题时：
1. 检查类型定义
2. 查看相关文档
3. 运行测试验证
4. 提交前确保构建通过
