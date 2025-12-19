//
// 武器蓝图文件
// 包含游戏中所有武器类型的蓝图定义
//

import { AmmoType, EnemyWeaponId, WeaponId, WeaponPattern } from '@/engine/types';
import { EnemyWeaponSpec, WeaponSpec } from './types';

/**
 * 武器配置表
 * 包含所有武器的配置信息
 */
export const WEAPON_TABLE: Record<WeaponId, WeaponSpec> = {
    /**
     * 火神炮武器蓝图
     * 基础武器，射速快但单发伤害较低
     */
    [WeaponId.VULCAN]: {
        id: WeaponId.VULCAN,
        ammoType: AmmoType.VULCAN_SPREAD,
        cooldown: 150,
        curCD: 0,
        maxLevel: 6,
        bulletCount: 1,
        spread: 0,
        pattern: WeaponPattern.SPREAD,
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        pierce: 0,
        bounces: 0
    },

    /**
     * 激光武器蓝图
     * 高穿透武器，适合对付装甲目标
     */
    [WeaponId.LASER]: {
        /** 武器组件 - 设置武器的弹药类型和冷却时间 */
        id: WeaponId.LASER,
        ammoType: AmmoType.LASER_BEAM,
        cooldown: 180,
        curCD: 0,
        maxLevel: 3,
        bulletCount: 1,
        spread: 0,
        pattern: WeaponPattern.AIMED,
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        pierce: 5,  // 高穿透
        bounces: 0
    },

    /**
     * 导弹武器蓝图
     * 智能追踪武器，能够自动锁定目标
     */
    [WeaponId.MISSILE]: {
        /** 武器组件 - 设置武器的弹药类型和冷却时间 */
        id: WeaponId.MISSILE,
        ammoType: AmmoType.MISSILE_HOMING,
        cooldown: 400,
        curCD: 0,
        maxLevel: 3,
        bulletCount: 1,
        spread: 0,
        pattern: WeaponPattern.AIMED,
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        pierce: 0,
        bounces: 0
    },

    /**
     * 波浪炮武器蓝图
     * 范围攻击武器，能够同时打击多个目标
     */
    [WeaponId.WAVE]: {
        /** 武器组件 - 设置武器的弹药类型和冷却时间 */
        id: WeaponId.WAVE,
        ammoType: AmmoType.WAVE_PULSE,
        cooldown: 400,
        curCD: 0,
        maxLevel: 3,
        bulletCount: 3,
        spread: 30,
        pattern: WeaponPattern.SPREAD,
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        pierce: 0,
        bounces: 0
    },

    /**
     * 等离子炮武器蓝图
     * 高伤害武器，具有强大的破坏力
     */
    [WeaponId.PLASMA]: {
        /** 武器组件 - 设置武器的弹药类型和冷却时间 */
        id: WeaponId.PLASMA,
        ammoType: AmmoType.PLASMA_ORB,
        cooldown: 600,
        curCD: 0,
        maxLevel: 6,
        bulletCount: 1,
        spread: 0,
        pattern: WeaponPattern.AIMED,
        damageMultiplier: 2.0,  // 高伤害
        fireRateMultiplier: 1.0,
        pierce: 0,
        bounces: 0
    },

    /**
     * 特斯拉武器蓝图
     * 连锁闪电武器，能够在敌人间跳跃
     */
    [WeaponId.TESLA]: {
        /** 武器组件 - 设置武器的弹药类型和冷却时间 */
        id: WeaponId.TESLA,
        ammoType: AmmoType.TESLA_CHAIN,
        cooldown: 200,
        curCD: 0,
        maxLevel: 6,
        bulletCount: 1,
        spread: 0,
        pattern: WeaponPattern.AIMED,
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        pierce: 0,
        bounces: 0
    },

    /**
     * 熔岩炮武器蓝图
     * 持续伤害武器，能够造成燃烧效果
     */
    [WeaponId.MAGMA]: {
        /** 武器组件 - 设置武器的弹药类型和冷却时间 */
        id: WeaponId.MAGMA,
        ammoType: AmmoType.MAGMA_POOL,
        cooldown: 220,
        curCD: 0,
        maxLevel: 6,
        bulletCount: 1,
        spread: 0,
        pattern: WeaponPattern.AIMED,
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        pierce: 0,
        bounces: 0
    },

    /**
     * 手里剑武器蓝图
     * 高速旋转武器，能够反弹攻击
     */
    [WeaponId.SHURIKEN]: {
        /** 武器组件 - 设置武器的弹药类型和冷却时间 */
        id: WeaponId.SHURIKEN,
        ammoType: AmmoType.SHURIKEN_BOUNCE,
        cooldown: 300,
        curCD: 0,
        maxLevel: 6,
        bulletCount: 1,
        spread: 0,
        pattern: WeaponPattern.AIMED,
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        pierce: 0,
        bounces: 3  // 高反弹
    }
};

// ==================== 敌人武器 ====================
export const ENEMY_WEAPON_TABLE: Record<EnemyWeaponId, EnemyWeaponSpec> = {
    [EnemyWeaponId.ENEMY_NORMAL]: { // 侦察机: 低频单发
        id: EnemyWeaponId.ENEMY_NORMAL, ammoType: AmmoType.ENEMY_ORB_RED,
        cooldown: 2000, bulletCount: 1, pattern: WeaponPattern.AIMED
    },
    [EnemyWeaponId.ENEMY_FAST]: { // 飞翼: 稍微快一点
        id: EnemyWeaponId.ENEMY_FAST, ammoType: AmmoType.ENEMY_PULSE,
        cooldown: 1200, bulletCount: 1, pattern: WeaponPattern.AIMED
    },
    [EnemyWeaponId.ENEMY_TANK]: { // 坦克: 慢速重弹
        id: EnemyWeaponId.ENEMY_TANK, ammoType: AmmoType.ENEMY_ORB_BLUE,
        cooldown: 3000, bulletCount: 1, pattern: WeaponPattern.AIMED
    },
    [EnemyWeaponId.ENEMY_ELITE]: { // 精英炮艇: 快速连射
        id: EnemyWeaponId.ENEMY_ELITE, ammoType: AmmoType.ENEMY_ORB_RED,
        cooldown: 800, bulletCount: 3, spread: 15, pattern: WeaponPattern.AIMED
    },
    [EnemyWeaponId.ENEMY_SNIPER]: { // 拦截机: 激光
        id: EnemyWeaponId.ENEMY_SNIPER, ammoType: AmmoType.ENEMY_BEAM_THIN,
        cooldown: 4000, bulletCount: 1, pattern: WeaponPattern.AIMED // 需配合蓄力逻辑
    },
    [EnemyWeaponId.ENEMY_LAYER]: { // 布雷机: 放置地雷(这里用重弹模拟)
        id: EnemyWeaponId.ENEMY_LAYER, ammoType: AmmoType.ENEMY_ORB_GREEN,
        cooldown: 1500, bulletCount: 1, pattern: WeaponPattern.FIXED_REAR // 向后发射
    },
    [EnemyWeaponId.ENEMY_PULSAR]: { // 脉冲机: 快速散射
        id: EnemyWeaponId.ENEMY_PULSAR, ammoType: AmmoType.ENEMY_PULSE,
        cooldown: 1000, bulletCount: 3, spread: 30, pattern: WeaponPattern.SPREAD
    },
    [EnemyWeaponId.ENEMY_BARRAGE]: { // 弹幕机: 螺旋弹
        id: EnemyWeaponId.ENEMY_BARRAGE, ammoType: AmmoType.ENEMY_ORB_BLUE,
        cooldown: 1500, bulletCount: 8, spread: 360, pattern: WeaponPattern.SPIRAL
    },

    // ==================== Boss 武器 ====================

    // === Guardian ===
    [EnemyWeaponId.GUARDIAN_RADIAL]: {
        id: EnemyWeaponId.GUARDIAN_RADIAL,
        ammoType: AmmoType.ENEMY_ORB_BLUE,
        cooldown: 1000,
        bulletCount: 6,
        spread: 360,
        pattern: WeaponPattern.RADIAL
    },
    [EnemyWeaponId.GUARDIAN_RADIAL_ENRAGED]: {
        id: EnemyWeaponId.GUARDIAN_RADIAL_ENRAGED,
        cooldown: 600,
        ammoType: AmmoType.ENEMY_ORB_RED,
        bulletCount: 12,
        spread: 360,
        pattern: WeaponPattern.RADIAL
    },

    // === Destroyer ===
    [EnemyWeaponId.DESTROYER_MAIN]: {
        id: EnemyWeaponId.DESTROYER_MAIN,
        cooldown: 800,
        ammoType: AmmoType.ENEMY_MISSILE,
        bulletCount: 4,
        spread: 60,
        pattern: WeaponPattern.SPREAD
    },
    [EnemyWeaponId.DESTROYER_DASH]: {
        cooldown: 400, // 冲刺时射速快
        id: EnemyWeaponId.DESTROYER_DASH,
        ammoType: AmmoType.ENEMY_ORB_BLUE,
        bulletCount: 3,
        spread: 120,
        pattern: WeaponPattern.SPREAD
    },
    [EnemyWeaponId.DESTROYER_BERSERK]: {
        cooldown: 200, // 极快
        id: EnemyWeaponId.DESTROYER_BERSERK,
        ammoType: AmmoType.ENEMY_ORB_RED,
        bulletCount: 2, // 螺旋
        spread: 360,
        pattern: WeaponPattern.SPIRAL // 螺旋发射
    },

    // === Titan ===
    [EnemyWeaponId.TITAN_LASER_BASE]: {
        id: EnemyWeaponId.TITAN_LASER_BASE,
        cooldown: 2000,
        ammoType: AmmoType.ENEMY_BEAM_THICK,
        spread: 0,
        bulletCount: 1,
        pattern: WeaponPattern.AIMED
    },
    [EnemyWeaponId.TITAN_LASER_RAPID]: {
        id: EnemyWeaponId.TITAN_LASER_RAPID,
        cooldown: 1000,
        ammoType: AmmoType.ENEMY_BEAM_THIN,
        bulletCount: 3,
        spread: 30,
        pattern: WeaponPattern.AIMED
    },
    [EnemyWeaponId.TITAN_OMNI]: {
        id: EnemyWeaponId.TITAN_OMNI,
        cooldown: 800,
        ammoType: AmmoType.ENEMY_ORB_GREEN,
        bulletCount: 36,
        spread: 360,
        pattern: WeaponPattern.RADIAL
    },

    // === Apocalypse (终极缝合怪) ===
    [EnemyWeaponId.APOCALYPSE_MIXED]: {
        id: EnemyWeaponId.APOCALYPSE_MIXED,
        cooldown: 1000,
        ammoType: AmmoType.ENEMY_ORB_RED,
        bulletCount: 8,
        spread: 360,
        pattern: WeaponPattern.RADIAL // 混合弹幕
    },
    [EnemyWeaponId.APOCALYPSE_DEFENSE]: {
        id: EnemyWeaponId.APOCALYPSE_DEFENSE,
        cooldown: 1500,
        ammoType: AmmoType.ENEMY_MISSILE,
        bulletCount: 4,
        spread: 0,
        pattern: WeaponPattern.AIMED
    },
    [EnemyWeaponId.APOCALYPSE_BERSERK]: {
        id: EnemyWeaponId.APOCALYPSE_BERSERK,
        cooldown: 300,
        ammoType: AmmoType.ENEMY_BEAM_THIN,
        spread: 0,
        bulletCount: 1,
        pattern: WeaponPattern.RANDOM // 随机点名
    },
    [EnemyWeaponId.APOCALYPSE_FINAL]: {
        id: EnemyWeaponId.APOCALYPSE_FINAL,
        cooldown: 100, // 弹幕地狱
        ammoType: AmmoType.ENEMY_VOID_ORB,
        bulletCount: 16,
        spread: 360,
        pattern: WeaponPattern.SPIRAL
    },

    // --- Generic Boss Weapons ---
    [EnemyWeaponId.GENERIC_TARGETED]: { id: EnemyWeaponId.GENERIC_TARGETED, cooldown: 1000, ammoType: AmmoType.ENEMY_ORB_RED, bulletCount: 1, pattern: WeaponPattern.AIMED },
    [EnemyWeaponId.GENERIC_RADIAL]: { id: EnemyWeaponId.GENERIC_RADIAL, cooldown: 1200, ammoType: AmmoType.ENEMY_ORB_BLUE, bulletCount: 8, spread: 360, pattern: WeaponPattern.RADIAL },
    [EnemyWeaponId.GENERIC_LASER]: { id: EnemyWeaponId.GENERIC_LASER, cooldown: 2500, ammoType: AmmoType.ENEMY_BEAM_THIN, bulletCount: 1, pattern: WeaponPattern.AIMED },
    [EnemyWeaponId.GENERIC_SPREAD]: { id: EnemyWeaponId.GENERIC_SPREAD, cooldown: 1000, ammoType: AmmoType.ENEMY_ORB_GREEN, bulletCount: 5, spread: 90, pattern: WeaponPattern.SPREAD },
    [EnemyWeaponId.GENERIC_HOMING]: { id: EnemyWeaponId.GENERIC_HOMING, cooldown: 1500, ammoType: AmmoType.ENEMY_MISSILE, bulletCount: 2, pattern: WeaponPattern.AIMED },
};