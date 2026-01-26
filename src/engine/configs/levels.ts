// configs/levels.ts

import { BossId, EnemyId } from "../types";

export interface EnemyPoolItem {
    id: EnemyId;
    cost: number;
    weight: number;
}

export interface LevelSpec {
    id: number;
    baseIncome: number; // 基础工资 (每秒)
    creditCap: number;  // 钱包上限
    startingCredits: number; // 开局赠送点数
    enemyPool: EnemyPoolItem[];
    boss: BossId;
}


// 关卡敌人和Boss配置
export const LEVEL_CONFIGS: Record<number, LevelSpec> = {
    1: {
        id: 1,
        baseIncome: 10,
        creditCap: 100,
        startingCredits: 25,
        enemyPool: [
            // { id: EnemyId.NORMAL, cost: 10, weight: 3 },  // 33%
            { id: EnemyId.FAST, cost: 30, weight: 3 },   // 33%
            { id: EnemyId.TANK, cost: 60, weight: 2 },   // 22%
            { id: EnemyId.STALKER, cost: 70, weight: 1 }, // 11%
        ],
        boss: BossId.GUARDIAN
    },
    2: {
        id: 2,
        baseIncome: 13,
        creditCap: 130,
        startingCredits: 35,
        enemyPool: [
            { id: EnemyId.NORMAL, cost: 10, weight: 3 },  // 25%
            { id: EnemyId.FAST, cost: 30, weight: 3 },     // 25%
            { id: EnemyId.TANK, cost: 60, weight: 4 },     // 33%
            { id: EnemyId.PULSAR, cost: 60, weight: 1 },   // 8%
            { id: EnemyId.STALKER, cost: 70, weight: 1 },  // 8%
        ],
        boss: BossId.INTERCEPTOR
    },
    3: {
        id: 3,
        baseIncome: 16,
        creditCap: 160,
        startingCredits: 40,
        enemyPool: [
            { id: EnemyId.NORMAL, cost: 10, weight: 2 },    // 13%
            { id: EnemyId.FAST, cost: 30, weight: 3 },      // 20%
            { id: EnemyId.TANK, cost: 60, weight: 3 },      // 20%
            { id: EnemyId.KAMIKAZE, cost: 50, weight: 4 },  // 27%
            { id: EnemyId.PULSAR, cost: 60, weight: 2 },    // 13%
            { id: EnemyId.FORTRESS, cost: 120, weight: 1 }, // 7%
        ],
        boss: BossId.DESTROYER
    },
    4: {
        id: 4,
        baseIncome: 19,
        creditCap: 190,
        startingCredits: 50,
        enemyPool: [
            { id: EnemyId.NORMAL, cost: 10, weight: 1 },       // 8%
            { id: EnemyId.FAST, cost: 30, weight: 2 },         // 17%
            { id: EnemyId.KAMIKAZE, cost: 50, weight: 5 },     // 42%
            { id: EnemyId.STALKER, cost: 70, weight: 2 },      // 17%
            { id: EnemyId.FORTRESS, cost: 120, weight: 1 },    // 8%
            { id: EnemyId.ELITE_GUNBOAT, cost: 120, weight: 1 }, // 8%
        ],
        boss: BossId.ANNIHILATOR
    },
    5: {
        id: 5,
        baseIncome: 22,
        creditCap: 220,
        startingCredits: 55,
        enemyPool: [
            { id: EnemyId.NORMAL, cost: 10, weight: 1 },         // 7%
            { id: EnemyId.FAST, cost: 30, weight: 2 },           // 13%
            { id: EnemyId.KAMIKAZE, cost: 50, weight: 3 },       // 20%
            { id: EnemyId.ELITE_GUNBOAT, cost: 120, weight: 3 }, // 20%
            { id: EnemyId.FORTRESS, cost: 120, weight: 2 },      // 13%
            { id: EnemyId.STALKER, cost: 70, weight: 2 },        // 13%
            { id: EnemyId.LASER_INTERCEPTOR, cost: 100, weight: 2 }, // 13%
        ],
        boss: BossId.DOMINATOR
    },
    6: {
        id: 6,
        baseIncome: 25,
        creditCap: 250,
        startingCredits: 60,
        enemyPool: [
            { id: EnemyId.NORMAL, cost: 10, weight: 1 },          // 6%
            { id: EnemyId.FAST, cost: 30, weight: 1 },            // 6%
            { id: EnemyId.KAMIKAZE, cost: 50, weight: 2 },        // 11%
            { id: EnemyId.ELITE_GUNBOAT, cost: 120, weight: 2 },  // 11%
            { id: EnemyId.LASER_INTERCEPTOR, cost: 100, weight: 6 }, // 33%
            { id: EnemyId.BARRAGE, cost: 110, weight: 3 },        // 17%
            { id: EnemyId.STALKER, cost: 70, weight: 3 },         // 17%
        ],
        boss: BossId.OVERLORD
    },
    7: {
        id: 7,
        baseIncome: 28,
        creditCap: 280,
        startingCredits: 70,
        enemyPool: [
            { id: EnemyId.KAMIKAZE, cost: 50, weight: 2 },        // 13%
            { id: EnemyId.ELITE_GUNBOAT, cost: 120, weight: 2 },  // 13%
            { id: EnemyId.LASER_INTERCEPTOR, cost: 100, weight: 4 }, // 27%
            { id: EnemyId.PULSAR, cost: 60, weight: 2 },          // 13%
            { id: EnemyId.FORTRESS, cost: 120, weight: 4 },       // 27%
            { id: EnemyId.STALKER, cost: 70, weight: 1 },         // 7%
        ],
        boss: BossId.TITAN
    },
    8: {
        id: 8,
        baseIncome: 31,
        creditCap: 310,
        startingCredits: 75,
        enemyPool: [
            { id: EnemyId.KAMIKAZE, cost: 50, weight: 1 },         // 6%
            { id: EnemyId.ELITE_GUNBOAT, cost: 120, weight: 2 },  // 11%
            { id: EnemyId.LASER_INTERCEPTOR, cost: 100, weight: 4 }, // 22%
            { id: EnemyId.MINE_LAYER, cost: 90, weight: 2 },      // 11%
            { id: EnemyId.PULSAR, cost: 60, weight: 5 },          // 28%
            { id: EnemyId.STALKER, cost: 70, weight: 2 },         // 11%
            { id: EnemyId.FORTRESS, cost: 120, weight: 2 },       // 11%
            { id: EnemyId.BARRAGE, cost: 110, weight: 2 },        // 11%
        ],
        boss: BossId.COLOSSUS
    },
    9: {
        id: 9,
        baseIncome: 34,
        creditCap: 340,
        startingCredits: 80,
        enemyPool: [
            { id: EnemyId.KAMIKAZE, cost: 50, weight: 1 },         // 6%
            { id: EnemyId.ELITE_GUNBOAT, cost: 120, weight: 2 },  // 11%
            { id: EnemyId.LASER_INTERCEPTOR, cost: 100, weight: 4 }, // 22%
            { id: EnemyId.MINE_LAYER, cost: 90, weight: 2 },      // 11%
            { id: EnemyId.PULSAR, cost: 60, weight: 2 },          // 11%
            { id: EnemyId.STALKER, cost: 70, weight: 2 },         // 11%
            { id: EnemyId.FORTRESS, cost: 120, weight: 4 },       // 22%
            { id: EnemyId.BARRAGE, cost: 110, weight: 2 },        // 11%
        ],
        boss: BossId.LEVIATHAN
    },
    10: {
        id: 10,
        baseIncome: 37,
        creditCap: 370,
        startingCredits: 90,
        enemyPool: [
            { id: EnemyId.NORMAL, cost: 10, weight: 2 },          // 10%
            { id: EnemyId.KAMIKAZE, cost: 50, weight: 1 },         // 5%
            { id: EnemyId.LASER_INTERCEPTOR, cost: 100, weight: 4 }, // 20%
            { id: EnemyId.MINE_LAYER, cost: 90, weight: 3 },      // 15%
            { id: EnemyId.PULSAR, cost: 60, weight: 3 },          // 15%
            { id: EnemyId.STALKER, cost: 70, weight: 2 },         // 10%
            { id: EnemyId.FORTRESS, cost: 120, weight: 3 },       // 15%
            { id: EnemyId.BARRAGE, cost: 110, weight: 3 },        // 15%
        ],
        boss: BossId.APOCALYPSE
    },
};
