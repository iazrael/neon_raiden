/**
 * 连击系统 (ComboSystem)
 *
 * 职责：
 * - 监听 KillEvent（敌人死亡）
 * - 维护连击计数和计时器
 * - 根据连击数计算得分倍率
 * - 超时重置连击
 *
 * 系统类型：结算层
 * 执行顺序：P5 - 在交互层之后
 */

import { ComboState } from '../types';
import { KillEvent, ComboUpgradeEvent, ComboBreakEvent, BerserkModeEvent } from '../events';
import { pushEvent, World } from '../world';

/**
 * 连击配置
 */
const COMBO_CONFIG = {
    /** 连击超时时间（毫秒） */
    timeout: 5000,  // 5秒 = 5000毫秒
    /** 连击等级阈值 */
    levels: [
        { count: 10, multiplier: 1.2, scoreMult: 1.5, name: 'GOOD', color: '#00ff00' },
        { count: 25, multiplier: 1.5, scoreMult: 2.0, name: 'GREAT', color: '#ffff00' },
        { count: 50, multiplier: 2.0, scoreMult: 3.0, name: 'AWESOME', color: '#ff9900' },
        { count: 100, multiplier: 3.0, scoreMult: 5.0, name: 'BERSERK', color: '#ff0000' }
    ]
};

/**
 * 连击系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function ComboSystem(world: World, dt: number): void {
    // 初始化连击状态（使用旧接口结构）
    if (!world.comboState) {
        world.comboState = {
            count: 0,
            timer: 0,
            level: 0,
            maxCombo: 0,
            hasBerserk: false
        };
    }

    const combo = world.comboState;

    // 1. 收集本帧的击杀事件
    const killEvents = world.events.filter(e => e.type === 'Kill') as KillEvent[];

    if (killEvents.length > 0) {
        // 有击杀，增加连击
        const killCount = killEvents.length;
        combo.count += killCount;
        combo.timer = COMBO_CONFIG.timeout; // 重置计时器

        // 更新历史最高连击
        if (combo.count > combo.maxCombo) {
            combo.maxCombo = combo.count;
        }

        // 检查是否升级连击等级
        checkComboUpgrade(world, combo);

        // 根据连击倍率加分（通过等级获取倍率）
        const levelConfig = getLevelConfig(combo.level);
        const multiplier = levelConfig?.scoreMult ?? 1;
        for (const event of killEvents) {
            world.score += Math.floor(event.score * multiplier);
        }
    } else {
        // 2. 没有击杀，减少计时器
        combo.timer -= dt;

        // 3. 连击超时，重置
        if (combo.timer <= 0) {
            if (combo.count > 0) {
                // 生成连击中断事件
                pushEvent(world, {
                    type: 'ComboBreak',
                    combo: combo.count,
                    reason: 'timeout'
                } as ComboBreakEvent);
            }
            resetCombo(combo);
        }
    }
}

/**
 * 获取连击等级配置
 */
function getLevelConfig(level: number) {
    if (level === 0) return { scoreMult: 1, multiplier: 1 };
    return COMBO_CONFIG.levels[level - 1];
}

/**
 * 检查连击升级
 */
function checkComboUpgrade(world: World, combo: ComboState): void {
    const oldLevel = getComboLevel(combo.count - 1);
    const newLevel = getComboLevel(combo.count);

    if (newLevel > oldLevel) {
        const levelConfig = COMBO_CONFIG.levels[newLevel - 1];

        // 更新连击等级
        combo.level = newLevel;

        // 生成连击升级事件
        pushEvent(world, {
            type: 'ComboUpgrade',
            pos: { x: world.width / 2, y: 100 },
            level: newLevel,
            name: levelConfig.name,
            color: levelConfig.color
        } as ComboUpgradeEvent);

        // 检查是否触发狂暴模式
        if (newLevel === 4 && !combo.hasBerserk) {
            combo.hasBerserk = true;
            pushEvent(world, {
                type: 'BerserkMode',
                pos: { x: world.width / 2, y: world.height / 2 }
            } as BerserkModeEvent);
        }
    }
}

/**
 * 获取连击等级（0-4）
 */
function getComboLevel(count: number): number {
    for (let i = COMBO_CONFIG.levels.length - 1; i >= 0; i--) {
        if (count >= COMBO_CONFIG.levels[i].count) {
            return i + 1;
        }
    }
    return 0;
}

/**
 * 重置连击
 */
function resetCombo(combo: ComboState): void {
    combo.count = 0;
    combo.timer = 0;
    combo.level = 0;
    // 注意：不清空 maxCombo 和 hasBerserk，这是历史记录
}

/**
 * 获取当前连击得分倍率
 */
export function getComboScoreMultiplier(world: World): number {
    const level = world.comboState?.level ?? 0;
    const levelConfig = getLevelConfig(level);
    return levelConfig?.scoreMult ?? 1;
}

/**
 * 获取当前连击伤害倍率
 */
export function getComboDamageMultiplier(world: World): number {
    const level = world.comboState?.level ?? 0;
    const levelConfig = getLevelConfig(level);
    return levelConfig?.multiplier ?? 1;
}

/**
 * 手动重置连击（用于游戏结束等）
 */
export function resetWorldCombo(world: World): void {
    if (world.comboState) {
        resetCombo(world.comboState);
    }
}
