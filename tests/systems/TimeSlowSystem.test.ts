/**
 * TimeSlowSystem 单元测试
 * 测试时间减速系统的核心功能
 */

import { createWorld, generateId, addComponent } from '../../src/engine/world';
import { TimeSlowSystem } from '../../src/engine/systems/TimeSlowSystem';
import { Transform, TimeSlow, Lifetime, PlayerTag, Velocity } from '../../src/engine/components';

describe('TimeSlowSystem', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
        world.timeScale = 1.0; // 初始化为正常速度
    });

    describe('基础功能', () => {
        it('应该设置 timeScale 为 0.5 当 TimeSlow 实体存在', () => {
            const timeSlowId = generateId();
            world.entities.set(timeSlowId, []);
            addComponent(world, timeSlowId, new TimeSlow({ scale: 0.5 }));

            TimeSlowSystem(world);

            expect(world.timeScale).toBe(0.5);
        });

        it('应该重置 timeScale 为 1.0 当 TimeSlow 实体不存在', () => {
            world.timeScale = 0.5; // 先设置为减速状态

            TimeSlowSystem(world);

            expect(world.timeScale).toBe(1.0);
        });

        it('应该保持 timeScale 为 1.0 当没有 TimeSlow 实体', () => {
            world.timeScale = 1.0;

            TimeSlowSystem(world);

            expect(world.timeScale).toBe(1.0);
        });
    });

    describe('边界情况处理', () => {
        it('应该限制 timeScale 在 0.1-2.0 范围内', () => {
            const timeSlowId = generateId();
            world.entities.set(timeSlowId, []);
            addComponent(world, timeSlowId, new TimeSlow({ scale: 5.0 })); // 异常值

            TimeSlowSystem(world);

            expect(world.timeScale).toBe(2.0); // 限制到最大值
        });

        it('应该处理 scale 为 0 的情况', () => {
            const timeSlowId = generateId();
            world.entities.set(timeSlowId, []);
            addComponent(world, timeSlowId, new TimeSlow({ scale: 0 }));

            TimeSlowSystem(world);

            expect(world.timeScale).toBe(0.1); // 限制到最小值
        });

        it('应该处理负数 scale', () => {
            const timeSlowId = generateId();
            world.entities.set(timeSlowId, []);
            addComponent(world, timeSlowId, new TimeSlow({ scale: -1.0 }));

            TimeSlowSystem(world);

            expect(world.timeScale).toBe(0.1); // 限制到最小值
        });
    });

    describe(' Lifetime 集成', () => {
        it('应该与 Lifetime 组件配合工作', () => {
            const timeSlowId = generateId();
            world.entities.set(timeSlowId, []);
            addComponent(world, timeSlowId, new TimeSlow({ scale: 0.5 }));
            addComponent(world, timeSlowId, new Lifetime({ timer: 5.0 }));

            TimeSlowSystem(world);

            expect(world.timeScale).toBe(0.5);
        });

        it('应该使用第一个 TimeSlow 实体（如果存在多个）', () => {
            const id1 = generateId();
            const id2 = generateId();

            world.entities.set(id1, []);
            addComponent(world, id1, new TimeSlow({ scale: 0.5 }));
            addComponent(world, id1, new Lifetime({ timer: 5.0 }));

            world.entities.set(id2, []);
            addComponent(world, id2, new TimeSlow({ scale: 0.3 })); // 这个应该被忽略

            TimeSlowSystem(world);

            expect(world.timeScale).toBe(0.5); // 使用第一个
        });
    });

    describe('场景测试', () => {
        it('应该模拟完整的时间减速流程', () => {
            // 1. 创建 TimeSlow 实体
            const timeSlowId = generateId();
            world.entities.set(timeSlowId, []);
            addComponent(world, timeSlowId, new TimeSlow({ scale: 0.5 }));
            addComponent(world, timeSlowId, new Lifetime({ timer: 5.0 }));

            // 2. 检查 timeScale 被设置
            TimeSlowSystem(world);
            expect(world.timeScale).toBe(0.5);

            // 3. 模拟 Lifetime 倒计时结束，移除实体
            world.entities.delete(timeSlowId);

            // 4. 检查 timeScale 被重置
            TimeSlowSystem(world);
            expect(world.timeScale).toBe(1.0);
        });

        it('应该支持多次拾取刷新 Lifetime', () => {
            const timeSlowId = generateId();
            world.entities.set(timeSlowId, []);
            addComponent(world, timeSlowId, new TimeSlow({ scale: 0.5 }));
            const lifetime = new Lifetime({ timer: 5.0 });
            addComponent(world, timeSlowId, lifetime);

            TimeSlowSystem(world);
            expect(world.timeScale).toBe(0.5);

            // 刷新 Lifetime
            lifetime.timer = 5.0;

            TimeSlowSystem(world);
            expect(world.timeScale).toBe(0.5); // 仍然生效
        });
    });
});
