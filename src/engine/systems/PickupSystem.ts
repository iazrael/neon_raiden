/**
 * 拾取系统 (PickupSystem)
 *
 * 职责：
 * - 处理 PickupEvent（由 CollisionSystem 生成）
 * - 为玩家添加武器或应用 Buff 效果
 * - 移除被拾取的道具实体
 *
 * 系统类型：结算层
 * 执行顺序：P5 - 在交互层之后
 */

import { World } from '../types';
import { Transform, Weapon, PlayerTag, PickupItem, Buff, Health, Shield } from '../components';
import { WeaponId, AmmoType, BuffType, WeaponPattern } from '../types';
import { pushEvent } from '../world';
import { PickupEvent, PlaySoundEvent } from '../events';

/**
 * 拾取系统主函数
 * @param world 世界对象
 * @param dt 时间增量（秒）
 */
export function PickupSystem(world: World, dt: number): void {
    // 收集本帧的所有拾取事件
    const pickupEvents = world.events.filter(e => e.type === 'Pickup') as PickupEvent[];

    if (pickupEvents.length === 0) return;

    // 处理每个拾取事件
    for (const event of pickupEvents) {
        handlePickup(world, event);
    }
}

/**
 * 处理单个拾取事件
 */
function handlePickup(world: World, event: PickupEvent): void {
    const { itemId, owner: playerId } = event;
    const playerComps = world.entities.get(playerId);

    if (!playerComps) return;

    // 检查是否为武器拾取
    const weaponId = itemId as WeaponId;
    if (isWeaponId(weaponId)) {
        applyWeaponPickup(world, playerId, weaponId);
        return;
    }

    // 检查是否为 Buff 拾取
    const buffType = itemId as BuffType;
    if (isBuffType(buffType)) {
        applyBuffPickup(world, playerId, buffType);
        return;
    }
}

/**
 * 应用武器拾取
 */
function applyWeaponPickup(world: World, playerId: number, weaponId: WeaponId): void {
    const playerComps = world.entities.get(playerId);
    if (!playerComps) return;

    // 查找是否已有该武器
    const existingWeapon = playerComps.find(Weapon.check) as Weapon | undefined;

    if (existingWeapon && existingWeapon.id === weaponId) {
        // 已有该武器，升级武器等级
        existingWeapon.level = Math.min(existingWeapon.level + 1, 5);
        // 升级时可能增加子弹数量或减少冷却
        existingWeapon.bulletCount = Math.min(existingWeapon.bulletCount + 1, 7);
    } else {
        // 移除旧武器，添加新武器
        if (existingWeapon) {
            const idx = playerComps.indexOf(existingWeapon);
            if (idx !== -1) playerComps.splice(idx, 1);
        }

        // 根据武器ID创建新武器
        const weaponConfig = getWeaponConfig(weaponId);
        playerComps.push(new Weapon(weaponConfig));
    }

    // 播放音效
    pushEvent(world, {
        type: 'PlaySound',
        name: 'weapon_pickup'
    } as PlaySoundEvent);
}

/**
 * 应用 Buff 拾取
 */
function applyBuffPickup(world: World, playerId: number, buffType: BuffType): void {
    const playerComps = world.entities.get(playerId);
    if (!playerComps) return;

    switch (buffType) {
        case BuffType.POWER:
            // POWER: 武器升级
            const weapon = playerComps.find(Weapon.check) as Weapon | undefined;
            if (weapon) {
                weapon.level = Math.min(weapon.level + 1, 5);
            }
            break;

        case BuffType.HP:
            // HP: 恢复生命值
            const health = playerComps.find(Health.check) as Health | undefined;
            if (health) {
                health.hp = Math.min(health.hp + 30, health.max);
            }
            break;

        case BuffType.BOMB:
            // BOMB: 增加炸弹数量（暂未实现炸弹计数）
            // TODO: 实现炸弹系统
            pushEvent(world, {
                type: 'ScreenClear'
            });
            break;

        case BuffType.OPTION:
            // OPTION: 增加僚机（暂未实现僚机系统）
            // TODO: 实现僚机系统
            break;

        case BuffType.INVINCIBILITY:
            // INVINCIBILITY: 添加短暂无敌 Buff
            playerComps.push(new Buff({
                type: BuffType.INVINCIBILITY,
                value: 1,
                remaining: 3 // 3秒无敌
            }));
            break;

        case BuffType.TIME_SLOW:
            // TIME_SLOW: 时间减速 Buff
            playerComps.push(new Buff({
                type: BuffType.TIME_SLOW,
                value: 1,
                remaining: 5 // 5秒减速
            }));
            break;

        default:
            console.warn(`Unknown buff type: ${buffType}`);
            return;
    }

    // 播放音效
    pushEvent(world, {
        type: 'PlaySound',
        name: 'buff_pickup'
    } as PlaySoundEvent);
}

/**
 * 检查是否为武器 ID
 */
function isWeaponId(id: string): id is WeaponId {
    return Object.values(WeaponId).includes(id as WeaponId);
}

/**
 * 检查是否为 Buff 类型
 */
function isBuffType(id: string): id is BuffType {
    return Object.values(BuffType).includes(id as BuffType);
}

/**
 * 获取武器配置
 */
function getWeaponConfig(weaponId: WeaponId): {
    id: WeaponId;
    ammoType: AmmoType;
    cooldown: number;
    bulletCount: number;
    spread?: number;
    pattern?: WeaponPattern;
} {
    const CONFIG_MAP: Record<WeaponId, {
        ammoType: AmmoType;
        cooldown: number;
        bulletCount: number;
        spread?: number;
        pattern?: WeaponPattern;
    }> = {
        [WeaponId.VULCAN]: { ammoType: AmmoType.VULCAN_SPREAD, cooldown: 150, bulletCount: 3, spread: 20, pattern: WeaponPattern.SPREAD },
        [WeaponId.LASER]: { ammoType: AmmoType.LASER_BEAM, cooldown: 200, bulletCount: 1 },
        [WeaponId.MISSILE]: { ammoType: AmmoType.MISSILE_HOMING, cooldown: 400, bulletCount: 2, spread: 10 },
        [WeaponId.WAVE]: { ammoType: AmmoType.WAVE_PULSE, cooldown: 500, bulletCount: 1 },
        [WeaponId.PLASMA]: { ammoType: AmmoType.PLASMA_ORB, cooldown: 600, bulletCount: 1 },
        [WeaponId.TESLA]: { ammoType: AmmoType.TESLA_CHAIN, cooldown: 250, bulletCount: 1 },
        [WeaponId.MAGMA]: { ammoType: AmmoType.MAGMA_POOL, cooldown: 350, bulletCount: 1 },
        [WeaponId.SHURIKEN]: { ammoType: AmmoType.SHURIKEN_BOUNCE, cooldown: 180, bulletCount: 3, spread: 30, pattern: WeaponPattern.SPREAD },
    };

    const config = CONFIG_MAP[weaponId];
    return {
        id: weaponId,
        ...config
    };
}
