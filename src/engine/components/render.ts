import { Component } from '../types';

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
    }) { 
        super(); 
        this.frame = cfg.frame ?? 0;
        this.maxFrame = cfg.maxFrame ?? 1;
        this.fps = cfg.fps ?? 12;
    }
    public frame = 0;
    public maxFrame = 1;
    public fps = 12;
    static check(c: any): c is Particle { return c instanceof Particle; }
}


/** 精灵组件 - 存储实体的纹理信息 */
export class Sprite extends Component {
  /**
   * 构造函数
   * @param cfg 精灵配置
   */
  constructor(cfg: { 
    texture: string;        // 图集名
    color?: string;         // 颜色
    srcX?: number;          // 切图起始（像素）
    srcY?: number;
    srcW?: number;          // 切图宽高（像素）
    srcH?: number;
    scale?: number;         // 视觉缩放（不影响碰撞）
    pivotX?: number;        // 轴心 0-1
    pivotY?: number;
    rotate90?: number;      // 0/1/2/3 = 0°/90°/180°/270°
  }) { 
    super(); 
    this.texture = cfg.texture;
    this.color = cfg.color ?? '';
    this.srcX = cfg.srcX ?? 0;
    this.srcY = cfg.srcY ?? 0;
    this.srcW = cfg.srcW ?? 1;
    this.srcH = cfg.srcH ?? 1;
    this.scale = cfg.scale ?? 1;
    this.pivotX = cfg.pivotX ?? 0.5;
    this.pivotY = cfg.pivotY ?? 0.5;
    this.rotate90 = cfg.rotate90 ?? 0;
  }
  public texture: string;        // 图集名
  public color = '';
  public srcX = 0;               // 切图起始（像素）
  public srcY = 0;
  public srcW = 1;               // 切图宽高（像素）
  public srcH = 1;
  public scale = 1;              // 视觉缩放（不影响碰撞）
  public pivotX = 0.5;           // 轴心 0-1
  public pivotY = 0.5;
  public rotate90 = 0;           // 0/1/2/3 = 0°/90°/180°/270°
  static check(c: any): c is Sprite { return c instanceof Sprite; }
}



