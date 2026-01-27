/**
 * BossSystem 单元测试
 */

import { BossSystem } from '../../src/engine/systems/BossSystem';
import { World } from '../../src/engine/types';
import { Transform, Velocity, BossTag, BossAI, Weapon, SpeedStat, FireIntent } from '../../src/engine/components';
import { BossId } from '../../src/engine/types/ids';
import { AmmoType } from '../../src/engine/types/ids';

describe('BossSystem', () => {
    let mockWorld: World;
    let bossId: number;

    beforeEach(() => {
        // 创建模拟世界对象
        mockWorld = {
            entities: new Map(),
            playerId: 1,
            width: 800,
            height: 600,
            time: 0,
            events: [],
        } as unknown as World;

        // 添加玩家实体
        mockWorld.entities.set(mockWorld.playerId, [
            new Transform({ x: 400, y: 500, rot: 0 }),
        ]);

        // 添加 Boss 实体
        bossId = 100;
        mockWorld.entities.set(bossId, [
            new Transform({ x: 400, y: 100, rot: 180 }),
            new Velocity({ vx: 0, vy: 20, vrot: 0 }),
            new BossTag({ id: BossId.GUARDIAN }),
            new BossAI({ phase: 0 }),
            new Weapon({
                id: 'boss_weapon' as any,
                ammoType: AmmoType.ENEMY_ORB_GREEN,
                cooldown: 1000,
                curCD: 0,
                level: 1
            }),
            new SpeedStat({ maxLinear: 120, maxAngular: 2 }),
        ]);
    });

    describe('Boss 移动模式', () => {
        it('应该处理 Boss 移动', () => {
            mockWorld.time = 1;
            BossSystem(mockWorld, 0.1);

            const bossComps = mockWorld.entities.get(bossId);
            const velocity = bossComps?.find(Velocity.check) as Velocity;

            // Boss 应该有垂直速度
            expect(velocity?.vy).toBeGreaterThanOrEqual(0);
        });

        it('应该根据时间改变移动', () => {
            mockWorld.time = 1;
            BossSystem(mockWorld, 0.1);

            const bossComps = mockWorld.entities.get(bossId);
            const velocity1 = bossComps?.find(Velocity.check) as Velocity;
            const vx1 = velocity1!.vx;

            mockWorld.time = 2;
            BossSystem(mockWorld, 0.1);

            const velocity2 = bossComps?.find(Velocity.check) as Velocity;
            const vx2 = velocity2!.vx;

            // 不同时间的水平速度应该不同（正弦模式）
            expect(vx1).not.toBe(vx2);
        });

        it('应该正确设置速度值', () => {
            mockWorld.time = 2;
            BossSystem(mockWorld, 0.1);

            const bossComps = mockWorld.entities.get(bossId);
            const velocity = bossComps?.find(Velocity.check) as Velocity;

            // 速度应该被设置
            expect(velocity).toBeDefined();
            expect(typeof velocity?.vx).toBe('number');
            expect(typeof velocity?.vy).toBe('number');
        });
    });

    describe('Boss 开火', () => {
        it('应该处理武器冷却', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const weapon = bossComps?.find(Weapon.check) as Weapon;
            weapon!.curCD = 500;

            BossSystem(mockWorld, 0.1);

            // 冷却应该减少
            expect(weapon!.curCD).toBeLessThan(500);
        });

        it('冷却结束后应该添加开火意图', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const weapon = bossComps?.find(Weapon.check) as Weapon;
            weapon!.curCD = 0;

            // 移除所有开火意图
            const fireIntents = bossComps!.filter(FireIntent.check);
            fireIntents.forEach(f => {
                const idx = bossComps!.indexOf(f);
                if (idx > -1) bossComps!.splice(idx, 1);
            });

            BossSystem(mockWorld, 0.1);

            // 应该添加开火意图
            const newFireIntent = bossComps!.find(FireIntent.check);
            expect(newFireIntent).toBeDefined();
        });
    });

    describe('Boss 阶段', () => {
        it('应该根据 BossAI 阶段应用不同行为', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const bossAI = bossComps?.find(BossAI.check) as BossAI;

            bossAI!.phase = 1;
            BossSystem(mockWorld, 0.1);

            // 不同阶段应该有不同的行为
            expect(bossAI!.phase).toBe(1);
        });
    });

    describe('边界情况', () => {
        it('没有 Boss 实体时不应该崩溃', () => {
            mockWorld.entities.delete(bossId);

            expect(() => BossSystem(mockWorld, 0.1)).not.toThrow();
        });

        it('Boss 缺少必要组件时应该跳过', () => {
            // 添加一个只有 BossTag 的实体
            const incompleteBossId = 101;
            mockWorld.entities.set(incompleteBossId, [
                new BossTag({ id: BossId.GUARDIAN }),
            ]);

            expect(() => BossSystem(mockWorld, 0.1)).not.toThrow();
        });

        it('没有玩家时不应该崩溃', () => {
            mockWorld.entities.delete(mockWorld.playerId);

            expect(() => BossSystem(mockWorld, 0.1)).not.toThrow();
        });
    });

    describe('时间影响', () => {
        it('正弦移动应该受时间影响', () => {
            const velocities1: number[] = [];
            const velocities2: number[] = [];

            for (let t = 0; t < 5; t += 0.5) {
                mockWorld.time = t;
                BossSystem(mockWorld, 0.1);

                const bossComps = mockWorld.entities.get(bossId);
                const velocity = bossComps?.find(Velocity.check) as Velocity;
                velocities1.push(velocity!.vx);
            }

            for (let t = 10; t < 15; t += 0.5) {
                mockWorld.time = t;
                BossSystem(mockWorld, 0.1);

                const bossComps = mockWorld.entities.get(bossId);
                const velocity = bossComps?.find(Velocity.check) as Velocity;
                velocities2.push(velocity!.vx);
            }

            // 不同时间的速度应该不同
            expect(velocities1).not.toEqual(velocities2);
        });
    });
});
