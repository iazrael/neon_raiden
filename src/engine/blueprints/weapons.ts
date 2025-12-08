//
// 武器蓝图文件
// 包含游戏中所有武器类型的蓝图定义
//

import { AmmoType, WeaponId } from '../types';
import { WeaponSpec } from './types';

/**
 * 武器配置表
 * 包含所有武器的配置信息
 */
export const WEAPON_TABLE: Record<WeaponId, WeaponSpec> = {
    /**
     * 火神炮武器蓝图
     * 基础武器，射速快但单发伤害较低
     */
    [WeaponId.VULCAN]: {
        id: WeaponId.VULCAN,
        ammoType: AmmoType.VULCAN_SPREAD,
        cooldown: 150,
        curCD: 0,
        maxLevel: 6
    },

    /**
     * 激光武器蓝图
     * 高穿透武器，适合对付装甲目标
     */
    [WeaponId.LASER]: {
        /** 武器组件 - 设置武器的弹药类型和冷却时间 */
        id: WeaponId.LASER,
        ammoType: AmmoType.LASER_BEAM,
        cooldown: 180,
        curCD: 0,
        maxLevel: 3
    },

    /**
     * 导弹武器蓝图
     * 智能追踪武器，能够自动锁定目标
     */
    [WeaponId.MISSILE]: {
        /** 武器组件 - 设置武器的弹药类型和冷却时间 */
        id: WeaponId.MISSILE,
        ammoType: AmmoType.MISSILE_HOMING,
        cooldown: 400,
        curCD: 0,
        maxLevel: 3
    },

    /**
     * 波浪炮武器蓝图
     * 范围攻击武器，能够同时打击多个目标
     */
    [WeaponId.WAVE]: {
        /** 武器组件 - 设置武器的弹药类型和冷却时间 */
        id: WeaponId.WAVE,
        ammoType: AmmoType.WAVE_PULSE,
        cooldown: 400,
        curCD: 0,
        maxLevel: 3
    },

    /**
     * 等离子炮武器蓝图
     * 高伤害武器，具有强大的破坏力
     */
    [WeaponId.PLASMA]: {
        /** 武器组件 - 设置武器的弹药类型和冷却时间 */
        id: WeaponId.PLASMA,
        ammoType: AmmoType.PLASMA_ORB,
        cooldown: 600,
        curCD: 0,
        maxLevel: 6
    },

    /**
     * 特斯拉武器蓝图
     * 连锁闪电武器，能够在敌人间跳跃
     */
    [WeaponId.TESLA]: {
        /** 武器组件 - 设置武器的弹药类型和冷却时间 */
        id: WeaponId.TESLA,
        ammoType: AmmoType.TESLA_CHAIN,
        cooldown: 200,
        curCD: 0,
        maxLevel: 6
    },

    /**
     * 熔岩炮武器蓝图
     * 持续伤害武器，能够造成燃烧效果
     */
    [WeaponId.MAGMA]: {
        /** 武器组件 - 设置武器的弹药类型和冷却时间 */
        id: WeaponId.MAGMA,
        ammoType: AmmoType.MAGMA_POOL,
        cooldown: 220,
        curCD: 0,
        maxLevel: 6
    },

    /**
     * 手里剑武器蓝图
     * 高速旋转武器，能够反弹攻击
     */
    [WeaponId.SHURIKEN]: {
        /** 武器组件 - 设置武器的弹药类型和冷却时间 */
        id: WeaponId.SHURIKEN,
        ammoType: AmmoType.SHURIKEN_BOUNCE,
        cooldown: 300,
        curCD: 0,
        maxLevel: 6
    }
};