import { Component } from '../types';

// 「精灵、帧动画、震屏、闪光、光斑、弹痕」



/** 粒子组件 - 控制粒子系统 */
export class Particle extends Component {
    /**
     * 构造函数
     * @param frame 当前帧
     * @param maxFrame 最大帧数
     */
    constructor(public frame = 0, public maxFrame = 1,  public fps = 12) { super(); }
    static check(c: any): c is Particle { return c instanceof Particle; }
}


/** 精灵组件 - 存储实体的纹理信息 */
export class Sprite extends Component {
  constructor(
    public texture: string,        // 图集名
    public srcX = 0,               // 切图起始（像素）
    public srcY = 0,
    public srcW = 1,               // 切图宽高（像素）
    public srcH = 1,
    public scale = 1,              // 视觉缩放（不影响碰撞）
    public pivotX = 0.5,           // 轴心 0-1
    public pivotY = 0.5,
    public rotate90 = 0            // 0/1/2/3 = 0°/90°/180°/270°
  ) { super(); }
  static check(c: any): c is Sprite { return c instanceof Sprite; }
}



