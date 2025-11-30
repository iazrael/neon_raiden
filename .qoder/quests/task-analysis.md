# 道具掉落系统优化方案

## 问题概述

在当前游戏中，道具掉落系统存在一些问题需要优化：
1. Temp_shield（临时护盾）和Time_slow（时间减缓）这两种道具虽然已经定义并实现了相关逻辑，但实际游戏中不会掉落。
2. 当前的道具掉落算法会导致后面道具虽然有概率设置，但被选中的机会很少。
3. 道具概率需要手工维护小数，凑够1比较麻烦。
4. Temp_shield命名不够直观，建议改为更易理解的名称。

## 问题分析

### 1. 枚举定义检查

通过检查`PowerupType`枚举定义，确认两种道具类型已正确定义：
- `INVINCIBILITY = 'invincibility'` (原`TEMP_SHIELD = 'temp_shield'`)
- `TIME_SLOW = 'time_slow'`

### 2. 掉落权重配置检查

在`PowerupDropWeights`配置中，确认两种道具的掉落权重已设置：
- `[PowerupType.INVINCIBILITY]: 10`
- `[PowerupType.TIME_SLOW]: 10`

### 3. 道具配置检查

在`PowerupConfig`中，确认两种道具的基本配置已定义：
- INVINCIBILITY: 包含类型、名称、描述等基本信息
- TIME_SLOW: 包含类型、名称、描述等基本信息

### 4. 视觉配置检查

在`PowerupVisuals`中，确认两种道具的视觉配置已定义：
- `[PowerupType.INVINCIBILITY]: { color: '#cbd5e1', label: 'S' }`
- `[PowerupType.TIME_SLOW]: { color: '#22d3ee', label: 'T' }`

### 5. 道具效果实现检查

在`GameEngine.applyPowerup`方法中，确认两种道具的效果已实现：
- INVINCIBILITY: 设置玩家5秒无敌时间
- TIME_SLOW: 减缓游戏速度3秒

## 根本原因分析

1. **概率分布问题**：当前所有道具的掉率总和为1.25，超过了1.0的标准概率分布要求。当累计概率超过1.0时，Math.random()生成的随机数(0-1)很可能在达到TEMP_SHIELD和TIME_SLOW之前就已经满足条件并返回了前面的道具类型。

2. **算法缺陷问题**：当前使用的线性遍历算法存在缺陷，越靠后的道具被选中的机会越少。例如，即使所有道具掉率相同，排在前面的道具被选中的概率也会高于排在后面的道具。

3. **维护困难问题**：手动维护小数概率需要确保总和为1，当需要调整某个道具概率时，需要重新计算其他道具的概率以保持总和为1，维护成本高且容易出错。

4. **命名问题**：Temp_shield这个名称不够直观，玩家难以理解其具体效果。

## 解决方案建议

### 1. 采用权重系统替代概率系统

使用权重系统可以避免手动维护概率总和为1的问题。权重可以是任意正整数，系统会自动将其转换为概率。

```javascript
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
    [PowerupType.INVINCIBILITY]: 10,  // 原TEMP_SHIELD
    [PowerupType.TIME_SLOW]: 10
};

// 提供一个工具函数将权重转换为概率
function convertWeightsToProbabilities(weights: Record<PowerupType, number>): Record<PowerupType, number> {
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    const probabilities: Record<PowerupType, number> = {} as Record<PowerupType, number>;
    
    for (const type in weights) {
        probabilities[type as PowerupType] = weights[type as PowerupType] / totalWeight;
    }
    
    return probabilities;
}
```

### 2. 引入更公平的掉落算法

采用别名方法(Alias Method)来确保每个道具被判断的机会均等。别名方法是一种高效的离散采样算法，预处理时间为O(N)，随机选择时间为O(1)。

```javascript
class PowerupSelector {
    private probabilities: number[];
    private aliases: number[];
    private powerupTypes: PowerupType[];
    
    constructor(weights: Record<PowerupType, number>) {
        this.powerupTypes = Object.values(PowerupType);
        const probabilities = this.convertWeightsToProbabilities(weights);
        this.initializeAliasMethod(probabilities);
    }
    
    private convertWeightsToProbabilities(weights: Record<PowerupType, number>): number[] {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        return this.powerupTypes.map(type => weights[type] / totalWeight);
    }
    
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
    
    selectPowerup(): PowerupType {
        const columnIndex = Math.floor(Math.random() * this.powerupTypes.length);
        const coinToss = Math.random();
        
        if (coinToss < this.probabilities[columnIndex]) {
            return this.powerupTypes[columnIndex];
        } else {
            return this.powerupTypes[this.aliases[columnIndex]];
        }
    }
}
```

### 3. 优化道具命名

将`TEMP_SHIELD`更名为`INVINCIBILITY`(无敌时间)以提高可理解性：

```javascript
// 在PowerupType枚举中，将TEMP_SHIELD重命名为INVINCIBILITY
export enum PowerupType {
    // Weapon Types (使用武器类型字符串)
    VULCAN = 'vulcan',
    LASER = 'laser',
    MISSILE = 'missile',
    WAVE = 'wave',
    PLASMA = 'plasma',
    TESLA = 'tesla',
    MAGMA = 'magma',
    SHURIKEN = 'shuriken',

    // Special Powerups
    POWER = 'power',    // 武器能量提升
    HP = 'hp',          // 生命值恢复
    BOMB = 'bomb',      // 炸弹
    OPTION = 'option',  // 僚机

    // 容错道具
    INVINCIBILITY = 'invincibility',  // 原TEMP_SHIELD，临时护盾/无敌时间
    TIME_SLOW = 'time_slow'           // 时间减缓
}
```

### 4. 动态掉率调整

保留原有的动态掉率调整逻辑，但基于权重系统进行计算：

```javascript
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
        dynamicDropWeights[PowerupType.INVINCIBILITY] += 2;
        dynamicDropWeights[PowerupType.TIME_SLOW] += 2;
    } else if (playerHpRatio < 0.5) {
        dynamicDropWeights[PowerupType.HP] += 5;
        // 生命值较低时适度提高容错道具掉率
        dynamicDropWeights[PowerupType.INVINCIBILITY] += 1;
        dynamicDropWeights[PowerupType.TIME_SLOW] += 1;
    }
    
    // 重新初始化选择器
    powerupSelector = new PowerupSelector(dynamicDropWeights);
}
```

## 验证步骤

1. 将现有的概率系统替换为权重系统
2. 实现别名方法或洗牌算法来优化道具选择过程
3. 将TEMP_SHIELD重命名为INVINCIBILITY以提高可理解性
4. 保留并适配动态掉率调整逻辑
5. 在测试环境中验证所有道具都能正常掉落
6. 检查道具掉落的公平性，确保每个道具被选中的机会均等
7. 验证动态掉率调整功能正常工作
8. 测试不同权重配置下的道具掉落效果