/**
 * DifficultySystem - P3 Experimental Feature
 * 动态难度系统: 根据玩家表现实时调整游戏难度
 * 
 * 核心机制:
 * - 实时评估玩家实力(生命值、武器等级、连击数、用时)
 * - 根据评分自动调整敌人生成间隔和精英概率
 * - 隐藏调整,玩家不可见,保持沉浸感
 * - 奖励高技术玩家(简单模式得分×1.2)
 * 
 * 调整策略:
 * - 困难模式(玩家表现差): 敌人间隔+15%,精英率-5%,道具掉落率+10%
 * - 标准模式(中等表现): 无调整
 * - 简单模式(玩家表现好): 敌人间隔-10%,精英率+10%,得分×1.2
 */

import { Entity } from '@/types';

// ==================== 难度等级枚举 ====================
export enum DifficultyMode {
    EASY = 'easy',       // 简单模式 (评分 0.7-1.0)
    NORMAL = 'normal',   // 标准模式 (评分 0.3-0.7)
    HARD = 'hard'        // 困难模式 (评分 0-0.3)
}

// ==================== 难度配置接口 ====================
export interface DifficultyConfig {
    mode: DifficultyMode;
    spawnIntervalMultiplier: number;  // 生成间隔倍率
    eliteChanceModifier: number;      // 精英概率修正值
    enemyHpMultiplier: number;        // 敌人血量倍率
    enemySpeedMultiplier: number;     // 敌人速度倍率
    powerupDropMultiplier: number;    // 道具掉落率倍率
    scoreMultiplier: number;          // 得分倍率
    bossDifficultyMultiplier: number; // Boss难度倍率
    description: string;              // 难度描述
}

// ==================== 玩家表现评估 ====================
export interface PlayerPerformance {
    hpPercent: number;        // 当前生命值百分比
    avgWeaponLevel: number;   // 武器平均等级 (0-9)
    comboLevel: number;       // 当前连击数 (0-100+)
    timeRatio: number;        // 关卡用时比例 (实际用时/标准用时)
    
    // 综合评分 (0-1)
    score: number;
}

// ==================== 难度模式配置 ====================
export const DIFFICULTY_CONFIGS: Record<DifficultyMode, DifficultyConfig> = {
    [DifficultyMode.EASY]: {
        mode: DifficultyMode.EASY,
        spawnIntervalMultiplier: 0.90,   // 敌人生成间隔-10% (更快生成)
        eliteChanceModifier: 0.10,       // 精英概率+10%
        enemyHpMultiplier: 1.0,          // 敌人血量不变
        enemySpeedMultiplier: 1.0,       // 敌人速度不变
        powerupDropMultiplier: 1.0,      // 道具掉落率不变
        scoreMultiplier: 1.2,            // 得分+20% (奖励高技术玩家)
        bossDifficultyMultiplier: 1.1,   // Boss难度+10%
        description: '高手模式 - 挑战增强,得分加成'
    },
    [DifficultyMode.NORMAL]: {
        mode: DifficultyMode.NORMAL,
        spawnIntervalMultiplier: 1.0,    // 标准生成速度
        eliteChanceModifier: 0.0,        // 精英概率不变
        enemyHpMultiplier: 1.0,          // 敌人血量不变
        enemySpeedMultiplier: 1.0,       // 敌人速度不变
        powerupDropMultiplier: 1.0,      // 道具掉落率不变
        scoreMultiplier: 1.0,            // 标准得分
        bossDifficultyMultiplier: 1.0,   // Boss标准难度
        description: '标准模式 - 原始平衡'
    },
    [DifficultyMode.HARD]: {
        mode: DifficultyMode.HARD,
        spawnIntervalMultiplier: 1.15,   // 敌人生成间隔+15% (更慢生成)
        eliteChanceModifier: -0.05,      // 精英概率-5%
        enemyHpMultiplier: 0.85,         // 敌人血量-15%
        enemySpeedMultiplier: 0.90,      // 敌人速度-10%
        powerupDropMultiplier: 1.20,     // 道具掉落率+20%
        scoreMultiplier: 1.0,            // 得分不变
        bossDifficultyMultiplier: 0.9,   // Boss难度-10%
        description: '新手模式 - 难度降低,道具增加'
    }
};

// ==================== 玩家表现评分权重 ====================
export const PERFORMANCE_WEIGHTS = {
    hpPercent: 0.3,       // 生命值权重30%
    weaponLevel: 0.3,     // 武器等级权重30%
    comboLevel: 0.2,      // 连击数权重20%
    timeRatio: 0.2        // 用时权重20%
};

// ==================== 标准关卡用时(秒) ====================
export const STANDARD_LEVEL_DURATION: Record<number, number> = {
    1: 50,
    2: 55,
    3: 60,
    4: 65,
    5: 70,
    6: 75,
    7: 80,
    8: 85,
    9: 90,
    10: 100
};

// ==================== 动态难度系统类 ====================
export class DifficultySystem {
    private currentMode: DifficultyMode = DifficultyMode.NORMAL;
    private currentConfig: DifficultyConfig = DIFFICULTY_CONFIGS[DifficultyMode.NORMAL];
    
    private evaluationTimer: number = 0;
    private readonly EVALUATION_INTERVAL = 15000; // 每15秒评估一次
    
    private levelStartTime: number = 0;
    private isEnabled: boolean = true; // 可通过配置开关
    
    // Boss击败次数记录
    private playerDefeatCounts: Record<number, number> = {}; // 关卡 -> 击败次数
    
    constructor() {
        // 初始化为标准模式
        this.reset();
    }
    
    /**
     * 重置难度系统(关卡开始时调用)
     */
    reset(): void {
        this.currentMode = DifficultyMode.NORMAL;
        this.currentConfig = DIFFICULTY_CONFIGS[DifficultyMode.NORMAL];
        this.evaluationTimer = 0;
        this.levelStartTime = Date.now();
    }
    
    /**
     * 更新难度系统
     */
    update(dt: number, player: Entity, weapons: any[], comboCount: number, level: number): void {
        if (!this.isEnabled) return;
        
        this.evaluationTimer += dt;
        
        // 每15秒评估一次玩家表现
        if (this.evaluationTimer >= this.EVALUATION_INTERVAL) {
            const performance = this.evaluatePlayerPerformance(player, weapons, comboCount, level);
            this.adjustDifficulty(performance);
            this.evaluationTimer = 0;
        }
    }
    
    /**
     * 评估玩家表现
     */
    private evaluatePlayerPerformance(
        player: Entity,
        weapons: any[],
        comboCount: number,
        level: number
    ): PlayerPerformance {
        // 1. 生命值百分比 (0-1)
        const hpPercent = player.hp / player.maxHp;
        
        // 2. 武器平均等级 (0-1)
        const avgLevel = weapons.length > 0 
            ? weapons.reduce((sum, w) => sum + (w?.level || 0), 0) / weapons.length / 9
            : 0;
        
        // 3. 连击数归一化 (0-1)
        const comboNormalized = Math.min(comboCount / 50, 1.0);
        
        // 4. 用时比例 (实际用时 / 标准用时)
        const currentTime = (Date.now() - this.levelStartTime) / 1000;
        const standardTime = STANDARD_LEVEL_DURATION[level] || 60;
        const timeRatio = currentTime / standardTime;
        
        // 计算综合评分
        const score = 
            hpPercent * PERFORMANCE_WEIGHTS.hpPercent +
            avgLevel * PERFORMANCE_WEIGHTS.weaponLevel +
            comboNormalized * PERFORMANCE_WEIGHTS.comboLevel +
            (1 - Math.min(timeRatio, 1.0)) * PERFORMANCE_WEIGHTS.timeRatio;
        
        return {
            hpPercent,
            avgWeaponLevel: avgLevel,
            comboLevel: comboNormalized,
            timeRatio,
            score: Math.max(0, Math.min(1, score)) // 限制在0-1范围
        };
    }
    
    /**
     * 根据评分调整难度
     */
    private adjustDifficulty(performance: PlayerPerformance): void {
        const score = performance.score;
        
        let newMode: DifficultyMode;
        
        if (score >= 0.7) {
            // 高分玩家 -> 简单模式(增加挑战)
            newMode = DifficultyMode.EASY;
        } else if (score >= 0.3) {
            // 中等玩家 -> 标准模式
            newMode = DifficultyMode.NORMAL;
        } else {
            // 低分玩家 -> 困难模式(降低难度)
            newMode = DifficultyMode.HARD;
        }
        
        // 模式切换
        if (newMode !== this.currentMode) {
            this.currentMode = newMode;
            this.currentConfig = DIFFICULTY_CONFIGS[newMode];
            
            console.log(`[DifficultySystem] Mode changed to ${newMode} (score: ${score.toFixed(2)})`);
        }
    }
    
    /**
     * 获取当前难度配置
     */
    getConfig(): DifficultyConfig {
        return this.currentConfig;
    }
    
    /**
     * 获取当前难度模式
     */
    getMode(): DifficultyMode {
        return this.currentMode;
    }
    
    /**
     * 获取生成间隔倍率
     */
    getSpawnIntervalMultiplier(): number {
        return this.currentConfig.spawnIntervalMultiplier;
    }
    
    /**
     * 获取精英概率修正值
     */
    getEliteChanceModifier(): number {
        return this.currentConfig.eliteChanceModifier;
    }
    
    /**
     * 获取道具掉落率倍率
     */
    getPowerupDropMultiplier(): number {
        return this.currentConfig.powerupDropMultiplier;
    }
    
    /**
     * 获取得分倍率
     */
    getScoreMultiplier(): number {
        return this.currentConfig.scoreMultiplier;
    }
    
    /**
     * 记录玩家被Boss击败
     */
    recordPlayerDefeatedByBoss(level: number): void {
        if (!this.playerDefeatCounts[level]) {
            this.playerDefeatCounts[level] = 0;
        }
        this.playerDefeatCounts[level]++;
    }
    
    /**
     * 获取Boss难度倍率
     * 基于玩家击败Boss的次数调整Boss难度
     */
    getBossDifficultyMultiplier(): number {
        return this.currentConfig.bossDifficultyMultiplier;
    }
    
    /**
     * 获取特定Boss的额外难度倍率
     * 基于玩家被该Boss击败的次数（玩家挑战失败次数）
     * 如果玩家多次无法击败同一个Boss，则降低该Boss的难度
     */
    getSpecificBossDifficultyMultiplier(level: number): number {
        const defeatCount = this.playerDefeatCounts[level] || 0;
        // 每被Boss击败一次，Boss难度降低3%，最多降低30%
        const reductionMultiplier = Math.min(0.3, defeatCount * 0.03);
        return 1.0 - reductionMultiplier;
    }
    
    /**
     * 启用/禁用动态难度
     */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        if (!enabled) {
            // 禁用时重置为标准模式
            this.currentMode = DifficultyMode.NORMAL;
            this.currentConfig = DIFFICULTY_CONFIGS[DifficultyMode.NORMAL];
        }
    }
    
    /**
     * 获取调试信息
     */
    getDebugInfo(performance?: PlayerPerformance): string {
        if (!performance) {
            return `Mode: ${this.currentMode}`;
        }
        
        return `
Mode: ${this.currentMode}
Score: ${performance.score.toFixed(2)}
HP: ${(performance.hpPercent * 100).toFixed(0)}%
Weapon: ${(performance.avgWeaponLevel * 9).toFixed(1)}/9
Combo: ${(performance.comboLevel * 50).toFixed(0)}
Time: ${performance.timeRatio.toFixed(2)}x
        `.trim();
    }
}