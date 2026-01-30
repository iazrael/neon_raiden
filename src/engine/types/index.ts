export * from './ids'
export * from './base'
export * from './collision'


export enum GameStatus {
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

