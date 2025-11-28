
// ==================== 游戏基础配置 ====================
export const GameConfig = {
    width: 0,           // 游戏宽度（动态设置）
    height: 0,          // 游戏高度（动态设置）
    maxLevels: 10,      // 最大关卡数
    debug: false,       // 调试模式开关
    enemySpawnIntervalByLevel: {
        1: 1000,
        2: 900,
        3: 850,
        4: 750,
        5: 700,
        6: 670,
        7: 630,
        8: 600,
        9: 600,
        10: 600
    }
};

// ==================== 资源路径配置 ====================
export const ASSETS_BASE_PATH = './assets/sprites/';
