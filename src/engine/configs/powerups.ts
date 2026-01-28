/**
 * 道具系统常量配置
 *
 * 定义所有道具相关的魔法数字为常量
 */

import { BuffType } from '../types';

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
