import { Component } from '../types';

/**
 * OptionCount 组件 - 追踪玩家的僚机数量
 * 挂载在玩家实体上
 */
export class OptionCount extends Component {
    static check = (comp: Component): comp is OptionCount => comp instanceof OptionCount;

    /** 当前僚机数量 */
    count: number;

    /** 最大僚机数量（固定2） */
    maxCount: number;

    constructor(count: number = 0, maxCount: number = 2) {
        super();
        this.count = Math.min(count, maxCount);
        this.maxCount = maxCount;
    }
}
