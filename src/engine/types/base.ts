// ========== 基础类型 ==========
/** 实体ID类型 */
export type EntityId = number;
/** 组件类型 */
export type ComponentType = new (...args: any[]) => Component;

// ========== 空基类（可选，方便 instanceof） ==========
/** 组件基类 */
export abstract class Component { }

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

/** 护盾组件 - 存储实体的护盾信息 */
export class Shield extends Component {
    /**
     * 构造函数
     * @param value 当前护盾值
     * @param regen 护盾恢复速度
     */
    constructor(public value = 0, public regen = 0) { super(); }
    static check(c: any): c is Shield { return c instanceof Shield; }
}

/** 武器组件 - 存储实体的武器信息 */
export class Weapon extends Component {
    /**
     * 构造函数
     * @param ammoType 弹药类型
     * @param cooldown 冷却时间
     * @param curCD 当前冷却时间
     */
    constructor(
        public ammoType: string,
        public cooldown: number,
        public curCD = 0
    ) { super(); }
    static check(c: any): c is Weapon { return c instanceof Weapon; }
}

/** 子弹组件 - 存储子弹相关信息 */
export class Bullet extends Component {
    /**
     * 构造函数
     * @param owner 子弹拥有者ID
     * @param ammoType 弹药类型
     * @param pierceLeft 穿透次数剩余
     * @param bouncesLeft 弹跳次数剩余
     */
    constructor(
        public owner: EntityId,
        public ammoType: string,
        public pierceLeft = 0,
        public bouncesLeft = 0
    ) { super(); }
    static check(c: any): c is Bullet { return c instanceof Bullet; }
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

/** 掉落表组件 - 定义实体被销毁时的掉落物品 */
export class DropTable extends Component {
    /**
     * 构造函数
     * @param table 掉落项数组
     */
    constructor(public table: Array<{ item: string; weight: number; min?: number; max?: number }>) {
        super();
    }
    static check(c: any): c is DropTable { return c instanceof DropTable; }
}

/** 拾取物品组件 - 定义可拾取物品的属性 */
export class PickupItem extends Component {
    /**
     * 构造函数
     * @param kind 物品类型
     * @param blueprint 蓝图名称
     * @param autoPickup 是否自动拾取
     */
    constructor(
        public kind: 'weapon' | 'buff' | 'coin',
        public blueprint: string,
        public autoPickup = false
    ) { super(); }
    static check(c: any): c is PickupItem { return c instanceof PickupItem; }
}

/** 增益效果组件 - 存储实体身上的增益效果 */
export class Buff extends Component {
    /**
     * 构造函数
     * @param type 增益类型
     * @param value 效果数值
     * @param timer 持续时间
     */
    constructor(
        public type: 'speed' | 'damage' | 'invincible',
        public value: number,
        public timer: number
    ) { super(); }
    static check(c: any): c is Buff { return c instanceof Buff; }
}

/** 销毁标记组件 - 标记实体销毁的原因 */
export class DestroyTag extends Component {
    /**
     * 构造函数
     * @param reason 销毁原因
     * @param reusePool 重用池类型
     */
    constructor(
        public reason: 'timeout' | 'killed' | 'consumed' | 'offscreen' = 'killed',
        public reusePool?: 'bullet' | 'enemy' | 'pickup'
    ) { super(); }
    static check(c: any): c is DestroyTag { return c instanceof DestroyTag; }
}

/** 相机震动组件 - 控制相机震动效果 */
export class CameraShake extends Component {
    /**
     * 构造函数
     * @param intensity 震动强度
     * @param timer 震动持续时间
     */
    constructor(public intensity: number, public timer: number) { super(); }
    static check(c: any): c is CameraShake { return c instanceof CameraShake; }
}

/** 粒子组件 - 控制粒子系统 */
export class Particle extends Component {
    /**
     * 构造函数
     * @param frame 当前帧
     * @param maxFrame 最大帧数
     */
    constructor(public frame = 0, public maxFrame = 1) { super(); }
    static check(c: any): c is Particle { return c instanceof Particle; }
}

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


/** 精灵组件 - 存储实体的纹理信息 */
export class Sprite extends Component {
    /**
     * 构造函数
     * @param texture 纹理名称
     */
    constructor(public texture: string) { super(); }
    static check(c: any): c is Sprite { return c instanceof Sprite; }
}

/** Boss AI组件 - 控制Boss的行为模式 */
export class BossAI extends Component {
    /**
     * 构造函数
     * @param phase 当前阶段
     * @param nextPatternTime 下次行为模式切换时间
     */
    constructor(public phase = 1, public nextPatternTime = 0) { super(); }
    static check(c: any): c is BossAI { return c instanceof BossAI; }
}

// ========== 标签组件（空对象即可） ==========
/** 玩家标签组件 */
export class PlayerTag extends Component { }

/** 敌人标签组件 */
export class EnemyTag extends Component { }

/** Boss标签组件 */
export class BossTag extends Component { }

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

// ========== Blueprint 类型 ==========
/** 蓝图类型 - 组件映射 */
export type Blueprint = Record<string, Component>;

// ========== 世界接口 ==========
/** 世界接口 */
export interface World {
    /** 实体集合 */
    entities: Map<EntityId, Component[]>;
    /** 玩家ID */
    playerId: EntityId;
}