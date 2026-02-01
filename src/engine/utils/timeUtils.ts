/**
 * 时间相关工具函数
 */

import { EntityId } from '../types';
import { PlayerTag, TimeSlowState } from '../components';
import { getEntity, view, World } from '../world';

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
 * 查找当前激活的 TimeSlowState 玩家实体
 *
 * @param world - 游戏世界对象
 * @returns 持有 TimeSlowState 组件的玩家实体 ID，如果不存在则返回 undefined
 *
 * @description
 * 查询持有 TimeSlowState 组件的玩家实体。
 * 注意：TimeSlowState 现在是玩家身上的组件，而不是独立实体。
 * 时间减速效果只能由玩家触发。
 *
 * @example
 * ```ts
 * const playerId = findTimeSlowEntity(world);
 * if (playerId) {
 *     // 玩家正在使用时间减速
 *     console.log("Time slow is active on player");
 * }
 * ```
 */
export function findTimeSlowEntity(world: World): EntityId | undefined {
    for (const [id, [_]] of view(world, [PlayerTag, TimeSlowState])) {
        return id;
    }
    return undefined;
}
