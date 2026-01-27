import * as Components from '../components';
import { AmmoType, EnemyWeaponId, WeaponId, WeaponPattern } from '../types';

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


// ============== 子弹外观配置（纯视觉，无数值）=================
export interface SpriteSpec {
    /** 纹理路径 */
    texture: string;
    /** 着色颜色（hex + alpha，如 '#ffffffff'） */
    color: string;
    /** 源矩形宽度（单帧纹理，srcX/srcY 固定为 0） */
    srcW: number;
    /** 源矩形高度 */
    srcH: number;
    /** 旋转轴心 X（0-1，默认 0.5） */
    pivotX: number;
    /** 旋转轴心 Y（0-1，默认 0.5） */
    pivotY: number;
}

// ============== 子弹数值配置（纯数值，无外观）=================
export interface AmmoSpec {
    /** 弹种唯一键 */
    id: AmmoType;
    /** 基础伤害 */
    damage: number;
    /** 碰撞盒半径（像素） */
    radius: number;
    /** 飞行速度（像素/秒） */
    speed: number;
    /** 基础穿透次数 */
    pierce: number;
    /** 基础反弹次数 */
    bounces: number;
    /** 命中时触发的效果 ID 列表 */
    onHit: string[];
}

// ============== 武器配置（统一 - 玩家 + 敌人）=================
export interface WeaponSpec {
    /** 武器 ID（玩家或敌人） */
    id: WeaponId | EnemyWeaponId;
    /** 使用的弹药类型 */
    ammoType: AmmoType;
    /** 基础冷却时间（毫秒） */
    cooldown: number;
    /** 当前冷却时间（运行时） */
    curCD?: number;
    /** 最大等级（仅玩家武器使用） */
    maxLevel?: number;
    /** 弹幕模式 */
    pattern: WeaponPattern;
    /** 每次发射的子弹数量 */
    bulletCount: number;
    /** 扩散角度（度），默认 0 */
    spread?: number;
    /** 穿透次数加成（在弹药基础值上增加），仅玩家武器使用 */
    pierceBonus?: number;
    /** 反弹次数加成（在弹药基础值上增加），仅玩家武器使用 */
    bouncesBonus?: number;
}

// ============== 武器升级配置 =================
export interface WeaponUpgradeSpec {
    id: WeaponId;
    /** 每个等级的加成配置 */
    levels: WeaponLevelSpec[];
}

export interface WeaponLevelSpec {
    /** 等级（从 1 开始） */
    level: number;
    /** 伤害倍率（如 1.0, 1.3, 1.6...） */
    damageMultiplier: number;
    /** 射速倍率（如 1.0, 1.2, 1.5...） */
    fireRateMultiplier: number;
}

// ============== 效果配置 =================
export interface EffectSpec {
    id: string;
    type: string;
    value: number;
    radius: number;
    duration: number;
}
