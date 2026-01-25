//
// 武器升级配置表
// 定义每种武器在不同等级时的伤害倍率和射速倍率
//

import { WeaponId } from '../types';
import { WeaponUpgradeSpec } from '../blueprints/base';

/**
 * 武器升级配置表
 * damageMultiplier: 伤害倍率，子弹实际伤害 = 弹药基础伤害 × 此倍率
 * fireRateMultiplier: 射速倍率，实际冷却时间 = 武器基础冷却 / 此倍率
 */
export const WEAPON_UPGRADE_TABLE: Record<WeaponId, WeaponUpgradeSpec> = {
    [WeaponId.VULCAN]: {
        id: WeaponId.VULCAN,
        levels: [
            { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0 },
            { level: 2, damageMultiplier: 1.2, fireRateMultiplier: 1.1 },
            { level: 3, damageMultiplier: 1.4, fireRateMultiplier: 1.2 },
            { level: 4, damageMultiplier: 1.6, fireRateMultiplier: 1.3 },
            { level: 5, damageMultiplier: 1.8, fireRateMultiplier: 1.4 },
            { level: 6, damageMultiplier: 2.0, fireRateMultiplier: 1.5 },
        ],
    },

    [WeaponId.LASER]: {
        id: WeaponId.LASER,
        levels: [
            { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0 },
            { level: 2, damageMultiplier: 1.3, fireRateMultiplier: 1.15 },
            { level: 3, damageMultiplier: 1.6, fireRateMultiplier: 1.3 },
        ],
    },

    [WeaponId.MISSILE]: {
        id: WeaponId.MISSILE,
        levels: [
            { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0 },
            { level: 2, damageMultiplier: 1.4, fireRateMultiplier: 1.2 },
            { level: 3, damageMultiplier: 1.8, fireRateMultiplier: 1.4 },
        ],
    },

    [WeaponId.WAVE]: {
        id: WeaponId.WAVE,
        levels: [
            { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0 },
            { level: 2, damageMultiplier: 1.3, fireRateMultiplier: 1.15 },
            { level: 3, damageMultiplier: 1.6, fireRateMultiplier: 1.3 },
        ],
    },

    [WeaponId.PLASMA]: {
        id: WeaponId.PLASMA,
        levels: [
            { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0 },
            { level: 2, damageMultiplier: 1.25, fireRateMultiplier: 1.1 },
            { level: 3, damageMultiplier: 1.5, fireRateMultiplier: 1.2 },
            { level: 4, damageMultiplier: 1.75, fireRateMultiplier: 1.3 },
            { level: 5, damageMultiplier: 2.0, fireRateMultiplier: 1.4 },
            { level: 6, damageMultiplier: 2.5, fireRateMultiplier: 1.5 },
        ],
    },

    [WeaponId.TESLA]: {
        id: WeaponId.TESLA,
        levels: [
            { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0 },
            { level: 2, damageMultiplier: 1.2, fireRateMultiplier: 1.1 },
            { level: 3, damageMultiplier: 1.4, fireRateMultiplier: 1.2 },
            { level: 4, damageMultiplier: 1.6, fireRateMultiplier: 1.3 },
            { level: 5, damageMultiplier: 1.8, fireRateMultiplier: 1.4 },
            { level: 6, damageMultiplier: 2.0, fireRateMultiplier: 1.5 },
        ],
    },

    [WeaponId.MAGMA]: {
        id: WeaponId.MAGMA,
        levels: [
            { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0 },
            { level: 2, damageMultiplier: 1.2, fireRateMultiplier: 1.1 },
            { level: 3, damageMultiplier: 1.4, fireRateMultiplier: 1.2 },
            { level: 4, damageMultiplier: 1.6, fireRateMultiplier: 1.3 },
            { level: 5, damageMultiplier: 1.8, fireRateMultiplier: 1.4 },
            { level: 6, damageMultiplier: 2.0, fireRateMultiplier: 1.5 },
        ],
    },

    [WeaponId.SHURIKEN]: {
        id: WeaponId.SHURIKEN,
        levels: [
            { level: 1, damageMultiplier: 1.0, fireRateMultiplier: 1.0 },
            { level: 2, damageMultiplier: 1.2, fireRateMultiplier: 1.1 },
            { level: 3, damageMultiplier: 1.4, fireRateMultiplier: 1.2 },
            { level: 4, damageMultiplier: 1.6, fireRateMultiplier: 1.3 },
            { level: 5, damageMultiplier: 1.8, fireRateMultiplier: 1.4 },
            { level: 6, damageMultiplier: 2.0, fireRateMultiplier: 1.5 },
        ],
    },
};

/**
 * 获取指定武器等级的升级配置
 * @param weaponId 武器 ID
 * @param level 武器等级（从 1 开始）
 * @returns 升级配置，如果未找到则返回默认值（1.0, 1.0）
 */
export function getWeaponUpgrade(weaponId: WeaponId, level: number): { damageMultiplier: number; fireRateMultiplier: number } {
    const weaponUpgrades = WEAPON_UPGRADE_TABLE[weaponId];
    if (!weaponUpgrades) {
        return { damageMultiplier: 1.0, fireRateMultiplier: 1.0 };
    }
    const levelSpec = weaponUpgrades.levels.find(l => l.level === level);
    return levelSpec || { damageMultiplier: 1.0, fireRateMultiplier: 1.0 };
}
