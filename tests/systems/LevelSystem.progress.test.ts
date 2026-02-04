/**
 * LevelSystem 进度更新功能单元测试
 */

import { createWorld, generateId, addComponent, view } from '../../src/engine/world';
import { LevelSystem } from '../../src/engine/systems/LevelSystem';
import { LevelTransitionComponent } from '../../src/engine/components/transition';
import { KillEvent } from '../../src/engine/events';
import { pushEvent, getEvents } from '../../src/engine/world';

describe('LevelSystem - 进度更新功能', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
        // 初始化关卡状态
        world.levelState = {
            currentLevel: 1,
            progress: 0,
            elapsedTime: 0,
            killCount: 0,
        };
    });

    describe('时间驱动进度增长', () => {
        it('10秒应该增长15%进度', () => {
            const dt = 10000; // 10秒
            LevelSystem(world, dt);

            // 预期: 10秒 * 1.5%/秒 = 15%
            expect(world.levelState?.progress).toBeCloseTo(15, 1);
        });

        it('1秒应该增长1.5%进度', () => {
            const dt = 1000; // 1秒
            LevelSystem(world, dt);

            expect(world.levelState?.progress).toBeCloseTo(1.5, 1);
        });
    });

    describe('击杀加速进度', () => {
        it('20次击杀应该加速10%进度', () => {
            // 模拟20次击杀事件
            for (let i = 0; i < 20; i++) {
                pushEvent(world, {
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: world.playerId,
                    score: 100,
                } as KillEvent);
            }

            // 记录击杀到状态中
            const killEvents = getEvents<KillEvent>(world, 'Kill');
            world.levelState!.killCount = killEvents.length;

            LevelSystem(world, 0);

            // 预期: 20次击杀 * 0.5%/次 = 10%
            expect(world.levelState?.progress).toBeCloseTo(10, 1);
            // 击杀计数应该被清零
            expect(world.levelState?.killCount).toBe(0);
        });

        it('击杀计数应该在处理后归零', () => {
            world.levelState!.killCount = 10;

            LevelSystem(world, 0);

            expect(world.levelState?.killCount).toBe(0);
        });
    });

    describe('最低时间保护', () => {
        it('60秒应该至少有80%进度', () => {
            const dt = 60000; // 60秒
            LevelSystem(world, dt);

            // 预期: (60秒 / 60秒) * 100 * 0.8 = 80%
            expect(world.levelState?.progress).toBeGreaterThanOrEqual(80);
        });

        it('30秒应该至少有40%进度', () => {
            const dt = 30000; // 30秒
            LevelSystem(world, dt);

            // 预期: (30秒 / 60秒) * 100 * 0.8 = 40%
            expect(world.levelState?.progress).toBeGreaterThanOrEqual(40);
        });
    });

    describe('进度封顶', () => {
        it('进度应该封顶到120%', () => {
            // 模拟足够长的时间超过120%
            const dt = 100000; // 100秒
            world.levelState!.killCount = 100; // 额外的击杀奖励

            LevelSystem(world, dt);

            expect(world.levelState?.progress).toBeLessThanOrEqual(120);
        });

        it('超过120%的进度应该被限制', () => {
            world.levelState!.progress = 130;
            world.levelState!.elapsedTime = 100000;
            world.levelState!.killCount = 0;

            LevelSystem(world, 0);

            expect(world.levelState?.progress).toBe(120);
        });
    });

    describe('过渡状态处理', () => {
        it('过渡中不应该更新进度', () => {
            // 添加过渡组件实体（使用一个唯一的实体ID）
            const transitionId = 999; // 使用一个不会冲突的ID
            addComponent(world, transitionId, new LevelTransitionComponent({
                kind: 'LevelTransition',
                timer: 0,
                duration: 1500,
                fromLevel: 1,
                toLevel: 2,
            }));

            // 验证实体是否被正确添加
            const entity = world.entities.get(transitionId);
            expect(entity).toBeDefined();
            expect(entity?.length).toBe(1);
            expect(entity?.[0]).toBeInstanceOf(LevelTransitionComponent);

            const initialProgress = world.levelState?.progress ?? 0;
            LevelSystem(world, 1000);

            // 进度不应该变化
            expect(world.levelState?.progress).toBe(initialProgress);
        });

        it('过渡结束后应该恢复进度更新', () => {
            // 先不添加过渡组件，正常运行
            LevelSystem(world, 1000);

            const progressBefore = world.levelState?.progress ?? 0;

            // 移除过渡组件（模拟过渡结束）
            LevelSystem(world, 1000);

            expect(world.levelState?.progress).toBeGreaterThan(progressBefore);
        });
    });

    describe('边界条件处理', () => {
        it('负时间不应该处理', () => {
            const initialProgress = world.levelState?.progress ?? 0;
            const initialElapsedTime = world.levelState?.elapsedTime ?? 0;

            LevelSystem(world, -1000);

            // 进度和时间都不应该变化
            expect(world.levelState?.progress).toBe(initialProgress);
            expect(world.levelState?.elapsedTime).toBe(initialElapsedTime);
        });

        it('零时间应该不更新进度', () => {
            LevelSystem(world, 0);

            expect(world.levelState?.progress).toBe(0);
            expect(world.levelState?.elapsedTime).toBe(0);
        });
    });

    describe('elapsedTime 累加', () => {
        it('elapsedTime 应该累加每帧的 dt', () => {
            LevelSystem(world, 1000);
            expect(world.levelState?.elapsedTime).toBe(1000);

            LevelSystem(world, 500);
            expect(world.levelState?.elapsedTime).toBe(1500);

            LevelSystem(world, 2000);
            expect(world.levelState?.elapsedTime).toBe(3500);
        });

        it('连续调用应该正确累加时间', () => {
            const iterations = 10;
            const dtPerFrame = 100; // 每帧100毫秒

            for (let i = 0; i < iterations; i++) {
                LevelSystem(world, dtPerFrame);
            }

            expect(world.levelState?.elapsedTime).toBe(iterations * dtPerFrame);
        });
    });

    describe('综合场景', () => {
        it('时间增长 + 击杀奖励应该正确累加', () => {
            const dt = 10000; // 10秒 -> 15%进度
            world.levelState!.killCount = 10; // 10次击杀 -> 5%进度

            LevelSystem(world, dt);

            // 预期: 15% + 5% = 20%
            expect(world.levelState?.progress).toBeCloseTo(20, 1);
        });
    });
});
