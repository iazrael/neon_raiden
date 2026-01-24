//
// 敌人单位蓝图文件
// 包含游戏中所有敌人类型的蓝图定义
//

import { ASSETS } from '../configs';
import { DROPTABLE_COMMON } from '../configs/droptables';
import { EnemyId, EnemyWeaponId, AmmoType } from '../types';
import { Blueprint } from './base';
import { WEAPON_TABLE } from './weapons';

/**
 * 普通敌人蓝图
 * 基础敌人单位，血量较少，移动速度中等
 */
export const BLUEPRINT_ENEMY_NORMAL: Blueprint = {
    /** 变换组件 - 设置敌人的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置敌人的当前生命值和最大生命值 */
    Health: { hp: 30, max: 30 },

    /** 速度组件 - 设置敌人的移动速度 */
    Velocity: { vx: 0, vy: 2, vrot: 0 },

    /** 精灵组件 - 设置敌人的纹理信息 */
    Sprite: { texture: ASSETS.ENEMIES.normal, srcX: 0, srcY: 0, srcW: 40, srcH: 40, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** 敌人标签组件 - 标识此实体为普通敌人 */
    EnemyTag: { id: EnemyId.NORMAL },

    /** 速度状态限制 */
    SpeedStat: { maxLinear: 150 },

    /** 碰撞盒组件 - 设置敌人的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 20 },

    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_COMMON },

    // 挂载敌人武器组件 - 使用普通敌人武器
    Weapon: WEAPON_TABLE[EnemyWeaponId.ENEMY_NORMAL]
};

/**
 * 快速敌人蓝图
 * 高速移动的敌人，血量较少但速度快
 */
export const BLUEPRINT_ENEMY_FAST: Blueprint = {
    /** 变换组件 - 设置敌人的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置敌人的当前生命值和最大生命值 */
    Health: { hp: 10, max: 10 },

    /** 速度组件 - 设置敌人的移动速度 */
    Velocity: { vx: 0, vy: 10, vrot: 0 },

    /** 精灵组件 - 设置敌人的纹理信息 */
    Sprite: { texture: ASSETS.ENEMIES.fast, srcX: 0, srcY: 0, srcW: 30, srcH: 40, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** 敌人标签组件 - 标识此实体为快速敌人 */
    EnemyTag: { id: EnemyId.FAST },
    SpeedStat: { maxLinear: 300 },

    /** 碰撞盒组件 - 设置敌人的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 15 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_COMMON },

    // 挂载敌人武器组件 - 使用快速敌人武器
    Weapon: WEAPON_TABLE[EnemyWeaponId.ENEMY_FAST]
};

/**
 * 坦克敌人蓝图
 * 高血量低速度的敌人，具有较强的耐久性
 */
export const BLUEPRINT_ENEMY_TANK: Blueprint = {
    /** 变换组件 - 设置敌人的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置敌人的当前生命值和最大生命值 */
    Health: { hp: 60, max: 60 },

    /** 速度组件 - 设置敌人的移动速度 */
    Velocity: { vx: 0, vy: 1, vrot: 0 },

    /** 精灵组件 - 设置敌人的纹理信息 */
    Sprite: { texture: ASSETS.ENEMIES.tank, srcX: 0, srcY: 0, srcW: 60, srcH: 60, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** 敌人标签组件 - 标识此实体为坦克敌人 */
    EnemyTag: { id: EnemyId.TANK },
    SpeedStat: { maxLinear: 100 },

    /** 碰撞盒组件 - 设置敌人的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 30 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_COMMON },

    // 挂载敌人武器组件 - 使用坦克敌人武器
    Weapon: WEAPON_TABLE[EnemyWeaponId.ENEMY_TANK]
};

/**
 * 自杀式敌人蓝图
 * 血量极少但速度很快，通常用于自杀式攻击
 */
export const BLUEPRINT_ENEMY_KAMIKAZE: Blueprint = {
    /** 变换组件 - 设置敌人的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置敌人的当前生命值和最大生命值 */
    Health: { hp: 5, max: 5 },

    /** 速度组件 - 设置敌人的移动速度 */
    Velocity: { vx: 0, vy: 10, vrot: 0 },

    /** 精灵组件 - 设置敌人的纹理信息 */
    Sprite: { texture: ASSETS.ENEMIES.kamikaze, srcX: 0, srcY: 0, srcW: 30, srcH: 30, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** 敌人标签组件 - 标识此实体为自杀式敌人 */
    EnemyTag: { id: EnemyId.KAMIKAZE },
    SpeedStat: { maxLinear: 400 },

    /** 碰撞盒组件 - 设置敌人的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 15 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_COMMON },

    // 挂载敌人武器组件 - 自杀式敌人不使用远程武器
    Weapon: WEAPON_TABLE[EnemyWeaponId.ENEMY_NORMAL]
};

/**
 * 精英炮艇敌人蓝图
 * 精英单位，具有较高的血量和特殊能力
 */
export const BLUEPRINT_ENEMY_ELITE_GUNBOAT: Blueprint = {
    /** 变换组件 - 设置敌人的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置敌人的当前生命值和最大生命值 */
    Health: { hp: 100, max: 100 },

    /** 速度组件 - 设置敌人的移动速度 */
    Velocity: { vx: 0, vy: 0.5, vrot: 0 },

    /** 精灵组件 - 设置敌人的纹理信息 */
    Sprite: { texture: ASSETS.ENEMIES.gunboat, srcX: 0, srcY: 0, srcW: 70, srcH: 50, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** 敌人标签组件 - 标识此实体为精英炮艇敌人 */
    EnemyTag: { id: EnemyId.ELITE_GUNBOAT },
    SpeedStat: { maxLinear: 80 },

    /** 碰撞盒组件 - 设置敌人的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 35 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_COMMON },

    // 挂载敌人武器组件 - 使用精英敌人武器
    Weapon: WEAPON_TABLE[EnemyWeaponId.ENEMY_ELITE]
};

/**
 * 激光拦截机敌人蓝图
 * 能够发射激光的敌人单位
 */
export const BLUEPRINT_ENEMY_LASER_INTERCEPTOR: Blueprint = {
    /** 变换组件 - 设置敌人的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置敌人的当前生命值和最大生命值 */
    Health: { hp: 80, max: 80 },

    /** 速度组件 - 设置敌人的移动速度 */
    Velocity: { vx: 0, vy: 5, vrot: 0 },

    /** 精灵组件 - 设置敌人的纹理信息 */
    Sprite: { texture: ASSETS.ENEMIES.interceptor, srcX: 0, srcY: 0, srcW: 50, srcH: 50, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** 敌人标签组件 - 标识此实体为激光拦截机敌人 */
    EnemyTag: { id: EnemyId.LASER_INTERCEPTOR },
    SpeedStat: { maxLinear: 150 },

    /** 碰撞盒组件 - 设置敌人的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 25 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_COMMON },

    // 挂载敌人武器组件 - 使用狙击敌人武器（激光）
    Weapon: WEAPON_TABLE[EnemyWeaponId.ENEMY_SNIPER]
};

/**
 * 布雷船敌人蓝图
 * 能够部署地雷的敌人单位
 */
export const BLUEPRINT_ENEMY_MINE_LAYER: Blueprint = {
    /** 变换组件 - 设置敌人的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置敌人的当前生命值和最大生命值 */
    Health: { hp: 60, max: 60 },

    /** 速度组件 - 设置敌人的移动速度 */
    Velocity: { vx: 0, vy: 1.5, vrot: 0 },

    /** 精灵组件 - 设置敌人的纹理信息 */
    Sprite: { texture: ASSETS.ENEMIES.layer, srcX: 0, srcY: 0, srcW: 60, srcH: 40, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** 敌人标签组件 - 标识此实体为布雷船敌人 */
    EnemyTag: { id: EnemyId.MINE_LAYER },
    SpeedStat: { maxLinear: 100 },

    /** 碰撞盒组件 - 设置敌人的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 30 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_COMMON },

    // 挂载敌人武器组件 - 使用布雷敌人武器
    Weapon: WEAPON_TABLE[EnemyWeaponId.ENEMY_LAYER]
};

/**
 * 脉冲敌人蓝图
 * 能够发射脉冲波的敌人单位
 */
export const BLUEPRINT_ENEMY_PULSAR: Blueprint = {
    /** 变换组件 - 设置敌人的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置敌人的当前生命值和最大生命值 */
    Health: { hp: 15, max: 15 },

    /** 速度组件 - 设置敌人的移动速度 */
    Velocity: { vx: 0, vy: 6, vrot: 0 },

    /** 精灵组件 - 设置敌人的纹理信息 */
    Sprite: { texture: ASSETS.ENEMIES.pulsar, srcX: 0, srcY: 0, srcW: 32, srcH: 32, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** 敌人标签组件 - 标识此实体为脉冲敌人 */
    EnemyTag: { id: EnemyId.PULSAR },
    SpeedStat: { maxLinear: 200 },

    /** 碰撞盒组件 - 设置敌人的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 16 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_COMMON },

    // 挂载敌人武器组件 - 使用脉冲敌人武器
    Weapon: WEAPON_TABLE[EnemyWeaponId.ENEMY_PULSAR]
};

/**
 * 堡垒敌人蓝图
 * 高血量的防御型敌人单位
 */
export const BLUEPRINT_ENEMY_FORTRESS: Blueprint = {
    /** 变换组件 - 设置敌人的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置敌人的当前生命值和最大生命值 */
    Health: { hp: 200, max: 200 },

    /** 速度组件 - 设置敌人的移动速度 */
    Velocity: { vx: 0, vy: 0.8, vrot: 0 },

    /** 精灵组件 - 设置敌人的纹理信息 */
    Sprite: { texture: ASSETS.ENEMIES.fortress, srcX: 0, srcY: 0, srcW: 70, srcH: 70, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** 敌人标签组件 - 标识此实体为堡垒敌人 */
    EnemyTag: { id: EnemyId.FORTRESS },
    SpeedStat: { maxLinear: 50 },

    /** 碰撞盒组件 - 设置敌人的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 35 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_COMMON },

    // 挂载敌人武器组件 - 使用堡垒敌人武器
    Weapon: WEAPON_TABLE[EnemyWeaponId.ENEMY_BARRAGE]
};

/**
 * 追踪者敌人蓝图
 * 能够追踪玩家的敌人单位
 */
export const BLUEPRINT_ENEMY_STALKER: Blueprint = {
    /** 变换组件 - 设置敌人的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置敌人的当前生命值和最大生命值 */
    Health: { hp: 30, max: 30 },

    /** 速度组件 - 设置敌人的移动速度 */
    Velocity: { vx: 0, vy: 5, vrot: 0 },

    /** 精灵组件 - 设置敌人的纹理信息 */
    Sprite: { texture: ASSETS.ENEMIES.stalker, srcX: 0, srcY: 0, srcW: 36, srcH: 36, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** 敌人标签组件 - 标识此实体为追踪者敌人 */
    EnemyTag: { id: EnemyId.STALKER },
    SpeedStat: { maxLinear: 250 },

    /** 碰撞盒组件 - 设置敌人的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 18 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_COMMON },

    // 挂载敌人武器组件 - 使用追踪敌人武器
    Weapon: WEAPON_TABLE[EnemyWeaponId.GENERIC_HOMING]
};

/**
 * 弹幕敌人蓝图
 * 能够发射密集弹幕的敌人单位
 */
export const BLUEPRINT_ENEMY_BARRAGE: Blueprint = {
    /** 变换组件 - 设置敌人的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置敌人的当前生命值和最大生命值 */
    Health: { hp: 100, max: 100 },

    /** 速度组件 - 设置敌人的移动速度 */
    Velocity: { vx: 0, vy: 1.2, vrot: 0 },

    /** 精灵组件 - 设置敌人的纹理信息 */
    Sprite: { texture: ASSETS.ENEMIES.barrage, srcX: 0, srcY: 0, srcW: 50, srcH: 50, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** 敌人标签组件 - 标识此实体为弹幕敌人 */
    EnemyTag: { id: EnemyId.BARRAGE },
    SpeedStat: { maxLinear: 100 },

    /** 碰撞盒组件 - 设置敌人的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 25 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_COMMON },

    // 挂载敌人武器组件 - 使用弹幕敌人武器
    Weapon: WEAPON_TABLE[EnemyWeaponId.ENEMY_BARRAGE]
};

/**
 * 敌人蓝图表
 * 包含游戏中所有敌人类型的蓝图定义
 */
export const ENEMIES_TABLE: Record<EnemyId, Blueprint> = {
    [EnemyId.NORMAL]: BLUEPRINT_ENEMY_NORMAL,
    [EnemyId.FAST]: BLUEPRINT_ENEMY_FAST,
    [EnemyId.TANK]: BLUEPRINT_ENEMY_TANK,
    [EnemyId.KAMIKAZE]: BLUEPRINT_ENEMY_KAMIKAZE,
    [EnemyId.ELITE_GUNBOAT]: BLUEPRINT_ENEMY_ELITE_GUNBOAT,
    [EnemyId.LASER_INTERCEPTOR]: BLUEPRINT_ENEMY_LASER_INTERCEPTOR,
    [EnemyId.MINE_LAYER]: BLUEPRINT_ENEMY_MINE_LAYER,
    [EnemyId.PULSAR]: BLUEPRINT_ENEMY_PULSAR,
    [EnemyId.FORTRESS]: BLUEPRINT_ENEMY_FORTRESS,
    [EnemyId.STALKER]: BLUEPRINT_ENEMY_STALKER,
    [EnemyId.BARRAGE]: BLUEPRINT_ENEMY_BARRAGE,
};
