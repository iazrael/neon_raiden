/**
 * Boss行为系统 (BossSystem)
 *
 * @deprecated 此系统已被拆分为三个独立系统：
 * - BossEntranceSystem: 处理Boss入场
 * - BossMovementSystem: 处理Boss移动
 * - BossCombatSystem: 处理Boss战斗
 *
 * 此文件保留作为向后兼容的包装器
 *
 * 系统类型：决策层
 * 执行顺序：P1.5-7 - Boss系统组
 */

import { World } from '../world';
import { BossEntranceSystem } from './boss/BossEntranceSystem';
import { BossMovementSystem } from './boss/BossMovementSystem';
import { BossCombatSystem } from './boss/BossCombatSystem';
import { BossPhaseSystem } from './boss/BossPhaseSystem';
import { BossExitComponent } from '../components/transition';

/**
 * Boss 系统主函数（包装器）
 *
 * 按顺序调用三个Boss子系统：
 * 1. BossPhaseSystem - 处理阶段切换
 * 2. BossEntranceSystem - 处理入场
 * 3. BossMovementSystem - 处理移动
 * 4. BossCombatSystem - 处理战斗
 * 5. 更新 BossExitComponent timer
 *
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function BossSystem(world: World, dt: number): void {
    // 0. 阶段切换
    BossPhaseSystem(world, dt);

    // 1. 入场系统
    BossEntranceSystem(world, dt);

    // 2. 移动系统
    BossMovementSystem(world, dt);

    // 3. 战斗系统
    BossCombatSystem(world, dt);

    // 4. 更新 BossExitComponent timer
    updateBossExitTimers(world, dt);
}

/**
 * 更新 BossExitComponent timer
 * 用于处理 Boss 被击杀后的退场动画
 */
function updateBossExitTimers(world: World, dt: number): void {
    for (const [entityId, comps] of world.entities) {
        const exit = comps.find(c => c instanceof BossExitComponent);
        if (exit) {
            (exit as BossExitComponent).timer += dt;
        }
    }
}
