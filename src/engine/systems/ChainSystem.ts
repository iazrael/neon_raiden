/**
 * 特斯拉连锁系统 (ChainSystem)
 *
 * 职责：
 * - 处理带有 Chain 组件的子弹命中后的连锁逻辑
 * - 在范围内寻找下一个未连锁的敌人并生成连锁闪电事件
 *
 * 系统类型：事件响应层
 * 执行顺序：P5 - 在 CollisionSystem 之后
 */

import { World, view, getEntity, getComponents, pushEvent, getEvents } from '../world';
import { Transform, Chain, Health, EnemyTag } from '../components';
import { ChainLightningEvent } from '../events';

/**
 * 特斯拉连锁系统主函数
 */
export function ChainSystem(world: World, dt: number): void {
    // 处理连锁闪电事件
    const chainEvents = getEvents<ChainLightningEvent>(world, 'ChainLightning');

    for (const event of chainEvents) {
        const toId = event.toId;
        const count = event.count;
        const range = event.range;

        if (count <= 0) {
            // 即使 count 为 0，也要对第一个目标造成伤害
            const target = getEntity(world, toId);
            if (target) {
                const [, targetHealth] = getComponents(world, toId, [Transform, Health]);
                if (targetHealth) {
                    targetHealth.hp -= event.damage;
                }
            }
            continue;
        }

        // 找到目标并造成伤害
        const target = getEntity(world, toId);
        if (!target) continue;

        const [targetTransform, targetHealth] = getComponents(world, toId, [Transform, Health]);
        if (!targetTransform || !targetHealth || targetHealth.hp <= 0) continue;

        // 造成伤害
        targetHealth.hp -= event.damage;

        // 生成下一级连锁
        if (count > 1) {
            let nearestDist = range;
            let nearestId: number | undefined;
            const fromPos = { x: targetTransform.x, y: targetTransform.y };

            for (const [enemyId, [enemyTransform, enemyHealth]] of view(world, [Transform, Health, EnemyTag])) {
                // 跳过已连锁的和已死亡的
                if (event.chainedIds.has(enemyId)) continue;
                if (enemyHealth.hp <= 0) continue;

                const dx = enemyTransform.x - fromPos.x;
                const dy = enemyTransform.y - fromPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestId = enemyId;
                }
            }

            if (nearestId !== undefined) {
                const newChainedIds = new Set(event.chainedIds);
                newChainedIds.add(toId);

                pushEvent(world, {
                    type: 'ChainLightning',
                    fromX: targetTransform.x,
                    fromY: targetTransform.y,
                    toId: nearestId,
                    count: count - 1,
                    range,
                    damage: event.damage,
                    chainedIds: newChainedIds,
                } as ChainLightningEvent);
            }
        }
    }
}

/**
 * 触发连锁闪电（供 CollisionSystem 调用）
 */
export function triggerChainLightning(
    world: World,
    bulletX: number,
    bulletY: number,
    count: number,
    range: number,
    damage: number,
    firstTargetId: number
): void {
    pushEvent(world, {
        type: 'ChainLightning',
        fromX: bulletX,
        fromY: bulletY,
        toId: firstTargetId,
        count,
        range,
        damage,
        chainedIds: new Set([firstTargetId]),
    } as ChainLightningEvent);
}
