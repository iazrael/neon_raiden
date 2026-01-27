import { BossId, Component, EnemyId } from '../types';

// 「标签 & 死亡 & 特效」

/** 销毁标记组件 - 标记实体销毁的原因 */
export class DestroyTag extends Component {
    /**
     * 构造函数
     * @param cfg 销毁标记配置
     */
    constructor(cfg: {
        /** 销毁原因 */
        reason?: 'timeout' | 'killed' | 'consumed' | 'offscreen';
        /** 重用池类型 */
        reusePool?: 'bullet' | 'enemy' | 'pickup';
    }) {
        super();
        this.reason = cfg.reason ?? 'killed';
        this.reusePool = cfg.reusePool;
    }
    public reason: 'timeout' | 'killed' | 'consumed' | 'offscreen' = 'killed';
    public reusePool?: 'bullet' | 'enemy' | 'pickup';
    static check(c: any): c is DestroyTag { return c instanceof DestroyTag; }
}


// ========== 标签组件（空对象即可） ==========
/** 玩家标签组件 */
export class PlayerTag extends Component {
    static check(c: any): c is PlayerTag { return c instanceof PlayerTag; }
}

/** 敌人标签组件 */
export class EnemyTag extends Component {
    constructor(cfg: {
        id: EnemyId;
        state?: number;
        timer?: number;
        phaseOffset?: number;
    }) {
        super();
        this.id = cfg.id;
        this.state = cfg.state ?? 0;
        this.timer = cfg.timer ?? 0;
        this.phaseOffset = cfg.phaseOffset ?? 0;
    }
    public id: EnemyId;
    public state: number;
    public timer: number; // 计时器，用于行为模式切换等, 单位毫秒
    public phaseOffset: number; // 移动相位偏移，避免同步摆动

    static check(c: any): c is EnemyTag { return c instanceof EnemyTag; }
}

/** Boss身份组件 - 标识此实体为Boss，并记录具体是哪个Boss */
export class BossTag extends Component {
    constructor(cfg: { id: BossId }) {
        super();
        this.id = cfg.id;
    }
    public id: BossId;

    static check(c: any): c is BossTag { return c instanceof BossTag; }
}


/** 相机震动组件 - 控制相机震动效果 */
export class CameraShake extends Component {
    /**
     * 构造函数
     * @param cfg 震动配置
     */
    constructor(cfg: {
        /** 震动强度 */
        intensity: number;
        /** 震动持续时间 */
        timer: number;
    }) {
        super();
        this.intensity = cfg.intensity;
        this.timer = cfg.timer;
    }
    public intensity: number;
    public timer: number;
    static check(c: any): c is CameraShake { return c instanceof CameraShake; }
}


/** Boss AI组件 - 控制Boss的行为模式 */
export class BossAI extends Component {
    /**
     * 构造函数
     * @param cfg Boss AI配置
     */
    constructor(cfg: {
        /** 当前阶段（0-based索引） */
        phase?: number;
        /** 下次行为模式切换时间 */
        nextPatternTime?: number;
    }) {
        super();
        this.phase = cfg.phase ?? 0; // 修复：初始化为0（0-based索引）
        this.nextPatternTime = cfg.nextPatternTime ?? 0;
    }
    public phase = 0; // 0-based索引
    public nextPatternTime = 0;
    static check(c: any): c is BossAI { return c instanceof BossAI; }
}

/**
 * Boss视觉组件 - 控制Boss的视觉表现
 * 用于阶段切换时的颜色变化等视觉效果
 */
export class BossVisual extends Component {
    /**
     * 构造函数
     * @param cfg 视觉配置
     */
    constructor(cfg: {
        /** 阶段颜色（HEX格式） */
        color: string;
    }) {
        super();
        this.color = cfg.color;
    }
    /** 阶段颜色 */
    public color: string;
    static check(c: any): c is BossVisual { return c instanceof BossVisual; }
}

/**
 * Boss入场状态组件 - 标记Boss正在进入战场
 * 当此组件存在时，Boss会快速向下移动到目标位置，到达后组件被移除
 */
export class BossEntrance extends Component {
    constructor(cfg: {
        /** 目标Y坐标（到达此位置后完成入场） */
        targetY: number;
        /** 入场速度（像素/秒） */
        entranceSpeed: number;
    }) {
        super();
        this.targetY = cfg.targetY;
        this.entranceSpeed = cfg.entranceSpeed;
    }
    /** 目标Y坐标 */
    public targetY: number;
    /** 入场速度（像素/秒） */
    public entranceSpeed: number;
    static check(c: any): c is BossEntrance { return c instanceof BossEntrance; }
}

/** 分数值组件 - 击杀该实体可获得的分数 */
export class ScoreValue extends Component {
    constructor(cfg: { value: number }) {
        super();
        this.value = cfg.value;
    }
    public value: number;
    static check(c: any): c is ScoreValue { return c instanceof ScoreValue; }
}

// src/engine/components/meta.ts

/** 瞬移状态组件 - 挂载此组件表示实体正在瞬移（隐形/无敌/不可控） */
export class TeleportState extends Component {
    constructor(cfg: {
        timer: number;       // 瞬移持续时间（隐形时间）
        targetX: number;     // 目标 X
        targetY: number;     // 目标 Y
    }) {
        super();
        this.timer = cfg.timer;
        this.targetX = cfg.targetX;
        this.targetY = cfg.targetY;
    }
    public timer: number;
    public targetX: number;
    public targetY: number;

    static check(c: any): c is TeleportState { return c instanceof TeleportState; }
}