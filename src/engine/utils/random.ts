// src/engine/utils/index.ts

// 假设的游戏画布尺寸（你可以从 configs/global.ts 导入，或者根据实际情况修改）
const STAGE_WIDTH = 800;  // 屏幕宽度
const STAGE_HEIGHT = 600; // 屏幕高度
const SPAWN_MARGIN = 50;  // 生成边缘余量（比如在屏幕上方50像素生成）

/**
 * 权重随机选择器
 * @param pool 对象数组，每个对象必须包含 weight 属性
 * @returns 选中的对象
 */
export function pickEnemyByWeight<T extends { weight: number }>(pool: T[]): T {
    if (!pool || pool.length === 0) {
        throw new Error("pickEnemyByWeight: Pool is empty!");
    }

    // 1. 计算总权重
    let totalWeight = 0;
    for (const item of pool) {
        totalWeight += item.weight;
    }

    // 2. 生成随机数 [0, totalWeight)
    let random = Math.random() * totalWeight;

    // 3. 轮盘赌算法选择
    for (const item of pool) {
        random -= item.weight;
        if (random <= 0) {
            return item;
        }
    }

    // 4. 防止浮点数误差导致的 undefined，默认返回最后一个
    return pool[pool.length - 1];
}

/**
 * 获取随机出生点坐标
 * 默认逻辑：X轴随机（屏幕内），Y轴固定在屏幕上方外侧
 * @param margin Y轴向上的偏移量
 */
export function getRandomSpawnPos(margin: number = SPAWN_MARGIN): { x: number, y: number } {
    return {
        // x: 在 [margin, WIDTH - margin] 之间，防止生成太靠边被切掉
        x: margin + Math.random() * (STAGE_WIDTH - margin * 2),

        // y: 在屏幕上方外侧，例如 -50
        y: -margin
    };
}

/**
 * (可选) 获取全屏范围内的随机坐标
 * 用于生成掉落物或测试
 */
export function getRandomScreenPos(padding: number = 0): { x: number, y: number } {
    return {
        x: padding + Math.random() * (STAGE_WIDTH - padding * 2),
        y: padding + Math.random() * (STAGE_HEIGHT - padding * 2)
    };
}