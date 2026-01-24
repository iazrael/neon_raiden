import { Component } from '../types';

// 「意图 & 击飞」

/** 击退组件 - 存储击退效果的速度 */
export class Knockback extends Component {
    /**
     * 构造函数
     * @param cfg 击退配置
     */
    constructor(cfg: {
        /** X轴击退速度 */
        vx: number;
        /** Y轴击退速度 */
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
        /** X轴移动方向 */
        dx: number;
        /** Y轴移动方向 */
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