/**
 * WeaponSystem 单元测试
 */

import { createWorld, generateId, addComponent } from '../../src/engine/world';
import { WeaponSystem } from '../../src/engine/systems/WeaponSystem';
import { Transform, Weapon, FireIntent, PlayerTag, EnemyTag, Bullet } from '../../src/engine/components';
import { WeaponId, AmmoType } from '../../src/engine/types';

describe('WeaponSystem', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
        world.playerId = 1;
    });

    describe('基础开火', () => {
        it('应该为有 FireIntent 的玩家实体生成子弹', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new Weapon({
                id: WeaponId.VULCAN,
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 200,
                bulletCount: 1,
                pattern: 'spread'
            }));
            addComponent(world, playerId, new PlayerTag());
            addComponent(world, playerId, new FireIntent({ firing: true }));

            const beforeBulletCount = world.events.filter(e => e.type === 'WeaponFired').length;
            WeaponSystem(world, 0.016);
            const afterBulletCount = world.events.filter(e => e.type === 'WeaponFired').length;

            expect(afterBulletCount).toBeGreaterThan(beforeBulletCount);
        });

        it('应该遵循武器冷却时间', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const weapon = new Weapon({
                id: WeaponId.VULCAN,
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 200,
                curCD: 150, // 冷却中
                bulletCount: 1,
                pattern: 'spread'
            });
            addComponent(world, playerId, weapon);
            addComponent(world, playerId, new PlayerTag());
            addComponent(world, playerId, new FireIntent({ firing: true }));

            const beforeEvents = world.events.filter(e => e.type === 'WeaponFired').length;
            WeaponSystem(world, 0.016);
            const afterEvents = world.events.filter(e => e.type === 'WeaponFired').length;

            // 冷却中不应该开火
            expect(afterEvents).toBe(beforeEvents);
            expect(weapon.curCD).toBeLessThan(150); // 冷却应该减少
        });

        it('应该消耗 FireIntent（一帧一用）', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new Weapon({
                id: WeaponId.VULCAN,
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 200,
                bulletCount: 1,
                pattern: 'spread'
            }));
            addComponent(world, playerId, new PlayerTag());
            addComponent(world, playerId, new FireIntent({ firing: true }));

            WeaponSystem(world, 0.016);

            // FireIntent 应该被移除
            const comps = world.entities.get(playerId);
            const hasFireIntent = comps?.some(FireIntent.check);
            expect(hasFireIntent).toBe(false);
        });
    });

    describe('弹幕模式', () => {
        it('SPREAD 模式应该发射扇形弹幕', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new Weapon({
                id: WeaponId.VULCAN,
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 100,
                bulletCount: 5,
                spread: 30, // 30度扩散
                pattern: 'spread'
            }));
            addComponent(world, playerId, new PlayerTag());
            addComponent(world, playerId, new FireIntent({ firing: true }));

            const beforeEvents = world.events.filter(e => e.type === 'WeaponFired').length;
            WeaponSystem(world, 0.016);
            const afterEvents = world.events.filter(e => e.type === 'WeaponFired').length;

            // 应该产生一次 WeaponFired 事件
            expect(afterEvents - beforeEvents).toBe(1);
        });

        it('RADIAL 模式应该发射径向弹幕', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 300 }));
            addComponent(world, playerId, new Weapon({
                id: WeaponId.WAVE,
                ammoType: AmmoType.WAVE_PULSE,
                cooldown: 100,
                bulletCount: 8,
                pattern: 'radial'
            }));
            addComponent(world, playerId, new PlayerTag());
            addComponent(world, playerId, new FireIntent({ firing: true }));

            const beforeEvents = world.events.filter(e => e.type === 'WeaponFired').length;
            WeaponSystem(world, 0.016);
            const afterEvents = world.events.filter(e => e.type === 'WeaponFired').length;

            expect(afterEvents - beforeEvents).toBe(1);
        });

        it('SPIRAL 模式应该发射螺旋弹幕', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 300 }));
            addComponent(world, playerId, new Weapon({
                id: WeaponId.LASER,
                ammoType: AmmoType.LASER_BEAM,
                cooldown: 100,
                bulletCount: 4,
                spread: 15,
                pattern: 'spiral'
            }));
            addComponent(world, playerId, new PlayerTag());
            addComponent(world, playerId, new FireIntent({ firing: true }));

            const beforeEvents = world.events.filter(e => e.type === 'WeaponFired').length;
            WeaponSystem(world, 0.016);
            const afterEvents = world.events.filter(e => e.type === 'WeaponFired').length;

            expect(afterEvents - beforeEvents).toBe(1);
        });

        it('RANDOM 模式应该发射随机角度弹幕', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new Weapon({
                id: WeaponId.MISSILE,
                ammoType: AmmoType.MISSILE_HOMING,
                cooldown: 100,
                bulletCount: 3,
                spread: 45,
                pattern: 'random'
            }));
            addComponent(world, playerId, new PlayerTag());
            addComponent(world, playerId, new FireIntent({ firing: true }));

            const beforeEvents = world.events.filter(e => e.type === 'WeaponFired').length;
            WeaponSystem(world, 0.016);
            const afterEvents = world.events.filter(e => e.type === 'WeaponFired').length;

            expect(afterEvents - beforeEvents).toBe(1);
        });
    });

    describe('敌人武器', () => {
        it('敌人实体应该能够向下发射', () => {
            const enemyId = generateId();

            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 400, y: 100 }));
            addComponent(world, enemyId, new Weapon({
                id: 'enemy_normal',
                ammoType: AmmoType.ENEMY_ORB_RED,
                cooldown: 100,
                bulletCount: 1,
                pattern: 'spread'
            }));
            addComponent(world, enemyId, new EnemyTag({ id: 1 }));
            addComponent(world, enemyId, new FireIntent({ firing: true }));

            const beforeEvents = world.events.filter(e => e.type === 'WeaponFired').length;
            WeaponSystem(world, 0.016);
            const afterEvents = world.events.filter(e => e.type === 'WeaponFired').length;

            expect(afterEvents - beforeEvents).toBe(1);
        });
    });

    describe('事件生成', () => {
        it('应该生成 WeaponFired 事件', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new Weapon({
                id: WeaponId.VULCAN,
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 100,
                bulletCount: 1,
                pattern: 'spread'
            }));
            addComponent(world, playerId, new PlayerTag());
            addComponent(world, playerId, new FireIntent({ firing: true }));

            WeaponSystem(world, 0.016);

            const firedEvents = world.events.filter(e => e.type === 'WeaponFired');
            expect(firedEvents.length).toBeGreaterThan(0);
            expect(firedEvents[0]).toMatchObject({
                type: 'WeaponFired',
                weaponId: WeaponId.VULCAN,
                owner: playerId
            });
        });
    });

    describe('冷却处理', () => {
        it('开火后应该重置冷却时间', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            const weapon = new Weapon({
                id: WeaponId.VULCAN,
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 200,
                bulletCount: 1,
                pattern: 'spread',
                fireRateMultiplier: 1.5
            });
            addComponent(world, playerId, weapon);
            addComponent(world, playerId, new PlayerTag());
            addComponent(world, playerId, new FireIntent({ firing: true }));

            WeaponSystem(world, 0.016);

            // 冷却应该被重置为 cooldown / fireRateMultiplier
            expect(weapon.curCD).toBeCloseTo(200 / 1.5, 1);
        });
    });
});
