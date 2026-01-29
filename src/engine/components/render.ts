import { Component } from '../types';
import { SpriteKey, SpriteEntry } from '../configs/sprites';
import { SpriteManager } from '../SpriteManager';

// 「精灵、帧动画、震屏、闪光、光斑、弹痕」


/** 粒子组件 - 控制粒子系统 */
export class Particle extends Component {
    /**
     * 构造函数
     * @param cfg 粒子配置
     */
    constructor(cfg: {
        /** 当前帧 */
        frame?: number;
        /** 最大帧数 */
        maxFrame?: number;
        /** 帧率 */
        fps?: number;
        /** 粒子颜色 */
        color?: string;
        /** 粒子缩放 */
        scale?: number;
        /** 粒子生命周期（毫秒）- 用于物理粒子（爆炸火花等） */
        maxLife?: number;
    }) {
        super();
        this.frame = cfg.frame ?? 0;
        this.maxFrame = cfg.maxFrame ?? 1;
        this.fps = cfg.fps ?? 12;
        this.color = cfg.color ?? '#ffffff';
        this.scale = cfg.scale ?? 1;
        this.maxLife = cfg.maxLife ?? 0;
    }
    public frame = 0;
    public maxFrame = 1;
    public fps = 12;
    public color = '#ffffff';
    public scale = 1;
    /** 粒子生命周期（毫秒）- 用于物理粒子，优先级高于 maxFrame 计算透明度 */
    public maxLife = 0;
    static check(c: any): c is Particle { return c instanceof Particle; }
}


/** 冲击波组件 - 控制冲击波动画 */
export class Shockwave extends Component {
    /**
     * 构造函数
     * @param cfg 冲击波配置
     */
    constructor(cfg: {
        maxRadius?: number;
        color?: string;
        width?: number;
    }) {
        super();
        this.radius = 10;
        this.maxRadius = cfg.maxRadius ?? 150;
        this.color = cfg.color ?? '#ffffff';
        this.width = cfg.width ?? 5;
        this.life = 1.0;
    }

    /** 当前半径 */
    public radius: number;
    /** 最大半径 */
    public maxRadius: number;
    /** 颜色 */
    public color: string;
    /** 线宽 */
    public width: number;
    /** 生命周期 (0-1) */
    public life: number;

    static check(c: any): c is Shockwave { return c instanceof Shockwave; }
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
        /** 受伤闪烁截止时间 */
        hitFlashUntil?: number;

        // === 以下为兼容性字段，已废弃 ===
        /** @deprecated 使用 spriteKey 替代 */
        texture?: string;
        /** @deprecated 从 registry 自动获取 */
        srcX?: number;
        /** @deprecated 从 registry 自动获取 */
        srcY?: number;
        /** @deprecated 从 registry 自动获取 */
        srcW?: number;
        /** @deprecated 从 registry 自动获取 */
        srcH?: number;
        /** @deprecated 从 registry 自动获取 */
        pivotX?: number;
        /** @deprecated 从 registry 自动获取 */
        pivotY?: number;
    }) {
        super();
        this.spriteKey = cfg.spriteKey;
        this.color = cfg.color ?? '';
        this.scale = cfg.scale ?? 1;
        this.rotate90 = cfg.rotate90 ?? 0;
        this.hitFlashUntil = cfg.hitFlashUntil;

        // 兼容性字段
        this.texture = cfg.texture ?? '';
        this.srcX = cfg.srcX ?? 0;
        this.srcY = cfg.srcY ?? 0;
        this.srcW = cfg.srcW ?? 1;
        this.srcH = cfg.srcH ?? 1;
        this.pivotX = cfg.pivotX ?? 0.5;
        this.pivotY = cfg.pivotY ?? 0.5;
    }

    /** Sprite 唯一标识符 */
    public spriteKey: SpriteKey;

    /** 颜色（可选覆盖） */
    public color = '';

    /** 视觉缩放（不影响碰撞） */
    public scale = 1;

    /** 旋转角度（度） */
    public rotate90 = 0;

    /** 受伤闪烁截止时间 */
    public hitFlashUntil?: number;

    // === 以下为兼容性字段，已废弃 ===
    /** @deprecated 使用 spriteKey 替代 */
    public texture: string;
    /** @deprecated 使用 width getter 替代 */
    public srcX = 0;
    /** @deprecated 使用 height getter 替代 */
    public srcY = 0;
    /** @deprecated 使用 width getter 替代 */
    public srcW = 1;
    /** @deprecated 使用 height getter 替代 */
    public srcH = 1;
    /** @deprecated 从 registry 自动获取 */
    public pivotX = 0.5;
    /** @deprecated 从 registry 自动获取 */
    public pivotY = 0.5;

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

    /**
     * 触发受伤闪烁效果
     */
    flash(durationMs: number = 100): void {
        this.hitFlashUntil = Date.now() + durationMs;
    }

    /**
     * 检查是否正在闪烁
     */
    get isFlashing(): boolean {
        return this.hitFlashUntil !== undefined && Date.now() < this.hitFlashUntil;
    }

    static check(c: any): c is Sprite { return c instanceof Sprite; }
}
