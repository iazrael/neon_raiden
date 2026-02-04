/**
 * 导弹索敌系统 (HomingSystem)
 *
 * 职责：
 * - 为带有 Homing 组件的子弹自动寻找最近敌人
 * - 调整飞行方向朝向目标
 *
 * 系统类型：行为层
 * 执行顺序：P4 - 在 VelocitySystem 之后
 */

import { World, view, getEntity, getComponents } from '../world';
import { Transform, Velocity, Homing, Health, EnemyTag } from '../components';

/**
 * 导弹索敌系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function HomingSystem(world: World, dt: number): void {
    for (const [, [transform, velocity, homing]] of view(world, [Transform, Velocity, Homing])) {
        // 验证目标有效性
        if (homing.targetId !== undefined) {
            const target = getEntity(world, homing.targetId);
            if (!target) {
                // 目标实体不存在，清除目标ID并继续搜索新目标
                homing.targetId = undefined;
            } else {
                const [targetHealth] = getComponents(world, homing.targetId, [Health]);
                if (!targetHealth || targetHealth.hp <= 0) {
                    // 目标死亡，清除目标ID并继续搜索新目标
                    homing.targetId = undefined;
                }
            }
        }

        // 搜索新目标
        if (homing.targetId === undefined) {
            // 使用距离平方比较，避免 Math.sqrt 开销
            const searchRangeSq = homing.searchRange * homing.searchRange;
            let nearestDistSq = searchRangeSq;
            let nearestId: number | undefined;

            // 直接使用 view 查询带 Transform 和 EnemyTag 的实体，避免重复 getEntity 和 some 调用
            for (const [enemyId, [enemyTransform]] of view(world, [Transform, EnemyTag])) {
                const dx = enemyTransform.x - transform.x;
                const dy = enemyTransform.y - transform.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < nearestDistSq) {
                    nearestDistSq = distSq;
                    nearestId = enemyId;
                }
            }
            homing.targetId = nearestId;
        }

        // 调整方向朝向目标
        if (homing.targetId !== undefined) {
            const [targetTransform] = getComponents(world, homing.targetId, [Transform]);
            if (!targetTransform) {
                // 目标 Transform 丢失，清除目标
                homing.targetId = undefined;
                continue;
            }

            const dx = targetTransform.x - transform.x;
            const dy = targetTransform.y - transform.y;
            const targetAngle = Math.atan2(dy, dx);

            // 平滑转向
            const currentAngle = Math.atan2(velocity.vy, velocity.vx);
            let angleDiff = targetAngle - currentAngle;
            // 归一化到 [-PI, PI]
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            // 计算最大转向角度（turnSpeed 是弧度/秒，dt 是毫秒，需要转换为秒）
            const dtInSeconds = dt / 1000;
            const maxTurn = homing.turnSpeed * dtInSeconds;
            const newAngle = currentAngle + Math.max(-maxTurn, Math.min(maxTurn, angleDiff));

            const speed = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy);
            velocity.vx = Math.cos(newAngle) * speed;
            velocity.vy = Math.sin(newAngle) * speed;

            // 同步更新旋转角度，让导弹头朝向飞行方向（加上90度偏移，因为精灵图原始朝向是向上的）
            transform.rot = newAngle + Math.PI / 2;
        }
    }
}
