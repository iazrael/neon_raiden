//
// Boss配置数据文件
// 定义各个Boss的基础配置信息
//

import { BossId, EnemyWeaponId, WeaponId } from "../types";
import { ENEMY_WEAPON_TABLE } from "../blueprints/weapons";


export interface BossSpec {
    id: BossId;
    phases: BossPhaseSpec[];
}

/**
 * Boss移动配置参数
 * 用于微调各个移动模式的行为
 */
export interface MovementConfig {
    /** 速度倍率（1.0 = 基准速度） */
    speedMultiplier?: number;
    /** 圆形/8字移动半径 */
    radius?: number;
    /** 8字形X轴半径（如果不指定则使用radius） */
    radiusX?: number;
    /** 8字形Y轴半径（如果不指定则使用radius） */
    radiusY?: number;
    /** 振动/摆动频率 */
    frequency?: number;
    /** 振幅 */
    amplitude?: number;
    /** 垂直速度 */
    verticalSpeed?: number;
    /** 瞬移间隔（毫秒） */
    teleportInterval?: number;
    /** 冲刺速度 */
    dashSpeed?: number;
    /** 圆心Y坐标 */
    centerY?: number;
    /** 圆心X坐标 */
    centerX?: number;
    /** 之字形切换间隔 */
    zigzagInterval?: number;
    /** 自适应模式近距离阈值 */
    closeRangeThreshold?: number;
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
    AGGRESSIVE = 'aggressive',      // 激进压制 (Leviathan, Colossus)

    // 新增模式
    SPIRAL_DESCENT = 'spiral_descent', // 螺旋下降
    HORIZONTAL_SCAN = 'horizontal_scan', // 横向扫描
    VERTICAL_SWAY = 'vertical_sway', // 垂直摆动
    AMBUSH = 'ambush',              // 突袭模式
    HOP = 'hop'                     // 跳跃移动
}


/** Boss 阶段定义 */
export interface BossPhaseSpec {
    /** 触发该阶段的血量阈值 (0-1), 1.0=100% */
    threshold: number;
    /** 该阶段的移动模式 */
    movePattern: BossMovementPattern;
    /** 移动参数配置 */
    movementConfig?: MovementConfig;
    /** 该阶段使用的武器 ID (引用 weapons.ts) */
    weaponId: EnemyWeaponId;
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
                weaponId: EnemyWeaponId.GUARDIAN_RADIAL,
                modifiers: { moveSpeed: 1.0, fireRate: 1.0 }
            },
            { // P2: 50% - 0% (狂暴)
                threshold: 0.5,
                movePattern: BossMovementPattern.FOLLOW, // 开始追踪
                weaponId: EnemyWeaponId.GUARDIAN_RADIAL_ENRAGED, // 弹幕更密
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
                weaponId: EnemyWeaponId.DESTROYER_MAIN,
                modifiers: { moveSpeed: 1.0 },
                specialEvents: ['wingman_support']
            },
            { // P2: 70% - 40% (冲刺)
                threshold: 0.7,
                movePattern: BossMovementPattern.DASH,
                weaponId: EnemyWeaponId.DESTROYER_DASH,
                modifiers: { moveSpeed: 1.5, fireRate: 1.2 },
                phaseColor: '#ffd700'
            },
            { // P3: 40% - 0% (螺旋狂暴)
                threshold: 0.4,
                movePattern: BossMovementPattern.FOLLOW,
                weaponId: EnemyWeaponId.DESTROYER_BERSERK, // 螺旋弹幕 + 激光
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
                weaponId: EnemyWeaponId.TITAN_LASER_BASE,
                modifiers: { moveSpeed: 0.5 }
            },
            { // P2: 65% - 30%
                threshold: 0.65,
                movePattern: BossMovementPattern.SINE, // 开始缓慢移动
                weaponId: EnemyWeaponId.TITAN_LASER_RAPID,
                modifiers: { moveSpeed: 0.8, fireRate: 1.5 },
                phaseColor: '#ffd700'
            },
            { // P3: 30% - 0% (全弹幕)
                threshold: 0.3,
                movePattern: BossMovementPattern.FOLLOW,
                weaponId: EnemyWeaponId.TITAN_OMNI,
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
                weaponId: EnemyWeaponId.APOCALYPSE_MIXED,
                modifiers: { moveSpeed: 1.0 }
            },
            { // P2: 75% - 50% (装甲模式)
                threshold: 0.75,
                movePattern: BossMovementPattern.IDLE,
                weaponId: EnemyWeaponId.APOCALYPSE_DEFENSE,
                modifiers: { moveSpeed: 0.8, damage: 0.5 }, // 减伤逻辑需在DamageResolutionSystem实现
                phaseColor: '#ffff00'
            },
            { // P3: 50% - 25% (狂暴模式)
                threshold: 0.5,
                movePattern: BossMovementPattern.RANDOM_TELEPORT,
                weaponId: EnemyWeaponId.APOCALYPSE_BERSERK,
                modifiers: { moveSpeed: 1.5, fireRate: 1.6 },
                phaseColor: '#ff4500'
            },
            { // P4: 25% - 0% (绝境反击)
                threshold: 0.25,
                movePattern: BossMovementPattern.DASH,
                weaponId: EnemyWeaponId.APOCALYPSE_FINAL,
                modifiers: { moveSpeed: 2.0, fireRate: 2.0 },
                phaseColor: '#8b0000',
                specialEvents: ['screen_clear', 'last_stand']
            }
        ]
    },

    // ... 其他 Boss 可以配置为简单的单阶段或两阶段
    [BossId.INTERCEPTOR]: {
        id: BossId.INTERCEPTOR,
        phases: [{ threshold: 1.0, movePattern: BossMovementPattern.ZIGZAG, weaponId: EnemyWeaponId.GENERIC_TARGETED, modifiers: {} }]
    },
    [BossId.ANNIHILATOR]: {
        id: BossId.ANNIHILATOR,
        phases: [{ threshold: 1.0, movePattern: BossMovementPattern.RANDOM_TELEPORT, weaponId: EnemyWeaponId.GENERIC_TARGETED, modifiers: {} }]
    },
    [BossId.DOMINATOR]: {
        id: BossId.DOMINATOR,
        phases: [{ threshold: 1.0, movePattern: BossMovementPattern.CIRCLE, weaponId: EnemyWeaponId.GENERIC_RADIAL, modifiers: {} }]
    },
    [BossId.OVERLORD]: {
        id: BossId.OVERLORD,
        phases: [{ threshold: 1.0, movePattern: BossMovementPattern.FOLLOW, weaponId: EnemyWeaponId.GENERIC_LASER, modifiers: {} }]
    },
    [BossId.COLOSSUS]: {
        id: BossId.COLOSSUS,
        phases: [{ threshold: 1.0, movePattern: BossMovementPattern.DASH, weaponId: EnemyWeaponId.GENERIC_SPREAD, modifiers: {} }]
    },
    [BossId.LEVIATHAN]: {
        id: BossId.LEVIATHAN,
        phases: [{ threshold: 1.0, movePattern: BossMovementPattern.FIGURE_8, weaponId: EnemyWeaponId.GENERIC_HOMING, modifiers: {} }]
    },
};

/**
 * Boss配置验证结果
 */
export interface ValidationResult {
    /** 是否验证通过 */
    valid: boolean;
    /** 错误信息列表 */
    errors: string[];
    /** 警告信息列表 */
    warnings: string[];
}

/**
 * 验证Boss配置的完整性和正确性
 *
 * 检查项：
 * 1. 所有Boss至少有一个阶段
 * 2. 阶段阈值按降序排列（1.0 -> 0）
 * 3. 所有weaponId在ENEMY_WEAPON_TABLE中存在
 * 4. 所有movePattern在BossMovementPattern中存在
 * 5. modifiers字段结构正确
 *
 * @returns 验证结果对象
 */
export function validateBossConfigs(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证每个Boss
    for (const [bossId, bossSpec] of Object.entries(BOSS_DATA)) {
        // 检查1: 至少有一个阶段
        if (!bossSpec.phases || bossSpec.phases.length === 0) {
            errors.push(`Boss ${bossId}: 没有定义阶段`);
            continue;
        }

        // 检查2: 阶段阈值降序排列
        let lastThreshold = 2.0; // 初始值大于1.0
        for (let i = 0; i < bossSpec.phases.length; i++) {
            const phase = bossSpec.phases[i];

            if (phase.threshold > lastThreshold) {
                errors.push(`Boss ${bossId} Phase ${i}: 阈值未按降序排列 (${phase.threshold} > ${lastThreshold})`);
            }
            lastThreshold = phase.threshold;

            // 检查3: weaponId存在
            if (!ENEMY_WEAPON_TABLE[phase.weaponId]) {
                errors.push(`Boss ${bossId} Phase ${i}: 武器ID ${phase.weaponId} 在武器表中不存在`);
            }

            // 检查4: movePattern存在
            const patternValues = Object.values(BossMovementPattern);
            if (!patternValues.includes(phase.movePattern)) {
                errors.push(`Boss ${bossId} Phase ${i}: 移动模式 ${phase.movePattern} 无效`);
            }

            // 检查5: modifiers结构
            if (phase.modifiers) {
                const validKeys = ['moveSpeed', 'fireRate', 'damage'];
                for (const key of Object.keys(phase.modifiers)) {
                    if (!validKeys.includes(key)) {
                        warnings.push(`Boss ${bossId} Phase ${i}: 未知的modifier字段 "${key}"`);
                    }
                }
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

// 开发环境自动验证
if (process.env.NODE_ENV !== 'production') {
    const validation = validateBossConfigs();
    if (!validation.valid) {
        console.error('Boss配置验证失败:');
        validation.errors.forEach(err => console.error(`  ✗ ${err}`));
    }
    if (validation.warnings.length > 0) {
        console.warn('Boss配置警告:');
        validation.warnings.forEach(warn => console.warn(`  ⚠ ${warn}`));
    }
    if (validation.valid && validation.warnings.length === 0) {
        console.log('✓ Boss配置验证通过');
    }
}