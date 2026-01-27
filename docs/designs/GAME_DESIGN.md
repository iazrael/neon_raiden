# 2D 太空射击游戏核心技术实施文档 (ECS + TypeScript)

## 一、核心架构原则

1.  **纯粹 ECS 模式**：
    *   **Entity**：仅仅是一个数字 ID (`number`)。
    *   **Component**：纯数据容器（Class），**严禁包含业务逻辑**。
    *   **System**：纯逻辑函数，每帧遍历组件，**严禁持有状态**。
2.  **数据与逻辑分离**：
    *   **Blueprint (蓝图)**：实体**出生瞬间**的快照（JSON），负责 `new` 组件。
    *   **Spec (配置/规格)**：系统**运行时查表**的字典（常量），负责数值平衡。
    *   **Gallery (图鉴)**：UI **展示用**数据（文本/图标），与核心逻辑解耦。
3.  **确定性与生命周期**：
    *   事件队列 (`world.events`) 本帧生产，帧末清空。
    *   实体销毁通过 `DestroyTag` 标记，帧末统一清理 (`CleanupSystem`)。
    *   渲染与逻辑分离：React 负责 UI (HUD)，Canvas/WebGL 负责游戏画面。

---

## 二、目录结构规范

```text
src/
├─ engine/
│   ├─ components/          # 所有组件类定义 (纯数据)
│   │   ├─ index.ts         # 统一导出
│   │   └─ ...
│   ├─ blueprints/          # [实体工厂数据] 决定实体"长什么样"
│   │   ├─ types.ts         # 自动推导的 Blueprint 类型
│   │   ├─ enemies.ts       # 敌人出生配置
│   │   └─ pickups.ts       # 掉落物出生配置
│   ├─ configs/             # [静态数值表] 决定系统"怎么运行"
│   │   ├─ weapons.ts       # 武器表 (CD, AmmoID)
│   │   ├─ ammo.ts          # 弹药表 (Speed, Damage, Shape)
│   │   ├─ effects.ts       # 效果表 (Explosion radius)
│   │   ├─ growth.ts        # 玩家成长数值表
│   │   └─ gallery.ts       # UI展示数据 (Name, Desc, Icon)
│   ├─ factory/             # [核心引擎] JSON -> Component 映射
│   │   └─ index.ts         # ArgMap 映射表 & spawn 函数
│   ├─ systems/             # [逻辑核心] 每帧执行的系统
│   │   ├─ ...
│   │   └─ loop.ts          # 系统执行顺序编排
│   ├─ world.ts             # World 状态定义 & 事件池
│   └─ events.ts            # 事件类型定义
├─ ui/                      # React UI 层
└─ main.ts                  # 入口
```

---

## 三、核心数据结构

### 1. World (全局状态)

修正点：`playerLevel` 不作为组件，而是作为 World 的全局字段，避免被 CleanupSystem 误删，也方便全局读取。

```typescript
export interface World {
  entities: Map<number, Component[]>; // 实体数据库
  nextId: number;                     // ID 自增计数器
  playerId: number;                   // 缓存玩家 ID
  
  // 全局状态
  state: 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';
  score: number;
  playerLevel: number;                // 玩家当前等级
  playerExp: number;
  
  // 事件系统
  events: GameEvent[];                // 本帧事件池 (帧末清空)
}
```

### 2. Component (组件)

组件必须是类，便于 `instanceof` 检查，但构造函数应保持简单。

```typescript
// components/index.ts
export abstract class Component {}

export class Transform extends Component {
  constructor(public x: number, public y: number, public rot: number = 0) { super(); }
}
export class Weapon extends Component {
  constructor(
    public id: string,           // 引用 configs/weapons.ts
    public cooldown: number,     // 当前总冷却 (受成长影响)
    public timer: number = 0,    // 冷却倒计时
    public slot: 'main' | 'sub', // 插槽位
    public level: number = 1     // 武器等级
  ) { super(); }
}
// ... 其他组件：Health, Velocity, Collider, Sprite, Lifetime, Buff ...
```

### 3. Blueprint (蓝图类型)

利用 TypeScript 映射类型，实现**组件变更后自动更新蓝图类型定义**。

```typescript
// blueprints/types.ts
import * as C from '@/engine/components';

// 移除 abstract class Component，获取所有具体组件类
type ComponentMap = typeof C;

export type Blueprint = {
  [K in keyof ComponentMap]?: ConstructorParameters<ComponentMap[K]>;
};
```

---

## 四、配置体系 (Blueprint vs Config)

**核心原则**：
*   **Blueprint**：描述**实例**（例如：地上的一个道具包）。
*   **Config**：描述**规则**（例如：激光枪的射速）。

### 1. 静态配置 (Configs)

```typescript
// configs/weapons.ts
export const WEAPON_SPECS: Record<string, WeaponSpec> = {
  'plasma_gun': {
    baseCooldown: 200,
    ammoType: 'plasma_blue',
    maxLevel: 10
  }
};

// configs/ammo.ts
export const AMMO_SPECS: Record<string, AmmoSpec> = {
  'plasma_blue': {
    speed: 800,
    damage: 50,
    hitboxRadius: 8,
    onHitEffects: ['small_explosion'] // 引用 effects 表
  }
};
```

### 2. 实体蓝图 (Blueprints)

```typescript
// blueprints/pickups.ts
import type { Blueprint } from './types';

export const DROP_PLASMA_GUN: Blueprint = {
  // 工厂根据 key 自动 new Transform(...args)
  Transform: [0, 0, 0], // 坐标通常由 spawn 函数动态覆盖
  Sprite:    ['pickup_icon', 0, 0, 32, 32],
  Collider:  ['circle', 16],
  // PickupItem 组件：类型为 weapon，ID 为 plasma_gun
  PickupItem: ['weapon', 'plasma_gun'], 
  Lifetime:  [30] // 30秒后消失
};
```

---

## 五、工厂系统 (Factory)

这是连接 JSON 蓝图与 Class 组件的唯一桥梁。**新增组件时，只需在此文件加一行映射。**

```typescript
// factory/index.ts
import * as C from '@/engine/components';
import { Blueprint } from '@/engine/blueprints/types';

// 参数映射表：将数组参数映射到构造函数
const ArgMap: Record<keyof typeof C, (args: any[]) => any[]> = {
  Transform: (a) => a, 
  Weapon:    (a) => a,
  Health:    (a) => a,
  Sprite:    (a) => a,
  // ... 新增组件在此添加
};

export function spawnEntity(world: World, blueprint: Blueprint, overrides?: Partial<Blueprint>) {
  const id = world.nextId++;
  const components: Component[] = [];
  
  // 合并 overrides (例如出生坐标)
  const finalConfig = { ...blueprint, ...overrides };

  for (const [key, args] of Object.entries(finalConfig)) {
    const ComponentClass = (C as any)[key];
    const mapFn = (ArgMap as any)[key];
    
    if (ComponentClass && mapFn) {
      // 实例化组件
      components.push(new ComponentClass(...mapFn(args)));
    }
  }
  
  world.entities.set(id, components);
  return id;
}
```

---

## 六、关键系统逻辑实现

### 1. 武器与弹药流程

**流程**：`Input` -> `WeaponSystem` (查表) -> `spawnBullet` -> `CollisionSystem` -> `EffectSystem`

```typescript
// systems/WeaponSystem.ts
export function WeaponSystem(world: World, dt: number) {
  // 1. 遍历持有武器的实体
  for (const [id, [weapon, trans, intent]] of query(world, [Weapon, Transform, FireIntent])) {
    // 冷却逻辑
    if (weapon.timer > 0) {
      weapon.timer -= dt;
      continue;
    }

    // 开火逻辑
    if (intent.firing) {
      const spec = WEAPON_SPECS[weapon.id]; // 1. 查 Weapon 表
      const ammoSpec = AMMO_SPECS[spec.ammoType]; // 2. 查 Ammo 表
      
      // 3. 生成子弹实体
      spawnBullet(world, {
        x: trans.x, 
        y: trans.y, 
        rot: trans.rot,
        speed: ammoSpec.speed,
        damage: ammoSpec.damage * (1 + 0.1 * weapon.level), // 简单的等级伤害公式
        radius: ammoSpec.hitboxRadius,
        effects: ammoSpec.onHitEffects
      });

      // 重置冷却 (应用玩家全局属性加成)
      weapon.timer = spec.baseCooldown; 
    }
  }
}
```

### 2. 道具拾取与 Buff 系统

**修正**：Buff 统一作为 `BuffComponent` 挂载在玩家实体上。

```typescript
// systems/PickupSystem.ts
export function PickupSystem(world: World) {
  const player = world.entities.get(world.playerId);
  if (!player) return;

  // 检测碰撞事件 (由 CollisionSystem 产生)
  for (const event of world.events) {
    if (event.type === 'COLLISION' && event.targetId === world.playerId) {
      const otherComp = world.entities.get(event.sourceId);
      const pickup = otherComp?.find(PickupItem.check);
      
      if (pickup) {
        handlePickup(world, player, pickup);
        // 销毁道具实体
        world.entities.get(event.sourceId)!.push(new DestroyTag());
      }
    }
  }
}

function handlePickup(world: World, player: Component[], pickup: PickupItem) {
  if (pickup.type === 'weapon') {
    // 逻辑：已有同名武器则升级，否则换装/装备
    // 修改 player 身上的 Weapon 组件
  } else if (pickup.type === 'buff') {
    // 查表获取 Buff 详情
    const buffSpec = EFFECT_SPECS[pickup.id]; 
    // 直接给玩家挂一个 Buff 组件
    player.push(new BuffComponent(pickup.id, buffSpec.duration, buffSpec.value));
  }
}
```

### 3. 协同系统 (Synergy)

基于事件驱动，解耦武器逻辑与特效逻辑。

*   **触发**：`WeaponSystem` 发射时或 `CollisionSystem` 命中时，若检测到副武器，抛出 `SYNERGY_EVENT`。
*   **响应**：`SynergySystem` 监听该事件。

```typescript
// systems/SynergySystem.ts
export function SynergySystem(world: World) {
  for (const ev of world.events) {
    if (ev.type === 'SYNERGY_TRIGGER') {
      const comboKey = `${ev.mainWeaponId}+${ev.subWeaponId}`;
      const synergy = SYNERGY_TABLE[comboKey];
      
      if (synergy) {
        // 执行协同效果：如发射特殊子弹、全屏AOE等
        executeSynergy(world, synergy, ev.position);
      }
    }
  }
}
```

---

## 七、系统执行顺序 (Loop)

ECS 的执行顺序至关重要。我将它们分为 7 个阶段，确保数据依赖关系正确（例如：先有输入，再有移动，再有碰撞，最后渲染）。

| 阶段 | 序号 | 系统名称 | 职责 (Inputs $\to$ Outputs) |
| :--- | :--- | :--- | :--- |
| **P1. 决策层**<br>(输入与AI) | 1 | **InputSystem** | 读键盘/手柄 $\to$ 写 `MoveIntent`, `FireIntent` (玩家) |
| | 2 | **DifficultySystem** | 读全局时间/击杀 $\to$ 改 `World.difficulty` (影响刷怪/掉率) |
| | 3 | **SpawnSystem** | 读 `World.time` $\to$ `new EnemyEntity` (刷怪) |
| | 4 | **BossPhaseSystem** | 读 `Health` $\to$ 改 `BossState.phase` (转阶段逻辑) |
| | 5 | **BossSystem** | 读 `BossState` $\to$ 写 `MoveIntent`, `FireIntent` (Boss行为) |
| | 6 | **EnemySystem**<br>*(含 EliteAI)* | 读 `EnemyTag` $\to$ 写 `MoveIntent`, `FireIntent` (敌人决策) |
| | 7 | **AISteerSystem** | 读 `MoveIntent` (寻路/避障算法) $\to$ 修正 `MoveIntent` |
| **P2. 状态层**<br>(数值更新) | 8 | **BuffSystem** | 读 `Buff` (计时/过期) $\to$ 改 `Speed`, `Weapon.cooldown` |
| | 9 | **WeaponSynergySystem** | 读 `Inventory` (武器组合) $\to$ 产生协同特效/Buff |
| | 10 | **WeaponSystem** | 读 `FireIntent` + `Weapon` $\to$ `new BulletEntity` (发射) |
| **P3. 物理层**<br>(位移) | 11 | **MovementSystem** | 读 `MoveIntent` + `Velocity` $\to$ 改 `Transform` (x,y) |
| **P4. 交互层**<br>(核心碰撞) | 12 | **CollisionSystem** | 读 `HitBox` + `Transform` $\to$ 推送 `HitEvent`, `PickupEvent` (不直接扣血) |
| **P5. 结算层**<br>(事件处理) | 13 | **PickupSystem** | 消费 `PickupEvent` $\to$ 加武器/Buff，销毁道具 |
| | 14 | **DamageResolutionSystem** | 消费 `HitEvent` $\to$ 扣 `Health`，闪避/无敌判断，推 `DeathEvent` |
| | 15 | **LootSystem** | 消费 `DeathEvent` (敌人死亡) $\to$ `new PickupEntity` (掉落) |
| | 16 | **ComboSystem** | 消费 `DeathEvent` $\to$ 加 `World.score`, 更新连击倍率 |
| **P6. 表现层**<br>(视听反馈) | 17 | **CameraSystem** | 读 Player `Transform` / 震屏事件 $\to$ 改 Camera View |
| | 18 | **EffectPlayer** | 消费所有事件 (Hit/Die/Shoot) $\to$ `new ParticleEntity` (视觉特效) |
| | 19 | **AudioSystem** | 消费所有事件 $\to$ 播放音效 (AudioContext) |
| | 20 | **RenderSystem** | 读 `Sprite`, `Transform`, `Particle` $\to$ Canvas/WebGL 绘制 |
| **P7. 清理层**<br>(生命周期) | 21 | **LifetimeSystem** | `Timer` -= dt $\to$ 给超时的实体打 `DestroyTag` |
| | 22 | **CleanupSystem** | 遍历 `DestroyTag` $\to$ 真正的 `delete entity`，清空本帧 `Events` |


关键逻辑检查点

1.  **AI 的分层**：
    *   先执行 `EnemySystem` (决定**想**去哪)，再执行 `AISteerSystem` (决定**怎么**去，比如避开障碍物)，最后执行 `MovementSystem` (实际修改坐标)。这个顺序 (6 $\to$ 7 $\to$ 11) 不能乱。

2.  **事件流的闭环**：
    *   `CollisionSystem` (12) 产生事件。
    *   `Damage` (14) 和 `Pickup` (13) 消费事件并产生新的状态变化（如死亡）。
    *   `Loot` (15) 和 `Combo` (16) 响应死亡。
    *   **CleanupSystem (22) 必须是最后**，它负责清空本帧的 Event Queue。如果放在 Render 之前，可能导致一帧内的特效画不出来或者音效播不出来。

3.  **渲染与特效**：
    *   `EffectPlayer` (18) 必须在 `DamageResolution` (14) 之后，因为它需要知道实体是真的被打中了，还是被闪避了（闪避可能播不同的特效）。
    *   `RenderSystem` (20) 必须在 `CameraSystem` (17) 之后，确保摄像机位置是最新的。


1.  **删除** `EliteAISystem`，将其逻辑合并入 `EnemySystem`。


---

## 八、开发与扩展 SOP (标准作业程序)

### 场景 1：新增一把“散弹枪”
1.  **configs/weapons.ts**: 添加 `shotgun: { cooldown: 800, ammoType: 'pellet' }`。
2.  **configs/ammo.ts**: 添加 `pellet: { speed: 600, onHit: ['knockback'] }`。
3.  **configs/gallery.ts**: 添加 UI 描述（名字、图标）。
4.  *(可选)* **blueprints/pickups.ts**: 添加 `DROP_SHOTGUN` 蓝图用于掉落。
5.  **无需修改代码逻辑**。

### 场景 2：新增一种“护盾” Buff
1.  **configs/effects.ts**: 添加 `shield_buff: { type: 'shield', duration: 10, value: 50 }`。
2.  **systems/BuffSystem.ts**: 在 `switch(buff.type)` 中添加 `case 'shield'` 的逻辑（例如每帧增加临时 HP 或无敌）。
3.  **blueprints/pickups.ts**: 添加 `DROP_SHIELD_BUFF` 蓝图。

### 场景 3：新增一个组件（例如 `Stealth` 隐身）
1.  **components/index.ts**: 定义 `class Stealth extends Component { ... }`。
2.  **factory/index.ts**: 在 `ArgMap` 中添加 `Stealth: (args) => args`。
3.  **blueprints/**: 现在任何蓝图都可以使用 `Stealth: { duration: 5 }` 字段了（TypeScript 自动提示）。
4.  **systems/**: 编写 `StealthSystem` 或在 `RenderSystem` 中处理透明度。

### 场景 4：新增敌人
1.  在 `blueprints/enemies.ts` 定义 `BLUEPRINT_ENEMY_NEW` (JSON)。
2.  在 `SpawnSystem` 中配置生成时机。

### 场景 5：新增武器
    1.  在 `configs/weapons.ts` 定义 WeaponSpec。
    2.  在 `configs/ammo.ts` 定义 AmmoSpec。
    3.  在 `configs/audio/library.ts` 定义开火音效。

### 场景 6：新增游戏机制 (如: 黑洞)
    1.  新建组件 `BlackHoleComponent`。
    2.  新建系统 `BlackHoleSystem` 处理吸力逻辑。
    3.  在 `systems/loop.ts` 中将其插入到 **P3. 物理层** 之前。


---


## 九、 关键检查清单 (Checklist)

*   [ ] **组件纯度**: 检查所有 Component 类，确保里面**没有** `update()` 方法。
*   [ ] **事件闭环**: 确保 `CleanupSystem` 放在 `RenderSystem` 之后，`AudioSystem` 之前没有被清空。
*   [ ] **音频延迟**: 检查 `AudioEngine` 的时间调度是否基于 `startTime` (考虑 delay) 而非当前 `t`。
*   [ ] **垃圾回收**: 确保 `DestroyTag` 标记的实体在同一帧内被物理移除，防止野指针。
*   [ ] **React 性能**: 确保 UI 层只订阅 `World` 的低频快照 (Score, HP)，不订阅每帧变化的 Transform。