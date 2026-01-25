/**
 * 特殊武器效果系统 (SpecialWeaponSystem)
 *
 * 职责：
 * - 处理导弹追踪效果 (Homing Missile)
 * - 处理特斯拉链式闪电 (Chain Lightning)
 * - 其他特殊武器行为
 *
 * 系统类型：状态层
 * 执行顺序：P2 - 在 MovementSystem 之前执行
 */

import { World, EntityId } from '../types';
import { Transform, Velocity, Bullet, EnemyTag, PlayerTag, Health } from '../components';
import { AmmoType } from '../types';

// 追踪配置
const HOMING_CONFIG = {
    /** 追踪导弹转向速度 (弧度/秒) */
    turnRate: 8,
    /** 追踪最大距离 (像素) */
    maxDistance: 600,
    /** 追踪角度容差 (弧度) */
    angleTolerance: 0.1,
};

// 特斯拉配置
const TESLA_CONFIG = {
    /** 链条最大跳跃次数 */
    maxChains: 5,
    /** 链条跳跃范围 (像素) */
    chainRange: 150,
    /** 链条伤害衰减 */
    damageDecay: 0.8,
};

/**
 * 特殊武器效果系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function SpecialWeaponSystem(world: World, dt: number): void {
    // 处理追踪导弹
    updateHomingMissiles(world, dt);

    // 特斯拉链式效果在碰撞系统中处理（通过事件触发）
}

/**
 * 更新追踪导弹
 * 为所有追踪类型的子弹更新飞行方向
 */
function updateHomingMissiles(world: World, dt: number): void {
    // 收集所有敌人位置（用于最近敌人查找）
    const enemies: Map<EntityId, { x: number; y: number }> = new Map();

    for (const [id, comps] of world.entities) {
        const enemyTag = comps.find(EnemyTag.check);
        const transform = comps.find(Transform.check) as Transform | undefined;
        const health = comps.find(Health.check);

        if (enemyTag && transform && health && health.hp > 0) {
            enemies.set(id, { x: transform.x, y: transform.y });
        }
    }

    if (enemies.size === 0) return; // 没有敌人，不需要追踪

    // 更新所有追踪子弹
    for (const [bulletId, comps] of world.entities) {
        const bullet = comps.find(Bullet.check) as Bullet | undefined;
        const transform = comps.find(Transform.check) as Transform | undefined;
        const velocity = comps.find(Velocity.check) as Velocity | undefined;

        if (!bullet || !transform || !velocity) continue;

        // 只处理玩家发射的追踪导弹
        if (bullet.ammoType !== AmmoType.MISSILE_HOMING) continue;

        // 查找目标
        let target = bullet.target;
        let targetPos = target ? enemies.get(target) : undefined;

        // 如果没有目标或目标已失效，查找最近的敌人
        if (!targetPos) {
            let nearestDist = HOMING_CONFIG.maxDistance;
            let nearestId: EntityId | undefined;

            for (const [enemyId, pos] of enemies) {
                const dx = pos.x - transform.x;
                const dy = pos.y - transform.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestId = enemyId;
                }
            }

            if (nearestId !== undefined) {
                bullet.target = nearestId;
                targetPos = enemies.get(nearestId);
            }
        }

        if (!targetPos) continue;

        // 计算当前速度方向
        const currentSpeed = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy);
        if (currentSpeed < 1) continue; // 速度太低，不处理

        const currentAngle = Math.atan2(velocity.vy, velocity.vx);

        // 计算目标方向
        const dx = targetPos.x - transform.x;
        const dy = targetPos.y - transform.y;
        const targetAngle = Math.atan2(dy, dx);

        // 计算角度差（归一化到 -PI 到 PI）
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // 限制转向速度
        const maxTurn = HOMING_CONFIG.turnRate * dt / 1000; // 毫秒转秒
        let newAngle = currentAngle;

        if (Math.abs(angleDiff) <= maxTurn) {
            newAngle = targetAngle;
        } else {
            newAngle = currentAngle + Math.sign(angleDiff) * maxTurn;
        }

        // 更新速度向量
        const ammoSpeed = currentSpeed; // 保持原有速度
        velocity.vx = Math.cos(newAngle) * ammoSpeed;
        velocity.vy = Math.sin(newAngle) * ammoSpeed;

        // 更新子弹旋转角度以匹配飞行方向
        transform.rot = (newAngle * 180) / Math.PI;
    }
}

/**
 * 处理特斯拉链式效果
 * 当特斯拉子弹命中敌人时，在附近敌人间生成新子弹
 * @param world 世界对象
 * @param sourceEntity 命中的敌人实体ID
 * @param sourcePos 命中位置
 * @param chainCount 当前链条计数
 * @param damage 基础伤害
 */
export function handleTeslaChain(
    world: World,
    sourceEntity: EntityId,
    sourcePos: { x: number; y: number },
    chainCount: number,
    damage: number
): void {
    if (chainCount >= TESLA_CONFIG.maxChains) return;

    // 计算衰减后的伤害
    const chainDamage = damage * TESLA_CONFIG.damageDecay;

    // 查找范围内的敌人
    const targets: Array<{ id: EntityId; pos: { x: number; y: number } }> = [];

    for (const [id, comps] of world.entities) {
        // 跳过已命中的实体
        if (id === sourceEntity) continue;

        const enemyTag = comps.find(EnemyTag.check);
        const transform = comps.find(Transform.check) as Transform | undefined;
        const health = comps.find(Health.check);

        if (!enemyTag || !transform || !health) continue;
        if (health.hp <= 0) continue;

        // 计算距离
        const dx = transform.x - sourcePos.x;
        const dy = transform.y - sourcePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= TESLA_CONFIG.chainRange) {
            targets.push({ id, pos: { x: transform.x, y: transform.y } });
        }
    }

    // 对每个目标生成链条闪电
    for (const target of targets) {
        // 创建链条闪电实体（使用现有的子弹系统）
        createChainLightning(world, sourcePos, target.pos, chainCount, chainDamage);

        // 递归处理下一级链条
        handleTeslaChain(world, target.id, target.pos, chainCount + 1, chainDamage);
    }
}

/**
 * 创建链条闪电效果
 */
function createChainLightning(
    world: World,
    from: { x: number; y: number },
    to: { x: number; y: number },
    chainLevel: number,
    damage: number
): void {
    // 这里可以创建一个视觉效果实体（闪电链）
    // 或者直接触发伤害事件

    // 计算方向
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);

    // 这里应该生成一个"瞬发"子弹，立即造成伤害
    // 暂时通过事件系统通知伤害结算系统
    // TODO: 实现闪电伤害事件
}
