/**
 * MovementSystem 集成测试
 * 测试 timeScale 在移动系统中的应用
 */

import { createWorld, generateId, addComponent } from '../../src/engine/world';
import { MovementSystem } from '../../src/engine/systems/MovementSystem';
import { Transform, Velocity, PlayerTag, EnemyTag } from '../../src/engine/components';

describe('MovementSystem with TimeScale', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
        world.timeScale = 1.0;
    });

    describe('敌人移动受 timeScale 影响', () => {
        it('应该应用 50% 速度当 timeScale = 0.5', () => {
            const enemyId = generateId();
            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 0, y: 0, rot: 0 }));
            addComponent(world, enemyId, new Velocity({ vx: 100, vy: 0, vrot: 0 }));

            world.timeScale = 0.5;
            MovementSystem(world, 1000); // 1秒

            const transform = world.entities.get(enemyId)!.find(c => c instanceof Transform)! as Transform;
            expect(transform.x).toBe(50); // 100 * 1秒 * 0.5
        });

        it('应该应用 25% 速度当 timeScale = 0.25', () => {
            const enemyId = generateId();
            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 0, y: 0, rot: 0 }));
            addComponent(world, enemyId, new Velocity({ vx: 200, vy: 200, vrot: 0 }));

            world.timeScale = 0.25;
            MovementSystem(world, 1000);

            const transform = world.entities.get(enemyId)!.find(c => c instanceof Transform)! as Transform;
            expect(transform.x).toBe(50); // 200 * 1秒 * 0.25
            expect(transform.y).toBe(50); // 200 * 1秒 * 0.25
        });
    });

    describe('玩家移动免疫 timeScale', () => {
        it('玩家应该不受 timeScale 影响', () => {
            const playerId = generateId();
            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 0, y: 0, rot: 0 }));
            addComponent(world, playerId, new Velocity({ vx: 100, vy: 0, vrot: 0 }));
            addComponent(world, playerId, new PlayerTag());

            world.timeScale = 0.5;
            MovementSystem(world, 1000);

            const transform = world.entities.get(playerId)!.find(c => c instanceof Transform)! as Transform;
            expect(transform.x).toBe(100); // 100 * 1秒 * 1.0 (免疫)
        });

        it('玩家僚机应该不受 timeScale 影响', () => {
            const optionId = generateId();
            world.entities.set(optionId, []);
            addComponent(world, optionId, new Transform({ x: 0, y: 0, rot: 0 }));
            addComponent(world, optionId, new Velocity({ vx: 80, vy: 80, vrot: 0 }));
            addComponent(world, optionId, new PlayerTag());

            world.timeScale = 0.5;
            MovementSystem(world, 1000);

            const transform = world.entities.get(optionId)!.find(c => c instanceof Transform)! as Transform;
            expect(transform.x).toBe(80); // 80 * 1秒 * 1.0 (免疫)
            expect(transform.y).toBe(80);
        });
    });

    describe('混合场景测试', () => {
        it('应该同时处理玩家和敌人', () => {
            const playerId = generateId();
            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 0, y: 0, rot: 0 }));
            addComponent(world, playerId, new Velocity({ vx: 100, vy: 0, vrot: 0 }));
            addComponent(world, playerId, new PlayerTag());

            const enemyId = generateId();
            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 0, y: 100, rot: 0 }));
            addComponent(world, enemyId, new Velocity({ vx: 100, vy: 0, vrot: 0 }));
            addComponent(world, enemyId, new EnemyTag({id: 'GUARDIAN' as any}));

            world.timeScale = 0.5;
            MovementSystem(world, 1000);

            const playerTransform = world.entities.get(playerId)!.find(c => c instanceof Transform)! as Transform;
            const enemyTransform = world.entities.get(enemyId)!.find(c => c instanceof Transform)! as Transform;

            expect(playerTransform.x).toBe(100); // 玩家正常速度
            expect(enemyTransform.x).toBe(50);  // 敌人 50% 速度
        });
    });

    describe('边界情况', () => {
        it('应该处理 timeScale 为 0 的情况', () => {
            const enemyId = generateId();
            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 100, y: 100, rot: 0 }));
            addComponent(world, enemyId, new Velocity({ vx: 50, vy: 50, vrot: 0 }));

            world.timeScale = 0;
            MovementSystem(world, 1000);

            const transform = world.entities.get(enemyId)!.find(c => c instanceof Transform)! as Transform;
            expect(transform.x).toBe(100); // 位置不变
            expect(transform.y).toBe(100);
        });

        it('应该处理 timeScale 为 2.0 (加速)', () => {
            const enemyId = generateId();
            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 0, y: 0, rot: 0 }));
            addComponent(world, enemyId, new Velocity({ vx: 50, vy: 0, vrot: 0 }));

            world.timeScale = 2.0;
            MovementSystem(world, 1000);

            const transform = world.entities.get(enemyId)!.find(c => c instanceof Transform)! as Transform;
            expect(transform.x).toBe(100); // 50 * 1秒 * 2.0
        });

        it('应该处理未定义的 timeScale', () => {
            const enemyId = generateId();
            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 0, y: 0, rot: 0 }));
            addComponent(world, enemyId, new Velocity({ vx: 100, vy: 0, vrot: 0 }));

            delete (world as any).timeScale;
            MovementSystem(world, 1000);

            const transform = world.entities.get(enemyId)!.find(c => c instanceof Transform)! as Transform;
            expect(transform.x).toBe(100); // 默认为 1.0
        });
    });

    describe('旋转也应受 timeScale 影响', () => {
        it('敌人旋转应该受 timeScale 影响', () => {
            const enemyId = generateId();
            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 100, y: 100, rot: 0 }));
            addComponent(world, enemyId, new Velocity({ vx: 0, vy: 0, vrot: Math.PI })); // 180度/秒

            world.timeScale = 0.5;
            MovementSystem(world, 1000);

            const transform = world.entities.get(enemyId)!.find(c => c instanceof Transform)! as Transform;
            expect(transform.rot).toBeCloseTo(Math.PI / 2, 5); // PI * 1秒 * 0.5
        });

        it('玩家旋转应该不受 timeScale 影响', () => {
            const playerId = generateId();
            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 100, y: 100, rot: 0 }));
            addComponent(world, playerId, new Velocity({ vx: 0, vy: 0, vrot: Math.PI }));
            addComponent(world, playerId, new PlayerTag());

            world.timeScale = 0.5;
            MovementSystem(world, 1000);

            const transform = world.entities.get(playerId)!.find(c => c instanceof Transform)! as Transform;
            expect(transform.rot).toBeCloseTo(Math.PI, 5); // 正常旋转
        });
    });
});
