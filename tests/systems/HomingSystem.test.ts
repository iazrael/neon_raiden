/**
 * HomingSystem 单元测试
 * 测试导弹索敌、Boss追踪、差异化锁定限制和旋转角度修正
 */

import { createWorld, generateId, addComponent, view, getEntity } from '../../src/engine/world';
import { HomingSystem } from '../../src/engine/systems/HomingSystem';
import { Transform, Velocity, Homing, Health, EnemyTag, BossTag } from '../../src/engine/components';
import { EnemyId, BossId } from '../../src/engine/types';

describe('HomingSystem', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
    });

    describe('导弹旋转角度修正', () => {
        it('应该为导弹旋转角度增加90度偏移，使精灵图头朝向目标', () => {
            // 创建导弹（位于原点，向右飞行）
            const missileId = generateId();
            world.entities.set(missileId, []);
            addComponent(world, missileId, new Transform({ x: 0, y: 0, rot: 0 }));
            addComponent(world, missileId, new Velocity({ vx: 100, vy: 0, vrot: 0 }));
            addComponent(world, missileId, new Homing({
                searchRange: 500,
                turnSpeed: Math.PI * 2, // 360度/秒（足够快以完成转向）
                targetId: undefined
            }));

            // 创建敌人目标（位于正上方）
            const enemyId = generateId();
            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 0, y: -100, rot: 0 }));
            addComponent(world, enemyId, new Health({ hp: 100, max: 100 }));
            addComponent(world, enemyId, new EnemyTag({ id: 'GUARDIAN' as EnemyId }));

            // 执行系统（dt = 1000ms = 1秒）- 导弹会自动锁定并转向
            HomingSystem(world, 1000);

            // 验证导弹已锁定目标
            const homing = world.entities.get(missileId)!.find(c => c instanceof Homing)! as Homing;
            expect(homing.targetId).toBe(enemyId);

            // 验证旋转角度
            const missileTransform = world.entities.get(missileId)!.find(c => c instanceof Transform)! as Transform;

            // 更精确的验证：速度方向应该指向目标
            const missileVelocity = world.entities.get(missileId)!.find(c => c instanceof Velocity)! as Velocity;
            const actualAngle = Math.atan2(missileVelocity.vy, missileVelocity.vx);

            // 目标在(0, -100)，导弹在(0, 0)，角度应该是 -PI/2
            const targetAngle = Math.atan2(-100, 0);
            expect(actualAngle).toBeCloseTo(targetAngle, 1);

            // 验证精灵旋转角度 = 速度角度 + 90度偏移
            const expectedRotation = actualAngle + Math.PI / 2;
            expect(missileTransform.rot).toBeCloseTo(expectedRotation, 1);
        });

        it('应该平滑转向目标而不是瞬间转向', () => {
            // 创建导弹
            const missileId = generateId();
            world.entities.set(missileId, []);
            addComponent(world, missileId, new Transform({ x: 0, y: 0, rot: 0 }));
            addComponent(world, missileId, new Velocity({ vx: 100, vy: 0, vrot: 0 })); // 初始向右
            addComponent(world, missileId, new Homing({
                searchRange: 500,
                turnSpeed: Math.PI / 2, // 90度/秒（较慢）
                targetId: undefined
            }));

            // 创建目标（在正上方）
            const enemyId = generateId();
            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 0, y: -100, rot: 0 }));
            addComponent(world, enemyId, new Health({ hp: 100, max: 100 }));
            addComponent(world, enemyId, new EnemyTag({ id: 'GUARDIAN' as EnemyId }));

            const homing = world.entities.get(missileId)!.find(c => c instanceof Homing)! as Homing;
            homing.targetId = enemyId;

            // 执行系统（短时间）
            HomingSystem(world, 500); // 0.5秒

            const missileVelocity = world.entities.get(missileId)!.find(c => c instanceof Velocity)! as Velocity;
            const actualAngle = Math.atan2(missileVelocity.vy, missileVelocity.vx);

            // 转向速度是90度/秒，0.5秒只能转45度
            // 初始角度是0，目标角度是-PI/2，应该转向约-PI/4
            expect(actualAngle).toBeCloseTo(-Math.PI / 4, 1);
        });
    });

    describe('Boss追踪功能', () => {
        it('应该能够锁定Boss实体', () => {
            // 创建导弹
            const missileId = generateId();
            world.entities.set(missileId, []);
            addComponent(world, missileId, new Transform({ x: 0, y: 0, rot: 0 }));
            addComponent(world, missileId, new Velocity({ vx: 100, vy: 0, vrot: 0 }));
            addComponent(world, missileId, new Homing({
                searchRange: 500,
                turnSpeed: Math.PI,
                targetId: undefined
            }));

            // 创建Boss
            const bossId = generateId();
            world.entities.set(bossId, []);
            addComponent(world, bossId, new Transform({ x: 100, y: 0, rot: 0 }));
            addComponent(world, bossId, new Health({ hp: 5000, max: 5000 }));
            addComponent(world, bossId, new BossTag({ id: 'NEON_OVERLORD' as BossId }));

            // 执行系统
            HomingSystem(world, 16);

            // 验证导弹锁定了Boss
            const homing = world.entities.get(missileId)!.find(c => c instanceof Homing)! as Homing;
            expect(homing.targetId).toBe(bossId);

            // 验证Boss的incomingMissiles计数器增加
            const bossTag = world.entities.get(bossId)!.find(c => c instanceof BossTag)! as BossTag;
            expect(bossTag.incomingMissiles).toBe(1);
        });

        it('应该同时搜索EnemyTag和BossTag实体', () => {
            // 创建导弹
            const missileId = generateId();
            world.entities.set(missileId, []);
            addComponent(world, missileId, new Transform({ x: 0, y: 0, rot: 0 }));
            addComponent(world, missileId, new Velocity({ vx: 100, vy: 0, vrot: 0 }));
            addComponent(world, missileId, new Homing({
                searchRange: 500,
                turnSpeed: Math.PI,
                targetId: undefined
            }));

            // 创建普通敌人（距离200）
            const enemyId = generateId();
            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 200, y: 0, rot: 0 }));
            addComponent(world, enemyId, new Health({ hp: 100, max: 100 }));
            addComponent(world, enemyId, new EnemyTag({ id: 'GUARDIAN' as EnemyId }));

            // 创建Boss（距离100，更近）
            const bossId = generateId();
            world.entities.set(bossId, []);
            addComponent(world, bossId, new Transform({ x: 100, y: 0, rot: 0 }));
            addComponent(world, bossId, new Health({ hp: 5000, max: 5000 }));
            addComponent(world, bossId, new BossTag({ id: 'NEON_OVERLORD' as BossId }));

            // 执行系统
            HomingSystem(world, 16);

            // 验证导弹锁定了更近的Boss
            const homing = world.entities.get(missileId)!.find(c => c instanceof Homing)! as Homing;
            expect(homing.targetId).toBe(bossId);
        });

        it('当目标死亡时应该清除锁定并减少计数', () => {
            // 创建导弹
            const missileId = generateId();
            world.entities.set(missileId, []);
            addComponent(world, missileId, new Transform({ x: 0, y: 0, rot: 0 }));
            addComponent(world, missileId, new Velocity({ vx: 100, vy: 0, vrot: 0 }));
            addComponent(world, missileId, new Homing({
                searchRange: 500,
                turnSpeed: Math.PI,
                targetId: undefined
            }));

            // 创建Boss
            const bossId = generateId();
            world.entities.set(bossId, []);
            addComponent(world, bossId, new Transform({ x: 100, y: 0, rot: 0 }));
            addComponent(world, bossId, new Health({ hp: 0, max: 5000 })); // 已死亡
            addComponent(world, bossId, new BossTag({ id: 'NEON_OVERLORD' as BossId }));

            // 手动锁定（模拟锁定后死亡的情况）
            const homing = world.entities.get(missileId)!.find(c => c instanceof Homing)! as Homing;
            homing.targetId = bossId;

            const bossTag = world.entities.get(bossId)!.find(c => c instanceof BossTag)! as BossTag;
            bossTag.incomingMissiles = 1;

            // 执行系统
            HomingSystem(world, 16);

            // 验证锁定被清除
            expect(homing.targetId).toBeUndefined();

            // 验证计数器减少
            expect(bossTag.incomingMissiles).toBe(0);
        });

        it('当目标实体不存在时应该清除锁定', () => {
            // 创建导弹
            const missileId = generateId();
            world.entities.set(missileId, []);
            addComponent(world, missileId, new Transform({ x: 0, y: 0, rot: 0 }));
            addComponent(world, missileId, new Velocity({ vx: 100, vy: 0, vrot: 0 }));
            addComponent(world, missileId, new Homing({
                searchRange: 500,
                turnSpeed: Math.PI,
                targetId: 99999 // 不存在的实体ID
            }));

            // 创建一个带计数的敌人（模拟之前的锁定）
            const enemyId = generateId();
            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new EnemyTag({ id: 'GUARDIAN' as EnemyId }));
            const enemyTag = world.entities.get(enemyId)!.find(c => c instanceof EnemyTag)! as EnemyTag;
            enemyTag.incomingMissiles = 1;

            // 手动设置锁定（为了测试不存在目标的清理）
            const homing = world.entities.get(missileId)!.find(c => c instanceof Homing)! as Homing;
            homing.targetId = enemyId;

            // 删除敌人实体
            world.entities.delete(enemyId);

            // 执行系统
            HomingSystem(world, 16);

            // 验证锁定被清除
            expect(homing.targetId).toBeUndefined();
        });
    });

    describe('差异化锁定限制', () => {
        it('Boss默认应该能被3枚导弹同时锁定', () => {
            // 创建3枚导弹
            const missileIds = [generateId(), generateId(), generateId()];
            missileIds.forEach(id => {
                world.entities.set(id, []);
                addComponent(world, id, new Transform({ x: 0, y: 0, rot: 0 }));
                addComponent(world, id, new Velocity({ vx: 100, vy: 0, vrot: 0 }));
                addComponent(world, id, new Homing({
                    searchRange: 500,
                    turnSpeed: Math.PI,
                    targetId: undefined
                }));
            });

            // 创建Boss
            const bossId = generateId();
            world.entities.set(bossId, []);
            addComponent(world, bossId, new Transform({ x: 100, y: 0, rot: 0 }));
            addComponent(world, bossId, new Health({ hp: 5000, max: 5000 }));
            addComponent(world, bossId, new BossTag({ id: 'NEON_OVERLORD' as BossId }));

            // 执行系统
            HomingSystem(world, 16);

            // 验证所有3枚导弹都锁定了Boss
            const bossTag = world.entities.get(bossId)!.find(c => c instanceof BossTag)! as BossTag;
            expect(bossTag.incomingMissiles).toBe(3);

            missileIds.forEach(id => {
                const homing = world.entities.get(id)!.find(c => c instanceof Homing)! as Homing;
                expect(homing.targetId).toBe(bossId);
            });
        });

        it('Boss超过3枚导弹后，第4枚导弹应该锁定其他目标', () => {
            // 创建4枚导弹
            const missileIds: number[] = [];
            for (let i = 0; i < 4; i++) {
                const id = generateId();
                missileIds.push(id);
                world.entities.set(id, []);
                addComponent(world, id, new Transform({ x: 0, y: 0, rot: 0 }));
                addComponent(world, id, new Velocity({ vx: 100, vy: 0, vrot: 0 }));
                addComponent(world, id, new Homing({
                    searchRange: 500,
                    turnSpeed: Math.PI,
                    targetId: undefined
                }));
            }

            // 创建Boss
            const bossId = generateId();
            world.entities.set(bossId, []);
            addComponent(world, bossId, new Transform({ x: 100, y: 0, rot: 0 }));
            addComponent(world, bossId, new Health({ hp: 5000, max: 5000 }));
            addComponent(world, bossId, new BossTag({ id: 'NEON_OVERLORD' as BossId }));

            // 创建普通敌人
            const enemyId = generateId();
            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 150, y: 0, rot: 0 }));
            addComponent(world, enemyId, new Health({ hp: 100, max: 100 }));
            addComponent(world, enemyId, new EnemyTag({ id: 'GUARDIAN' as EnemyId }));

            // 执行系统
            HomingSystem(world, 16);

            // 验证Boss只有3枚锁定
            const bossTag = world.entities.get(bossId)!.find(c => c instanceof BossTag)! as BossTag;
            expect(bossTag.incomingMissiles).toBe(3);

            // 验证第4枚导弹锁定了敌人
            const enemyTag = world.entities.get(enemyId)!.find(c => c instanceof EnemyTag)! as EnemyTag;
            expect(enemyTag.incomingMissiles).toBe(1);

            // 验证所有导弹都有目标
            missileIds.forEach(id => {
                const homing = world.entities.get(id)!.find(c => c instanceof Homing)! as Homing;
                expect(homing.targetId).toBeDefined();
                expect(homing.targetId).toBeTruthy();
            });
        });

        it('普通敌人默认只能被1枚导弹锁定', () => {
            // 创建2枚导弹
            const missileIds = [generateId(), generateId()];
            missileIds.forEach(id => {
                world.entities.set(id, []);
                addComponent(world, id, new Transform({ x: 0, y: 0, rot: 0 }));
                addComponent(world, id, new Velocity({ vx: 100, vy: 0, vrot: 0 }));
                addComponent(world, id, new Homing({
                    searchRange: 500,
                    turnSpeed: Math.PI,
                    targetId: undefined
                }));
            });

            // 创建普通敌人
            const enemyId = generateId();
            world.entities.set(enemyId, []);
            addComponent(world, enemyId, new Transform({ x: 100, y: 0, rot: 0 }));
            addComponent(world, enemyId, new Health({ hp: 100, max: 100 }));
            addComponent(world, enemyId, new EnemyTag({ id: 'GUARDIAN' as EnemyId }));

            // 执行系统
            HomingSystem(world, 16);

            // 验证敌人只有1枚锁定
            const enemyTag = world.entities.get(enemyId)!.find(c => c instanceof EnemyTag)! as EnemyTag;
            expect(enemyTag.incomingMissiles).toBe(1);

            // 验证只有1枚导弹锁定了敌人
            let lockedCount = 0;
            missileIds.forEach(id => {
                const homing = world.entities.get(id)!.find(c => c instanceof Homing)! as Homing;
                if (homing.targetId === enemyId) {
                    lockedCount++;
                }
            });
            expect(lockedCount).toBe(1);
        });

        it('用户配置应该覆盖默认锁定限制', () => {
            // 创建第一枚导弹，配置maxMissilesPerTarget为1
            const missile1Id = generateId();
            world.entities.set(missile1Id, []);
            addComponent(world, missile1Id, new Transform({ x: 0, y: 0, rot: 0 }));
            addComponent(world, missile1Id, new Velocity({ vx: 100, vy: 0, vrot: 0 }));
            addComponent(world, missile1Id, new Homing({
                searchRange: 500,
                turnSpeed: Math.PI,
                targetId: undefined,
                maxMissilesPerTarget: 1 // 覆盖默认值
            }));

            // 创建Boss
            const bossId = generateId();
            world.entities.set(bossId, []);
            addComponent(world, bossId, new Transform({ x: 100, y: 0, rot: 0 }));
            addComponent(world, bossId, new Health({ hp: 5000, max: 5000 }));
            addComponent(world, bossId, new BossTag({ id: 'NEON_OVERLORD' as BossId }));

            // 第一枚导弹搜索并锁定
            HomingSystem(world, 16);

            // 验证Boss被1枚锁定
            let bossTag = world.entities.get(bossId)!.find(c => c instanceof BossTag)! as BossTag;
            expect(bossTag.incomingMissiles).toBe(1);

            // 创建第二枚导弹（在第一枚锁定后）
            const missile2Id = generateId();
            world.entities.set(missile2Id, []);
            addComponent(world, missile2Id, new Transform({ x: 0, y: 0, rot: 0 }));
            addComponent(world, missile2Id, new Velocity({ vx: 100, vy: 0, vrot: 0 }));
            addComponent(world, missile2Id, new Homing({
                searchRange: 500,
                turnSpeed: Math.PI,
                targetId: undefined,
                maxMissilesPerTarget: 1 // 覆盖默认值
            }));

            // 第二枚导弹搜索（应该跳过已达到上限的Boss）
            HomingSystem(world, 16);

            // 验证Boss仍然只有1枚锁定（用户配置生效）
            bossTag = world.entities.get(bossId)!.find(c => c instanceof BossTag)! as BossTag;
            expect(bossTag.incomingMissiles).toBe(1);

            // 验证第二枚导弹没有锁定Boss
            const missile2Homing = world.entities.get(missile2Id)!.find(c => c instanceof Homing)! as Homing;
            expect(missile2Homing.targetId).not.toBe(bossId);
        });
    });

    describe('集成测试', () => {
        it('应该正确处理完整的导弹生命周期（锁定-追踪-丢失-重新锁定）', () => {
            // 创建导弹
            const missileId = generateId();
            world.entities.set(missileId, []);
            addComponent(world, missileId, new Transform({ x: 0, y: 0, rot: 0 }));
            addComponent(world, missileId, new Velocity({ vx: 100, vy: 0, vrot: 0 }));
            addComponent(world, missileId, new Homing({
                searchRange: 500,
                turnSpeed: Math.PI,
                targetId: undefined
            }));

            // 创建敌人1
            const enemy1Id = generateId();
            world.entities.set(enemy1Id, []);
            addComponent(world, enemy1Id, new Transform({ x: 100, y: 0, rot: 0 }));
            addComponent(world, enemy1Id, new Health({ hp: 100, max: 100 }));
            addComponent(world, enemy1Id, new EnemyTag({ id: 'GUARDIAN' as EnemyId }));

            // 阶段1：锁定敌人1
            HomingSystem(world, 16);
            let homing = world.entities.get(missileId)!.find(c => c instanceof Homing)! as Homing;
            expect(homing.targetId).toBe(enemy1Id);

            let enemy1Tag = world.entities.get(enemy1Id)!.find(c => c instanceof EnemyTag)! as EnemyTag;
            expect(enemy1Tag.incomingMissiles).toBe(1);

            // 阶段2：敌人1死亡
            const health = world.entities.get(enemy1Id)!.find(c => c instanceof Health)! as Health;
            health.hp = 0;

            HomingSystem(world, 16);
            homing = world.entities.get(missileId)!.find(c => c instanceof Homing)! as Homing;
            expect(homing.targetId).toBeUndefined();
            expect(enemy1Tag.incomingMissiles).toBe(0);

            // 创建敌人2
            const enemy2Id = generateId();
            world.entities.set(enemy2Id, []);
            addComponent(world, enemy2Id, new Transform({ x: 150, y: 0, rot: 0 }));
            addComponent(world, enemy2Id, new Health({ hp: 100, max: 100 }));
            addComponent(world, enemy2Id, new EnemyTag({ id: 'GUARDIAN' as EnemyId }));

            // 阶段3：重新锁定敌人2
            HomingSystem(world, 16);
            homing = world.entities.get(missileId)!.find(c => c instanceof Homing)! as Homing;
            expect(homing.targetId).toBe(enemy2Id);

            const enemy2Tag = world.entities.get(enemy2Id)!.find(c => c instanceof EnemyTag)! as EnemyTag;
            expect(enemy2Tag.incomingMissiles).toBe(1);
        });

        it('应该在多导弹多目标场景下正确分配锁定', () => {
            // 创建5枚导弹
            const missileIds: number[] = [];
            for (let i = 0; i < 5; i++) {
                const id = generateId();
                missileIds.push(id);
                world.entities.set(id, []);
                addComponent(world, id, new Transform({ x: 0, y: 0, rot: 0 }));
                addComponent(world, id, new Velocity({ vx: 100, vy: 0, vrot: 0 }));
                addComponent(world, id, new Homing({
                    searchRange: 500,
                    turnSpeed: Math.PI,
                    targetId: undefined
                }));
            }

            // 创建1个Boss（可锁定3枚）
            const bossId = generateId();
            world.entities.set(bossId, []);
            addComponent(world, bossId, new Transform({ x: 100, y: 0, rot: 0 }));
            addComponent(world, bossId, new Health({ hp: 5000, max: 5000 }));
            addComponent(world, bossId, new BossTag({ id: 'NEON_OVERLORD' as BossId }));

            // 创建2个普通敌人（各可锁定1枚）
            const enemy1Id = generateId();
            world.entities.set(enemy1Id, []);
            addComponent(world, enemy1Id, new Transform({ x: 150, y: 0, rot: 0 }));
            addComponent(world, enemy1Id, new Health({ hp: 100, max: 100 }));
            addComponent(world, enemy1Id, new EnemyTag({ id: 'GUARDIAN' as EnemyId }));

            const enemy2Id = generateId();
            world.entities.set(enemy2Id, []);
            addComponent(world, enemy2Id, new Transform({ x: 200, y: 0, rot: 0 }));
            addComponent(world, enemy2Id, new Health({ hp: 100, max: 100 }));
            addComponent(world, enemy2Id, new EnemyTag({ id: 'GUARDIAN' as EnemyId }));

            // 执行系统
            HomingSystem(world, 16);

            // 验证分配：Boss 3枚，敌人1 1枚，敌人2 1枚
            const bossTag = world.entities.get(bossId)!.find(c => c instanceof BossTag)! as BossTag;
            expect(bossTag.incomingMissiles).toBe(3);

            const enemy1Tag = world.entities.get(enemy1Id)!.find(c => c instanceof EnemyTag)! as EnemyTag;
            expect(enemy1Tag.incomingMissiles).toBe(1);

            const enemy2Tag = world.entities.get(enemy2Id)!.find(c => c instanceof EnemyTag)! as EnemyTag;
            expect(enemy2Tag.incomingMissiles).toBe(1);

            // 验证所有导弹都有目标
            missileIds.forEach(id => {
                const homing = world.entities.get(id)!.find(c => c instanceof Homing)! as Homing;
                expect(homing.targetId).toBeDefined();
            });
        });
    });
});
