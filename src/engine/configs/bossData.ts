//
// Boss配置数据文件
// 定义各个Boss的基础配置信息
//

import { BossId, WeaponId } from "../types";


export interface BossSpec {
    id: BossId;
    phases: BossPhaseSpec[];
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


/** Boss 阶段定义 */
export interface BossPhaseSpec {
    /** 触发该阶段的血量阈值 (0-1), 1.0=100% */
    threshold: number;
    /** 该阶段的移动模式 */
    movePattern: BossMovementPattern;
    /** 该阶段使用的武器 ID (引用 weapons.ts) */
    weaponId: WeaponId;
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

/**
 * Boss 的生成位置
 */
export enum BossSpawnPosition {
    RANDOM = 'random',
    CENTER = 'center',
    LEFT = 'left',
    RIGHT = 'right'
}


export const BOSS_DATA: Record<BossId, BossSpec> = {
    // ==========================================
    // Lv1: GUARDIAN (赛博守护者) - 2阶段
    // ==========================================
    [BossId.GUARDIAN]: {
        id: BossId.GUARDIAN,
        phases: [
            { // P1: 100% - 50%
                threshold: 1.0,
                movePattern: BossMovementPattern.SINE,
                weaponId: 'boss_guardian_radial',
                modifiers: { moveSpeed: 1.0, fireRate: 1.0 }
            },
            { // P2: 50% - 0% (狂暴)
                threshold: 0.5,
                movePattern: BossMovementPattern.FOLLOW, // 开始追踪
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
    [BossId.DESTROYER]: {
        id: BossId.DESTROYER,
        phases: [
            { // P1: 100% - 70%
                threshold: 1.0,
                movePattern: BossMovementPattern.FIGURE_8,
                weaponId: 'boss_destroyer_main',
                modifiers: { moveSpeed: 1.0 },
                specialEvents: ['wingman_support']
            },
            { // P2: 70% - 40% (冲刺)
                threshold: 0.7,
                movePattern: BossMovementPattern.DASH,
                weaponId: 'boss_destroyer_dash',
                modifiers: { moveSpeed: 1.5, fireRate: 1.2 },
                phaseColor: '#ffd700'
            },
            { // P3: 40% - 0% (螺旋狂暴)
                threshold: 0.4,
                movePattern: BossMovementPattern.FOLLOW,
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
    [BossId.TITAN]: {
        id: BossId.TITAN,
        phases: [
            { // P1: 100% - 65%
                threshold: 1.0,
                movePattern: BossMovementPattern.IDLE, // 缓慢降临/站桩
                weaponId: 'boss_titan_laser_base',
                modifiers: { moveSpeed: 0.5 }
            },
            { // P2: 65% - 30%
                threshold: 0.65,
                movePattern: BossMovementPattern.SINE, // 开始缓慢移动
                weaponId: 'boss_titan_laser_rapid',
                modifiers: { moveSpeed: 0.8, fireRate: 1.5 },
                phaseColor: '#ffd700'
            },
            { // P3: 30% - 0% (全弹幕)
                threshold: 0.3,
                movePattern: BossMovementPattern.FOLLOW,
                weaponId: 'boss_titan_omni',
                modifiers: { moveSpeed: 1.0, fireRate: 2.0 },
                phaseColor: '#ff4500'
            }
        ]
    },

    // ==========================================
    // Lv10: APOCALYPSE (天启审判) - 4阶段
    // ==========================================
    [BossId.APOCALYPSE]: {
        id: BossId.APOCALYPSE,
        phases: [
            { // P1: 100% - 75% (全武器展示)
                threshold: 1.0,
                movePattern: BossMovementPattern.ADAPTIVE,
                weaponId: 'boss_apocalypse_mixed',
                modifiers: { moveSpeed: 1.0 }
            },
            { // P2: 75% - 50% (装甲模式)
                threshold: 0.75,
                movePattern: BossMovementPattern.IDLE,
                weaponId: 'boss_apocalypse_defense',
                modifiers: { moveSpeed: 0.8, damage: 0.5 }, // 减伤逻辑需在DamageResolutionSystem实现
                phaseColor: '#ffff00'
            },
            { // P3: 50% - 25% (狂暴模式)
                threshold: 0.5,
                movePattern: BossMovementPattern.TELEPORT,
                weaponId: 'boss_apocalypse_berserk',
                modifiers: { moveSpeed: 1.5, fireRate: 1.6 },
                phaseColor: '#ff4500'
            },
            { // P4: 25% - 0% (绝境反击)
                threshold: 0.25,
                movePattern: BossMovementPattern.DASH,
                weaponId: 'boss_apocalypse_final',
                modifiers: { moveSpeed: 2.0, fireRate: 2.0 },
                phaseColor: '#8b0000',
                specialEvents: ['screen_clear', 'last_stand']
            }
        ]
    },

    // ... 其他 Boss 可以配置为简单的单阶段或两阶段
    [BossId.INTERCEPTOR]: {
        id: BossId.INTERCEPTOR,
        phases: [{ threshold: 1.0, movePattern: BossMovementPattern.ZIGZAG, weaponId: 'boss_weapon_targeted', modifiers: {} }]
    },
    [BossId.ANNIHILATOR]: {
        id: BossId.ANNIHILATOR,
        phases: [{ threshold: 1.0, movePattern: BossMovementPattern.RANDOM_TELEPORT, weaponId: 'boss_weapon_targeted', modifiers: {} }]
    },
    [BossId.DOMINATOR]: {
        id: BossId.DOMINATOR,
        phases: [{ threshold: 1.0, movePattern: BossMovementPattern.CIRCLE, weaponId: 'boss_weapon_radial', modifiers: {} }]
    },
    [BossId.OVERLORD]: {
        id: BossId.OVERLORD,
        phases: [{ threshold: 1.0, movePattern: BossMovementPattern.FOLLOW, weaponId: 'boss_weapon_laser', modifiers: {} }]
    },
    [BossId.COLOSSUS]: {
        id: BossId.COLOSSUS,
        phases: [{ threshold: 1.0, movePattern: BossMovementPattern.DASH, weaponId: 'boss_weapon_spread', modifiers: {} }]
    },
    [BossId.LEVIATHAN]: {
        id: BossId.LEVIATHAN,
        phases: [{ threshold: 1.0, movePattern: BossMovementPattern.FIGURE_8, weaponId: 'boss_weapon_homing', modifiers: {} }]
    },
};