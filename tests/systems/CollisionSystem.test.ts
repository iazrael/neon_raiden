/**
 * CollisionSystem 单元测试
 */

import { createWorld, generateId, addComponent } from '../../src/engine/world';
import { CollisionSystem } from '../../src/engine/systems/CollisionSystem';
import {
    Transform,
    HitBox,
    Bullet,
    PlayerTag,
    EnemyTag,
    PickupItem,
    InvulnerableState,
    DestroyTag
} from '../../src/engine/components';
import { CollisionLayer, shouldCheckCollision } from '../../src/engine/types/collision';
import { AmmoType } from '../../src/engine/types';

describe('CollisionSystem', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
    });

    describe('碰撞层过滤', () => {
        it('shouldCheckCollision 应该正确判断哪些层需要检测碰撞', () => {
            // Player 与 Enemy 需要检测
            expect(shouldCheckCollision(CollisionLayer.Player, CollisionLayer.Enemy)).toBe(true);
            expect(shouldCheckCollision(CollisionLayer.Enemy, CollisionLayer.Player)).toBe(true);

            // Player 与 EnemyBullet 需要检测
            expect(shouldCheckCollision(CollisionLayer.Player, CollisionLayer.EnemyBullet)).toBe(true);

            // Player 与 Pickup 需要检测
            expect(shouldCheckCollision(CollisionLayer.Player, CollisionLayer.Pickup)).toBe(true);

            // PlayerBullet 与 Enemy 需要检测
            expect(shouldCheckCollision(CollisionLayer.PlayerBullet, CollisionLayer.Enemy)).toBe(true);

            // PlayerBullet 与 PlayerBullet 不需要检测（同一阵营）
            expect(shouldCheckCollision(CollisionLayer.PlayerBullet, CollisionLayer.PlayerBullet)).toBe(false);

            // Enemy 与 Enemy 不需要检测（同一阵营）
            expect(shouldCheckCollision(CollisionLayer.Enemy, CollisionLayer.Enemy)).toBe(false);

            // PlayerBullet 与 Pickup 不需要检测
            expect(shouldCheckCollision(CollisionLayer.PlayerBullet, CollisionLayer.Pickup)).toBe(false);

            // None 与任何层都不需要检测
            expect(shouldCheckCollision(CollisionLayer.None, CollisionLayer.Player)).toBe(false);
        });

        it('应该跳过不需要检测的碰撞层组合', () => {
            const id1 = generateId();
            const id2 = generateId();

            world.entities.set(id1, []);
            world.entities.set(id2, []);

            // 两个玩家子弹（同一阵营，不应检测碰撞）
            addComponent(world, id1, new Transform({ x: 100, y: 100 }));
            addComponent(world, id1, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, id1, new Bullet({ owner: 1, ammoType: AmmoType.VULCAN_SPREAD }));
            addComponent(world, id1, new PlayerTag()); // 玩家子弹

            addComponent(world, id2, new Transform({ x: 105, y: 100 }));
            addComponent(world, id2, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, id2, new Bullet({ owner: 1, ammoType: AmmoType.VULCAN_SPREAD }));
            addComponent(world, id2, new PlayerTag()); // 玩家子弹

            // 确保两个子弹都属于玩家
            const playerId = generateId();
            world.entities.set(playerId, []);
            addComponent(world, playerId, new PlayerTag());

            // 更新子弹的 owner
            world.entities.get(id1)!.find((c: any) => c instanceof Bullet)!.owner = playerId;
            world.entities.get(id2)!.find((c: any) => c instanceof Bullet)!.owner = playerId;

            CollisionSystem(world, 0.016);

            // 不应该生成任何事件（玩家子弹之间不检测）
            expect(world.events.length).toBe(0);
        });
    });

    describe('圆形碰撞检测', () => {
        it('应该检测到两个重叠的圆形碰撞盒', () => {
            const id1 = generateId();
            const id2 = generateId();

            world.entities.set(id1, []);
            world.entities.set(id2, []);

            addComponent(world, id1, new Transform({ x: 100, y: 100 }));
            addComponent(world, id1, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, id1, new Bullet({ owner: 1, ammoType: AmmoType.VULCAN_SPREAD }));
            addComponent(world, id1, new PlayerTag()); // 玩家子弹

            addComponent(world, id2, new Transform({ x: 115, y: 100 }));
            addComponent(world, id2, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.Enemy }));
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
            addComponent(world, id1, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, id1, new Bullet({ owner: 1, ammoType: AmmoType.VULCAN_SPREAD }));
            addComponent(world, id1, new PlayerTag());

            addComponent(world, id2, new Transform({ x: 200, y: 100 }));
            addComponent(world, id2, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.Enemy }));
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
            addComponent(world, id1, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, id1, new Bullet({ owner: 1, ammoType: AmmoType.VULCAN_SPREAD }));
            addComponent(world, id1, new PlayerTag());

            addComponent(world, id2, new Transform({ x: 140, y: 100 }));
            addComponent(world, id2, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.Enemy }));
            addComponent(world, id2, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            // 边缘接触应该算碰撞
            const hitEvents = world.events.filter(e => e.type === 'Hit');
            expect(hitEvents.length).toBeGreaterThan(0);
        });

        it('一个圆包含另一个圆时应该检测到碰撞', () => {
            const id1 = generateId();
            const id2 = generateId();

            world.entities.set(id1, []);
            world.entities.set(id2, []);

            // 大圆包含小圆
            addComponent(world, id1, new Transform({ x: 100, y: 100 }));
            addComponent(world, id1, new HitBox({ shape: 'circle', radius: 50, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, id1, new Bullet({ owner: 1, ammoType: AmmoType.VULCAN_SPREAD }));
            addComponent(world, id1, new PlayerTag());

            addComponent(world, id2, new Transform({ x: 105, y: 100 }));
            addComponent(world, id2, new HitBox({ shape: 'circle', radius: 10, layer: CollisionLayer.Enemy }));
            addComponent(world, id2, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            const hitEvents = world.events.filter(e => e.type === 'Hit');
            expect(hitEvents.length).toBeGreaterThan(0);
        });
    });

    describe('矩形碰撞检测', () => {
        it('应该检测到两个重叠的矩形碰撞盒', () => {
            const id1 = generateId();
            const id2 = generateId();

            world.entities.set(id1, []);
            world.entities.set(id2, []);

            // 两个矩形重叠
            addComponent(world, id1, new Transform({ x: 100, y: 100 }));
            addComponent(world, id1, new HitBox({ shape: 'rect', halfWidth: 20, halfHeight: 20, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, id1, new Bullet({ owner: 1, ammoType: AmmoType.VULCAN_SPREAD }));
            addComponent(world, id1, new PlayerTag());

            addComponent(world, id2, new Transform({ x: 115, y: 100 }));
            addComponent(world, id2, new HitBox({ shape: 'rect', halfWidth: 20, halfHeight: 20, layer: CollisionLayer.Enemy }));
            addComponent(world, id2, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            const hitEvents = world.events.filter(e => e.type === 'Hit');
            expect(hitEvents.length).toBeGreaterThan(0);
        });

        it('不应该检测到没有重叠的矩形碰撞盒', () => {
            const id1 = generateId();
            const id2 = generateId();

            world.entities.set(id1, []);
            world.entities.set(id2, []);

            addComponent(world, id1, new Transform({ x: 100, y: 100 }));
            addComponent(world, id1, new HitBox({ shape: 'rect', halfWidth: 20, halfHeight: 20, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, id1, new Bullet({ owner: 1, ammoType: AmmoType.VULCAN_SPREAD }));
            addComponent(world, id1, new PlayerTag());

            addComponent(world, id2, new Transform({ x: 200, y: 100 }));
            addComponent(world, id2, new HitBox({ shape: 'rect', halfWidth: 20, halfHeight: 20, layer: CollisionLayer.Enemy }));
            addComponent(world, id2, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            const hitEvents = world.events.filter(e => e.type === 'Hit');
            expect(hitEvents.length).toBe(0);
        });

        it('应该检测到边缘接触的矩形', () => {
            const id1 = generateId();
            const id2 = generateId();

            world.entities.set(id1, []);
            world.entities.set(id2, []);

            addComponent(world, id1, new Transform({ x: 100, y: 100 }));
            addComponent(world, id1, new HitBox({ shape: 'rect', halfWidth: 20, halfHeight: 20, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, id1, new Bullet({ owner: 1, ammoType: AmmoType.VULCAN_SPREAD }));
            addComponent(world, id1, new PlayerTag());

            // 边缘接触
            addComponent(world, id2, new Transform({ x: 140, y: 100 }));
            addComponent(world, id2, new HitBox({ shape: 'rect', halfWidth: 20, halfHeight: 20, layer: CollisionLayer.Enemy }));
            addComponent(world, id2, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            const hitEvents = world.events.filter(e => e.type === 'Hit');
            expect(hitEvents.length).toBeGreaterThan(0);
        });
    });

    describe('圆形与矩形碰撞检测', () => {
        it('应该检测到圆与矩形的碰撞', () => {
            const id1 = generateId();
            const id2 = generateId();

            world.entities.set(id1, []);
            world.entities.set(id2, []);

            addComponent(world, id1, new Transform({ x: 100, y: 100 }));
            addComponent(world, id1, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, id1, new Bullet({ owner: 1, ammoType: AmmoType.VULCAN_SPREAD }));
            addComponent(world, id1, new PlayerTag());

            addComponent(world, id2, new Transform({ x: 115, y: 100 }));
            addComponent(world, id2, new HitBox({ shape: 'rect', halfWidth: 20, halfHeight: 20, layer: CollisionLayer.Enemy }));
            addComponent(world, id2, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            const hitEvents = world.events.filter(e => e.type === 'Hit');
            expect(hitEvents.length).toBeGreaterThan(0);
        });

        it('应该检测到圆心在矩形内的碰撞', () => {
            const id1 = generateId();
            const id2 = generateId();

            world.entities.set(id1, []);
            world.entities.set(id2, []);

            addComponent(world, id1, new Transform({ x: 100, y: 100 }));
            addComponent(world, id1, new HitBox({ shape: 'circle', radius: 5, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, id1, new Bullet({ owner: 1, ammoType: AmmoType.VULCAN_SPREAD }));
            addComponent(world, id1, new PlayerTag());

            // 圆心在矩形内
            addComponent(world, id2, new Transform({ x: 102, y: 100 }));
            addComponent(world, id2, new HitBox({ shape: 'rect', halfWidth: 20, halfHeight: 20, layer: CollisionLayer.Enemy }));
            addComponent(world, id2, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

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
            addComponent(world, playerId, new HitBox({ shape: 'circle', radius: 24, layer: CollisionLayer.Player }));
            addComponent(world, playerId, new PlayerTag());

            addComponent(world, pickupId, new Transform({ x: 115, y: 100 }));
            addComponent(world, pickupId, new HitBox({ shape: 'circle', radius: 15, layer: CollisionLayer.Pickup }));
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

    describe('子弹穿透', () => {
        it('穿透次数为0的子弹应该在一次碰撞后销毁', () => {
            const bulletId = generateId();
            const enemyId = generateId();
            const playerId = generateId();

            world.entities.set(bulletId, []);
            world.entities.set(enemyId, []);
            world.entities.set(playerId, []);

            // 设置玩家
            addComponent(world, playerId, new PlayerTag());

            addComponent(world, bulletId, new Transform({ x: 100, y: 100 }));
            addComponent(world, bulletId, new HitBox({ shape: 'circle', radius: 10, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, bulletId, new Bullet({ owner: playerId, ammoType: AmmoType.VULCAN_SPREAD, pierceLeft: 0 }));

            addComponent(world, enemyId, new Transform({ x: 110, y: 100 }));
            addComponent(world, enemyId, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.Enemy }));
            addComponent(world, enemyId, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            // 子弹应该被标记销毁
            const bulletComps = world.entities.get(bulletId);
            expect(bulletComps?.some(c => c instanceof DestroyTag)).toBe(true);
        });

        it('穿透次数大于0的子弹应该能穿透多个敌人', () => {
            const bulletId = generateId();
            const enemy1Id = generateId();
            const enemy2Id = generateId();
            const playerId = generateId();

            world.entities.set(bulletId, []);
            world.entities.set(enemy1Id, []);
            world.entities.set(enemy2Id, []);
            world.entities.set(playerId, []);

            addComponent(world, playerId, new PlayerTag());

            addComponent(world, bulletId, new Transform({ x: 100, y: 100 }));
            addComponent(world, bulletId, new HitBox({ shape: 'circle', radius: 10, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, bulletId, new Bullet({ owner: playerId, ammoType: AmmoType.VULCAN_SPREAD, pierceLeft: 2 }));

            // 两个敌人都在子弹路径上，但彼此不碰撞（距离足够远）
            addComponent(world, enemy1Id, new Transform({ x: 110, y: 100 }));
            addComponent(world, enemy1Id, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.Enemy }));
            addComponent(world, enemy1Id, new EnemyTag({ id: 1 }));

            addComponent(world, enemy2Id, new Transform({ x: 200, y: 100 }));
            addComponent(world, enemy2Id, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.Enemy }));
            addComponent(world, enemy2Id, new EnemyTag({ id: 2 }));

            CollisionSystem(world, 0.016);

            // 应该只生成一个 HitEvent（只击中 enemy1）
            const hitEvents = world.events.filter(e => e.type === 'Hit');
            expect(hitEvents.length).toBe(1);
            expect(hitEvents[0].victim).toBe(enemy1Id);

            // 子弹还没被销毁（还能穿透1次）
            const bulletComps = world.entities.get(bulletId);
            expect(bulletComps?.some(c => c instanceof DestroyTag)).toBe(false);
        });
    });

    describe('子弹互击', () => {
        it('玩家子弹和敌人子弹碰撞时应该双双销毁', () => {
            const playerBulletId = generateId();
            const enemyBulletId = generateId();
            const playerId = generateId();
            const enemyId = generateId();

            world.entities.set(playerBulletId, []);
            world.entities.set(enemyBulletId, []);
            world.entities.set(playerId, []);
            world.entities.set(enemyId, []);

            // 设置玩家
            addComponent(world, playerId, new PlayerTag());

            // 设置敌人
            addComponent(world, enemyId, new EnemyTag({ id: 1 }));

            // 玩家子弹
            addComponent(world, playerBulletId, new Transform({ x: 100, y: 100 }));
            addComponent(world, playerBulletId, new HitBox({ shape: 'circle', radius: 10, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, playerBulletId, new Bullet({ owner: playerId, ammoType: AmmoType.VULCAN_SPREAD }));

            // 敌人子弹
            addComponent(world, enemyBulletId, new Transform({ x: 105, y: 100 }));
            addComponent(world, enemyBulletId, new HitBox({ shape: 'circle', radius: 10, layer: CollisionLayer.EnemyBullet }));
            addComponent(world, enemyBulletId, new Bullet({ owner: enemyId, ammoType: AmmoType.VULCAN_SPREAD }));

            CollisionSystem(world, 0.016);

            // 两颗子弹都应该被标记销毁
            expect(world.entities.get(playerBulletId)?.some(c => c instanceof DestroyTag)).toBe(true);
            expect(world.entities.get(enemyBulletId)?.some(c => c instanceof DestroyTag)).toBe(true);
        });
    });

    describe('玩家无敌状态', () => {
        it('无敌状态的玩家不应该受到伤害', () => {
            const bulletId = generateId();
            const playerId = generateId();
            const enemyId = generateId();

            world.entities.set(bulletId, []);
            world.entities.set(playerId, []);
            world.entities.set(enemyId, []);

            addComponent(world, bulletId, new Transform({ x: 100, y: 100 }));
            addComponent(world, bulletId, new HitBox({ shape: 'circle', radius: 10, layer: CollisionLayer.EnemyBullet }));
            addComponent(world, bulletId, new Bullet({ owner: enemyId, ammoType: AmmoType.VULCAN_SPREAD }));

            addComponent(world, playerId, new Transform({ x: 110, y: 100 }));
            addComponent(world, playerId, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.Player }));
            addComponent(world, playerId, new PlayerTag());
            addComponent(world, playerId, new InvulnerableState({ duration: 1000 }));

            addComponent(world, enemyId, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            // 不应该生成 HitEvent
            const hitEvents = world.events.filter(e => e.type === 'Hit');
            expect(hitEvents.length).toBe(0);
        });

        it('无敌状态的玩家冲撞敌人时不应受到伤害', () => {
            const playerId = generateId();
            const enemyId = generateId();

            world.entities.set(playerId, []);
            world.entities.set(enemyId, []);

            addComponent(world, playerId, new Transform({ x: 100, y: 100 }));
            addComponent(world, playerId, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.Player }));
            addComponent(world, playerId, new PlayerTag());
            addComponent(world, playerId, new InvulnerableState({ duration: 1000 }));

            addComponent(world, enemyId, new Transform({ x: 110, y: 100 }));
            addComponent(world, enemyId, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.Enemy }));
            addComponent(world, enemyId, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            // 不应该生成任何 HitEvent
            const hitEvents = world.events.filter(e => e.type === 'Hit');
            expect(hitEvents.length).toBe(0);
        });
    });

    describe('事件生成', () => {
        it('HitEvent 应该包含正确的位置和伤害信息', () => {
            const bulletId = generateId();
            const enemyId = generateId();
            const playerId = generateId();

            world.entities.set(bulletId, []);
            world.entities.set(enemyId, []);
            world.entities.set(playerId, []);

            addComponent(world, playerId, new PlayerTag());

            addComponent(world, bulletId, new Transform({ x: 100, y: 100 }));
            addComponent(world, bulletId, new HitBox({ shape: 'circle', radius: 10, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, bulletId, new Bullet({ owner: playerId, ammoType: AmmoType.VULCAN_SPREAD }));

            addComponent(world, enemyId, new Transform({ x: 110, y: 100 }));
            addComponent(world, enemyId, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.Enemy }));
            addComponent(world, enemyId, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            const hitEvents = world.events.filter(e => e.type === 'Hit');
            expect(hitEvents.length).toBeGreaterThan(0);
            expect(hitEvents[0]).toMatchObject({
                type: 'Hit',
                owner: playerId,
                victim: enemyId,
                damage: 10,
                pos: { x: 110, y: 100 }
            });
        });

        it('伤害值应该正确影响飙血等级', () => {
            const bulletId = generateId();
            const enemyId = generateId();
            const playerId = generateId();

            world.entities.set(bulletId, []);
            world.entities.set(enemyId, []);
            world.entities.set(playerId, []);

            addComponent(world, playerId, new PlayerTag());

            addComponent(world, bulletId, new Transform({ x: 100, y: 100 }));
            addComponent(world, bulletId, new HitBox({ shape: 'circle', radius: 10, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, bulletId, new Bullet({ owner: playerId, ammoType: AmmoType.VULCAN_SPREAD, damage: 35 }));

            addComponent(world, enemyId, new Transform({ x: 110, y: 100 }));
            addComponent(world, enemyId, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.Enemy }));
            addComponent(world, enemyId, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            const hitEvents = world.events.filter(e => e.type === 'Hit');
            expect(hitEvents[0].bloodLevel).toBe(3); // damage > 30
        });
    });

    describe('清理事件队列', () => {
        it('每帧应该先清空上一帧的事件', () => {
            // 添加旧事件
            world.events.push({ type: 'Hit', pos: { x: 0, y: 0 }, damage: 10, owner: 1, victim: 2, bloodLevel: 1 });

            const bulletId = generateId();
            const enemyId = generateId();
            const playerId = generateId();

            world.entities.set(bulletId, []);
            world.entities.set(enemyId, []);
            world.entities.set(playerId, []);

            addComponent(world, playerId, new PlayerTag());

            addComponent(world, bulletId, new Transform({ x: 100, y: 100 }));
            addComponent(world, bulletId, new HitBox({ shape: 'circle', radius: 10, layer: CollisionLayer.PlayerBullet }));
            addComponent(world, bulletId, new Bullet({ owner: playerId, ammoType: AmmoType.VULCAN_SPREAD }));

            addComponent(world, enemyId, new Transform({ x: 110, y: 100 }));
            addComponent(world, enemyId, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.Enemy }));
            addComponent(world, enemyId, new EnemyTag({ id: 1 }));

            CollisionSystem(world, 0.016);

            // 旧事件应该被清空，只保留新事件
            expect(world.events.length).toBe(1);
            expect(world.events[0].victim).toBe(enemyId);
        });
    });

    describe('空间哈希网格', () => {
        it('大量实体时应该正确检测碰撞', () => {
            const playerId = generateId();
            world.entities.set(playerId, []);
            addComponent(world, playerId, new PlayerTag());

            // 创建 50 个敌人和 50 个玩家子弹
            const enemies: number[] = [];
            const bullets: number[] = [];

            for (let i = 0; i < 50; i++) {
                const enemyId = generateId();
                const bulletId = generateId();

                enemies.push(enemyId);
                bullets.push(bulletId);

                world.entities.set(enemyId, []);
                world.entities.set(bulletId, []);

                // 敌人散布在不同位置，间隔足够大避免互相碰撞
                const ex = 100 + (i % 10) * 150;
                const ey = 100 + Math.floor(i / 10) * 150;

                // 子弹在敌人附近
                addComponent(world, enemyId, new Transform({ x: ex, y: ey }));
                addComponent(world, enemyId, new HitBox({ shape: 'circle', radius: 20, layer: CollisionLayer.Enemy }));
                addComponent(world, enemyId, new EnemyTag({ id: i }));

                addComponent(world, bulletId, new Transform({ x: ex + 5, y: ey }));
                addComponent(world, bulletId, new HitBox({ shape: 'circle', radius: 10, layer: CollisionLayer.PlayerBullet }));
                addComponent(world, bulletId, new Bullet({ owner: playerId, ammoType: AmmoType.VULCAN_SPREAD }));
            }

            CollisionSystem(world, 0.016);

            // 应该生成 50 个 HitEvent
            const hitEvents = world.events.filter(e => e.type === 'Hit');
            expect(hitEvents.length).toBe(50);
        });
    });
});
