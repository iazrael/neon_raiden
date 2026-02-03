/**
 * Blink组件测试
 *
 * TDD: RED → GREEN → REFACTOR
 *
 * 测试闪烁组件的功能
 */

import { Blink, BlinkMode, BlinkColors } from '../../src/engine/components/render';

describe('Blink组件', () => {
    describe('基本功能', () => {
        it('应该创建Blink组件', () => {
            // Arrange & Act
            const blink = new Blink({
                durationMs: 500,
                intervalMs: 100
            });

            // Assert
            expect(blink).toBeDefined();
            expect(blink).toBeInstanceOf(Blink);
        });

        it('应该设置durationMs', () => {
            // Arrange & Act
            const blink = new Blink({
                durationMs: 1000,
                intervalMs: 100
            });

            // Assert
            expect(blink.durationMs).toBe(1000);
        });

        it('应该设置intervalMs', () => {
            // Arrange & Act
            const blink = new Blink({
                durationMs: 500,
                intervalMs: 150
            });

            // Assert
            expect(blink.intervalMs).toBe(150);
        });

        it('应该初始化elapsedMs为0', () => {
            // Arrange & Act
            const blink = new Blink({
                durationMs: 500,
                intervalMs: 100
            });

            // Assert
            expect(blink.elapsedMs).toBe(0);
        });
    });

    describe('默认值', () => {
        it('应该使用默认的HARD模式', () => {
            // Arrange & Act
            const blink = new Blink({
                durationMs: 500,
                intervalMs: 100
            });

            // Assert
            expect(blink.mode).toBe(BlinkMode.HARD);
        });

        it('应该使用默认的白色闪烁颜色', () => {
            // Arrange & Act
            const blink = new Blink({
                durationMs: 500,
                intervalMs: 100
            });

            // Assert
            expect(blink.colors.visible).toBe('#ffffff');
            expect(blink.colors.hidden).toBe('transparent');
        });
    });

    describe('自定义配置', () => {
        it('应该设置自定义颜色', () => {
            // Arrange
            const customColors: BlinkColors = {
                visible: '#FFD700',
                hidden: 'rgba(255,215,0,0.2)'
            };

            // Act
            const blink = new Blink({
                durationMs: 500,
                intervalMs: 100,
                colors: customColors
            });

            // Assert
            expect(blink.colors).toEqual(customColors);
        });

        it('应该设置SOFT模式', () => {
            // Arrange & Act
            const blink = new Blink({
                durationMs: 500,
                intervalMs: 100,
                mode: BlinkMode.SOFT
            });

            // Assert
            expect(blink.mode).toBe(BlinkMode.SOFT);
        });

        it('应该同时设置所有参数', () => {
            // Arrange
            const customColors: BlinkColors = {
                visible: '#00ffff',
                hidden: 'rgba(0,255,255,0.1)'
            };

            // Act
            const blink = new Blink({
                durationMs: 3000,
                intervalMs: 150,
                colors: customColors,
                mode: BlinkMode.SOFT
            });

            // Assert
            expect(blink.durationMs).toBe(3000);
            expect(blink.intervalMs).toBe(150);
            expect(blink.colors).toEqual(customColors);
            expect(blink.mode).toBe(BlinkMode.SOFT);
        });
    });

    describe('类型检查', () => {
        it('应该通过Blink.check识别组件', () => {
            // Arrange
            const blink = new Blink({ durationMs: 500, intervalMs: 100 });

            // Act & Assert
            expect(Blink.check(blink)).toBe(true);
            expect(Blink.check(null)).toBe(false);
            expect(Blink.check(undefined)).toBe(false);
        });
    });

    describe('使用场景', () => {
        it('应该支持受伤闪烁效果', () => {
            // Arrange - 受伤时短暂闪烁
            const hitDuration = 500; // 0.5秒
            const hitInterval = 100; // 快速闪烁

            // Act
            const blink = new Blink({
                durationMs: hitDuration,
                intervalMs: hitInterval,
                colors: { visible: '#ffffff', hidden: 'rgba(255,255,255,0.1)' },
                mode: BlinkMode.HARD
            });

            // Assert
            expect(blink.durationMs).toBe(hitDuration);
            expect(blink.intervalMs).toBe(hitInterval);
            expect(blink.mode).toBe(BlinkMode.HARD);
        });

        it('应该支持无敌状态闪烁', () => {
            // Arrange - 无敌状态持续闪烁
            const invulnDuration = 5000; // 5秒
            const invulnInterval = 150; // 中等速度

            // Act
            const blink = new Blink({
                durationMs: invulnDuration,
                intervalMs: invulnInterval,
                colors: { visible: '#FFD700', hidden: 'rgba(255,215,0,0.2)' },
                mode: BlinkMode.SOFT
            });

            // Assert
            expect(blink.durationMs).toBe(invulnDuration);
            expect(blink.colors.visible).toBe('#FFD700');
            expect(blink.mode).toBe(BlinkMode.SOFT);
        });

        it('应该支持升级效果闪烁', () => {
            // Arrange - 升级时短暂快速闪烁
            const levelUpDuration = 300; // 0.3秒
            const levelUpInterval = 80; // 快速闪烁

            // Act
            const blink = new Blink({
                durationMs: levelUpDuration,
                intervalMs: levelUpInterval,
                colors: { visible: '#00ffff', hidden: 'transparent' },
                mode: BlinkMode.HARD
            });

            // Assert
            expect(blink.durationMs).toBe(levelUpDuration);
            expect(blink.intervalMs).toBe(levelUpInterval);
        });
    });

    describe('边界条件', () => {
        it('应该支持极短的持续时间', () => {
            // Arrange & Act
            const blink = new Blink({
                durationMs: 50,
                intervalMs: 25
            });

            // Assert
            expect(blink.durationMs).toBe(50);
        });

        it('应该支持极长的持续时间', () => {
            // Arrange & Act
            const blink = new Blink({
                durationMs: 60000, // 1分钟
                intervalMs: 500
            });

            // Assert
            expect(blink.durationMs).toBe(60000);
        });

        it('应该支持interval大于duration', () => {
            // Arrange & Act - 不常见但合法
            const blink = new Blink({
                durationMs: 100,
                intervalMs: 500
            });

            // Assert
            expect(blink.durationMs).toBe(100);
            expect(blink.intervalMs).toBe(500);
        });
    });
});
