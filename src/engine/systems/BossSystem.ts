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
import { BOSS_DATA, BossMovementPattern, MovementConfig } from '../configs/bossData';
import { pushEvent, view } from '../world';
import {
    BASE_MOVE_SPEED,
    VERTICAL_SPEED,
    CIRCLE_MOVE,
    TELEPORT,
    ADAPTIVE,
    FIGURE_8,
    ZIGZAG,
    SINE,
    DASH,
    AGGRESSIVE
} from './bossConstants';

/**
 * 检查组件是否为 Transform
 */
function isTransform(c: any): c is Transform {
    return c instanceof Transform;
}

/**
 * Boss 系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function BossSystem(world: World, dt: number): void {
    for (const [id, [bossTag, bossAI, weapon, transform, velocity]] of view(world, [BossTag, BossAI, Weapon, Transform, Velocity])) {
        const boss = {
            id,
            transform,
            velocity,
            bossTag,
            bossAI,
            weapon
        };
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
    const bossSpec = BOSS_DATA[boss.bossTag.id];
    if (!bossSpec) return;

    const phaseSpec = bossSpec.phases[boss.bossAI.phase];
    if (!phaseSpec) return;

    // 1. 处理移动
    handleBossMovement(world, boss, phaseSpec.movePattern, phaseSpec.modifiers, phaseSpec.movementConfig, dt);

    // 2. 处理开火
    handleBossFiring(world, boss, phaseSpec, dt);
}

/**
 * 处理 Boss 移动
 *
 * @param world 世界对象
 * @param boss Boss对象（包含transform, velocity, bossAI）
 * @param pattern 移动模式
 * @param modifiers 修正器（moveSpeed等）
 * @param movementConfig 移动配置参数（可选）
 * @param dt 时间增量
 */
function handleBossMovement(
    world: World,
    boss: { transform: Transform; velocity: Velocity; bossAI: BossAI },
    pattern: BossMovementPattern,
    modifiers: { moveSpeed?: number; fireRate?: number; damage?: number },
    movementConfig: MovementConfig | undefined,
    dt: number
): void {
    // 读取配置参数
    const config = movementConfig || {};
    const baseSpeed = (modifiers.moveSpeed || 1.0) * (config.speedMultiplier || 1.0) * BASE_MOVE_SPEED;
    const time = world.time;

    switch (pattern) {
        case BossMovementPattern.IDLE:
            // 站桩，缓慢下降
            boss.velocity.vx = 0;
            boss.velocity.vy = config.verticalSpeed || VERTICAL_SPEED.SLOW;
            break;

        case BossMovementPattern.SINE:
            // 正弦游动
            const sineFreq = config.frequency || SINE.DEFAULT_FREQUENCY;
            const sineAmp = config.amplitude || SINE.DEFAULT_AMPLITUDE;
            boss.velocity.vx = Math.sin(time * sineFreq) * baseSpeed * sineAmp;
            boss.velocity.vy = config.verticalSpeed || VERTICAL_SPEED.NORMAL;
            break;

        case BossMovementPattern.FIGURE_8:
            // 8字形
            const fig8Freq = config.frequency || FIGURE_8.DEFAULT_FREQUENCY;
            const fig8YFreq = config.frequency ? config.frequency * 2 : FIGURE_8.DEFAULT_Y_FREQUENCY;
            boss.velocity.vx = Math.sin(time * fig8Freq) * baseSpeed;
            boss.velocity.vy = Math.sin(time * fig8YFreq) * VERTICAL_SPEED.NORMAL;
            break;

        case BossMovementPattern.CIRCLE:
            // 绕圈移动
            const centerX = config.centerX ?? world.width * CIRCLE_MOVE.DEFAULT_CENTER_X_RATIO;
            const centerY = config.centerY || CIRCLE_MOVE.DEFAULT_CENTER_Y;
            const radius = config.radius || CIRCLE_MOVE.DEFAULT_RADIUS;
            const angle = time * (config.frequency || CIRCLE_MOVE.DEFAULT_FREQUENCY);
            const targetX = centerX + Math.cos(angle) * radius;
            const targetY = centerY + Math.sin(angle) * radius;
            boss.velocity.vx = (targetX - boss.transform.x) * 2;
            boss.velocity.vy = (targetY - boss.transform.y) * 2;
            break;

        case BossMovementPattern.ZIGZAG:
            // 之字形
            const zigzagInterval = config.zigzagInterval || ZIGZAG.DEFAULT_SWITCH_INTERVAL;
            const zigzagPhase = Math.floor(time / zigzagInterval) % 2;
            boss.velocity.vx = zigzagPhase === 0 ? baseSpeed : -baseSpeed;
            boss.velocity.vy = config.verticalSpeed || VERTICAL_SPEED.FAST;
            break;

        case BossMovementPattern.FOLLOW:
            // 追踪玩家
            const playerComps = world.entities.get(world.playerId);
            if (playerComps) {
                const playerTransform = playerComps.find(isTransform) as Transform | undefined;
                if (playerTransform) {
                    const dx = playerTransform.x - boss.transform.x;
                    const dy = playerTransform.y - boss.transform.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq > 0.01) {
                        const dist = Math.sqrt(distSq);
                        boss.velocity.vx = (dx / dist) * baseSpeed;
                        boss.velocity.vy = (dy / dist) * baseSpeed * 0.5;
                    }
                }
            } else {
                boss.velocity.vx = 0;
                boss.velocity.vy = VERTICAL_SPEED.SLOW;
            }
            break;

        case BossMovementPattern.TRACKING:
            // 紧密追踪
            const playerComps2 = world.entities.get(world.playerId);
            if (playerComps2) {
                const playerTransform = playerComps2.find(Transform.check);
                if (playerTransform) {
                    const dx = playerTransform.x - boss.transform.x;
                    const dy = playerTransform.y - boss.transform.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq > 0.01) {
                        const dist = Math.sqrt(distSq);
                        boss.velocity.vx = (dx / dist) * baseSpeed * 1.5;
                        boss.velocity.vy = (dy / dist) * baseSpeed;
                    }
                }
            }
            break;

        case BossMovementPattern.DASH:
            // 冲刺
            const dashSpeed = config.dashSpeed || baseSpeed * DASH.DEFAULT_SPEED_MULTIPLIER;
            const dashFreq = config.frequency || DASH.DEFAULT_CYCLE_FREQUENCY;
            const dashCycle = Math.sin(time * dashFreq);
            if (dashCycle > DASH.DEFAULT_DASH_THRESHOLD) {
                // 冲刺阶段
                boss.velocity.vy = dashSpeed;
                boss.velocity.vx = 0;
            } else {
                // 准备阶段
                boss.velocity.vy = VERTICAL_SPEED.SLOW;
                boss.velocity.vx = 0;
            }
            break;

        case BossMovementPattern.SLOW_DESCENT:
            // 缓慢下沉
            boss.velocity.vx = 0;
            boss.velocity.vy = config.verticalSpeed || VERTICAL_SPEED.SLOW;
            break;

        case BossMovementPattern.AGGRESSIVE:
            // 激进压制
            const aggressiveFreq = config.frequency || AGGRESSIVE.DEFAULT_FREQUENCY;
            const aggressiveSpeedMult = config.speedMultiplier || AGGRESSIVE.DEFAULT_SPEED_MULTIPLIER;
            boss.velocity.vy = config.verticalSpeed || AGGRESSIVE.DEFAULT_VERTICAL_SPEED;
            boss.velocity.vx = Math.sin(time * aggressiveFreq) * baseSpeed * aggressiveSpeedMult;
            break;

        case BossMovementPattern.RANDOM_TELEPORT:
            // 随机瞬移
            const teleportInterval = config.teleportInterval || TELEPORT.DEFAULT_INTERVAL;
            const teleportWindow = TELEPORT.DEFAULT_TELEPORT_WINDOW;
            const timeInCycle = time % teleportInterval;

            if (timeInCycle < teleportWindow) {
                // 瞬移窗口：直接设置位置
                const marginX = TELEPORT.MARGIN_X;
                const marginY = TELEPORT.MARGIN_Y;
                boss.transform.x = marginX + Math.random() * (world.width - marginX * 2);
                boss.transform.y = marginY + Math.random() * TELEPORT.MAX_Y_SPREAD;
                boss.velocity.vx = 0;
                boss.velocity.vy = 0;
            } else {
                // 缓慢下降
                boss.velocity.vx = 0;
                boss.velocity.vy = VERTICAL_SPEED.SLOW;
            }
            break;

        case BossMovementPattern.ADAPTIVE:
            // 自适应移动
            const threshold = config.closeRangeThreshold || ADAPTIVE.DEFAULT_CLOSE_RANGE_THRESHOLD;
            const playerComps3 = world.entities.get(world.playerId);
            if (playerComps3) {
                const playerTransform = playerComps3.find(Transform.check);
                if (playerTransform) {
                    const dx = playerTransform.x - boss.transform.x;
                    const dy = playerTransform.y - boss.transform.y;
                    const distSq = dx * dx + dy * dy;
                    const dist = Math.sqrt(distSq);

                    if (dist < threshold) {
                        // 近距离：闪避（8字形）
                        const dodgeSpeed = baseSpeed * ADAPTIVE.DODGE_SPEED_MULTIPLIER;
                        boss.velocity.vx = Math.sin(time * 3) * dodgeSpeed;
                        boss.velocity.vy = Math.cos(time * 3) * baseSpeed;
                    } else if (distSq > 0.01) {
                        // 远距离：追踪
                        const trackSpeed = baseSpeed * ADAPTIVE.TRACKING_SPEED_MULTIPLIER;
                        boss.velocity.vx = (dx / dist) * trackSpeed;
                        boss.velocity.vy = (dy / dist) * trackSpeed * 0.5;
                    }
                }
            } else {
                // 无玩家时缓慢下降
                boss.velocity.vx = 0;
                boss.velocity.vy = VERTICAL_SPEED.SLOW;
            }
            break;

        default:
            // 默认缓慢下降
            boss.velocity.vx = 0;
            boss.velocity.vy = VERTICAL_SPEED.SLOW;
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
        boss.weapon.curCD -= dt * (phaseSpec.modifiers.fireRate || 1);
        return;
    }

    // 开火
    const comps = world.entities.get(boss.id);
    if (comps) {
        // 检查是否已有开火意图
        const hasFireIntent = comps.some(FireIntent.check);
        if (!hasFireIntent) {
            comps.push(new FireIntent({ firing: true }));
        }
    }

    // 重置冷却
    boss.weapon.curCD = boss.weapon.cooldown / (phaseSpec.modifiers.fireRate || 1);
}
