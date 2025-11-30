import { PowerupType } from '@/types';

/**
 * 道具选择器类
 * 使用别名方法(Alias Method)实现O(1)时间复杂度的道具选择
 */
export class PowerupSelector {
    private probabilities: number[];
    private aliases: number[];
    private powerupTypes: PowerupType[];

    /**
     * 构造函数
     * @param weights 道具权重配置
     */
    constructor(weights: Record<PowerupType, number>) {
        this.powerupTypes = Object.values(PowerupType);
        const probabilities = this.convertWeightsToProbabilities(weights);
        this.initializeAliasMethod(probabilities);
    }

    /**
     * 将权重转换为概率
     * @param weights 权重配置
     * @returns 概率数组
     */
    private convertWeightsToProbabilities(weights: Record<PowerupType, number>): number[] {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        return this.powerupTypes.map(type => weights[type] / totalWeight);
    }

    /**
     * 初始化别名方法
     * @param probabilities 概率数组
     */
    private initializeAliasMethod(probabilities: number[]): void {
        const n = probabilities.length;
        const scaledProbabilities = probabilities.map(p => p * n);

        this.probabilities = new Array(n);
        this.aliases = new Array(n);

        const small: number[] = [];
        const large: number[] = [];

        // 分类概率
        for (let i = 0; i < n; i++) {
            if (scaledProbabilities[i] < 1.0) {
                small.push(i);
            } else {
                large.push(i);
            }
        }

        // 构建别名表
        while (small.length > 0 && large.length > 0) {
            const less = small.pop()!;
            const more = large.pop()!;

            this.probabilities[less] = scaledProbabilities[less];
            this.aliases[less] = more;

            scaledProbabilities[more] = scaledProbabilities[more] + scaledProbabilities[less] - 1.0;

            if (scaledProbabilities[more] < 1.0) {
                small.push(more);
            } else {
                large.push(more);
            }
        }

        // 处理剩余项
        while (large.length > 0) {
            this.probabilities[large.pop()!] = 1.0;
        }

        while (small.length > 0) {
            this.probabilities[small.pop()!] = 1.0;
        }
    }

    /**
     * 选择道具类型
     * 使用别名方法(Alias Method)在O(1)时间内随机选择一个道具类型
     * 根据预计算的概率分布和别名表进行选择
     * @returns 选中的道具类型
     */
    selectPowerup(): PowerupType {
        // 随机选择一个列索引（道具类型索引）
        const columnIndex = Math.floor(Math.random() * this.powerupTypes.length);
        // 抛硬币决定选择当前列还是其别名
        const coinToss = Math.random();

        // 如果随机数小于该列的概率阈值，则选择当前列对应的道具类型
        if (coinToss < this.probabilities[columnIndex]) {
            return this.powerupTypes[columnIndex];
        } else {
            // 否则选择该列的别名对应的道具类型
            return this.powerupTypes[this.aliases[columnIndex]];
        }
    }
}