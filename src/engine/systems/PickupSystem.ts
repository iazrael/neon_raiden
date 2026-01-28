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
import { Transform, Weapon, PlayerTag, PickupItem, Buff, Health, Shield, Bomb } from '../components';
import { WeaponId, BuffType } from '../types';
import { getEvents, pushEvent } from '../world';
import { EventTags, PickupEvent, PlaySoundEvent } from '../events';
import { WEAPON_TABLE } from '../blueprints/weapons';
import { POWERUP_LIMITS, BUFF_CONFIG } from '../configs/powerups';

/**
 * 拾取系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function PickupSystem(world: World, dt: number): void {
    // 收集本帧的所有拾取事件
    const pickupEvents = getEvents<PickupEvent>(world, EventTags.Pickup);

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
    const existingWeapon = playerComps.find(Weapon.check);

    if (existingWeapon && existingWeapon.id === weaponId) {
        // 已有该武器，升级武器等级
        existingWeapon.level = Math.min(existingWeapon.level + 1, POWERUP_LIMITS.MAX_WEAPON_LEVEL);
        // 升级时可能增加子弹数量或减少冷却
        existingWeapon.bulletCount = Math.min(existingWeapon.bulletCount + 1, POWERUP_LIMITS.MAX_BULLET_COUNT);
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
            const weapon = playerComps.find(Weapon.check);
            if (weapon) {
                weapon.level = Math.min(weapon.level + BUFF_CONFIG[BuffType.POWER].levelIncrease, BUFF_CONFIG[BuffType.POWER].maxLevel);
            }
            break;

        case BuffType.HP:
            // HP: 恢复生命值
            const health = playerComps.find(Health.check);
            if (health) {
                health.hp = Math.min(health.hp + BUFF_CONFIG[BuffType.HP].healAmount, health.max);
            }
            break;

        case BuffType.BOMB:
            // BOMB: 增加炸弹数量
            let bomb = playerComps.find(Bomb.check);
            if (bomb) {
                // 已有 Bomb 组件，增加计数
                const oldCount = bomb.count;
                bomb.count = Math.min(bomb.count + 1, bomb.maxCount);

                // 如果达到上限，播放提示音
                if (bomb.count === bomb.maxCount && oldCount < bomb.maxCount) {
                    pushEvent(world, {
                        type: 'PlaySound',
                        name: 'bomb_max'
                    } as PlaySoundEvent);
                }
            } else {
                // 首次拾取，创建 Bomb 组件
                playerComps.push(new Bomb(1, 9));
            }

            // 播放拾取特效
            pushEvent(world, {
                type: 'Pickup',
                pos: { x: 0, y: 0 },
                itemId: BuffType.BOMB,
                owner: playerId
            } as PickupEvent);
            break;

        case BuffType.OPTION:
            // OPTION: 增加僚机（暂未实现僚机系统）
            // TODO: 实现僚机系统
            console.warn('OPTION 道具暂未实现，请等待后续版本');
            return; // 不拾取此道具

        case BuffType.INVINCIBILITY:
            // INVINCIBILITY: 添加短暂无敌 Buff
            playerComps.push(new Buff({
                type: BuffType.INVINCIBILITY,
                value: 1,
                remaining: BUFF_CONFIG[BuffType.INVINCIBILITY].duration
            }));
            break;

        case BuffType.TIME_SLOW:
            // TIME_SLOW: 时间减速 Buff
            playerComps.push(new Buff({
                type: BuffType.TIME_SLOW,
                value: 1,
                remaining: BUFF_CONFIG[BuffType.TIME_SLOW].duration
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
function getWeaponConfig(weaponId: WeaponId) {
    const weaponSpec = WEAPON_TABLE[weaponId];
    if (!weaponSpec) {
        throw new Error(`Weapon config not found for ID: ${weaponId}`);
    }
    return weaponSpec;
}
