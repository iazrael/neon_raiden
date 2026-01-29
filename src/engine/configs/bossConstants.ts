/**
 * Boss系统常量配置
 *
 * 定义Boss移动和行为的基础参数
 */

/**
 * 基础移动速度（像素/秒）
 */
export const BASE_MOVE_SPEED = 100;

/**
 * Boss场地配置（世界坐标系）
 * 定义Boss在屏幕中的活动范围和目标位置
 */
export const BOSS_ARENA = {
    /** Boss默认目标Y坐标（入场后的位置） */
    DEFAULT_TARGET_Y: 150,

    /** Boss默认中心Y坐标（用于圆形/8字形移动） */
    DEFAULT_CENTER_Y: 150,

    /** Boss活动范围边界 */
    UPPER_BOUND_Y: 100,
    LOWER_BOUND_Y: 250,

    /** 8字形移动半径 */
    FIGURE8_RADIUS_X: 150,
    FIGURE8_RADIUS_Y: 50,

    /** 激进模式移动范围 */
    AGGRESSIVE_CENTER_Y: 175,
    AGGRESSIVE_Y_SPREAD: 75,

    /** 浮点数比较精度（像素） */
    POSITION_EPSILON: 0.1,

    // 新增：通用参数
    /** 站桩模式轻微浮动幅度 */
    IDLE_FLOAT_AMPLITUDE: 5,
    /** 站桩模式浮动频率 */
    IDLE_FLOAT_FREQUENCY: 2.0,
} as const;

/**
 * 垂直移动速度（像素/秒）
 */
export const VERTICAL_SPEED = {
    SLOW: 20,
    NORMAL: 30,
    FAST: 40,
    VERY_FAST: 50
} as const;

/**
 * 圆形移动参数
 */
export const CIRCLE_MOVE = {
    DEFAULT_RADIUS: 150,            // 默认半径
    DEFAULT_CENTER_Y: 180,          // 默认圆心Y坐标（调整到180）
    DEFAULT_FREQUENCY: 0.5,         // 默认角速度
    DEFAULT_CENTER_X_RATIO: 0.5,    // 默认圆心X比例（屏幕宽度的0.5）

    // 新增：椭圆轨迹参数（Y轴半径较小）
    Y_RADIUS_RATIO: 0.5,            // Y轴半径是X轴的一半
} as const;

/**
 * 瞬移移动参数
 */
export const TELEPORT = {
    DEFAULT_INTERVAL: 3000,        // 默认瞬移间隔（毫秒）
    DEFAULT_TELEPORT_WINDOW: 50,   // 默认瞬移窗口（毫秒）
    MARGIN_X: 100,                 // 屏幕左右边距
    MARGIN_Y: 80,                  // 屏幕上边距（调整到80）
    MAX_Y_SPREAD: 220,             // Y轴最大扩散范围（80到300）

    // 新增：非瞬移期间的漂浮参数
    IDLE_DRIFT_SPEED_MULTIPLIER: 0.2, // 漂浮速度倍率
    IDLE_DRIFT_FREQUENCY: 2.0,        // 漂浮频率
} as const;

/**
 * 自适应移动参数
 */
export const ADAPTIVE = {
    DEFAULT_CLOSE_RANGE_THRESHOLD: 200, // 默认近距离阈值（像素）
    DODGE_SPEED_MULTIPLIER: 1.5,        // 闪避速度倍率
    TRACKING_SPEED_MULTIPLIER: 1.0,      // 追踪速度倍率

    // 新增：追踪模式Y轴范围
    TRACKING_CENTER_Y: 200,             // 追踪时Y轴中心位置
    TRACKING_Y_SPREAD: 50,              // 追踪时Y轴波动范围

    // 新增：无玩家时漂浮参数
    IDLE_DRIFT_SPEED_MULTIPLIER: 0.3,   // 漂浮速度倍率
} as const;

/**
 * 8字形移动参数
 */
export const FIGURE_8 = {
    DEFAULT_FREQUENCY: 1.0,      // 默认X轴频率
    DEFAULT_Y_FREQUENCY: 2.0,    // 默认Y轴频率（双倍X轴频率）
    DEFAULT_AMPLITUDE: 1.0,      // 默认振幅

    // 新增：8字形轨迹参数
    RADIUS_X: 150,               // X轴半径（从BOSS_ARENA提取）
    RADIUS_Y: 50,                // Y轴半径（从BOSS_ARENA提取）
    CENTER_Y: 150,               // 中心Y坐标（从BOSS_ARENA提取）
} as const;

/**
 * 之字形移动参数
 */
export const ZIGZAG = {
    DEFAULT_INTERVAL: 2000,      // 默认切换间隔（毫秒）
    DEFAULT_SWITCH_INTERVAL: 2,  // 默认切换周期（秒）

    // 新增：Y轴波动参数
    Y_WOBBLE_AMPLITUDE: 5,       // Y轴轻微波动幅度（像素）
    Y_WOBBLE_FREQUENCY: 0.8,     // Y轴波动频率
} as const;

/**
 * 缓慢下沉移动参数
 */
export const SLOW_DESCENT = {
    LOWER_BOUND_Y: 250,          // 下沉下限
    APPROACH_FACTOR: 0.5,        // 接近目标位置的因子

    // 新增：横向摆动参数
    LATERAL_DRIFT_AMPLITUDE: 0.3,// 横向摆动幅度（速度倍率）
    LATERAL_DRIFT_FREQUENCY: 1.2,// 横向摆动频率
} as const;

/**
 * 正弦移动参数
 */
export const SINE = {
    DEFAULT_FREQUENCY: 2.0,      // 默认频率
    DEFAULT_AMPLITUDE: 1.0       // 默认振幅
} as const;

/**
 * 冲刺移动参数
 */
export const DASH = {
    DEFAULT_SPEED_MULTIPLIER: 3.0,  // 默认冲刺速度倍率
    DEFAULT_CYCLE_FREQUENCY: 3.0,   // 默认冲刺频率
    DEFAULT_DASH_THRESHOLD: 0.5,    // 默认冲刺阈值

    // 新增：准备阶段参数
    PREP_TARGET_Y: 150,             // 准备阶段目标Y坐标
    PREP_APPROACH_FACTOR: 0.5,      // 接近目标位置的因子
} as const;

/**
 * 激进移动参数
 */
export const AGGRESSIVE = {
    DEFAULT_FREQUENCY: 4.0,         // 默认摆动频率
    DEFAULT_SPEED_MULTIPLIER: 2.0,  // 默认速度倍率
    DEFAULT_VERTICAL_SPEED: 50,     // 默认垂直速度

    // 新增：Y轴范围参数
    CENTER_Y: 175,                  // Y轴中心位置
    Y_SPREAD: 75,                   // Y轴波动范围
    APPROACH_FACTOR: 0.5,           // 接近目标位置的因子
} as const;
