import {
    EnemyType,
} from '@/types';

// ==================== 敌人生成权重配置 ====================
export const EnemySpawnWeights: Record<number, Record<EnemyType, number>> = {
    1: { [EnemyType.NORMAL]: 10, [EnemyType.FAST]: 3, [EnemyType.TANK]: 1, [EnemyType.PULSAR]: 1, [EnemyType.KAMIKAZE]: 0, [EnemyType.ELITE_GUNBOAT]: 0, [EnemyType.LASER_INTERCEPTOR]: 0, [EnemyType.MINE_LAYER]: 0, [EnemyType.FORTRESS]: 0, [EnemyType.STALKER]: 0, [EnemyType.BARRAGE]: 0 },
    2: { [EnemyType.NORMAL]: 3, [EnemyType.FAST]: 10, [EnemyType.TANK]: 2, [EnemyType.PULSAR]: 5, [EnemyType.STALKER]: 1, [EnemyType.KAMIKAZE]: 0, [EnemyType.ELITE_GUNBOAT]: 0, [EnemyType.LASER_INTERCEPTOR]: 0, [EnemyType.MINE_LAYER]: 0, [EnemyType.FORTRESS]: 0, [EnemyType.BARRAGE]: 0 },
    3: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 3, [EnemyType.TANK]: 10, [EnemyType.KAMIKAZE]: 2, [EnemyType.PULSAR]: 3, [EnemyType.STALKER]: 3, [EnemyType.FORTRESS]: 1, [EnemyType.ELITE_GUNBOAT]: 0, [EnemyType.LASER_INTERCEPTOR]: 0, [EnemyType.MINE_LAYER]: 0, [EnemyType.BARRAGE]: 0 },
    4: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 2, [EnemyType.TANK]: 3, [EnemyType.KAMIKAZE]: 10, [EnemyType.STALKER]: 5, [EnemyType.FORTRESS]: 3, [EnemyType.BARRAGE]: 1, [EnemyType.PULSAR]: 0, [EnemyType.ELITE_GUNBOAT]: 0, [EnemyType.LASER_INTERCEPTOR]: 0, [EnemyType.MINE_LAYER]: 0 },
    5: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 3, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 3, [EnemyType.ELITE_GUNBOAT]: 10, [EnemyType.FORTRESS]: 5, [EnemyType.BARRAGE]: 3, [EnemyType.PULSAR]: 0, [EnemyType.STALKER]: 0, [EnemyType.LASER_INTERCEPTOR]: 0, [EnemyType.MINE_LAYER]: 0 },
    6: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 3, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 3, [EnemyType.ELITE_GUNBOAT]: 3, [EnemyType.LASER_INTERCEPTOR]: 10, [EnemyType.BARRAGE]: 5, [EnemyType.PULSAR]: 5, [EnemyType.FORTRESS]: 0, [EnemyType.STALKER]: 0, [EnemyType.MINE_LAYER]: 0 },
    7: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 3, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 3, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 3, [EnemyType.MINE_LAYER]: 10, [EnemyType.STALKER]: 5, [EnemyType.PULSAR]: 0, [EnemyType.FORTRESS]: 0, [EnemyType.BARRAGE]: 0 },
    8: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 10, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 8, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 4, [EnemyType.MINE_LAYER]: 3, [EnemyType.PULSAR]: 5, [EnemyType.STALKER]: 5, [EnemyType.FORTRESS]: 5, [EnemyType.BARRAGE]: 5 },
    9: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 8, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 10, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 4, [EnemyType.MINE_LAYER]: 3, [EnemyType.PULSAR]: 8, [EnemyType.STALKER]: 8, [EnemyType.FORTRESS]: 8, [EnemyType.BARRAGE]: 8 },
    10: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 9, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 10, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 5, [EnemyType.MINE_LAYER]: 4, [EnemyType.PULSAR]: 10, [EnemyType.STALKER]: 10, [EnemyType.FORTRESS]: 10, [EnemyType.BARRAGE]: 10 }
};