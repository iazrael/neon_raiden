/**
 * PickupSystem 单元测试
 */

import { createWorld, generateId, addComponent, view } from '../../src/engine/world';
import { PickupSystem } from '../../src/engine/systems/PickupSystem';
import { Transform, Weapon, PlayerTag, PickupItem, Health, TimeSlowState, Option, OptionCount, InvulnerableState } from '../../src/engine/components';
import { WeaponId, BuffType, AmmoType } from '../../src/engine/types';
import { PickupEvent } from '../../src/engine/events';
import { pushEvent } from '../../src/engine/world';
import { BUFF_CONFIG } from '../../src/engine/configs/powerups';

describe('PickupSystem', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
        world.playerId = 1;
    });

    describe('武器拾取', () => {
        it('应该为玩家添加新武器', () => {
            const playerId = generateId();
            const pickupId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());

            // 模拟拾取事件
            pushEvent(world, {
                type: 'Pickup',
                pos: { x: 400, y: 500 },
                itemId: WeaponId.LASER,
                owner: playerId
            } as PickupEvent);

            PickupSystem(world, 0.016);

            const comps = world.entities.get(playerId);
            const weapon = comps?.find(Weapon.check);
            expect(weapon).toBeDefined();
            expect((weapon as Weapon).id).toBe(WeaponId.LASER);
        });

        it('应该升级已有武器', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());
            const existingWeapon = new Weapon({
                id: WeaponId.VULCAN,
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 150,
                bulletCount: 3,
                level: 1
            });
            addComponent(world, playerId, existingWeapon);

            const initialLevel = existingWeapon.level;
            const initialBulletCount = existingWeapon.bulletCount;

            // 拾取相同武器
            pushEvent(world, {
                type: 'Pickup',
                pos: { x: 400, y: 500 },
                itemId: WeaponId.VULCAN,
                owner: playerId
            } as PickupEvent);

            PickupSystem(world, 0.016);

            expect(existingWeapon.level).toBe(initialLevel + 1);
            expect(existingWeapon.bulletCount).toBe(initialBulletCount + 1);
        });

        it('替换已有武器', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());
            const oldWeapon = new Weapon({
                id: WeaponId.VULCAN,
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 150,
                bulletCount: 3
            });
            addComponent(world, playerId, oldWeapon);

            // 拾取不同武器
            pushEvent(world, {
                type: 'Pickup',
                pos: { x: 400, y: 500 },
                itemId: WeaponId.LASER,
                owner: playerId
            } as PickupEvent);

            PickupSystem(world, 0.016);

            const comps = world.entities.get(playerId);
            const weapon = comps?.find(Weapon.check);
            expect((weapon as Weapon).id).toBe(WeaponId.LASER);
        });
    });

    describe('Buff 拾取', () => {
        it('POWER Buff 应该升级武器等级', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());
            const weapon = new Weapon({
                id: WeaponId.VULCAN,
                ammoType: AmmoType.VULCAN_SPREAD,
                cooldown: 150,
                bulletCount: 3,
                level: 2
            });
            addComponent(world, playerId, weapon);

            pushEvent(world, {
                type: 'Pickup',
                pos: { x: 400, y: 500 },
                itemId: BuffType.POWER,
                owner: playerId
            } as PickupEvent);

            PickupSystem(world, 0.016);

            expect(weapon.level).toBe(3);
        });

        it('HP Buff 应该恢复生命值', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());
            const health = new Health({ hp: 50, max: 100 });
            addComponent(world, playerId, health);

            pushEvent(world, {
                type: 'Pickup',
                pos: { x: 400, y: 500 },
                itemId: BuffType.HP,
                owner: playerId
            } as PickupEvent);

            PickupSystem(world, 0.016);

            expect(health.hp).toBe(80); // 50 + 30
        });

        it('HP Buff 不应该超过最大值', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());
            const health = new Health({ hp: 80, max: 100 });
            addComponent(world, playerId, health);

            pushEvent(world, {
                type: 'Pickup',
                pos: { x: 400, y: 500 },
                itemId: BuffType.HP,
                owner: playerId
            } as PickupEvent);

            PickupSystem(world, 0.016);

            expect(health.hp).toBe(100);
        });

        it('INVINCIBILITY Buff 应该添加无敌状态', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());

            pushEvent(world, {
                type: 'Pickup',
                pos: { x: 400, y: 500 },
                itemId: BuffType.INVINCIBILITY,
                owner: playerId
            } as PickupEvent);

            PickupSystem(world, 0.016);

            const comps = world.entities.get(playerId);
            const invState = comps?.find(InvulnerableState.check);
            expect(invState).toBeDefined();
            expect(invState?.duration).toBe(BUFF_CONFIG[BuffType.INVINCIBILITY].duration);
        });

        it('TIME_SLOW Buff 应该创建 TimeSlow 实体', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());

            pushEvent(world, {
                type: 'Pickup',
                pos: { x: 400, y: 500 },
                itemId: BuffType.TIME_SLOW,
                owner: playerId
            } as PickupEvent);

            PickupSystem(world, 0.016);

            // 玩家应该有 TimeSlowState 组件
            const playerComps = world.entities.get(playerId);
            const timeSlowState = playerComps?.find(TimeSlowState.check);
            expect(timeSlowState).toBeDefined();
            expect(timeSlowState?.duration).toBe(BUFF_CONFIG[BuffType.TIME_SLOW].duration);
        });
    });

    describe('事件生成', () => {
        it('拾取武器应该生成音效事件', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());

            pushEvent(world, {
                type: 'Pickup',
                pos: { x: 400, y: 500 },
                itemId: WeaponId.VULCAN,
                owner: playerId
            } as PickupEvent);

            const beforeSoundEvents = world.events.filter(e => e.type === 'PlaySound').length;
            PickupSystem(world, 0.016);
            const afterSoundEvents = world.events.filter(e => e.type === 'PlaySound').length;

            expect(afterSoundEvents).toBeGreaterThan(beforeSoundEvents);
        });
    });

    describe('僚机拾取 (OPTION)', () => {
        it('应该添加第一个僚机', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());

            pushEvent(world, {
                type: 'Pickup',
                pos: { x: 400, y: 500 },
                itemId: BuffType.OPTION,
                owner: playerId
            } as PickupEvent);

            PickupSystem(world, 0.016);

            // 检查 OptionCount 组件
            const comps = world.entities.get(playerId);
            const optionCount = comps?.find((c: any) => c.constructor.name === 'OptionCount');
            expect(optionCount).toBeDefined();

            // 检查僚机实体是否被创建
            const entityComps = [...view(world, [Option])]
            expect(entityComps.length).toBe(1);
        });

        it('应该添加第二个僚机', () => {
            const playerId = generateId();

            world.entities.set(playerId, []);
            addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
            addComponent(world, playerId, new PlayerTag());

            // 先添加第一个僚机和 OptionCount 组件
            addComponent(world, playerId, new OptionCount({ count: 1, maxCount: 2 }));

            // 手动创建第一个僚机实体
            const option1Id = generateId();
            world.entities.set(option1Id, [
                new Transform({ x: 400, y: 500, rot: 0 }),
                new Option({
                    owner: playerId,
                    index: 0,
                    radius: 60,
                    rotationSpeed: 2,
                    lerpFactor: 0.2,
                    angle: 0,
                }),
            ]);

            pushEvent(world, {
                type: 'Pickup',
                pos: { x: 400, y: 500 },
                itemId: BuffType.OPTION,
                owner: playerId
            } as PickupEvent);

            PickupSystem(world, 0.016);

            const comps = world.entities.get(playerId);
            const optionCount = comps?.find((c: any) => c.constructor.name === 'OptionCount');

            expect(optionCount).toBeDefined();

            // 检查僚机实体数量（应该有 2 个）
            const entityComps = [...view(world, [Option])]
            expect(entityComps.length).toBe(2);

        });
    });
});
