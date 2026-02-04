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
import { Transform, Velocity, Homing, Health, EnemyTag, BossTag } from '../components';
import { Component } from '../types';

/**
 * 获取目标的默认导弹锁定限制
 * @param targetComps 目标实体的组件列表
 * @param userConfig 用户配置的限制（如果提供）
 * @returns 最大锁定导弹数量
 */
function getDefaultMaxMissiles(
    targetComps: Component[] | undefined,
    userConfig?: number
): number {
    // 如果用户提供了明确配置，使用用户配置
    if (userConfig !== undefined) {
        return userConfig;
    }

    // 否则根据实体类型返回默认值
    if (!targetComps) {
        return 1; // 默认1枚
    }

    const hasBossTag = targetComps.some(BossTag.check);
    const hasEnemyTag = targetComps.some(EnemyTag.check);

    if (hasBossTag) {
        return 3; // Boss 可以被3枚导弹锁定（集中火力）
    } else if (hasEnemyTag) {
        return 1; // 普通敌人1枚（避免火力浪费）
    }

    return 1; // 其他情况默认1枚
}

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
                // 目标实体不存在，清除目标ID并减少计数
                const oldComps = getEntity(world, homing.targetId);
                const enemyTag = oldComps?.find(EnemyTag.check);
                const bossTag = oldComps?.find(BossTag.check);

                if (enemyTag && enemyTag.incomingMissiles > 0) {
                    enemyTag.incomingMissiles--;
                } else if (bossTag && bossTag.incomingMissiles > 0) {
                    bossTag.incomingMissiles--;
                }

                homing.targetId = undefined;
            } else {
                const [targetHealth] = getComponents(world, homing.targetId, [Health]);
                if (!targetHealth || targetHealth.hp <= 0) {
                    // 目标死亡，清除目标ID并减少计数
                    const oldComps = getEntity(world, homing.targetId);
                    const enemyTag = oldComps?.find(EnemyTag.check);
                    const bossTag = oldComps?.find(BossTag.check);

                    if (enemyTag && enemyTag.incomingMissiles > 0) {
                        enemyTag.incomingMissiles--;
                    } else if (bossTag && bossTag.incomingMissiles > 0) {
                        bossTag.incomingMissiles--;
                    }

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

            // 同时搜索带 Transform 和 EnemyTag 的实体
            for (const [enemyId, [enemyTransform, enemyTag]] of view(world, [Transform, EnemyTag])) {
                const dx = enemyTransform.x - transform.x;
                const dy = enemyTransform.y - transform.y;
                const distSq = dx * dx + dy * dy;

                // 使用差异化锁定限制
                const enemyComps = getEntity(world, enemyId);
                const maxLocks = getDefaultMaxMissiles(enemyComps, homing.maxMissilesPerTarget);
                if (enemyTag.incomingMissiles >= maxLocks) {
                    continue; // 跳过已达到锁定上限的敌人
                }

                if (distSq < nearestDistSq) {
                    nearestDistSq = distSq;
                    nearestId = enemyId;
                }
            }

            // 搜索 Boss（使用相同逻辑）
            for (const [bossId, [bossTransform, bossTag]] of view(world, [Transform, BossTag])) {
                const dx = bossTransform.x - transform.x;
                const dy = bossTransform.y - transform.y;
                const distSq = dx * dx + dy * dy;

                // 使用差异化锁定限制
                const bossComps = getEntity(world, bossId);
                const maxLocks = getDefaultMaxMissiles(bossComps, homing.maxMissilesPerTarget);
                if (bossTag.incomingMissiles >= maxLocks) {
                    continue; // 跳过已达到锁定上限的Boss
                }

                if (distSq < nearestDistSq) {
                    nearestDistSq = distSq;
                    nearestId = bossId;
                }
            }

            // 锁定目标后增加计数
            if (nearestId !== undefined) {
                // 获取目标的标签组件（EnemyTag 或 BossTag）
                const comps = getEntity(world, nearestId);
                const enemyTag = comps?.find(EnemyTag.check);
                const bossTag = comps?.find(BossTag.check);

                if (enemyTag) {
                    enemyTag.incomingMissiles++;
                } else if (bossTag) {
                    bossTag.incomingMissiles++;
                }

                homing.targetId = nearestId;
            }
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
