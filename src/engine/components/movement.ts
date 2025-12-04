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
        dx?: number; 
        /** Y轴移动方向 */
        dy?: number; 
    }) { 
        super(); 
        this.dx = cfg.dx ?? 0;
        this.dy = cfg.dy ?? 0;
    }
    public dx = 0;
    public dy = 0;
}

/** 开火意图组件 - 表示实体想要开火 */
export class FireIntent extends Component { }