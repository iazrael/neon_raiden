//
// 武器成长数据配置文件
// 定义武器随着等级提升而获得的属性增长
//

import { WeaponType } from '@/types';
import { WeaponId } from '../types';

/**
 * 武器成长数据配置
 * 定义了不同类型武器随等级提升的属性增长数据
 */
export const WeaponGrowthData: Record<WeaponId, {
  /** 基础伤害 */
  baseDamage: number;
  /** 每级增加的伤害 */
  damagePerLevel: number;
  /** 子弹速度 */
  speed: number;
  /** 基准速度（用于DPS计算，默认为15） */
  baseSpeed: number;
  /** 基础射速（毫秒） */
  baseFireRate: number;
  /** 每级射速提升（毫秒减少） */
  ratePerLevel: number;
  /** 最高等级（默认9，用于展示与约束） */
  maxLevel?: number;
  /** 穿透伤害衰减比例 (0-1)，部分武器类型专用 */
  attenuation?: number;
}> = {
    /** 散弹武器成长数据 */
    [WeaponType.VULCAN]: {
        /** 基础伤害 */
        baseDamage: 12,
        /** 每级增加的伤害 */
        damagePerLevel: 3,
        /** 子弹速度 */
        speed: 15,
        /** 基准速度（用于DPS计算，默认为15） */
        baseSpeed: 15,
        /** 基础射速（毫秒） */
        baseFireRate: 150,
        /** 每级射速提升（毫秒减少） */
        ratePerLevel: 2,
        /** 最高等级 */
        maxLevel: 6
    },
    /** 激光武器成长数据 */
    [WeaponType.LASER]: {
        /** 基础伤害 */
        baseDamage: 6,
        /** 每级增加的伤害 */
        damagePerLevel: 2,
        /** 子弹速度 */
        speed: 25,
        /** 基准速度（用于DPS计算，默认为15） */
        baseSpeed: 15,
        /** 基础射速（毫秒） */
        baseFireRate: 180,
        /** 每级射速提升（毫秒减少） */
        ratePerLevel: 5,
        /** 最高等级 */
        maxLevel: 3,
        /** 穿透伤害衰减比例 */
        attenuation: 0.25
    },
    /** 跟踪导弹武器成长数据 */
    [WeaponType.MISSILE]: {
        /** 基础伤害 */
        baseDamage: 35,
        /** 每级增加的伤害 */
        damagePerLevel: 5,
        /** 子弹速度 */
        speed: 50,
        /** 基准速度（用于DPS计算，默认为15） */
        baseSpeed: 15,
        /** 基础射速（毫秒） */
        baseFireRate: 400,
        /** 每级射速提升（毫秒减少） */
        ratePerLevel: 20,
        /** 最高等级 */
        maxLevel: 3,
    },
    /** 波动炮武器成长数据 */
    [WeaponType.WAVE]: {
        /** 基础伤害 */
        baseDamage: 18,
        /** 每级增加的伤害 */
        damagePerLevel: 6,
        /** 子弹速度 */
        speed: 10,
        /** 基准速度（用于DPS计算，默认为15） */
        baseSpeed: 15,
        /** 基础射速（毫秒） */
        baseFireRate: 400,
        /** 每级射速提升（毫秒减少） */
        ratePerLevel: 20,
        /** 最高等级 */
        maxLevel: 3,
        /** 穿透伤害衰减比例 */
        attenuation: 0.5
    },
    /** 等离子武器成长数据 */
    [WeaponType.PLASMA]: {
        /** 基础伤害 */
        baseDamage: 45,
        /** 每级增加的伤害 */
        damagePerLevel: 12,
        /** 子弹速度 */
        speed: 8,
        /** 基准速度（用于DPS计算，默认为15） */
        baseSpeed: 15,
        /** 基础射速（毫秒） */
        baseFireRate: 600,
        /** 每级射速提升（毫秒减少） */
        ratePerLevel: 20,
        /** 最高等级 */
        maxLevel: 3
    },
    /** 电磁武器成长数据 */
    [WeaponType.TESLA]: {
        /** 基础伤害 */
        baseDamage: 15,
        /** 每级增加的伤害 */
        damagePerLevel: 1,
        /** 子弹速度 */
        speed: 25,
        /** 基准速度（用于DPS计算，默认为15） */
        baseSpeed: 15,
        /** 基础射速（毫秒） */
        baseFireRate: 200,
        /** 每级射速提升（毫秒减少） */
        ratePerLevel: 0,
        /** 最高等级 */
        maxLevel: 6
    },
    /** 熔岩武器成长数据 */
    [WeaponType.MAGMA]: {
        /** 基础伤害 */
        baseDamage: 15,
        /** 每级增加的伤害 */
        damagePerLevel: 5,
        /** 子弹速度 */
        speed: 10,
        /** 基准速度（用于DPS计算，默认为15） */
        baseSpeed: 15,
        /** 基础射速（毫秒） */
        baseFireRate: 220,
        /** 每级射速提升（毫秒减少） */
        ratePerLevel: 0,
        /** 最高等级 */
        maxLevel: 6
    },
    /** 手里剑武器成长数据 */
    [WeaponType.SHURIKEN]: {
        /** 基础伤害 */
        baseDamage: 15,
        /** 每级增加的伤害 */
        damagePerLevel: 3,
        /** 子弹速度 */
        speed: 20,
        /** 基准速度（用于DPS计算，默认为15） */
        baseSpeed: 15,
        /** 基础射速（毫秒） */
        baseFireRate: 300,
        /** 每级射速提升（毫秒减少） */
        ratePerLevel: 20,
        /** 最高等级 */
        maxLevel: 6
    }
};