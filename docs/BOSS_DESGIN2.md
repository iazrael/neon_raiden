好的，根据之前的 ECS 设计原则以及你提供的 `BossPhaseSystem.ts` 中的三阶段/四阶段逻辑，我们需要将这些硬编码的逻辑迁移到 `bossData.ts`（行为/阶段）和 `weapons.ts`（武器）中，并在 `bosses.ts` 蓝图中引用。

我们将重点处理三个特殊的 Boss：`DESTROYER`（毁灭者）、`TITAN`（泰坦）、`APOCALYPSE`（天启），并为其他 Boss 提供基础的多阶段配置。

### 1. BossData 配置 (src/engine/configs/bossData.ts)

这里定义 Boss 的“大脑”：**血量阶段 -> 移动模式 + 武器 ID**。

```typescript
// src/engine/configs/bossData.ts

import { BossType, BossWeaponType } from '@/types';

export enum BossMovePattern {
    // 基础移动
    IDLE = 'idle',             // 站桩
    SINE = 'sine',             // 正弦游动
    FIGURE_8 = 'figure_8',     // 8字形
    CIRCLE = 'circle',         // 绕圈
    ZIGZAG = 'zigzag',         // 之字形
    
    // 高级移动 (阶段专用)
    FOLLOW = 'follow',         // 缓慢追踪
    DASH = 'dash',             // 冲刺
    TELEPORT = 'teleport',     // 瞬移
    ADAPTIVE = 'adaptive',     // 混合自适应
}

/** Boss 阶段定义 */
export interface BossPhaseSpec {
    /** 触发该阶段的血量阈值 (0-1), 1.0=100% */
    threshold: number;
    /** 该阶段的移动模式 */
    movePattern: BossMovePattern;
    /** 该阶段使用的武器 ID (引用 weapons.ts) */
    weaponId: string;
    /** 阶段属性修正 (相对于基础值的倍率) */
    modifiers: {
        moveSpeed?: number;
        fireRate?: number;     // 射击频率倍率 (越小越快?) -> 不，通常是 cooldown = base / rate，这里约定 rate 是频率倍率
        damage?: number;
    };
    /** 阶段视觉提示颜色 */
    phaseColor?: string;
    /** 是否包含特殊技能 (ECS 中通常由 System 检测 Phase 触发) */
    specialEvents?: string[]; // e.g., ['spawn_minions', 'laser_sweep']
}

export interface BossSpec {
    id: string;
    phases: BossPhaseSpec[];
}

export const BOSS_DATA: Record<string, BossSpec> = {
    // ==========================================
    // Lv1: GUARDIAN (赛博守护者) - 2阶段
    // ==========================================
    'boss_guardian': {
        id: 'boss_guardian',
        phases: [
            { // P1: 100% - 50%
                threshold: 1.0,
                movePattern: BossMovePattern.SINE,
                weaponId: 'boss_guardian_radial',
                modifiers: { moveSpeed: 1.0, fireRate: 1.0 }
            },
            { // P2: 50% - 0% (狂暴)
                threshold: 0.5,
                movePattern: BossMovePattern.FOLLOW, // 开始追踪
                weaponId: 'boss_guardian_radial_enraged', // 弹幕更密
                modifiers: { moveSpeed: 1.5, fireRate: 1.5 },
                phaseColor: '#ffaa00'
            }
        ]
    },

    // ==========================================
    // Lv3: DESTROYER (毁灭者) - 3阶段
    // P1: 侧翼掩护; P2: 冲刺; P3: 核心狂暴
    // ==========================================
    'boss_destroyer': {
        id: 'boss_destroyer',
        phases: [
            { // P1: 100% - 70%
                threshold: 1.0,
                movePattern: BossMovePattern.FIGURE_8,
                weaponId: 'boss_destroyer_main',
                modifiers: { moveSpeed: 1.0 },
                specialEvents: ['wingman_support']
            },
            { // P2: 70% - 40% (冲刺)
                threshold: 0.7,
                movePattern: BossMovePattern.DASH,
                weaponId: 'boss_destroyer_dash',
                modifiers: { moveSpeed: 1.5, fireRate: 1.2 },
                phaseColor: '#ffd700'
            },
            { // P3: 40% - 0% (螺旋狂暴)
                threshold: 0.4,
                movePattern: BossMovePattern.FOLLOW,
                weaponId: 'boss_destroyer_berserk', // 螺旋弹幕 + 激光
                modifiers: { moveSpeed: 2.0, fireRate: 1.5 },
                phaseColor: '#ff4500'
            }
        ]
    },

    // ==========================================
    // Lv7: TITAN (泰坦要塞) - 3阶段
    // P1: 防御; P2: 能量过载; P3: 最终防线
    // ==========================================
    'boss_titan': {
        id: 'boss_titan',
        phases: [
            { // P1: 100% - 65%
                threshold: 1.0,
                movePattern: BossMovePattern.IDLE, // 缓慢降临/站桩
                weaponId: 'boss_titan_laser_base',
                modifiers: { moveSpeed: 0.5 }
            },
            { // P2: 65% - 30%
                threshold: 0.65,
                movePattern: BossMovePattern.SINE, // 开始缓慢移动
                weaponId: 'boss_titan_laser_rapid',
                modifiers: { moveSpeed: 0.8, fireRate: 1.5 },
                phaseColor: '#ffd700'
            },
            { // P3: 30% - 0% (全弹幕)
                threshold: 0.3,
                movePattern: BossMovePattern.FOLLOW,
                weaponId: 'boss_titan_omni',
                modifiers: { moveSpeed: 1.0, fireRate: 2.0 },
                phaseColor: '#ff4500'
            }
        ]
    },

    // ==========================================
    // Lv10: APOCALYPSE (天启审判) - 4阶段
    // ==========================================
    'boss_apocalypse': {
        id: 'boss_apocalypse',
        phases: [
            { // P1: 100% - 75% (全武器展示)
                threshold: 1.0,
                movePattern: BossMovePattern.ADAPTIVE,
                weaponId: 'boss_apocalypse_mixed',
                modifiers: { moveSpeed: 1.0 }
            },
            { // P2: 75% - 50% (装甲模式)
                threshold: 0.75,
                movePattern: BossMovePattern.IDLE,
                weaponId: 'boss_apocalypse_defense',
                modifiers: { moveSpeed: 0.8, damage: 0.5 }, // 减伤逻辑需在DamageResolutionSystem实现
                phaseColor: '#ffff00'
            },
            { // P3: 50% - 25% (狂暴模式)
                threshold: 0.5,
                movePattern: BossMovePattern.TELEPORT,
                weaponId: 'boss_apocalypse_berserk',
                modifiers: { moveSpeed: 1.5, fireRate: 1.6 },
                phaseColor: '#ff4500'
            },
            { // P4: 25% - 0% (绝境反击)
                threshold: 0.25,
                movePattern: BossMovePattern.DASH,
                weaponId: 'boss_apocalypse_final',
                modifiers: { moveSpeed: 2.0, fireRate: 2.0 },
                phaseColor: '#8b0000',
                specialEvents: ['screen_clear', 'last_stand']
            }
        ]
    },

    // ... 其他 Boss 可以配置为简单的单阶段或两阶段
    'boss_interceptor': {
        id: 'boss_interceptor',
        phases: [{ threshold: 1.0, movePattern: BossMovePattern.ZIGZAG, weaponId: 'boss_weapon_targeted', modifiers: {} }]
    },
    'boss_annihilator': {
        id: 'boss_annihilator',
        phases: [{ threshold: 1.0, movePattern: BossMovePattern.TELEPORT, weaponId: 'boss_weapon_targeted', modifiers: {} }]
    },
    'boss_dominator': {
        id: 'boss_dominator',
        phases: [{ threshold: 1.0, movePattern: BossMovePattern.CIRCLE, weaponId: 'boss_weapon_radial', modifiers: {} }]
    },
    'boss_overlord': {
        id: 'boss_overlord',
        phases: [{ threshold: 1.0, movePattern: BossMovePattern.FOLLOW, weaponId: 'boss_weapon_laser', modifiers: {} }]
    },
    'boss_colossus': {
        id: 'boss_colossus',
        phases: [{ threshold: 1.0, movePattern: BossMovePattern.DASH, weaponId: 'boss_weapon_spread', modifiers: {} }]
    },
    'boss_leviathan': {
        id: 'boss_leviathan',
        phases: [{ threshold: 1.0, movePattern: BossMovePattern.FIGURE_8, weaponId: 'boss_weapon_homing', modifiers: {} }]
    },
};
```

### 2. 武器配置 (src/engine/configs/weapons.ts)

Boss 的武器通常比较夸张（多弹头、360度、激光）。我们需要把 `BossPhaseSystem` 里提到的“技能”转化为具体的武器配置。

```typescript
// src/engine/configs/weapons.ts
import { WeaponSpec } from './types';

export const BOSS_WEAPONS: Record<string, WeaponSpec> = {
    // === Guardian ===
    'boss_guardian_radial': {
        baseCooldown: 1000,
        ammoType: 'orb_blue',
        bulletCount: 6,
        spread: 360,
        pattern: 'radial'
    },
    'boss_guardian_radial_enraged': {
        baseCooldown: 600,
        ammoType: 'orb_red',
        bulletCount: 12,
        spread: 360,
        pattern: 'radial'
    },

    // === Destroyer ===
    'boss_destroyer_main': {
        baseCooldown: 800,
        ammoType: 'missile_heavy',
        bulletCount: 4,
        spread: 60,
        pattern: 'spread'
    },
    'boss_destroyer_dash': {
        baseCooldown: 400, // 冲刺时射速快
        ammoType: 'orb_yellow',
        bulletCount: 3,
        spread: 120,
        pattern: 'spread'
    },
    'boss_destroyer_berserk': {
        baseCooldown: 200, // 极快
        ammoType: 'orb_red',
        bulletCount: 2, // 螺旋
        spread: 360,
        pattern: 'spiral' // 螺旋发射
    },

    // === Titan ===
    'boss_titan_laser_base': {
        baseCooldown: 2000,
        ammoType: 'laser_beam_thick',
        bulletCount: 1,
        pattern: 'aimed'
    },
    'boss_titan_laser_rapid': {
        baseCooldown: 1000,
        ammoType: 'laser_beam',
        bulletCount: 3,
        spread: 30,
        pattern: 'aimed'
    },
    'boss_titan_omni': {
        baseCooldown: 800,
        ammoType: 'orb_green',
        bulletCount: 36,
        spread: 360,
        pattern: 'radial'
    },

    // === Apocalypse (终极缝合怪) ===
    'boss_apocalypse_mixed': {
        baseCooldown: 1000,
        ammoType: 'orb_purple',
        bulletCount: 8,
        spread: 360,
        pattern: 'radial_mix' // 混合弹幕
    },
    'boss_apocalypse_defense': {
        baseCooldown: 1500,
        ammoType: 'homing_missile',
        bulletCount: 4,
        pattern: 'aimed'
    },
    'boss_apocalypse_berserk': {
        baseCooldown: 300,
        ammoType: 'laser_beam_red',
        bulletCount: 1,
        pattern: 'random' // 随机点名
    },
    'boss_apocalypse_final': {
        baseCooldown: 100, // 弹幕地狱
        ammoType: 'orb_void',
        bulletCount: 16,
        spread: 360,
        pattern: 'spiral'
    },
    
    // ... 其他 Boss 基础武器
    'boss_weapon_targeted': { baseCooldown: 1000, ammoType: 'orb_red', bulletCount: 1, pattern: 'aimed' },
    'boss_weapon_radial': { baseCooldown: 1200, ammoType: 'orb_blue', bulletCount: 8, spread: 360, pattern: 'radial' },
    'boss_weapon_laser': { baseCooldown: 2500, ammoType: 'laser_beam', bulletCount: 1, pattern: 'aimed' },
    'boss_weapon_spread': { baseCooldown: 1000, ammoType: 'orb_green', bulletCount: 5, spread: 90, pattern: 'spread' },
    'boss_weapon_homing': { baseCooldown: 1500, ammoType: 'homing_missile', bulletCount: 2, pattern: 'aimed' },
};
```

### 3. Boss 蓝图 (src/engine/blueprints/bosses.ts)

蓝图只负责**初始状态**。`BossAI` 组件的 `phase` 初始为 0，具体的行为将由 `BossSystem` 读取 `BOSS_DATA` 来驱动。

```typescript
// src/engine/blueprints/bosses.ts
import { ASSETS } from '@/configs';
import { DROPTABLE_BOSS } from '@/engine/configs/droptables/common';
import { BossId } from '@/types';
import { Blueprint } from './types';
import { BOSS_DATA } from '@/engine/configs/bossData';

// 辅助函数：快速生成 Boss 蓝图
function createBossBlueprint(
    bossKey: string,
    sprite: string,
    hp: number,
    radius: number,
    score: number
): Blueprint {
    // 自动查找该 Boss 的初始武器 (P1 阶段)
    const bossSpec = BOSS_DATA[bossKey];
    const initialWeaponId = bossSpec?.phases[0]?.weaponId || 'boss_weapon_radial';

    return {
        Transform: { x: 400, y: -200, rot: 180 },
        Health: { hp, max: hp },
        Sprite: { texture: sprite, srcX: 0, srcY: 0, srcW: radius * 2, srcH: radius * 2, scale: 1 },
        BossTag: {}, // 标记为 Boss
        BossAI: { phase: 0, nextPatternTime: 0 }, // 初始阶段 0
        Weapon: { id: initialWeaponId, ammoType: 'orb_red', cooldown: 1000, slot: 'main' },
        HitBox: { shape: 'circle', radius: radius * 0.7 },
        ScoreValue: { value: score },
        DropTable: { table: DROPTABLE_BOSS }
    };
}

export const BLUEPRINT_BOSS_GUARDIAN = createBossBlueprint('boss_guardian', ASSETS.BOSSES.guardian, 2000, 90, 5000);
export const BLUEPRINT_BOSS_INTERCEPTOR = createBossBlueprint('boss_interceptor', ASSETS.BOSSES.interceptor, 3200, 100, 10000);
export const BLUEPRINT_BOSS_DESTROYER = createBossBlueprint('boss_destroyer', ASSETS.BOSSES.destroyer, 5800, 110, 15000);
export const BLUEPRINT_BOSS_ANNIHILATOR = createBossBlueprint('boss_annihilator', ASSETS.BOSSES.annihilator, 7000, 120, 20000);
export const BLUEPRINT_BOSS_DOMINATOR = createBossBlueprint('boss_dominator', ASSETS.BOSSES.dominator, 8200, 130, 25000);
export const BLUEPRINT_BOSS_OVERLORD = createBossBlueprint('boss_overlord', ASSETS.BOSSES.overlord, 10600, 140, 30000);
export const BLUEPRINT_BOSS_TITAN = createBossBlueprint('boss_titan', ASSETS.BOSSES.titan, 16000, 150, 35000);
export const BLUEPRINT_BOSS_COLOSSUS = createBossBlueprint('boss_colossus', ASSETS.BOSSES.colossus, 17200, 160, 40000);
export const BLUEPRINT_BOSS_LEVIATHAN = createBossBlueprint('boss_leviathan', ASSETS.BOSSES.leviathan, 18400, 170, 45000);
export const BLUEPRINT_BOSS_APOCALYPSE = createBossBlueprint('boss_apocalypse', ASSETS.BOSSES.apocalypse, 20000, 180, 50000);

export const BOSSES_TABLE: Record<BossId, Blueprint> = {
    [BossId.GUARDIAN]: BLUEPRINT_BOSS_GUARDIAN,
    [BossId.INTERCEPTOR]: BLUEPRINT_BOSS_INTERCEPTOR,
    [BossId.DESTROYER]: BLUEPRINT_BOSS_DESTROYER,
    [BossId.ANNIHILATOR]: BLUEPRINT_BOSS_ANNIHILATOR,
    [BossId.DOMINATOR]: BLUEPRINT_BOSS_DOMINATOR,
    [BossId.OVERLORD]: BLUEPRINT_BOSS_OVERLORD,
    [BossId.TITAN]: BLUEPRINT_BOSS_TITAN,
    [BossId.COLOSSUS]: BLUEPRINT_BOSS_COLOSSUS,
    [BossId.LEVIATHAN]: BLUEPRINT_BOSS_LEVIATHAN,
    [BossId.APOCALYPSE]: BLUEPRINT_BOSS_APOCALYPSE,
};
```

### 总结

现在，`BossPhaseSystem.ts` 里的那些硬编码逻辑（`DESTROYER_PHASES` 等数组）已经全部迁移到了数据文件 `bossData.ts` 中。

**未来的 `BossSystem` 逻辑将变得非常通用：**
1.  读取 `BossAI.phase`。
2.  根据 Boss ID 在 `BOSS_DATA` 查到对应的 `phases` 数组。
3.  检查血量，如果低于下一阶段阈值，`phase++`。
4.  应用当前阶段的配置：
    *   改变 `MoveIntent` 的算法（SINE / DASH ...）。
    *   修改 `Weapon` 组件的 `id`（切换武器）。
    *   修改 `SpeedStat` 或 `Weapon.cooldown`（应用 `modifiers`）。
    *   触发 `specialEvents`（播放音效、特效、无敌帧等）。

这样，你以后想调整 Boss 难度或新增 Boss，只需要改 `bossData.ts` 这个 JSON 结构，完全不需要动代码。

根据之前的讨论和 `bossData.ts` 的设计，我们需要更新 `types.ts` 中的 `BossMovementPattern` 枚举，并为那些还没实现的模式（特别是 **ZIGZAG**, **TELEPORT**, **ADAPTIVE**）提供实现逻辑。

### 1. 更新 `types.ts`

首先，我们需要对 `types.ts` 进行更新，以确保所有的 Boss 移动模式和武器类型都与新的设计文档（P2/P3 阶段）保持一致。

```typescript
// src/engine/types/types.ts (部分更新)

// ... (保持 FighterType, WeaponType, BulletType, EnemyType 不变)

/**
 * Boss类型（重命名自BossName）
 */
export enum BossType {
    GUARDIAN = 'guardian',           // 第1关 - 守护者
    INTERCEPTOR = 'interceptor',     // 第2关 - 拦截者
    DESTROYER = 'destroyer',         // 第3关 - 毁灭者
    ANNIHILATOR = 'annihilator',     // 第4关 - 歼灭者
    DOMINATOR = 'dominator',         // 第5关 - 主宰者
    OVERLORD = 'overlord',           // 第6关 - 霸主
    TITAN = 'titan',                 // 第7关 - 泰坦
    COLOSSUS = 'colossus',           // 第8关 - 巨像
    LEVIATHAN = 'leviathan',         // 第9关 - 利维坦
    APOCALYPSE = 'apocalypse'        // 第10关 - 天启
}

/**
 * Boss 的移动模式
 */
export enum BossMovementPattern {
    // 基础模式
    IDLE = 'idle',                  // 站桩/空闲
    SINE = 'sine',                  // 正弦游动 (Guardian P1)
    FIGURE_8 = 'figure_8',          // 8字形 (Destroyer P1)
    CIRCLE = 'circle',              // 绕圈 (Dominator)
    ZIGZAG = 'zigzag',              // 之字形/折线 (Interceptor)
    SLOW_DESCENT = 'slow_descent',  // 缓慢下沉 (Titan P1)

    // 高级模式
    FOLLOW = 'follow',              // 缓慢追踪玩家 (Guardian P2)
    TRACKING = 'tracking',          // 紧密追踪 (Overlord)
    DASH = 'dash',                  // 冲刺 (Destroyer P2, Colossus)
    RANDOM_TELEPORT = 'random_teleport', // 随机瞬移 (Annihilator)
    ADAPTIVE = 'adaptive',          // 自适应/混合 (Apocalypse)
    AGGRESSIVE = 'aggressive'       // 激进压制 (Leviathan, Colossus)
}

// ... (其余类型保持不变)
```

---

### 2. 实现移动逻辑 (src/engine/systems/BossSystem.ts)

这是核心部分。我们需要在 `BossSystem` 中实现这些新的移动模式。

由于 Boss 的移动逻辑通常与 `BossAI` 组件状态紧密相关（比如 Dash 需要预警、冲刺、冷却三个阶段），我们将逻辑封装在 System 内部。

```typescript
// src/engine/systems/BossSystem.ts

import { World, Entity } from '@/engine/types';
import { 
    BossAI, 
    Transform, 
    Velocity, 
    MoveIntent, 
    BossTag,
    PlayerTag 
} from '@/engine/components';
import { view } from '@/engine/world';
import { BossMovementPattern } from '@/engine/types';
import { BOSS_DATA } from '@/engine/configs/bossData';

// 辅助：获取屏幕尺寸 (假设)
const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 600;
const BOSS_MARGIN_X = 100;
const BOSS_MARGIN_Y = 150;

export function BossSystem(world: World, dt: number) {
    // 1. 获取玩家位置 (用于追踪逻辑)
    let playerX = STAGE_WIDTH / 2;
    let playerY = STAGE_HEIGHT - 100;
    for (const [_, [tr]] of view(world, [PlayerTag, Transform])) {
        playerX = tr.x;
        playerY = tr.y;
        break;
    }

    // 2. 遍历所有 Boss
    for (const [id, [bossAi, tr, moveIntent]] of view(world, [BossAI, Transform, MoveIntent])) {
        // 获取配置
        const bossEntity = world.entities.get(id)!;
        // 注意：这里我们假设 BossSystem 已经与 BossPhaseSystem 协同工作
        // BossPhaseSystem 更新了 ai.phase，我们这里只负责读取当前 phase 的配置并执行移动
        
        // 为了简化，这里我们重新去查一遍 Config，实际项目中可以缓存到 Component 上
        const bossType = (bossEntity.find(c => c instanceof BossTag) as any)?.subType || 'boss_guardian'; // 这一步需要你确保 BossTag 或者 Entity 上有 ID
        // 这里假设 BossTag 上没存 ID，而是通过 Entity 的某个属性或者 Component 查找
        // 临时方案：直接用硬编码的逻辑演示 pattern 实现
        
        // 实际上，BossPhaseSystem 应该把当前的 pattern 写进 BossAI 组件或者 MoveIntent 组件的一个扩展字段里
        // 这里我们假设 BossAI 组件里存了当前的 movePattern
        // const pattern = bossAi.currentMovePattern; 
        
        // 临时模拟：从 BOSS_DATA 获取当前 Phase 的 pattern
        const bossSpec = BOSS_DATA[bossType]; 
        const phaseSpec = bossSpec?.phases[bossAi.phase - 1]; // phase 从 1 开始
        const pattern = phaseSpec?.movePattern || BossMovementPattern.IDLE;
        const speedMod = phaseSpec?.modifiers?.moveSpeed || 1.0;
        
        // 基础速度 (假设 100 px/s)
        const baseSpeed = 100 * speedMod;

        // 执行移动逻辑
        switch (pattern) {
            case BossMovementPattern.IDLE:
                moveIntent.dx = 0;
                moveIntent.dy = 0;
                break;

            case BossMovementPattern.SINE:
                // 正弦游动: X 轴来回，Y 轴微动
                // 使用 world.time 作为时间轴
                moveIntent.dx = Math.sin(world.time * 2); 
                moveIntent.dy = Math.cos(world.time) * 0.2; 
                break;

            case BossMovementPattern.FIGURE_8:
                // 8字形: X = sin(t), Y = sin(2t)
                moveIntent.dx = Math.cos(world.time);
                moveIntent.dy = Math.sin(world.time * 2) * 0.5;
                break;
                
            case BossMovementPattern.CIRCLE:
                // 绕圈: 围绕屏幕中心
                const centerX = STAGE_WIDTH / 2;
                const centerY = 200;
                const radius = 150;
                const targetX = centerX + Math.cos(world.time) * radius;
                const targetY = centerY + Math.sin(world.time) * radius;
                
                // 简单的 P控制 移动过去
                moveIntent.dx = (targetX - tr.x) * 0.05;
                moveIntent.dy = (targetY - tr.y) * 0.05;
                break;

            case BossMovementPattern.ZIGZAG:
                // 之字形: X 轴快速折返，Y 轴缓慢下压或保持
                // 利用 Math.round(time) 来切变方向，或者用三角函数的符号
                const zigFreq = 3.0;
                moveIntent.dx = Math.sign(Math.sin(world.time * zigFreq)); 
                moveIntent.dy = 0; // 拦截者通常横向封锁
                break;

            case BossMovementPattern.SLOW_DESCENT:
                // 缓慢下沉 (Titan)
                moveIntent.dx = 0;
                moveIntent.dy = 0.2; // 恒定慢速向下
                if (tr.y > 200) moveIntent.dy = 0; // 到达位置悬停
                break;

            case BossMovementPattern.FOLLOW:
            case BossMovementPattern.TRACKING:
                // 追踪玩家 X 轴
                const dist = playerX - tr.x;
                // 简单的平滑追踪
                moveIntent.dx = Math.sign(dist) * Math.min(Math.abs(dist) * 0.05, 1.0);
                moveIntent.dy = (200 - tr.y) * 0.05; // 保持在 Y=200 高度
                break;

            case BossMovementPattern.DASH:
                // 冲刺需要状态机支持 (预警->冲刺->恢复)
                // 这里用简单的 Timer 模拟：每 3 秒冲一次
                const dashCycle = world.time % 3.0;
                if (dashCycle < 1.0) {
                    // 1. 瞄准/预警阶段 (跟踪玩家)
                    const d = playerX - tr.x;
                    moveIntent.dx = d * 0.05; 
                    moveIntent.dy = (100 - tr.y) * 0.05; // 回到上方
                } else if (dashCycle < 1.5) {
                    // 2. 冲刺阶段 (向下猛冲)
                    moveIntent.dx = 0;
                    moveIntent.dy = 5.0; // 极快
                } else {
                    // 3. 恢复/返回阶段
                    moveIntent.dx = 0;
                    moveIntent.dy = -2.0; // 慢慢飞回去
                }
                break;

            case BossMovementPattern.RANDOM_TELEPORT:
                // 瞬移逻辑通常直接修改 Transform，而不是通过 Velocity/Intent
                // 模拟：隐形 -> 移动到新点 -> 显形
                const tpCycle = world.time % 4.0;
                // 假设 bossAi 上有个 internalState 记录是否隐形
                
                if (tpCycle < 0.1 && !bossAi.isTeleporting) {
                    // 触发瞬移：找个随机点
                    const nextX = BOSS_MARGIN_X + Math.random() * (STAGE_WIDTH - BOSS_MARGIN_X * 2);
                    const nextY = BOSS_MARGIN_Y + Math.random() * 150;
                    
                    tr.x = nextX;
                    tr.y = nextY;
                    bossAi.isTeleporting = true;
                    // 这里可以播放音效/特效
                } else if (tpCycle > 1.0) {
                    bossAi.isTeleporting = false;
                }
                
                moveIntent.dx = 0;
                moveIntent.dy = 0;
                break;

            case BossMovementPattern.ADAPTIVE:
                // 天启 Boss 的混合模式
                // 结合了 追踪 X 和 随机 Y
                const adaptiveDist = playerX - tr.x;
                moveIntent.dx = Math.sign(adaptiveDist) * 0.8;
                moveIntent.dy = Math.sin(world.time * 0.5) * 0.5;
                break;
                
            case BossMovementPattern.AGGRESSIVE:
                // 激进压制：试图骑在玩家头上
                // 目标是玩家上方 150 像素
                const aggTargetX = playerX;
                const aggTargetY = Math.max(50, playerY - 250);
                
                moveIntent.dx = (aggTargetX - tr.x) * 0.03;
                moveIntent.dy = (aggTargetY - tr.y) * 0.03;
                break;
        }

        // 边界限制 (Clamp)
        if (tr.x < BOSS_MARGIN_X && moveIntent.dx < 0) moveIntent.dx = 0;
        if (tr.x > STAGE_WIDTH - BOSS_MARGIN_X && moveIntent.dx > 0) moveIntent.dx = 0;
    }
}
```

### 3. 支持组件扩展

为了支持 `RANDOM_TELEPORT` 中的状态标记，我们需要在 `BossAI` 组件中加个临时字段，或者使用通用的 `Timer`。

```typescript
// src/engine/components/meta.ts

export class BossAI extends Component {
    constructor(cfg: { phase?: number; nextPatternTime?: number }) { 
        super(); 
        this.phase = cfg.phase ?? 1;
        this.nextPatternTime = cfg.nextPatternTime ?? 0;
    }
    public phase = 1;
    public nextPatternTime = 0;
    
    // 运行时临时状态 (不需要序列化/配置)
    public isTeleporting = false; 
    
    static check(c: any): c is BossAI { return c instanceof BossAI; }
}
```

### 总结

1.  **ZIGZAG**: 使用 `Math.sign(Math.sin(t))` 实现方形波移动。
2.  **CIRCLE**: 计算圆周坐标 `(cos(t), sin(t))` 并让 Boss 趋向该点。
3.  **DASH**: 使用 `time % period` 分割时间片，实现 瞄准 -> 冲刺 -> 返回 的三段式逻辑。
4.  **TELEPORT**: 直接修改 `Transform.x/y` 实现瞬移，配合 Timer 控制频率。
5.  **AGGRESSIVE**: 计算玩家头顶坐标，持续逼近。

这些逻辑被封装在 `BossSystem` 中，每帧根据 `BossAI.phase` 对应的配置来执行。

你是对的。将这么长的 `switch` 语句直接写在 System 循环里是代码异味（Code Smell），会导致 `BossSystem` 变得巨大且难以维护。

**最佳实践是使用“策略模式（Strategy Pattern）”**，将每种移动逻辑拆分成独立的函数，并通过一个映射表（Map）来调用。

这样做的优点：
1.  **可读性**：`BossSystem` 重新变回清爽的逻辑流。
2.  **可维护性**：新增移动模式只需加一个函数，不用去改动主循环。
3.  **可测试性**：可以单独测试某个移动函数的数学逻辑。

下面是重构后的方案：

### 1. 提取移动策略 (src/engine/systems/logic/bossMovement.ts)

新建一个文件专门放这些数学计算。

```typescript
// src/engine/systems/logic/bossMovement.ts

import { BossMovementPattern } from '@/engine/types';
import { BossAI, Transform } from '@/engine/components';

// 定义移动上下文，传入计算所需的所有数据
export interface MovementContext {
    dt: number;
    time: number;           // world.time
    self: Transform;        // 自身位置
    player: { x: number, y: number }; // 玩家位置
    bossAi: BossAI;         // 用于存取内部状态 (如 isTeleporting)
}

// 定义返回值
interface MovementResult {
    dx: number;
    dy: number;
}

// 定义函数类型
type MovementHandler = (ctx: MovementContext) => MovementResult;

// ==================== 具体策略实现 ====================

const idle: MovementHandler = () => ({ dx: 0, dy: 0 });

const sine: MovementHandler = ({ time }) => ({
    dx: Math.sin(time * 2),
    dy: Math.cos(time) * 0.2
});

const figure8: MovementHandler = ({ time }) => ({
    dx: Math.cos(time),
    dy: Math.sin(time * 2) * 0.5
});

const circle: MovementHandler = ({ time, self }) => {
    const centerX = 400; // STAGE_WIDTH / 2
    const centerY = 200;
    const radius = 150;
    const targetX = centerX + Math.cos(time) * radius;
    const targetY = centerY + Math.sin(time) * radius;
    return {
        dx: (targetX - self.x) * 0.05,
        dy: (targetY - self.y) * 0.05
    };
};

const zigzag: MovementHandler = ({ time }) => {
    const zigFreq = 3.0;
    return {
        dx: Math.sign(Math.sin(time * zigFreq)),
        dy: 0
    };
};

const slowDescent: MovementHandler = ({ self }) => {
    let dy = 0.2;
    if (self.y > 200) dy = 0; // 悬停
    return { dx: 0, dy };
};

const follow: MovementHandler = ({ self, player }) => {
    const dist = player.x - self.x;
    return {
        dx: Math.sign(dist) * Math.min(Math.abs(dist) * 0.05, 1.0),
        dy: (200 - self.y) * 0.05 // 保持高度
    };
};

const dash: MovementHandler = ({ time, self, player }) => {
    const dashCycle = time % 3.0;
    if (dashCycle < 1.0) {
        // 预警跟踪
        return {
            dx: (player.x - self.x) * 0.05,
            dy: (100 - self.y) * 0.05
        };
    } else if (dashCycle < 1.5) {
        // 冲刺
        return { dx: 0, dy: 5.0 };
    } else {
        // 返回
        return { dx: 0, dy: -2.0 };
    }
};

const randomTeleport: MovementHandler = ({ time, self, bossAi }) => {
    const tpCycle = time % 4.0;
    const STAGE_WIDTH = 800;
    
    // 注意：副作用（修改 transform）虽然在纯函数里不推荐，
    // 但在 ECS 系统内部逻辑中，为了性能和方便，这里直接修改 self 是可接受的，
    // 或者你可以返回一个特殊标志让 System 去处理 Transform。
    // 这里我们仅计算意图，瞬移的“位置突变”逻辑建议保留在 System 或这里特殊处理。
    
    if (tpCycle < 0.1 && !bossAi.isTeleporting) {
        self.x = 100 + Math.random() * (STAGE_WIDTH - 200);
        self.y = 50 + Math.random() * 150;
        bossAi.isTeleporting = true;
    } else if (tpCycle > 1.0) {
        bossAi.isTeleporting = false;
    }
    
    return { dx: 0, dy: 0 };
};

const adaptive: MovementHandler = ({ time, self, player }) => {
    const dist = player.x - self.x;
    return {
        dx: Math.sign(dist) * 0.8,
        dy: Math.sin(time * 0.5) * 0.5
    };
};

const aggressive: MovementHandler = ({ self, player }) => {
    const targetY = Math.max(50, player.y - 250);
    return {
        dx: (player.x - self.x) * 0.03,
        dy: (targetY - self.y) * 0.03
    };
};

// ==================== 策略映射表 ====================

export const MOVEMENT_STRATEGIES: Record<BossMovementPattern, MovementHandler> = {
    [BossMovementPattern.IDLE]: idle,
    [BossMovementPattern.SINE]: sine,
    [BossMovementPattern.FIGURE_8]: figure8,
    [BossMovementPattern.CIRCLE]: circle,
    [BossMovementPattern.ZIGZAG]: zigzag,
    [BossMovementPattern.SLOW_DESCENT]: slowDescent,
    [BossMovementPattern.FOLLOW]: follow,
    [BossMovementPattern.TRACKING]: follow, // 复用 follow
    [BossMovementPattern.DASH]: dash,
    [BossMovementPattern.RANDOM_TELEPORT]: randomTeleport,
    [BossMovementPattern.ADAPTIVE]: adaptive,
    [BossMovementPattern.AGGRESSIVE]: aggressive,
};
```

### 2. 重构后的 BossSystem (src/engine/systems/BossSystem.ts)

现在，`BossSystem` 变得极其简洁，只负责数据准备和调用策略。

```typescript
// src/engine/systems/BossSystem.ts

import { World } from '@/engine/types';
import { BossAI, Transform, MoveIntent, PlayerTag, BossTag } from '@/engine/components';
import { view } from '@/engine/world';
import { BossMovementPattern } from '@/engine/types';
import { BOSS_DATA } from '@/engine/configs/bossData';
import { MOVEMENT_STRATEGIES, MovementContext } from './logic/bossMovement'; // 导入策略

const STAGE_WIDTH = 800;
const BOSS_MARGIN_X = 100;

export function BossSystem(world: World, dt: number) {
    // 1. 获取玩家位置
    let playerPos = { x: STAGE_WIDTH / 2, y: 500 };
    for (const [_, [tr]] of view(world, [PlayerTag, Transform])) {
        playerPos = { x: tr.x, y: tr.y };
        break;
    }

    // 2. 遍历 Boss
    for (const [id, [bossAi, tr, moveIntent]] of view(world, [BossAI, Transform, MoveIntent])) {
        // 获取配置 (实际项目中建议缓存 BossType 到组件)
        const bossEntity = world.entities.get(id)!;
        const bossTag = bossEntity.find(c => c instanceof BossTag);
        
        // 如果找不到 tag 或者 type，默认 IDLE
        if (!bossTag) continue;
        
        // 假设 BossTag 里存了 subType (如 'boss_guardian')
        // 如果你的 BossTag 是空的，你需要从 factory 生成时把它记在 Entity 上或扩展 BossTag
        // 这里假设我们能获取到 type，例如通过 id 查表或者扩展组件
        const bossType = (bossTag as any).subType || 'boss_guardian'; 

        const bossSpec = BOSS_DATA[bossType];
        const phaseSpec = bossSpec?.phases[bossAi.phase - 1];
        
        const pattern = phaseSpec?.movePattern || BossMovementPattern.IDLE;
        const speedMod = phaseSpec?.modifiers?.moveSpeed || 1.0;

        // 3. 【核心修改】调用策略函数
        const strategy = MOVEMENT_STRATEGIES[pattern];
        
        if (strategy) {
            const ctx: MovementContext = {
                dt,
                time: world.time,
                self: tr,
                player: playerPos,
                bossAi: bossAi
            };

            const result = strategy(ctx);

            // 应用结果
            moveIntent.dx = result.dx;
            moveIntent.dy = result.dy;
        }

        // 4. 边界限制 (通用逻辑)
        if (tr.x < BOSS_MARGIN_X && moveIntent.dx < 0) moveIntent.dx = 0;
        if (tr.x > STAGE_WIDTH - BOSS_MARGIN_X && moveIntent.dx > 0) moveIntent.dx = 0;
    }
}
```

### 3. 需要补充的小修改

为了让上面的代码跑通，你需要确保 `BossTag` 组件能存储 `subType`，或者在生成实体时将其保存。

**修改 `src/engine/components/meta.ts`：**

```typescript
export class BossTag extends Component { 
    constructor(public subType: string = '') { super(); }
}
```

**修改 `src/engine/factory.ts` (spawnBoss)：**

```typescript
// 在生成 Boss 时注入 subType
// ...
const bossTag = new BossTag(bp.BossTag ? bossId : ''); 
// 确保你的 Blueprints 里传递了正确的 ID
```

这样重构后，不仅 `BossSystem` 只有短短几行，而且以后你想写新的移动模式（比如 “贝塞尔曲线冲刺”），只需要在 `logic/bossMovement.ts` 加一个函数并在 Map 里注册即可，完全不影响其他逻辑。

这是一个非常好的 ECS 思维！

**直接回答：**
**不能直接使用 `Lifetime` 组件**，因为 `LifetimeSystem` 的标准行为是：“倒计时结束 -> **销毁实体（杀死 Boss）**”。你肯定不希望 Boss 瞬移结束就死了。

**最佳实践：**
你应该引入一个 **“状态组件（State Component）”**。
在 ECS 中，**“状态”也是一种组件**。如果一个实体身上挂载了 `TeleportState` 组件，说明它正在瞬移中；如果没有，说明它在正常状态。

这样做的好处：
1.  **解耦**：`RenderSystem` 检测到有 `TeleportState` 就不渲染（隐形），`DamageSystem` 检测到有就不扣血（无敌）。
2.  **标准化**：不再需要在 `BossAI` 里写奇怪的 `isTeleporting` 这种硬编码字段。

---

### 1. 新增组件：TeleportState (src/engine/components/combat.ts 或 meta.ts)

这个组件充当了你的“计时器”和“状态标记”。

```typescript
// src/engine/components/meta.ts

/** 瞬移状态组件 - 挂载此组件表示实体正在瞬移（隐形/无敌/不可控） */
export class TeleportState extends Component {
    constructor(cfg: { 
        timer: number;       // 瞬移持续时间（隐形时间）
        targetX: number;     // 目标 X
        targetY: number;     // 目标 Y
    }) { 
        super(); 
        this.timer = cfg.timer;
        this.targetX = cfg.targetX;
        this.targetY = cfg.targetY;
    }
    public timer: number;
    public targetX: number;
    public targetY: number;
    
    static check(c: any): c is TeleportState { return c instanceof TeleportState; }
}
```

---

### 2. 更新上下文接口 (src/engine/systems/logic/bossMovement.ts)

为了让策略函数能添加/查找组件，我们需要把实体的组件列表传进去。

```typescript
// src/engine/systems/logic/bossMovement.ts

import { Component } from '@/engine/types';
// ... 引入 TeleportState

export interface MovementContext {
    dt: number;
    time: number;
    self: Transform;
    player: { x: number, y: number };
    bossAi: BossAI;
    // 【新增】我们需要访问实体的组件列表来操作状态
    components: Component[]; 
}
```

### 3. 重写瞬移策略 (src/engine/systems/logic/bossMovement.ts)

现在逻辑变成了：**“没状态就加状态，有状态就倒计时”**。

```typescript
// ... 
import { TeleportState } from '@/engine/components';

const randomTeleport: MovementHandler = ({ dt, self, components }) => {
    // 1. 检查是否已经在瞬移中
    const tpState = components.find(c => c instanceof TeleportState) as TeleportState;

    if (tpState) {
        // === 正在瞬移中 (隐身阶段) ===
        tpState.timer -= dt;

        if (tpState.timer <= 0) {
            // --- 瞬移结束 (显形) ---
            self.x = tpState.targetX;
            self.y = tpState.targetY;
            
            // 移除状态组件 -> Boss 恢复正常
            const idx = components.indexOf(tpState);
            if (idx > -1) components.splice(idx, 1);
        }
        
        // 瞬移期间不移动
        return { dx: 0, dy: 0 };
    } 
    else {
        // === 准备瞬移 ===
        // 这里控制瞬移频率，比如每 3 秒触发一次
        // 我们可以用简单的概率，或者在 BossAI 里存个 cooldown
        // 为了演示简单，这里假设 1% 概率触发 (每秒60帧约 0.6次)
        // 更好的做法是在 BossAI 加个 teleportCooldown 字段
        
        if (Math.random() < 0.01) {
            // --- 开始瞬移 ---
            const STAGE_WIDTH = 800;
            const targetX = 100 + Math.random() * (STAGE_WIDTH - 200);
            const targetY = 50 + Math.random() * 200;

            // 挂载组件：1秒后出现在目标位置
            components.push(new TeleportState({
                timer: 1.0, // 隐身 1 秒
                targetX: targetX,
                targetY: targetY
            }));
        }

        // 没触发瞬移时，保持静止或微动
        return { dx: 0, dy: 0 };
    }
};
```

---

### 4. 更新 System 调用 (src/engine/systems/BossSystem.ts)

别忘了把 `playerComps` (即实体的组件列表) 传给 Context。

```typescript
export function BossSystem(world: World, dt: number) {
    // ...
    // 注意这里解构稍微改一下，我们需要获取整个组件数组
    for (const [id, comps] of world.entities) {
        // 手动查找所需组件，因为 view 迭代器隐藏了原始数组
        const bossAi = comps.find(c => c instanceof BossAI) as BossAI;
        const tr = comps.find(c => c instanceof Transform) as Transform;
        const moveIntent = comps.find(c => c instanceof MoveIntent) as MoveIntent;

        if (!bossAi || !tr || !moveIntent) continue;

        // ... 获取配置 logic ...

        if (strategy) {
            const ctx: MovementContext = {
                dt,
                time: world.time,
                self: tr,
                player: playerPos,
                bossAi: bossAi,
                components: comps // <--- 【关键】传入组件列表引用
            };
            
            // ...
        }
    }
}
```

### 5. 连锁反应：渲染与受击 (Optional but Recommended)

既然用了 ECS 组件做状态，其他系统就可以自动适配了！

**RenderSystem.ts (实现隐形):**
```typescript
for (const [id, [sprite, tr]] of view(world, [Sprite, Transform])) {
    const comps = world.entities.get(id)!;
    // 如果有瞬移状态，跳过渲染 -> 实现隐形
    if (comps.some(c => c instanceof TeleportState)) continue; 
    
    // ... 渲染逻辑
}
```

**DamageResolutionSystem.ts (实现无敌):**
```typescript
// 在扣血前检查
if (entity.some(c => c instanceof TeleportState)) return; // 瞬移中无敌
```

### 总结

1.  **Lifetime 是给“死亡”用的**，不要混用。
2.  **状态即组件**：`TeleportState` 组件的出现意味着 Boss 进入了瞬移状态。
3.  **副作用管理**：组件的添加/删除直接改变了实体的行为（隐形、无敌），这是 ECS 最优雅的地方。