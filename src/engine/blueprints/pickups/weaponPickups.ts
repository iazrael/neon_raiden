import { AmmoType, WeaponId } from "../../types";
import { Blueprint } from "../types";
import { PLAYER_BULLET_SPRITES } from "../../configs/sprites/bullets";


/**
 * 离子机炮道具蓝图
 * 获得离子机炮武器
 */
export const BLUEPRINT_POWERUP_VULCAN: Blueprint = {
    /** 变换组件 - 设置道具的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 精灵组件 - 设置道具的纹理信息 */
    Sprite: {
        texture: PLAYER_BULLET_SPRITES[AmmoType.VULCAN_SPREAD].texture,
        color: PLAYER_BULLET_SPRITES[AmmoType.VULCAN_SPREAD].color,
        srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5
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

    /** 精灵组件 - 设置道具的纹理信息 */
    Sprite: {
        texture: PLAYER_BULLET_SPRITES[AmmoType.LASER_BEAM].texture,
        color: PLAYER_BULLET_SPRITES[AmmoType.LASER_BEAM].color,
        srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5
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

    /** 精灵组件 - 设置道具的纹理信息 */
    Sprite: {
        texture: PLAYER_BULLET_SPRITES[AmmoType.MISSILE_HOMING].texture,
        color: PLAYER_BULLET_SPRITES[AmmoType.MISSILE_HOMING].color,
        srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5
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

    /** 精灵组件 - 设置道具的纹理信息 */
    Sprite: {
        texture: PLAYER_BULLET_SPRITES[AmmoType.SHURIKEN_BOUNCE].texture,
        color: PLAYER_BULLET_SPRITES[AmmoType.SHURIKEN_BOUNCE].color,
        srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5
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

    /** 精灵组件 - 设置道具的纹理信息 */
    Sprite: {
        texture: PLAYER_BULLET_SPRITES[AmmoType.TESLA_CHAIN].texture,
        color: PLAYER_BULLET_SPRITES[AmmoType.TESLA_CHAIN].color,
        srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5
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

    /** 精灵组件 - 设置道具的纹理信息 */
    Sprite: {
        texture: PLAYER_BULLET_SPRITES[AmmoType.MAGMA_POOL].texture,
        color: PLAYER_BULLET_SPRITES[AmmoType.MAGMA_POOL].color,
        srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5
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

    /** 精灵组件 - 设置道具的纹理信息 */
    Sprite: {
        texture: PLAYER_BULLET_SPRITES[AmmoType.WAVE_PULSE].texture,
        color: PLAYER_BULLET_SPRITES[AmmoType.WAVE_PULSE].color,
        srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5
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

    /** 精灵组件 - 设置道具的纹理信息 */
    Sprite: {
        texture: PLAYER_BULLET_SPRITES[AmmoType.PLASMA_ORB].texture,
        color: PLAYER_BULLET_SPRITES[AmmoType.PLASMA_ORB].color,
        srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5
    },

    /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
    PickupItem: { kind: 'weapon', blueprint: WeaponId.PLASMA, autoPickup: true },

    /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
    HitBox: { shape: 'rect', halfWidth: 12, halfHeight: 12 },
};
