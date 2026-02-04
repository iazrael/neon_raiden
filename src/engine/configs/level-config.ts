/**
 * 关卡系统统一配置
 * 所有数值参数集中管理，便于调整和测试
 * 使用 Object.freeze 确保运行时不可修改
 */
export const LEVEL_CONFIG = Object.freeze({
    /** 进度配置 */
    PROGRESS: Object.freeze({
        /** 每秒增长百分比 */
        PER_SECOND_GROWTH_RATE: 1.5,
        /** 每击杀增长百分比 */
        KILL_BONUS: 0.5,
        /** 最低关卡时长（毫秒） */
        MIN_LEVEL_DURATION: 60000,
        /** Boss准备进度阈值 */
        BOSS_READY_THRESHOLD: 90,
        /** 最大进度（允许超出20%） */
        MAX_PROGRESS: 120,
        /** 最低时间保护系数：60秒 = 80%进度 */
        TIME_PROTECTION_COEFFICIENT: 0.8,
    }),

    /** 动画时长配置 */
    ANIMATION: Object.freeze({
        /** 关卡过渡总时长（毫秒） */
        LEVEL_TRANSITION_DURATION: 1500,
        /** Boss退场时长（毫秒） */
        BOSS_EXIT_DURATION: 2000,
        /** Boss警告时长（毫秒） */
        BOSS_WARNING_DURATION: 3000,
        /** 第一关进入动画时长（毫秒） */
        STAGE_ONE_INTRO_DURATION: 2000,
    }),

    /** 敌人生成配置 */
    SPAWN: Object.freeze({
        /** 最小敌人生成间隔（毫秒） */
        MIN_ENEMY_INTERVAL: 800,
        /** 最大敌人生成间隔（毫秒） */
        MAX_ENEMY_INTERVAL: 2000,
    }),
});
