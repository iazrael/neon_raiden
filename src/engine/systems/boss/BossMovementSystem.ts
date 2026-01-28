/**
 * Boss移动系统
 *
 * 职责：
 * - 处理Boss战斗阶段的移动行为
 * - 更新Velocity组件（不创建MoveIntent）
 * - 支持13种移动模式
 * - 只作用于没有BossEntrance组件的Boss
 *
 * 系统类型：决策层
 * 执行顺序：P1.6 - 在BossEntranceSystem之后
 *
 * 依赖组件：
 * - Input: BossTag, BossAI, Transform, Velocity
 * - Output: Velocity（直接更新vx/vy）
 *
 * 与其他系统的关系：
 * - BossEntranceSystem: 通过BossEntrance组件的存在性互斥
 * - BossCombatSystem: 并行执行，各司其职
 */

import { World } from '../../types';
import { Transform, Velocity, BossTag, BossAI, BossEntrance } from '../../components';
import { view } from '../../world';
import { BOSS_DATA, BossMovementPattern, MovementConfig } from '../../configs/bossData';
import {
    BASE_MOVE_SPEED,
    BOSS_ARENA,
    VERTICAL_SPEED,
    CIRCLE_MOVE,
    TELEPORT,
    ADAPTIVE,
    FIGURE_8,
    ZIGZAG,
    SINE,
    DASH,
    AGGRESSIVE,
    SLOW_DESCENT
} from '../bossConstants';

/**
 * 检查组件是否为 Transform
 */
function isTransform(c: any): c is Transform {
    return c instanceof Transform;
}

/**
 * Boss移动系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function BossMovementSystem(world: World, dt: number): void {
    // 查询所有Boss，但排除正在入场的
    for (const [id, comps] of view(world, [BossTag, BossAI, Transform, Velocity])) {
        // 排除正在入场的Boss
        if (comps.some(BossEntrance.check)) continue;

        const transform = comps.find(Transform.check)!;
        const velocity = comps.find(Velocity.check)!;
        const bossAI = comps.find(BossAI.check)!;
        const bossTag = comps.find(BossTag.check)!;

        // 获取Boss配置
        const bossSpec = BOSS_DATA[bossTag.id];
        if (!bossSpec) {
            console.error(`Boss配置不存在: ${bossTag.id}`);
            continue;
        }

        const phaseSpec = bossSpec.phases[bossAI.phase];
        if (!phaseSpec) {
            console.error(`Boss阶段不存在: phase=${bossAI.phase}`);
            continue;
        }

        // 处理移动
        handleBossMovement(world, { id, transform, velocity, bossAI }, phaseSpec.movePattern, phaseSpec.modifiers, phaseSpec.movementConfig, dt);
    }
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
    boss: { id: number; transform: Transform; velocity: Velocity; bossAI: BossAI },
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
            // 站桩，轻微上下浮动
            boss.velocity.vx = 0;
            boss.velocity.vy = Math.sin(time * BOSS_ARENA.IDLE_FLOAT_FREQUENCY) * BOSS_ARENA.IDLE_FLOAT_AMPLITUDE;
            break;

        case BossMovementPattern.SINE:
            // 正弦游动（只横向移动，y不变化）
            const sineFreq = config.frequency || SINE.DEFAULT_FREQUENCY;
            const sineAmp = config.amplitude || SINE.DEFAULT_AMPLITUDE;
            boss.velocity.vx = Math.sin(time * sineFreq) * baseSpeed * sineAmp;
            boss.velocity.vy = 0; // 不向下移动
            break;

        case BossMovementPattern.FIGURE_8:
            // 8字形（绕中心点运动）
            const fig8Freq = config.frequency || FIGURE_8.DEFAULT_FREQUENCY;
            const fig8YFreq = config.frequency ? config.frequency * 2 : FIGURE_8.DEFAULT_Y_FREQUENCY;
            const centerX = world.width / 2;
            const centerY = config.centerY ?? FIGURE_8.CENTER_Y;
            const fig8RadiusX = config.radiusX ?? FIGURE_8.RADIUS_X;
            const fig8RadiusY = config.radiusY ?? FIGURE_8.RADIUS_Y;

            // 目标位置
            const targetFig8X = centerX + Math.sin(time * fig8Freq) * fig8RadiusX;
            const targetFig8Y = centerY + Math.sin(time * fig8YFreq) * fig8RadiusY;

            boss.velocity.vx = (targetFig8X - boss.transform.x) * 2;
            boss.velocity.vy = (targetFig8Y - boss.transform.y) * 2;
            break;

        case BossMovementPattern.CIRCLE:
            // 绕圈移动
            const circleCenterX = config.centerX ?? world.width * CIRCLE_MOVE.DEFAULT_CENTER_X_RATIO;
            const circleCenterY = config.centerY ?? CIRCLE_MOVE.DEFAULT_CENTER_Y;
            const radius = config.radius || CIRCLE_MOVE.DEFAULT_RADIUS;
            const angle = time * (config.frequency || CIRCLE_MOVE.DEFAULT_FREQUENCY);
            const targetCircleX = circleCenterX + Math.cos(angle) * radius;
            const targetCircleY = circleCenterY + Math.sin(angle) * radius * CIRCLE_MOVE.Y_RADIUS_RATIO;
            boss.velocity.vx = (targetCircleX - boss.transform.x) * 2;
            boss.velocity.vy = (targetCircleY - boss.transform.y) * 2;
            break;

        case BossMovementPattern.ZIGZAG:
            // 之字形（横向快速移动，y轻微波动）
            const zigzagInterval = config.zigzagInterval || ZIGZAG.DEFAULT_SWITCH_INTERVAL;
            const zigzagPhase = Math.floor(time / zigzagInterval) % 2;
            boss.velocity.vx = zigzagPhase === 0 ? baseSpeed : -baseSpeed;
            boss.velocity.vy = Math.sin(time * ZIGZAG.Y_WOBBLE_FREQUENCY) * ZIGZAG.Y_WOBBLE_AMPLITUDE;
            break;

        case BossMovementPattern.FOLLOW:
            // 追踪玩家（但不追踪到下半屏）
            const playerComps = world.entities.get(world.playerId);
            if (playerComps) {
                const playerTransform = playerComps.find(isTransform) as Transform | undefined;
                if (playerTransform) {
                    const dx = playerTransform.x - boss.transform.x;
                    const distSq = dx * dx;
                    if (distSq > 0.01) {
                        const dist = Math.sqrt(distSq);
                        boss.velocity.vx = (dx / dist) * baseSpeed;
                    }
                }
            }
            // y在目标位置附近轻微波动
            boss.velocity.vy = Math.sin(time * 3) * BOSS_ARENA.IDLE_FLOAT_AMPLITUDE;
            break;

        case BossMovementPattern.TRACKING:
            // 紧密追踪（但保持在y=150附近）
            const playerComps2 = world.entities.get(world.playerId);
            if (playerComps2) {
                const playerTransform = playerComps2.find(Transform.check);
                if (playerTransform) {
                    const dx = playerTransform.x - boss.transform.x;
                    const distSq = dx * dx;
                    if (distSq > 0.01) {
                        const dist = Math.sqrt(distSq);
                        boss.velocity.vx = (dx / dist) * baseSpeed * 1.5;
                    }
                }
            }
            // y在目标位置附近波动
            boss.velocity.vy = Math.sin(time * 3) * (BOSS_ARENA.IDLE_FLOAT_AMPLITUDE + 3);
            break;

        case BossMovementPattern.DASH:
            // 冲刺（向下冲刺后回到上方）
            const dashSpeed = config.dashSpeed || baseSpeed * DASH.DEFAULT_SPEED_MULTIPLIER;
            const dashFreq = config.frequency || DASH.DEFAULT_CYCLE_FREQUENCY;
            const dashCycle = Math.sin(time * dashFreq);
            if (dashCycle > DASH.DEFAULT_DASH_THRESHOLD) {
                // 冲刺阶段：向下
                boss.velocity.vy = dashSpeed;
                boss.velocity.vx = 0;
            } else {
                // 准备阶段：回到目标位置
                const targetY = DASH.PREP_TARGET_Y;
                boss.velocity.vy = (targetY - boss.transform.y) * DASH.PREP_APPROACH_FACTOR;
                boss.velocity.vx = 0;
            }
            break;

        case BossMovementPattern.SLOW_DESCENT:
            // 缓慢下沉（但有上限）
            if (boss.transform.y < SLOW_DESCENT.LOWER_BOUND_Y) {
                boss.velocity.vx = Math.cos(time * SLOW_DESCENT.LATERAL_DRIFT_FREQUENCY) * baseSpeed * SLOW_DESCENT.LATERAL_DRIFT_AMPLITUDE;
                boss.velocity.vy = config.verticalSpeed || VERTICAL_SPEED.SLOW;
            } else {
                // 到达下限，保持位置并横向移动
                boss.velocity.vx = Math.cos(time * SLOW_DESCENT.LATERAL_DRIFT_FREQUENCY) * baseSpeed * SLOW_DESCENT.LATERAL_DRIFT_AMPLITUDE;
                boss.velocity.vy = (SLOW_DESCENT.LOWER_BOUND_Y - boss.transform.y) * SLOW_DESCENT.APPROACH_FACTOR;
            }
            break;

        case BossMovementPattern.AGGRESSIVE:
            // 激进压制（在UPPER_BOUND_Y到LOWER_BOUND_Y之间移动）
            const aggressiveFreq = config.frequency || AGGRESSIVE.DEFAULT_FREQUENCY;
            const aggressiveSpeedMult = config.speedMultiplier || AGGRESSIVE.DEFAULT_SPEED_MULTIPLIER;
            boss.velocity.vx = Math.sin(time * aggressiveFreq) * baseSpeed * aggressiveSpeedMult;

            // 根据正弦波在指定范围内移动
            const targetAggressiveY = AGGRESSIVE.CENTER_Y + Math.sin(time * aggressiveFreq * 0.5) * AGGRESSIVE.Y_SPREAD;
            boss.velocity.vy = (targetAggressiveY - boss.transform.y) * AGGRESSIVE.APPROACH_FACTOR;
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
                // 在当前位置轻微漂浮
                boss.velocity.vx = Math.sin(time * TELEPORT.IDLE_DRIFT_FREQUENCY) * baseSpeed * TELEPORT.IDLE_DRIFT_SPEED_MULTIPLIER;
                boss.velocity.vy = Math.cos(time * TELEPORT.IDLE_DRIFT_FREQUENCY) * baseSpeed * TELEPORT.IDLE_DRIFT_SPEED_MULTIPLIER;
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
                        boss.velocity.vy = Math.cos(time * 3) * baseSpeed * 0.3;
                    } else {
                        // 远距离：追踪（但保持在上半区）
                        const trackSpeed = baseSpeed * ADAPTIVE.TRACKING_SPEED_MULTIPLIER;
                        boss.velocity.vx = (dx / dist) * trackSpeed;

                        // y不追踪玩家，保持在指定范围内
                        const targetAdaptiveY = ADAPTIVE.TRACKING_CENTER_Y + Math.sin(time) * ADAPTIVE.TRACKING_Y_SPREAD;
                        boss.velocity.vy = (targetAdaptiveY - boss.transform.y) * 0.3;
                    }
                }
            } else {
                // 无玩家时轻微漂浮
                boss.velocity.vx = Math.sin(time * 2) * baseSpeed * ADAPTIVE.IDLE_DRIFT_SPEED_MULTIPLIER;
                boss.velocity.vy = Math.cos(time * 2) * baseSpeed * ADAPTIVE.IDLE_DRIFT_SPEED_MULTIPLIER;
            }
            break;

        default:
            // 默认轻微漂浮
            boss.velocity.vx = Math.sin(time * 2) * baseSpeed * 0.3;
            boss.velocity.vy = Math.cos(time * 2) * baseSpeed * 0.3;
            break;
    }
}
