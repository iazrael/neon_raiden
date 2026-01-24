export * from './ids'
export * from './base'

// Boss移动模式枚举 - 定义所有Boss移动行为模式
export enum BossMovementPattern {
    IDLE = 'idle',
    SINE = 'sine',
    FIGURE_8 = 'figure_8',
    CIRCLE = 'circle',
    ZIGZAG = 'zigzag',
    SLOW_DESCENT = 'slow_descent',
    FOLLOW = 'follow',
    TRACKING = 'tracking',
    DASH = 'dash',
    RANDOM_TELEPORT = 'random_teleport',
    ADAPTIVE = 'adaptive',
    AGGRESSIVE = 'aggressive',
    SPIRAL_DESCENT = 'spiral_descent',
    HORIZONTAL_SCAN = 'horizontal_scan',
    VERTICAL_SWAY = 'vertical_sway',
    AMBUSH = 'ambush',
    HOP = 'hop'
}

// 游戏状态枚举 - 避免循环依赖
export enum GameState {
    MENU = 'MENU',
    PLAYING = 'PLAYING',
    PAUSED = 'PAUSED',
    GAME_OVER = 'GAME_OVER',
    VICTORY = 'VICTORY',
    GALLERY = 'GALLERY'
}

// 连击状态接口 - 避免循环依赖
export interface ComboState {
    count: number;
    timer: number;
    multiplier: number;
}

// 武器类型 - 避免循环依赖
export type WeaponType = 'vulcan' | 'laser' | 'missile' | 'wave' | 'plasma' | 'tesla' | 'magma' | 'shuriken';



