import { Component } from '../types';

// 「空间 & 生命 & 基础运动」相关组件

// ========== 核心组件 ==========
/** 变换组件 - 存储实体的位置和旋转信息 */
export class Transform extends Component {
    /**
     * 构造函数
     * @param cfg 变换配置
     */
    constructor(cfg: { 
        /** X坐标 */
        x: number; 
        /** Y坐标 */
        y: number; 
        /** 旋转角度 */
        rot?: number; 
    }) { 
        super(); 
        this.x = cfg.x;
        this.y = cfg.y;
        this.rot = cfg.rot ?? 0;
    }
    public x: number;
    public y: number;
    public rot: number = 0;
    static check(c: any): c is Transform { return c instanceof Transform; }
}

/** 速度组件 - 存储实体的速度信息 */
export class Velocity extends Component {
    /**
     * 构造函数
     * @param cfg 速度配置
     */
    constructor(cfg: { 
        /** X轴速度, 单位像素/毫秒 */
        vx?: number; 
        /** Y轴速度, 单位像素/毫秒 */
        vy?: number; 
        /** 旋转速度, 单位像素/毫秒 */
        vrot?: number; 
    }) { 
        super(); 
        this.vx = cfg.vx ?? 0;
        this.vy = cfg.vy ?? 0;
        this.vrot = cfg.vrot ?? 0;
    }
    public vx = 0;
    public vy = 0;
    public vrot = 0;
    static check(c: any): c is Velocity { return c instanceof Velocity; }
}

/** 速度状态组件 - 存储实体的最大速度限制 */
export class SpeedStat extends Component {
    /**
     * 构造函数
     * @param cfg 速度状态配置
     */
    constructor(cfg: { 
        /** 最大线性速度 */
        maxLinear?: number; 
        /** 最大角速度 */
        maxAngular?: number; 
    }) { 
        super(); 
        this.maxLinear = cfg.maxLinear ?? 400;
        this.maxAngular = cfg.maxAngular ?? 5;
    }
    public maxLinear = 400;
    public maxAngular = 5;
    static check(c: any): c is SpeedStat { return c instanceof SpeedStat; }
}

/** 生命值组件 - 存储实体的生命值信息 */
export class Health extends Component {
    /**
     * 构造函数
     * @param cfg 生命值配置
     */
    constructor(cfg: { 
        /** 当前生命值 */
        hp: number; 
        /** 最大生命值 */
        max: number; 
    }) { 
        super(); 
        this.hp = cfg.hp;
        this.max = cfg.max;
    }
    public hp: number;
    public max: number;
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
     * @param cfg 生命周期配置
     */
    constructor(cfg: { 
        /** 倒计时时间, 单位秒 */
        timer: number; 
    }) { 
        super(); 
        this.timer = cfg.timer;
    }
    public timer: number;
    static check(c: any): c is Lifetime { return c instanceof Lifetime; }
}









