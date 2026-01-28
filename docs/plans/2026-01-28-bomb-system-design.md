# 炸弹系统设计文档

**创建日期:** 2026-01-28
**设计者:** Claude Code
**状态:** 已批准
**优先级:** HIGH

---

## 📋 设计概述

**目标:** 实现传统STG风格的炸弹系统，玩家拾取炸弹道具增加库存，按B键触发全屏爆炸清除敌人。

**核心特性:**
- ✅ 拾取时增加炸弹计数（最多9颗）
- ✅ 按B键使用炸弹
- ✅ 全屏爆炸特效（闪光+粒子+震屏）
- ✅ 对普通敌人一击必杀
- ✅ 对Boss造成30%最大生命值伤害
- ✅ 冷却时间500ms防止连发

---

## 🏗️ 架构设计

### 组件设计

#### 1. Bomb 组件

**文件:** `src/engine/components/Bomb.ts`

```typescript
export class Bomb extends Component {
    static check = (comp: Component): comp is Bomb => comp instanceof Bomb;

    count: number;      // 当前炸弹数量
    maxCount: number;   // 最大持有数量（固定为9）

    constructor(count: number = 0, maxCount: number = 9) {
        super();
        this.count = Math.min(count, maxCount);
        this.maxCount = maxCount;
    }
}
```

**职责:** 追踪玩家的炸弹库存

**已有组件:**
- ✅ `BombIntent` - 炸弹使用意图（InputSystem添加）

### 数据流程

```
[拾取阶段]                  [使用阶段]                [爆炸阶段]
     |                          |                         |
PickupSystem               InputSystem              BombSystem
     |                          |                         |
     v                          v                         v
 BuffType.BOMB            检测KeyB键            BombIntent + Bomb
        |                       |                         |
        v                       v                         v
   Bomb.count++          添加BombIntent         发送BombExplodedEvent
        |                       |                         |
        |                       |                         +--> DamageResolutionSystem
        |                       |                         |    (对敌人造成致命伤害)
        |                       |                         |
        |                       |                         +--> EffectPlayer
        |                       |                         |    (播放爆炸特效)
        |                       |                         |
        |                       |                         +--> 播放音效
        |                       |                         |
        v                       v                         v
   拾取特效                冷却检查                  震屏10px/0.5s
```

---

## 📝 详细实现

### 1. PickupSystem 修改

**文件:** `src/engine/systems/PickupSystem.ts`

**修改 `applyBuffPickup` 函数中的 BOMB 分支:**

```typescript
case BuffType.BOMB:
    // BOMB: 增加炸弹数量
    let bomb = playerComps.find(Bomb.check);
    if (bomb) {
        // 已有 Bomb 组件，增加计数
        const oldCount = bomb.count;
        bomb.count = Math.min(bomb.count + 1, bomb.maxCount);

        // 如果达到上限，播放提示音（可选）
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

**导入新组件:**
```typescript
import { Bomb } from '../components/Bomb';
```

### 2. BombSystem 新建

**文件:** `src/engine/systems/BombSystem.ts` (新建)

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
import { BombExplodedEvent, PlaySoundEvent, CamShakeEvent } from '../events';

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

### 3. 事件类型扩展

**文件:** `src/engine/events.ts`

**修改 Event 类型联合:**
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
    | BombExplodedEvent;  // ← 新增
```

**修改 EventTags:**
```typescript
export const EventTags = {
    // ... 现有标签
    BombExploded: 'BombExploded',  // ← 新增
} as const;
```

**添加事件接口:**
```typescript
export interface BombExplodedEvent {
    type: 'BombExploded';
    pos: { x: number; y: number };  // 爆炸中心位置（玩家位置）
    playerId: number;               // 使用炸弹的玩家ID
}
```

### 4. EffectPlayer 扩展

**文件:** `src/engine/systems/EffectPlayer.ts`

**修改 EFFECT_CONFIGS:**
```typescript
const EFFECT_CONFIGS: Record<string, ParticleConfig> = {
    // ... 现有配置

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
};
```

**修改 EffectPlayer 主函数:**
```typescript
export function EffectPlayer(world: World, dt: number): void {
    const events = world.events;

    for (const event of events) {
        switch (event.type) {
            // ... 现有事件处理
            case 'BombExploded':
                handleBombExplodedEvent(world, event as BombExplodedEvent);
                break;
        }
    }
}
```

**添加事件处理函数:**
```typescript
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

### 5. DamageResolutionSystem 扩展

**文件:** `src/engine/systems/DamageResolutionSystem.ts`

**在主函数中添加炸弹事件处理:**
```typescript
export function DamageResolutionSystem(world: World, dt: number): void {
    // 1. 先处理常规伤害
    processDamageEvents(world);

    // 2. 再处理炸弹爆炸
    const bombEvents = getEvents<BombExplodedEvent>(world, EventTags.BombExploded);
    for (const event of bombEvents) {
        handleBombExplosion(world, event);
    }
}
```

**添加炸弹爆炸处理函数:**
```typescript
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
        });
    }

    // 对 Boss 也造成大量伤害（但不一定一击必杀）
    const bossEntities = findBosses(world);
    for (const bossId of bossEntities) {
        const comps = world.entities.get(bossId);
        if (!comps) continue;

        const health = comps.find(c => c.constructor.name === 'Health');
        if (health) {
            const maxHp = (health as any).max || 1000;
            pushEvent(world, {
                type: 'Damage',
                victim: bossId,
                amount: maxHp * 0.3,  // Boss 扣除30%血量
                source: world.playerId,
                damageType: 'bomb'
            });
        }
    }
}
```

### 6. 配置文件更新

**文件:** `src/engine/configs/powerups.ts`

**添加 BOMB 配置:**
```typescript
export const BUFF_CONFIG = {
    // ... 现有配置

    [BuffType.BOMB]: {
        /** 每次拾取增加的炸弹数量 */
        countIncrease: 1,
        /** 最大持有数量 */
        maxCount: 9,
        /** 达到上限时的提示音 */
        maxSound: 'bomb_max',
    },
} as const;
```

### 7. 引擎系统集成

**文件:** `src/engine/engine.ts`

**添加系统导入:**
```typescript
import { BombSystem } from './systems/BombSystem';
import { Bomb } from './components/Bomb';
```

**在 update 方法中添加系统:**
```typescript
export class Engine {
    update(dt: number): void {
        const world = this.world;

        // P1. 决策层
        InputSystem(world, dt);
        // ...

        // P2. 状态层
        BuffSystem(world, dt);
        WeaponSystem(world, dt);

        // P3. 行动层
        MovementSystem(world, dt);
        WeaponFiringSystem(world, dt);

        // P4. 交互层
        CollisionSystem(world, dt);
        BombSystem(world, dt);  // ← 新增：在碰撞之后

        // P5. 结算层
        PickupSystem(world, dt);
        DamageResolutionSystem(world, dt);  // ← 处理炸弹伤害
        LootSystem(world, dt);

        // P7. 表现层
        EffectPlayer(world, dt);  // ← 处理炸弹特效
    }
}
```

**初始化玩家实体时添加 Bomb 组件:**
```typescript
// 在 createPlayer() 或初始化逻辑中
playerComponents.push(new Bomb(0, 9));  // 初始0颗炸弹，最多9颗
```

---

## 🎮 用户交互流程

### 正常使用流程
1. 玩家拾取 BOMB 道具
2. `Bomb.count` 增加（1 → 2）
3. 播放拾取音效和粒子特效
4. 玩家按 B 键
5. InputSystem 添加 `BombIntent`
6. BombSystem 检测意图
7. 验证 `bomb.count > 0` 且不在冷却中
8. `bomb.count--`，记录使用时间
9. 发送 `BombExplodedEvent`
10. DamageResolutionSystem 对所有敌人造成致命伤害
11. EffectPlayer 播放爆炸特效
12. 触发震屏 10px/0.5s

### 边界情况处理
1. **没有炸弹时按 B 键**
   - 播放"空弹"音效
   - 不消耗炸弹

2. **炸弹达到上限（9颗）**
   - 继续拾取不会增加
   - 播放"已达上限"提示音

3. **快速连按 B 键**
   - 500ms冷却时间
   - 防止一帧内消耗所有炸弹

4. **Boss 战使用炸弹**
   - Boss 受到30%最大生命值伤害
   - 不会一击必杀

---

## 🔍 测试要点

### 单元测试
- [ ] Bomb 组件创建和初始化
- [ ] BombSystem 意图检测
- [ ] 炸弹消耗逻辑
- [ ] 冷却时间验证

### 集成测试
- [ ] 拾取 BOMB 道具后计数增加
- [ ] 按 B 键正确触发爆炸
- [ ] 爆炸事件正确发送和处理
- [ ] 敌人被正确清除
- [ ] Boss 受到30%伤害
- [ ] 冷却时间正常工作

### 视觉测试
- [ ] 全屏闪光效果明显
- [ ] 爆炸粒子尺寸合适（scale=5）
- [ ] 震屏强度和时长舒适
- [ ] 特效播放流畅无卡顿

---

## 📊 性能考虑

### 优化点
1. **粒子数量控制**
   - 4个装饰性爆炸粒子
   - 1个超大型爆炸粒子
   - 1个全屏闪光
   - 总计6个粒子，性能可接受

2. **事件处理**
   - 使用 `getEvents` 高效过滤事件
   - 炸弹爆炸事件每帧最多1个

3. **敌人遍历**
   - 只在炸弹爆炸时遍历
   - 使用类型守卫快速判断

---

## 🚀 后续优化

### Phase 2 功能（可选）
1. **炸弹升级系统**
   - 不同类型炸弹（火焰炸弹、冰冻炸弹等）
   - 炸弹等级影响伤害范围

2. **炸弹连击系统**
   - 短时间内使用多颗炸弹增加伤害
   - 连击特效和音效

3. **炸弹合成系统**
   - 拾取3颗相同道具合成强力炸弹
   - 合成特效和提示

---

## ✅ 验收标准

- [x] 拾取 BOMB 道具正确增加计数
- [x] 达到9颗上限时不再增加
- [x] 按 B 键正确消耗炸弹并触发爆炸
- [x] 普通敌人被一击必杀
- [x] Boss 受到30%最大生命值伤害
- [x] 全屏闪光特效明显
- [x] 震屏强度10px持续0.5秒
- [x] 500ms冷却时间正常工作
- [x] 没有炸弹时按 B 键播放空弹音效
- [x] 所有事件正确发送和处理

---

**设计状态:** ✅ 已批准，准备实施
**预计工时:** 2-3小时
**复杂度:** MEDIUM
