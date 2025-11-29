import {
    PowerupType,
} from '@/types';

// ==================== 道具掉落配置 ====================
export const PowerupDropConfig = {
    elitePowerupDropRate: 0.6,
    normalPowerupDropRate: 0.1,
    bossDropRate: 1.0,
};

export const PowerupDropRates: Record<PowerupType, number> = {
    [PowerupType.POWER]: 0.15,
    [PowerupType.HP]: 0.18,
    [PowerupType.VULCAN]: 0.10,
    [PowerupType.LASER]: 0.10,
    [PowerupType.MISSILE]: 0.10,
    [PowerupType.SHURIKEN]: 0.08,
    [PowerupType.TESLA]: 0.08,
    [PowerupType.MAGMA]: 0.08,
    [PowerupType.WAVE]: 0.04,
    [PowerupType.PLASMA]: 0.02,
    [PowerupType.BOMB]: 0.01,
    [PowerupType.OPTION]: 0.02,
    [PowerupType.TEMP_SHIELD]: 0.01,
    [PowerupType.TIME_SLOW]: 0.01
};

// 存储动态掉率的全局状态
let dynamicDropRates: Record<PowerupType, number> = { ...PowerupDropRates };
let currentLevel = 1;
let playerScore = 0;
let playerWeaponLevel = 1;
let playerHpRatio = 1.0;

/**
 * 设置动态掉率的上下文信息
 */
export function setDropContext(level: number, score: number, weaponLevel: number, hpRatio: number): void {
    currentLevel = level;
    playerScore = score;
    playerWeaponLevel = weaponLevel;
    playerHpRatio = hpRatio;
    
    // 根据上下文重新计算动态掉率
    updateDynamicDropRates();
}

export function resetDropContext(): void {
    dynamicDropRates = { ...PowerupDropRates };
    currentLevel = 1;
    playerScore = 0;
    playerWeaponLevel = 1;
    playerHpRatio = 1.0;
}

/**
 * 更新动态掉率
 */
function updateDynamicDropRates(): void {
    // 基于原始掉率
    dynamicDropRates = { ...PowerupDropRates };
    
    // 根据关卡进度调整僚机道具掉率（从第5关开始增加）
    if (currentLevel >= 5) {
        const levelBonus = Math.min(0.05, (currentLevel - 4) * 0.01); // 每关增加1%，最多增加5%
        dynamicDropRates[PowerupType.OPTION] += levelBonus;
    }
    
    // 根据玩家表现调整掉率
    // 玩家分数较低时，稍微提高Power道具掉率
    if (playerScore < 10000) {
        dynamicDropRates[PowerupType.POWER] += 0.05;
    }
    
    // 玩家生命值较低时，提高HP道具掉率
    if (playerHpRatio < 0.3) {
        dynamicDropRates[PowerupType.HP] += 0.10;
        // 生命值低时也提高容错道具掉率
        dynamicDropRates[PowerupType.TEMP_SHIELD] += 0.02;
        dynamicDropRates[PowerupType.TIME_SLOW] += 0.02;
    } else if (playerHpRatio < 0.5) {
        dynamicDropRates[PowerupType.HP] += 0.05;
        // 生命值较低时适度提高容错道具掉率
        dynamicDropRates[PowerupType.TEMP_SHIELD] += 0.01;
        dynamicDropRates[PowerupType.TIME_SLOW] += 0.01;
    }
}

/**
 * 选择道具类型
 */
export function selectPowerupType(): PowerupType {
    const r = Math.random();
    let cumulative = 0;

    for (const type of Object.values(PowerupType)) {
        cumulative += dynamicDropRates[type];
        if (r < cumulative) {
            return type;
        }
    }

    return PowerupType.POWER;
}
