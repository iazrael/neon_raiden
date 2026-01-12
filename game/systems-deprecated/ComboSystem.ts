/**
 * ComboSystem - P2 Advanced Feature
 * 连击系统: 实现连击计数、奖励阶梯和视觉反馈
 * 
 * 核心机制:
 * - 连续击杀累积连击数
 * - 5秒内未击杀则连击数清零
 * - 10/25/50/100连击阶梯提供不同加成
 */

export interface ComboState {
    /** 当前连击数 */
    count: number;
    /** 连击计时器(ms),超过5000ms清零 */
    timer: number;
    /** 当前连击等级(0-4对应无/10/25/50/100连击) */
    level: number;
    /** 历史最高连击数 */
    maxCombo: number;
    /** 是否触发过狂暴模式(100连击) */
    hasBerserk: boolean;
}

export interface ComboConfig {
    /** 连击清零时间(ms) */
    resetTime: number;
    /** 连击阶梯配置 */
    tiers: ComboTier[];
}

export interface ComboTier {
    /** 达到此阶梯所需连击数 */
    threshold: number;
    /** 伤害倍率加成 */
    damageMultiplier: number;
    /** 得分倍率加成 */
    scoreMultiplier: number;
    /** 阶梯名称 */
    name: string;
    /** 阶梯颜色(用于视觉反馈) */
    color: string;
}

// 连击系统配置
export const COMBO_CONFIG: ComboConfig = {
    resetTime: 5000, // 5秒未击杀清零
    tiers: [
        {
            threshold: 0,
            damageMultiplier: 1.0,
            scoreMultiplier: 1.0,
            name: '无连击',
            color: '#ffffff'
        },
        {
            threshold: 10,
            damageMultiplier: 1.2,
            scoreMultiplier: 1.5,
            name: '连击',
            color: '#4ade80' // 绿色
        },
        {
            threshold: 25,
            damageMultiplier: 1.5,
            scoreMultiplier: 2.0,
            name: '高连击',
            color: '#60a5fa' // 蓝色
        },
        {
            threshold: 50,
            damageMultiplier: 2.0,
            scoreMultiplier: 3.0,
            name: '超连击',
            color: '#a78bfa' // 紫色
        },
        {
            threshold: 100,
            damageMultiplier: 3.0,
            scoreMultiplier: 5.0,
            name: '狂暴',
            color: '#f87171' // 红色
        }
    ]
};

export class ComboSystem {
    private state: ComboState;
    private config: ComboConfig;
    private onComboChange?: (state: ComboState) => void;

    constructor(config: ComboConfig = COMBO_CONFIG, onComboChange?: (state: ComboState) => void) {
        this.config = config;
        this.onComboChange = onComboChange;
        this.state = {
            count: 0,
            timer: 0,
            level: 0,
            maxCombo: 0,
            hasBerserk: false
        };
    }

    /**
     * 重置连击状态(用于游戏开始/重新开始)
     */
    reset() {
        this.state = {
            count: 0,
            timer: 0,
            level: 0,
            maxCombo: 0,
            hasBerserk: false
        };
        this.notifyChange();
    }

    /**
     * 更新连击计时器
     * @param dt 帧时间(ms)
     */
    update(dt: number) {
        if (this.state.count > 0) {
            this.state.timer += dt;
            
            // 超过清零时间,重置连击
            if (this.state.timer >= this.config.resetTime) {
                this.clearCombo();
            }
        }
    }

    /**
     * 记录一次击杀,增加连击数
     */
    addKill() {
        this.state.count++;
        this.state.timer = 0; // 重置计时器
        
        // 更新历史最高连击
        if (this.state.count > this.state.maxCombo) {
            this.state.maxCombo = this.state.count;
        }
        
        // 检查是否进入新的连击等级
        const newLevel = this.calculateComboLevel(this.state.count);
        const oldLevel = this.state.level;
        this.state.level = newLevel;
        
        // 检查是否首次触发狂暴模式
        if (this.state.count === 100 && !this.state.hasBerserk) {
            this.state.hasBerserk = true;
        }
        
        this.notifyChange();
        
        // 返回是否升级(用于触发特殊效果)
        return newLevel > oldLevel;
    }

    /**
     * 清除连击
     */
    clearCombo() {
        this.state.count = 0;
        this.state.timer = 0;
        this.state.level = 0;
        this.notifyChange();
    }

    /**
     * 计算当前连击数对应的等级
     */
    private calculateComboLevel(count: number): number {
        let level = 0;
        for (let i = this.config.tiers.length - 1; i >= 0; i--) {
            if (count >= this.config.tiers[i].threshold) {
                level = i;
                break;
            }
        }
        return level;
    }

    /**
     * 获取当前连击状态
     */
    getState(): ComboState {
        return { ...this.state };
    }

    /**
     * 获取当前连击等级配置
     */
    getCurrentTier(): ComboTier {
        return this.config.tiers[this.state.level];
    }

    /**
     * 获取当前伤害倍率
     */
    getDamageMultiplier(): number {
        return this.getCurrentTier().damageMultiplier;
    }

    /**
     * 获取当前得分倍率
     */
    getScoreMultiplier(): number {
        return this.getCurrentTier().scoreMultiplier;
    }

    /**
     * 获取距离下一个阶梯的进度(0-1)
     * 返回null表示已达最高阶梯
     */
    getProgressToNextTier(): number | null {
        const nextLevel = this.state.level + 1;
        if (nextLevel >= this.config.tiers.length) {
            return null; // 已达最高阶梯
        }
        
        const currentThreshold = this.config.tiers[this.state.level].threshold;
        const nextThreshold = this.config.tiers[nextLevel].threshold;
        const progress = (this.state.count - currentThreshold) / (nextThreshold - currentThreshold);
        
        return Math.min(1, Math.max(0, progress));
    }

    /**
     * 获取下一个阶梯配置
     * 返回null表示已达最高阶梯
     */
    getNextTier(): ComboTier | null {
        const nextLevel = this.state.level + 1;
        if (nextLevel >= this.config.tiers.length) {
            return null;
        }
        return this.config.tiers[nextLevel];
    }

    /**
     * 通知状态变化
     */
    private notifyChange() {
        if (this.onComboChange) {
            this.onComboChange(this.getState());
        }
    }
}
