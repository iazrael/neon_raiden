/**
 * Boss行为系统 (BossSystem)
 *
 * 职责：
 * - 根据 BossAI 和 BossTag 控制 Boss 行为
 * - 实现各种 Boss 移动模式（正弦、追踪、冲刺、瞬移等）
 * - 自动开火
 *
 * 系统类型：刷怪层
 * 执行顺序：P6 - 在决策层之后
 */

import { World, EntityId } from '../types';
import { Transform, Velocity, BossTag, BossAI, Weapon, MoveIntent, FireIntent } from '../components';
import { BOSS_DATA, BossMovementPattern } from '../configs/bossData';
import { pushEvent } from '../world';

/**
 * 检查组件是否为 Transform
 */
function isTransform(c: any): c is Transform {
    return c instanceof Transform;
}

/**
 * Boss 系统主函数
 * @param world 世界对象
 * @param dt 时间增量（秒）
 */
export function BossSystem(world: World, dt: number): void {
    // 收集所有 Boss 实体
    const bossEntities: Array<{
        id: EntityId;
        transform: Transform;
        velocity: Velocity;
        bossTag: BossTag;
        bossAI: BossAI;
        weapon?: Weapon;
    }> = [];

    for (const [id, comps] of world.entities) {
        const bossTag = comps.find(c => c instanceof BossTag) as BossTag | undefined;
        if (!bossTag) continue;

        const transform = comps.find(c => c instanceof Transform) as Transform | undefined;
        const velocity = comps.find(c => c instanceof Velocity) as Velocity | undefined;
        const bossAI = comps.find(c => c instanceof BossAI) as BossAI | undefined;
        const weapon = comps.find(c => c instanceof Weapon) as Weapon | undefined;

        if (!transform || !bossAI) continue;

        bossEntities.push({
            id,
            transform,
            velocity: velocity || new Velocity({ vx: 0, vy: 0, vrot: 0 }),
            bossTag,
            bossAI,
            weapon
        });
    }

    // 处理每个 Boss
    for (const boss of bossEntities) {
        processBoss(world, boss, dt);
    }
}

/**
 * 处理单个 Boss
 */
function processBoss(
    world: World,
    boss: {
        id: EntityId;
        transform: Transform;
        velocity: Velocity;
        bossTag: { id: string };
        bossAI: BossAI;
        weapon?: Weapon;
    },
    dt: number
): void {
    const bossSpec = BOSS_DATA[boss.bossTag.id as keyof typeof BOSS_DATA];
    if (!bossSpec) return;

    const phaseSpec = bossSpec.phases[boss.bossAI.phase];
    if (!phaseSpec) return;

    // 1. 处理移动
    handleBossMovement(world, boss, phaseSpec.movePattern, phaseSpec.modifiers, dt);

    // 2. 处理开火
    handleBossFiring(world, boss, phaseSpec, dt);
}

/**
 * 处理 Boss 移动
 */
function handleBossMovement(
    world: World,
    boss: { transform: Transform; velocity: Velocity; bossAI: BossAI },
    pattern: BossMovementPattern,
    modifiers: { moveSpeed?: number },
    dt: number
): void {
    const speed = (modifiers.moveSpeed || 1.0) * 100;
    const time = world.time;

    switch (pattern) {
        case BossMovementPattern.IDLE:
            // 站桩，不移动
            boss.velocity.vx = 0;
            boss.velocity.vy = 20; // 缓慢下降
            break;

        case BossMovementPattern.SINE:
            // 正弦游动
            boss.velocity.vx = Math.sin(time * 2) * speed;
            boss.velocity.vy = 30;
            break;

        case BossMovementPattern.FIGURE_8:
            // 8字形
            boss.velocity.vx = Math.sin(time) * speed;
            boss.velocity.vy = Math.sin(time * 2) * 30;
            break;

        case BossMovementPattern.CIRCLE:
            // 绕圈移动
            const centerX = world.width / 2;
            const centerY = 200;
            const radius = 150;
            const angle = time * 0.5;
            boss.velocity.vx = (centerX + Math.cos(angle) * radius - boss.transform.x) * 2;
            boss.velocity.vy = (centerY + Math.sin(angle) * radius - boss.transform.y) * 2;
            break;

        case BossMovementPattern.ZIGZAG:
            // 之字形
            const zigzagPhase = Math.floor(time / 2) % 2;
            boss.velocity.vx = zigzagPhase === 0 ? speed : -speed;
            boss.velocity.vy = 40;
            break;

        case BossMovementPattern.FOLLOW:
            // 追踪玩家
            const playerComps = world.entities.get(world.playerId);
            if (playerComps) {
                const playerTransform = playerComps.find(isTransform) as Transform | undefined;
                if (playerTransform) {
                    const dx = playerTransform.x - boss.transform.x;
                    const dy = playerTransform.y - boss.transform.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        boss.velocity.vx = (dx / dist) * speed;
                        boss.velocity.vy = (dy / dist) * speed * 0.5;
                    }
                }
            } else {
                boss.velocity.vx = 0;
                boss.velocity.vy = 20;
            }
            break;

        case BossMovementPattern.TRACKING:
            // 紧密追踪
            const playerComps2 = world.entities.get(world.playerId);
            if (playerComps2) {
                const playerTransform = playerComps2.find(c => c.constructor.name === 'Transform') as any;
                if (playerTransform) {
                    const dx = playerTransform.x - boss.transform.x;
                    const dy = playerTransform.y - boss.transform.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        boss.velocity.vx = (dx / dist) * speed * 1.5;
                        boss.velocity.vy = (dy / dist) * speed;
                    }
                }
            }
            break;

        case BossMovementPattern.DASH:
            // 冲刺
            const dashCycle = Math.sin(time * 3);
            if (dashCycle > 0.5) {
                // 冲刺阶段
                boss.velocity.vy = speed * 3;
            } else {
                // 准备阶段
                boss.velocity.vy = 20;
            }
            break;

        case BossMovementPattern.SLOW_DESCENT:
            // 缓慢下沉
            boss.velocity.vx = 0;
            boss.velocity.vy = 20;
            break;

        case BossMovementPattern.AGGRESSIVE:
            // 激进压制
            boss.velocity.vy = 50;
            boss.velocity.vx = Math.sin(time * 4) * speed * 2;
            break;

        default:
            // 默认缓慢下降
            boss.velocity.vx = 0;
            boss.velocity.vy = 20;
            break;
    }
}

/**
 * 处理 Boss 开火
 */
function handleBossFiring(
    world: World,
    boss: { id: EntityId; weapon?: Weapon },
    phaseSpec: any,
    dt: number
): void {
    if (!boss.weapon) return;

    // 检查武器冷却
    if (boss.weapon.curCD > 0) {
        boss.weapon.curCD -= dt * 1000 * (phaseSpec.modifiers.fireRate || 1);
        return;
    }

    // 开火
    const comps = world.entities.get(boss.id);
    if (comps) {
        // 检查是否已有开火意图
        const hasFireIntent = comps.some(c => c instanceof FireIntent);
        if (!hasFireIntent) {
            comps.push(new FireIntent({ firing: true }));
        }
    }

    // 重置冷却
    boss.weapon.curCD = boss.weapon.cooldown / (phaseSpec.modifiers.fireRate || 1);
}
