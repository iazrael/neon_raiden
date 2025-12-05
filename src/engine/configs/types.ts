import { WeaponId } from "../types";



export type SpriteSpec = {
    texture: string; // 纹理地址
    color: string; // 主色调
    size: { width: number; height: number }; // 视觉尺寸
}

export type GalleryEntry = {
    weaponId: WeaponId;
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
