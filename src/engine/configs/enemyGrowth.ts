//
// 敌人成长和行为配置文件
// 定义敌人行为模式和随关卡提升的属性成长
//

import { EnemyId } from '../types';

/**
 * 敌人行为类型
 */
export enum EnemyBehavior {
    IDLE = 'idle',
    MOVE_DOWN = 'move_down',
    SINE_WAVE = 'sine_wave',
    CHASE = 'chase',
    RAM = 'ram',
    STRAFE = 'strafe',
    CIRCLE = 'circle'
}

/**
 * 敌人完整配置
 */
export interface EnemyConfig {
    // ========== 行为配置 ==========
    /** 移动速度（像素/秒） */
    moveSpeed: number;

    /** 开火间隔（毫秒），会加入随机波动 */
    fireInterval: number;

    /** 行为模式 */
    behavior: EnemyBehavior;

    // ========== 成长配置 ==========
    /** 基础血量 */
    baseHp: number;

    /** 每级增加血量 */
    hpPerLevel: number;

    /** 基础伤害倍率 */
    baseDamage: number;

    /** 每级增加伤害倍率 */
    damagePerLevel: number;

    /** 基础射速倍率 */
    baseFireRate: number;

    /** 每级增加射速倍率 */
    fireRatePerLevel: number;

    /** 击杀得分 */
    score: number;
}

/**
 * 敌人行为配置（仅行为相关字段）
 */
export interface EnemyBehaviorConfig {
    moveSpeed: number;
    fireInterval: number;
    behavior: EnemyBehavior;
}

/**
 * 敌人配置表
 * 包含行为配置和成长数据
 */
export const ENEMY_CONFIGS: Record<EnemyId, EnemyConfig> = {
    // NORMAL - 普通敌人：正弦波移动，平衡属性
    [EnemyId.NORMAL]: {
        moveSpeed: 100,
        fireInterval: 2000,
        behavior: EnemyBehavior.SINE_WAVE,

        baseHp: 30,
        hpPerLevel: 10,
        baseDamage: 1.0,
        damagePerLevel: 0.1,
        baseFireRate: 1.0,
        fireRatePerLevel: 0.05,
        score: 100,
    },

    // FAST - 快速敌人：直线向下，低血高攻
    [EnemyId.FAST]: {
        moveSpeed: 250,
        fireInterval: 1500,
        behavior: EnemyBehavior.MOVE_DOWN,

        baseHp: 10,
        hpPerLevel: 2,
        baseDamage: 0.8,
        damagePerLevel: 0.05,
        baseFireRate: 1.2,
        fireRatePerLevel: 0.08,
        score: 200,
    },

    // TANK - 坦克：慢速，高血量
    [EnemyId.TANK]: {
        moveSpeed: 50,
        fireInterval: 3000,
        behavior: EnemyBehavior.MOVE_DOWN,

        baseHp: 60,
        hpPerLevel: 20,
        baseDamage: 1.2,
        damagePerLevel: 0.15,
        baseFireRate: 0.9,
        fireRatePerLevel: 0.03,
        score: 300,
    },

    // KAMIKAZE - 神风特攻：追踪冲撞，不开火
    [EnemyId.KAMIKAZE]: {
        moveSpeed: 200,
        fireInterval: Infinity,  // 不开火
        behavior: EnemyBehavior.CHASE,

        baseHp: 5,
        hpPerLevel: 1,
        baseDamage: 1.0,
        damagePerLevel: 0.0,
        baseFireRate: 1.0,
        fireRatePerLevel: 0.0,
        score: 400,
    },

    // ELITE_GUNBOAT - 精英炮艇：快速连射
    [EnemyId.ELITE_GUNBOAT]: {
        moveSpeed: 80,
        fireInterval: 500,
        behavior: EnemyBehavior.STRAFE,

        baseHp: 100,
        hpPerLevel: 10,
        baseDamage: 1.5,
        damagePerLevel: 0.1,
        baseFireRate: 1.3,
        fireRatePerLevel: 0.08,
        score: 500,
    },

    // LASER_INTERCEPTOR - 激光拦截机
    [EnemyId.LASER_INTERCEPTOR]: {
        moveSpeed: 150,
        fireInterval: 2500,
        behavior: EnemyBehavior.STRAFE,

        baseHp: 80,
        hpPerLevel: 15,
        baseDamage: 1.3,
        damagePerLevel: 0.12,
        baseFireRate: 1.1,
        fireRatePerLevel: 0.06,
        score: 600,
    },

    // MINE_LAYER - 布雷船
    [EnemyId.MINE_LAYER]: {
        moveSpeed: 100,
        fireInterval: 2000,
        behavior: EnemyBehavior.MOVE_DOWN,

        baseHp: 60,
        hpPerLevel: 10,
        baseDamage: 1.1,
        damagePerLevel: 0.08,
        baseFireRate: 1.0,
        fireRatePerLevel: 0.05,
        score: 700,
    },

    // PULSAR - 脉冲敌人
    [EnemyId.PULSAR]: {
        moveSpeed: 200,
        fireInterval: 1800,
        behavior: EnemyBehavior.SINE_WAVE,

        baseHp: 15,
        hpPerLevel: 5,
        baseDamage: 1.2,
        damagePerLevel: 0.1,
        baseFireRate: 1.15,
        fireRatePerLevel: 0.07,
        score: 250,
    },

    // FORTRESS - 堡垒敌人
    [EnemyId.FORTRESS]: {
        moveSpeed: 50,
        fireInterval: 1000,
        behavior: EnemyBehavior.CIRCLE,

        baseHp: 200,
        hpPerLevel: 10,
        baseDamage: 2.0,
        damagePerLevel: 0.15,
        baseFireRate: 1.2,
        fireRatePerLevel: 0.1,
        score: 800,
    },

    // STALKER - 追踪者
    [EnemyId.STALKER]: {
        moveSpeed: 250,
        fireInterval: 1500,
        behavior: EnemyBehavior.CHASE,

        baseHp: 30,
        hpPerLevel: 10,
        baseDamage: 1.1,
        damagePerLevel: 0.1,
        baseFireRate: 1.1,
        fireRatePerLevel: 0.06,
        score: 350,
    },

    // BARRAGE - 弹幕敌人
    [EnemyId.BARRAGE]: {
        moveSpeed: 100,
        fireInterval: 800,
        behavior: EnemyBehavior.STRAFE,

        baseHp: 100,
        hpPerLevel: 10,
        baseDamage: 1.3,
        damagePerLevel: 0.1,
        baseFireRate: 1.4,
        fireRatePerLevel: 0.1,
        score: 600,
    },
};

/**
 * 计算敌人当前等级的各项属性
 * @param enemyId 敌人类型
 * @param level 关卡等级（从 1 开始）
 * @returns 计算后的属性对象
 */
export function getEnemyStats(enemyId: EnemyId, level: number) {
    const config = ENEMY_CONFIGS[enemyId];
    if (!config) {
        // 默认值，防止崩溃
        return {
            hp: 30,
            damageMultiplier: 1.0,
            fireRateMultiplier: 1.0,
            score: 100
        };
    }

    // 计算等级加成（level 从 1 开始，level=1 时为无加成）
    const levelBonus = level - 1;

    return {
        /** 当前血量 = 基础 + 每级增量 × (level-1) */
        hp: config.baseHp + config.hpPerLevel * levelBonus,

        /** 伤害倍率 = 基础 + 每级增量 × (level-1) */
        damageMultiplier: config.baseDamage + config.damagePerLevel * levelBonus,

        /** 射速倍率 = 基础 + 每级增量 × (level-1) */
        fireRateMultiplier: config.baseFireRate + config.fireRatePerLevel * levelBonus,

        /** 击杀得分 */
        score: config.score
    };
}

/**
 * 获取敌人行为配置（行为不随关卡变化）
 * @param enemyId 敌人类型
 * @returns 行为配置
 */
export function getEnemyBehavior(enemyId: EnemyId): EnemyBehaviorConfig {
    const config = ENEMY_CONFIGS[enemyId];
    if (!config) {
        // 默认行为
        return {
            moveSpeed: 100,
            fireInterval: 2000,
            behavior: EnemyBehavior.MOVE_DOWN
        };
    }

    return {
        moveSpeed: config.moveSpeed,
        fireInterval: config.fireInterval,
        behavior: config.behavior
    };
}
