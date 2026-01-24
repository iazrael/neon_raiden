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
            { id: EnemyId.NORMAL, cost: 10, weight: 6 },
            { id: EnemyId.FAST, cost: 30, weight: 3 },
            { id: EnemyId.TANK, cost: 80, weight: 1 },
            { id: EnemyId.STALKER, cost: 70, weight: 1 },
        ],
        boss: BossId.GUARDIAN
    },
    2: {
        id: 2,
        baseIncome: 13,
        creditCap: 130,
        enemyPool: [
            { id: EnemyId.NORMAL, cost: 10, weight: 5 },
            { id: EnemyId.FAST, cost: 30, weight: 3 },
            { id: EnemyId.TANK, cost: 80, weight: 5 },
            { id: EnemyId.PULSAR, cost: 60, weight: 1 },
            { id: EnemyId.STALKER, cost: 70, weight: 1 },
        ],
        boss: BossId.INTERCEPTOR
    },
    3: {
        id: 3,
        baseIncome: 16,
        creditCap: 160,
        enemyPool: [
            { id: EnemyId.NORMAL, cost: 10, weight: 1 },
            { id: EnemyId.FAST, cost: 30, weight: 5 },
            { id: EnemyId.TANK, cost: 80, weight: 5 },
            { id: EnemyId.KAMIKAZE, cost: 50, weight: 5 },
            { id: EnemyId.PULSAR, cost: 60, weight: 1 },
            { id: EnemyId.FORTRESS, cost: 150, weight: 1 },
        ],
        boss: BossId.DESTROYER
    },
    4: {
        id: 4,
        baseIncome: 19,
        creditCap: 190,
        enemyPool: [
            { id: EnemyId.NORMAL, cost: 10, weight: 1 },
            { id: EnemyId.FAST, cost: 30, weight: 1 },
            { id: EnemyId.KAMIKAZE, cost: 50, weight: 10 },
            { id: EnemyId.STALKER, cost: 70, weight: 1 },
            { id: EnemyId.FORTRESS, cost: 150, weight: 1 },
            { id: EnemyId.ELITE_GUNBOAT, cost: 120, weight: 1 },
        ],
        boss: BossId.ANNIHILATOR
    },
    5: {
        id: 5,
        baseIncome: 22,
        creditCap: 220,
        enemyPool: [
            { id: EnemyId.NORMAL, cost: 10, weight: 1 },
            { id: EnemyId.FAST, cost: 30, weight: 1 },
            { id: EnemyId.KAMIKAZE, cost: 50, weight: 5 },
            { id: EnemyId.ELITE_GUNBOAT, cost: 120, weight: 5 },
            { id: EnemyId.FORTRESS, cost: 150, weight: 1 },
            { id: EnemyId.STALKER, cost: 70, weight: 1 },
            { id: EnemyId.LASER_INTERCEPTOR, cost: 100, weight: 1 },
        ],
        boss: BossId.DOMINATOR
    },
    6: {
        id: 6,
        baseIncome: 25,
        creditCap: 250,
        enemyPool: [
            { id: EnemyId.NORMAL, cost: 10, weight: 1 },
            { id: EnemyId.FAST, cost: 30, weight: 1 },
            { id: EnemyId.KAMIKAZE, cost: 50, weight: 1 },
            { id: EnemyId.ELITE_GUNBOAT, cost: 120, weight: 1 },
            { id: EnemyId.LASER_INTERCEPTOR, cost: 100, weight: 10 },
            { id: EnemyId.BARRAGE, cost: 110, weight: 1 },
            { id: EnemyId.STALKER, cost: 70, weight: 1 },
        ],
        boss: BossId.OVERLORD
    },
    7: {
        id: 7,
        baseIncome: 28,
        creditCap: 280,
        enemyPool: [
            { id: EnemyId.KAMIKAZE, cost: 50, weight: 1 },
            { id: EnemyId.ELITE_GUNBOAT, cost: 120, weight: 1 },
            { id: EnemyId.LASER_INTERCEPTOR, cost: 100, weight: 5 },
            { id: EnemyId.PULSAR, cost: 60, weight: 1 },
            { id: EnemyId.FORTRESS, cost: 150, weight: 10 },
            { id: EnemyId.STALKER, cost: 70, weight: 1 },
        ],
        boss: BossId.TITAN
    },
    8: {
        id: 8,
        baseIncome: 31,
        creditCap: 310,
        enemyPool: [
            { id: EnemyId.KAMIKAZE, cost: 50, weight: 1 },
            { id: EnemyId.ELITE_GUNBOAT, cost: 120, weight: 1 },
            { id: EnemyId.LASER_INTERCEPTOR, cost: 100, weight: 5 },
            { id: EnemyId.MINE_LAYER, cost: 90, weight: 1 },
            { id: EnemyId.PULSAR, cost: 60, weight: 10 },
            { id: EnemyId.STALKER, cost: 70, weight: 1 },
            { id: EnemyId.FORTRESS, cost: 150, weight: 1 },
            { id: EnemyId.BARRAGE, cost: 110, weight: 1 },
        ],
        boss: BossId.COLOSSUS
    },
    9: {
        id: 9,
        baseIncome: 34,
        creditCap: 340,
        enemyPool: [
            { id: EnemyId.KAMIKAZE, cost: 50, weight: 1 },
            { id: EnemyId.ELITE_GUNBOAT, cost: 120, weight: 1 },
            { id: EnemyId.LASER_INTERCEPTOR, cost: 100, weight: 5 },
            { id: EnemyId.MINE_LAYER, cost: 90, weight: 1 },
            { id: EnemyId.PULSAR, cost: 60, weight: 1 },
            { id: EnemyId.STALKER, cost: 70, weight: 1 },
            { id: EnemyId.FORTRESS, cost: 150, weight: 10 },
            { id: EnemyId.BARRAGE, cost: 110, weight: 1 },
        ],
        boss: BossId.LEVIATHAN
    },
    10: {
        id: 10,
        baseIncome: 37,
        creditCap: 370,
        enemyPool: [
            { id: EnemyId.NORMAL, cost: 10, weight: 5 },
            { id: EnemyId.KAMIKAZE, cost: 50, weight: 1 },
            { id: EnemyId.LASER_INTERCEPTOR, cost: 100, weight: 5 },
            { id: EnemyId.MINE_LAYER, cost: 90, weight: 1 },
            { id: EnemyId.PULSAR, cost: 60, weight: 1 },
            { id: EnemyId.STALKER, cost: 70, weight: 1 },
            { id: EnemyId.FORTRESS, cost: 150, weight: 1 },
            { id: EnemyId.BARRAGE, cost: 110, weight: 5 },
        ],
        boss: BossId.APOCALYPSE
    },
};
