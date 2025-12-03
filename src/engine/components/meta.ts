import { Component } from '../types';

// 「标签 & 死亡 & 特效」

/** 销毁标记组件 - 标记实体销毁的原因 */
export class DestroyTag extends Component {
    /**
     * 构造函数
     * @param reason 销毁原因
     * @param reusePool 重用池类型
     */
    constructor(
        public reason: 'timeout' | 'killed' | 'consumed' | 'offscreen' = 'killed',
        public reusePool?: 'bullet' | 'enemy' | 'pickup'
    ) { super(); }
    static check(c: any): c is DestroyTag { return c instanceof DestroyTag; }
}


// ========== 标签组件（空对象即可） ==========
/** 玩家标签组件 */
export class PlayerTag extends Component { }

/** 敌人标签组件 */
export class EnemyTag extends Component { }

/** Boss标签组件 */
export class BossTag extends Component { }



/** 相机震动组件 - 控制相机震动效果 */
export class CameraShake extends Component {
    /**
     * 构造函数
     * @param intensity 震动强度
     * @param timer 震动持续时间
     */
    constructor(public intensity: number, public timer: number) { super(); }
    static check(c: any): c is CameraShake { return c instanceof CameraShake; }
}


/** Boss AI组件 - 控制Boss的行为模式 */
export class BossAI extends Component {
    /**
     * 构造函数
     * @param phase 当前阶段
     * @param nextPatternTime 下次行为模式切换时间
     */
    constructor(public phase = 1, public nextPatternTime = 0) { super(); }
    static check(c: any): c is BossAI { return c instanceof BossAI; }
}
