/**
 * 僚机系统 (OptionSystem)
 *
 * 职责：
 * - 更新僚机位置（环绕玩家旋转）
 * - 同步僚机数量
 * - 管理僚机实体生命周期
 *
 * 系统类型：行动层
 * 执行顺序：P3 - 在 MovementSystem 之后
 */

import { World } from '../types';
import { Transform, Option, OptionCount, PlayerTag } from '../components';
import { generateId } from '../world';
import { Sprite } from '../components';
import { Weapon } from '../components';
import { WeaponId, AmmoType, WeaponPattern } from '../types';

/**
 * 环绕半径（像素）
 */
const OPTION_RADIUS = 60;

/**
 * 旋转速度（弧度/秒）
 */
const ROTATION_SPEED = 2;

/**
 * 缓动系数（0-1）
 */
const LERP_FACTOR = 0.2;

/**
 * 僚机系统主函数
 */
export function OptionSystem(world: World, dt: number): void {
    // 获取玩家组件
    const playerComps = world.entities.get(world.playerId);
    if (!playerComps) return;

    const playerTransform = playerComps.find(Transform.check);
    if (!playerTransform) return;

    // 查找 OptionCount 组件
    const optionCount = playerComps.find(OptionCount.check);
    const currentCount = optionCount ? optionCount.count : 0;

    // 遍历所有实体，找出所有僚机
    const optionEntities: Array<{ id: number; comps: any[] }> = [];
    for (const [id, comps] of world.entities) {
        const playerTag = comps.find(PlayerTag.check);
        if (playerTag && (playerTag as PlayerTag).isOption) {
            optionEntities.push({ id, comps });
        }
    }

    // 更新每个僚机的位置
    const now = world.time;
    for (const { id, comps } of optionEntities) {
        const option = comps.find(Option.check);
        const transform = comps.find(Transform.check);

        if (!option || !transform) continue;

        // 计算目标位置（环绕玩家旋转）
        const angle = (now / 1000) * ROTATION_SPEED + option.angle;
        const targetX = playerTransform.x + Math.cos(angle) * OPTION_RADIUS;
        const targetY = playerTransform.y + Math.sin(angle) * OPTION_RADIUS;

        // 平滑移动到目标位置
        transform.x += (targetX - transform.x) * LERP_FACTOR;
        transform.y += (targetY - transform.y) * LERP_FACTOR;
    }

    // 如果当前数量和实体数量不匹配，同步
    if (optionEntities.length !== currentCount) {
        if (currentCount > optionEntities.length) {
            // 需要创建新僚机
            for (let i = optionEntities.length; i < currentCount; i++) {
                spawnOptionEntity(world, world.playerId, i);
            }
        } else if (currentCount < optionEntities.length) {
            // 需要删除多余的僚机（从末尾开始）
            for (let i = currentCount; i < optionEntities.length; i++) {
                const { id } = optionEntities[i];
                world.entities.delete(id);
            }
        }
    }
}

/**
 * 辅助函数：创建僚机实体
 */
function spawnOptionEntity(world: World, playerId: number, index: number): void {
    const playerComps = world.entities.get(playerId);
    if (!playerComps) return;

    const playerTransform = playerComps.find(Transform.check);
    if (!playerTransform) return;

    const optionId = generateId();
    const angle = index * Math.PI;

    world.entities.set(optionId, [
        new Transform({
            x: playerTransform.x + Math.cos(angle) * OPTION_RADIUS,
            y: playerTransform.y + Math.sin(angle) * OPTION_RADIUS,
            rot: 0
        }),
        new Sprite({
            spriteKey: 'option' as any,
            color: '#00ffff',
            scale: 0.8
        }),
        new Option(index),
        new Weapon({
            id: WeaponId.VULCAN,
            ammoType: AmmoType.VULCAN_SPREAD,
            cooldown: 150,
            level: 1,
            bulletCount: 1,
            spread: 0,
            pattern: WeaponPattern.AIMED,
            fireRateMultiplier: 1.0,
            damageMultiplier: 0.5,
            pierce: 0,
            bounces: 0
        }),
        new PlayerTag({ isOption: true })
    ]);
}
