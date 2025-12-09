import {
    PowerupType,
} from '@/types';
import { PowerupSelector } from './selector';

// ==================== 道具掉落配置 ====================
export const PowerupDropConfig = {
    elitePowerupDropRate: 0.8,
    normalPowerupDropRate: 0.2,
    bossDropRate: 1.0,
};

// 原来的概率配置改为权重配置
export const PowerupDropWeights: Record<PowerupType, number> = {
    [PowerupType.POWER]: 15,
    [PowerupType.HP]: 18,
    [PowerupType.VULCAN]: 10,
    [PowerupType.LASER]: 10,
    [PowerupType.MISSILE]: 10,
    [PowerupType.SHURIKEN]: 8,
    [PowerupType.TESLA]: 8,
    [PowerupType.MAGMA]: 8,
    [PowerupType.WAVE]: 4,
    [PowerupType.PLASMA]: 2,
    [PowerupType.BOMB]: 10,
    [PowerupType.OPTION]: 2,
    [PowerupType.INVINCIBILITY]: 10,  
    [PowerupType.TIME_SLOW]: 10
};

// 存储动态掉率的全局状态
let dynamicDropWeights: Record<PowerupType, number> = { ...PowerupDropWeights };
let currentLevel = 1;
let playerScore = 0;
let playerWeaponLevel = 1;
let playerHpRatio = 1.0;
let powerupSelector: PowerupSelector = new PowerupSelector(PowerupDropWeights);

/**
 * 设置动态掉率的上下文信息
 */
export function setDropContext(level: number, score: number, weaponLevel: number, hpRatio: number): void {
    currentLevel = level;
    playerScore = score;
    playerWeaponLevel = weaponLevel;
    playerHpRatio = hpRatio;
    
    // 根据上下文重新计算动态掉率
    updateDynamicDropWeights();
}

export function resetDropContext(): void {
    dynamicDropWeights = { ...PowerupDropWeights };
    currentLevel = 1;
    playerScore = 0;
    playerWeaponLevel = 1;
    playerHpRatio = 1.0;
    powerupSelector = new PowerupSelector(PowerupDropWeights);
}

/**
 * 更新动态掉率
 */
function updateDynamicDropWeights(): void {
    // 基于原始权重
    dynamicDropWeights = { ...PowerupDropWeights };
    
    // 根据关卡进度调整僚机道具掉率（从第5关开始增加）
    if (currentLevel >= 5) {
        const levelBonus = Math.min(5, (currentLevel - 4) * 1); // 每关增加1权重，最多增加5权重
        dynamicDropWeights[PowerupType.OPTION] += levelBonus;
    }
    
    // 根据玩家表现调整掉率
    // 玩家分数较低时，稍微提高Power道具掉率
    if (playerScore < 10000) {
        dynamicDropWeights[PowerupType.POWER] += 5;
    }
    
    // 玩家生命值较低时，提高HP道具掉率
    if (playerHpRatio < 0.3) {
        dynamicDropWeights[PowerupType.HP] += 10;
        // 生命值低时也提高容错道具掉率
        dynamicDropWeights[PowerupType.INVINCIBILITY] += 5;
        dynamicDropWeights[PowerupType.TIME_SLOW] += 5;
    } else if (playerHpRatio < 0.5) {
        dynamicDropWeights[PowerupType.HP] += 5;
        // 生命值较低时适度提高容错道具掉率
        dynamicDropWeights[PowerupType.INVINCIBILITY] += 1;
        dynamicDropWeights[PowerupType.TIME_SLOW] += 1;
    }
    
    // 重新初始化选择器
    powerupSelector = new PowerupSelector(dynamicDropWeights);
}

/**
 * 选择道具类型
 */
export function selectPowerupType(): PowerupType {
    return powerupSelector.selectPowerup();
}
