import * as Components from '../components';
import { AmmoType, EnemyWeaponId, WeaponId } from '../types';

// ========== Blueprint 类型 ==========
export type Blueprint = Partial<{
    [K in keyof typeof Components]: ComponentShape<typeof Components[K]>;
}>;

/** 把组件类映射成它自己的对象形状 */
type ComponentShape<T> = T extends new (arg: infer P) => any
    ? P extends any[]              // 是元组？
    ? never                      // 禁止元组，强制用对象
    : P                          // 返回对象本身
    : never;


// ============== 武器 =================  
export type WeaponSpec = {
    id: WeaponId;
    /** 弹药类型 */
    ammoType: AmmoType;
    /** 冷却时间 */
    cooldown: number;
    /** 当前冷却时间 */
    curCD?: number;
    /** 最大等级 */
    maxLevel: number,
}

export type EnemyWeaponSpec = {
    id: EnemyWeaponId;
    /** 弹药类型 */
    ammoType: AmmoType;
    /** 冷却时间 */
    cooldown: number;
    bulletCount: number; // 子弹数量
    spread?: number; // 扩散角度
    pattern: 'radial' | 'spread' | 'aimed' | 'random' | 'spiral' | 'fixed_rear'; // 弹幕模式
}

// =========== 子弹 =================
export interface AmmoSpec {
    id: string;               // 弹种唯一键（与 WeaponSpec.ammoType 对应）
    damage: number;           // 每发子弹的基础伤害值
    radius: number;           // 碰撞盒半径（像素）
    speed: number;            // 子弹飞行速度（像素/秒）
    pierce: number;           // 可穿透敌人数（0 = 不穿透）
    bounces: number;          // 可反弹次数（0 = 不反弹）
    onHit: string[];          // 命中时触发的效果 ID 列表（字符串引用）
}

// =========== 效果 =================
export interface EffectSpec {
    id: string;     // 效果唯一键
    type: string; // 效果类型
    value: number; // 效果值
    radius: number; // 效果半径
    duration: number; // 效果持续时间
}

