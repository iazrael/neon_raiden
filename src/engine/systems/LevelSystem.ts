/**
 * 关卡系统
 *
 * 负责管理游戏关卡的核心逻辑，包括：
 * - 进度更新（时间驱动 + 击杀加速）
 * - 关卡过渡
 * - Boss 生成触发
 * - 难度动态调整
 *
 * @file LevelSystem.ts
 * @module LevelSystem
 */

import { World } from '../world';
import { LEVEL_CONFIG } from '../configs/level-config';
import { view } from '../world';
import { LevelTransitionComponent } from '../components/transition';

/**
 * 更新关卡进度
 *
 * 功能说明：
 * 1. 累加每帧的时间增量到 elapsedTime
 * 2. 根据时间计算基础进度增长（1.5%/秒）
 * 3. 应用最低时间保护（60秒至少80%进度）
 * 4. 消耗击杀计数加速进度（每次击杀 +0.5%）
 * 5. 将进度封顶到 120%
 *
 * @param world 世界对象，持有 levelState 和实体数据
 * @param dt 增量时间（毫秒）
 */
function updateProgress(world: World, dt: number): void {
    const state = world.levelState;

    // 边界检查：负时间不处理
    if (dt < 0) return;

    // 边界检查：levelState 必须存在
    if (!state) {
        console.error('[LevelSystem] levelState未初始化');
        return;
    }

    // 检查是否在过渡中（如果存在 LevelTransitionComponent 实体，则不更新进度）
    const transitionEntities = [...view(world, [LevelTransitionComponent])];
    const isTransitioning = transitionEntities.length > 0;
    if (isTransitioning) return;

    // 1. 累加时间
    state.elapsedTime += dt;

    // 2. 时间驱动增长（1.5%/秒）
    const timeBasedGrowth = (dt / 1000) * LEVEL_CONFIG.PROGRESS.PER_SECOND_GROWTH_RATE;
    state.progress += timeBasedGrowth;

    // 3. 最低时间保护：确保即使没有击杀，也能在60秒内达到80%进度
    const minProgress = (state.elapsedTime / LEVEL_CONFIG.PROGRESS.MIN_LEVEL_DURATION)
        * 100 * LEVEL_CONFIG.PROGRESS.TIME_PROTECTION_COEFFICIENT;
    state.progress = Math.max(state.progress, minProgress);

    // 4. 击杀加速：消耗击杀计数并加速进度
    const killBonus = state.killCount * LEVEL_CONFIG.PROGRESS.KILL_BONUS;
    state.progress += killBonus;
    state.killCount = 0; // 清零击杀计数

    // 5. 封顶到 120%
    state.progress = Math.min(state.progress, LEVEL_CONFIG.PROGRESS.MAX_PROGRESS);
}

/**
 * 关卡系统主函数
 *
 * 负责：
 * - 更新关卡进度
 * - 处理关卡过渡
 * - 触发 Boss 生成
 * - 调整游戏难度
 *
 * @param world 世界对象
 * @param dt 增量时间（毫秒）
 */
export function LevelSystem(world: World, dt: number): void {
    const state = world.levelState;

    // 边界检查：levelState 必须存在
    if (!state) {
        console.error('[LevelSystem] levelState未初始化');
        return;
    }

    // 1. 更新关卡进度
    updateProgress(world, dt);

    // TODO: Task 6-8 的其他功能将在后续实现
    // - checkAndTriggerBoss()
    // - handleLevelTransition()
    // - adjustDifficulty()
}
