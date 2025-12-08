// configs/levels.ts

import { BossId, EnemyId } from "../types";


export interface LevelSpec {
    id: number;
    baseIncome: number; // 基础工资 (每秒)
    creditCap: number;  // 钱包上限
    enemyPool: { id: EnemyId; cost: number; weight: number }[];
    boss: BossId;
}


// 关卡敌人和Boss配置
export const LEVEL_CONFIGS: Record<number, LevelSpec> = {
    1: {
        id: 1,
        baseIncome: 10,
        creditCap: 100,
        enemyPool: [
            { id: EnemyId.NORMAL, cost: 10, weight: 60 },
            { id: EnemyId.FAST, cost: 30, weight: 30 },
            { id: EnemyId.TANK, cost: 80, weight: 10 },
        ],
        boss: BossId.GUARDIAN
    },
};
