import { Component } from '../types';

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

/** 视觉特效组件 - 容器，保存各种视觉特效数据 */
export class VisualEffect extends Component {
    constructor(cfg?: {
        particles?: VisualParticle[];
        lines?: VisualLine[];
        circles?: VisualCircle[];
        meteors?: VisualMeteor[];
    }) {
        super();
        this.particles = cfg?.particles ?? [];
        this.lines = cfg?.lines ?? [];
        this.circles = cfg?.circles ?? [];
        this.meteors = cfg?.meteors ?? [];
    }

    /** 粒子数组 */
    particles: VisualParticle[];
    /** 线条数组（时间减速等） */
    lines: VisualLine[];
    /** 圆环数组（冲击波等） */
    circles: VisualCircle[];
    /** 流星数组（背景流星效果） */
    meteors: VisualMeteor[];

    static check(c: any): c is VisualEffect {
        return c instanceof VisualEffect;
    }
}
