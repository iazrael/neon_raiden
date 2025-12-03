// configs/enemyGrowth.ts  （敌人成长数据）
import { EnemyType } from '@/types';

export const EnemyGrowthData: Record<EnemyType, Omit<EnemyEntity, 'type' | 'id' | 'name' | 'chineseName' | 'describe' | 'color' | 'sprite' | 'size' | 'weapon'>> = {
    [EnemyType.NORMAL]: {
        baseHp: 30,
        hpPerLevel: 10,
        baseSpeed: 2,
        speedPerLevel: 0.5,
        score: 100,
    },
    [EnemyType.FAST]: {
        baseHp: 10,
        hpPerLevel: 2,
        baseSpeed: 10,
        speedPerLevel: 0.5,
        score: 200,
    },
    [EnemyType.TANK]: {
        baseHp: 60,
        hpPerLevel: 20,
        baseSpeed: 1,
        speedPerLevel: 1,
        score: 300,
    },
    [EnemyType.KAMIKAZE]: {
        baseHp: 5,
        hpPerLevel: 1,
        baseSpeed: 10,
        speedPerLevel: 0.8,
        score: 400,
    },
    [EnemyType.ELITE_GUNBOAT]: {
        baseHp: 100,
        hpPerLevel: 10,
        baseSpeed: 0.5,
        speedPerLevel: 0,
        score: 500,
    },
    [EnemyType.LASER_INTERCEPTOR]: {
        baseHp: 80,
        hpPerLevel: 15,
        baseSpeed: 5,
        speedPerLevel: 1,
        score: 600,
    },
    [EnemyType.MINE_LAYER]: {
        baseHp: 60,
        hpPerLevel: 10,
        baseSpeed: 1.5,
        speedPerLevel: 0.1,
        score: 700,
    },
    [EnemyType.PULSAR]: {
        baseHp: 15,
        hpPerLevel: 5,
        baseSpeed: 6,
        speedPerLevel: 0.5,
        score: 250,
    },
    [EnemyType.FORTRESS]: {
        baseHp: 200,
        hpPerLevel: 10,
        baseSpeed: 0.8,
        speedPerLevel: 0.2,
        score: 800,
    },
    [EnemyType.STALKER]: {
        baseHp: 30,
        hpPerLevel: 10,
        baseSpeed: 5,
        speedPerLevel: 0.5,
        score: 350,
    },
    [EnemyType.BARRAGE]: {
        baseHp: 100,
        hpPerLevel: 10,
        baseSpeed: 1.2,
        speedPerLevel: 0.1,
        score: 600,
    }
};