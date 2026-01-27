/**
 * 拾取物注册表
 *
 * 连接 PickupId 和对应的蓝图
 */

import { Blueprint } from '../blueprints';
import * as WeaponPickups from '../blueprints/pickups/weaponPickups';
import * as BuffPickups from '../blueprints/pickups/buffPickups';
import { PickupId } from '../types/ids';

/**
 * 拾取物注册表 - ID 到蓝图的映射
 */
export const PICKUP_REGISTRY: Record<string, Blueprint> = {
    // === 武器类 ===
    [PickupId.VULCAN]: WeaponPickups.BLUEPRINT_POWERUP_VULCAN,
    [PickupId.LASER]: WeaponPickups.BLUEPRINT_POWERUP_LASER,
    [PickupId.MISSILE]: WeaponPickups.BLUEPRINT_POWERUP_MISSILE,
    [PickupId.SHURIKEN]: WeaponPickups.BLUEPRINT_POWERUP_SHURIKEN,
    [PickupId.TESLA]: WeaponPickups.BLUEPRINT_POWERUP_TESLA,
    [PickupId.MAGMA]: WeaponPickups.BLUEPRINT_POWERUP_MAGMA,
    [PickupId.WAVE]: WeaponPickups.BLUEPRINT_POWERUP_WAVE,
    [PickupId.PLASMA]: WeaponPickups.BLUEPRINT_POWERUP_PLASMA,

    // === Buff 类 ===
    [PickupId.POWER]: BuffPickups.BLUEPRINT_POWERUP_POWER,
    [PickupId.HP]: BuffPickups.BLUEPRINT_POWERUP_HP,
    [PickupId.BOMB]: BuffPickups.BLUEPRINT_POWERUP_BOMB,
    [PickupId.OPTION]: BuffPickups.BLUEPRINT_POWERUP_OPTION,
    [PickupId.INVINCIBILITY]: BuffPickups.BLUEPRINT_POWERUP_INVINCIBILITY,
    [PickupId.TIME_SLOW]: BuffPickups.BLUEPRINT_POWERUP_TIME_SLOW,

    // === 特殊 ===
    [PickupId.NONE]: {} as any, // 空掉落，不生成实体
};

/**
 * 根据 ID 获取蓝图
 */
export function getPickupBlueprint(id: string): Blueprint | undefined {
    return PICKUP_REGISTRY[id];
}

/**
 * 检查是否为有效拾取物 ID
 */
export function isValidPickupId(id: string): boolean {
    return id !== PickupId.NONE && PICKUP_REGISTRY[id] !== undefined;
}
