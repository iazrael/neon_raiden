/**
 * LevelSystem 通关逻辑单元测试
 */

import { createWorld, view } from '../../src/engine/world';
import { LevelSystem } from '../../src/engine/systems/LevelSystem';
import { LevelTransitionComponent, BossExitComponent } from '../../src/engine/components/transition';
import { BossDefeatEvent, VictoryEvent } from '../../src/engine/events';
import { BossId } from '../../src/engine/types';
import { pushEvent, getEvents } from '../../src/engine/world';

describe('LevelSystem - 通关逻辑', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
        // 初始化关卡状态
        world.levelState = {
            currentLevel: 10,
            progress: 100,
            elapsedTime: 60000,
            killCount: 0,
        };
    });

    describe('第10关Boss击杀', () => {
        it('第10关Boss击杀应该添加退场组件', () => {
            // 设置当前关卡为 10
            world.levelState!.currentLevel = 10;

            // 推送第10关Boss击杀事件（使用枚举）
            pushEvent(world, {
                type: 'BossDefeat',
                bossId: BossId.GUARDIAN, // 使用实际存在的Boss类型
            } as unknown as BossDefeatEvent);

            LevelSystem(world, 0);

            // 检查是否添加了 BossExitComponent
            const exitEntities = [...view(world, [BossExitComponent])];
            expect(exitEntities.length).toBe(1);
        });

        it('第10关Boss击杀后Boss退场完成应该触发VictoryEvent', () => {
            // 设置当前关卡为 10
            world.levelState!.currentLevel = 10;

            // 推送第10关Boss击杀事件（使用枚举）
            pushEvent(world, {
                type: 'BossDefeat',
                bossId: BossId.GUARDIAN, // 使用实际存在的Boss类型
            } as unknown as BossDefeatEvent);

            LevelSystem(world, 0);

            // 模拟Boss退场完成（2秒）
            LevelSystem(world, 2000);

            // 检查是否推送了 VictoryEvent
            const victoryEvents = getEvents<VictoryEvent>(world, 'Victory');
            expect(victoryEvents.length).toBe(1);
            expect(victoryEvents[0].finalLevel).toBe(10);
        });

        it('通关后不应该进入第11关', () => {
            // 设置当前关卡为 10
            world.levelState!.currentLevel = 10;

            // 推送第10关Boss击杀事件（使用枚举）
            pushEvent(world, {
                type: 'BossDefeat',
                bossId: BossId.GUARDIAN, // 使用实际存在的Boss类型
            } as unknown as BossDefeatEvent);

            LevelSystem(world, 0);

            // 模拟Boss退场完成
            LevelSystem(world, 2000);

            // 检查是否创建了关卡过渡组件
            const transitionEntities = [...view(world, [LevelTransitionComponent])];
            expect(transitionEntities.length).toBe(0);

            // 检查 currentLevel 是否仍然是 10
            expect(world.levelState?.currentLevel).toBe(10);
        });
    });

    describe('正常关卡过渡', () => {
        it('正常关卡过渡应该正确更新 currentLevel', () => {
            // 设置当前关卡为 5
            world.levelState!.currentLevel = 5;

            // 推送第5关Boss击杀事件（使用枚举）
            pushEvent(world, {
                type: 'BossDefeat',
                bossId: BossId.GUARDIAN, // 使用实际存在的Boss类型
            } as unknown as BossDefeatEvent);

            LevelSystem(world, 0);

            // 检查是否创建了Boss退场组件
            const exitEntities = [...view(world, [BossExitComponent])];
            expect(exitEntities.length).toBe(1);

            // 模拟Boss退场完成(2000ms)
            // 这会触发关卡过渡,但由于dt=2000 > duration(1500),过渡会立即完成
            LevelSystem(world, 2000);

            // Boss退场组件应该被移除
            const exitEntities2 = [...view(world, [BossExitComponent])];
            expect(exitEntities2.length).toBe(0);

            // 过渡组件已经被移除(因为dt=2000 > duration=1500)
            const transitionEntities = [...view(world, [LevelTransitionComponent])];
            expect(transitionEntities.length).toBe(0);

            // 检查 currentLevel 是否已经更新到 6
            expect(world.levelState?.currentLevel).toBe(6);
        });

        it('第9关Boss击杀应该过渡到第10关', () => {
            // 设置当前关卡为 9
            world.levelState!.currentLevel = 9;

            // 推送第9关Boss击杀事件（使用枚举）
            pushEvent(world, {
                type: 'BossDefeat',
                bossId: BossId.GUARDIAN, // 使用实际存在的Boss类型
            } as unknown as BossDefeatEvent);

            LevelSystem(world, 0);

            // 检查是否创建了Boss退场组件
            const exitEntities = [...view(world, [BossExitComponent])];
            expect(exitEntities.length).toBe(1);

            // 模拟Boss退场完成(2000ms)
            LevelSystem(world, 2000);

            // Boss退场组件应该被移除
            const exitEntities2 = [...view(world, [BossExitComponent])];
            expect(exitEntities2.length).toBe(0);

            // 过渡组件已经被移除(因为dt=2000 > duration=1500)
            const transitionEntities = [...view(world, [LevelTransitionComponent])];
            expect(transitionEntities.length).toBe(0);

            // 检查 currentLevel 是否已经更新到 10
            expect(world.levelState?.currentLevel).toBe(10);
        });
    });
});
