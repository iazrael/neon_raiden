
// ==================== 游戏基础配置 ====================
export const GameConfig = {
    width: 0,           // 游戏宽度（动态设置）
    height: 0,          // 游戏高度（动态设置）
    maxLevels: 10,      // 最大关卡数
    debug: false,       // 调试模式开关
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
    }
};

// ==================== 资源路径配置 ====================
export const ASSETS_BASE_PATH = './assets/sprites/';
