//
// 道具蓝图文件
// 包含游戏中所有道具类型的蓝图定义
//

import { Transform, Sprite, PickupItem, HitBox } from '../components'
import { Blueprint } from './types';
import { PowerupType } from '@/types';


/**
 * 能量提升道具蓝图
 * 提升玩家武器能量等级
 */
export const BLUEPRINT_POWERUP_POWER: Blueprint = {
  /** 变换组件 - 设置道具的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 精灵组件 - 设置道具的纹理信息 */
  Sprite: { texture: 'powerup_power', srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
  PickupItem: { kind: 'buff', blueprint: 'powerup_power', autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 12 },
};

/**
 * 生命恢复道具蓝图
 * 恢复玩家生命值
 */
export const BLUEPRINT_POWERUP_HP: Blueprint = {
  /** 变换组件 - 设置道具的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 精灵组件 - 设置道具的纹理信息 */
  Sprite: { texture: 'powerup_hp', srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
  PickupItem: { kind: 'buff', blueprint: 'powerup_hp', autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 12 },
};

/**
 * 炸弹道具蓝图
 * 获得一枚炸弹
 */
export const BLUEPRINT_POWERUP_BOMB: Blueprint = {
  /** 变换组件 - 设置道具的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 精灵组件 - 设置道具的纹理信息 */
  Sprite: { texture: 'powerup_bomb', srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
  PickupItem: { kind: 'buff', blueprint: 'powerup_bomb', autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 12 },
};

/**
 * 僚机单元道具蓝图
 * 获得一个僚机
 */
export const BLUEPRINT_POWERUP_OPTION: Blueprint = {
  /** 变换组件 - 设置道具的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 精灵组件 - 设置道具的纹理信息 */
  Sprite: { texture: 'powerup_option', srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
  PickupItem: { kind: 'buff', blueprint: 'powerup_option', autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 12 },
};

/**
 * 离子机炮道具蓝图
 * 获得离子机炮武器
 */
export const BLUEPRINT_POWERUP_VULCAN: Blueprint = {
  /** 变换组件 - 设置道具的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 精灵组件 - 设置道具的纹理信息 */
  Sprite: { texture: 'powerup_vulcan', srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
  PickupItem: { kind: 'weapon', blueprint: 'powerup_vulcan', autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 12 },
};

/**
 * 量子激光阵道具蓝图
 * 获得量子激光阵武器
 */
export const BLUEPRINT_POWERUP_LASER: Blueprint = {
  /** 变换组件 - 设置道具的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 精灵组件 - 设置道具的纹理信息 */
  Sprite: { texture: 'powerup_laser', srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
  PickupItem: { kind: 'weapon', blueprint: 'powerup_laser', autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 12 },
};

/**
 * 智能追踪系统道具蓝图
 * 获得智能追踪系统武器
 */
export const BLUEPRINT_POWERUP_MISSILE: Blueprint = {
  /** 变换组件 - 设置道具的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 精灵组件 - 设置道具的纹理信息 */
  Sprite: { texture: 'powerup_missile', srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
  PickupItem: { kind: 'weapon', blueprint: 'powerup_missile', autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 12 },
};

/**
 * 量子飞镖道具蓝图
 * 获得量子飞镖武器
 */
export const BLUEPRINT_POWERUP_SHURIKEN: Blueprint = {
  /** 变换组件 - 设置道具的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 精灵组件 - 设置道具的纹理信息 */
  Sprite: { texture: 'powerup_shuriken', srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
  PickupItem: { kind: 'weapon', blueprint: 'powerup_shuriken', autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 12 },
};

/**
 * 特斯拉线圈道具蓝图
 * 获得特斯拉线圈武器
 */
export const BLUEPRINT_POWERUP_TESLA: Blueprint = {
  /** 变换组件 - 设置道具的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 精灵组件 - 设置道具的纹理信息 */
  Sprite: { texture: 'powerup_tesla', srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
  PickupItem: { kind: 'weapon', blueprint: 'powerup_tesla', autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 12 },
};

/**
 * 恒星熔岩炮道具蓝图
 * 获得恒星熔岩炮武器
 */
export const BLUEPRINT_POWERUP_MAGMA: Blueprint = {
  /** 变换组件 - 设置道具的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 精灵组件 - 设置道具的纹理信息 */
  Sprite: { texture: 'powerup_magma', srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
  PickupItem: { kind: 'weapon', blueprint: 'powerup_magma', autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 12 },
};

/**
 * 相位波动炮道具蓝图
 * 获得相位波动炮武器
 */
export const BLUEPRINT_POWERUP_WAVE: Blueprint = {
  /** 变换组件 - 设置道具的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 精灵组件 - 设置道具的纹理信息 */
  Sprite: { texture: 'powerup_wave', srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
  PickupItem: { kind: 'weapon', blueprint: 'powerup_wave', autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 12 },
};

/**
 * 虚空等离子炮道具蓝图
 * 获得虚空等离子炮武器
 */
export const BLUEPRINT_POWERUP_PLASMA: Blueprint = {
  /** 变换组件 - 设置道具的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 精灵组件 - 设置道具的纹理信息 */
  Sprite: { texture: 'powerup_plasma', srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
  PickupItem: { kind: 'weapon', blueprint: 'powerup_plasma', autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 12 },
};

/**
 * 无敌护盾道具蓝图
 * 获得短暂的无敌护盾
 */
export const BLUEPRINT_POWERUP_INVINCIBILITY: Blueprint = {
  /** 变换组件 - 设置道具的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 精灵组件 - 设置道具的纹理信息 */
  Sprite: { texture: 'powerup_invincibility', srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
  PickupItem: { kind: 'buff', blueprint: 'powerup_invincibility', autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 12 },
};

/**
 * 时间减缓道具蓝图
 * 短暂减缓游戏速度
 */
export const BLUEPRINT_POWERUP_TIME_SLOW: Blueprint = {
  /** 变换组件 - 设置道具的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 精灵组件 - 设置道具的纹理信息 */
  Sprite: { texture: 'powerup_time_slow', srcX: 0, srcY: 0, srcW: 24, srcH: 24, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** 拾取物品组件 - 设置道具的类型和自动拾取属性 */
  PickupItem: { kind: 'buff', blueprint: 'powerup_time_slow', autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 12 },
};