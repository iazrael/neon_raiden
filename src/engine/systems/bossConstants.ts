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
    DEFAULT_RADIUS: 150,       // 默认半径
    DEFAULT_CENTER_Y: 200,      // 默认圆心Y坐标
    DEFAULT_FREQUENCY: 0.5,     // 默认角速度
    DEFAULT_CENTER_X_RATIO: 0.5 // 默认圆心X比例（屏幕宽度的0.5）
} as const;

/**
 * 瞬移移动参数
 */
export const TELEPORT = {
    DEFAULT_INTERVAL: 3000,        // 默认瞬移间隔（毫秒）
    DEFAULT_TELEPORT_WINDOW: 50,   // 默认瞬移窗口（毫秒）
    MARGIN_X: 100,                 // 屏幕左右边距
    MARGIN_Y: 100,                 // 屏幕上边距
    MAX_Y_SPREAD: 200              // Y轴最大扩散范围
} as const;

/**
 * 自适应移动参数
 */
export const ADAPTIVE = {
    DEFAULT_CLOSE_RANGE_THRESHOLD: 200, // 默认近距离阈值（像素）
    DODGE_SPEED_MULTIPLIER: 1.5,        // 闪避速度倍率
    TRACKING_SPEED_MULTIPLIER: 1.0      // 追踪速度倍率
} as const;

/**
 * 8字形移动参数
 */
export const FIGURE_8 = {
    DEFAULT_FREQUENCY: 1.0,      // 默认X轴频率
    DEFAULT_Y_FREQUENCY: 2.0,    // 默认Y轴频率（双倍X轴频率）
    DEFAULT_AMPLITUDE: 1.0       // 默认振幅
} as const;

/**
 * 之字形移动参数
 */
export const ZIGZAG = {
    DEFAULT_INTERVAL: 2000,      // 默认切换间隔（毫秒）
    DEFAULT_SWITCH_INTERVAL: 2   // 默认切换周期（秒）
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
    DEFAULT_DASH_THRESHOLD: 0.5     // 默认冲刺阈值
} as const;

/**
 * 激进移动参数
 */
export const AGGRESSIVE = {
    DEFAULT_FREQUENCY: 4.0,         // 默认摆动频率
    DEFAULT_SPEED_MULTIPLIER: 2.0,  // 默认速度倍率
    DEFAULT_VERTICAL_SPEED: 50      // 默认垂直速度
} as const;
