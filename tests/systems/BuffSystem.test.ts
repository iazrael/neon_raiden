/**
 * BuffSystem 单元测试
 * 测试持续效果 Buff 的 Handler 实现
 */

import { createWorld, generateId, addComponent } from '../../src/engine/world';
import { BuffSystem } from '../../src/engine/systems/BuffSystem';
import { Transform, Buff, Shield, PlayerTag, InvulnerableState } from '../../src/engine/components';
import { BuffType } from '../../src/engine/types';

describe('BuffSystem', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
        world.difficulty = 1;
    });


    describe('SHIELD Buff - 持续效果', () => {
        it('应该恢复护盾值', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const shield = new Shield({ value: 30, regen: 0, max: 100 });
            addComponent(world, playerId, shield);
            addComponent(world, playerId, new Buff({
                type: BuffType.SHIELD,
                value: 20, // 每秒恢复20点
                remaining: 5000
            }));

            BuffSystem(world, 100); // 100ms

            // 20 * 0.1 = 2点恢复
            expect(shield.value).toBe(32);
            expect(shield.regen).toBe(20);
        });

        it('应该设置护盾再生', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const shield = new Shield({ value: 50, regen: 0, max: 100 });
            addComponent(world, playerId, shield);
            addComponent(world, playerId, new Buff({
                type: BuffType.SHIELD,
                value: 10,
                remaining: 5000
            }));

            BuffSystem(world, 16);

            expect(shield.regen).toBe(10);
        });

        it('护盾值不应超过最大值', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const shield = new Shield({ value: 95, regen: 0, max: 100 });
            addComponent(world, playerId, shield);
            addComponent(world, playerId, new Buff({
                type: BuffType.SHIELD,
                value: 100, // 大量恢复
                remaining: 5000
            }));

            BuffSystem(world, 1000);

            expect(shield.value).toBe(100);
        });
    });

    describe('INVINCIBILITY Buff - 持续效果', () => {
        it('应该添加 InvulnerableState 组件', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());
            addComponent(world, playerId, new Buff({
                type: BuffType.INVINCIBILITY,
                value: 1,
                remaining: 3000 // 3秒
            }));

            BuffSystem(world, 16);

            const comps = world.entities.get(playerId);
            const invState = comps?.find(InvulnerableState.check);
            expect(invState).toBeDefined();
            expect(invState?.duration).toBe(2984); // (3000 - 16) 毫秒
        });

        it('Buff结束后应该移除 InvulnerableState', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());
            addComponent(world, playerId, new Buff({
                type: BuffType.INVINCIBILITY,
                value: 1,
                remaining: 100 // 即将结束
            }));

            BuffSystem(world, 50);
            let comps = world.entities.get(playerId);
            let invState = comps?.find(InvulnerableState.check);
            expect(invState).toBeDefined();

            // Buff过期
            BuffSystem(world, 100);
            comps = world.entities.get(playerId);
            invState = comps?.find(InvulnerableState.check);
            const buff = comps?.find(Buff.check);

            expect(buff).toBeUndefined();
            expect(invState).toBeUndefined();
        });
    });



    describe('Buff 生命周期', () => {
        it('Buff 时间应该随时间递减', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const buff = new Buff({
                type: BuffType.SHIELD,
                value: 10,
                remaining: 5000
            });
            addComponent(world, playerId, buff);

            BuffSystem(world, 1000); // 1秒

            expect(buff.remaining).toBe(4000);
        });

        it('过期的 Buff 应该被移除', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new Buff({
                type: BuffType.SHIELD,
                value: 10,
                remaining: 50
            }));

            BuffSystem(world, 100); // 超过持续时间

            const comps = world.entities.get(playerId);
            const buff = comps?.find(Buff.check);
            expect(buff).toBeUndefined();
        });
    });

});
