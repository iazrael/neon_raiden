/**
 * PerformanceMonitor 单元测试
 */

import { PerformanceMonitor, type PerformanceConfig, type FrameSnapshot } from '../../src/engine/utils/performance';

describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleGroupSpy: jest.SpyInstance;
    let consoleGroupEndSpy: jest.SpyInstance;
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
        const config: PerformanceConfig = {
            enabled: true,
            frameTimeThreshold: 16.67,
            reportToConsole: true,
        };
        monitor = new PerformanceMonitor(config);

        // Mock console 方法
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        consoleGroupSpy = jest.spyOn(console, 'groupCollapsed').mockImplementation();
        consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('基础功能', () => {
        it('应该正确初始化', () => {
            const config = monitor.getConfig();
            expect(config.enabled).toBe(true);
            expect(config.frameTimeThreshold).toBe(16.67);
            expect(config.reportToConsole).toBe(true);
        });

        it('应该提供性能数据流', () => {
            const stream = monitor.stream;
            expect(stream).toBeInstanceOf(Object);
            expect(stream.getValue()).toBeNull();
        });
    });

    describe('帧监控', () => {
        it('应该在 enabled=false 时不记录数据', () => {
            monitor.updateConfig({ enabled: false });

            monitor.startFrame();
            monitor.recordSystem('TestSystem', 'P1', 5.0);
            monitor.endFrame(20);

            // 流中没有数据
            expect(monitor.stream.getValue()).toBeNull();
        });

        it('应该记录单个系统的耗时', () => {
            monitor.startFrame();
            monitor.recordSystem('TestSystem', 'P1', 5.0);
            monitor.endFrame(10);

            const snapshot = monitor.stream.getValue();
            expect(snapshot).not.toBeNull();
            expect(snapshot?.frameTime).toBe(10);
            expect(snapshot?.thresholdExceeded).toBe(false);
            expect(snapshot?.layers['P1']).toBeDefined();
            expect(snapshot?.layers['P1'].totalMs).toBe(5.0);
            expect(snapshot?.layers['P1'].systems).toHaveLength(1);
            expect(snapshot?.layers['P1'].systems[0].name).toBe('TestSystem');
        });

        it('应该记录多个系统的耗时', () => {
            monitor.startFrame();
            monitor.recordSystem('System1', 'P1', 3.0);
            monitor.recordSystem('System2', 'P1', 2.0);
            monitor.recordSystem('System3', 'P2', 4.0);
            monitor.endFrame(10);

            const snapshot = monitor.stream.getValue();
            expect(snapshot?.layers['P1'].totalMs).toBe(5.0);
            expect(snapshot?.layers['P1'].systems).toHaveLength(2);
            expect(snapshot?.layers['P2'].totalMs).toBe(4.0);
            expect(snapshot?.layers['P2'].systems).toHaveLength(1);
        });

        it('应该正确判断是否超过阈值', () => {
            monitor.startFrame();
            monitor.recordSystem('System1', 'P1', 5.0);
            monitor.endFrame(20);

            const snapshot = monitor.stream.getValue();
            expect(snapshot?.thresholdExceeded).toBe(true);
        });

        it('应该在超过阈值时输出警告', () => {
            monitor.startFrame();
            monitor.recordSystem('SlowSystem', 'P1', 15.0);
            monitor.endFrame(20);

            // console.warn 的第一个参数包含警告信息
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('帧耗时超标'),
                expect.any(String), // 颜色样式参数
            );
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('20.00ms'),
                expect.any(String),
            );
            expect(consoleGroupSpy).toHaveBeenCalled();
        });

        it('应该在未超过阈值时不输出警告', () => {
            monitor.startFrame();
            monitor.recordSystem('FastSystem', 'P1', 5.0);
            monitor.endFrame(10);

            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });

        it('应该在 reportToConsole=false 时不输出警告', () => {
            monitor.updateConfig({ reportToConsole: false });

            monitor.startFrame();
            monitor.recordSystem('SlowSystem', 'P1', 15.0);
            monitor.endFrame(20);

            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });
    });

    describe('层级聚合', () => {
        it('应该按层级聚合系统耗时', () => {
            monitor.startFrame();
            monitor.recordSystem('InputSystem', 'P1', 1.0);
            monitor.recordSystem('SpawnSystem', 'P1', 2.0);
            monitor.recordSystem('WeaponSystem', 'P2', 3.0);
            monitor.recordSystem('MovementSystem', 'P3', 4.0);
            monitor.endFrame(15);

            const snapshot = monitor.stream.getValue();
            expect(snapshot?.layers['P1'].totalMs).toBe(3.0);
            expect(snapshot?.layers['P2'].totalMs).toBe(3.0);
            expect(snapshot?.layers['P3'].totalMs).toBe(4.0);
        });

        it('应该按耗时排序层级', () => {
            monitor.startFrame();
            monitor.recordSystem('MovementSystem', 'P3', 4.0);
            monitor.recordSystem('InputSystem', 'P1', 1.0);
            monitor.recordSystem('WeaponSystem', 'P2', 3.0);
            monitor.endFrame(20);

            // 触发警告输出
            const snapshot = monitor.stream.getValue();

            // 验证警告输出中层级按耗时排序（P3 最先，P2 次之，P1 最后）
            const calls = consoleGroupSpy.mock.calls;
            const p3Index = calls.findIndex((call) => call[0]?.includes('P3:'));
            const p2Index = calls.findIndex((call) => call[0]?.includes('P2:'));
            const p1Index = calls.findIndex((call) => call[0]?.includes('P1:'));

            expect(p3Index).toBeLessThan(p2Index);
            expect(p2Index).toBeLessThan(p1Index);
        });
    });

    describe('配置更新', () => {
        it('应该支持运行时更新配置', () => {
            monitor.updateConfig({ enabled: false });
            expect(monitor.getConfig().enabled).toBe(false);

            monitor.updateConfig({ frameTimeThreshold: 20 });
            expect(monitor.getConfig().frameTimeThreshold).toBe(20);

            monitor.updateConfig({ reportToConsole: false });
            expect(monitor.getConfig().reportToConsole).toBe(false);
        });

        it('应该支持部分更新配置', () => {
            const originalThreshold = monitor.getConfig().frameTimeThreshold;
            const originalReport = monitor.getConfig().reportToConsole;

            monitor.updateConfig({ enabled: false });

            expect(monitor.getConfig().enabled).toBe(false);
            expect(monitor.getConfig().frameTimeThreshold).toBe(originalThreshold);
            expect(monitor.getConfig().reportToConsole).toBe(originalReport);
        });
    });

    describe('边界情况', () => {
        it('应该处理空帧（没有系统）', () => {
            monitor.startFrame();
            monitor.endFrame(5);

            const snapshot = monitor.stream.getValue();
            expect(snapshot).not.toBeNull();
            expect(snapshot?.frameTime).toBe(5);
            expect(Object.keys(snapshot?.layers ?? {})).toHaveLength(0);
        });

        it('应该处理零耗时系统', () => {
            monitor.startFrame();
            monitor.recordSystem('ZeroSystem', 'P1', 0);
            monitor.endFrame(10);

            const snapshot = monitor.stream.getValue();
            expect(snapshot?.layers['P1'].totalMs).toBe(0);
        });

        it('应该连续监控多帧', () => {
            // 第一帧
            monitor.startFrame();
            monitor.recordSystem('System1', 'P1', 5.0);
            monitor.endFrame(10);

            // 第二帧
            monitor.startFrame();
            monitor.recordSystem('System2', 'P2', 8.0);
            monitor.endFrame(15);

            const snapshot = monitor.stream.getValue();
            expect(snapshot?.frameTime).toBe(15);
            expect(snapshot?.layers['P2'].totalMs).toBe(8.0);
            expect(snapshot?.layers['P1']).toBeUndefined();
        });

        it('应该正确显示 FPS', () => {
            monitor.startFrame();
            monitor.recordSystem('System1', 'P1', 5.0);
            monitor.endFrame(20);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('(50.0 FPS)'),
                expect.any(String),
            );
        });
    });

    describe('警告输出格式', () => {
        it('应该为慢速层级使用红色标记', () => {
            monitor.startFrame();
            monitor.recordSystem('SlowSystem', 'P1', 3.0);
            monitor.endFrame(20);

            // groupCollapsed 接收两个参数：字符串和颜色样式
            expect(consoleGroupSpy).toHaveBeenCalledWith(
                expect.stringContaining('P1:'),
                'color: #ff6b6b;',
            );
        });

        it('应该为正常层级使用绿色标记', () => {
            monitor.startFrame();
            monitor.recordSystem('FastSystem', 'P1', 1.0);
            monitor.endFrame(20);

            // P1 总耗时 1ms < 2ms，应该用绿色
            expect(consoleGroupSpy).toHaveBeenCalledWith(
                expect.stringContaining('P1:'),
                'color: #51cf66;',
            );
        });

        it('应该只显示耗时 > 0.5ms 的系统', () => {
            monitor.startFrame();
            monitor.recordSystem('SlowSystem', 'P1', 1.0);
            monitor.recordSystem('FastSystem', 'P1', 0.3);
            monitor.endFrame(20);

            // 只有 SlowSystem 被记录到日志
            const logCalls = consoleLogSpy.mock.calls;
            const hasSlowSystem = logCalls.some((call) =>
                call[0]?.includes?.('SlowSystem'),
            );
            const hasFastSystem = logCalls.some((call) =>
                call[0]?.includes?.('FastSystem'),
            );

            expect(hasSlowSystem).toBe(true);
            expect(hasFastSystem).toBe(false);
        });

        it('应该为耗时 > 2ms 的系统使用红色标记', () => {
            monitor.startFrame();
            monitor.recordSystem('SlowSystem', 'P1', 3.0);
            monitor.endFrame(20);

            // 第二个参数是颜色样式字符串
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('SlowSystem'),
                'color: #ff6b6b',
            );
        });

        it('应该为耗时 0.5-2ms 的系统使用黄色标记', () => {
            monitor.startFrame();
            monitor.recordSystem('MediumSystem', 'P1', 1.0);
            monitor.endFrame(20);

            // 第二个参数是颜色样式字符串
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('MediumSystem'),
                'color: #ffd43b',
            );
        });
    });
});
