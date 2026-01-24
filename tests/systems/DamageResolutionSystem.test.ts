/**
 * DamageResolutionSystem 单元测试
 */

import { createWorld, generateId, addComponent } from '../../src/engine/world';
import { DamageResolutionSystem } from '../../src/engine/systems/DamageResolutionSystem';
import { Transform, Health, Shield, DestroyTag, ScoreValue } from '../../src/engine/components';
import { HitEvent } from '../../src/engine/events';

describe('DamageResolutionSystem', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
    });

    describe('基础伤害计算', () => {
        it('应该正确扣除生命值', () => {
            const victimId = generateId();
            world.entities.set(victimId, []);

            addComponent(world, victimId, new Transform({ x: 100, y: 100 }));
            addComponent(world, victimId, new Health({ hp: 100, max: 100 }));

            const hitEvent: HitEvent = {
                type: 'Hit',
                pos: { x: 100, y: 100 },
                damage: 30,
                owner: 1,
                victim: victimId,
                bloodLevel: 2
            };
            world.events.push(hitEvent);

            DamageResolutionSystem(world, 0.016);

            const health = world.entities.get(victimId)?.find(c => c instanceof Health) as Health;
            expect(health.hp).toBe(70);
        });

        it('伤害为0时不应该扣除生命值', () => {
            const victimId = generateId();
            world.entities.set(victimId, []);

            addComponent(world, victimId, new Transform({ x: 100, y: 100 }));
            addComponent(world, victimId, new Health({ hp: 100, max: 100 }));

            const hitEvent: HitEvent = {
                type: 'Hit',
                pos: { x: 100, y: 100 },
                damage: 0,
                owner: 1,
                victim: victimId,
                bloodLevel: 1
            };
            world.events.push(hitEvent);

            DamageResolutionSystem(world, 0.016);

            const health = world.entities.get(victimId)?.find(c => c instanceof Health) as Health;
            expect(health.hp).toBe(100);
        });
    });

    describe('护盾机制', () => {
        it('应该优先扣除护盾值', () => {
            const victimId = generateId();
            world.entities.set(victimId, []);

            addComponent(world, victimId, new Transform({ x: 100, y: 100 }));
            addComponent(world, victimId, new Health({ hp: 100, max: 100 }));
            addComponent(world, victimId, new Shield({ value: 50, regen: 0 }));

            const hitEvent: HitEvent = {
                type: 'Hit',
                pos: { x: 100, y: 100 },
                damage: 30,
                owner: 1,
                victim: victimId,
                bloodLevel: 1
            };
            world.events.push(hitEvent);

            DamageResolutionSystem(world, 0.016);

            const health = world.entities.get(victimId)?.find(c => c instanceof Health) as Health;
            const shield = world.entities.get(victimId)?.find(c => c instanceof Shield) as Shield;

            expect(health.hp).toBe(100); // 生命值不变
            expect(shield.value).toBe(20); // 护盾减少30
        });

        it('护盾不足时应该扣除剩余生命值', () => {
            const victimId = generateId();
            world.entities.set(victimId, []);

            addComponent(world, victimId, new Transform({ x: 100, y: 100 }));
            addComponent(world, victimId, new Health({ hp: 100, max: 100 }));
            addComponent(world, victimId, new Shield({ value: 20, regen: 0 }));

            const hitEvent: HitEvent = {
                type: 'Hit',
                pos: { x: 100, y: 100 },
                damage: 50,
                owner: 1,
                victim: victimId,
                bloodLevel: 2
            };
            world.events.push(hitEvent);

            DamageResolutionSystem(world, 0.016);

            const health = world.entities.get(victimId)?.find(c => c instanceof Health) as Health;
            const shield = world.entities.get(victimId)?.find(c => c instanceof Shield) as Shield;

            expect(shield.value).toBe(0); // 护盾归零
            expect(health.hp).toBe(70); // 生命值减少30
        });
    });

    describe('死亡处理', () => {
        it('生命值小于等于0时应该生成KillEvent', () => {
            const victimId = generateId();
            world.entities.set(victimId, []);

            addComponent(world, victimId, new Transform({ x: 100, y: 100 }));
            addComponent(world, victimId, new Health({ hp: 50, max: 100 }));
            addComponent(world, victimId, new ScoreValue({ value: 500 }));

            const hitEvent: HitEvent = {
                type: 'Hit',
                pos: { x: 100, y: 100 },
                damage: 60, // 超过当前HP
                owner: 1,
                victim: victimId,
                bloodLevel: 3
            };
            world.events.push(hitEvent);

            DamageResolutionSystem(world, 0.016);

            const killEvents = world.events.filter(e => e.type === 'Kill');
            expect(killEvents.length).toBeGreaterThan(0);
            expect(killEvents[0]).toMatchObject({
                type: 'Kill',
                victim: victimId,
                killer: 1,
                score: 500
            });
        });

        it('死亡时应该添加DestroyTag', () => {
            const victimId = generateId();
            world.entities.set(victimId, []);

            addComponent(world, victimId, new Transform({ x: 100, y: 100 }));
            addComponent(world, victimId, new Health({ hp: 10, max: 100 }));

            const hitEvent: HitEvent = {
                type: 'Hit',
                pos: { x: 100, y: 100 },
                damage: 20,
                owner: 1,
                victim: victimId,
                bloodLevel: 2
            };
            world.events.push(hitEvent);

            DamageResolutionSystem(world, 0.016);

            const destroyTag = world.entities.get(victimId)?.find(c => c instanceof DestroyTag);
            expect(destroyTag).toBeDefined();
            expect(destroyTag?.reason).toBe('killed');
        });

        it('没有ScoreValue时应该使用默认分数', () => {
            const victimId = generateId();
            world.entities.set(victimId, []);

            addComponent(world, victimId, new Transform({ x: 100, y: 100 }));
            addComponent(world, victimId, new Health({ hp: 10, max: 100 }));

            const hitEvent: HitEvent = {
                type: 'Hit',
                pos: { x: 100, y: 100 },
                damage: 20,
                owner: 1,
                victim: victimId,
                bloodLevel: 2
            };
            world.events.push(hitEvent);

            DamageResolutionSystem(world, 0.016);

            const killEvents = world.events.filter(e => e.type === 'Kill');
            expect(killEvents[0].score).toBe(100); // 默认分数
        });
    });

    describe('事件生成', () => {
        it('受到伤害时应该生成BloodFogEvent', () => {
            const victimId = generateId();
            world.entities.set(victimId, []);

            addComponent(world, victimId, new Transform({ x: 100, y: 100 }));
            addComponent(world, victimId, new Health({ hp: 100, max: 100 }));
            addComponent(world, victimId, new Shield({ value: 0, regen: 0 }));

            const hitEvent: HitEvent = {
                type: 'Hit',
                pos: { x: 100, y: 100 },
                damage: 30,
                owner: 1,
                victim: victimId,
                bloodLevel: 2
            };
            world.events.push(hitEvent);

            DamageResolutionSystem(world, 0.016);

            const bloodFogEvents = world.events.filter(e => e.type === 'BloodFog');
            expect(bloodFogEvents.length).toBeGreaterThan(0);
            expect(bloodFogEvents[0]).toMatchObject({
                type: 'BloodFog',
                pos: { x: 100, y: 100 },
                level: 2
            });
        });

        it('高伤害时应该生成CamShakeEvent', () => {
            const victimId = generateId();
            world.entities.set(victimId, []);

            addComponent(world, victimId, new Transform({ x: 100, y: 100 }));
            addComponent(world, victimId, new Health({ hp: 100, max: 100 }));
            addComponent(world, victimId, new Shield({ value: 0, regen: 0 }));

            const hitEvent: HitEvent = {
                type: 'Hit',
                pos: { x: 100, y: 100 },
                damage: 50, // 高伤害
                owner: 1,
                victim: victimId,
                bloodLevel: 3
            };
            world.events.push(hitEvent);

            DamageResolutionSystem(world, 0.016);

            const shakeEvents = world.events.filter(e => e.type === 'CamShake');
            expect(shakeEvents.length).toBeGreaterThan(0);
        });

        it('应该生成PlaySoundEvent', () => {
            const victimId = generateId();
            world.entities.set(victimId, []);

            addComponent(world, victimId, new Transform({ x: 100, y: 100 }));
            addComponent(world, victimId, new Health({ hp: 100, max: 100 }));
            addComponent(world, victimId, new Shield({ value: 0, regen: 0 }));

            const hitEvent: HitEvent = {
                type: 'Hit',
                pos: { x: 100, y: 100 },
                damage: 30,
                owner: 1,
                victim: victimId,
                bloodLevel: 2
            };
            world.events.push(hitEvent);

            DamageResolutionSystem(world, 0.016);

            const soundEvents = world.events.filter(e => e.type === 'PlaySound');
            expect(soundEvents.length).toBeGreaterThan(0);
            expect(soundEvents[0].name).toBe('hit');
        });
    });

    describe('持续伤害 (DOT)', () => {
        it('应该按间隔扣除生命值', () => {
            const victimId = generateId();
            world.entities.set(victimId, []);

            addComponent(world, victimId, new Transform({ x: 100, y: 100 }));
            addComponent(world, victimId, new Health({ hp: 100, max: 100 }));

            const { DamageOverTime: DOT } = require('../../src/engine/components/combat');
            addComponent(world, victimId, new DOT({
                damagePerSecond: 10,
                remaining: 1,
                interval: 0.2
            }));

            // 第一帧 - 不应该扣血（间隔未到）
            DamageResolutionSystem(world, 0.1);
            let health = world.entities.get(victimId)?.find(c => c instanceof Health) as Health;
            expect(health.hp).toBe(100);

            // 第二帧 - 应该扣血
            DamageResolutionSystem(world, 0.15);
            health = world.entities.get(victimId)?.find(c => c instanceof Health) as Health;
            expect(health.hp).toBeLessThan(100);
        });
    });
});
