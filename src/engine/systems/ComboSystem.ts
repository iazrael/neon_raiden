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

import { World } from '../types';
import { ComboState } from '../types';
import { KillEvent, ComboUpgradeEvent, ComboBreakEvent, BerserkModeEvent } from '../events';
import { pushEvent } from '../world';

/**
 * 连击配置
 */
const COMBO_CONFIG = {
    /** 连击超时时间（秒） */
    timeout: 5,
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
 * @param dt 时间增量（秒）
 */
export function ComboSystem(world: World, dt: number): void {
    // 初始化连击状态
    if (!world.comboState) {
        world.comboState = {
            count: 0,
            timer: 0,
            multiplier: 1
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

        // 检查是否升级连击等级
        checkComboUpgrade(world, combo);

        // 根据连击倍率加分
        for (const event of killEvents) {
            world.score += Math.floor(event.score * combo.multiplier);
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
 * 检查连击升级
 */
function checkComboUpgrade(world: World, combo: ComboState): void {
    const oldLevel = getComboLevel(combo.count - 1);
    const newLevel = getComboLevel(combo.count);

    if (newLevel > oldLevel) {
        const levelConfig = COMBO_CONFIG.levels[newLevel - 1];

        // 更新倍率
        combo.multiplier = levelConfig.multiplier;

        // 生成连击升级事件
        pushEvent(world, {
            type: 'ComboUpgrade',
            pos: { x: world.width / 2, y: 100 },
            level: newLevel,
            name: levelConfig.name,
            color: levelConfig.color
        } as ComboUpgradeEvent);

        // 检查是否触发狂暴模式
        if (newLevel === 4) {
            pushEvent(world, {
                type: 'BerserkMode',
                pos: { x: world.width / 2, y: world.height / 2 }
            } as BerserkModeEvent);
        }
    } else {
        // 没有升级，更新当前倍率
        const currentLevel = getComboLevel(combo.count);
        if (currentLevel > 0) {
            combo.multiplier = COMBO_CONFIG.levels[currentLevel - 1].multiplier;
        } else {
            combo.multiplier = 1;
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
    combo.multiplier = 1;
}

/**
 * 获取当前连击得分倍率
 */
export function getComboScoreMultiplier(world: World): number {
    return world.comboState?.multiplier ?? 1;
}

/**
 * 获取当前连击伤害倍率
 */
export function getComboDamageMultiplier(world: World): number {
    const level = getComboLevel(world.comboState?.count ?? 0);
    if (level === 0) return 1;

    const bonusPerLevel = [0, 0.2, 0.5, 1.0, 2.0];
    return 1 + bonusPerLevel[level];
}

/**
 * 手动重置连击（用于游戏结束等）
 */
export function resetWorldCombo(world: World): void {
    if (world.comboState) {
        resetCombo(world.comboState);
    }
}
