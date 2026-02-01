/**
 * ECS辅助函数测试
 *
 * TDD: RED → GREEN → REFACTOR
 *
 * 测试 getComponents, removeTypes
 */

import type { World } from '../../src/engine/world';
import { createWorld, addComponent, getComponents, removeTypes, ensureComponent } from '../../src/engine/world';
import { Transform, Velocity, BossTag, Health, MoveIntent, Shield } from '../../src/engine/components';

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
            const [comp1, comp2] = getComponents(world, entityId, [Transform, Velocity]);

            // Assert - 验证返回值
            expect(comp1).toBe(transform);
            expect(comp2).toBe(velocity);
        });

        it('应该返回 undefined 对于不存在的组件', () => {
            // Arrange - 只添加一个组件
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            addComponent(world, entityId, transform);

            // Act - 获取多个组件
            const [comp1, comp2] = getComponents(world, entityId, [Transform, Velocity]);

            // Assert
            expect(comp1).toBe(transform);
            expect(comp2).toBeUndefined();
        });

        it('应该返回全 undefined 对于不存在的实体', () => {
            // Act - 获取不存在的实体的组件
            const [comp1, comp2] = getComponents(world, 999, [Transform, Velocity]);

            // Assert
            expect(comp1).toBeUndefined();
            expect(comp2).toBeUndefined();
        });

        it('应该正确推导类型', () => {
            // Arrange
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            addComponent(world, entityId, transform);

            // Act
            const [comp] = getComponents(world, entityId, [Transform]);

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
            const health = new Health({ hp: 100, max: 100 });
            addComponent(world, entityId, transform);
            addComponent(world, entityId, velocity);
            addComponent(world, entityId, health);

            // Act
            const [comp1, comp2, comp3] = getComponents(world, entityId, [Transform, Velocity, Health]);

            // Assert
            expect(comp1).toBe(transform);
            expect(comp2).toBe(velocity);
            expect(comp3).toBe(health);
        });

        it('应该返回部分 undefined 当部分组件不存在', () => {
            // Arrange
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            const health = new Health({ hp: 100, max: 100 });
            addComponent(world, entityId, transform);
            addComponent(world, entityId, health);

            // Act
            const [comp1, comp2, comp3] = getComponents(world, entityId, [Transform, Velocity, Health]);

            // Assert
            expect(comp1).toBe(transform);
            expect(comp2).toBeUndefined(); // Velocity不存在
            expect(comp3).toBe(health);
        });
    });

    describe('removeTypes - 按类型移除组件', () => {
        it('应该移除指定类型的组件', () => {
            // Arrange
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            const velocity = new Velocity({ vx: 10, vy: 20 });
            addComponent(world, entityId, transform);
            addComponent(world, entityId, velocity);

            // Act - 移除 Transform
            const [removed] = removeTypes(world, entityId, [Transform]);

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
            const [removed] = removeTypes(world, entityId, [Velocity]);

            // Assert
            expect(removed).toBe(false);
            expect(world.entities.get(entityId)).toHaveLength(1);
        });

        it('应该返回全 false 当实体不存在', () => {
            // Act - 尝试从不存在的实体移除组件
            const [removed] = removeTypes(world, 999, [Transform]);

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
            const [removed] = removeTypes(world, entityId, [Transform]);

            // Assert
            expect(removed).toBe(true);
            const comps = world.entities.get(entityId)!;
            expect(comps).toHaveLength(1);
            expect(comps[0]).toBe(transform2); // 第二个还在
        });

        it('应该支持批量移除多个组件', () => {
            // Arrange
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            const velocity = new Velocity({ vx: 10, vy: 20 });
            const health = new Health({ hp: 100, max: 100 });
            addComponent(world, entityId, transform);
            addComponent(world, entityId, velocity);
            addComponent(world, entityId, health);

            // Act - 批量移除 Transform 和 Velocity
            const [removed1, removed2] = removeTypes(world, entityId, [Transform, Velocity]);

            // Assert
            expect(removed1).toBe(true);
            expect(removed2).toBe(true);
            const comps = world.entities.get(entityId)!;
            expect(comps).toHaveLength(1);
            expect(comps[0]).toBe(health);
        });

        it('应该返回部分 false 当部分组件不存在', () => {
            // Arrange
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            const health = new Health({ hp: 100, max: 100 });
            addComponent(world, entityId, transform);
            addComponent(world, entityId, health);

            // Act - 移除存在的和不存在的组件
            const results = removeTypes(world, entityId, [Transform, Velocity]);

            // Assert
            expect(results).toEqual([true, false]);
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
            const [trans, vel, intent] = getComponents(world, entityId, [Transform, Velocity, MoveIntent]);

            // 验证获取成功
            expect(trans).toBeDefined();
            expect(vel).toBeDefined();
            expect(intent).toBeDefined();

            // 移除MoveIntent
            const [removed] = removeTypes(world, entityId, [MoveIntent]);

            // 验证移除成功
            expect(removed).toBe(true);
            const [, , afterRemove] = getComponents(world, entityId, [Transform, Velocity, MoveIntent]);
            expect(afterRemove).toBeUndefined();
        });

        it('应该处理部分组件缺失的情况', () => {
            // Arrange
            const transform = new Transform({ x: 400, y: -150, rot: 0 });
            addComponent(world, entityId, transform);

            // Act - 尝试获取多个组件，部分不存在
            const [trans, vel, intent] = getComponents(world, entityId, [Transform, Velocity, MoveIntent]);

            // Assert - 应该不抛出错误，缺失的为undefined
            expect(trans).toBeDefined();
            expect(vel).toBeUndefined();
            expect(intent).toBeUndefined();

            // 移除操作也不应该报错
            const results = removeTypes(world, entityId, [Velocity, MoveIntent]);
            expect(results).toEqual([false, false]);
        });

        it('应该演示批量移除的优势', () => {
            // Arrange - Boss入场完成后需要清理多个组件
            const transform = new Transform({ x: 400, y: 150, rot: 0 });
            const moveIntent = new MoveIntent({ dx: 0, dy: 150, type: 'velocity' });
            addComponent(world, entityId, transform);
            addComponent(world, entityId, moveIntent);

            // Act - 一次性移除多个组件
            const results = removeTypes(world, entityId, [MoveIntent]);

            // Assert
            expect(results).toEqual([true]);
            const [trans, intent] = getComponents(world, entityId, [Transform, MoveIntent]);
            expect(trans).toBeDefined();
            expect(intent).toBeUndefined();
        });
    });

    describe('ensureComponent - 确保组件存在', () => {
        it('应该返回已存在的组件,忽略配置参数', () => {
            // Arrange - 添加一个 Health 组件
            const health = new Health({ hp: 50, max: 100 });
            addComponent(world, entityId, health);

            // Act - 尝试"确保"组件存在,传入不同配置
            const result = ensureComponent(world, entityId, Health, { hp: 200, max: 300 });

            // Assert - 应该返回原实例,配置被忽略
            expect(result).toBe(health);
            expect(result.hp).toBe(50);
            expect(result.max).toBe(100);
        });

        it('应该在实体不存在时自动创建实体并添加组件', () => {
            // Arrange - 实体不存在
            const newId = 999;
            expect(world.entities.has(newId)).toBe(false);

            // Act - 确保组件存在
            const velocity = ensureComponent(world, newId, Velocity, { vx: 100, vy: 200 });

            // Assert - 实体和组件都应该被创建
            expect(world.entities.has(newId)).toBe(true);
            expect(velocity.vx).toBe(100);
            expect(velocity.vy).toBe(200);
            expect(velocity.vrot).toBe(0); // 默认值
        });

        it('应该在组件不存在时创建新组件', () => {
            // Arrange - 添加一个不同类型的组件
            const transform = new Transform({ x: 0, y: 0 });
            addComponent(world, entityId, transform);

            // Act - 确保 Health 组件存在
            const health = ensureComponent(world, entityId, Health, { hp: 100, max: 100 });

            // Assert - 应该创建新组件并添加到实体
            const comps = world.entities.get(entityId)!;
            expect(comps.length).toBe(2);
            expect(comps.some(c => c instanceof Health)).toBe(true);
            expect(health.hp).toBe(100);
            expect(health.max).toBe(100);
        });

        it('应该支持空配置对象', () => {
            // Arrange
            const newId = 888;

            // Act - Velocity 的所有参数都有默认值
            const velocity = ensureComponent(world, newId, Velocity, {});

            // Assert
            expect(velocity.vx).toBe(0);
            expect(velocity.vy).toBe(0);
            expect(velocity.vrot).toBe(0);
        });

        it('应该正确推导返回类型', () => {
            // Arrange
            const newId = 777;

            // Act
            const shield = ensureComponent(world, newId, Shield, { value: 50, max: 50 });

            // Assert - TypeScript 应该推导出 shield 是 Shield 类型
            expect(shield).toBeDefined();
            expect(shield.value).toBe(50);
            expect(shield.max).toBe(50);
            // 如果编译通过,类型推导正确
            expect(shield instanceof Shield).toBe(true);
        });

        it('应该支持多次调用返回同一个实例', () => {
            // Arrange
            const newId = 666;

            // Act - 多次调用 ensureComponent
            const first = ensureComponent(world, newId, Health, { hp: 100, max: 100 });
            const second = ensureComponent(world, newId, Health, { hp: 200, max: 200 });
            const third = ensureComponent(world, newId, Health, { hp: 300, max: 300 });

            // Assert - 所有调用应该返回同一个实例
            expect(first).toBe(second);
            expect(second).toBe(third);
            expect(first.hp).toBe(100); // 原始值不变
        });

        it('应该与已有的 addComponent 配合使用', () => {
            // Arrange - 使用 addComponent 添加组件
            const transform = new Transform({ x: 100, y: 200 });
            addComponent(world, entityId, transform);

            // Act - 使用 ensureComponent 添加另一个组件
            const velocity = ensureComponent(world, entityId, Velocity, { vx: 10, vy: 20 });

            // Assert - 两个组件都应该存在
            const [trans, vel] = getComponents(world, entityId, [Transform, Velocity]);
            expect(trans).toBe(transform);
            expect(vel).toBe(velocity);
        });
    });
});
