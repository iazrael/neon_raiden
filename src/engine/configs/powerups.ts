/**
 * 道具系统常量配置
 *
 * 定义所有道具相关的魔法数字为常量
 */

import { BuffType } from '../types';
import { Blueprint } from '../blueprints/base';
import { BLUEPRINT_OPTION_VULCAN } from '../blueprints/fighters';
// 从武器升级配置表派生限制值，确保数据一致性
import { WEAPON_LIMITS } from './weapon-upgrades';

/**
 * Buff 分类枚举
 */
export enum BuffCategory {
    /** 一次性效果（立即生效） */
    INSTANT = 'INSTANT',
    /** 持续效果（需要时间更新） */
    DURATION = 'DURATION'
}

/**
 * Buff 分类配置
 * 定义每个 BuffType 属于哪个分类
 */
export const BUFF_CATEGORY_CONFIG: Record<BuffType, BuffCategory> = {
    [BuffType.POWER]: BuffCategory.INSTANT,
    [BuffType.HP]: BuffCategory.INSTANT,
    [BuffType.BOMB]: BuffCategory.INSTANT,
    [BuffType.OPTION]: BuffCategory.INSTANT,
    [BuffType.INVINCIBILITY]: BuffCategory.DURATION,
    [BuffType.TIME_SLOW]: BuffCategory.DURATION,
    [BuffType.SHIELD]: BuffCategory.DURATION,
    [BuffType.RAPID_FIRE]: BuffCategory.DURATION,
    [BuffType.PENETRATION]: BuffCategory.DURATION,
    [BuffType.SPEED]: BuffCategory.DURATION,
    [BuffType.DAMAGE]: BuffCategory.DURATION,
    [BuffType.CHAIN]: BuffCategory.DURATION,
    [BuffType.AREA]: BuffCategory.DURATION,
    [BuffType.COOLDOWN]: BuffCategory.DURATION,
    [BuffType.DURATION]: BuffCategory.DURATION
};

/**
 * 道具限制常量
 *
 * 注意：武器限制值（MAX_WEAPON_LEVEL, MAX_BULLET_COUNT）
 * 从 WEAPON_UPGRADE_TABLE 动态计算，确保配置一致性
 */
export const POWERUP_LIMITS = {
    /** 武器最大等级（从 WEAPON_UPGRADE_TABLE 计算） */
    MAX_WEAPON_LEVEL: WEAPON_LIMITS.MAX_WEAPON_LEVEL,

    /** 武器最大子弹数量（从 WEAPON_UPGRADE_TABLE 计算） */
    MAX_BULLET_COUNT: WEAPON_LIMITS.MAX_BULLET_COUNT,
} as const;

/**
 * Buff 道具配置
 */
export const BUFF_CONFIG = {
    [BuffType.POWER]: {
        /** 升级时增加的等级 */
        levelIncrease: 1,
        /** 最大等级（与 WEAPON_LIMITS.MAX_WEAPON_LEVEL 保持一致） */
        maxLevel: WEAPON_LIMITS.MAX_WEAPON_LEVEL,
    },

    [BuffType.HP]: {
        /** 恢复的生命值 */
        healAmount: 30,
    },

    [BuffType.BOMB]: {
        /** 每次拾取增加的炸弹数量 */
        countIncrease: 1,
        /** 最大持有数量 */
        maxCount: 9,
        /** 达到上限时的提示音 */
        maxSound: 'bomb_max',
    },

    [BuffType.OPTION]: {
        /** 每次拾取增加的僚机数量 */
        countIncrease: 1,
        /** 最大僚机数量 */
        maxCount: 2,
        /** 达到上限时的提示音 */
        maxSound: 'bomb_max',
    },

    [BuffType.INVINCIBILITY]: {
        /** 无敌持续时间（毫秒） */
        duration: 3000,
        /** 闪烁颜色 */
        flashColor: '#FFD700',
    },

    [BuffType.TIME_SLOW]: {
        /** 时间减缓持续时间（毫秒） */
        duration: 5000,
        /** 时间减缓比例 (0.5 = 50% 速度) */
        scale: 0.5,
        /** 影响范围 (预留未来扩展区域限制) */
        scope: 'global',
    },

    // 护盾的增益 Buff 配置
    [BuffType.SHIELD]: {
        /** 护盾恢复持续时间（毫秒） */
        duration: 5000,
        /** 护盾恢复速率（每秒恢复点） */
        regenPerSecond: 20,
    },

} as const;

/**
 * 保底掉落配置
 */
export const GUARANTEED_DROP_CONFIG = {
    /** 默认保底时间（毫秒） */
    DEFAULT_TIMER: 30000,

    /** 保底掉落道具选项 */
    DROPPABLE_ITEMS: ['POWER', 'HP'],
} as const;

/**
 * 僚机蓝图映射表
 * 定义僚机道具对应的蓝图
 */
export const OPTION_BLUEPRINT_MAP: Record<string, Blueprint> = {
    'OPTION_VULCAN': BLUEPRINT_OPTION_VULCAN,
};

/**
 * 僚机道具配置
 * 定义拾取 OPTION 道具时的行为
 */
export const POWERUP_CONFIG = {
    [BuffType.OPTION]: {
        /** 使用的蓝图类型 */
        blueprintType: 'OPTION_VULCAN',
        /** 最大僚机数量 */
        maxCount: 2
    }
} as const;
