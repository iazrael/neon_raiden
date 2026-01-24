/**
 * CollisionSystem 单元测试
 */

import { createWorld, generateId, addComponent } from '../../src/engine/world';
import { CollisionSystem } from '../../src/engine/systems/CollisionSystem';
import { Transform, HitBox, Bullet, PlayerTag, EnemyTag, PickupItem } from '../../src/engine/components';

describe('CollisionSystem', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
    });

    describe('圆形碰撞检测', () => {
        it('应该检测到两个重叠的圆形碰撞盒', () => {
            const id1 = generateId();
            const id2 = generateId();

            world.entities.set(id1, []);
            world.entities.set(id2, []);

            addComponent(world, id1, new Transform({ x: 100, y: 100 }));
            addComponent(world, id1, new HitBox({ shape: 'circle', radius: 20 }));
            addComponent(world, id1, new Bullet({ owner: 1, ammoType: 'test' }));

            addComponent(world, id2, new Transform({ x: 115, y: 100 }));
            addComponent(world, id2, new HitBox({ shape: 'circle', radius: 20 }));
            addComponent(world, id2, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            // 应该生成 HitEvent
            const hitEvents = world.events.filter(e => e.type === 'Hit');
            expect(hitEvents.length).toBeGreaterThan(0);
        });

        it('不应该检测到没有重叠的圆形碰撞盒', () => {
            const id1 = generateId();
            const id2 = generateId();

            world.entities.set(id1, []);
            world.entities.set(id2, []);

            addComponent(world, id1, new Transform({ x: 100, y: 100 }));
            addComponent(world, id1, new HitBox({ shape: 'circle', radius: 20 }));
            addComponent(world, id1, new Bullet({ owner: 1, ammoType: 'test' }));

            addComponent(world, id2, new Transform({ x: 200, y: 100 }));
            addComponent(world, id2, new HitBox({ shape: 'circle', radius: 20 }));
            addComponent(world, id2, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            // 不应该生成 HitEvent
            const hitEvents = world.events.filter(e => e.type === 'Hit');
            expect(hitEvents.length).toBe(0);
        });

        it('应该精确检测到边缘接触的圆形', () => {
            const id1 = generateId();
            const id2 = generateId();

            world.entities.set(id1, []);
            world.entities.set(id2, []);

            // 两个半径为20的圆，圆心距离正好等于40（边缘接触）
            addComponent(world, id1, new Transform({ x: 100, y: 100 }));
            addComponent(world, id1, new HitBox({ shape: 'circle', radius: 20 }));
            addComponent(world, id1, new Bullet({ owner: 1, ammoType: 'test' }));

            addComponent(world, id2, new Transform({ x: 140, y: 100 }));
            addComponent(world, id2, new HitBox({ shape: 'circle', radius: 20 }));
            addComponent(world, id2, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            // 边缘接触应该算碰撞
            const hitEvents = world.events.filter(e => e.type === 'Hit');
            expect(hitEvents.length).toBeGreaterThan(0);
        });
    });

    describe('玩家拾取道具', () => {
        it('应该检测到玩家与道具的碰撞', () => {
            const playerId = generateId();
            const pickupId = generateId();

            world.entities.set(playerId, []);
            world.entities.set(pickupId, []);

            addComponent(world, playerId, new Transform({ x: 100, y: 100 }));
            addComponent(world, playerId, new HitBox({ shape: 'circle', radius: 24 }));
            addComponent(world, playerId, new PlayerTag());

            addComponent(world, pickupId, new Transform({ x: 115, y: 100 }));
            addComponent(world, pickupId, new HitBox({ shape: 'circle', radius: 15 }));
            addComponent(world, pickupId, new PickupItem({ kind: 'weapon', blueprint: 'vulcan' }));

            CollisionSystem(world, 0.016);

            // 应该生成 PickupEvent
            const pickupEvents = world.events.filter(e => e.type === 'Pickup');
            expect(pickupEvents.length).toBeGreaterThan(0);
            expect(pickupEvents[0]).toMatchObject({
                type: 'Pickup',
                itemId: 'vulcan',
                owner: playerId
            });
        });
    });

    describe('事件生成', () => {
        it('HitEvent 应该包含正确的位置和伤害信息', () => {
            const bulletId = generateId();
            const enemyId = generateId();

            world.entities.set(bulletId, []);
            world.entities.set(enemyId, []);

            addComponent(world, bulletId, new Transform({ x: 100, y: 100 }));
            addComponent(world, bulletId, new HitBox({ shape: 'circle', radius: 10 }));
            addComponent(world, bulletId, new Bullet({ owner: 999, ammoType: 'test' }));

            addComponent(world, enemyId, new Transform({ x: 110, y: 100 }));
            addComponent(world, enemyId, new HitBox({ shape: 'circle', radius: 20 }));
            addComponent(world, enemyId, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            const hitEvents = world.events.filter(e => e.type === 'Hit');
            expect(hitEvents.length).toBeGreaterThan(0);
            expect(hitEvents[0]).toMatchObject({
                type: 'Hit',
                owner: 999,
                victim: enemyId,
                damage: 10,
                pos: { x: 110, y: 100 }
            });
        });
    });

    describe('清理事件队列', () => {
        it('每帧应该先清空上一帧的事件', () => {
            // 添加旧事件
            world.events.push({ type: 'Hit', pos: { x: 0, y: 0 }, damage: 10, owner: 1, victim: 2, bloodLevel: 1 });

            const id1 = generateId();
            const id2 = generateId();

            world.entities.set(id1, []);
            world.entities.set(id2, []);

            addComponent(world, id1, new Transform({ x: 100, y: 100 }));
            addComponent(world, id1, new HitBox({ shape: 'circle', radius: 20 }));
            addComponent(world, id1, new Bullet({ owner: 1, ammoType: 'test' }));

            addComponent(world, id2, new Transform({ x: 115, y: 100 }));
            addComponent(world, id2, new HitBox({ shape: 'circle', radius: 20 }));
            addComponent(world, id2, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            // 旧事件应该被清空，只保留新事件
            expect(world.events.length).toBe(1);
            expect(world.events[0].victim).toBe(id2);
        });
    });
});
