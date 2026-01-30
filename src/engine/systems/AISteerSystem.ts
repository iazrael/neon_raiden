/**
 * AI转向系统 (AISteerSystem)
 *
 * 职责：
 * - 实现转向行为 (Steering Behaviors)
 * - 支持：分离、对齐、凝聚、追踪、逃避等行为
 * - 为敌人实体生成更精细的移动意图
 *
 * 系统类型：决策层
 * 执行顺序：P1 - 在 EnemySystem 之后
 */

import { EntityId } from '../types';
import { Transform, Velocity, EnemyTag, MoveIntent } from '../components';
import { World } from '../world';
/**
 * 转向力配置
 */
interface SteeringConfig {
    separation: number;  // 分离权重 - 避免与其他实体太近
    alignment: number;   // 对齐权重 - 与附近实体方向保持一致
    cohesion: number;    // 凝聚权重 - 向群体中心移动
    maxForce: number;    // 最大转向力
}

/**
 * 默认转向配置
 */
const DEFAULT_STEERING: SteeringConfig = {
    separation: 2.0,
    alignment: 1.0,
    cohesion: 1.0,
    maxForce: 500
};

/**
 * AI转向系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function AISteerSystem(world: World, dt: number): void {
    // 收集所有敌人的位置和速度
    const enemies: Array<{ id: EntityId; pos: { x: number; y: number }; vel: { x: number; y: number } }> = [];

    for (const [id, comps] of world.entities) {
        const enemyTag = comps.find(EnemyTag.check) as EnemyTag | undefined;
        if (!enemyTag) continue;

        const transform = comps.find(Transform.check) as Transform | undefined;
        const velocity = comps.find(Velocity.check) as Velocity | undefined;

        if (transform && velocity) {
            enemies.push({
                id,
                pos: { x: transform.x, y: transform.y },
                vel: { x: velocity.vx, y: velocity.vy }
            });
        }
    }

    // 为每个敌人计算转向力
    for (const enemy of enemies) {
        const steering = calculateSteering(enemy, enemies, DEFAULT_STEERING);

        // 如果有转向力，添加到现有意图中
        if (steering.x !== 0 || steering.y !== 0) {
            const comps = world.entities.get(enemy.id);
            if (comps) {
                comps.push(new MoveIntent({
                    dx: steering.x,
                    dy: steering.y,
                    type: 'velocity'
                }));
            }
        }
    }
}

/**
 * 计算转向力
 */
function calculateSteering(
    self: { pos: { x: number; y: number }; vel: { x: number; y: number } },
    all: Array<{ pos: { x: number; y: number }; vel: { x: number; y: number } }>,
    config: SteeringConfig
): { x: number; y: number } {
    let fx = 0;
    let fy = 0;

    // 分离力 - 避免与其他敌人太近
    const separation = calculateSeparation(self, all);
    fx += separation.x * config.separation;
    fy += separation.y * config.separation;

    // 对齐力 - 与附近敌人方向保持一致
    const alignment = calculateAlignment(self, all);
    fx += alignment.x * config.alignment;
    fy += alignment.y * config.alignment;

    // 凝聚力 - 向群体中心移动
    const cohesion = calculateCohesion(self, all);
    fx += cohesion.x * config.cohesion;
    fy += cohesion.y * config.cohesion;

    // 限制最大转向力
    const force = Math.sqrt(fx * fx + fy * fy);
    if (force > config.maxForce) {
        const ratio = config.maxForce / force;
        fx *= ratio;
        fy *= ratio;
    }

    return { x: fx, y: fy };
}

/**
 * 分离行为 - 避免拥挤
 */
function calculateSeparation(
    self: { pos: { x: number; y: number } },
    all: Array<{ pos: { x: number; y: number } }>
): { x: number; y: number } {
    const perceptionRadius = 60; // 感知半径
    let fx = 0;
    let fy = 0;
    let count = 0;

    for (const other of all) {
        if (other === self) continue;

        const dx = self.pos.x - other.pos.x;
        const dy = self.pos.y - other.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < perceptionRadius && distance > 0) {
            // 距离越近，排斥力越大
            const strength = 1 - distance / perceptionRadius;
            fx += (dx / distance) * strength;
            fy += (dy / distance) * strength;
            count++;
        }
    }

    if (count > 0) {
        fx /= count;
        fy /= count;
    }

    return { x: fx * 200, y: fy * 200 }; // 放大效果
}

/**
 * 对齐行为 - 与群体方向保持一致
 */
function calculateAlignment(
    self: { vel: { x: number; y: number } },
    all: Array<{ vel: { x: number; y: number } }>
): { x: number; y: number } {
    const perceptionRadius = 80;
    let vx = 0;
    let vy = 0;
    let count = 0;

    for (const other of all) {
        if (other === self) continue;

        vx += other.vel.x;
        vy += other.vel.y;
        count++;
    }

    if (count > 0) {
        vx /= count;
        vy /= count;

        // 返回需要调整的转向力
        return {
            x: vx - self.vel.x,
            y: vy - self.vel.y
        };
    }

    return { x: 0, y: 0 };
}

/**
 * 凝聚行为 - 向群体中心移动
 */
function calculateCohesion(
    self: { pos: { x: number; y: number } },
    all: Array<{ pos: { x: number; y: number } }>
): { x: number; y: number } {
    const perceptionRadius = 100;
    let cx = 0;
    let cy = 0;
    let count = 0;

    for (const other of all) {
        if (other === self) continue;

        const dx = self.pos.x - other.pos.x;
        const dy = self.pos.y - other.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < perceptionRadius) {
            cx += other.pos.x;
            cy += other.pos.y;
            count++;
        }
    }

    if (count > 0) {
        cx /= count;
        cy /= count;

        // 向中心移动的向量
        return {
            x: (cx - self.pos.x) * 0.5,
            y: (cy - self.pos.y) * 0.5
        };
    }

    return { x: 0, y: 0 };
}
