/**
 * 关卡状态
 * 存储当前关卡的核心数值状态
 */
export interface LevelState {
    /** 当前关卡号 */
    currentLevel: number;

    /** 关卡进度 0-100（允许超出至120%） */
    progress: number;

    /** 关卡累积时间（毫秒）- 每帧累加dt，不使用Date.now() */
    elapsedTime: number;

    /** 击杀计数（用于进度加速） */
    killCount: number;
}
