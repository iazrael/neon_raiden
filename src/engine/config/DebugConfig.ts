/**
 * 全局调试配置
 *
 * 各模块的调试开关统一在这里管理
 */
export const DebugConfig = {
    /** 渲染系统调试 */
    render: {
        enabled: false,
        logEntities: false,
    },
    /** 物理系统调试 */
    physics: {
        enabled: false,
    },
    /** 性能监控 */
    performance: {
        enabled: false,
        frameTimeThreshold: 16.67,
        reportToConsole: true,
    },
};
