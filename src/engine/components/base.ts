import { Component } from '../types';

// 「空间 & 生命 & 基础运动」相关组件

// ========== 核心组件 ==========
/** 变换组件 - 存储实体的位置和旋转信息 */
export class Transform extends Component {
    /**
     * 构造函数
     * @param x X坐标
     * @param y Y坐标
     * @param rot 旋转角度
     */
    constructor(public x = 0, public y = 0, public rot = 0) { super(); }
    static check(c: any): c is Transform { return c instanceof Transform; }
}

/** 速度组件 - 存储实体的速度信息 */
export class Velocity extends Component {
    /**
     * 构造函数
     * @param vx X轴速度
     * @param vy Y轴速度
     * @param vrot 旋转速度
     */
    constructor(public vx = 0, public vy = 0, public vrot = 0) { super(); }
    static check(c: any): c is Velocity { return c instanceof Velocity; }
}

/** 速度状态组件 - 存储实体的最大速度限制 */
export class SpeedStat extends Component {
    /**
     * 构造函数
     * @param maxLinear 最大线性速度
     * @param maxAngular 最大角速度
     */
    constructor(public maxLinear = 400, public maxAngular = 5) { super(); }
    static check(c: any): c is SpeedStat { return c instanceof SpeedStat; }
}

/** 生命值组件 - 存储实体的生命值信息 */
export class Health extends Component {
    /**
     * 构造函数
     * @param hp 当前生命值
     * @param max 最大生命值
     */
    constructor(public hp: number, public max: number) { super(); }
    static check(c: any): c is Health { return c instanceof Health; }
}


/** 碰撞盒组件 - 定义实体的碰撞区域 */
export class HitBox extends Component {
    /** 碰撞形状 */
    shape: 'circle' | 'rect' | 'capsule' = 'circle';
    /** 圆形半径 */
    radius?: number;
    /** 矩形半宽 */
    halfWidth?: number;
    /** 矩形半高 */
    halfHeight?: number;
    /** 胶囊半径 */
    capRadius?: number;
    /** 胶囊高度 */
    capHeight?: number;

    /**
     * 构造函数
     * @param cfg 碰撞盒配置
     */
    constructor(cfg: Partial<HitBox> = {}) {
        super();
        Object.assign(this, cfg);
    }
    static check(c: any): c is HitBox { return c instanceof HitBox; }
}

/** 生命周期组件 - 控制实体的存在时间 */
export class Lifetime extends Component {
    /**
     * 构造函数
     * @param timer 倒计时时间
     */
    constructor(public timer: number) { super(); }
    static check(c: any): c is Lifetime { return c instanceof Lifetime; }
}









