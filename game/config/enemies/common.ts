// ==================== 敌人通用配置 ====================
export const EnemyCommonConfig = {
    // baseSpawnRate: 1200,
    // spawnRateReductionPerLevel: 200,
    // minSpawnRate: 300,
    // 小怪刷新速度配置
    enemySpawnIntervalByLevel: {
        1: 1000,
        2: 950,
        3: 900,
        4: 850,
        5: 800,
        6: 750,
        7: 700,
        8: 650,
        9: 600,
        10: 600
    },
    // 精英怪配置
    eliteChance: 0.15,
    eliteHpMultiplier: 3,
    eliteSizeMultiplier: 1.3,
    eliteScoreMultiplier: 3,
    eliteDamageMultiplier: 1.5,
    eliteFireRateMultiplier: 1.5,
    enemyCountMultiplier: 1.15,
};