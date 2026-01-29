/**
 * 道具系统常量配置
 *
 * 定义所有道具相关的魔法数字为常量
 */

import { BuffType } from '../types';
import { Blueprint } from '../blueprints/base';
import { BLUEPRINT_OPTION_VULCAN } from '../blueprints/fighters';

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
 */
export const POWERUP_LIMITS = {
    /** 武器最大等级 */
    MAX_WEAPON_LEVEL: 5,

    /** 武器最大子弹数量 */
    MAX_BULLET_COUNT: 7,
} as const;

/**
 * Buff 道具配置
 */
export const BUFF_CONFIG = {
    [BuffType.POWER]: {
        /** 升级时增加的等级 */
        levelIncrease: 1,
        /** 最大等级 */
        maxLevel: 5,
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
        /** 描述文本 */
        description: '3秒无敌',
    },

    [BuffType.TIME_SLOW]: {
        /** 时间减缓持续时间（毫秒） */
        duration: 5000,
        /** 描述文本 */
        description: '5秒时间减缓',
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
