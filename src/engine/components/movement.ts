import { Component } from '../types';

// 「意图 & 击飞」

/** 击退组件 - 存储击退效果的速度（单位：像素/秒） */
export class Knockback extends Component {
    /**
     * 构造函数
     * @param cfg 击退配置
     */
    constructor(cfg: {
        /** X轴击退速度（像素/秒） */
        vx: number;
        /** Y轴击退速度（像素/秒） */
        vy: number;
    }) {
        super();
        this.vx = cfg.vx;
        this.vy = cfg.vy;
    }
    public vx: number;
    public vy: number;
    static check(c: any): c is Knockback { return c instanceof Knockback; }
}


// ========== 意图组件（只存活一帧） ==========
/** 移动意图组件 - 表示实体想要移动的方向 */
export class MoveIntent extends Component {
    /**
     * 构造函数
     * @param cfg 移动意图配置
     */
    constructor(cfg: {
        /** X轴移动方向/速度（当type='velocity'时单位为像素/秒） */
        dx: number;
        /** Y轴移动方向/速度（当type='velocity'时单位为像素/秒） */
        dy: number;
        /** 意图类型 */
        type: 'velocity' | 'offset'; // 区分是 速度方向 还是 绝对位移
    }) {
        super();
        this.dx = cfg.dx ?? 0;
        this.dy = cfg.dy ?? 0;
        this.type = cfg.type;
    }
    public dx = 0;
    public dy = 0;
    public type: 'velocity' | 'offset' = 'velocity';
    static check(c: any): c is MoveIntent { return c instanceof MoveIntent; }
}

/** 开火意图组件 - 表示实体想要开火 */
export class FireIntent extends Component {
    constructor(cfg?: {
        firing?: boolean;
        angle?: number;
        targetId?: number;
    }) {
        super();
        this.firing = cfg?.firing ?? true;
        this.angle = cfg?.angle;
        this.targetId = cfg?.targetId;
    }
    public firing: boolean;
    public angle?: number;
    public targetId?: number;
    static check(c: any): c is FireIntent { return c instanceof FireIntent; }
}

/** 炸弹意图组件 - 表示想要投掷炸弹 */
export class BombIntent extends Component {
    static check(c: any): c is BombIntent { return c instanceof BombIntent; }
}

/**
 * 反弹组件 - 标记子弹可以反弹，并追踪反弹状态
 *
 * 职责：
 * - 存储剩余反弹次数
 * - 标记是否已经反弹过（用于协同效果触发）
 */
export class Bounce extends Component {
    /**
     * 构造函数
     * @param cfg 反弹配置
     */
    constructor(cfg: {
        /** 剩余反弹次数 */
        bouncesLeft: number;
        /** 反弹边界配置 */
        bounds?: {
            /** 是否在左右边界反弹 */
            bounceX?: boolean;
            /** 是否在顶部边界反弹 */
            bounceTop?: boolean;
            /** 是否在底部边界反弹 */
            bounceBottom?: boolean;
        };
    }) {
        super();
        this.bouncesLeft = cfg.bouncesLeft;
        this.bounds = cfg.bounds ?? { bounceX: true, bounceTop: true, bounceBottom: false };
    }
    /** 剩余反弹次数 */
    public bouncesLeft: number;
    /** 反弹边界配置 */
    public bounds: {
        bounceX?: boolean;
        bounceTop?: boolean;
        bounceBottom?: boolean;
    };
    /** 是否已反弹过（用于协同效果） */
    public hasBounced: boolean = false;
    static check(c: any): c is Bounce { return c instanceof Bounce; }
}