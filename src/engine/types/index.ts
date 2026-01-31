import { BossId } from './ids';

export * from './ids'
export * from './base'
export * from './collision'


export enum GameState {
    MENU,
    PLAYING,
    PAUSED,
    GAME_OVER,
    VICTORY,
    GALLERY
}

export interface ComboState {
    /** 当前连击数 */
    count: number;
    /** 连击计时器(ms),超过5000ms清零 */
    timer: number;
    /** 当前连击等级(0-4对应无/10/25/50/100连击) */
    level: number;
    /** 历史最高连击数 */
    maxCombo: number;
    /** 是否触发过狂暴模式(100连击) */
    hasBerserk: boolean;
}


/** 相机状态 */
export interface CameraState {
    x: number;
    y: number;
    shakeX: number;
    shakeY: number;
    zoom: number;
    /** 震屏剩余时间（毫秒） */
    shakeTimer: number;
    /** 震屏强度 */
    shakeIntensity: number;
}

/** 渲染状态 */
export interface RenderState {
    camera: CameraState;
}

/** Boss 刷怪状态 */
export interface BossState {
    /** boss 的实体 ID */
    bossId: number;
    /** Boss 出现时间（毫秒），默认 60000 (60秒) */
    timer: number;
    /** Boss 是否已刷出 */
    spawned: boolean;
}
