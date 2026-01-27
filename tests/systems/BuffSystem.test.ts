/**
 * BuffSystem 单元测试
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

    describe('HP Buff', () => {
        it('应该持续恢复生命值', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const health = new Health({ hp: 50, max: 100 });
            addComponent(world, playerId, health);
            addComponent(world, playerId, new Buff({
                type: BuffType.HP,
                value: 10, // 每秒恢复10点
                remaining: 1 // 持续1秒
            }));

            BuffSystem(world, 0.1); // 100ms

            expect(health.hp).toBeGreaterThan(50);
            expect(health.hp).toBeLessThanOrEqual(100);
        });

        it('不应该超过最大生命值', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const health = new Health({ hp: 95, max: 100 });
            addComponent(world, playerId, health);
            addComponent(world, playerId, new Buff({
                type: BuffType.HP,
                value: 100, // 大量恢复
                remaining: 1
            }));

            BuffSystem(world, 1);

            expect(health.hp).toBe(100);
        });
    });

    describe('POWER Buff', () => {
        it('应该增加武器伤害倍率', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const weapon = new Weapon({
                id: 'vulcan',
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 100,
                bulletCount: 1,
                pattern: 'spread'
            });
            addComponent(world, playerId, weapon);
            addComponent(world, playerId, new Buff({
                type: BuffType.POWER,
                value: 5, // +5级
                remaining: 10
            }));

            BuffSystem(world, 0.016);

            expect(weapon.damageMultiplier).toBeGreaterThan(1);
        });
    });

    describe('SPEED Buff', () => {
        it('应该增加移动速度', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const speedStat = new SpeedStat({ maxLinear: 400 });
            addComponent(world, playerId, speedStat);
            addComponent(world, playerId, new Buff({
                type: BuffType.SPEED,
                value: 20, // +20%速度
                remaining: 5
            }));

            BuffSystem(world, 0.016);

            expect(speedStat.maxLinear).toBeGreaterThan(400);
        });
    });

    describe('SHIELD Buff', () => {
        it('应该恢复护盾值', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const shield = new Shield({ value: 30, regen: 0, max: 100 });
            addComponent(world, playerId, shield);
            addComponent(world, playerId, new Buff({
                type: BuffType.SHIELD,
                value: 20, // 每秒恢复20点
                remaining: 1
            }));

            BuffSystem(world, 0.1);

            expect(shield.value).toBeGreaterThan(30);
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
                remaining: 5
            }));

            BuffSystem(world, 0.016);

            expect(shield.regen).toBe(10);
        });
    });

    describe('INVINCIBILITY Buff', () => {
        it('应该添加 InvulnerableState 组件', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());
            addComponent(world, playerId, new Buff({
                type: BuffType.INVINCIBILITY,
                value: 1,
                remaining: 3
            }));

            BuffSystem(world, 0.016);

            const comps = world.entities.get(playerId);
            const invState = comps?.find(InvulnerableState.check);
            expect(invState).toBeDefined();
        });

        it('Buff结束后应该移除 InvulnerableState', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());
            addComponent(world, playerId, new Buff({
                type: BuffType.INVINCIBILITY,
                value: 1,
                remaining: 0.1 // 即将结束
            }));

            BuffSystem(world, 0.2); // 超过持续时间

            const comps = world.entities.get(playerId);
            const invState = comps?.find(InvulnerableState.check);
            const buff = comps?.find(Buff.check);

            // Buff 和 InvulnerableState 都应该被移除
            expect(buff).toBeUndefined();
            expect(invState).toBeUndefined();
        });
    });

    describe('RAPID_FIRE Buff', () => {
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
                remaining: 10
            }));

            BuffSystem(world, 0.016);

            expect(weapon.fireRateMultiplier).toBeGreaterThan(1);
        });
    });

    describe('PENETRATION Buff', () => {
        it('应该增加武器穿透', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const weapon = new Weapon({
                id: 'vulcan',
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 100,
                bulletCount: 1,
                pattern: 'spread',
                pierce: 0
            });
            addComponent(world, playerId, weapon);
            addComponent(world, playerId, new Buff({
                type: BuffType.PENETRATION,
                value: 4, // 应该增加2点穿透 (4 * 0.5)
                remaining: 10
            }));

            BuffSystem(world, 0.016);

            expect(weapon.pierce).toBeGreaterThan(0);
        });
    });

    describe('TIME_SLOW Buff', () => {
        it('应该降低游戏难度（时间减速）', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new Buff({
                type: BuffType.TIME_SLOW,
                value: 1,
                remaining: 5
            }));

            BuffSystem(world, 0.016);

            expect(world.difficulty).toBe(0.5);
        });

        it('Buff结束后应该恢复正常游戏速度', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new Buff({
                type: BuffType.TIME_SLOW,
                value: 1,
                remaining: 0.1
            }));

            // 第一次执行，激活时间减速
            BuffSystem(world, 0.05);
            expect(world.difficulty).toBe(0.5);

            // Buff 结束后
            BuffSystem(world, 0.1);
            expect(world.difficulty).toBe(1);
        });
    });

    describe('Buff 生命周期', () => {
        it('Buff 时间应该随时间递减', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const buff = new Buff({
                type: BuffType.HP,
                value: 10,
                remaining: 5
            });
            addComponent(world, playerId, buff);

            BuffSystem(world, 1); // 1秒

            expect(buff.remaining).toBeLessThan(5);
        });

        it('过期的 Buff 应该被移除', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new Buff({
                type: BuffType.HP,
                value: 10,
                remaining: 0.05
            }));

            BuffSystem(world, 0.1); // 超过持续时间

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
            const health1 = new Health({ hp: 50, max: 100 });
            addComponent(world, player1, health1);
            addComponent(world, player1, new Buff({
                type: BuffType.HP,
                value: 10,
                remaining: 1
            }));

            world.entities.set(player2, []);
            addComponent(world, player2, new Transform({ x: 400, y: 500 }));
            const health2 = new Health({ hp: 30, max: 100 });
            addComponent(world, player2, health2);
            addComponent(world, player2, new Buff({
                type: BuffType.HP,
                value: 20, // 不同的恢复速率
                remaining: 1
            }));

            BuffSystem(world, 0.1);

            expect(health1.hp).toBeGreaterThan(50);
            expect(health2.hp).toBeGreaterThan(30);
        });
    });

    describe('多个 Buff 叠加', () => {
        it('同一个实体可以有多个不同类型的 Buff', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const health = new Health({ hp: 50, max: 100 });
            addComponent(world, playerId, health);
            const weapon = new Weapon({
                id: 'vulcan',
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 100,
                bulletCount: 1,
                pattern: 'spread'
            });
            addComponent(world, playerId, weapon);

            addComponent(world, playerId, new Buff({
                type: BuffType.HP,
                value: 10,
                remaining: 5
            }));
            addComponent(world, playerId, new Buff({
                type: BuffType.POWER,
                value: 3,
                remaining: 5
            }));

            BuffSystem(world, 0.016);

            // 两个 Buff 都应该生效
            expect(health.hp).toBeGreaterThan(50);
            expect(weapon.damageMultiplier).toBeGreaterThan(1);
        });
    });
});
