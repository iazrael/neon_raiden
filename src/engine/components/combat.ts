import { AmmoType, BuffType, Component, EntityId, WeaponId } from '@/engine/types';

// 「攻击 & 防御 & 增益」

/** 护盾组件 - 存储实体的护盾信息 */
export class Shield extends Component {
  /**
   * 构造函数
   * @param cfg 护盾配置
   */
  constructor(cfg: {
    /** 当前护盾值 */
    value?: number;
    /** 护盾恢复速度 */
    regen?: number;
  }) {
    super();
    this.value = cfg.value ?? 0;
    this.regen = cfg.regen ?? 0;
  }
  public value = 0;
  public regen = 0;
  static check(c: any): c is Shield { return c instanceof Shield; }
}

/** 武器组件 - 存储实体的武器信息 */
export class Weapon extends Component {
  /**
   * 构造函数
   * @param cfg 武器配置
   */
  constructor(cfg: {
    id: WeaponId
    /** 弹药类型 */
    ammoType: AmmoType;
    /** 冷却时间 */
    cooldown: number;
    /** 当前冷却时间 */
    curCD?: number;
    /** 武器等级 */
    level?: number;
  }) {
    super();
    this.ammoType = cfg.ammoType;
    this.cooldown = cfg.cooldown;
    this.curCD = cfg.curCD ?? 0;
    this.level = cfg.level ?? 1;
  }
  public id: WeaponId;
  public ammoType: AmmoType;
  public cooldown: number;
  public curCD = 0;
  public level = 1;
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
    this.pierceLeft = cfg.pierceLeft ?? 0;
    this.bouncesLeft = cfg.bouncesLeft ?? 0;
    this.target = cfg.target;
  }
  public owner: EntityId;
  public ammoType: string;
  public pierceLeft = 0;
  public bouncesLeft = 0;
  public target?: EntityId;
  static check(c: any): c is Bullet { return c instanceof Bullet; }
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
    /** 持续时间 */
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
    /** 剩余秒数 */
    remaining: number;
    /** 扣血间隔（秒），默认 0.2 秒一跳 */
    interval?: number;
  }) {
    super();
    this.damagePerSecond = cfg.damagePerSecond;
    this.remaining = cfg.remaining;
    this.interval = cfg.interval ?? 0.2;
    this.timer = 0;             // 内部间隔计时器
  }
  public damagePerSecond: number;  // 每秒扣血量
  public remaining: number;        // 剩余秒数
  public interval = 0.2;           // 扣血间隔（秒），默认 0.2 秒一跳
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
 * 无敌帧计时器
 * 用法：受伤瞬间挂上，DamageResolutionSystem 每帧减时；存在期间**跳过一切伤害逻辑**
 */
export class InvincibleTimer extends Component {
  /**
   * 构造函数
   * @param cfg 无敌帧配置
   */
  constructor(cfg: {
    /** 剩余无敌时间（秒） */
    remaining: number;
  }) {  // 剩余无敌时间（秒）
    super();
    this.remaining = cfg.remaining;
  }
  public remaining: number;   // 剩余无敌时间（秒）

  /** 每帧由 DamageResolutionSystem 调用 */
  tick(dt: number): void {
    this.remaining -= dt;
  }

  /** 是否还在无敌期内？ */
  isActive(): boolean {
    return this.remaining > 0;
  }

  static check(c: any): c is InvincibleTimer {
    return c instanceof InvincibleTimer;
  }
}