import {
    EnemyType,
} from '@/types';

// ==================== 敌人生成权重配置 ====================
export const EnemySpawnWeights: Record<number, Record<EnemyType, number>> = {
    // 第1关: 1大(NORMAL), 1中(FAST), 3小(TANK, PULSAR, BARRAGE)
    1: { [EnemyType.NORMAL]: 10, [EnemyType.FAST]: 3, [EnemyType.TANK]: 1, [EnemyType.PULSAR]: 0, [EnemyType.KAMIKAZE]: 0, [EnemyType.ELITE_GUNBOAT]: 0, [EnemyType.LASER_INTERCEPTOR]: 0, [EnemyType.MINE_LAYER]: 0, [EnemyType.FORTRESS]: 0, [EnemyType.STALKER]: 1, [EnemyType.BARRAGE]: 0 },
    // 第2关: 1大(FAST), 2中(TANK, PULSAR), 1小(STALKER)
    2: { [EnemyType.NORMAL]: 5, [EnemyType.FAST]: 3, [EnemyType.TANK]: 5, [EnemyType.PULSAR]: 1, [EnemyType.STALKER]: 1, [EnemyType.KAMIKAZE]: 0, [EnemyType.ELITE_GUNBOAT]: 0, [EnemyType.LASER_INTERCEPTOR]: 0, [EnemyType.MINE_LAYER]: 0, [EnemyType.FORTRESS]: 0, [EnemyType.BARRAGE]: 0 },
    // 第3关: 1大(TANK), 2中(FAST, PULSAR), 3小(KAMIKAZE, STALKER, FORTRESS)
    3: { [EnemyType.NORMAL]: 1, [EnemyType.FAST]: 5, [EnemyType.TANK]: 5, [EnemyType.KAMIKAZE]: 5, [EnemyType.PULSAR]: 1, [EnemyType.FORTRESS]: 1, [EnemyType.STALKER]: 0, [EnemyType.ELITE_GUNBOAT]: 0, [EnemyType.LASER_INTERCEPTOR]: 0, [EnemyType.MINE_LAYER]: 0, [EnemyType.BARRAGE]: 0 },




    // 第4关: 1大(KAMIKAZE), 2中(MINE_LAYER, STALKER), 3小(NORMAL, FORTRESS, BARRAGE)
    4: { [EnemyType.NORMAL]: 1, [EnemyType.FAST]: 1, [EnemyType.TANK]: 0, [EnemyType.KAMIKAZE]: 10, [EnemyType.STALKER]: 1, [EnemyType.FORTRESS]: 1, [EnemyType.BARRAGE]: 0, [EnemyType.PULSAR]: 0, [EnemyType.ELITE_GUNBOAT]: 1, [EnemyType.LASER_INTERCEPTOR]: 0, [EnemyType.MINE_LAYER]: 0 },
    // 第5关: 1大(ELITE_GUNBOAT), 2中(FAST, FORTRESS), 3小(NORMAL, KAMIKAZE, BARRAGE)
    5: { [EnemyType.NORMAL]: 1, [EnemyType.FAST]: 1, [EnemyType.TANK]: 0, [EnemyType.KAMIKAZE]: 1, [EnemyType.ELITE_GUNBOAT]: 10, [EnemyType.FORTRESS]: 1, [EnemyType.BARRAGE]: 0, [EnemyType.PULSAR]: 0, [EnemyType.STALKER]: 1, [EnemyType.LASER_INTERCEPTOR]: 1, [EnemyType.MINE_LAYER]: 0 },
    // 第6关: 1大(LASER_INTERCEPTOR), 2中(FAST, PULSAR), 3小(NORMAL, KAMIKAZE, BARRAGE, STALKER)
    6: { [EnemyType.NORMAL]: 1, [EnemyType.FAST]: 1, [EnemyType.TANK]: 0, [EnemyType.KAMIKAZE]: 1, [EnemyType.ELITE_GUNBOAT]: 1, [EnemyType.LASER_INTERCEPTOR]: 10, [EnemyType.BARRAGE]: 1, [EnemyType.PULSAR]: 0, [EnemyType.FORTRESS]: 0, [EnemyType.STALKER]: 1, [EnemyType.MINE_LAYER]: 1 },



    // 第7关: 2大(MINE_LAYER, FORTRESS), 2中(KAMIKAZE, STALKER), 3小(ELITE_GUNBOAT, LASER_INTERCEPTOR, PULSAR)
    7: { [EnemyType.NORMAL]: 0, [EnemyType.FAST]: 0, [EnemyType.TANK]: 0, [EnemyType.KAMIKAZE]: 1, [EnemyType.ELITE_GUNBOAT]: 1, [EnemyType.LASER_INTERCEPTOR]: 5, [EnemyType.MINE_LAYER]: 10, [EnemyType.PULSAR]: 1, [EnemyType.FORTRESS]: 1, [EnemyType.STALKER]: 1, [EnemyType.BARRAGE]: 0 },

    // 第8关: 1大(KAMIKAZE), 3中(ELITE_GUNBOAT, LASER_INTERCEPTOR, MINE_LAYER), 3小(PULSAR, STALKER, FORTRESS)
    8: { [EnemyType.NORMAL]: 0, [EnemyType.FAST]: 0, [EnemyType.TANK]: 0, [EnemyType.KAMIKAZE]: 1, [EnemyType.ELITE_GUNBOAT]: 1, [EnemyType.LASER_INTERCEPTOR]: 5, [EnemyType.MINE_LAYER]: 1, [EnemyType.PULSAR]: 10, [EnemyType.STALKER]: 1, [EnemyType.FORTRESS]: 1, [EnemyType.BARRAGE]: 1 },
    // 第9关: 1大(KAMIKAZE), 3中(LASER_INTERCEPTOR, MINE_LAYER, PULSAR), 4小(ELITE_GUNBOAT, STALKER, FORTRESS, BARRAGE)
    9: { [EnemyType.NORMAL]: 0, [EnemyType.FAST]: 0, [EnemyType.TANK]: 0, [EnemyType.KAMIKAZE]: 1, [EnemyType.ELITE_GUNBOAT]: 1, [EnemyType.LASER_INTERCEPTOR]: 5, [EnemyType.MINE_LAYER]: 1, [EnemyType.PULSAR]: 1, [EnemyType.STALKER]: 1, [EnemyType.FORTRESS]: 10, [EnemyType.BARRAGE]: 1 },
    // 第10关: 2大(PULSAR, STALKER), 3中(LASER_INTERCEPTOR, MINE_LAYER, FORTRESS), 4小(KAMIKAZE, ELITE_GUNBOAT, BARRAGE)
    10: { [EnemyType.NORMAL]: 5, [EnemyType.FAST]: 0, [EnemyType.TANK]: 0, [EnemyType.KAMIKAZE]: 1, [EnemyType.ELITE_GUNBOAT]: 0, [EnemyType.LASER_INTERCEPTOR]: 5, [EnemyType.MINE_LAYER]: 0, [EnemyType.PULSAR]: 1, [EnemyType.STALKER]: 1, [EnemyType.FORTRESS]: 1, [EnemyType.BARRAGE]: 5 }
};