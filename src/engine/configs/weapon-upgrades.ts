//
// 武器升级配置表
// 定义每种武器在不同等级时的伤害倍率、射速倍率及扩展属性
//

import { WeaponId } from '../types';
import { WeaponUpgradeSpec } from '../blueprints/base';

/**
 * 武器升级配置表
 *
 * 属性说明：
 * - damageMultiplier: 伤害倍率，子弹实际伤害 = 弹药基础伤害 × 此倍率
 * - fireRateMultiplier: 射速倍率，实际冷却时间 = 武器基础冷却 / 此倍率
 * - bulletCount: 发射子弹数量（覆盖 WeaponSpec.bulletCount）
 * - spread: 散射角度（度数，覆盖 WeaponSpec.spread）
 * - sizeMultiplier: 尺寸倍率（影响 Sprite.scale 和 HitBox.radius）
 * - homing: 导弹索敌配置（searchRange, turnSpeed）
 * - chain: 特斯拉连锁配置（count, range）
 * - laser: 激光光束配置（beamCount, widthMultiplier）
 */
export const WEAPON_UPGRADE_TABLE: Record<WeaponId, WeaponUpgradeSpec> = {
    // ==================== VULCAN ====================
    [WeaponId.VULCAN]: {
        id: WeaponId.VULCAN,
        levels: [
            { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0, bulletCount: 1, spread: 0 },
            { level: 2, damageMultiplier: 1.1, fireRateMultiplier: 1.05, bulletCount: 2, spread: 3 },
            { level: 3, damageMultiplier: 1.2, fireRateMultiplier: 1.1, bulletCount: 3, spread: 6 },
            { level: 4, damageMultiplier: 1.3, fireRateMultiplier: 1.15, bulletCount: 4, spread: 9 },
            { level: 5, damageMultiplier: 1.4, fireRateMultiplier: 1.2, bulletCount: 5, spread: 12 },
            { level: 6, damageMultiplier: 1.5, fireRateMultiplier: 1.25, bulletCount: 6, spread: 15 },
        ],
    },

    // ==================== LASER ====================
    [WeaponId.LASER]: {
        id: WeaponId.LASER,
        levels: [
            { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0, laser: { beamCount: 1, widthMultiplier: 1.0 } },
            { level: 2, damageMultiplier: 1.3, fireRateMultiplier: 1.15, laser: { beamCount: 1, widthMultiplier: 1.5 } },
            { level: 3, damageMultiplier: 1.6, fireRateMultiplier: 1.3, laser: { beamCount: 2, widthMultiplier: 2.0 } },
        ],
    },

    // ==================== MISSILE ====================
    [WeaponId.MISSILE]: {
        id: WeaponId.MISSILE,
        levels: [
            {
                level: 1,
                damageMultiplier: 1.0,
                fireRateMultiplier: 1.0,
                bulletCount: 1,
                homing: { searchRange: 600, turnSpeed: 0.15 },
            },
            {
                level: 2,
                damageMultiplier: 1.4,
                fireRateMultiplier: 1.2,
                bulletCount: 2,
                homing: { searchRange: 600, turnSpeed: 0.15 },
            },
            {
                level: 3,
                damageMultiplier: 1.8,
                fireRateMultiplier: 1.4,
                bulletCount: 3,
                homing: { searchRange: 700, turnSpeed: 0.20 },
            },
        ],
    },

    // ==================== WAVE ====================
    [WeaponId.WAVE]: {
        id: WeaponId.WAVE,
        levels: [
            { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0, sizeMultiplier: 1.0 },
            { level: 2, damageMultiplier: 1.3, fireRateMultiplier: 1.15, sizeMultiplier: 1.3 },
            { level: 3, damageMultiplier: 1.6, fireRateMultiplier: 1.3, sizeMultiplier: 1.6 },
        ],
    },

    // ==================== PLASMA ====================
    [WeaponId.PLASMA]: {
        id: WeaponId.PLASMA,
        levels: [
            { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0, sizeMultiplier: 1.0 },
            { level: 2, damageMultiplier: 1.25, fireRateMultiplier: 1.1, sizeMultiplier: 1.3 },
            { level: 3, damageMultiplier: 1.5, fireRateMultiplier: 1.2, sizeMultiplier: 1.6 },
            { level: 4, damageMultiplier: 1.75, fireRateMultiplier: 1.3, sizeMultiplier: 1.9 },
            { level: 5, damageMultiplier: 2.0, fireRateMultiplier: 1.4, sizeMultiplier: 2.2 },
            { level: 6, damageMultiplier: 2.5, fireRateMultiplier: 1.5, sizeMultiplier: 2.5 },
        ],
    },

    // ==================== TESLA ====================
    [WeaponId.TESLA]: {
        id: WeaponId.TESLA,
        levels: [
            { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0, chain: { count: 2, range: 500 } },
            { level: 2, damageMultiplier: 1.2, fireRateMultiplier: 1.1, chain: { count: 3, range: 700 } },
            { level: 3, damageMultiplier: 1.4, fireRateMultiplier: 1.2, chain: { count: 3, range: 1000 } },
            { level: 4, damageMultiplier: 1.6, fireRateMultiplier: 1.3, chain: { count: 4, range: 1200 } },
            { level: 5, damageMultiplier: 1.8, fireRateMultiplier: 1.4, chain: { count: 4, range: 1500 } },
            { level: 6, damageMultiplier: 2.0, fireRateMultiplier: 1.5, chain: { count: 5, range: 1700 } },
        ],
    },

    // ==================== MAGMA ====================
    [WeaponId.MAGMA]: {
        id: WeaponId.MAGMA,
        levels: [
            { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0, bulletCount: 2, spread: 15 },
            { level: 2, damageMultiplier: 1.2, fireRateMultiplier: 1.1, bulletCount: 2, spread: 20 },
            { level: 3, damageMultiplier: 1.4, fireRateMultiplier: 1.2, bulletCount: 3, spread: 25 },
            { level: 4, damageMultiplier: 1.6, fireRateMultiplier: 1.3, bulletCount: 3, spread: 30 },
            { level: 5, damageMultiplier: 1.8, fireRateMultiplier: 1.4, bulletCount: 4, spread: 35 },
            { level: 6, damageMultiplier: 2.0, fireRateMultiplier: 1.5, bulletCount: 4, spread: 40 },
        ],
    },

    // ==================== SHURIKEN ====================
    [WeaponId.SHURIKEN]: {
        id: WeaponId.SHURIKEN,
        levels: [
            { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0, bulletCount: 1, spread: 0 },
            { level: 2, damageMultiplier: 1.2, fireRateMultiplier: 1.1, bulletCount: 2, spread: 10 },
            { level: 3, damageMultiplier: 1.4, fireRateMultiplier: 1.2, bulletCount: 3, spread: 15 },
            { level: 4, damageMultiplier: 1.6, fireRateMultiplier: 1.3, bulletCount: 3, spread: 20 },
            { level: 5, damageMultiplier: 1.8, fireRateMultiplier: 1.4, bulletCount: 4, spread: 25 },
            { level: 6, damageMultiplier: 2.0, fireRateMultiplier: 1.5, bulletCount: 4, spread: 30 },
        ],
    },
};

/**
 * 获取指定武器等级的升级配置
 * @param weaponId 武器 ID
 * @param level 武器等级（从 1 开始）
 * @returns 升级配置，如果未找到则返回默认值
 */
export function getWeaponUpgrade(weaponId: WeaponId, level: number) {
    const weaponUpgrades = WEAPON_UPGRADE_TABLE[weaponId];
    if (!weaponUpgrades) {
        return {
            level: 1,
            damageMultiplier: 1.0,
            fireRateMultiplier: 1.0,
        };
    }
    const levelSpec = weaponUpgrades.levels.find((l) => l.level === level);
    return (
        levelSpec || {
            level: 1,
            damageMultiplier: 1.0,
            fireRateMultiplier: 1.0,
        }
    );
}

/**
 * 获取指定武器的最大等级
 * @param weaponId 武器 ID
 * @returns 最大等级，如果未找到则返回 1
 */
export function getWeaponMaxLevel(weaponId: WeaponId): number {
    const weaponUpgrades = WEAPON_UPGRADE_TABLE[weaponId];
    if (!weaponUpgrades || weaponUpgrades.levels.length === 0) {
        return 1;
    }
    return weaponUpgrades.levels[weaponUpgrades.levels.length - 1].level;
}

/**
 * 获取全局武器最大等级（所有武器中的最大值）
 * 用于 PickupSystem 等需要检查上限的场景
 * @returns 全局最大等级
 */
export function getGlobalMaxWeaponLevel(): number {
    let maxLevel = 1;
    for (const weaponId of Object.keys(WEAPON_UPGRADE_TABLE) as WeaponId[]) {
        const weaponMaxLevel = getWeaponMaxLevel(weaponId);
        if (weaponMaxLevel > maxLevel) {
            maxLevel = weaponMaxLevel;
        }
    }
    return maxLevel;
}

/**
 * 获取全局最大子弹数量（所有武器配置中的最大 bulletCount）
 * 用于 PickupSystem 等需要检查上限的场景
 * @returns 全局最大子弹数量
 */
export function getGlobalMaxBulletCount(): number {
    let maxCount = 1;
    for (const weaponUpgrades of Object.values(WEAPON_UPGRADE_TABLE)) {
        for (const levelSpec of weaponUpgrades.levels) {
            if (levelSpec.bulletCount !== undefined && levelSpec.bulletCount > maxCount) {
                maxCount = levelSpec.bulletCount;
            }
        }
    }
    return maxCount;
}

/**
 * 武器限制常量（从 WEAPON_UPGRADE_TABLE 动态计算）
 * 用于与 POWERUP_LIMITS 保持数据一致性
 */
export const WEAPON_LIMITS = {
    /** 全局武器最大等级 */
    MAX_WEAPON_LEVEL: getGlobalMaxWeaponLevel(),
    /** 全局最大子弹数量 */
    MAX_BULLET_COUNT: getGlobalMaxBulletCount(),
} as const;
