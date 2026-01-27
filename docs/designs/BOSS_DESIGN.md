在 ECS 架构中，我们需要将原本“一坨”的大配置拆解为 **表现（Gallery）**、**初始状态（Blueprint）** 和 **行为逻辑（Config/Spec）**。

针对你的三个具体需求：
1.  **击杀得分**：属于实体的**数值属性**，应该变成一个组件（`ScoreValue`），配置在 **Blueprint** 中。
2.  **武器**：属于**功能组件**，初始武器配置在 **Blueprint** (`Weapon` 组件)，但武器的具体参数（射速、弹道）配置在 **Configs** (`weapons.ts`)。
3.  **移动模式**：属于**AI行为逻辑**，配置在 **Configs** (`bossData.ts`) 中，由 `BossSystem` 运行时根据 Boss 的 ID 和当前阶段去查表。

---

### 一、 分配方案总览

| 属性 | 原位置 | **新 ECS 位置** | 形式 |
| :--- | :--- | :--- | :--- |
| **击杀得分** | `score: 5000` | **Blueprints** | `ScoreValue: { value: 5000 }` (新增组件) |
| **初始武器** | `weapons: [...]` | **Blueprints** | `Weapon: { id: 'boss_guardian_gun', ... }` |
| **移动模式** | `movement: { pattern... }` | **Configs** (`bossData.ts`) | 静态常量表，由 System 查表执行 |
| **UI信息** | `name`, `desc` | **Configs** (`gallery/bosses.ts`) | 纯文本配置 |

---

### 二、 具体代码实现

#### 1. 新增组件：ScoreValue (src/engine/components/meta.ts)

首先，我们需要一个组件来存储“这个东西值多少分”。

```typescript
// src/engine/components/meta.ts

/** 分数值组件 - 击杀该实体可获得的分数 */
export class ScoreValue extends Component {
    constructor(cfg: { value: number }) {
        super();
        this.value = cfg.value;
    }
    public value: number;
    static check(c: any): c is ScoreValue { return c instanceof ScoreValue; }
}
```
好的，我们继续完成 Boss 数据的拆解和配置。

我们将 Boss 的**行为逻辑（移动模式、阶段切换）**与**实体数据（蓝图）**分离。

---

### 续：二、 具体代码实现

#### 2. 定义行为配置 (src/engine/configs/bossData.ts)

这里配置 Boss 的“大脑”。我们定义它在不同血量阶段（Phase）该怎么动、用什么武器。

```typescript
// src/engine/configs/bossData.ts

export enum BossMovePattern {
    SINE = 'sine',       // 正弦游弋 (旧配置中的 pattern)
    FOLLOW = 'follow',   // 追踪玩家
    IDLE = 'idle',       // 定点站桩
    DASH = 'dash',       // 冲刺
}

/** 定义 Boss 每个阶段的行为 */
export interface BossPhaseSpec {
    /** 触发该阶段的血量阈值 (0-1), 例如 0.5 表示 50% 血量进入此阶段 */
    threshold: number;      
    /** 该阶段的移动模式 */
    movePattern: BossMovePattern; 
    /** 该阶段使用的武器 ID (引用 weapons.ts) */
    weaponId: string;       
    /** 移动参数 (例如正弦波的振幅/频率) */
    moveParams?: { xSpeed?: number; ySpeed?: number; frequency?: number };
}

export interface BossSpec {
    id: string;
    phases: BossPhaseSpec[];
}

// 静态配置表：Boss 的行为逻辑
export const BOSS_DATA: Record<string, BossSpec> = {
    'boss_guardian': {
        id: 'boss_guardian',
        phases: [
            // 第一阶段：满血，正弦游动，用普通放射炮
            {
                threshold: 1.0,
                movePattern: BossMovePattern.SINE,
                weaponId: 'boss_guardian_radial', // 对应 weapons.ts
                moveParams: { xSpeed: 1.5, frequency: 2 } // 对应旧配置 speed: 1.5
            },
            // 第二阶段：50%血，狂暴，追踪玩家，射速变快
            {
                threshold: 0.5,
                movePattern: BossMovePattern.FOLLOW,
                weaponId: 'boss_guardian_radial_enraged',
                moveParams: { xSpeed: 3.0 }
            }
        ]
    }
};
```

#### 3. 定义武器配置 (src/engine/configs/weapons.ts & ammo.ts)

Boss 的武器参数（子弹数量、射速、速度）配置在这里。

**src/engine/configs/ammo.ts** (定义子弹长什么样、飞多快)
```typescript
import { AmmoSpec } from './types';

export const AMMO_SPECS: Record<string, AmmoSpec> = {
    // 对应旧配置 bulletSpeed: 4.0
    'guardian_orb': {
        speed: 240, // 假设 4.0 是每帧像素，60fps下约等于 240px/s，按实际手感调整
        damage: 10,
        hitboxRadius: 8,
        visuals: { texture: 'bullet_orb_blue' } // 对应 color: #4488ff
    }
};
```

**src/engine/configs/weapons.ts** (定义怎么发射：射速、弹道)
```typescript
import { WeaponSpec } from './types';

export const WEAPON_SPECS: Record<string, WeaponSpec> = {
    // 对应旧配置 weaponConfigs
    'boss_guardian_radial': {
        baseCooldown: 1000, // 旧配置 fireRate: 0.07 看起来像是一个非常快的值(秒?)或者频率。假设是1秒一波
        ammoType: 'guardian_orb',
        bulletCount: 6,     // 旧配置 bulletCount: 6
        spread: 360,        // 全向弹幕
        aiPattern: 'radial' // AI 开火模式
    },
    // 狂暴版武器
    'boss_guardian_radial_enraged': {
        baseCooldown: 600,  // 射得更快
        ammoType: 'guardian_orb',
        bulletCount: 12,    // 弹幕更密
        spread: 360,
        aiPattern: 'radial'
    }
};
```

#### 4. 组装蓝图 (src/engine/blueprints/bosses.ts)

最后，将所有组件拼装成实体的**出生快照**。这里配置 **Score (击杀分)** 和 **初始武器**。

```typescript
// src/engine/blueprints/bosses.ts
import { Blueprint } from './types';
import { ASSETS } from '@/configs/assets'; // 假设你有资源表

export const BLUEPRINT_BOSS_GUARDIAN: Blueprint = {
    // 1. 基础属性
    Transform: { x: 400, y: -200, rot: 180 }, // 出生在屏幕上方
    Sprite: { 
        texture: 'boss_guardian', // 对应 ASSETS
        srcW: 128, srcH: 128,
        scale: 1.5 // 视觉大小
    },
    
    // 2. 战斗属性
    Health: { hp: 50000, max: 50000 },
    HitBox: { shape: 'circle', radius: 60 }, // 对应旧配置 hitboxScale: 0.7 换算后的像素值
    
    // 3. 【新增】击杀得分 (原配置 score: 5000)
    ScoreValue: { value: 5000 },

    // 4. 【新增】武器组件 (初始武器)
    Weapon: { 
        id: 'boss_guardian_radial', // 引用 configs/weapons.ts
        ammoType: 'guardian_orb',   // 冗余引用，方便快速查找
        cooldown: 1000,
        slot: 'main'
    },

    // 5. AI 组件 (关联 bossData.ts)
    BossTag: {}, // 标记它是 Boss
    BossAI: { 
        phase: 0, // 初始阶段索引
        nextPatternTime: 0 
    }
};
```

---

### 三、 总结：属性去哪儿了？

通过这种拆解，我们将原本混杂的 JSON 变成了结构化的系统数据：

| 原属性 | 存放位置 | 对应的 ECS 代码 |
| :--- | :--- | :--- |
| `score: 5000` | **Blueprint** | `ScoreValue: { value: 5000 }` (组件) |
| `weapons: [...]` | **Config** | `weapons.ts`: 定义武器参数 (CD, count) |
| `bulletSpeed: 4.0` | **Config** | `ammo.ts`: 定义子弹参数 (`speed: 240`) |
| `movement.pattern` | **Config** | `bossData.ts`: 定义行为逻辑 (`movePattern: SINE`) |
| `name / describe` | **Config** | `gallery/bosses.ts`: 纯 UI 展示文本 |

### 四、 如何使用这些配置？

1.  **移动 (BossSystem)**：
    ```typescript
    // BossSystem.ts
    const bossSpec = BOSS_DATA['boss_guardian']; // 根据 ID 查表
    const phaseSpec = bossSpec.phases[ai.phase];
    
    if (phaseSpec.movePattern === BossMovePattern.SINE) {
       // 执行正弦波移动逻辑...
    }
    ```

2.  **得分 (DamageResolutionSystem)**：
    ```typescript
    // DamageResolutionSystem.ts
    if (health.hp <= 0) {
        // 查找 ScoreValue 组件
        const score = entity.find(ScoreValue);
        if (score) {
             world.score += score.value; // 加分
        }
        // ... 死亡逻辑
    }
    ```