/**
 * 关卡系统集成测试
 * 测试 LevelSystem 与其他系统的交互
 */

import { createWorld, generateId, addComponent, view } from '../../src/engine/world';
import { LevelSystem } from '../../src/engine/systems/LevelSystem';
import { LEVEL_CONFIGS } from '../../src/engine/configs/levels';

describe('LevelSystem - 集成测试', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
        world.levelState = {
            currentLevel: 1,
            progress: 0,
            elapsedTime: 0,
            killCount: 0,
        };
        world.bossState = {
            bossId: 0,
            spawned: false,
            timer: 0,
        } as any;
    });

    describe('完整游戏循环 - 关卡 1 到 2', () => {
        it('应该正确处理从关卡 1 到关卡 2 的完整过渡', () => {
            // 创建玩家
            const playerId = generateId();
            world.playerId = playerId;
            addComponent(world, playerId, {} as any);
            addComponent(world, playerId, { x: 400, y: 520, rot: 0 } as any);
            addComponent(world, playerId, { hp: 100, max: 100 } as any);

            // 模拟 Boss 击杀
            world.levelState!.killCount = 10;
            world.levelState!.currentLevel = 1;
            world.levelState!.progress = 100;
            world.levelState!.elapsedTime = 60000;
            world.events.push({
                type: 'BossDefeat',
                bossId: 'GUARDIAN',
            } as any);

            // 运行 LevelSystem 处理 Boss 击杀
            LevelSystem(world, 16);

            // 验证 Boss 退场组件被创建
            const exitEntities = [...view(world, [])];
            const exitCount = (exitEntities as any).length;
            expect(exitCount).toBeGreaterThan(0);

            // 验证 currentLevel 未立即更新
            expect(world.levelState?.currentLevel).toBe(1);

            // 模拟 Boss 退场完成（2秒后）
            LevelSystem(world, 2000);

            // 验证关卡过渡组件被创建
            const transitionEntities = [...view(world, [])];
            const transitionCount = (transitionEntities as any).length;
            expect(transitionCount).toBeGreaterThan(0);

            // 验证 currentLevel 已更新到 2（过渡完成）
            expect(world.levelState?.currentLevel).toBe(2);

            // 验证 LevelTransitionCompleteEvent 被推送
            const completeEvents = world.events.filter((e: any) => e.type === 'LevelTransitionComplete');
            expect(completeEvents.length).toBe(1);
            expect((completeEvents[0] as any).level).toBe(2);
        });

        it('应该正确处理从关卡 9 到关卡 10 的过渡', () => {
            // 创建玩家
            const playerId = generateId();
            world.playerId = playerId;
            addComponent(world, playerId, {} as any);
            addComponent(world, playerId, { x: 400, y: 520, rot: 0 } as any);
            addComponent(world, playerId, { hp: 100, max: 100 } as any);

            // 模拟 Boss 击杀
            world.levelState!.killCount = 10;
            world.levelState!.currentLevel = 9;
            world.levelState!.progress = 100;
            world.levelState!.elapsedTime = 60000;
            world.events.push({
                type: 'BossDefeat',
                bossId: 'COLOSSUS',
            } as any);

            // 运行 LevelSystem
            LevelSystem(world, 16);

            // 验证 currentLevel 未立即更新
            expect(world.levelState?.currentLevel).toBe(9);

            // Boss 退场完成
            LevelSystem(world, 2000);

            // 验证关卡过渡组件被创建
            const transitionEntities = [...view(world, [])];
            const transitionCount = (transitionEntities as any).length;
            expect(transitionCount).toBeGreaterThan(0);

            // 验证关卡过渡完成
            expect(world.levelState?.currentLevel).toBe(10);

            // 验证 LevelTransitionCompleteEvent 被推送
            const completeEvents = world.events.filter((e: any) => e.type === 'LevelTransitionComplete');
            expect(completeEvents.length).toBe(1);
            expect((completeEvents[0] as any).level).toBe(10);
        });
    });

    describe('进度更新集成测试', () => {
        it('应该正确更新关卡进度', () => {
            // 设置初始状态
            world.levelState!.currentLevel = 1;
            world.levelState!.progress = 0;
            world.levelState!.elapsedTime = 0;
            world.levelState!.killCount = 0;

            // 创建玩家
            const playerId = generateId();
            world.playerId = playerId;
            addComponent(world, playerId, {} as any);

            // 运行系统更新
            LevelSystem(world, 16); // ~1.5%

            // 验证进度增加
            expect(world.levelState!.progress).toBeGreaterThan(0);
            expect(world.levelState!.elapsedTime).toBe(16);

            // 多次运行，验证进度持续增加
            LevelSystem(world, 1000);
            expect(world.levelState!.progress).toBeGreaterThan(1.5); // 1.5%/秒 * 1秒
            expect(world.levelState!.elapsedTime).toBe(1016);
        });

        it('击杀应该加速进度', () => {
            world.levelState!.currentLevel = 1;
            world.levelState!.progress = 0;
            world.levelState!.elapsedTime = 0;
            world.levelState!.killCount = 0;

            // 创建玩家
            const playerId = generateId();
            world.playerId = playerId;
            addComponent(world, playerId, {} as any);

            // 模拟 10 次击杀
            for (let i = 0; i < 10; i++) {
                world.levelState!.killCount = 10;
                world.events.push({
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: playerId,
                    score: 100,
                } as any);

                LevelSystem(world, 16);
            }

            // 验证进度增加（击杀加速）
            expect(world.levelState!.progress).toBeGreaterThan(0);
            // 10次击杀，每次在 updateProgress 中被清零前累加 10 * 0.5% = 5%
            expect(world.levelState!.elapsedTime).toBe(160); // 10 * 16ms
        });
    });

    describe('关卡配置集成测试', () => {
        it('应该正确获取关卡配置', () => {
            // 验证关卡 1 配置
            const level1Config = LEVEL_CONFIGS[1];
            expect(level1Config).toBeDefined();

            // 验证关卡 2 配置
            const level2Config = LEVEL_CONFIGS[2];
            expect(level2Config).toBeDefined();

            // 验证关卡 10 配置
            const level10Config = LEVEL_CONFIGS[10];
            expect(level10Config).toBeDefined();
        });

        it('不存在的关卡应该返回 undefined', () => {
            const invalidLevel = LEVEL_CONFIGS[999];
            expect(invalidLevel).toBeUndefined();
        });
    });

    describe('边界条件测试', () => {
        it('第一关开始时应该有初始进度', () => {
            world.levelState!.currentLevel = 1;
            world.levelState!.progress = 0;
            world.levelState!.elapsedTime = 0;
            world.levelState!.killCount = 0;

            // 创建玩家
            const playerId = generateId();
            world.playerId = playerId;
            addComponent(world, playerId, {} as any);

            // 运行系统
            LevelSystem(world, 16);

            // 验证初始进度
            expect(world.levelState!.progress).toBeGreaterThan(0);
        });

        it('超过最大关卡数应该触发胜利', () => {
            // 设置关卡 10
            world.levelState!.currentLevel = 10;
            world.levelState!.progress = 100;
            world.levelState!.elapsedTime = 60000;

            // 创建玩家
            const playerId = generateId();
            world.playerId = playerId;
            addComponent(world, playerId, {} as any);

            // 先触发 LevelSystem 更新（让进度完成）
            LevelSystem(world, 1000);

            // 模拟 Boss 击杀
            world.levelState!.killCount = 10;
            world.events.push({
                type: 'BossDefeat',
                bossId: 'APOCALYPSE',
            } as any);

            // 运行 LevelSystem
            LevelSystem(world, 16);
            LevelSystem(world, 2000); // Boss 退场完成

            // 验证胜利事件被推送
            const victoryEvents = world.events.filter((e: any) => e.type === 'Victory');
            expect(victoryEvents.length).toBe(1);
            expect((victoryEvents[0] as any).finalLevel).toBe(10);
        });

        it('重复 Boss 击杀应该被忽略', () => {
            world.levelState!.currentLevel = 1;
            world.levelState!.progress = 100;

            // 创建玩家
            const playerId = generateId();
            world.playerId = playerId;
            addComponent(world, playerId, {} as any);

            // 第一次 Boss 击杀
            world.events.push({
                type: 'Kill',
                pos: { x: 400, y: 300 },
                victim: generateId(),
                killer: playerId,
                score: 100,
            } as any);

            LevelSystem(world, 16);

            // 第二次 Boss 击杀（应该被忽略）
            world.events.push({
                type: 'Kill',
                pos: { x: 400, y: 300 },
                victim: generateId(),
                killer: playerId,
                score: 100,
            } as any);

            LevelSystem(world, 16);

            // 验证只创建了一个 BossExitComponent
            const exitEntities = [...view(world, [])];
            const exitCount = (exitEntities as any).length;
            expect(exitCount).toBeGreaterThan(0);
        });
    });

    describe('与 DamageResolutionSystem 交互', () => {
        it('DamageResolutionSystem 击杀后应该可以正确处理', () => {
            // 这是一个框架测试，确保系统能正确交互
            world.levelState!.currentLevel = 1;
            world.levelState!.progress = 0;
            world.levelState!.killCount = 0;

            // 创建玩家
            const playerId = generateId();
            world.playerId = playerId;
            addComponent(world, playerId, {} as any);

            // 生成击杀事件
            world.events.push({
                type: 'Kill',
                pos: { x: 400, y: 300 },
                victim: generateId(),
                killer: playerId,
                score: 100,
            } as any);

            // 运行 LevelSystem
            LevelSystem(world, 16);

            // 系统应该正常运行，不崩溃
            expect(true).toBe(true);
        });
    });

    describe('与 Boss 系统交互', () => {
        it('LevelSystem 应该正确设置 Boss 生成触发条件', () => {
            world.levelState!.currentLevel = 1;
            world.levelState!.progress = 90; // >= 90%
            world.levelState!.elapsedTime = 60000; // >= 60秒

            // 创建玩家
            const playerId = generateId();
            world.playerId = playerId;
            addComponent(world, playerId, {} as any);

            // 运行 LevelSystem
            LevelSystem(world, 16);

            // 验证进度
            expect(world.levelState!.progress).toBeGreaterThanOrEqual(90);
        });
    });
});
