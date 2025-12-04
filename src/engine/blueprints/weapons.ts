//
// 武器蓝图文件
// 包含游戏中所有武器类型的蓝图定义
//

import { Weapon } from '../components'
import { Blueprint } from '../types';
import { WeaponType } from '@/types';


/**
 * 火神炮武器蓝图
 * 基础武器，射速快但单发伤害较低
 */
export const BLUEPRINT_WEAPON_VULCAN: Blueprint = {
  /** 武器组件 - 设置武器的弹药类型和冷却时间 */
  Weapon: { ammoType: 'bullet_vulcan', cooldown: 150, curCD: 0 },
};

/**
 * 激光武器蓝图
 * 高穿透武器，适合对付装甲目标
 */
export const BLUEPRINT_WEAPON_LASER: Blueprint = {
  /** 武器组件 - 设置武器的弹药类型和冷却时间 */
  Weapon: { ammoType: 'bullet_laser', cooldown: 180, curCD: 0 },
};

/**
 * 导弹武器蓝图
 * 智能追踪武器，能够自动锁定目标
 */
export const BLUEPRINT_WEAPON_MISSILE: Blueprint = {
  /** 武器组件 - 设置武器的弹药类型和冷却时间 */
  Weapon: { ammoType: 'bullet_missile', cooldown: 400, curCD: 0 },
};

/**
 * 波浪炮武器蓝图
 * 范围攻击武器，能够同时打击多个目标
 */
export const BLUEPRINT_WEAPON_WAVE: Blueprint = {
  /** 武器组件 - 设置武器的弹药类型和冷却时间 */
  Weapon: { ammoType: 'bullet_wave', cooldown: 400, curCD: 0 },
};

/**
 * 等离子炮武器蓝图
 * 高伤害武器，具有强大的破坏力
 */
export const BLUEPRINT_WEAPON_PLASMA: Blueprint = {
  /** 武器组件 - 设置武器的弹药类型和冷却时间 */
  Weapon: { ammoType: 'bullet_plasma', cooldown: 600, curCD: 0 },
};

/**
 * 特斯拉武器蓝图
 * 连锁闪电武器，能够在敌人间跳跃
 */
export const BLUEPRINT_WEAPON_TESLA: Blueprint = {
  /** 武器组件 - 设置武器的弹药类型和冷却时间 */
  Weapon: { ammoType: 'bullet_tesla', cooldown: 200, curCD: 0 },
};

/**
 * 熔岩炮武器蓝图
 * 持续伤害武器，能够造成燃烧效果
 */
export const BLUEPRINT_WEAPON_MAGMA: Blueprint = {
  /** 武器组件 - 设置武器的弹药类型和冷却时间 */
  Weapon: { ammoType: 'bullet_magma', cooldown: 220, curCD: 0 },
};

/**
 * 手里剑武器蓝图
 * 高速旋转武器，能够反弹攻击
 */
export const BLUEPRINT_WEAPON_SHURIKEN: Blueprint = {
  /** 武器组件 - 设置武器的弹药类型和冷却时间 */
  Weapon: { ammoType: 'bullet_shuriken', cooldown: 300, curCD: 0 },
};