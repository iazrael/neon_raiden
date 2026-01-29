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
import { getComponents, view } from '../world';

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
    const [playerTransform] = getComponents(world, world.playerId, [Transform])
    if (!playerTransform) return;

    // 更新每个僚机的位置
    const now = world.time;
    for (const [id, [option, transform]]of view(world, [Option,Transform])) {

        // 计算目标位置（环绕玩家旋转）
        const angle = (now / 1000) * ROTATION_SPEED + option.angle;
        const targetX = playerTransform.x + Math.cos(angle) * OPTION_RADIUS;
        const targetY = playerTransform.y + Math.sin(angle) * OPTION_RADIUS;

        // 平滑移动到目标位置
        transform.x += (targetX - transform.x) * LERP_FACTOR;
        transform.y += (targetY - transform.y) * LERP_FACTOR;
    }

}
