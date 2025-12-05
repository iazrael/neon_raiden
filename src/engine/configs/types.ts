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
