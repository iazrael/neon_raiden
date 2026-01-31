// Game configuration constants
export const GAME_CONFIG = {
    maxLevels: 10,          // 最大关卡数
    debug: false,           // 调试模式开关
    debugBossDivisor: 1,    // 调试模式Boss血量除数
};

// Physics constants
export const PHYSICS = {
    HIT_RADIUS: 20,
    BULLET_SPEED: 500,
    PLAYER_SPEED: 300,
};


// 跟敌人的碰撞伤害
export const COLLISION_DAMAGE = 10;

/**
 * Boss 出现时间（毫秒）
 */
export const BOSS_SPAWN_TIME = 60 * 1000; // 60秒后Boss出现

// 资源路径根目录
export const BASE_ASSET_PATH = './assets/sprites/';
