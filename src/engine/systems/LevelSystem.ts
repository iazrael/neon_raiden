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

import { World, pushEvent, getEvents, generateId, addComponent, removeEntity } from '../world';
import { LEVEL_CONFIG } from '../configs/level-config';
import { view } from '../world';
import { LevelTransitionComponent, BossExitComponent } from '../components/transition';
import { BossDefeatEvent, BossExitStartEvent } from '../events';

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
 * 处理 Boss 击杀事件
 *
 * 功能说明：
 * 1. 监听 BossDefeatEvent
 * 2. 防护检查：确保没有正在进行的退场
 * 3. 创建 BossExitComponent 实体
 * 4. 推送 BossExitStartEvent 事件
 *
 * @param world 世界对象
 * @param event Boss 击杀事件
 */
function processBossDefeat(world: World, event: BossDefeatEvent): void {
    // 防护：检查是否已有退场组件
    const hasExitComponent = [...view(world, [BossExitComponent])].length > 0;
    if (hasExitComponent) {
        console.warn('[LevelSystem] Boss退场已进行中，忽略重复触发');
        return;
    }

    // 创建 BossExitComponent 实体
    const exitEntityId = generateId();
    addComponent(world, exitEntityId, new BossExitComponent({
        kind: 'BossExit',
        timer: 0,
        duration: LEVEL_CONFIG.ANIMATION.BOSS_EXIT_DURATION,
        bossId: event.bossId,
        bossType: event.bossId,
    }));

    // 推送 BossExitStartEvent 事件
    pushEvent(world, {
        type: 'BossExitStart',
        bossId: event.bossId,
        bossType: event.bossId,
    } as BossExitStartEvent);
}

/**
 * 更新 Boss 退场状态
 *
 * 功能说明：
 * 1. 更新所有 BossExitComponent 的计时器
 * 2. 当退场完成时，移除组件并触发关卡过渡
 *
 * @param world 世界对象
 * @param dt 增量时间（毫秒）
 */
function updateBossExit(world: World, dt: number): void {
    const exitEntities = [...view(world, [BossExitComponent])];

    for (const [entityId, [exitComp], comps] of exitEntities) {
        // 更新计时器
        exitComp.timer += dt;

        // 检查是否完成
        if (exitComp.timer >= exitComp.duration) {
            // 移除退场实体
            removeEntity(world, entityId);

            // 触发关卡过渡
            const currentLevel = world.levelState?.currentLevel ?? 1;
            startLevelTransition(world, currentLevel, currentLevel + 1);
        }
    }
}

/**
 * 开始关卡过渡
 *
 * 功能说明：
 * 1. 创建 LevelTransitionComponent 实体
 * 2. 推送 LevelTransitionStartEvent 事件
 * 3. 如果是第一关，推送 StageOneIntroEvent 事件
 *
 * @param world 世界对象
 * @param fromLevel 来源关卡
 * @param toLevel 目标关卡
 */
export function startLevelTransition(world: World, fromLevel: number, toLevel: number): void {
    // 创建 LevelTransitionComponent 实体
    const transitionEntityId = generateId();
    addComponent(world, transitionEntityId, new LevelTransitionComponent({
        kind: 'LevelTransition',
        timer: 0,
        duration: LEVEL_CONFIG.ANIMATION.LEVEL_TRANSITION_DURATION,
        fromLevel,
        toLevel,
    }));

    // 推送 LevelTransitionStartEvent 事件
    pushEvent(world, {
        type: 'LevelTransitionStart',
        fromLevel,
        toLevel,
    });
}

/**
 * 更新关卡过渡状态
 *
 * 功能说明：
 * 1. 更新所有 LevelTransitionComponent 的计时器
 * 2. 当过渡完成时，更新 currentLevel 并推送事件
 *
 * @param world 世界对象
 * @param dt 增量时间（毫秒）
 */
function updateLevelTransitions(world: World, dt: number): void {
    const transitionEntities = [...view(world, [LevelTransitionComponent])];

    for (const [entityId, [transComp], comps] of transitionEntities) {
        // 更新计时器
        transComp.timer += dt;

        // 检查是否完成
        if (transComp.timer >= transComp.duration) {
            // 移除过渡实体
            removeEntity(world, entityId);

            // 更新当前关卡
            world.levelState!.currentLevel = transComp.toLevel;

            // 推送 LevelTransitionCompleteEvent 事件
            pushEvent(world, {
                type: 'LevelTransitionComplete',
                level: transComp.toLevel,
            });
        }
    }
}

/**
 * 关卡系统主函数
 *
 * 负责：
 * - 更新关卡进度
 * - 处理 Boss 击杀
 * - 更新 Boss 退场
 * - 处理关卡过渡
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

    // 2. 处理 Boss 击杀事件
    const bossDefeatEvents = getEvents<BossDefeatEvent>(world, 'BossDefeat');
    for (const event of bossDefeatEvents) {
        processBossDefeat(world, event);
    }

    // 3. 更新 Boss 退场
    updateBossExit(world, dt);

    // 4. 更新关卡过渡
    updateLevelTransitions(world, dt);
}
