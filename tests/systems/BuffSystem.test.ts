/**
 * BuffSystem 单元测试
 * 测试持续效果 Buff 的 Handler 实现
 */

import { createWorld, generateId, addComponent } from '../../src/engine/world';
import { BuffSystem } from '../../src/engine/systems/BuffSystem';
import { Transform, Buff, Health, Shield, SpeedStat, Weapon, PlayerTag, InvulnerableState } from '../../src/engine/components';
import { BuffType, AmmoType } from '../../src/engine/types';

describe('BuffSystem', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
        world.difficulty = 1;
    });

    describe('SPEED Buff - 持续效果', () => {
        it('应该增加移动速度并保存原始值', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const speedStat = new SpeedStat({ maxLinear: 400 });
            addComponent(world, playerId, speedStat);
            addComponent(world, playerId, new Buff({
                type: BuffType.SPEED,
                value: 2, // +20%速度 (2 * 0.1 = 0.2)
                remaining: 5000 // 5秒
            }));

            BuffSystem(world, 100); // 100ms

            expect(speedStat.maxLinear).toBe(480); // 400 * (1 + 2 * 0.1) = 400 * 1.2
            expect(speedStat.originalMaxLinear).toBe(400); // 保存原始值
        });

        it('Buff过期后应该恢复原始速度', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const speedStat = new SpeedStat({ maxLinear: 400 });
            addComponent(world, playerId, speedStat);
            addComponent(world, playerId, new Buff({
                type: BuffType.SPEED,
                value: 2,
                remaining: 100 // 即将过期
            }));

            // 第一次更新，应用速度提升
            BuffSystem(world, 50);
            expect(speedStat.maxLinear).toBe(480);
            expect(speedStat.originalMaxLinear).toBe(400);

            // 第二次更新，Buff过期
            BuffSystem(world, 100);
            expect(speedStat.maxLinear).toBe(400); // 恢复原始值
            expect(speedStat.originalMaxLinear).toBeUndefined(); // 清除保存的原始值
        });
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
            expect(invState?.duration).toBe(2984000); // (3000 - 16) * 1000 微秒
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

    describe('RAPID_FIRE Buff - 持续效果', () => {
        it('应该增加射速倍率', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const weapon = new Weapon({
                id: 'laser',
                ammoType: AmmoType.LASER_BEAM,
                cooldown: 100,
                bulletCount: 1,
                pattern: 'spread'
            });
            addComponent(world, playerId, weapon);
            addComponent(world, playerId, new Buff({
                type: BuffType.RAPID_FIRE,
                value: 5,
                remaining: 5000
            }));

            BuffSystem(world, 16);

            expect(weapon.fireRateMultiplier).toBe(1.25); // 1 + 5 * 0.05
        });

        it('Buff过期后应该恢复默认射速', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const weapon = new Weapon({
                id: 'laser',
                ammoType: AmmoType.LASER_BEAM,
                cooldown: 100,
                bulletCount: 1,
                pattern: 'spread'
            });
            addComponent(world, playerId, weapon);
            addComponent(world, playerId, new Buff({
                type: BuffType.RAPID_FIRE,
                value: 5,
                remaining: 100
            }));

            BuffSystem(world, 50);
            expect(weapon.fireRateMultiplier).toBe(1.25);

            BuffSystem(world, 100);
            expect(weapon.fireRateMultiplier).toBe(1); // 恢复默认
        });
    });

    describe('PENETRATION Buff - 持续效果', () => {
        it('应该增加武器穿透并保存原始值', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const weapon = new Weapon({
                id: 'vulcan',
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 100,
                bulletCount: 1,
                pattern: 'spread',
                pierce: 1
            });
            addComponent(world, playerId, weapon);
            addComponent(world, playerId, new Buff({
                type: BuffType.PENETRATION,
                value: 4, // 应该增加2点穿透 (4 * 0.5)
                remaining: 5000
            }));

            BuffSystem(world, 16);

            expect(weapon.pierce).toBe(3); // 1 + 2
            expect(weapon.originalPierce).toBe(1); // 保存原始值
        });

        it('Buff过期后应该恢复原始穿透值', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const weapon = new Weapon({
                id: 'vulcan',
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 100,
                bulletCount: 1,
                pattern: 'spread',
                pierce: 2
            });
            addComponent(world, playerId, weapon);
            addComponent(world, playerId, new Buff({
                type: BuffType.PENETRATION,
                value: 4,
                remaining: 100
            }));

            BuffSystem(world, 50);
            expect(weapon.pierce).toBe(4); // 2 + 2
            expect(weapon.originalPierce).toBe(2);

            BuffSystem(world, 100);
            expect(weapon.pierce).toBe(2); // 恢复原始值
            expect(weapon.originalPierce).toBeUndefined(); // 清除保存的原始值
        });
    });

    describe('TIME_SLOW Buff - 持续效果', () => {
        it('应该降低游戏难度（时间减速）', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new Buff({
                type: BuffType.TIME_SLOW,
                value: 1,
                remaining: 5000
            }));

            BuffSystem(world, 16);

            expect(world.difficulty).toBe(0.5);
        });

        it('Buff结束后应该恢复正常游戏速度', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new Buff({
                type: BuffType.TIME_SLOW,
                value: 1,
                remaining: 100
            }));

            // 第一次执行，激活时间减速
            BuffSystem(world, 50);
            expect(world.difficulty).toBe(0.5);

            // Buff 结束后
            BuffSystem(world, 100);
            expect(world.difficulty).toBe(1);
        });

        it('多个 TIME_SLOW Buff 存在时，只有全部过期才恢复正常速度', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new Buff({
                type: BuffType.TIME_SLOW,
                value: 1,
                remaining: 5000
            }));
            addComponent(world, playerId, new Buff({
                type: BuffType.TIME_SLOW,
                value: 1,
                remaining: 3000
            }));

            BuffSystem(world, 1000);
            expect(world.difficulty).toBe(0.5);

            // 第一个 Buff 还剩 2000ms，第二个 Buff 还剩 4000ms
            // 再过 2500ms，第一个 Buff 过期，第二个 Buff 还剩 1500ms
            BuffSystem(world, 2500);
            expect(world.difficulty).toBe(0.5); // 还有第二个 Buff

            // 再过 2000ms，第二个 Buff 也过期
            BuffSystem(world, 2000);
            expect(world.difficulty).toBe(1); // 全部过期，恢复正常
        });
    });

    describe('Buff 生命周期', () => {
        it('Buff 时间应该随时间递减', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const buff = new Buff({
                type: BuffType.SPEED,
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
                type: BuffType.SPEED,
                value: 10,
                remaining: 50
            }));

            BuffSystem(world, 100); // 超过持续时间

            const comps = world.entities.get(playerId);
            const buff = comps?.find(Buff.check);
            expect(buff).toBeUndefined();
        });
    });

    describe('多个实体', () => {
        it('应该正确处理多个实体的 Buff', () => {
            const player1 = generateId();
            const player2 = generateId();

            world.entities.set(player1, []);
            addComponent(world, player1, new Transform({ x: 400, y: 500 }));
            const speedStat1 = new SpeedStat({ maxLinear: 400 });
            addComponent(world, player1, speedStat1);
            addComponent(world, player1, new Buff({
                type: BuffType.SPEED,
                value: 1, // +10%速度
                remaining: 5000
            }));

            world.entities.set(player2, []);
            addComponent(world, player2, new Transform({ x: 400, y: 500 }));
            const speedStat2 = new SpeedStat({ maxLinear: 300 });
            addComponent(world, player2, speedStat2);
            addComponent(world, player2, new Buff({
                type: BuffType.SPEED,
                value: 2, // +20%速度
                remaining: 5000
            }));

            BuffSystem(world, 100);

            expect(speedStat1.maxLinear).toBeCloseTo(440); // 400 * (1 + 1 * 0.1) = 400 * 1.1
            expect(speedStat2.maxLinear).toBeCloseTo(360); // 300 * (1 + 2 * 0.1) = 300 * 1.2
        });
    });

    describe('多个 Buff 叠加', () => {
        it('同一个实体可以有多个不同类型的 Buff', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const speedStat = new SpeedStat({ maxLinear: 400 });
            addComponent(world, playerId, speedStat);
            const weapon = new Weapon({
                id: 'vulcan',
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 100,
                bulletCount: 1,
                pattern: 'spread'
            });
            addComponent(world, playerId, weapon);

            addComponent(world, playerId, new Buff({
                type: BuffType.SPEED,
                value: 1, // +10%速度
                remaining: 5000
            }));
            addComponent(world, playerId, new Buff({
                type: BuffType.RAPID_FIRE,
                value: 5,
                remaining: 5000
            }));

            BuffSystem(world, 100);

            // 两个 Buff 都应该生效
            expect(speedStat.maxLinear).toBeCloseTo(440); // 400 * (1 + 1 * 0.1) = 400 * 1.1
            expect(weapon.fireRateMultiplier).toBe(1.25); // 1 + 5 * 0.05
        });
    });
});
