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
import { Transform, Velocity, BossTag, BossAI, Weapon, FireIntent, BossEntrance, InvulnerableState, MoveIntent, SpeedStat } from '../components';
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

    // 0. 检查入场状态（优先级最高）
    const comps = world.entities.get(boss.id);
    if (comps) {
        const entrance = comps.find(BossEntrance.check);
        if (entrance) {
            // 入场阶段：产生移动意图（由MovementSystem执行实际移动）
            if (boss.transform.y < entrance.targetY) {
                // 临时提高速度限制，确保Boss能以entranceSpeed移动
                const speedStat = comps.find(SpeedStat.check) as SpeedStat | undefined;
                if (speedStat && speedStat.maxLinear < entrance.entranceSpeed) {
                    speedStat.maxLinear = entrance.entranceSpeed;
                }

                // 查找或创建MoveIntent组件
                let moveIntent = comps.find(MoveIntent.check) as MoveIntent | undefined;
                if (moveIntent) {
                    // 更新现有意图
                    moveIntent.dx = 0;
                    moveIntent.dy = entrance.entranceSpeed / 1000; // 转换为像素/毫秒
                    moveIntent.type = 'velocity';
                } else {
                    // 创建新的移动意图
                    comps.push(new MoveIntent({
                        dx: 0,
                        dy: entrance.entranceSpeed / 1000, // 转换为像素/毫秒
                        type: 'velocity'
                    }));
                }
            } else {
                // 到达目标位置，完成入场
                // 移除BossEntrance组件
                const entranceIndex = comps.indexOf(entrance);
                if (entranceIndex !== -1) {
                    comps.splice(entranceIndex, 1);
                }
                // 移除可能存在的无敌状态
                const invuln = comps.find(InvulnerableState.check);
                if (invuln) {
                    const invulnIndex = comps.indexOf(invuln);
                    if (invulnIndex !== -1) {
                        comps.splice(invulnIndex, 1);
                    }
                }
            }
            return; // 入场期间不执行战斗逻辑
        }
    }

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
            // 站桩，轻微上下浮动
            boss.velocity.vx = 0;
            boss.velocity.vy = Math.sin(time * 2) * 5; // 轻微浮动
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
            const centerY = 150; // 固定中心在y=150
            const fig8RadiusX = 150;
            const fig8RadiusY = 50;

            // 目标位置
            const targetFig8X = centerX + Math.sin(time * fig8Freq) * fig8RadiusX;
            const targetFig8Y = centerY + Math.sin(time * fig8YFreq) * fig8RadiusY;

            boss.velocity.vx = (targetFig8X - boss.transform.x) * 2;
            boss.velocity.vy = (targetFig8Y - boss.transform.y) * 2;
            break;

        case BossMovementPattern.CIRCLE:
            // 绕圈移动
            const circleCenterX = config.centerX ?? world.width * CIRCLE_MOVE.DEFAULT_CENTER_X_RATIO;
            const circleCenterY = config.centerY || 180;
            const radius = config.radius || CIRCLE_MOVE.DEFAULT_RADIUS;
            const angle = time * (config.frequency || CIRCLE_MOVE.DEFAULT_FREQUENCY);
            const targetCircleX = circleCenterX + Math.cos(angle) * radius;
            const targetCircleY = circleCenterY + Math.sin(angle) * radius * 0.5; // 椭圆形
            boss.velocity.vx = (targetCircleX - boss.transform.x) * 2;
            boss.velocity.vy = (targetCircleY - boss.transform.y) * 2;
            break;

        case BossMovementPattern.ZIGZAG:
            // 之字形（横向快速移动，y轻微波动）
            const zigzagInterval = config.zigzagInterval || ZIGZAG.DEFAULT_SWITCH_INTERVAL;
            const zigzagPhase = Math.floor(time / zigzagInterval) % 2;
            boss.velocity.vx = zigzagPhase === 0 ? baseSpeed : -baseSpeed;
            boss.velocity.vy = Math.sin(time * 0.8) * 5; // 轻微波动
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
            // y在150附近轻微波动
            boss.velocity.vy = Math.sin(time * 3) * 5;
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
            // y在150附近波动
            boss.velocity.vy = Math.sin(time * 3) * 8;
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
                // 准备阶段：回到y=150
                const targetY = 150;
                boss.velocity.vy = (targetY - boss.transform.y) * 0.5;
                boss.velocity.vx = 0;
            }
            break;

        case BossMovementPattern.SLOW_DESCENT:
            // 缓慢下沉（但有上限）
            if (boss.transform.y < 250) {
                boss.velocity.vx = Math.cos(time * 1.2) * baseSpeed * 0.3;
                boss.velocity.vy = config.verticalSpeed || VERTICAL_SPEED.SLOW;
            } else {
                // 到达下限，保持y=250并横向移动
                boss.velocity.vx = Math.cos(time * 1.2) * baseSpeed * 0.3;
                boss.velocity.vy = (250 - boss.transform.y) * 0.5;
            }
            break;

        case BossMovementPattern.AGGRESSIVE:
            // 激进压制（在100-250之间移动）
            const aggressiveFreq = config.frequency || AGGRESSIVE.DEFAULT_FREQUENCY;
            const aggressiveSpeedMult = config.speedMultiplier || AGGRESSIVE.DEFAULT_SPEED_MULTIPLIER;
            boss.velocity.vx = Math.sin(time * aggressiveFreq) * baseSpeed * aggressiveSpeedMult;

            // 根据正弦波在100-250之间移动
            const targetAggressiveY = 175 + Math.sin(time * aggressiveFreq * 0.5) * 75;
            boss.velocity.vy = (targetAggressiveY - boss.transform.y) * 0.5;
            break;

        case BossMovementPattern.RANDOM_TELEPORT:
            // 随机瞬移
            const teleportInterval = config.teleportInterval || TELEPORT.DEFAULT_INTERVAL;
            const teleportWindow = TELEPORT.DEFAULT_TELEPORT_WINDOW;
            const timeInCycle = time % teleportInterval;

            if (timeInCycle < teleportWindow) {
                // 瞬移窗口：直接设置位置（限制在y=80-300之间）
                const marginX = TELEPORT.MARGIN_X;
                const marginY = TELEPORT.MARGIN_Y;
                boss.transform.x = marginX + Math.random() * (world.width - marginX * 2);
                boss.transform.y = marginY + Math.random() * TELEPORT.MAX_Y_SPREAD;
                boss.velocity.vx = 0;
                boss.velocity.vy = 0;
            } else {
                // 在当前位置轻微漂浮
                boss.velocity.vx = Math.sin(time * 2) * baseSpeed * 0.2;
                boss.velocity.vy = Math.cos(time * 2) * baseSpeed * 0.2;
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

                        // y不追踪玩家，保持在150-250之间
                        const targetAdaptiveY = 200 + Math.sin(time) * 50;
                        boss.velocity.vy = (targetAdaptiveY - boss.transform.y) * 0.3;
                    }
                }
            } else {
                // 无玩家时在y=200附近轻微漂浮
                boss.velocity.vx = Math.sin(time * 2) * baseSpeed * 0.3;
                boss.velocity.vy = Math.cos(time * 2) * baseSpeed * 0.3;
            }
            break;

        default:
            // 默认轻微漂浮
            boss.velocity.vx = Math.sin(time * 2) * baseSpeed * 0.3;
            boss.velocity.vy = Math.cos(time * 2) * baseSpeed * 0.3;
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
