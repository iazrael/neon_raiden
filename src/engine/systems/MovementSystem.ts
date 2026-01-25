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
import { Transform, Velocity, SpeedStat, MoveIntent, Knockback } from '../components';

/**
 * 移动系统主函数
 * @param world 世界对象
 * @param dt 时间增量（秒）
 */
export function MovementSystem(world: World, dt: number): void {
    // 遍历所有有 Transform 和 Velocity 的实体
    for (const [id, comps] of world.entities) {
        const transform = comps.find(Transform.check) as Transform | undefined;
        const velocity = comps.find(Velocity.check) as Velocity | undefined;

        if (!transform || !velocity) continue;

        // 获取速度限制组件（可选）
        const speedStat = comps.find(SpeedStat.check) as SpeedStat | undefined;

        // 获取移动意图组件（可选，每帧清除）
        const moveIntent = comps.find(MoveIntent.check) as MoveIntent | undefined;

        // 获取击退组件（可选）
        const knockback = comps.find(Knockback.check) as Knockback | undefined;

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
            const idx = comps.indexOf(moveIntent);
            if (idx !== -1) comps.splice(idx, 1);
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
                const idx = comps.indexOf(knockback);
                if (idx !== -1) comps.splice(idx, 1);
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
    const halfSize = 20; // 假设实体半径为20像素

    // 检查是否有玩家标签（玩家可以有更大的边界）
    const comps = world.entities.get(entityId);
    const isPlayer = comps?.some(c => c.constructor.name === 'PlayerTag');

    const margin = isPlayer ? 0 : halfSize;

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
}
