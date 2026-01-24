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

/**
 * 敌人行为状态
 */
enum EnemyBehavior {
    IDLE = 'idle',           // 闲置
    MOVE_DOWN = 'move_down', // 直线向下
    SINE_WAVE = 'sine_wave', // 正弦波移动
    CHASE = 'chase',         // 追踪玩家
    RAM = 'ram',             // 冲撞
    STRAFE = 'strafe',       // 侧移
    CIRCLE = 'circle'        // 环绕
}

/**
 * 敌人行为配置
 */
interface EnemyBehaviorConfig {
    moveSpeed: number;
    fireInterval: number;
    behavior: EnemyBehavior;
    aggressiveness: number; // 0-1，影响攻击频率
}

/**
 * 敌人类型对应的默认行为配置
 */
const ENEMY_BEHAVIORS: Partial<Record<EnemyId, EnemyBehaviorConfig>> = {
    // NORMAL - 普通敌人：正弦波移动，低攻击性
    [EnemyId.NORMAL]: {
        moveSpeed: 100,
        fireInterval: 2000,
        behavior: EnemyBehavior.SINE_WAVE,
        aggressiveness: 0.3
    },
    // FAST - 飞翼：快速直线移动
    [EnemyId.FAST]: {
        moveSpeed: 250,
        fireInterval: 1500,
        behavior: EnemyBehavior.MOVE_DOWN,
        aggressiveness: 0.5
    },
    // TANK - 坦克：慢速，高攻击性
    [EnemyId.TANK]: {
        moveSpeed: 50,
        fireInterval: 3000,
        behavior: EnemyBehavior.MOVE_DOWN,
        aggressiveness: 0.8
    },
    // KAMIKAZE - 神风特攻：追踪玩家冲撞
    [EnemyId.KAMIKAZE]: {
        moveSpeed: 200,
        fireInterval: Infinity,
        behavior: EnemyBehavior.CHASE,
        aggressiveness: 1.0
    },
    // ELITE_GUNBOAT - 精英炮艇：快速连射
    [EnemyId.ELITE_GUNBOAT]: {
        moveSpeed: 80,
        fireInterval: 500,
        behavior: EnemyBehavior.STRAFE,
        aggressiveness: 0.9
    }
};

/**
 * 敌人系统主函数
 * @param world 世界对象
 * @param dt 时间增量（秒）
 */
export function EnemySystem(world: World, dt: number): void {
    // 获取玩家位置
    let playerPos: { x: number; y: number } | null = null;
    for (const [id, comps] of world.entities) {
        const playerTag = comps.find(c => c.constructor.name === 'PlayerTag');
        if (playerTag) {
            const transform = comps.find(c => c instanceof Transform) as Transform | undefined;
            if (transform) {
                playerPos = { x: transform.x, y: transform.y };
            }
            break;
        }
    }

    if (!playerPos) return; // 没有玩家，不处理

    // 处理每个敌人
    for (const [enemyId, comps] of world.entities) {
        const enemyTag = comps.find(c => c instanceof EnemyTag) as EnemyTag | undefined;
        if (!enemyTag) continue;

        const transform = comps.find(c => c instanceof Transform) as Transform | undefined;
        if (!transform) continue;

        // 获取敌人行为配置
        const config = ENEMY_BEHAVIORS[enemyTag.id] || ENEMY_BEHAVIORS[EnemyId.NORMAL];

        // 更新状态计时器
        enemyTag.timer += dt * 1000;

        // 根据行为模式生成移动意图
        generateMoveIntent(comps, transform, playerPos, config, enemyTag);

        // 根据攻击配置生成开火意图
        generateFireIntent(comps, config, enemyTag);
    }
}

/**
 * 生成移动意图
 */
function generateMoveIntent(
    comps: unknown[],
    transform: Transform,
    playerPos: { x: number; y: number },
    config: EnemyBehaviorConfig,
    enemyTag: EnemyTag
): void {
    let dx = 0;
    let dy = 0;

    switch (config.behavior) {
        case EnemyBehavior.MOVE_DOWN:
            // 直线向下
            dy = config.moveSpeed;
            break;

        case EnemyBehavior.SINE_WAVE:
            // 正弦波移动：向下 + 横向正弦
            dy = config.moveSpeed;
            dx = Math.sin(transform.y * 0.02) * config.moveSpeed * 0.5;
            break;

        case EnemyBehavior.CHASE:
            // 追踪玩家
            const angleToPlayer = Math.atan2(
                playerPos.y - transform.y,
                playerPos.x - transform.x
            );
            dx = Math.cos(angleToPlayer) * config.moveSpeed;
            dy = Math.sin(angleToPlayer) * config.moveSpeed;
            break;

        case EnemyBehavior.RAM:
            // 冲撞：加速向玩家
            const ramAngle = Math.atan2(
                playerPos.y - transform.y,
                playerPos.x - transform.x
            );
            dx = Math.cos(ramAngle) * config.moveSpeed * 1.5;
            dy = Math.sin(ramAngle) * config.moveSpeed * 1.5;
            break;

        case EnemyBehavior.STRAFE:
            // 侧移：向下 + 周期性横向
            dy = config.moveSpeed * 0.5;
            const strafeDir = Math.sin(enemyTag.timer * 0.002) > 0 ? 1 : -1;
            dx = strafeDir * config.moveSpeed;
            break;

        case EnemyBehavior.CIRCLE:
            // 环绕玩家
            const circleAngle = Math.atan2(
                transform.y - playerPos.y,
                transform.x - playerPos.x
            ) + 0.02; // 缓慢旋转
            const circleRadius = 150;
            const targetX = playerPos.x + Math.cos(circleAngle) * circleRadius;
            const targetY = playerPos.y + Math.sin(circleAngle) * circleRadius;
            dx = (targetX - transform.x) * 2;
            dy = (targetY - transform.y) * 2;
            break;

        default:
            dy = config.moveSpeed;
    }

    // 添加移动意图
    if (dx !== 0 || dy !== 0) {
        comps.push(new MoveIntent({
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
    comps: unknown[],
    config: EnemyBehaviorConfig,
    enemyTag: EnemyTag
): void {
    // 检查是否有武器组件
    const weapon = comps.find(c => c instanceof Weapon) as Weapon | undefined;
    if (!weapon) return;

    // 检查是否在冷却中
    if (weapon.curCD > 0) return;

    // 检查是否达到攻击间隔
    if (enemyTag.timer < config.fireInterval) return;

    // 根据攻击性决定是否开火
    if (Math.random() > config.aggressiveness) return;

    // 生成开火意图
    comps.push(new FireIntent({
        firing: true
    }));

    // 重置计时器
    enemyTag.timer = 0;
}
