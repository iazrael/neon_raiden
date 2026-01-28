/**
 * ECS辅助函数测试
 *
 * TDD: RED → GREEN → REFACTOR
 *
 * 测试 getComponents, removeComponentByType, removeComponentIfExists
 */

import { World } from '../../src/engine/types';
import { createWorld, addComponent, getComponents, removeComponentByType, removeComponentIfExists } from '../../src/engine/world';
import { Transform, Velocity, BossTag, Health, MoveIntent } from '../../src/engine/components';

describe('ECS辅助函数', () => {
    let world: World;
    let entityId: number;

    beforeEach(() => {
        world = createWorld();
        world.entities.set(1, []);
        entityId = 1;
    });

    describe('getComponents - 一次性获取多个组件', () => {
        it('应该返回正确的组件元组（所有组件都存在）', () => {
            // Arrange - 添加组件
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            const velocity = new Velocity({ vx: 10, vy: 20 });
            addComponent(world, entityId, transform);
            addComponent(world, entityId, velocity);

            // Act - 获取组件
            const [comp1, comp2] = getComponents(world, entityId, Transform, Velocity);

            // Assert - 验证返回值
            expect(comp1).toBe(transform);
            expect(comp2).toBe(velocity);
        });

        it('应该返回 undefined 对于不存在的组件', () => {
            // Arrange - 只添加一个组件
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            addComponent(world, entityId, transform);

            // Act - 获取多个组件
            const [comp1, comp2] = getComponents(world, entityId, Transform, Velocity);

            // Assert
            expect(comp1).toBe(transform);
            expect(comp2).toBeUndefined();
        });

        it('应该返回全 undefined 对于不存在的实体', () => {
            // Act - 获取不存在的实体的组件
            const [comp1, comp2] = getComponents(world, 999, Transform, Velocity);

            // Assert
            expect(comp1).toBeUndefined();
            expect(comp2).toBeUndefined();
        });

        it('应该正确推导类型', () => {
            // Arrange
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            addComponent(world, entityId, transform);

            // Act
            const [comp] = getComponents(world, entityId, Transform);

            // Assert - TypeScript应该推导出 comp 是 Transform | undefined
            expect(comp).toBeDefined();
            if (comp) {
                // 如果编译通过，类型推导正确
                expect(comp.x).toBe(100);
            }
        });

        it('应该支持获取3个以上的组件', () => {
            // Arrange
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            const velocity = new Velocity({ vx: 10, vy: 20 });
            const health = new Health({ current: 100, max: 100 });
            addComponent(world, entityId, transform);
            addComponent(world, entityId, velocity);
            addComponent(world, entityId, health);

            // Act
            const [comp1, comp2, comp3] = getComponents(world, entityId, Transform, Velocity, Health);

            // Assert
            expect(comp1).toBe(transform);
            expect(comp2).toBe(velocity);
            expect(comp3).toBe(health);
        });

        it('应该返回部分 undefined 当部分组件不存在', () => {
            // Arrange
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            const health = new Health({ current: 100, max: 100 });
            addComponent(world, entityId, transform);
            addComponent(world, entityId, health);

            // Act
            const [comp1, comp2, comp3] = getComponents(world, entityId, Transform, Velocity, Health);

            // Assert
            expect(comp1).toBe(transform);
            expect(comp2).toBeUndefined(); // Velocity不存在
            expect(comp3).toBe(health);
        });
    });

    describe('removeComponentByType - 按类型移除组件', () => {
        it('应该移除指定类型的组件', () => {
            // Arrange
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            const velocity = new Velocity({ vx: 10, vy: 20 });
            addComponent(world, entityId, transform);
            addComponent(world, entityId, velocity);

            // Act - 移除 Transform
            const removed = removeComponentByType(world, entityId, Transform);

            // Assert
            expect(removed).toBe(true);
            const comps = world.entities.get(entityId)!;
            expect(comps).toHaveLength(1);
            expect(comps[0]).toBe(velocity);
        });

        it('应该返回 false 当组件不存在', () => {
            // Arrange
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            addComponent(world, entityId, transform);

            // Act - 尝试移除不存在的组件
            const removed = removeComponentByType(world, entityId, Velocity);

            // Assert
            expect(removed).toBe(false);
            expect(world.entities.get(entityId)).toHaveLength(1);
        });

        it('应该返回 false 当实体不存在', () => {
            // Act - 尝试从不存在的实体移除组件
            const removed = removeComponentByType(world, 999, Transform);

            // Assert
            expect(removed).toBe(false);
        });

        it('应该只移除第一个匹配的组件', () => {
            // Arrange - 添加两个相同类型的组件（虽然不符合ECS，但测试应该覆盖）
            const transform1 = new Transform({ x: 100, y: 200, rot: 0 });
            const transform2 = new Transform({ x: 50, y: 50, rot: 0 });
            addComponent(world, entityId, transform1);
            addComponent(world, entityId, transform2);

            // Act
            const removed = removeComponentByType(world, entityId, Transform);

            // Assert
            expect(removed).toBe(true);
            const comps = world.entities.get(entityId)!;
            expect(comps).toHaveLength(1);
            expect(comps[0]).toBe(transform2); // 第二个还在
        });
    });

    describe('removeComponentIfExists - 安全移除组件', () => {
        it('应该移除组件如果存在', () => {
            // Arrange
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            addComponent(world, entityId, transform);

            // Act - 不应该抛出错误
            expect(() => {
                removeComponentIfExists(world, entityId, Transform);
            }).not.toThrow();

            // Assert
            expect(world.entities.get(entityId)).toHaveLength(0);
        });

        it('应该不抛出错误当组件不存在', () => {
            // Arrange
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            addComponent(world, entityId, transform);

            // Act - 尝试移除不存在的组件
            expect(() => {
                removeComponentIfExists(world, entityId, Velocity);
            }).not.toThrow();

            // Assert
            expect(world.entities.get(entityId)).toHaveLength(1);
        });

        it('应该不抛出错误当实体不存在', () => {
            // Act - 不应该抛出错误
            expect(() => {
                removeComponentIfExists(world, 999, Transform);
            }).not.toThrow();
        });

        it('应该可以链式调用移除多个组件', () => {
            // Arrange
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            const velocity = new Velocity({ vx: 10, vy: 20 });
            const health = new Health({ current: 100, max: 100 });
            addComponent(world, entityId, transform);
            addComponent(world, entityId, velocity);
            addComponent(world, entityId, health);

            // Act - 链式移除
            removeComponentIfExists(world, entityId, Transform);
            removeComponentIfExists(world, entityId, Velocity);
            removeComponentIfExists(world, entityId, BossTag); // 不存在

            // Assert
            const comps = world.entities.get(entityId)!;
            expect(comps).toHaveLength(1);
            expect(comps[0]).toBe(health);
        });
    });

    describe('实际使用场景', () => {
        it('应该简化Boss入场系统的组件操作', () => {
            // Arrange - 模拟Boss实体
            const transform = new Transform({ x: 400, y: -150, rot: 0 });
            const velocity = new Velocity({ vx: 0, vy: 0 });
            const moveIntent = new MoveIntent({ dx: 0, dy: 150, type: 'velocity' });
            addComponent(world, entityId, transform);
            addComponent(world, entityId, velocity);
            addComponent(world, entityId, moveIntent);

            // Act - 使用新API一次性获取和移除
            const [trans, vel, intent] = getComponents(world, entityId, Transform, Velocity, MoveIntent);

            // 验证获取成功
            expect(trans).toBeDefined();
            expect(vel).toBeDefined();
            expect(intent).toBeDefined();

            // 移除MoveIntent
            removeComponentByType(world, entityId, MoveIntent);

            // 验证移除成功
            const [, , afterRemove] = getComponents(world, entityId, Transform, Velocity, MoveIntent);
            expect(afterRemove).toBeUndefined();
        });

        it('应该处理部分组件缺失的情况', () => {
            // Arrange
            const transform = new Transform({ x: 400, y: -150, rot: 0 });
            addComponent(world, entityId, transform);

            // Act - 尝试获取多个组件，部分不存在
            const [trans, vel, intent] = getComponents(world, entityId, Transform, Velocity, MoveIntent);

            // Assert - 应该不抛出错误，缺失的为undefined
            expect(trans).toBeDefined();
            expect(vel).toBeUndefined();
            expect(intent).toBeUndefined();

            // 移除操作也不应该报错
            expect(() => {
                removeComponentIfExists(world, entityId, Velocity);
                removeComponentIfExists(world, entityId, MoveIntent);
            }).not.toThrow();
        });
    });
});
