/**
 * BounceSystem 单元测试
 * 测试子弹屏幕边界反弹逻辑
 */

import { createWorld, generateId, addComponent } from '../../src/engine/world';
import { BounceSystem } from '../../src/engine/systems/BounceSystem';
import { Transform, Velocity, Bounce } from '../../src/engine/components';

describe('BounceSystem', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
    });

    describe('左右边界反弹', () => {
        it('应该在左边界（x < 0）反弹', () => {
            const bulletId = generateId();
            world.entities.set(bulletId, []);
            addComponent(world, bulletId, new Transform({ x: -10, y: 300, rot: 0 }));
            addComponent(world, bulletId, new Velocity({ vx: -100, vy: 0 }));
            addComponent(world, bulletId, new Bounce({ bouncesLeft: 3 }));

            BounceSystem(world, 16);

            const transform = world.entities.get(bulletId)!.find(c => c instanceof Transform) as Transform;
            const velocity = world.entities.get(bulletId)!.find(c => c instanceof Velocity) as Velocity;
            const bounce = world.entities.get(bulletId)!.find(c => c instanceof Bounce) as Bounce;

            expect(transform.x).toBe(0); // 位置修正到边界
            expect(velocity.vx).toBe(100); // 速度反转
            expect(bounce.hasBounced).toBe(true);
            expect(bounce.bouncesLeft).toBe(2); // 反弹次数减1
        });

        it('应该在右边界（x > screenWidth）反弹', () => {
            const bulletId = generateId();
            world.entities.set(bulletId, []);
            addComponent(world, bulletId, new Transform({ x: 810, y: 300, rot: 0 }));
            addComponent(world, bulletId, new Velocity({ vx: 100, vy: 0 }));
            addComponent(world, bulletId, new Bounce({ bouncesLeft: 2 }));

            BounceSystem(world, 16);

            const transform = world.entities.get(bulletId)!.find(c => c instanceof Transform) as Transform;
            const velocity = world.entities.get(bulletId)!.find(c => c instanceof Velocity) as Velocity;

            expect(transform.x).toBe(800);
            expect(velocity.vx).toBe(-100);
        });

        it('应该在 bounceX: false 时不进行左右边界反弹', () => {
            const bulletId = generateId();
            world.entities.set(bulletId, []);
            addComponent(world, bulletId, new Transform({ x: -10, y: 300, rot: 0 }));
            addComponent(world, bulletId, new Velocity({ vx: -100, vy: 0 }));
            addComponent(world, bulletId, new Bounce({
                bouncesLeft: 3,
                bounds: { bounceX: false, bounceTop: true }
            }));

            BounceSystem(world, 16);

            const transform = world.entities.get(bulletId)!.find(c => c instanceof Transform) as Transform;
            const velocity = world.entities.get(bulletId)!.find(c => c instanceof Velocity) as Velocity;
            const bounce = world.entities.get(bulletId)!.find(c => c instanceof Bounce) as Bounce;

            expect(transform.x).toBe(-10); // 位置未修正
            expect(velocity.vx).toBe(-100); // 速度未反转
            expect(bounce.hasBounced).toBe(false);
        });
    });

    describe('顶部边界反弹', () => {
        it('应该在顶部边界（y < 0）反弹', () => {
            const bulletId = generateId();
            world.entities.set(bulletId, []);
            addComponent(world, bulletId, new Transform({ x: 400, y: -10, rot: 0 }));
            addComponent(world, bulletId, new Velocity({ vx: 0, vy: -100 }));
            addComponent(world, bulletId, new Bounce({ bouncesLeft: 1 }));

            BounceSystem(world, 16);

            const transform = world.entities.get(bulletId)!.find(c => c instanceof Transform) as Transform;
            const velocity = world.entities.get(bulletId)!.find(c => c instanceof Velocity) as Velocity;

            expect(transform.y).toBe(0);
            expect(velocity.vy).toBe(100);
        });

        it('应该在 bounceTop: false 时不进行顶部边界反弹', () => {
            const bulletId = generateId();
            world.entities.set(bulletId, []);
            addComponent(world, bulletId, new Transform({ x: 400, y: -10, rot: 0 }));
            addComponent(world, bulletId, new Velocity({ vx: 0, vy: -100 }));
            addComponent(world, bulletId, new Bounce({
                bouncesLeft: 3,
                bounds: { bounceX: true, bounceTop: false }
            }));

            BounceSystem(world, 16);

            const transform = world.entities.get(bulletId)!.find(c => c instanceof Transform) as Transform;
            const velocity = world.entities.get(bulletId)!.find(c => c instanceof Velocity) as Velocity;

            expect(transform.y).toBe(-10);
            expect(velocity.vy).toBe(-100);
        });
    });

    describe('底部边界反弹', () => {
        it('应该在底部边界（y > screenHeight）反弹当 bounceBottom: true', () => {
            const bulletId = generateId();
            world.entities.set(bulletId, []);
            addComponent(world, bulletId, new Transform({ x: 400, y: 610, rot: 0 }));
            addComponent(world, bulletId, new Velocity({ vx: 0, vy: 100 }));
            addComponent(world, bulletId, new Bounce({
                bouncesLeft: 1,
                bounds: { bounceBottom: true }
            }));

            BounceSystem(world, 16);

            const transform = world.entities.get(bulletId)!.find(c => c instanceof Transform) as Transform;
            const velocity = world.entities.get(bulletId)!.find(c => c instanceof Velocity) as Velocity;

            expect(transform.y).toBe(600);
            expect(velocity.vy).toBe(-100);
        });

        it('应该默认不在底部边界反弹（bounceBottom: false）', () => {
            const bulletId = generateId();
            world.entities.set(bulletId, []);
            addComponent(world, bulletId, new Transform({ x: 400, y: 610, rot: 0 }));
            addComponent(world, bulletId, new Velocity({ vx: 0, vy: 100 }));
            addComponent(world, bulletId, new Bounce({ bouncesLeft: 3 })); // 使用默认配置

            BounceSystem(world, 16);

            const transform = world.entities.get(bulletId)!.find(c => c instanceof Transform) as Transform;
            const velocity = world.entities.get(bulletId)!.find(c => c instanceof Velocity) as Velocity;
            const bounce = world.entities.get(bulletId)!.find(c => c instanceof Bounce) as Bounce;

            expect(transform.y).toBe(610);
            expect(velocity.vy).toBe(100);
            expect(bounce.hasBounced).toBe(false);
        });
    });

    describe('反弹次数管理', () => {
        it('应该在反弹次数用完后移除 Bounce 组件', () => {
            const bulletId = generateId();
            world.entities.set(bulletId, []);
            addComponent(world, bulletId, new Transform({ x: -10, y: 300, rot: 0 }));
            addComponent(world, bulletId, new Velocity({ vx: -100, vy: 0 }));
            addComponent(world, bulletId, new Bounce({ bouncesLeft: 1 }));

            BounceSystem(world, 16);

            const bounceComp = world.entities.get(bulletId)!.find(c => c instanceof Bounce);
            expect(bounceComp).toBeUndefined(); // Bounce 组件已移除
        });

        it('应该在反弹次数大于0时保留 Bounce 组件', () => {
            const bulletId = generateId();
            world.entities.set(bulletId, []);
            addComponent(world, bulletId, new Transform({ x: -10, y: 300, rot: 0 }));
            addComponent(world, bulletId, new Velocity({ vx: -100, vy: 0 }));
            addComponent(world, bulletId, new Bounce({ bouncesLeft: 2 }));

            BounceSystem(world, 16);

            const bounce = world.entities.get(bulletId)!.find(c => c instanceof Bounce) as Bounce;
            expect(bounce).toBeDefined();
            expect(bounce.bouncesLeft).toBe(1);
        });
    });

    describe('反弹事件触发', () => {
        it('应该触发 BulletBouncedEvent', () => {
            const bulletId = generateId();
            world.entities.set(bulletId, []);
            addComponent(world, bulletId, new Transform({ x: -10, y: 300, rot: 0 }));
            addComponent(world, bulletId, new Velocity({ vx: -100, vy: 0 }));
            addComponent(world, bulletId, new Bounce({ bouncesLeft: 3 }));

            BounceSystem(world, 16);

            const events = world.events.filter(e => e.type === 'BulletBounced');
            expect(events.length).toBe(1);

            const event = events[0];
            expect(event.type).toBe('BulletBounced');
            expect(event.entityId).toBe(bulletId);
            expect(event.pos.x).toBe(0);
            expect(event.pos.y).toBe(300);
        });

        it('应该在未反弹时不触发事件', () => {
            const bulletId = generateId();
            world.entities.set(bulletId, []);
            addComponent(world, bulletId, new Transform({ x: 400, y: 300, rot: 0 })); // 在屏幕内
            addComponent(world, bulletId, new Velocity({ vx: 100, vy: 0 }));
            addComponent(world, bulletId, new Bounce({ bouncesLeft: 3 }));

            BounceSystem(world, 16);

            const events = world.events.filter(e => e.type === 'BulletBounced');
            expect(events.length).toBe(0);
        });
    });

    describe('角部反弹（同时触发两个边界）', () => {
        it('应该在左上角同时反弹 X 和 Y', () => {
            const bulletId = generateId();
            world.entities.set(bulletId, []);
            addComponent(world, bulletId, new Transform({ x: -10, y: -10, rot: 0 }));
            addComponent(world, bulletId, new Velocity({ vx: -100, vy: -100 }));
            addComponent(world, bulletId, new Bounce({ bouncesLeft: 3, bounds: { bounceTop: true } }));

            BounceSystem(world, 16);

            const transform = world.entities.get(bulletId)!.find(c => c instanceof Transform) as Transform;
            const velocity = world.entities.get(bulletId)!.find(c => c instanceof Velocity) as Velocity;
            const bounce = world.entities.get(bulletId)!.find(c => c instanceof Bounce) as Bounce;

            expect(transform.x).toBe(0);
            expect(transform.y).toBe(0);
            expect(velocity.vx).toBe(100);
            expect(velocity.vy).toBe(100);
            expect(bounce.bouncesLeft).toBe(2); // 只减一次
            expect(bounce.hasBounced).toBe(true);
        });
    });

    describe('边界情况', () => {
        it('应该在边界上（x = 0）不反弹', () => {
            const bulletId = generateId();
            world.entities.set(bulletId, []);
            addComponent(world, bulletId, new Transform({ x: 0, y: 300, rot: 0 }));
            addComponent(world, bulletId, new Velocity({ vx: -100, vy: 0 }));
            addComponent(world, bulletId, new Bounce({ bouncesLeft: 3 }));

            BounceSystem(world, 16);

            const bounce = world.entities.get(bulletId)!.find(c => c instanceof Bounce) as Bounce;
            expect(bounce.hasBounced).toBe(false);
        });

        it('应该在边界上（y = 0）不反弹', () => {
            const bulletId = generateId();
            world.entities.set(bulletId, []);
            addComponent(world, bulletId, new Transform({ x: 400, y: 0, rot: 0 }));
            addComponent(world, bulletId, new Velocity({ vx: 0, vy: -100 }));
            addComponent(world, bulletId, new Bounce({ bouncesLeft: 3 }));

            BounceSystem(world, 16);

            const bounce = world.entities.get(bulletId)!.find(c => c instanceof Bounce) as Bounce;
            expect(bounce.hasBounced).toBe(false);
        });

        it('应该处理没有 Bounce 组件的实体（不处理）', () => {
            const bulletId = generateId();
            world.entities.set(bulletId, []);
            addComponent(world, bulletId, new Transform({ x: -10, y: 300, rot: 0 }));
            addComponent(world, bulletId, new Velocity({ vx: -100, vy: 0 }));
            // 不添加 Bounce 组件

            expect(() => BounceSystem(world, 16)).not.toThrow();
        });
    });

    describe('多次反弹', () => {
        it('应该支持连续反弹', () => {
            const bulletId = generateId();
            world.entities.set(bulletId, []);
            addComponent(world, bulletId, new Transform({ x: -10, y: 300, rot: 0 }));
            addComponent(world, bulletId, new Velocity({ vx: -100, vy: 0 }));
            addComponent(world, bulletId, new Bounce({ bouncesLeft: 2 }));

            // 第一次反弹
            BounceSystem(world, 16);

            let bounce = world.entities.get(bulletId)!.find(c => c instanceof Bounce) as Bounce;
            expect(bounce.bouncesLeft).toBe(1);
            expect(bounce.hasBounced).toBe(true);

            // 手动移动到右边界
            let transform = world.entities.get(bulletId)!.find(c => c instanceof Transform) as Transform;
            transform.x = 810;

            // 第二次反弹
            BounceSystem(world, 16);

            bounce = world.entities.get(bulletId)!.find(c => c instanceof Bounce);
            expect(bounce).toBeUndefined(); // 反弹次数用完，组件已移除
        });
    });
});
