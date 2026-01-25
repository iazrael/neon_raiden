/**
 * 子弹外观配置（纯视觉，无数值）
 */
export type SpriteSpec = {
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

export type GalleryEntry = {
    id: string;
    name: string;
    chineseName: string;
    description: string;
    rarity: string,                    // ← 稀有度：图鉴边框颜色
    unlock: string,                   // ← 解锁方式：等级解锁
    unlockParam: number,                    // ← 解锁参数：玩家等级 ≥ 5
};

export type WeaponGrowthSpec = {
    /** 基础伤害 */
    baseDamage: number;
    /** 每级增加的伤害 */
    damagePerLevel: number;
    /** 子弹速度 */
    speed: number;
    /** 基准速度（用于DPS计算，默认为15） */
    baseSpeed: number;
    /** 基础射速（毫秒） */
    baseFireRate: number;
    /** 每级射速提升（毫秒减少） */
    ratePerLevel: number;
    /** 穿透伤害衰减比例 (0-1)，部分武器类型专用 */
    attenuation?: number;
};
