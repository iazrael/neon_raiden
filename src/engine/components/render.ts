import { Component } from "../types";
import { SpriteKey, SpriteEntry } from "../configs/sprites";
import { SpriteManager } from "../SpriteManager";

// 「精灵、帧动画、震屏、闪光、光斑、弹痕」

/**
 * 闪烁模式枚举
 */
export enum BlinkMode {
    /** 硬切换：完全可见/完全不可见交替 */
    HARD = "hard",
    /** 软渐变：透明度在两个值之间平滑过渡 */
    SOFT = "soft",
}

/**
 * 闪烁颜色配置
 */
export interface BlinkColors {
    /** 闪烁时显示的颜色 */
    visible: string;
    /** 隐藏时的颜色 */
    hidden: string;
}

/** 视觉粒子 - 单个粒子效果（爆炸火花等） */
export interface VisualParticle {
    /** X坐标 */
    x: number;
    /** Y坐标 */
    y: number;
    /** X轴速度（像素/秒） */
    vx: number;
    /** Y轴速度（像素/秒） */
    vy: number;
    /** 剩余生命周期（毫秒） */
    life: number;
    /** 总生命周期（毫秒） */
    maxLife: number;
    /** 颜色 */
    color: string;
    /** 粒子大小 */
    size: number;
}

/** 视觉线条 - 时间减速效果 */
export interface VisualLine {
    /** X坐标 */
    x: number;
    /** Y坐标 */
    y: number;
    /** 长度 */
    length: number;
    /** 速度（像素/秒） */
    speed: number;
    /** 透明度（0-1） */
    alpha: number;
}

/** 视觉圆环 - 冲击波效果 */
export interface VisualCircle {
    /** X坐标（圆心） */
    x: number;
    /** Y坐标（圆心） */
    y: number;
    /** 当前半径 */
    radius: number;
    /** 最大半径 */
    maxRadius: number;
    /** 生命周期（0-1） */
    life: number;
    /** 颜色 */
    color: string;
    /** 线宽 */
    width: number;
}

/** 视觉流星 - 背景流星效果 */
export interface VisualMeteor {
    /** X坐标 */
    x: number;
    /** Y坐标 */
    y: number;
    /** 拖尾长度 */
    length: number;
    /** X轴速度（像素/秒） */
    vx: number;
    /** Y轴速度（像素/秒） */
    vy: number;
}

/** 粒子组件 - 控制粒子系统 */
export class Particle extends Component {
    /**
     * 构造函数
     * @param cfg 粒子配置
     */
    constructor(cfg: {
        /** 产生效果的原始位置 */
        position: { x: number; y: number };
        /** 初始粒子数组 */
        particles?: VisualParticle[];
    }) {
        super();
        this.position = cfg.position;
        this.particles = cfg.particles ?? [];
    }
    /** 产生效果的原始位置 */
    public position: { x: number; y: number };
    /** 初始粒子数组 */
    public particles: VisualParticle[];

    static check(c: any): c is Particle {
        return c instanceof Particle;
    }
}

/** 冲击波组件 - 控制冲击波动画 */
export class Shockwave extends Component {
    /**
     * 构造函数
     * @param cfg 冲击波配置
     */
    constructor(cfg: {
        /** 产生效果的原始位置 */
        position: { x: number; y: number };
        /** 初始圆环数组 */
        circles?: VisualCircle[];
    }) {
        super();
        this.position = cfg.position;
        this.circles = cfg.circles ?? [];
    }

    /** 产生效果的原始位置 */
    public position: { x: number; y: number };
    /** 初始圆环数组 */
    public circles: VisualCircle[];

    static check(c: any): c is Shockwave {
        return c instanceof Shockwave;
    }
}

/** 子弹时间的视觉效果组件 - 渲染子弹时间时表示光线的垂直线条 */
export class BulletTimeLine extends Component {
    /**
     * 构造函数
     * @param cfg 垂直线条配置
     */
    constructor(cfg: {
        /** 最大线条数量 */
        maxLines: number;
        /** 初始线条数组 */
        lines?: VisualLine[];
    }) {
        super();
        this.maxLines = cfg.maxLines;
        this.lines = cfg.lines ?? [];
    }
    /** 最大线条数量 */
    public maxLines: number;
    /** 初始线条数组 */
    public lines: VisualLine[];

    static check(c: any): c is BulletTimeLine {
        return c instanceof BulletTimeLine;
    }
}

/**
 * 边框配置接口
 */
export interface SpriteBorder {
    /** 边框颜色（如 '#ff0000', 'cyan'） */
    color: string;
    /** 边框宽度（像素），默认 3 */
    width?: number;
    /** 圆角半径（像素），默认 5 */
    radius?: number;
    /** 发光强度（0=不发光），默认 10 */
    glow?: number;
    /** 边框尺寸（可选，不指定则使用精灵原始尺寸） */
    size?: number;
}

/** 精灵组件 - 存储实体的纹理信息 */
export class Sprite extends Component {
    /**
     * 构造函数
     * @param cfg 精灵配置
     */
    constructor(cfg: {
        /** Sprite 唯一标识符 */
        spriteKey: SpriteKey;
        /** 颜色（可选覆盖） */
        color?: string;
        /** 视觉缩放（不影响碰撞） */
        scale?: number;
        /** 旋转角度（度） */
        rotate90?: number;
        /** 边框配置（可选） */
        border?: SpriteBorder;
    }) {
        super();
        this.spriteKey = cfg.spriteKey;
        this.color = cfg.color ?? "";
        this.scale = cfg.scale ?? 1;
        this.rotate90 = cfg.rotate90 ?? 0;
        this.border = cfg.border;
    }

    /** Sprite 唯一标识符 */
    public spriteKey: SpriteKey;

    /** 颜色（可选覆盖） */
    public color = "";

    /** 视觉缩放（不影响碰撞） */
    public scale = 1;

    /** 旋转角度（度） */
    public rotate90 = 0;

    /** 边框配置（可选） */
    public border?: SpriteBorder;

    /**
     * 获取 sprite 配置
     */
    get config(): SpriteEntry {
        return SpriteManager.getConfig(this.spriteKey);
    }

    /**
     * 获取原始宽度（像素）
     */
    get width(): number {
        return this.config.width;
    }

    /**
     * 获取原始高度（像素）
     */
    get height(): number {
        return this.config.height;
    }

    /**
     * 获取缓存中的图片
     */
    get image(): HTMLImageElement | undefined {
        return SpriteManager.getImage(this.spriteKey);
    }

    static check(c: any): c is Sprite {
        return c instanceof Sprite;
    }
}

/**
 * 闪烁组件 - 控制实体的明暗闪烁效果
 *
 * 纯数据组件，逻辑由 BlinkSystem 处理
 *
 * @example
 * // 受伤闪烁
 * addComponent(world, playerId, new Blink({
 *     durationMs: 500,
 *     intervalMs: 100,
 *     colors: { visible: '#ffffff', hidden: 'transparent' },
 *     mode: BlinkMode.HARD
 * }));
 */
export class Blink extends Component {
    /**
     * 构造函数
     * @param cfg 闪烁配置
     */
    constructor(cfg: {
        /** 闪烁持续时间（毫秒） */
        durationMs: number;
        /** 闪烁间隔（毫秒）- 每次完整可见+隐藏的周期 */
        intervalMs: number;
        /** 颜色配置 */
        colors?: BlinkColors;
        /** 闪烁模式 */
        mode?: BlinkMode;
    }) {
        super();
        this.durationMs = cfg.durationMs;
        this.intervalMs = cfg.intervalMs;
        this.colors = cfg.colors ?? { visible: "#ffffff", hidden: "transparent" };
        this.mode = cfg.mode ?? BlinkMode.HARD;
        this.elapsedMs = 0;
    }

    /** 闪烁持续时间（毫秒） */
    public durationMs: number;

    /** 闪烁间隔（毫秒） */
    public intervalMs: number;

    /** 颜色配置 */
    public colors: BlinkColors;

    /** 闪烁模式 */
    public mode: BlinkMode;

    /** 已经过的时间（毫秒）- 由 BlinkSystem 更新 */
    public elapsedMs: number;

    static check(c: any): c is Blink {
        return c instanceof Blink;
    }
}

/** 流星组件 - 存储流星的视觉信息 */
export class Meteor extends Component {
    /**
     * 构造函数
     * @param cfg 流星配置
     */
    constructor(cfg: { meteors: VisualMeteor[] }) {
        super();
    }

    /** 流星数组 */
    public meteors: VisualMeteor[];

    static check(c: any): c is Meteor {
        return c instanceof Meteor;
    }
}
