/**
 * WeaponSynergySystem 单元测试
 */

import { createWorld, generateId, addComponent } from '../../src/engine/world';
import { WeaponSynergySystem } from '../../src/engine/systems/WeaponSynergySystem';
import { Transform, Weapon, PlayerTag } from '../../src/engine/components';
import { WeaponId, WeaponPattern, AmmoType } from '../../src/engine/types';

describe('WeaponSynergySystem', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
    });

    describe('协同效果检测', () => {
        it('应该检测到火神炮+激光的协同效果', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());

            // 添加火神炮和激光
            const vulcan = new Weapon({
                id: WeaponId.VULCAN,
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 100,
                bulletCount: 1,
                pattern: WeaponPattern.SPREAD
            });
            const laser = new Weapon({
                id: WeaponId.LASER,
                ammoType: AmmoType.LASER_BEAM,
                cooldown: 150,
                bulletCount: 1,
                pattern: WeaponPattern.SPREAD
            });

            addComponent(world, playerId, vulcan);
            addComponent(world, playerId, laser);

            WeaponSynergySystem(world, 0.016);

            // 应该应用协同加成
            expect(vulcan.damageMultiplier).toBeGreaterThan(1);
            expect(laser.damageMultiplier).toBeGreaterThan(1);
        });

        it('应该检测到导弹+波动的协同效果', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());

            const missile = new Weapon({
                id: WeaponId.MISSILE,
                ammoType: 'missileHoming' as any,
                cooldown: 200,
                bulletCount: 1,
                pattern: WeaponPattern.SPREAD
            });
            const wave = new Weapon({
                id: WeaponId.WAVE,
                ammoType: 'wavePulse' as any,
                cooldown: 300,
                bulletCount: 1,
                pattern: WeaponPattern.SPREAD
            });

            addComponent(world, playerId, missile);
            addComponent(world, playerId, wave);

            WeaponSynergySystem(world, 0.016);

            // 应该应用协同加成
            expect(missile.damageMultiplier).toBeGreaterThan(1);
            expect(wave.damageMultiplier).toBeGreaterThan(1);
        });
    });

    describe('穿透加成', () => {
        it('特斯拉+手里剑应该增加穿透', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());

            const tesla = new Weapon({
                id: WeaponId.TESLA,
                ammoType: 'teslaChain' as any,
                cooldown: 150,
                bulletCount: 1,
                pattern: WeaponPattern.SPREAD,
                pierce: 5
            });
            const shuriken = new Weapon({
                id: WeaponId.SHURIKEN,
                ammoType: 'shurikenBounce' as any,
                cooldown: 180,
                bulletCount: 1,
                pattern: WeaponPattern.SPREAD,
                pierce: 0
            });

            addComponent(world, playerId, tesla);
            addComponent(world, playerId, shuriken);

            WeaponSynergySystem(world, 0.016);

            // 应该增加穿透
            expect(tesla.pierce).toBeGreaterThan(5);
            expect(shuriken.pierce).toBeGreaterThan(0);
        });
    });

    describe('射速加成', () => {
        it('某些协同应该影响射速', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());

            const tesla = new Weapon({
                id: WeaponId.TESLA,
                ammoType: 'teslaChain' as any,
                cooldown: 150,
                bulletCount: 1,
                pattern: WeaponPattern.SPREAD
            });
            const shuriken = new Weapon({
                id: WeaponId.SHURIKEN,
                ammoType: 'shurikenBounce' as any,
                cooldown: 180,
                bulletCount: 1,
                pattern: WeaponPattern.SPREAD
            });

            addComponent(world, playerId, tesla);
            addComponent(world, playerId, shuriken);

            WeaponSynergySystem(world, 0.016);

            // 特斯拉+手里剑协同应该增加射速
            expect(tesla.fireRateMultiplier).toBeGreaterThan(1);
            expect(shuriken.fireRateMultiplier).toBeGreaterThan(1);
        });
    });

    describe('单一武器无协同', () => {
        it('单个武器不应该有协同加成', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());

            const weapon = new Weapon({
                id: WeaponId.VULCAN,
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 100,
                bulletCount: 1,
                pattern: WeaponPattern.SPREAD
            });

            addComponent(world, playerId, weapon);

            WeaponSynergySystem(world, 0.016);

            // 没有协同，应该重置为默认值
            expect(weapon.damageMultiplier).toBe(1.0);
            expect(weapon.fireRateMultiplier).toBe(1.0);
        });
    });

    describe('等离子+熔岩协同', () => {
        it('应该增加伤害但降低射速', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());

            const plasma = new Weapon({
                id: WeaponId.PLASMA,
                ammoType: 'plasmaOrb' as any,
                cooldown: 200,
                bulletCount: 1,
                pattern: WeaponPattern.SPREAD
            });
            const magma = new Weapon({
                id: WeaponId.MAGMA,
                ammoType: 'magmaPool' as any,
                cooldown: 250,
                bulletCount: 1,
                pattern: WeaponPattern.SPREAD
            });

            addComponent(world, playerId, plasma);
            addComponent(world, playerId, magma);

            WeaponSynergySystem(world, 0.016);

            // 高伤害加成
            expect(plasma.damageMultiplier).toBeGreaterThan(1.4);
            expect(magma.damageMultiplier).toBeGreaterThan(1.4);

            // 射速降低
            expect(plasma.fireRateMultiplier).toBeLessThan(1);
            expect(magma.fireRateMultiplier).toBeLessThan(1);
        });
    });

    describe('多个协同效果', () => {
        it('多个武器应该触发多个协同效果', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());

            const vulcan = new Weapon({
                id: WeaponId.VULCAN,
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 100,
                bulletCount: 1,
                pattern: WeaponPattern.SPREAD
            });
            const laser = new Weapon({
                id: WeaponId.LASER,
                ammoType: AmmoType.LASER_BEAM,
                cooldown: 150,
                bulletCount: 1,
                pattern: WeaponPattern.SPREAD
            });
            const missile = new Weapon({
                id: WeaponId.MISSILE,
                ammoType: 'missileHoming' as any,
                cooldown: 200,
                bulletCount: 1,
                pattern: WeaponPattern.SPREAD
            });

            addComponent(world, playerId, vulcan);
            addComponent(world, playerId, laser);
            addComponent(world, playerId, missile);

            WeaponSynergySystem(world, 0.016);

            // 火神炮应该参与两个协同（+激光 和 +导弹）
            expect(vulcan.damageMultiplier).toBeGreaterThan(1.2);
        });
    });
});
