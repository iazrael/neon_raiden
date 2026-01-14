export * from './ids'
export * from './types'

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

// ========== 基础类型 ==========
/** 实体ID类型 */
export type EntityId = number;

/** 组件基类 */
export abstract class Component { }

// ========== 世界接口 ==========
/** 世界接口 */
export interface World {
    /** 实体集合 */
    entities: Map<EntityId, Component[]>;
    /** 玩家ID */
    playerId: EntityId;
    /** 事件队列 */
    events: Event[];
    time: number;   // 当前时间
    score: number;  // 全局进度
    level: number;  // 关卡序号
    playerLevel: number;  // 战机等级
    difficulty: number;   // 动态倍率
    spawnCredits: number; // 当前余额
    spawnTimer: number;   // 用来控制刷怪检测频率
    enemyCount: number;   // 当前敌人数量
    width: number;        // 画布宽
    height: number;       // 画布高

    // 新增字段用于UI状态
    state?: GameState;
    maxLevelReached?: number;
    comboState?: ComboState;
}



