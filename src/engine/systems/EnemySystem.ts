/**
 * 敌人系统 (EnemySystem)
 *
 * 职责：
 * - 为敌人实体生成 AI 决策
 * - 根据敌人类型决定行为模式
 * - 生成 MoveIntent 和 FireIntent
 *
 * 系统类型：决策层
 * 执行顺序：P1 - 在 InputSystem 之后
 */

import { World, EntityId, EnemyId } from '../types';
import { Transform, EnemyTag, MoveIntent, FireIntent, Weapon } from '../components';
import { addComponent, view } from '../world';
import { getEnemyBehavior, EnemyBehavior } from '../configs/enemyGrowth';

/**
 * 敌人系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function EnemySystem(world: World, dt: number): void {
    // 获取玩家位置
    let playerPos: { x: number; y: number } | null = null;
    const player = world.entities.get(world.playerId);

    const transform = player.find(Transform.check);
    if (transform) {
        playerPos = { x: transform.x, y: transform.y };
    }

    if (!playerPos) return; // 没有玩家，不处理

    // 处理每个敌人
    for (const [enemyId, [enemyTag, transform]] of view(world, [EnemyTag, Transform])) {

        // 从配置文件获取行为配置
        const behavior = getEnemyBehavior(enemyTag.id);

        // 更新状态计时器
        enemyTag.timer += dt;

        // 根据行为模式生成移动意图
        generateMoveIntent(world, enemyId, transform, playerPos, behavior, enemyTag);

        // 根据攻击配置生成开火意图
        generateFireIntent(world, enemyId, behavior, enemyTag);
    }
}

/**
 * 生成移动意图
 */
function generateMoveIntent(
    world: World,
    enemyId: EntityId,
    transform: Transform,
    playerPos: { x: number; y: number },
    behavior: { moveSpeed: number; behavior: EnemyBehavior },
    enemyTag: EnemyTag
): void {
    let dx = 0;
    let dy = 0;

    switch (behavior.behavior) {
        case EnemyBehavior.MOVE_DOWN:
            // 直线向下
            dy = behavior.moveSpeed;
            break;

        case EnemyBehavior.SINE_WAVE:
            // 正弦波移动：基于 Y 坐标计算横向偏移，phaseOffset 实现同类敌人错落
            dy = behavior.moveSpeed;
            dx = Math.sin(transform.y * 0.015 + enemyTag.phaseOffset) * behavior.moveSpeed;
            break;

        case EnemyBehavior.CHASE:
            // 追踪玩家
            const angleToPlayer = Math.atan2(
                playerPos.y - transform.y,
                playerPos.x - transform.x
            );
            dx = Math.cos(angleToPlayer) * behavior.moveSpeed;
            dy = Math.sin(angleToPlayer) * behavior.moveSpeed;
            break;

        case EnemyBehavior.RAM:
            // 冲撞：加速向玩家
            const ramAngle = Math.atan2(
                playerPos.y - transform.y,
                playerPos.x - transform.x
            );
            dx = Math.cos(ramAngle) * behavior.moveSpeed * 1.5;
            dy = Math.sin(ramAngle) * behavior.moveSpeed * 1.5;
            break;

        case EnemyBehavior.STRAFE:
            // 侧移：向下 + 周期性横向（基于 Y 坐标）
            dy = behavior.moveSpeed * 0.5;
            const strafeDir = Math.sin(transform.y * 0.04 + enemyTag.phaseOffset) > 0 ? 1 : -1;
            dx = strafeDir * behavior.moveSpeed;
            break;

        case EnemyBehavior.CIRCLE:
            // 环绕玩家
            const circleAngle = Math.atan2(
                transform.y - playerPos.y,
                transform.x - playerPos.x
            ) + 0.02; // 固定旋转速度（每帧约0.02弧度）
            const circleRadius = 150;
            const targetX = playerPos.x + Math.cos(circleAngle) * circleRadius;
            const targetY = playerPos.y + Math.sin(circleAngle) * circleRadius;
            // 使用 moveSpeed 控制速度，与其他行为保持一致
            const dirX = targetX - transform.x;
            const dirY = targetY - transform.y;
            const dist = Math.sqrt(dirX * dirX + dirY * dirY);
            if (dist > 0) {
                dx = (dirX / dist) * behavior.moveSpeed;
                dy = (dirY / dist) * behavior.moveSpeed;
            }
            break;

        default:
            dy = behavior.moveSpeed;
    }

    // 添加移动意图
    if (dx !== 0 || dy !== 0) {
        addComponent(world, enemyId, new MoveIntent({
            dx,
            dy,
            type: 'velocity'
        }));
    }
}

/**
 * 生成开火意图
 */
function generateFireIntent(
    world: World,
    enemyId: EntityId,
    behavior: { fireInterval: number },
    enemyTag: EnemyTag
): void {
    // 检查是否有武器组件
    const comps = world.entities.get(enemyId);
    if (!comps) return;

    const weapon = comps.find(Weapon.check);
    if (!weapon) return;

    // 检查是否在冷却中
    if (weapon.curCD > 0) return;

    // 检查是否达到攻击间隔
    if (enemyTag.timer < behavior.fireInterval) return;

    // 生成开火意图（移除了 aggressiveness 概率判断）
    addComponent(world, enemyId, new FireIntent({
        firing: true
    }));

    // 重置计时器
    enemyTag.timer = 0;
}
