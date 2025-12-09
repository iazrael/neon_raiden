// ==================== 敌人通用配置 ====================
export const EnemyCommonConfig = {
    // baseSpawnRate: 1200,
    // spawnRateReductionPerLevel: 200,
    // minSpawnRate: 300,
    // 小怪刷新速度配置
    enemySpawnIntervalByLevel: {
        1: 1000,
        2: 900,
        3: 900,
        4: 900,
        5: 800,
        6: 800,
        7: 800,
        8: 700,
        9: 700,
        10: 700
    },
    // 精英怪配置
    eliteChance: 0.1, // 变精英的概率
    eliteChanceBossMultiplier: 0.5, // Boss期间精英概率系数
    eliteHpMultiplier: 3,
    eliteSizeMultiplier: 1.3,
    eliteScoreMultiplier: 3,
    eliteDamageMultiplier: 1.5,
    eliteFireRateMultiplier: 1.5,
    // boss 战时刷怪概率降低
    enemySpawnIntervalInBossMultiplier: 1.35,
};
