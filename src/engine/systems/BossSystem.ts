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

import { World } from '../types';
import { BossEntranceSystem } from './boss/BossEntranceSystem';
import { BossMovementSystem } from './boss/BossMovementSystem';
import { BossCombatSystem } from './boss/BossCombatSystem';
import { BossPhaseSystem } from './boss/BossPhaseSystem';

/**
 * Boss 系统主函数（包装器）
 *
 * 按顺序调用三个Boss子系统：
 * 1. BossEntranceSystem - 处理入场
 * 2. BossMovementSystem - 处理移动
 * 3. BossCombatSystem - 处理战斗
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
}
