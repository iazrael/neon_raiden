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

import { Component, World } from '../types';
import { Transform, Velocity, SpeedStat, MoveIntent, Knockback, PlayerTag, BossTag, DestroyTag, BossEntrance } from '../components';
import { getComponents, removeComponent, view } from '../world';
import { destroyEntity } from './CleanupSystem';
import { getEffectiveTimeScale } from '../utils/timeUtils';

/**
 * 移动系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function MovementSystem(world: World, dt: number): void {
    // 遍历所有有 Transform 和 Velocity 的实体
    for (const [id, [transform, velocity], comps] of view(world, [Transform, Velocity])) {

        const [speedStat, moveIntent, knockback] = getComponents(world, id, [SpeedStat, MoveIntent, Knockback]);
        // 获取速度限制组件（可选）
        // 获取移动意图组件（可选，每帧清除）
        // 获取击退组件（可选）

        // 计算实际速度
        let vx = velocity.vx;
        let vy = velocity.vy;

        // 如果有移动意图，应用意图速度
        if (moveIntent) {
            if (moveIntent.type === 'velocity') {
                // 意图是设置速度方向（dx/dy是像素/秒，直接使用）
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

            // 击退效果很小时移除组件（阈值10像素/秒）
            if (Math.abs(knockback.vx) < 10 && Math.abs(knockback.vy) < 10) {
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

        // 获取有效时间缩放（玩家免疫）
        const timeScale = getEffectiveTimeScale(world, id);

        // 更新位置（dt是毫秒，velocity是像素/秒，需要转换）
        const dtInSeconds = dt / 1000;
        transform.x += vx * dtInSeconds * timeScale;
        transform.y += vy * dtInSeconds * timeScale;

        // 更新旋转（vrot是弧度/秒）
        if (velocity.vrot !== 0) {
            transform.rot += velocity.vrot * dtInSeconds * timeScale;
        }

        // 边界限制（Boss入场期间跳过）
        const entrance = comps.find(BossEntrance.check);
        if (!entrance) {
            applyBounds(world, comps, transform, id);
        }
    }
}

/**
 * 应用边界限制
 */
function applyBounds(world: World, comps: Component[], transform: Transform, entityId: number): void {

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
