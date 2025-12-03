// ========== 基础类型 ==========
export type EntityId = number;
export type ComponentType = new (...args: any[]) => Component;

// ========== 空基类（可选，方便 instanceof） ==========
export abstract class Component { }

// ========== 核心组件 ==========
export class Transform extends Component {
    constructor(public x = 0, public y = 0, public rot = 0) { super(); }
    static check(c: any): c is Transform { return c instanceof Transform; }
}
export class Velocity extends Component {
    constructor(public vx = 0, public vy = 0, public vrot = 0) { super(); }
    static check(c: any): c is Velocity { return c instanceof Velocity; }
}
export class SpeedStat extends Component {
    constructor(public maxLinear = 400, public maxAngular = 5) { super(); }
    static check(c: any): c is SpeedStat { return c instanceof SpeedStat; }
}
export class Health extends Component {
    constructor(public hp: number, public max: number) { super(); }
    static check(c: any): c is Health { return c instanceof Health; }
}
export class Shield extends Component {
    constructor(public value = 0, public regen = 0) { super(); }
    static check(c: any): c is Shield { return c instanceof Shield; }
}
export class Weapon extends Component {
    constructor(
        public ammoType: string,
        public cooldown: number,
        public curCD = 0
    ) { super(); }
    static check(c: any): c is Weapon { return c instanceof Weapon; }
}
export class Bullet extends Component {
    constructor(
        public owner: EntityId,
        public ammoType: string,
        public pierceLeft = 0,
        public bouncesLeft = 0
    ) { super(); }
    static check(c: any): c is Bullet { return c instanceof Bullet; }
}
export class HitBox extends Component {
    shape: 'circle' | 'rect' | 'capsule' = 'circle';
    radius?: number;
    halfWidth?: number;
    halfHeight?: number;
    capRadius?: number;
    capHeight?: number;
    constructor(cfg: Partial<HitBox> = {}) {
        super();
        Object.assign(this, cfg);
    }
    static check(c: any): c is HitBox { return c instanceof HitBox; }
}
export class Lifetime extends Component {
    constructor(public timer: number) { super(); }
    static check(c: any): c is Lifetime { return c instanceof Lifetime; }
}
export class DropTable extends Component {
    constructor(public table: Array<{ item: string; weight: number; min?: number; max?: number }>) {
        super();
    }
    static check(c: any): c is DropTable { return c instanceof DropTable; }
}
export class PickupItem extends Component {
    constructor(
        public kind: 'weapon' | 'buff' | 'coin',
        public blueprint: string,
        public autoPickup = false
    ) { super(); }
    static check(c: any): c is PickupItem { return c instanceof PickupItem; }
}
export class Buff extends Component {
    constructor(
        public type: 'speed' | 'damage' | 'invincible',
        public value: number,
        public timer: number
    ) { super(); }
    static check(c: any): c is Buff { return c instanceof Buff; }
}
export class DestroyTag extends Component {
    constructor(
        public reason: 'timeout' | 'killed' | 'consumed' | 'offscreen' = 'killed',
        public reusePool?: 'bullet' | 'enemy' | 'pickup'
    ) { super(); }
    static check(c: any): c is DestroyTag { return c instanceof DestroyTag; }
}
export class CameraShake extends Component {
    constructor(public intensity: number, public timer: number) { super(); }
    static check(c: any): c is CameraShake { return c instanceof CameraShake; }
}
export class Particle extends Component {
    constructor(public frame = 0, public maxFrame = 1) { super(); }
    static check(c: any): c is Particle { return c instanceof Particle; }
}
export class Knockback extends Component {
    constructor(public vx: number, public vy: number) { super(); }
    static check(c: any): c is Knockback { return c instanceof Knockback; }
}
export class BossAI extends Component {
    constructor(public phase = 1, public nextPatternTime = 0) { super(); }
    static check(c: any): c is BossAI { return c instanceof BossAI; }
}

// ========== 标签组件（空对象即可） ==========
export class PlayerTag extends Component { }
export class EnemyTag extends Component { }
export class BossTag extends Component { }

// ========== 意图组件（只存活一帧） ==========
export class MoveIntent extends Component {
    constructor(public dx = 0, public dy = 0) { super(); }
}
export class FireIntent extends Component { }


// ========== Blueprint 类型 ==========
export type Blueprint = Record<string, Component>;