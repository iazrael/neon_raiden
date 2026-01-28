import { Component } from '../types';

/**
 * Option 组件 - 僚机实体专用组件
 * 存储僚机的索引和环绕参数
 */
export class Option extends Component {
    static check = (comp: Component): comp is Option => comp instanceof Option;

    /** 僚机索引（0或1） */
    index: number;

    /** 环绕半径（固定60像素） */
    radius: number;

    /** 当前角度（弧度） */
    angle: number;

    /** 旋转速度（弧度/秒，固定2） */
    rotationSpeed: number;

    /** 缓动系数（0-1，越小越平滑） */
    lerpFactor: number;

    constructor(index: number) {
        super();
        this.index = index;
        this.radius = 60;
        this.angle = index * Math.PI; // 0 和 π（180度）
        this.rotationSpeed = 2;
        this.lerpFactor = 0.2;
    }
}
