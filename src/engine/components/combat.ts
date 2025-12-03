import { Component, EntityId } from '../types';

// 「攻击 & 防御 & 增益」

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


/**
 * 持续伤害组件（DOT）
 * 用法：CollisionSystem 命中后挂上，DamageResolutionSystem 每帧扣血
 */
export class DamageOverTime extends Component {
  constructor(
    public damagePerSecond: number,  // 每秒扣血量
    public remaining: number,        // 剩余秒数
    public interval = 0.2,           // 扣血间隔（秒），默认 0.2 秒一跳
    private timer = 0                // 内部间隔计时器
  ) {
    super();
  }

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
  constructor(
    public remaining: number   // 剩余无敌时间（秒）
  ) {
    super();
  }

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