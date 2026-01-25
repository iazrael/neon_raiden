/**
 * 动态难度系统 (DifficultySystem)
 *
 * 职责：
 * - 根据玩家表现动态调整游戏难度
 * - 影响刷怪频率、敌人属性、掉落率
 * - 每隔一定时间评估一次玩家表现
 *
 * 系统类型：刷怪层
 * 执行顺序：P6 - 刷怪层最先执行
 */

import { World } from '../types';
import { Health, Weapon } from '../components';

/**
 * 难度状态枚举
 */
enum DifficultyState {
    EASY = 'EASY',
    NORMAL = 'NORMAL',
    HARD = 'HARD'
}

/**
 * 难度评估配置
 */
interface DifficultyConfig {
    state: DifficultyState;
    spawnIntervalMultiplier: number;
    enemyHpMultiplier: number;
    enemySpeedMultiplier: number;
    eliteChanceMultiplier: number;
    dropRateMultiplier: number;
    scoreMultiplier: number;
}

/**
 * 难度配置表
 */
const DIFFICULTY_CONFIGS: Record<DifficultyState, DifficultyConfig> = {
    [DifficultyState.EASY]: {
        state: DifficultyState.EASY,
        spawnIntervalMultiplier: 0.9,
        enemyHpMultiplier: 0.85,
        enemySpeedMultiplier: 0.9,
        eliteChanceMultiplier: 1.1,
        dropRateMultiplier: 1.2,
        scoreMultiplier: 0.8
    },
    [DifficultyState.NORMAL]: {
        state: DifficultyState.NORMAL,
        spawnIntervalMultiplier: 1.0,
        enemyHpMultiplier: 1.0,
        enemySpeedMultiplier: 1.0,
        eliteChanceMultiplier: 1.0,
        dropRateMultiplier: 1.0,
        scoreMultiplier: 1.0
    },
    [DifficultyState.HARD]: {
        state: DifficultyState.HARD,
        spawnIntervalMultiplier: 1.15,
        enemyHpMultiplier: 1.2,
        enemySpeedMultiplier: 1.1,
        eliteChanceMultiplier: 0.95,
        dropRateMultiplier: 0.8,
        scoreMultiplier: 1.1
    }
};

/**
 * 难度评估间隔（秒）
 */
const EVALUATION_INTERVAL = 15;

/**
 * 上次评估时间
 */
let lastEvaluationTime = 0;

/**
 * 性能评分历史
 */
const performanceHistory: number[] = [];

/**
 * 动态难度系统主函数
 * @param world 世界对象
 * @param dt 时间增量（秒）
 */
export function DifficultySystem(world: World, dt: number): void {
    // 每隔一定时间评估一次
    lastEvaluationTime += dt;
    if (lastEvaluationTime < EVALUATION_INTERVAL) return;
    lastEvaluationTime = 0;

    // 评估当前玩家表现
    const performanceScore = evaluatePerformance(world);
    performanceHistory.push(performanceScore);

    // 只保留最近5次评分
    if (performanceHistory.length > 5) {
        performanceHistory.shift();
    }

    // 计算平均表现
    const avgPerformance = performanceHistory.reduce((a, b) => a + b, 0) / performanceHistory.length;

    // 根据表现调整难度
    const newState = determineDifficultyState(avgPerformance);
    applyDifficulty(world, newState);
}

/**
 * 评估玩家表现
 * 返回 0-100 的分数，越高表示表现越好
 */
function evaluatePerformance(world: World): number {
    let score = 50; // 基础分

    // 1. 根据血量评分 (40分)
    const playerComps = world.entities.get(world.playerId);
    if (playerComps) {
        const health = playerComps.find(Health.check) as Health | undefined;
        if (health) {
            const hpPercent = health.hp / health.max;
            score += (hpPercent - 0.5) * 40; // 血量越高分越高
        }
    }

    // 2. 根据连击数评分 (30分)
    const comboCount = world.comboState?.count ?? 0;
    score += Math.min(comboCount, 30);

    // 3. 根据武器等级评分 (20分)
    let maxWeaponLevel = 1;
    for (const [id, comps] of world.entities) {
        const weapon = comps.find(Weapon.check) as Weapon | undefined;
        if (weapon && weapon.level > maxWeaponLevel) {
            maxWeaponLevel = weapon.level;
        }
    }
    score += (maxWeaponLevel - 1) * 5;

    // 4. 根据得分速度评分 (10分)
    const scorePerMinute = world.score / (world.time / 60 || 1);
    score += Math.min(scorePerMinute / 100, 10);

    return Math.max(0, Math.min(100, score));
}

/**
 * 根据表现确定难度状态
 */
function determineDifficultyState(performanceScore: number): DifficultyState {
    if (performanceScore < 35) {
        return DifficultyState.HARD;
    } else if (performanceScore > 65) {
        return DifficultyState.EASY;
    } else {
        return DifficultyState.NORMAL;
    }
}

/**
 * 应用难度设置
 */
function applyDifficulty(world: World, state: DifficultyState): void {
    const config = DIFFICULTY_CONFIGS[state];

    // 更新全局难度系数
    // 这个会影响各种系统的行为
    world.difficulty = config.spawnIntervalMultiplier;

    // 可以在这里触发其他难度相关的效果
    // 例如：播放提示音、显示 UI 等
}

/**
 * 获取当前难度配置
 */
export function getDifficultyConfig(): DifficultyConfig {
    // 返回当前难度配置（简化处理，实际应该从 World 获取）
    return DIFFICULTY_CONFIGS[DifficultyState.NORMAL];
}

/**
 * 获取精英怪生成概率
 */
export function getEliteChance(): number {
    const config = getDifficultyConfig();
    return 0.1 * config.eliteChanceMultiplier;
}

/**
 * 获取敌人属性倍率
 */
export function getEnemyMultipliers(): {
    hp: number;
    speed: number;
} {
    const config = getDifficultyConfig();
    return {
        hp: config.enemyHpMultiplier,
        speed: config.enemySpeedMultiplier
    };
}

/**
 * 重置难度系统
 */
export function resetDifficulty(): void {
    lastEvaluationTime = 0;
    performanceHistory.length = 0;
}
