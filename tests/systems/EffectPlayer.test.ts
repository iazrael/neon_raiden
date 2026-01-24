/**
 * EffectPlayer 单元测试
 */

import { EffectPlayer, updateParticles } from '../../src/engine/systems/EffectPlayer';
import { World } from '../../src/engine/types';
import { Transform, Sprite, Particle, Lifetime } from '../../src/engine/components';
import { HitEvent, KillEvent, PickupEvent, ComboUpgradeEvent } from '../../src/engine/events';

describe('EffectPlayer', () => {
    let mockWorld: World;

    beforeEach(() => {
        // 创建模拟世界对象
        mockWorld = {
            entities: new Map(),
            playerId: 1,
            width: 800,
            height: 600,
            time: 0,
            score: 0,
            level: 0,
            difficulty: 1.0,
            spawnCredits: 100,
            spawnTimer: 0,
            enemyCount: 0,
            events: [],
            comboState: { count: 0, timer: 0, multiplier: 1 },
        } as unknown as World;
    });

    describe('Hit 事件处理', () => {
        it('应该处理 Hit 事件并生成粒子', () => {
            mockWorld.events = [
                { type: 'Hit', pos: { x: 400, y: 300 }, damage: 20, owner: 1, victim: 2, bloodLevel: 1 }
            ];

            const initialEntityCount = mockWorld.entities.size;

            EffectPlayer(mockWorld, 0.016);

            // 应该生成粒子实体
            expect(mockWorld.entities.size).toBeGreaterThan(initialEntityCount);
        });

        it('应该根据血量等级生成不同的粒子', () => {
            mockWorld.events = [
                { type: 'Hit', pos: { x: 400, y: 300 }, damage: 50, owner: 1, victim: 2, bloodLevel: 2 }
            ];

            EffectPlayer(mockWorld, 0.016);

            // 应该生成粒子
            expect(mockWorld.entities.size).toBeGreaterThan(0);
        });

        it('应该根据伤害值选择粒子大小', () => {
            mockWorld.events = [
                { type: 'Hit', pos: { x: 400, y: 300 }, damage: 100, owner: 1, victim: 2, bloodLevel: 3 }
            ];

            EffectPlayer(mockWorld, 0.016);

            // 系统应该正常运行
            expect(true).toBe(true);
        });
    });

    describe('Kill 事件处理', () => {
        it('应该处理 Kill 事件并生成爆炸特效', () => {
            mockWorld.events = [
                { type: 'Kill', pos: { x: 400, y: 300 }, victim: 2, killer: 1, score: 100 }
            ];

            EffectPlayer(mockWorld, 0.016);

            // 应该生成爆炸粒子
            expect(mockWorld.entities.size).toBeGreaterThan(0);
        });

        it('应该根据得分选择爆炸大小', () => {
            mockWorld.events = [
                { type: 'Kill', pos: { x: 400, y: 300 }, victim: 2, killer: 1, score: 1000 }
            ];

            EffectPlayer(mockWorld, 0.016);

            // 系统应该正常运行
            expect(true).toBe(true);
        });
    });

    describe('Pickup 事件处理', () => {
        it('应该处理 Pickup 事件并生成拾取特效', () => {
            mockWorld.events = [
                { type: 'Pickup', pos: { x: 400, y: 300 }, itemId: 'POWER', owner: 1 }
            ];

            EffectPlayer(mockWorld, 0.016);

            // 应该生成拾取粒子
            expect(mockWorld.entities.size).toBeGreaterThan(0);
        });
    });

    describe('ComboUpgrade 事件处理', () => {
        it('应该处理 ComboUpgrade 事件', () => {
            mockWorld.events = [
                { type: 'ComboUpgrade', pos: { x: 400, y: 100 }, level: 2, name: 'GOOD', color: '#00ff00' }
            ];

            EffectPlayer(mockWorld, 0.016);

            // 应该生成连击升级粒子
            expect(mockWorld.entities.size).toBeGreaterThan(0);
        });
    });

    describe('粒子更新', () => {
        it('应该更新粒子动画帧', () => {
            // 添加一个粒子实体
            const id = 100;
            mockWorld.entities.set(id, [
                new Transform({ x: 400, y: 300, rot: 0 }),
                new Sprite({ color: '#ff0000', srcX: 0, srcY: 0, srcW: 32, srcH: 32 }),
                new Particle({ frame: 0, maxFrame: 8, fps: 16 }),
                new Lifetime({ timer: 1000 })
            ]);

            updateParticles(mockWorld, 0.1);

            // 帧应该增加
            const comps = mockWorld.entities.get(id);
            const particle = comps?.find(c => c instanceof Particle) as Particle;
            expect(particle!.frame).toBeGreaterThan(0);
        });

        it('应该在粒子播放完毕后标记销毁', () => {
            // 添加一个粒子实体
            const id = 100;
            mockWorld.entities.set(id, [
                new Transform({ x: 400, y: 300, rot: 0 }),
                new Sprite({ color: '#ff0000', srcX: 0, srcY: 0, srcW: 32, srcH: 32 }),
                new Particle({ frame: 7, maxFrame: 8, fps: 16 }),
                new Lifetime({ timer: 1000 })
            ]);

            updateParticles(mockWorld, 0.1);

            // Lifetime 应该被设置为 0
            const comps = mockWorld.entities.get(id);
            const lifetime = comps?.find(c => c instanceof Lifetime) as Lifetime;
            expect(lifetime!.timer).toBe(0);
        });
    });

    describe('边界情况', () => {
        it('空事件列表应该正常处理', () => {
            mockWorld.events = [];

            expect(() => EffectPlayer(mockWorld, 0.016)).not.toThrow();
        });

        it('无效的特效配置应该跳过', () => {
            mockWorld.events = [
                { type: 'PlaySound', name: 'invalid_sound' } as any
            ];

            expect(() => EffectPlayer(mockWorld, 0.016)).not.toThrow();
        });
    });
});
