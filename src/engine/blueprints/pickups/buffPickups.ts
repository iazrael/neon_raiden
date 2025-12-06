//
// 道具蓝图文件
// 包含游戏中所有道具类型的蓝图定义
//

import { BuffType } from '../../types';
import { Blueprint } from '../types';


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
  PickupItem: { kind: 'buff', blueprint: BuffType.POWER, autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'rect',  halfWidth: 12, halfHeight: 12 },
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
  PickupItem: { kind: 'buff', blueprint: BuffType.HP, autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'rect',  halfWidth: 12, halfHeight: 12 },
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
  PickupItem: { kind: 'buff', blueprint: BuffType.BOMB, autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'rect',  halfWidth: 12, halfHeight: 12 },
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
  PickupItem: { kind: 'buff', blueprint: BuffType.OPTION, autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'rect',  halfWidth: 12, halfHeight: 12 },
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
  PickupItem: { kind: 'buff', blueprint: BuffType.INVINCIBILITY, autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'rect',  halfWidth: 12, halfHeight: 12 },
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
  PickupItem: { kind: 'buff', blueprint: BuffType.TIME_SLOW, autoPickup: true },
  
  /** 碰撞盒组件 - 设置道具的碰撞检测区域 */
  HitBox: { shape: 'rect',  halfWidth: 12, halfHeight: 12 },
};