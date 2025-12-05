//
// Boss单位蓝图文件
// 包含游戏中所有Boss类型的蓝图定义
//

import { Transform, Health, Sprite, BossTag, BossAI, HitBox } from '../components'
import { Blueprint } from './types';
import { BossType } from '@/types';


/**
 * 守护者Boss蓝图
 * 初级Boss，以正弦轨迹移动
 */
export const BLUEPRINT_BOSS_GUARDIAN: Blueprint = {
  /** 变换组件 - 设置Boss的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
  Health: { hp: 2000, max: 2000 },
  
  /** 精灵组件 - 设置Boss的纹理信息 */
  Sprite: { texture: 'boss_guardian', srcX: 0, srcY: 0, srcW: 180, srcH: 180, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** Boss标签组件 - 标识此实体为Boss */
  BossTag: {},
  
  /** Boss AI组件 - 控制Boss的行为模式 */
  BossAI: { phase: 1, nextPatternTime: 0 },
  
  /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 90 * 0.7 },
};

/**
 * 拦截者Boss蓝图
 * 中级Boss，以之字形轨迹高速机动
 */
export const BLUEPRINT_BOSS_INTERCEPTOR: Blueprint = {
  /** 变换组件 - 设置Boss的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
  Health: { hp: 3200, max: 3200 },
  
  /** 精灵组件 - 设置Boss的纹理信息 */
  Sprite: { texture: 'boss_interceptor', srcX: 0, srcY: 0, srcW: 200, srcH: 200, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** Boss标签组件 - 标识此实体为Boss */
  BossTag: {},
  
  /** Boss AI组件 - 控制Boss的行为模式 */
  BossAI: { phase: 1, nextPatternTime: 0 },
  
  /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 100 * 0.7 },
};

/**
 * 毁灭者Boss蓝图
 * 高级Boss，以八字轨迹碾压战场
 */
export const BLUEPRINT_BOSS_DESTROYER: Blueprint = {
  /** 变换组件 - 设置Boss的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
  Health: { hp: 5800, max: 5800 },
  
  /** 精灵组件 - 设置Boss的纹理信息 */
  Sprite: { texture: 'boss_destroyer', srcX: 0, srcY: 0, srcW: 220, srcH: 220, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** Boss标签组件 - 标识此实体为Boss */
  BossTag: {},
  
  /** Boss AI组件 - 控制Boss的行为模式 */
  BossAI: { phase: 1, nextPatternTime: 0 },
  
  /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 110 * 0.7 },
};

/**
 * 歼灭者Boss蓝图
 * 装备光学迷彩的幽灵战斗机
 */
export const BLUEPRINT_BOSS_ANNIHILATOR: Blueprint = {
  /** 变换组件 - 设置Boss的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
  Health: { hp: 7000, max: 7000 },
  
  /** 精灵组件 - 设置Boss的纹理信息 */
  Sprite: { texture: 'boss_annihilator', srcX: 0, srcY: 0, srcW: 240, srcH: 240, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** Boss标签组件 - 标识此实体为Boss */
  BossTag: {},
  
  /** Boss AI组件 - 控制Boss的行为模式 */
  BossAI: { phase: 1, nextPatternTime: 0 },
  
  /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 120 * 0.7 },
};

/**
 * 主宰者Boss蓝图
 * 高能粒子壁垒，释放无尽弹幕洪流
 */
export const BLUEPRINT_BOSS_DOMINATOR: Blueprint = {
  /** 变换组件 - 设置Boss的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
  Health: { hp: 8200, max: 8200 },
  
  /** 精灵组件 - 设置Boss的纹理信息 */
  Sprite: { texture: 'boss_dominator', srcX: 0, srcY: 0, srcW: 260, srcH: 260, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** Boss标签组件 - 标识此实体为Boss */
  BossTag: {},
  
  /** Boss AI组件 - 控制Boss的行为模式 */
  BossAI: { phase: 1, nextPatternTime: 0 },
  
  /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 130 * 0.7 },
};

/**
 * 霸主Boss蓝图
 * 双体协同战舰，融合多种火力系统
 */
export const BLUEPRINT_BOSS_OVERLORD: Blueprint = {
  /** 变换组件 - 设置Boss的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
  Health: { hp: 10600, max: 10600 },
  
  /** 精灵组件 - 设置Boss的纹理信息 */
  Sprite: { texture: 'boss_overlord', srcX: 0, srcY: 0, srcW: 280, srcH: 280, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** Boss标签组件 - 标识此实体为Boss */
  BossTag: {},
  
  /** Boss AI组件 - 控制Boss的行为模式 */
  BossAI: { phase: 1, nextPatternTime: 0 },
  
  /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 140 * 0.7 },
};

/**
 * 泰坦Boss蓝图
 * 三角构型的空中要塞，缓慢降临碾压战场
 */
export const BLUEPRINT_BOSS_TITAN: Blueprint = {
  /** 变换组件 - 设置Boss的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
  Health: { hp: 16000, max: 16000 },
  
  /** 精灵组件 - 设置Boss的纹理信息 */
  Sprite: { texture: 'boss_titan', srcX: 0, srcY: 0, srcW: 300, srcH: 300, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** Boss标签组件 - 标识此实体为Boss */
  BossTag: {},
  
  /** Boss AI组件 - 控制Boss的行为模式 */
  BossAI: { phase: 1, nextPatternTime: 0 },
  
  /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 150 * 0.7 },
};

/**
 * 巨像Boss蓝图
 * 八足钢铁巨蛛，激进突进撕裂战线
 */
export const BLUEPRINT_BOSS_COLOSSUS: Blueprint = {
  /** 变换组件 - 设置Boss的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
  Health: { hp: 17200, max: 17200 },
  
  /** 精灵组件 - 设置Boss的纹理信息 */
  Sprite: { texture: 'boss_colossus', srcX: 0, srcY: 0, srcW: 320, srcH: 320, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** Boss标签组件 - 标识此实体为Boss */
  BossTag: {},
  
  /** Boss AI组件 - 控制Boss的行为模式 */
  BossAI: { phase: 1, nextPatternTime: 0 },
  
  /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 160 * 0.7 },
};

/**
 * 利维坦Boss蓝图
 * 环状中枢战体，以极限机动穿梭战场
 */
export const BLUEPRINT_BOSS_LEVIATHAN: Blueprint = {
  /** 变换组件 - 设置Boss的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
  Health: { hp: 18400, max: 18400 },
  
  /** 精灵组件 - 设置Boss的纹理信息 */
  Sprite: { texture: 'boss_leviathan', srcX: 0, srcY: 0, srcW: 340, srcH: 340, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** Boss标签组件 - 标识此实体为Boss */
  BossTag: {},
  
  /** Boss AI组件 - 控制Boss的行为模式 */
  BossAI: { phase: 1, nextPatternTime: 0 },
  
  /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 170 * 0.7 },
};

/**
 * 天启Boss蓝图
 * 终极龙王，轨迹莫测难寻
 */
export const BLUEPRINT_BOSS_APOCALYPSE: Blueprint = {
  /** 变换组件 - 设置Boss的初始位置和旋转角度 */
  Transform: {x: 0, y: 0, rot: 0},
  
  /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
  Health: { hp: 20000, max: 20000 },
  
  /** 精灵组件 - 设置Boss的纹理信息 */
  Sprite: { texture: 'boss_apocalypse', srcX: 0, srcY: 0, srcW: 360, srcH: 360, scale: 1, pivotX: 0.5, pivotY: 0.5 },
  
  /** Boss标签组件 - 标识此实体为Boss */
  BossTag: {},
  
  /** Boss AI组件 - 控制Boss的行为模式 */
  BossAI: { phase: 1, nextPatternTime: 0 },
  
  /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
  HitBox: { shape: 'circle', radius: 180 * 0.7 },
};