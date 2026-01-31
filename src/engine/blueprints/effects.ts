/**
 * 特效配置文件
 *
 * 统一管理所有视觉特效的配置：
 * - 粒子动画特效 (EFFECT_CONFIGS)
 * - 物理爆炸粒子 (EXPLOSION_CONFIGS)
 * - 游戏效果规格 (EFFECT_TABLE) - 保留用于未来扩展
 *
 * 时间单位统一：毫秒
 */

import { Blueprint } from './base';
import { BUFF_CONFIG } from '../configs/powerups';

// =============================================================================
// 粒子动画特效配置
// 用于基于帧动画的粒子特效（爆炸、飙血、升级等）
// =============================================================================

export enum ParticleId {
    BloodLight = "blood_light",
    BloodMedium = "blood_medium",
    BloodHeavy = "blood_heavy",

    EnemyDefeated = "enemy_defeated",
    BossDefeated = "boss_defeated",

    PlayerHited = "player_hited",
    PlayerDefeated = "player_defeated",
}

// / 飙血特效
//     blood_light: {
//         scale: 0.5,
//         color: '#ff3333',
//         frames: 4,
//         fps: 12,
//         lifetime: 300  // 0.3秒 = 300毫秒
//     },
//     blood_medium: {
//         scale: 0.8,
//         color: '#ff0000',
//         frames: 6,
//         fps: 12,
//         lifetime: 400  // 0.4秒 = 400毫秒
//     },
//     blood_heavy: {
//         scale: 1.2,
//         color: '#cc0000',
//         frames: 8,
//         fps: 12,
//         lifetime: 500  // 0.5秒 = 500毫秒
//     },

/**
 * 粒子动画配置
 */
export interface ParticleEffectConfig {
    /** 粒子数量 */
    count: number;
    /** 最小速度（像素/秒） */
    speedMin: number;
    /** 最大速度（像素/秒） */
    speedMax: number;
    /** 最小大小（像素） */
    sizeMin: number;
    /** 最大大小（像素） */
    sizeMax: number;
    /** 生命周期（毫秒） */
    life: number;
    /** 颜色 */
    color: string;
}

/**
 * 粒子动画特效配置表
 */
export const PARTICLE_EFFECTS: Record<ParticleId, ParticleEffectConfig> = {
    // 敌人被子弹击中飙血特效
    [ParticleId.BloodLight]: {
        count: 8,
        speedMin: 1,
        speedMax: 4,
        sizeMin: 2,
        sizeMax: 4,
        life: 300,
        color: '#ffe066'
    },
    [ParticleId.BloodMedium]: {
        count: 16,
        speedMin: 1,
        speedMax: 10,
        sizeMin: 2,
        sizeMax: 4,
        life: 800,
        color: '#ff7332'
    },
    [ParticleId.BloodHeavy]: {
        count: 32,
        speedMin: 1,
        speedMax: 10,
        sizeMin: 2,
        sizeMax: 6,
        life: 800,
        color: '#e30303'
    },
    // 敌人死亡爆炸效果
    [ParticleId.EnemyDefeated]: {
        count: 32,
        speedMin: 1,
        speedMax: 10,
        sizeMin: 2,
        sizeMax: 6,
        life: 800,
        color: '#c53030'
    },
    // 玩家被击中/碰撞
    [ParticleId.PlayerHited]: {
        count: 8,
        speedMin: 1,
        speedMax: 4,
        sizeMin: 2,
        sizeMax: 4,
        life: 300,
        color: '#00ffff'
    },
    // 玩家死亡
    [ParticleId.PlayerDefeated]: {
        count: 32,
        speedMin: 1,
        speedMax: 10,
        sizeMin: 2,
        sizeMax: 6,
        life: 800,
        color: '#00ffff'
    },
    // boss 死亡
    [ParticleId.BossDefeated]: {
        count: 32,
        speedMin: 1,
        speedMax: 10,
        sizeMin: 2,
        sizeMax: 6,
        life: 800,
        color: '#ffffff'
    },


    // // 爆炸特效
    // explosion_small: {
    //     scale: 1,
    //     color: '#ff6600',
    //     frames: 8,
    //     fps: 16,
    //     lifetime: 500  // 0.5秒 = 500毫秒
    // },
    // explosion_medium: {
    //     scale: 1.5,
    //     color: '#ff4400',
    //     frames: 12,
    //     fps: 16,
    //     lifetime: 750  // 0.75秒 = 750毫秒
    // },
    // explosion_large: {
    //     scale: 2,
    //     color: '#ff2200',
    //     frames: 16,
    //     fps: 16,
    //     lifetime: 1000  // 1秒 = 1000毫秒
    // },

    // // 飙血特效
    // blood_light: {
    //     scale: 0.5,
    //     color: '#ff3333',
    //     frames: 4,
    //     fps: 12,
    //     lifetime: 300  // 0.3秒 = 300毫秒
    // },
    // blood_medium: {
    //     scale: 0.8,
    //     color: '#ff0000',
    //     frames: 6,
    //     fps: 12,
    //     lifetime: 400  // 0.4秒 = 400毫秒
    // },
    // blood_heavy: {
    //     scale: 1.2,
    //     color: '#cc0000',
    //     frames: 8,
    //     fps: 12,
    //     lifetime: 500  // 0.5秒 = 500毫秒
    // },

    // // 拾取特效
    // pickup: {
    //     scale: 1,
    //     color: '#00ff88',
    //     frames: 10,
    //     fps: 20,
    //     lifetime: 500  // 0.5秒 = 500毫秒
    // },

    // // 升级特效
    // levelup: {
    //     scale: 2,
    //     color: '#ffff00',
    //     frames: 20,
    //     fps: 20,
    //     lifetime: 1000  // 1秒 = 1000毫秒
    // },

    // // 连击升级特效
    // combo_upgrade: {
    //     scale: 1.5,
    //     color: '#00ffff',
    //     frames: 15,
    //     fps: 20,
    //     lifetime: 750  // 0.75秒 = 750毫秒
    // },

    // // Boss 阶段切换特效
    // boss_phase: {
    //     scale: 3,
    //     color: '#ff00ff',
    //     frames: 24,
    //     fps: 24,
    //     lifetime: 1000  // 1秒 = 1000毫秒
    // },

    // // 狂暴模式特效
    // berserk: {
    //     scale: 4,
    //     color: '#ff0000',
    //     frames: 30,
    //     fps: 30,
    //     lifetime: 1500  // 1.5秒 = 1500毫秒
    // },

    // // 炸弹爆炸特效
    // bomb_explosion: {
    //     scale: 5,           // 超大尺寸
    //     color: '#ffaa00',   // 橙黄色爆炸
    //     frames: 30,         // 30帧动画
    //     fps: 30,
    //     lifetime: 1000      // 1秒 = 1000毫秒
    // },

    // // 全屏闪光特效
    // screen_flash: {
    //     scale: 20,          // 覆盖全屏
    //     color: '#ffffff',   // 白色闪光
    //     frames: 5,          // 快速闪烁
    //     fps: 30,
    //     lifetime: 200       // 0.2秒 = 200毫秒
    // },

    // // 武器特效
    // plasma_explosion: {
    //     scale: 2,
    //     color: '#ed64a6',   // 粉色
    //     frames: 16,
    //     fps: 16,
    //     lifetime: 1000      // 1秒 = 1000毫秒
    // },
    // tesla_chain: {
    //     scale: 1.5,
    //     color: '#a855f7',   // 紫色
    //     frames: 8,
    //     fps: 24,
    //     lifetime: 300       // 0.3秒 = 300毫秒
    // },
    // magma_burn: {
    //     scale: 1.2,
    //     color: '#ef4444',   // 红色
    //     frames: 12,
    //     fps: 12,
    //     lifetime: 600       // 0.6秒 = 600毫秒
    // },
    // shuriken_bounce: {
    //     scale: 1,
    //     color: '#fbbf24',   // 黄色
    //     frames: 6,
    //     fps: 20,
    //     lifetime: 300       // 0.3秒 = 300毫秒
    // }
};

// =============================================================================
// 粒子系统调试配置
// =============================================================================

/**
 * 粒子系统调试开关
 * 设置 PARTICLE_DEBUG.enabled = true 启用调试日志
 */
export const PARTICLE_DEBUG = {
    /** 是否启用调试模式 */
    enabled: false,
    /** 是否记录粒子生成日志 */
    logSpawns: false,
    /** 是否显示粒子计数统计 */
    showCount: false
};

// =============================================================================
// 物理爆炸粒子配置
// 用于基于速度的物理粒子系统（爆炸火花等）
// =============================================================================

/**
 * 物理爆炸粒子配置
 */
export interface ExplosionParticleConfig {
    /** 粒子数量 */
    count: number;
    /** 最小速度（像素/秒） */
    speedMin: number;
    /** 最大速度（像素/秒） */
    speedMax: number;
    /** 最小大小（像素） */
    sizeMin: number;
    /** 最大大小（像素） */
    sizeMax: number;
    /** 生命周期（毫秒） */
    life: number;
    /** 颜色 */
    color: string;
}



export enum ExplosionSize {
    SMALL = 'small',
    LARGE = 'large'
}

/**
 * 爆炸粒子配置表
 * @deprecated 废弃
 */
export const EXPLOSION_PARTICLES: Record<ExplosionSize, ExplosionParticleConfig> = {
    [ExplosionSize.SMALL]: {
        count: 8,
        speedMin: 60,       // 老版本 1 像素/帧 × 60fps = 60 像素/秒
        speedMax: 240,      // 老版本 4 像素/帧 × 60fps = 240 像素/秒
        sizeMin: 2,
        sizeMax: 4,
        life: 300,          // 0.3秒 = 300毫秒
        color: '#ffe066'    // 黄色火花
    },
    [ExplosionSize.LARGE]: {
        count: 30,
        speedMin: 180,      // 老版本 3 像素/帧 × 60fps = 180 像素/秒
        speedMax: 600,      // 老版本 10 像素/帧 × 60fps = 600 像素/秒
        sizeMin: 2,
        sizeMax: 6,
        life: 800,          // 0.8秒 = 800毫秒
        color: '#ff6600'    // 橙红色爆炸
    },
    // hit: {
    //     count: 5,
    //     speedMin: 120,      // 老版本 2 像素/帧 × 60fps = 120 像素/秒
    //     speedMax: 300,      // 老版本 5 像素/帧 × 60fps = 300 像素/秒
    //     sizeMin: 2,
    //     sizeMax: 4,
    //     life: 200,          // 0.2秒 = 200毫秒
    //     color: '#ffffff'    // 白色击中闪光
    // }
};

// =============================================================================
// 游戏效果规格配置 (EffectSpec)
// 用于游戏机制相关效果（伤害、buff、区域效果等）
// 保留用于未来扩展
// =============================================================================

/**
 * 游戏效果规格
 */
export interface EffectSpec {
    id: string;
    type: string;
    value: number;
    radius: number;
    /** 持续时间（毫秒） */
    duration: number;
}

/**
 * 游戏效果配置表
 * （保留用于未来游戏机制扩展）
 */
export const EFFECT_TABLE: Record<string, EffectSpec> = {
    // 基础伤害
    smallExplosion: {
        id: 'smallExplosion',
        type: 'damage',
        value: 120,
        radius: 24,
        duration: 150,     // 0.15秒 = 150毫秒
    },
    mediumExplosion: {
        id: 'mediumExplosion',
        type: 'damage',
        value: 180,
        radius: 32,
        duration: 200,     // 0.2秒 = 200毫秒
    },
    largeExplosion: {
        id: 'largeExplosion',
        type: 'damage',
        value: 300,
        radius: 48,
        duration: 300,     // 0.3秒 = 300毫秒
    },

    // 范围扩大
    areaExpand: {
        id: 'areaExpand',
        type: 'area',
        value: 1.5,        // 1.5 倍半径
        radius: 0,
        duration: 5000,    // 5秒 = 5000毫秒
    },

    // 持续伤害
    magmaPool: {
        id: 'magmaPool',
        type: 'dot',
        value: 15,         // 每秒 15 伤害
        radius: 40,
        duration: 3000,    // 3秒 = 3000毫秒
    },

    // 连锁闪电
    teslaChain: {
        id: 'teslaChain',
        type: 'chain',
        value: 150,
        radius: 80,
        duration: 100,     // 0.1秒 = 100毫秒
    },

    // 无敌
    invincible: {
        id: 'invincible',
        type: 'invincible',
        value: 1,
        radius: 0,
        duration: 2000,    // 2秒 = 2000毫秒
    },

    // 速度提升
    speedBoost: {
        id: 'speedBoost',
        type: 'speed',
        value: 1.3,        // 1.3 倍速度
        radius: 0,
        duration: 5000,    // 5秒 = 5000毫秒
    },

    // 射速提升
    rapidFire: {
        id: 'rapidFire',
        type: 'rapidFire',
        value: 0.8,        // 0.8 倍冷却
        radius: 0,
        duration: 5000,    // 5秒 = 5000毫秒
    },

    // 穿透提升
    penetrationBoost: {
        id: 'penetrationBoost',
        type: 'penetration',
        value: 2,          // +2 穿透
        radius: 0,
        duration: 5000,    // 5秒 = 5000毫秒
    },

    // 护盾提升
    shieldBoost: {
        id: 'shieldBoost',
        type: 'shield',
        value: 50,         // +50 护盾
        radius: 0,
        duration: 5000,    // 5秒 = 5000毫秒
    },
};

// =============================================================================
// 蓝图定义
// =============================================================================

/**
 * TimeSlow 实体蓝图
 * 拾取 TIME_SLOW 道具时创建此实体
 */
export const BLUEPRINT_TIME_SLOW: Blueprint = {
    /** 时间减速组件 */
    TimeSlow: {
        scale: 0.5,           // 50% 速度
        scope: 'global'
    },

    /** 生命周期组件 */
    Lifetime: {
        timer: 5000  // 5000毫秒 = 5秒 (与 BUFF_CONFIG[BuffType.TIME_SLOW].duration 一致)
    }
};
