import { Component } from '../types';

/**
 * 关卡过渡组件
 * 控制关卡切换动画的计时器
 */
export class LevelTransitionComponent extends Component {
    constructor(cfg: {
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
    }) {
        super();
        this.kind = cfg.kind;
        this.timer = cfg.timer;
        this.duration = cfg.duration;
        this.fromLevel = cfg.fromLevel;
        this.toLevel = cfg.toLevel;
    }

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

    static check(c: any): c is LevelTransitionComponent {
        return c instanceof LevelTransitionComponent;
    }
}

/**
 * Boss 退场组件
 * 控制 Boss 被击杀后的退场动画
 */
export class BossExitComponent extends Component {
    constructor(cfg: {
        /** 组件类型标识 */
        kind: 'BossExit';

        /** 退场计时器（毫秒） */
        timer: number;

        /** 退场持续时间（毫秒） */
        duration: number;

        /** Boss 实体 ID */
        bossId: string;

    }) {
        super();
        this.kind = cfg.kind;
        this.timer = cfg.timer;
        this.duration = cfg.duration;
        this.bossId = cfg.bossId;
    }

    /** 组件类型标识 */
    kind: 'BossExit';

    /** 退场计时器（毫秒） */
    timer: number;

    /** 退场持续时间（毫秒） */
    duration: number;

    /** Boss 实体 ID */
    bossId: string;

    static check(c: any): c is BossExitComponent {
        return c instanceof BossExitComponent;
    }
}
