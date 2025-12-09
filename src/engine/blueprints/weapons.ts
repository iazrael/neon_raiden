//
// 武器蓝图文件
// 包含游戏中所有武器类型的蓝图定义
//

import { AmmoType, EnemyAmmoType, EnemyWeaponId, WeaponId } from '../types';
import { WeaponSpec } from './types';

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
        maxLevel: 6
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
        maxLevel: 3
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
        maxLevel: 3
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
        maxLevel: 3
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
        maxLevel: 6
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
        maxLevel: 6
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
        maxLevel: 6
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
        maxLevel: 6
    }
};

// ==================== 敌人武器 ====================
export const ENEMY_WEAPON_TABLE: Record<EnemyWeaponId, WeaponSpec> = {
    [EnemyWeaponId.ENEMY_NORMAL]: { // 侦察机: 低频单发
        id: EnemyWeaponId.ENEMY_NORMAL, ammoType: EnemyAmmoType.ENEMY_ORB_RED, 
        baseCooldown: 2000, bulletCount: 1, pattern: 'aimed' 
    },
    [WeaponId.ENEMY_FAST]: { // 飞翼: 稍微快一点
        id: WeaponId.ENEMY_FAST, ammoType: AmmoType.ENEMY_PULSE, 
        baseCooldown: 1200, bulletCount: 1, pattern: 'aimed' 
    },
    [WeaponId.ENEMY_TANK]: { // 坦克: 慢速重弹
        id: WeaponId.ENEMY_TANK, ammoType: AmmoType.ENEMY_ORB_BLUE, 
        baseCooldown: 3000, bulletCount: 1, pattern: 'aimed' 
    },
    [WeaponId.ENEMY_ELITE]: { // 精英炮艇: 快速连射
        id: WeaponId.ENEMY_ELITE, ammoType: AmmoType.ENEMY_ORB_RED, 
        baseCooldown: 800, bulletCount: 3, spread: 15, pattern: 'aimed' 
    },
    [WeaponId.ENEMY_SNIPER]: { // 拦截机: 激光
        id: WeaponId.ENEMY_SNIPER, ammoType: AmmoType.ENEMY_BEAM_THIN, 
        baseCooldown: 4000, bulletCount: 1, pattern: 'aimed' // 需配合蓄力逻辑
    },
    [WeaponId.ENEMY_LAYER]: { // 布雷机: 放置地雷(这里用重弹模拟)
        id: WeaponId.ENEMY_LAYER, ammoType: AmmoType.ENEMY_ORB_GREEN, 
        baseCooldown: 1500, bulletCount: 1, pattern: 'fixed_rear' // 向后发射
    },
    [WeaponId.ENEMY_PULSAR]: { // 脉冲机: 快速散射
        id: WeaponId.ENEMY_PULSAR, ammoType: AmmoType.ENEMY_PULSE, 
        baseCooldown: 1000, bulletCount: 3, spread: 30, pattern: 'spread' 
    },
    [WeaponId.ENEMY_BARRAGE]: { // 弹幕机: 螺旋弹
        id: WeaponId.ENEMY_BARRAGE, ammoType: AmmoType.ENEMY_ORB_BLUE, 
        baseCooldown: 1500, bulletCount: 8, spread: 360, pattern: 'spiral' 
    },
}

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

   // ==================== Boss 武器 ====================
    
    // --- Guardian ---
    [WeaponId.BOSS_GUARDIAN_RADIAL]: {
        id: WeaponId.BOSS_GUARDIAN_RADIAL, ammoType: AmmoType.ENEMY_ORB_BLUE,
        baseCooldown: 1000, bulletCount: 6, spread: 360, pattern: 'radial'
    },
    [WeaponId.BOSS_GUARDIAN_RADIAL_ENRAGED]: {
        id: WeaponId.BOSS_GUARDIAN_RADIAL_ENRAGED, ammoType: AmmoType.ENEMY_ORB_RED,
        baseCooldown: 600, bulletCount: 12, spread: 360, pattern: 'radial'
    },

    // --- Destroyer ---
    [WeaponId.BOSS_DESTROYER_MAIN]: {
        id: WeaponId.BOSS_DESTROYER_MAIN, ammoType: AmmoType.ENEMY_MISSILE,
        baseCooldown: 800, bulletCount: 4, spread: 60, pattern: 'spread'
    },
    [WeaponId.BOSS_DESTROYER_DASH]: {
        id: WeaponId.BOSS_DESTROYER_DASH, ammoType: AmmoType.ENEMY_ORB_RED, // 换个颜色区分
        baseCooldown: 400, bulletCount: 3, spread: 120, pattern: 'spread'
    },
    [WeaponId.BOSS_DESTROYER_BERSERK]: {
        id: WeaponId.BOSS_DESTROYER_BERSERK, ammoType: AmmoType.ENEMY_ORB_RED,
        baseCooldown: 200, bulletCount: 2, spread: 360, pattern: 'spiral'
    },

    // --- Titan ---
    [WeaponId.BOSS_TITAN_LASER_BASE]: {
        id: WeaponId.BOSS_TITAN_LASER_BASE, ammoType: AmmoType.ENEMY_BEAM_THICK,
        baseCooldown: 2000, bulletCount: 1, pattern: 'aimed'
    },
    [WeaponId.BOSS_TITAN_LASER_RAPID]: {
        id: WeaponId.BOSS_TITAN_LASER_RAPID, ammoType: AmmoType.ENEMY_BEAM_THIN,
        baseCooldown: 1000, bulletCount: 3, spread: 30, pattern: 'aimed'
    },
    [WeaponId.BOSS_TITAN_OMNI]: {
        id: WeaponId.BOSS_TITAN_OMNI, ammoType: AmmoType.ENEMY_ORB_GREEN,
        baseCooldown: 800, bulletCount: 36, spread: 360, pattern: 'radial'
    },

    // --- Apocalypse ---
    [WeaponId.BOSS_APOCALYPSE_MIXED]: {
        id: WeaponId.BOSS_APOCALYPSE_MIXED, ammoType: AmmoType.ENEMY_ORB_RED, // 简单点，先用红球
        baseCooldown: 1000, bulletCount: 8, spread: 360, pattern: 'radial' // 实际应该支持 mixed pattern
    },
    [WeaponId.BOSS_APOCALYPSE_DEFENSE]: {
        id: WeaponId.BOSS_APOCALYPSE_DEFENSE, ammoType: AmmoType.ENEMY_MISSILE,
        baseCooldown: 1500, bulletCount: 4, spread: 45, pattern: 'aimed'
    },
    [WeaponId.BOSS_APOCALYPSE_BERSERK]: {
        id: WeaponId.BOSS_APOCALYPSE_BERSERK, ammoType: AmmoType.ENEMY_BEAM_THICK,
        baseCooldown: 300, bulletCount: 1, pattern: 'aimed' // 极快点名
    },
    [WeaponId.BOSS_APOCALYPSE_FINAL]: {
        id: WeaponId.BOSS_APOCALYPSE_FINAL, ammoType: AmmoType.ENEMY_VOID_ORB,
        baseCooldown: 100, bulletCount: 16, spread: 360, pattern: 'spiral'
    },

    // --- Generic Boss Weapons ---
    [WeaponId.BOSS_GENERIC_TARGETED]: { id: WeaponId.BOSS_GENERIC_TARGETED, baseCooldown: 1000, ammoType: AmmoType.ENEMY_ORB_RED, bulletCount: 1, pattern: 'aimed' },
    [WeaponId.BOSS_GENERIC_RADIAL]: { id: WeaponId.BOSS_GENERIC_RADIAL, baseCooldown: 1200, ammoType: AmmoType.ENEMY_ORB_BLUE, bulletCount: 8, spread: 360, pattern: 'radial' },
    [WeaponId.BOSS_GENERIC_LASER]: { id: WeaponId.BOSS_GENERIC_LASER, baseCooldown: 2500, ammoType: AmmoType.ENEMY_BEAM_THIN, bulletCount: 1, pattern: 'aimed' },
    [WeaponId.BOSS_GENERIC_SPREAD]: { id: WeaponId.BOSS_GENERIC_SPREAD, baseCooldown: 1000, ammoType: AmmoType.ENEMY_ORB_GREEN, bulletCount: 5, spread: 90, pattern: 'spread' },
    [WeaponId.BOSS_GENERIC_HOMING]: { id: WeaponId.BOSS_GENERIC_HOMING, baseCooldown: 1500, ammoType: AmmoType.ENEMY_MISSILE, bulletCount: 2, pattern: 'aimed' },
};