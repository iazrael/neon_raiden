import { Component } from '../types';

// 「意图 & 击飞」

/** 击退组件 - 存储击退效果的速度 */
export class Knockback extends Component {
    /**
     * 构造函数
     * @param vx X轴击退速度
     * @param vy Y轴击退速度
     */
    constructor(public vx: number, public vy: number) { super(); }
    static check(c: any): c is Knockback { return c instanceof Knockback; }
}


// ========== 意图组件（只存活一帧） ==========
/** 移动意图组件 - 表示实体想要移动的方向 */
export class MoveIntent extends Component {
    /**
     * 构造函数
     * @param dx X轴移动方向
     * @param dy Y轴移动方向
     */
    constructor(public dx = 0, public dy = 0) { super(); }
}

/** 开火意图组件 - 表示实体想要开火 */
export class FireIntent extends Component { }