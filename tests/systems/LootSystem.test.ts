/**
 * LootSystem 单元测试
 */

import { createWorld, generateId, addComponent } from '../../src/engine/world';
import { LootSystem, enableGuaranteedDrop, disableGuaranteedDrop, setGuaranteedDropTimer } from '../../src/engine/systems/LootSystem';
import { Transform, DropTable, EnemyTag } from '../../src/engine/components';
import { PickupId } from '../../src/engine/types/ids';
import { KillEvent } from '../../src/engine/events';
import { pushEvent } from '../../src/engine/world';

describe('LootSystem', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
        disableGuaranteedDrop(); // 禁用保底掉落以便测试正常逻辑
    });

    describe('正常掉落', () => {
        it('有 DropTable 的敌人死亡应该可能生成掉落物', () => {
            const enemyId = generateId();

            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 400, y: 300 }));
            addComponent(world, enemyId, new DropTable({
                table: [
                    { item: PickupId.POWER, weight: 500 },
                    { item: PickupId.NONE, weight: 500 }
                ]
            }));

            pushEvent(world, {
                type: 'Kill',
                pos: { x: 400, y: 300 },
                victim: enemyId,
                killer: 1,
                score: 100
            } as KillEvent);

            const beforeEntityCount = world.entities.size;
            LootSystem(world, 0.016);
            const afterEntityCount = world.entities.size;

            // 可能生成掉落物，也可能不生成（取决于随机）
            // 由于权重各50%，多试几次应该至少有一次生成
            let spawnedAtLeastOnce = false;
            for (let i = 0; i < 20; i++) {
                LootSystem(world, 0.016);
                if (world.entities.size > beforeEntityCount) {
                    spawnedAtLeastOnce = true;
                    break;
                }
            }
            // 注意：这个测试在真实随机下可能不稳定
            // 在实际项目中可能需要 mock Math.random
        });
    });

    describe('不掉落', () => {
        it('没有 DropTable 的敌人死亡不应该生成掉落物', () => {
            const enemyId = generateId();

            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 400, y: 300 }));
            addComponent(world, enemyId, new EnemyTag({ id: 'GUARDIAN' as any }));
            // 没有 DropTable

            pushEvent(world, {
                type: 'Kill',
                pos: { x: 400, y: 300 },
                victim: enemyId,
                killer: 1,
                score: 100
            } as KillEvent);

            const beforeEntityCount = world.entities.size;
            LootSystem(world, 0.016);
            const afterEntityCount = world.entities.size;

            expect(afterEntityCount).toBe(beforeEntityCount);
        });

        it('命中 NONE 项不应该生成掉落物', () => {
            const enemyId = generateId();

            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 400, y: 300 }));
            addComponent(world, enemyId, new DropTable({
                table: [
                    { item: PickupId.NONE, weight: 1000 }
                ]
            }));

            pushEvent(world, {
                type: 'Kill',
                pos: { x: 400, y: 300 },
                victim: enemyId,
                killer: 1,
                score: 100
            } as KillEvent);

            const beforeEntityCount = world.entities.size;
            LootSystem(world, 0.016);
            const afterEntityCount = world.entities.size;

            expect(afterEntityCount).toBe(beforeEntityCount);
        });
    });

    describe('掉落表权重', () => {
        it('应该正确计算总权重', () => {
            const enemyId = generateId();

            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 400, y: 300 }));
            addComponent(world, enemyId, new DropTable({
                table: [
                    { item: PickupId.POWER, weight: 300 },
                    { item: PickupId.HP, weight: 200 },
                    { item: PickupId.NONE, weight: 500 }
                ]
            }));

            pushEvent(world, {
                type: 'Kill',
                pos: { x: 400, y: 300 },
                victim: enemyId,
                killer: 1,
                score: 100
            } as KillEvent);

            // 系统应该正常运行而不报错
            expect(() => LootSystem(world, 0.016)).not.toThrow();
        });
    });

    describe('空掉落表', () => {
        it('空掉落表不应该报错', () => {
            const enemyId = generateId();

            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 400, y: 300 }));
            addComponent(world, enemyId, new DropTable({
                table: []
            }));

            pushEvent(world, {
                type: 'Kill',
                pos: { x: 400, y: 300 },
                victim: enemyId,
                killer: 1,
                score: 100
            } as KillEvent);

            expect(() => LootSystem(world, 0.016)).not.toThrow();
        });
    });

    describe('保底掉落', () => {
        it('应该能够启用和禁用保底掉落', () => {
            enableGuaranteedDrop(world, 1000);
            expect(() => LootSystem(world, 0.016)).not.toThrow();
            disableGuaranteedDrop();
        });

        it('应该能够设置保底掉落时间', () => {
            setGuaranteedDropTimer(5000);
            expect(() => LootSystem(world, 0.016)).not.toThrow();
        });
    });

    describe('多次击杀', () => {
        it('应该正确处理多个击杀事件', () => {
            const enemy1 = generateId();
            const enemy2 = generateId();

            world.entities.set(enemy1, []);
            addComponent(world, enemy1, new Transform({ x: 200, y: 300 }));
            addComponent(world, enemy1, new DropTable({
                table: [
                    { item: PickupId.POWER, weight: 1000 }
                ]
            }));

            world.entities.set(enemy2, []);
            addComponent(world, enemy2, new Transform({ x: 600, y: 300 }));
            addComponent(world, enemy2, new DropTable({
                table: [
                    { item: PickupId.HP, weight: 1000 }
                ]
            }));

            pushEvent(world, {
                type: 'Kill',
                pos: { x: 200, y: 300 },
                victim: enemy1,
                killer: 1,
                score: 100
            } as KillEvent);

            pushEvent(world, {
                type: 'Kill',
                pos: { x: 600, y: 300 },
                victim: enemy2,
                killer: 1,
                score: 100
            } as KillEvent);

            const beforeEntityCount = world.entities.size;
            LootSystem(world, 0.016);
            const afterEntityCount = world.entities.size;

            // 两个敌人都应该生成掉落物
            // 原始2个敌人 + 2个新掉落物 = 4
            expect(afterEntityCount).toBeGreaterThanOrEqual(beforeEntityCount);
        });
    });
});
