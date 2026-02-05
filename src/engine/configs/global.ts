// Game configuration constants
export const GAME_CONFIG = {
    maxLevels: 10,          // 最大关卡数
    debug: false,           // 调试模式开关
    debugBossDivisor: 1,    // 调试模式Boss血量除数

    /**
     * 武器是否自动发射
     * true: 持续自动开火，无需按键
     * false: 需要按住空格或鼠标点击才开火
     */
    autoFire: true,

    /**
     * 鼠标控制模式
     * 'drag': 拖拽模式 - 需要按住才移动
     * 'follow': 跟随模式 - 鼠标在哪战机就跟到哪
     */
    mouseControlMode: 'follow' as 'drag' | 'follow',
};

// Physics constants
export const PHYSICS = {
    HIT_RADIUS: 20,
    BULLET_SPEED: 500,
    PLAYER_SPEED: 300,
};

export const STARTING_CREDITS = 100

// 究极伤害, 一百万
export const ULTIMATE_DAMAGE = 1000000;

// 跟敌人的碰撞伤害
export const COLLISION_DAMAGE = 10;

// 资源路径根目录
export const BASE_ASSET_PATH = './assets/sprites/';

// 僚机旋转速度系数
export const OPTION_ROTATION_SPEED = 2;
// 僚机移动平滑系数 
export const OPTION_LERP_FACTOR = 0.2;
// 僚机的环绕半径
export const OPTION_RADIUS = 60;          