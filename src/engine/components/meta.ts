import { Component } from '../types';

// 「标签 & 死亡 & 特效」

/** 销毁标记组件 - 标记实体销毁的原因 */
export class DestroyTag extends Component {
    /**
     * 构造函数
     * @param cfg 销毁标记配置
     */
    constructor(cfg: {
        /** 销毁原因 */
        reason?: 'timeout' | 'killed' | 'consumed' | 'offscreen';
        /** 重用池类型 */
        reusePool?: 'bullet' | 'enemy' | 'pickup';
    }) {
        super();
        this.reason = cfg.reason ?? 'killed';
        this.reusePool = cfg.reusePool;
    }
    public reason: 'timeout' | 'killed' | 'consumed' | 'offscreen' = 'killed';
    public reusePool?: 'bullet' | 'enemy' | 'pickup';
    static check(c: any): c is DestroyTag { return c instanceof DestroyTag; }
}


// ========== 标签组件（空对象即可） ==========
/** 玩家标签组件 */
export class PlayerTag extends Component { }

/** 敌人标签组件 */
export class EnemyTag extends Component { }

/** Boss标签组件 */
export class BossTag extends Component { }



/** 相机震动组件 - 控制相机震动效果 */
export class CameraShake extends Component {
    /**
     * 构造函数
     * @param cfg 震动配置
     */
    constructor(cfg: {
        /** 震动强度 */
        intensity: number;
        /** 震动持续时间 */
        timer: number;
    }) {
        super();
        this.intensity = cfg.intensity;
        this.timer = cfg.timer;
    }
    public intensity: number;
    public timer: number;
    static check(c: any): c is CameraShake { return c instanceof CameraShake; }
}


/** Boss AI组件 - 控制Boss的行为模式 */
export class BossAI extends Component {
    /**
     * 构造函数
     * @param cfg Boss AI配置
     */
    constructor(cfg: {
        /** 当前阶段 */
        phase?: number;
        /** 下次行为模式切换时间 */
        nextPatternTime?: number;
    }) {
        super();
        this.phase = cfg.phase ?? 1;
        this.nextPatternTime = cfg.nextPatternTime ?? 0;
    }
    public phase = 1;
    public nextPatternTime = 0;
    static check(c: any): c is BossAI { return c instanceof BossAI; }
}

/** 分数值组件 - 击杀该实体可获得的分数 */
export class ScoreValue extends Component {
    constructor(cfg: { value: number }) {
        super();
        this.value = cfg.value;
    }
    public value: number;
    static check(c: any): c is ScoreValue { return c instanceof ScoreValue; }
}

// src/engine/components/meta.ts

/** 瞬移状态组件 - 挂载此组件表示实体正在瞬移（隐形/无敌/不可控） */
export class TeleportState extends Component {
    constructor(cfg: {
        timer: number;       // 瞬移持续时间（隐形时间）
        targetX: number;     // 目标 X
        targetY: number;     // 目标 Y
    }) {
        super();
        this.timer = cfg.timer;
        this.targetX = cfg.targetX;
        this.targetY = cfg.targetY;
    }
    public timer: number;
    public targetX: number;
    public targetY: number;

    static check(c: any): c is TeleportState { return c instanceof TeleportState; }
}