/**
 * 时间相关工具函数
 */

import { World, EntityId } from '../types';
import { PlayerTag, TimeSlow } from '../components';
import { getEntity, view } from '../world';

/**
 * 获取实体的有效时间缩放比例
 *
 * @param world - 游戏世界对象
 * @param entityId - 实体 ID
 * @returns 时间缩放比例 (1.0 = 正常速度, 0.5 = 半速)
 *
 * @description
 * 计算实体应该应用的时间缩放比例:
 * - 玩家实体免疫时间减速效果,始终返回 1.0
 * - 其他实体使用全局 timeScale (由 TimeSlowSystem 控制)
 * - 如果实体不存在,返回默认值 1.0
 *
 * @example
 * ```ts
 * const timeScale = getEffectiveTimeScale(world, enemyId);
 * position.x += velocity.x * dt * timeScale;
 * ```
 */
export function getEffectiveTimeScale(world: World, entityId: EntityId): number {
    const comps = getEntity(world, entityId);
    if (!comps) return 1.0;

    // 玩家免疫
    if (comps.find(PlayerTag.check)) return 1.0;

    // 应用全局 timeScale
    return world.timeScale ?? 1.0;
}

/**
 * 检查子弹是否由玩家发射
 *
 * @param world - 游戏世界对象
 * @param ownerId - 子弹的所有者实体 ID
 * @returns 如果子弹来自玩家返回 true,否则返回 false
 *
 * @description
 * 通过检查子弹所有者实体是否存在 PlayerTag 组件来判断子弹来源。
 * 用于区分玩家子弹和敌人子弹,以便正确应用时间减速效果。
 *
 * @example
 * ```ts
 * if (isBulletFromPlayer(world, bullet.ownerId)) {
 *     // 玩家子弹不受时间减速影响
 *     bullet.velocity *= 1.0;
 * } else {
 *     // 敌人子弹受时间减速影响
 *     bullet.velocity *= world.timeScale;
 * }
 * ```
 */
export function isBulletFromPlayer(world: World, ownerId: EntityId): boolean {
    const ownerComps = getEntity(world, ownerId);
    return ownerComps?.find(PlayerTag.check) !== undefined;
}

/**
 * 查找当前激活的 TimeSlow 实体
 *
 * @param world - 游戏世界对象
 * @returns TimeSlow 实体的 ID,如果不存在则返回 undefined
 *
 * @description
 * 查询世界中的 TimeSlow 实体。TimeSlow 实体代表时间减速效果的状态,
 * 由 PickupSystem 在拾取 TIME_SLOW 道具时创建。
 *
 * 游戏中同时最多存在一个 TimeSlow 实体。重复拾取 TIME_SLOW 道具会刷新现有实体的生命周期。
 *
 * @example
 * ```ts
 * const existingTimeSlow = findTimeSlowEntity(world);
 * if (existingTimeSlow) {
 *     // 刷新现有 TimeSlow 的持续时间
 *     refreshLifetime(world, existingTimeSlow);
 * } else {
 *     // 创建新的 TimeSlow 实体
 *     spawnFromBlueprint(world, BLUEPRINT_TIME_SLOW);
 * }
 * ```
 */
export function findTimeSlowEntity(world: World): EntityId | undefined {
    for (const [id, [_]] of view(world, [TimeSlow])) {
        return id;
    }
    return undefined;
}
