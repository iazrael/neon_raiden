//
// 道具蓝图文件
// 包含游戏中所有道具类型的蓝图定义
//

import { BuffType } from '../../types';
import { Blueprint } from '../base';
import { SpriteKey } from '../../configs/sprites';
import { CollisionLayer } from '../../types/collision';

/**
 * 道具下降速度（像素/秒）
 * 道具会以这个速度缓慢向下移动，移出屏幕后自动销毁
 */
const PICKUP_FALL_SPEED = 100;

/**
 * 能量提升道具蓝图
 * 提升玩家武器能量等级
 */
export const BLUEPRINT_POWERUP_POWER: Blueprint = {
    /** 变换组件 - 设置道具的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 速度组件 - 道具缓慢下降 */
    Velocity: { vx: 0, vy: PICKUP_FALL_SPEED, vrot: 0 },

    /** 精灵组件 - 使用 SpriteKey */
    Sprite: { spriteKey: SpriteKey.POWERUP_POWER, scale: 1 },

    /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
    PickupItem: { kind: 'buff', blueprint: BuffType.POWER, autoPickup: true },

    /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
    HitBox: { shape: 'rect', halfWidth: 12, halfHeight: 12, layer: CollisionLayer.Pickup },
};

/**
 * 生命恢复道具蓝图
 * 恢复玩家生命值
 */
export const BLUEPRINT_POWERUP_HP: Blueprint = {
    /** 变换组件 - 设置道具的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 速度组件 - 道具缓慢下降 */
    Velocity: { vx: 0, vy: PICKUP_FALL_SPEED, vrot: 0 },

    /** 精灵组件 - 使用 SpriteKey */
    Sprite: { spriteKey: SpriteKey.POWERUP_HP, scale: 1 },

    /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
    PickupItem: { kind: 'buff', blueprint: BuffType.HP, autoPickup: true },

    /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
    HitBox: { shape: 'rect', halfWidth: 12, halfHeight: 12, layer: CollisionLayer.Pickup },
};

/**
 * 炸弹道具蓝图
 * 获得一枚炸弹
 */
export const BLUEPRINT_POWERUP_BOMB: Blueprint = {
    /** 变换组件 - 设置道具的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 速度组件 - 道具缓慢下降 */
    Velocity: { vx: 0, vy: PICKUP_FALL_SPEED, vrot: 0 },

    /** 精灵组件 - 使用 SpriteKey */
    Sprite: { spriteKey: SpriteKey.POWERUP_BOMB, scale: 1 },

    /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
    PickupItem: { kind: 'buff', blueprint: BuffType.BOMB, autoPickup: true },

    /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
    HitBox: { shape: 'rect', halfWidth: 12, halfHeight: 12, layer: CollisionLayer.Pickup },
};

/**
 * 僚机单元道具蓝图
 * 获得一个僚机
 */
export const BLUEPRINT_POWERUP_OPTION: Blueprint = {
    /** 变换组件 - 设置道具的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 速度组件 - 道具缓慢下降 */
    Velocity: { vx: 0, vy: PICKUP_FALL_SPEED, vrot: 0 },

    /** 精灵组件 - 使用 SpriteKey */
    Sprite: { spriteKey: SpriteKey.POWERUP_OPTION, scale: 1 },

    /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
    PickupItem: { kind: 'buff', blueprint: BuffType.OPTION, autoPickup: true },

    /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
    HitBox: { shape: 'rect', halfWidth: 12, halfHeight: 12, layer: CollisionLayer.Pickup },
};

/**
 * 无敌护盾道具蓝图
 * 获得短暂的无敌护盾
 */
export const BLUEPRINT_POWERUP_INVINCIBILITY: Blueprint = {
    /** 变换组件 - 设置道具的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 速度组件 - 道具缓慢下降 */
    Velocity: { vx: 0, vy: PICKUP_FALL_SPEED, vrot: 0 },

    /** 精灵组件 - 使用 SpriteKey */
    Sprite: { spriteKey: SpriteKey.POWERUP_INVINCIBILITY, scale: 1 },

    /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
    PickupItem: { kind: 'buff', blueprint: BuffType.INVINCIBILITY, autoPickup: true },

    /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
    HitBox: { shape: 'rect', halfWidth: 12, halfHeight: 12, layer: CollisionLayer.Pickup },
};

/**
 * 时间减缓道具蓝图
 * 短暂减缓游戏速度
 */
export const BLUEPRINT_POWERUP_TIME_SLOW: Blueprint = {
    /** 变换组件 - 设置道具的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 速度组件 - 道具缓慢下降 */
    Velocity: { vx: 0, vy: PICKUP_FALL_SPEED, vrot: 0 },

    /** 精灵组件 - 使用 SpriteKey */
    Sprite: { spriteKey: SpriteKey.POWERUP_TIME_SLOW, scale: 1 },

    /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
    PickupItem: { kind: 'buff', blueprint: BuffType.TIME_SLOW, autoPickup: true },

    /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
    HitBox: { shape: 'rect', halfWidth: 12, halfHeight: 12, layer: CollisionLayer.Pickup },
};
