/**
 * SpeedModifier组件测试
 *
 * TDD: RED → GREEN → REFACTOR
 *
 * 测试速度修正器组件的功能
 */

import { SpeedModifier } from '../../src/engine/components/meta';
import { Transform, Velocity, SpeedStat } from '../../src/engine/components';

describe('SpeedModifier组件', () => {
    describe('基本功能', () => {
        it('应该创建SpeedModifier组件', () => {
            // Arrange & Act
            const speedMod = new SpeedModifier({
                maxLinearOverride: 200
            });

            // Assert
            expect(speedMod).toBeDefined();
            expect(speedMod).toBeInstanceOf(SpeedModifier);
        });

        it('应该设置maxLinearOverride', () => {
            // Arrange & Act
            const speedMod = new SpeedModifier({
                maxLinearOverride: 300
            });

            // Assert
            expect(speedMod.maxLinearOverride).toBe(300);
        });

        it('应该设置maxAngularOverride', () => {
            // Arrange & Act
            const speedMod = new SpeedModifier({
                maxAngularOverride: 5
            });

            // Assert
            expect(speedMod.maxAngularOverride).toBe(5);
        });

        it('应该同时设置maxLinearOverride和maxAngularOverride', () => {
            // Arrange & Act
            const speedMod = new SpeedModifier({
                maxLinearOverride: 400,
                maxAngularOverride: 3
            });

            // Assert
            expect(speedMod.maxLinearOverride).toBe(400);
            expect(speedMod.maxAngularOverride).toBe(3);
        });

        it('应该设置默认duration为-1（持续到手动移除）', () => {
            // Arrange & Act
            const speedMod = new SpeedModifier({
                maxLinearOverride: 200
            });

            // Assert
            expect(speedMod.duration).toBe(-1);
        });

        it('应该设置自定义duration', () => {
            // Arrange & Act
            const speedMod = new SpeedModifier({
                maxLinearOverride: 200,
                duration: 5000
            });

            // Assert
            expect(speedMod.duration).toBe(5000);
        });

        it('应该初始化elapsed为0', () => {
            // Arrange & Act
            const speedMod = new SpeedModifier({
                maxLinearOverride: 200
            });

            // Assert
            expect(speedMod.elapsed).toBe(0);
        });
    });

    describe('类型检查', () => {
        it('应该通过SpeedModifier.check识别组件', () => {
            // Arrange
            const speedMod = new SpeedModifier({ maxLinearOverride: 200 });

            // Act & Assert
            expect(SpeedModifier.check(speedMod)).toBe(true);
            expect(SpeedModifier.check(new Transform({ x: 0, y: 0, rot: 0 }))).toBe(false);
            expect(SpeedModifier.check(new Velocity({ vx: 0, vy: 0, vrot: 0 }))).toBe(false);
            expect(SpeedModifier.check(null)).toBe(false);
            expect(SpeedModifier.check(undefined)).toBe(false);
        });
    });

    describe('使用场景', () => {
        it('应该支持Boss入场时临时提高速度', () => {
            // Arrange - Boss入场需要更高的速度
            const entranceSpeed = 150; // 像素/秒

            // Act - 创建速度修正器
            const speedMod = new SpeedModifier({
                maxLinearOverride: entranceSpeed
            });

            // Assert
            expect(speedMod.maxLinearOverride).toBe(entranceSpeed);
            expect(speedMod.duration).toBe(-1); // 持续到入场完成
        });

        it('应该支持有时间限制的速度加成', () => {
            // Arrange - Buff系统可能添加临时速度加成
            const boostDuration = 3000; // 3秒

            // Act
            const speedMod = new SpeedModifier({
                maxLinearOverride: 500,
                maxAngularOverride: 5,
                duration: boostDuration
            });

            // Assert
            expect(speedMod.duration).toBe(boostDuration);
            expect(speedMod.elapsed).toBe(0);
        });
    });

    describe('可选参数', () => {
        it('应该允许只设置maxLinearOverride', () => {
            // Arrange & Act
            const speedMod = new SpeedModifier({
                maxLinearOverride: 200
            });

            // Assert
            expect(speedMod.maxLinearOverride).toBe(200);
            expect(speedMod.maxAngularOverride).toBeUndefined();
        });

        it('应该允许只设置maxAngularOverride', () => {
            // Arrange & Act
            const speedMod = new SpeedModifier({
                maxAngularOverride: 4
            });

            // Assert
            expect(speedMod.maxLinearOverride).toBeUndefined();
            expect(speedMod.maxAngularOverride).toBe(4);
        });

        it('应该允许不设置任何override（纯计时器）', () => {
            // Arrange & Act
            const speedMod = new SpeedModifier({
                duration: 1000
            });

            // Assert
            expect(speedMod.maxLinearOverride).toBeUndefined();
            expect(speedMod.maxAngularOverride).toBeUndefined();
            expect(speedMod.duration).toBe(1000);
        });
    });
});
