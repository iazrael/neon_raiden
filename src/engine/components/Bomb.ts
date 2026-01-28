import { Component } from '../types';

/**
 * Bomb 组件 - 追踪玩家的炸弹库存
 */
export class Bomb extends Component {
    static check = (comp: Component): comp is Bomb => comp instanceof Bomb;

    /** 当前炸弹数量 */
    count: number;

    /** 最大持有数量（固定为9） */
    maxCount: number;

    constructor(cfg: {
        /** 当前炸弹数量 */
        count: number;
        /** 最大持有数量 */
        maxCount: number;
    }) {
        super();
        this.count = Math.min(cfg.count, cfg.maxCount);
        this.maxCount = cfg.maxCount;
    }
}
