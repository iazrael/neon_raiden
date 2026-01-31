import { AmmoType, BuffType, Component, EntityId, EnemyWeaponId, WeaponId, WeaponPattern } from '../types';

// 「攻击 & 防御 & 增益」

/** 护盾组件 - 存储实体的护盾信息
 */
export class Shield extends Component {
    /**
     * 构造函数
     * @param cfg 护盾配置
     */
    constructor(cfg: {
        /** 当前护盾值 */
        value: number;

        /** 护盾最大值 */
        max: number;
    }) {
        super();
        this.value = cfg.value;
        this.max = cfg.max;
    }
    public value = 0;
    public max = 0;
    static check(c: any): c is Shield { return c instanceof Shield; }
}

/** 武器组件 - 存储实体的武器信息 */
export class Weapon extends Component {
    /**
     * 构造函数
     * @param cfg 武器配置
     */
    constructor(cfg: {
        id: WeaponId | EnemyWeaponId
        /** 弹药类型 */
        ammoType: AmmoType;
        /** 基础冷却时间（毫秒） */
        cooldown: number;
        /** 当前冷却时间 */
        curCD?: number;
        /** 武器等级 */
        level?: number;
        /** 子弹数量 */
        bulletCount?: number;
        /** 扩散角度 */
        spread?: number;
        /** 弹幕模式 */
        pattern?: WeaponPattern;
        /** 伤害倍率 */
        damageMultiplier?: number;
        /** 射速倍率 */
        fireRateMultiplier?: number;
        /** 穿透次数 */
        pierce?: number;
        /** 弹跳次数 */
        bounces?: number;
    }) {
        super();
        this.id = cfg.id;
        this.ammoType = cfg.ammoType;
        this.cooldown = cfg.cooldown;
        this.curCD = cfg.curCD ?? 0;
        this.level = cfg.level ?? 1;
        this.bulletCount = cfg.bulletCount ?? 1;
        this.spread = cfg.spread;
        this.pattern = cfg.pattern;
        this.damageMultiplier = cfg.damageMultiplier ?? 1.0;
        this.fireRateMultiplier = cfg.fireRateMultiplier ?? 1.0;
        this.pierce = cfg.pierce ?? 0;
        this.bounces = cfg.bounces ?? 0;
    }
    public id: WeaponId | EnemyWeaponId;
    public ammoType: AmmoType;
    /** 基础冷却时间（毫秒） */
    public cooldown: number;
    /** 当前冷却时间（毫秒） */
    public curCD = 0;
    public level = 1;
    public bulletCount = 1;
    public spread?: number;
    public pattern?: WeaponPattern;
    public damageMultiplier = 1.0;
    public fireRateMultiplier = 1.0;
    public pierce = 0;
    public bounces = 0;
    static check(c: any): c is Weapon { return c instanceof Weapon; }
}

/** 子弹组件 - 存储子弹相关信息 */
export class Bullet extends Component {
    /**
     * 构造函数
     * @param cfg 子弹配置
     */
    constructor(cfg: {
        /** 子弹拥有者ID */
        owner: EntityId;
        /** 弹药类型 */
        ammoType: AmmoType;
        /** 子弹伤害（已包含升级倍率） */
        damage?: number;
        /** 穿透次数剩余 */
        pierceLeft?: number;
        /** 弹跳次数剩余 */
        bouncesLeft?: number;
        /** 目标实体ID */
        target?: EntityId;
    }) {
        super();
        this.owner = cfg.owner;
        this.ammoType = cfg.ammoType;
        this.damage = cfg.damage;
        this.pierceLeft = cfg.pierceLeft ?? 0;
        this.bouncesLeft = cfg.bouncesLeft ?? 0;
        this.target = cfg.target;
    }
    public owner: EntityId;
    public ammoType: string;
    public damage?: number;
    public pierceLeft = 0;
    public bouncesLeft = 0;
    public target?: EntityId;
    static check(c: any): c is Bullet { return c instanceof Bullet; }
}

/**
 * Bomb 组件 - 追踪玩家的炸弹库存
 */
export class Bomb extends Component {
    static check = (comp: Component): comp is Bomb => comp instanceof Bomb;

    /** 当前炸弹数量 */
    count: number;

    /** 最大持有数量（固定为9） */
    maxCount: number;

    constructor(cfg: {
        /** 当前炸弹数量 */
        count: number;
        /** 最大持有数量 */
        maxCount: number;
    }) {
        super();
        this.count = Math.min(cfg.count, cfg.maxCount);
        this.maxCount = cfg.maxCount;
    }
}


/** 拾取物品组件 - 定义可拾取物品的属性 */
export class PickupItem extends Component {
    /**
     * 构造函数
     * @param cfg 拾取物品配置
     */
    constructor(cfg: {
        /** 物品类型 */
        kind: 'weapon' | 'buff' | 'coin';
        /** 蓝图名称 */
        blueprint: string;
        /** 是否自动拾取 */
        autoPickup?: boolean;
    }) {
        super();
        this.kind = cfg.kind;
        this.blueprint = cfg.blueprint;
        this.autoPickup = cfg.autoPickup ?? false;
    }
    public kind: 'weapon' | 'buff' | 'coin';
    public blueprint: string;
    public autoPickup = false;
    static check(c: any): c is PickupItem { return c instanceof PickupItem; }
}

/** 增益效果组件 - 存储实体身上的增益效果 */
export class Buff extends Component {
    /**
     * 构造函数
     * @param cfg 增益效果配置
     */
    constructor(cfg: {
        /** 增益类型 */
        type: BuffType;
        /** 效果数值 */
        value: number;
        /** 持续时间, 单位毫秒 */
        remaining: number;
    }) {
        super();
        this.type = cfg.type;
        this.value = cfg.value;
        this.remaining = cfg.remaining;
    }
    public type: BuffType;
    public value: number;
    public remaining: number;
    static check(c: any): c is Buff { return c instanceof Buff; }
    /** 每帧由 BuffSystem 调用 */
    update(dt: number): void {
        this.remaining -= dt;
    }

    isFinished(): boolean {
        return this.remaining <= 0;
    }
}

/** 掉落表组件 - 定义实体被销毁时的掉落物品 */
export class DropTable extends Component {
    /**
     * 构造函数
     * @param cfg 掉落表配置
     */
    constructor(cfg: {
        /** 掉落项数组 */
        table: Array<{ item: string; weight: number; min?: number; max?: number }>;
    }) {
        super();
        this.table = cfg.table;
    }
    public table: Array<{ item: string; weight: number; min?: number; max?: number }>;
    static check(c: any): c is DropTable { return c instanceof DropTable; }
}

/**
 * 持续伤害组件（DOT）
 * 用法：CollisionSystem 命中后挂上，DamageResolutionSystem 每帧扣血
 */
export class DamageOverTime extends Component {
    /**
     * 构造函数
     * @param cfg 持续伤害配置
     */
    constructor(cfg: {
        /** 每秒扣血量 */
        damagePerSecond: number;
        /** 剩余秒数, 单位毫秒 */
        remaining: number;
        /** 扣血间隔（毫秒），默认 0.2 秒一跳 */
        interval?: number;
    }) {
        super();
        this.damagePerSecond = cfg.damagePerSecond;
        this.remaining = cfg.remaining;
        this.interval = cfg.interval ?? 200; // 默认 200 毫秒一跳
        this.timer = 0;             // 内部间隔计时器
    }
    /** 每秒扣血量 */
    public damagePerSecond: number;
    /** 剩余持续时间（毫秒） */
    public remaining: number;
    /** 扣血间隔（毫秒），默认 200 毫秒一跳 */
    public interval = 200;
    private timer = 0;               // 内部间隔计时器

    /** 每帧由 DamageResolutionSystem 调用，返回本帧是否应扣血 */
    tick(dt: number): boolean {
        this.remaining -= dt;
        this.timer += dt;
        if (this.timer >= this.interval) {
            this.timer = 0;
            return true;   // 告诉外部：这次要扣血
        }
        return false;
    }

    /** 倒计时结束？ */
    isFinished(): boolean {
        return this.remaining <= 0;
    }

    static check(c: any): c is DamageOverTime {
        return c instanceof DamageOverTime;
    }
}

/**
 * 无敌状态 (包含视觉效果)
 * 用法：受伤瞬间挂上，DamageResolutionSystem 每帧减时；存在期间**跳过一切伤害逻辑**
 */
export class InvulnerableState extends Component {
    constructor(cfg: {
        /** 无敌状态持续时间（毫秒） */
        duration: number;
        /** 无敌状态视觉效果颜色 */
        flashColor?: string
    }) {
        super();
        this.duration = cfg.duration;
        this.flashColor = cfg.flashColor;
    }
    public duration: number; // 剩余无敌时间（毫秒）
    public flashColor?: string;

    /** 每帧由 DamageResolutionSystem 调用 */
    tick(dt: number) {
        this.duration -= dt;
    }

    /** 倒计时结束？ */
    isFinished(): boolean {
        return this.duration <= 0;
    }

    static check(c: any): c is InvulnerableState { return c instanceof InvulnerableState; }
}

/**
 * TimeSlow 时间减速组件
 * 用法：TIME_SLOW 道具拾取时创建独立实体，TimeSlowSystem 设置全局 timeScale
 */
export class TimeSlow extends Component {
    constructor(cfg: {
        /** 时间缩放比例 (0.5 = 50% 速度) */
        scale: number;
        /** 影响范围 (预留未来扩展区域限制) */
        scope?: 'global' | 'area';
    }) {
        super();
        this.scale = cfg.scale;
        this.scope = cfg.scope ?? 'global';
    }
    public scale: number;
    public scope: 'global' | 'area';

    static check(c: any): c is TimeSlow { return c instanceof TimeSlow; }
}


/**
 * Option 组件 - 僚机实体专用组件
 * 存储僚机的索引和环绕参数
 */
export class Option extends Component {
    static check = (comp: Component): comp is Option => comp instanceof Option;

    /** 僚机索引（0或1） */
    index: number;

    /** 环绕半径（固定60像素） */
    radius: number;

    /** 当前角度（弧度） */
    angle: number;

    /** 旋转速度（弧度/秒，固定2） */
    rotationSpeed: number;

    /** 缓动系数（0-1，越小越平滑） */
    lerpFactor: number;

    constructor(cfg: { index: number }) {
        super();
        this.index = cfg.index;
        this.radius = 60;
        this.angle = cfg.index * Math.PI; // 0 和 π（180度）
        this.rotationSpeed = 2;
        this.lerpFactor = 0.2;
    }
}

/**
 * OptionCount 组件 - 追踪玩家的僚机数量
 * 挂载在玩家实体上
 */
export class OptionCount extends Component {
    static check = (comp: Component): comp is OptionCount => comp instanceof OptionCount;

    /** 当前僚机数量 */
    count: number;

    /** 最大僚机数量（固定2） */
    maxCount: number;

    constructor(cfg: {
        /** 当前僚机数量 */
        count: number;
        /** 最大僚机数量 */
        maxCount: number;
    }) {
        super();
        this.count = Math.min(cfg.count, cfg.maxCount);
        this.maxCount = cfg.maxCount;
    }
}

