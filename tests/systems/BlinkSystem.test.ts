/**
 * BlinkSystem 单元测试
 *
 * TDD: RED → GREEN → REFACTOR
 *
 * 测试闪烁系统的功能
 */

import { createWorld, generateId, World, addComponent, hasComponent } from '../../src/engine/world';
import { BlinkSystem } from '../../src/engine/systems/BlinkSystem';
import { Blink, BlinkMode } from '../../src/engine/components/visual';

describe('BlinkSystem', () => {
    let world: World;

    beforeEach(() => {
        world = createWorld();
    });

    describe('基本更新', () => {
        it('应该增加Blink组件的elapsedMs', () => {
            // Arrange
            const entityId = generateId();
            const blink = new Blink({ durationMs: 500, intervalMs: 100 });
            addComponent(world, entityId, blink);

            // Act
            BlinkSystem(world, 100);

            // Assert
            expect(blink.elapsedMs).toBe(100);
        });

        it('应该多次调用累加elapsedMs', () => {
            // Arrange
            const entityId = generateId();
            const blink = new Blink({ durationMs: 500, intervalMs: 100 });
            addComponent(world, entityId, blink);

            // Act
            BlinkSystem(world, 100);
            BlinkSystem(world, 50);
            BlinkSystem(world, 75);

            // Assert
            expect(blink.elapsedMs).toBe(225);
        });

        it('应该处理deltaTimeMs为0的情况', () => {
            // Arrange
            const entityId = generateId();
            const blink = new Blink({ durationMs: 500, intervalMs: 100 });
            addComponent(world, entityId, blink);

            // Act
            BlinkSystem(world, 0);

            // Assert
            expect(blink.elapsedMs).toBe(0);
        });
    });

    describe('组件移除', () => {
        it('应该在闪烁完成后移除Blink组件', () => {
            // Arrange
            const entityId = generateId();
            const blink = new Blink({ durationMs: 500, intervalMs: 100 });
            addComponent(world, entityId, blink);

            // Act - 更新超过durationMs
            BlinkSystem(world, 500);

            // Assert - 组件应该被移除
            expect(hasComponent(world, entityId, Blink)).toBe(false);
        });

        it('应该在elapsedMs刚好等于durationMs时移除组件', () => {
            // Arrange
            const entityId = generateId();
            const blink = new Blink({ durationMs: 500, intervalMs: 100 });
            addComponent(world, entityId, blink);
            blink.elapsedMs = 400; // 接近完成

            // Act
            BlinkSystem(world, 100); // 400 + 100 = 500

            // Assert
            expect(hasComponent(world, entityId, Blink)).toBe(false);
        });

        it('应该在elapsedMs刚好等于durationMs时移除组件（一次性更新）', () => {
            // Arrange
            const entityId = generateId();
            const blink = new Blink({ durationMs: 500, intervalMs: 100 });
            addComponent(world, entityId, blink);

            // Act - 一次性更新超过duration
            BlinkSystem(world, 500);

            // Assert
            expect(hasComponent(world, entityId, Blink)).toBe(false);
        });

        it('应该在闪烁完成前保留组件', () => {
            // Arrange
            const entityId = generateId();
            const blink = new Blink({ durationMs: 500, intervalMs: 100 });
            addComponent(world, entityId, blink);

            // Act - 更新但未完成
            BlinkSystem(world, 400);

            // Assert
            expect(hasComponent(world, entityId, Blink)).toBe(true);
        });

        it('应该一次性更新超过duration时立即移除', () => {
            // Arrange
            const entityId = generateId();
            const blink = new Blink({ durationMs: 500, intervalMs: 100 });
            addComponent(world, entityId, blink);

            // Act - 一次性更新超过duration
            BlinkSystem(world, 1000);

            // Assert
            expect(hasComponent(world, entityId, Blink)).toBe(false);
        });
    });

    describe('多实体处理', () => {
        it('应该同时更新多个实体的Blink组件', () => {
            // Arrange
            const id1 = generateId();
            const id2 = generateId();
            const id3 = generateId();
            const blink1 = new Blink({ durationMs: 500, intervalMs: 100 });
            const blink2 = new Blink({ durationMs: 300, intervalMs: 100 });
            const blink3 = new Blink({ durationMs: 1000, intervalMs: 100 });
            addComponent(world, id1, blink1);
            addComponent(world, id2, blink2);
            addComponent(world, id3, blink3);

            // Act
            BlinkSystem(world, 200);

            // Assert
            expect(blink1.elapsedMs).toBe(200);
            expect(blink2.elapsedMs).toBe(200);
            expect(blink3.elapsedMs).toBe(200);
        });

        it('应该分别移除已完成和未完成的组件', () => {
            // Arrange
            const id1 = generateId();
            const id2 = generateId();
            const blink1 = new Blink({ durationMs: 200, intervalMs: 100 }); // 将完成
            const blink2 = new Blink({ durationMs: 500, intervalMs: 100 }); // 未完成
            addComponent(world, id1, blink1);
            addComponent(world, id2, blink2);

            // Act
            BlinkSystem(world, 250);

            // Assert
            expect(hasComponent(world, id1, Blink)).toBe(false); // 已移除
            expect(hasComponent(world, id2, Blink)).toBe(true); // 仍在
        });
    });

    describe('边界情况', () => {
        it('没有Blink组件时不应该崩溃', () => {
            // Arrange & Act & Assert
            expect(() => BlinkSystem(world, 16)).not.toThrow();
        });

        it('应该处理极小的deltaTimeMs', () => {
            // Arrange
            const entityId = generateId();
            const blink = new Blink({ durationMs: 500, intervalMs: 100 });
            addComponent(world, entityId, blink);

            // Act
            BlinkSystem(world, 1);

            // Assert
            expect(blink.elapsedMs).toBe(1);
        });

        it('应该处理极长的deltaTimeMs', () => {
            // Arrange
            const entityId = generateId();
            const blink = new Blink({ durationMs: 500, intervalMs: 100 });
            addComponent(world, entityId, blink);

            // Act
            BlinkSystem(world, 100000);

            // Assert - 组件应被移除
            expect(hasComponent(world, entityId, Blink)).toBe(false);
        });
    });

    describe('不同配置的Blink组件', () => {
        it('应该正确处理HARD模式的组件', () => {
            // Arrange
            const entityId = generateId();
            const blink = new Blink({
                durationMs: 500,
                intervalMs: 100,
                mode: BlinkMode.HARD
            });
            addComponent(world, entityId, blink);

            // Act
            BlinkSystem(world, 250);

            // Assert
            expect(blink.elapsedMs).toBe(250);
            expect(blink.mode).toBe(BlinkMode.HARD);
        });

        it('应该正确处理SOFT模式的组件', () => {
            // Arrange
            const entityId = generateId();
            const blink = new Blink({
                durationMs: 500,
                intervalMs: 100,
                mode: BlinkMode.SOFT
            });
            addComponent(world, entityId, blink);

            // Act
            BlinkSystem(world, 250);

            // Assert
            expect(blink.elapsedMs).toBe(250);
            expect(blink.mode).toBe(BlinkMode.SOFT);
        });

        it('应该正确处理自定义颜色的组件', () => {
            // Arrange
            const entityId = generateId();
            const blink = new Blink({
                durationMs: 500,
                intervalMs: 100,
                colors: { visible: '#FFD700', hidden: 'rgba(255,215,0,0.2)' }
            });
            addComponent(world, entityId, blink);

            // Act
            BlinkSystem(world, 250);

            // Assert
            expect(blink.elapsedMs).toBe(250);
            expect(blink.colors.visible).toBe('#FFD700');
        });
    });
});
