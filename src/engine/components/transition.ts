/**
 * 关卡过渡组件
 * 控制关卡切换动画的计时器
 */
export interface LevelTransitionComponent {
    /** 组件类型标识 */
    kind: 'LevelTransition';

    /** 动画计时器（毫秒） */
    timer: number;

    /** 总持续时间（毫秒） */
    duration: number;

    /** 来源关卡 */
    fromLevel: number;

    /** 目标关卡 */
    toLevel: number;
}

/**
 * Boss 退场组件
 * 控制 Boss 被击杀后的退场动画
 */
export interface BossExitComponent {
    /** 组件类型标识 */
    kind: 'BossExit';

    /** 退场计时器（毫秒） */
    timer: number;

    /** 退场持续时间（毫秒） */
    duration: number;

    /** Boss 实体 ID */
    bossId: string;

    /** Boss 类型 */
    bossType: string;
}
