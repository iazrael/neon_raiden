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

import { World, Component } from '../types';
import { Transform, Weapon, Buff, Health, Bomb, OptionCount } from '../components';
import { WeaponId, BuffType } from '../types';
import { getEvents, pushEvent } from '../world';
import { EventTags, PickupEvent, PlaySoundEvent } from '../events';
import { WEAPON_TABLE } from '../blueprints/weapons';
import {
    POWERUP_LIMITS,
    BUFF_CONFIG,
    OPTION_BLUEPRINT_MAP,
    POWERUP_CONFIG,
    BUFF_CATEGORY_CONFIG,
    BuffCategory
} from '../configs/powerups';
import { spawnOption } from '../factory';

/**
 * 拾取处理器接口
 */
interface PickupHandler {
    handle(world: World, playerId: number, itemId: string): void;
}

/**
 * 武器拾取处理器
 */
const weaponPickupHandler: PickupHandler = {
    handle(world: World, playerId: number, weaponId: string): void {
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
            const weaponConfig = WEAPON_TABLE[weaponId as WeaponId];
            playerComps.push(new Weapon(weaponConfig));
        }

        // 播放音效
        pushEvent(world, {
            type: 'PlaySound',
            name: 'weapon_pickup'
        } as PlaySoundEvent);
    }
};

/**
 * Buff 拾取处理器
 */
const buffPickupHandler: PickupHandler = {
    handle(world: World, playerId: number, buffType: string): void {
        const playerComps = world.entities.get(playerId);
        if (!playerComps) return;

        const type = buffType as BuffType;
        const category = BUFF_CATEGORY_CONFIG[type];

        // 一次性效果直接应用
        if (category === BuffCategory.INSTANT) {
            applyInstantBuff(world, playerComps, type);
        } else {
            // 持续效果添加 Buff 组件
            addDurationBuff(world, playerComps, type);
        }

        // 播放音效
        pushEvent(world, {
            type: 'PlaySound',
            name: 'buff_pickup'
        } as PlaySoundEvent);
    }
};

/**
 * 僚机拾取处理器
 */
const optionPickupHandler: PickupHandler = {
    handle(world: World, playerId: number, blueprintType: string): void {
        const playerComps = world.entities.get(playerId);
        if (!playerComps) return;

        const playerTransform = playerComps.find(Transform.check);
        if (!playerTransform) return;

        let optionCount = playerComps.find(OptionCount.check);
        if (optionCount) {
            optionCount.count = Math.min(optionCount.count + 1, optionCount.maxCount);
        } else {
            optionCount = new OptionCount({ count: 1, maxCount: 2 });
            playerComps.push(optionCount);
        }

        const index = optionCount.count - 1;
        const angle = index * Math.PI;
        const x = playerTransform.x + Math.cos(angle) * 60;
        const y = playerTransform.y + Math.sin(angle) * 60;

        const bp = OPTION_BLUEPRINT_MAP[blueprintType];
        if (bp) {
            spawnOption(world, bp, index, x, y);
        }

        // 播放拾取特效
        pushEvent(world, {
            type: 'Pickup',
            pos: { x: 0, y: 0 },
            itemId: BuffType.OPTION,
            owner: playerId
        } as PickupEvent);

        // 播放音效
        pushEvent(world, {
            type: 'PlaySound',
            name: 'buff_pickup'
        } as PlaySoundEvent);
    }
};

/**
 * Handler 映射表
 */
const PICKUP_HANDLERS = {
    weapons: weaponPickupHandler,
    buffs: buffPickupHandler,
    options: optionPickupHandler
} as const;

/**
 * 应用一次性 Buff 效果
 */
function applyInstantBuff(world: World, playerComps: Component[], buffType: BuffType): void {
    switch (buffType) {
        case BuffType.POWER:
            // POWER: 武器升级
            const weapon = playerComps.find(Weapon.check);
            if (weapon) {
                weapon.level = Math.min(
                    weapon.level + BUFF_CONFIG[BuffType.POWER].levelIncrease,
                    BUFF_CONFIG[BuffType.POWER].maxLevel
                );
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
                playerComps.push(new Bomb({ count: 1, maxCount: 9 }));
            }

            // 播放拾取特效
            pushEvent(world, {
                type: 'Pickup',
                pos: { x: 0, y: 0 },
                itemId: BuffType.BOMB,
                owner: 0
            } as PickupEvent);
            break;

        default:
            console.warn(`Unknown instant buff type: ${buffType}`);
            break;
    }
}

/**
 * 添加持续 Buff 效果
 */
function addDurationBuff(world: World, playerComps: Component[], buffType: BuffType): void {
    switch (buffType) {
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

        case BuffType.SHIELD:
        case BuffType.RAPID_FIRE:
        case BuffType.PENETRATION:
        case BuffType.SPEED:
            // 其他持续效果 Buff
            playerComps.push(new Buff({
                type: buffType,
                value: 1,
                remaining: 5000 // 默认 5 秒持续时间
            }));
            break;

        default:
            console.warn(`Unknown duration buff type: ${buffType}`);
            break;
    }
}

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
        const { itemId, owner: playerId } = event;

        // 检查是否为武器拾取
        if (isWeaponId(itemId)) {
            PICKUP_HANDLERS.weapons.handle(world, playerId, itemId);
        }
        // 检查是否为 Buff 拾取
        else if (isBuffType(itemId)) {
            if (itemId === BuffType.OPTION) {
                // OPTION 是特殊的，需要调用 option handler
                const blueprintType = POWERUP_CONFIG[BuffType.OPTION].blueprintType;
                PICKUP_HANDLERS.options.handle(world, playerId, blueprintType);
            } else {
                PICKUP_HANDLERS.buffs.handle(world, playerId, itemId);
            }
        }
    }
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
