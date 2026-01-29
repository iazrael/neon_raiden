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
import { spawnOption } from '../factory';
import { BLUEPRINT_OPTION_VULCAN } from '../blueprints/fighters';

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
                const angle = i * Math.PI;
                const x = playerTransform.x + Math.cos(angle) * OPTION_RADIUS;
                const y = playerTransform.y + Math.sin(angle) * OPTION_RADIUS;

                spawnOption(world, BLUEPRINT_OPTION_VULCAN, i, x, y);
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
