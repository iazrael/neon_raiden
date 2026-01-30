import { Component } from '../types';

/** 视觉粒子 - 单个粒子效果 */
export interface VisualParticle {
    /** X轴速度（像素/秒） */
    vx: number;
    /** Y轴速度（像素/秒） */
    vy: number;
    /** 颜色 */
    color: string;
    /** 当前帧 */
    frame: number;
    /** 最大帧数 */
    maxFrame: number;
    /** 帧率 */
    fps: number;
    /** 累积时间（毫秒） */
    accumulatedTime: number;
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
    /** 当前半径 */
    radius: number;
    /** 最大半径 */
    maxRadius: number;
    /** 线宽 */
    width: number;
    /** 颜色 */
    color: string;
    /** 生命周期（0-1） */
    life: number;
}

/** 视觉特效组件 - 容器，保存各种视觉特效数据 */
export class VisualEffect extends Component {
    constructor(cfg?: {
        particles?: VisualParticle[];
        lines?: VisualLine[];
        circles?: VisualCircle[];
    }) {
        super();
        this.particles = cfg?.particles ?? [];
        this.lines = cfg?.lines ?? [];
        this.circles = cfg?.circles ?? [];
    }

    /** 粒子数组 */
    particles: VisualParticle[];
    /** 线条数组（时间减速等） */
    lines: VisualLine[];
    /** 圆环数组（冲击波等） */
    circles: VisualCircle[];

    static check(c: any): c is VisualEffect {
        return c instanceof VisualEffect;
    }
}
