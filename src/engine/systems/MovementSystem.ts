/**
 * 移动系统 (MovementSystem)
 *
 * 职责：
 * - 更新所有有 Velocity 组件的实体的位置
 * - 支持 MoveIntent 组件（玩家输入/AI决策产生的移动意图）
 * - 应用边界限制
 * - 管理速度限制（SpeedStat）
 *
 * 系统类型：物理层
 * 执行顺序：P3 - 在所有决策系统之后
 */

import { World } from '../types';
import { Transform, Velocity, SpeedStat, MoveIntent, Knockback, PlayerTag, BossTag, DestroyTag } from '../components';
import { removeComponent, view } from '../world';
import { destroyEntity } from './CleanupSystem';

/**
 * 移动系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function MovementSystem(world: World, dt: number): void {
    // 遍历所有有 Transform 和 Velocity 的实体
    for (const [id, [transform, velocity]] of view(world, [Transform, Velocity])) {

        const comps = world.entities.get(id);
        if (!comps) continue;

        // 获取速度限制组件（可选）
        const speedStat = comps.find(SpeedStat.check);

        // 获取移动意图组件（可选，每帧清除）
        const moveIntent = comps.find(MoveIntent.check);

        // 获取击退组件（可选）
        const knockback = comps.find(Knockback.check);

        // 计算实际速度
        let vx = velocity.vx;
        let vy = velocity.vy;

        // 如果有移动意图，应用意图速度
        if (moveIntent) {
            if (moveIntent.type === 'velocity') {
                // 意图是设置速度方向
                vx = moveIntent.dx;
                vy = moveIntent.dy;
            } else {
                // 意图是绝对位移，直接应用到位置
                transform.x += moveIntent.dx;
                transform.y += moveIntent.dy;
            }

            // 意图组件是"一次性的"，用完即删
            removeComponent(world, id, moveIntent);
        }

        // 如果有击退效果，叠加击退速度
        if (knockback) {
            vx += knockback.vx;
            vy += knockback.vy;

            // 击退效果随时间衰减
            knockback.vx *= 0.9;
            knockback.vy *= 0.9;

            // 击退效果很小时移除组件
            if (Math.abs(knockback.vx) < 1 && Math.abs(knockback.vy) < 1) {
                removeComponent(world, id, knockback);
            }
        }

        // 应用速度限制
        if (speedStat) {
            const speed = Math.sqrt(vx * vx + vy * vy);
            if (speed > speedStat.maxLinear) {
                const ratio = speedStat.maxLinear / speed;
                vx *= ratio;
                vy *= ratio;
            }
        }

        // 更新速度组件（保存当前速度供下一帧使用）
        velocity.vx = vx;
        velocity.vy = vy;

        // 更新位置
        transform.x += vx * dt;
        transform.y += vy * dt;

        // 更新旋转
        if (velocity.vrot !== 0) {
            transform.rot += velocity.vrot * dt;
        }

        // 边界限制
        applyBounds(world, transform, id);
    }
}

/**
 * 应用边界限制
 */
function applyBounds(world: World, transform: Transform, entityId: number): void {
    const comps = world.entities.get(entityId);
    if (!comps) return;

    // 检查是否是玩家或 Boss（需要限制在屏幕内）
    const isPlayer = comps.find(PlayerTag.check);
    const isBoss = comps.find(BossTag.check);

    if (isPlayer || isBoss) {
        // 玩家和 Boss 限制在屏幕范围内
        const margin = 0;
        // 左边界
        if (transform.x < margin) {
            transform.x = margin;
        }
        // 右边界
        if (transform.x > world.width - margin) {
            transform.x = world.width - margin;
        }
        // 上边界
        if (transform.y < margin) {
            transform.y = margin;
        }
        // 下边界
        if (transform.y > world.height - margin) {
            transform.y = world.height - margin;
        }
        return;
    }

    // 其他实体：超出屏幕后销毁（给予一定的缓冲距离）
    const buffer = 50;
    if (transform.x < -buffer ||
        transform.x > world.width + buffer ||
        transform.y < -buffer ||
        transform.y > world.height + buffer) {
        // 添加销毁标记
        destroyEntity(world, entityId, 'offscreen');
    }
}
