import { AmmoType, WeaponId } from "../../types";
import { Blueprint } from "../base";
import { BULLET_SPRITE_CONFIG } from "../../configs/sprites/bullets";

/**
 * 离子机炮道具蓝图
 * 获得离子机炮武器
 */
export const BLUEPRINT_POWERUP_VULCAN: Blueprint = {
    /** 变换组件 - 设置道具的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 精灵组件 - 使用 BULLET_SPRITE_CONFIG 获取 SpriteKey 和颜色 */
    Sprite: {
        spriteKey: BULLET_SPRITE_CONFIG[AmmoType.VULCAN_SPREAD].spriteKey,
        color: BULLET_SPRITE_CONFIG[AmmoType.VULCAN_SPREAD].color,
        scale: 1
    },

    /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
    PickupItem: { kind: 'weapon', blueprint: WeaponId.VULCAN, autoPickup: true },

    /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
    HitBox: { shape: 'rect', halfWidth: 12, halfHeight: 12 },
};

/**
 * 量子激光阵道具蓝图
 * 获得量子激光阵武器
 */
export const BLUEPRINT_POWERUP_LASER: Blueprint = {
    /** 变换组件 - 设置道具的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 精灵组件 - 使用 BULLET_SPRITE_CONFIG 获取 SpriteKey 和颜色 */
    Sprite: {
        spriteKey: BULLET_SPRITE_CONFIG[AmmoType.LASER_BEAM].spriteKey,
        color: BULLET_SPRITE_CONFIG[AmmoType.LASER_BEAM].color,
        scale: 1
    },

    /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
    PickupItem: { kind: 'weapon', blueprint: WeaponId.LASER, autoPickup: true },

    /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
    HitBox: { shape: 'rect', halfWidth: 12, halfHeight: 12 },
};

/**
 * 智能追踪系统道具蓝图
 * 获得智能追踪系统武器
 */
export const BLUEPRINT_POWERUP_MISSILE: Blueprint = {
    /** 变换组件 - 设置道具的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 精灵组件 - 使用 BULLET_SPRITE_CONFIG 获取 SpriteKey 和颜色 */
    Sprite: {
        spriteKey: BULLET_SPRITE_CONFIG[AmmoType.MISSILE_HOMING].spriteKey,
        color: BULLET_SPRITE_CONFIG[AmmoType.MISSILE_HOMING].color,
        scale: 1
    },

    /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
    PickupItem: { kind: 'weapon', blueprint: WeaponId.MISSILE, autoPickup: true },

    /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
    HitBox: { shape: 'rect', halfWidth: 12, halfHeight: 12 },
};

/**
 * 量子飞镖道具蓝图
 * 获得量子飞镖武器
 */
export const BLUEPRINT_POWERUP_SHURIKEN: Blueprint = {
    /** 变换组件 - 设置道具的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 精灵组件 - 使用 BULLET_SPRITE_CONFIG 获取 SpriteKey 和颜色 */
    Sprite: {
        spriteKey: BULLET_SPRITE_CONFIG[AmmoType.SHURIKEN_BOUNCE].spriteKey,
        color: BULLET_SPRITE_CONFIG[AmmoType.SHURIKEN_BOUNCE].color,
        scale: 1
    },

    /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
    PickupItem: { kind: 'weapon', blueprint: WeaponId.SHURIKEN, autoPickup: true },

    /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
    HitBox: { shape: 'rect', halfWidth: 12, halfHeight: 12 },
};

/**
 * 特斯拉线圈道具蓝图
 * 获得特斯拉线圈武器
 */
export const BLUEPRINT_POWERUP_TESLA: Blueprint = {
    /** 变换组件 - 设置道具的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 精灵组件 - 使用 BULLET_SPRITE_CONFIG 获取 SpriteKey 和颜色 */
    Sprite: {
        spriteKey: BULLET_SPRITE_CONFIG[AmmoType.TESLA_CHAIN].spriteKey,
        color: BULLET_SPRITE_CONFIG[AmmoType.TESLA_CHAIN].color,
        scale: 1
    },

    /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
    PickupItem: { kind: 'weapon', blueprint: WeaponId.TESLA, autoPickup: true },

    /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
    HitBox: { shape: 'rect', halfWidth: 12, halfHeight: 12 },
};

/**
 * 恒星熔岩炮道具蓝图
 * 获得恒星熔岩炮武器
 */
export const BLUEPRINT_POWERUP_MAGMA: Blueprint = {
    /** 变换组件 - 设置道具的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 精灵组件 - 使用 BULLET_SPRITE_CONFIG 获取 SpriteKey 和颜色 */
    Sprite: {
        spriteKey: BULLET_SPRITE_CONFIG[AmmoType.MAGMA_POOL].spriteKey,
        color: BULLET_SPRITE_CONFIG[AmmoType.MAGMA_POOL].color,
        scale: 1
    },

    /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
    PickupItem: { kind: 'weapon', blueprint: WeaponId.MAGMA, autoPickup: true },

    /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
    HitBox: { shape: 'rect', halfWidth: 12, halfHeight: 12 },
};

/**
 * 相位波动炮道具蓝图
 * 获得相位波动炮武器
 */
export const BLUEPRINT_POWERUP_WAVE: Blueprint = {
    /** 变换组件 - 设置道具的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 精灵组件 - 使用 BULLET_SPRITE_CONFIG 获取 SpriteKey 和颜色 */
    Sprite: {
        spriteKey: BULLET_SPRITE_CONFIG[AmmoType.WAVE_PULSE].spriteKey,
        color: BULLET_SPRITE_CONFIG[AmmoType.WAVE_PULSE].color,
        scale: 1
    },

    /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
    PickupItem: { kind: 'weapon', blueprint: WeaponId.WAVE, autoPickup: true },

    /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
    HitBox: { shape: 'rect', halfWidth: 12, halfHeight: 12 },
};

/**
 * 虚空等离子炮道具蓝图
 * 获得虚空等离子炮武器
 */
export const BLUEPRINT_POWERUP_PLASMA: Blueprint = {
    /** 变换组件 - 设置道具的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 精灵组件 - 使用 BULLET_SPRITE_CONFIG 获取 SpriteKey 和颜色 */
    Sprite: {
        spriteKey: BULLET_SPRITE_CONFIG[AmmoType.PLASMA_ORB].spriteKey,
        color: BULLET_SPRITE_CONFIG[AmmoType.PLASMA_ORB].color,
        scale: 1
    },

    /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
    PickupItem: { kind: 'weapon', blueprint: WeaponId.PLASMA, autoPickup: true },

    /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
    HitBox: { shape: 'rect', halfWidth: 12, halfHeight: 12 },
};
