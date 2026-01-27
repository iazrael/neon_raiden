export * from './ids'
export * from './base'
export * from './collision'

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

// 从外部导入 GameState 和 ComboState，保持与旧代码兼容
import { GameState } from '@/types';
export type { ComboState } from '@/game/systems/ComboSystem';

// 重新导出 GameState
export { GameState };

// 武器类型 - 避免循环依赖
export type WeaponType = 'vulcan' | 'laser' | 'missile' | 'wave' | 'plasma' | 'tesla' | 'magma' | 'shuriken';



