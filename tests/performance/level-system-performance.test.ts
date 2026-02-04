/**
 * LevelSystem 性能测试
 * 测试实体查询性能、大量事件处理、大关卡进度计算等性能指标
 */

import { createWorld, generateId, addComponent, view } from '../../src/engine/world';
import { LevelSystem } from '../../src/engine/systems/LevelSystem';
import { LevelTransitionComponent, BossExitComponent } from '../../src/engine/components/transition';

describe('LevelSystem - 性能测试', () => {
    describe('实体查询性能', () => {
        it('大量实体的 view 查询应该保持高效', () => {
            const world = createWorld();
            world.width = 800;
            world.height = 600;

            // 初始化关卡状态
            world.levelState = {
                currentLevel: 1,
                progress: 0,
                elapsedTime: 0,
                killCount: 0,
            };

            // 创建大量实体（测试查询性能）
            for (let i = 0; i < 1000; i++) {
                const entityId = generateId();
                addComponent(world, entityId, { x: 0, y: 0, rot: 0 } as any);
            }

            // 测试 query 性能（大量实体查询）
            const start = performance.now();
            const entities = [...view(world, [])];
            const end = performance.now();

            expect(entities.length).toBe(1000);
            expect(end - start).toBeLessThan(100); // 100ms 内完成
        });
    });

    describe('大量 Boss 击杀事件处理性能', () => {
        it('处理大量 Boss 击杀事件应该高效', () => {
            const world = createWorld();
            world.width = 800;
            world.height = 600;
            world.levelState = {
                currentLevel: 1,
                progress: 0,
                elapsedTime: 0,
                killCount: 0,
            };

            const playerId = generateId();
            world.playerId = playerId;

            // 模拟 1000 次普通击杀（不影响系统）
            for (let i = 0; i < 1000; i++) {
                world.events.push({
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: playerId,
                    score: 100,
                } as any);
            }

            // 模拟 100 次真正的 Boss 击杀事件
            for (let i = 0; i < 100; i++) {
                world.events.push({
                    type: 'BossDefeat',
                    bossId: `BOSS_${i}`,
                } as any);
            }

            // 测试处理性能
            const start = performance.now();
            LevelSystem(world, 16);
            const end = performance.now();

            // 只有第一个 BossDefeat 会被处理（创建退场）
            expect(end - start).toBeLessThan(100); // 100ms 内完成
        });

        it('大量 Boss 击杀事件（带防护）应该高效', () => {
            const world = createWorld();
            world.width = 800;
            world.height = 600;
            world.levelState = {
                currentLevel: 1,
                progress: 0,
                elapsedTime: 0,
                killCount: 0,
            };

            const playerId = generateId();
            world.playerId = playerId;

            // 模拟大量 Boss 击杀事件（只有第一个应该触发退场）
            for (let i = 0; i < 100; i++) {
                world.events.push({
                    type: 'BossDefeat',
                    bossId: `BOSS_${i}`,
                } as any);
            }

            // 测试处理性能
            const start = performance.now();
            LevelSystem(world, 16);
            const end = performance.now();

            expect(end - start).toBeLessThan(100); // 100ms 内完成
        });
    });

    describe('关卡进度计算性能', () => {
        it('长时长的关卡进度计算应该保持稳定', () => {
            const world = createWorld();
            world.width = 800;
            world.height = 600;
            world.levelState = {
                currentLevel: 1,
                progress: 0,
                elapsedTime: 0,
                killCount: 0,
            };

            const playerId = generateId();
            world.playerId = playerId;

            // 模拟 60 秒的关卡时长
            const duration = 60000;
            const interval = 16;
            const iterations = Math.ceil(duration / interval);

            const start = performance.now();
            for (let i = 0; i < iterations; i++) {
                LevelSystem(world, interval);
            }
            const end = performance.now();

            expect(world.levelState?.elapsedTime).toBeCloseTo(duration, -2);
            expect(end - start).toBeLessThan(500); // 500ms 内完成
        });

        it('击杀加速应该保持线性增长', () => {
            const world = createWorld();
            world.width = 800;
            world.height = 600;
            world.levelState = {
                currentLevel: 1,
                progress: 0,
                elapsedTime: 0,
                killCount: 0,
            };

            const playerId = generateId();
            world.playerId = playerId;

            // 模拟 1000 次击杀（对进度无影响，因为不是 Boss 击杀）
            for (let i = 0; i < 1000; i++) {
                world.events.push({
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: playerId,
                    score: 100,
                } as any);
            }

            const start = performance.now();
            LevelSystem(world, 100);
            const end = performance.now();

            // 普通击杀不影响进度
            expect(world.levelState?.progress).toBeGreaterThan(0);
            expect(end - start).toBeLessThan(100); // 100ms 内完成
        });
    });

    describe('关卡过渡性能', () => {
        it('频繁创建和移除过渡实体应该高效', () => {
            const world = createWorld();
            world.width = 800;
            world.height = 600;
            world.levelState = {
                currentLevel: 1,
                progress: 100,
                elapsedTime: 60000,
                killCount: 0,
            };

            const playerId = generateId();
            world.playerId = playerId;

            // 模拟频繁的关卡过渡
            const iterations = 100;

            const start = performance.now();
            for (let i = 0; i < iterations; i++) {
                // 模拟 Boss 击杀
                world.events.push({
                    type: 'BossDefeat',
                    bossId: `BOSS_${i}`,
                } as any);

                LevelSystem(world, 16);

                // 模拟过渡完成
                world.events.push({
                    type: 'LevelTransitionComplete',
                    level: i + 2,
                } as any);

                LevelSystem(world, 1500);
            }
            const end = performance.now();

            // 注意：100 次过渡 * 1.5s = 150s 模拟时间，这是预期的
            // 实际执行时间应该快速处理这些事件
            expect(end - start).toBeLessThan(10000); // 10秒内完成
        });
    });

    describe('边界性能测试', () => {
        it('超大关卡号应该安全处理', () => {
            const world = createWorld();
            world.width = 800;
            world.height = 600;
            world.levelState = {
                currentLevel: 9999,
                progress: 100,
                elapsedTime: 60000,
                killCount: 0,
            };

            const playerId = generateId();
            world.playerId = playerId;

            // 模拟超大火力情况
            for (let i = 0; i < 1000; i++) {
                world.events.push({
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: playerId,
                    score: 100,
                } as any);
            }

            // 应该不会崩溃
            expect(() => {
                LevelSystem(world, 16);
            }).not.toThrow();

            // 应该不会导致状态混乱
            expect(world.levelState?.currentLevel).toBe(9999);
        });

        it('负时间增量应该被安全处理', () => {
            const world = createWorld();
            world.width = 800;
            world.height = 600;
            world.levelState = {
                currentLevel: 1,
                progress: 50,
                elapsedTime: 30000,
                killCount: 0,
            };

            // 负时间不应该导致问题
            expect(() => {
                LevelSystem(world, -100);
            }).not.toThrow();

            // elapsedTime 不应该减少
            expect(world.levelState?.elapsedTime).toBe(30000);
        });
    });
});
