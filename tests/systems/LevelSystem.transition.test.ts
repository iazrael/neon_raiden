/**
 * LevelSystem 关卡过渡功能单元测试
 */

import { createWorld, view } from '../../src/engine/world';
import { LevelSystem, startLevelTransition } from '../../src/engine/systems/LevelSystem';
import { LevelTransitionComponent } from '../../src/engine/components/transition';
import { LevelTransitionStartEvent, LevelTransitionCompleteEvent, StageOneIntroEvent } from '../../src/engine/events';
import { getEvents } from '../../src/engine/world';

describe('LevelSystem - 关卡过渡功能', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
        // 初始化关卡状态
        world.levelState = {
            currentLevel: 1,
            progress: 100,
            elapsedTime: 60000,
            killCount: 0,
        };
    });

    describe('startLevelTransition', () => {
        it('开始关卡过渡应该创建过渡组件', () => {
            startLevelTransition(world, 1, 2);

            // 检查是否创建了 LevelTransitionComponent
            const transitionEntities = [...view(world, [LevelTransitionComponent])];
            expect(transitionEntities.length).toBe(1);
            const [, [transComp]] = transitionEntities[0];
            expect(transComp.fromLevel).toBe(1);
            expect(transComp.toLevel).toBe(2);
            expect(transComp.timer).toBe(0);
            expect(transComp.duration).toBe(1500);
        });

        it('开始关卡过渡应该推送 LevelTransitionStartEvent', () => {
            startLevelTransition(world, 1, 2);

            // 检查是否推送了事件
            const startEvents = getEvents<LevelTransitionStartEvent>(world, 'LevelTransitionStart');
            expect(startEvents.length).toBe(1);
            expect(startEvents[0].fromLevel).toBe(1);
            expect(startEvents[0].toLevel).toBe(2);
        });
    });

    describe('updateLevelTransitions', () => {
        it('关卡过渡计时器应该正确更新', () => {
            startLevelTransition(world, 1, 2);

            LevelSystem(world, 500);

            // 检查计时器更新
            const transitionEntities = [...view(world, [LevelTransitionComponent])];
            const [, [transComp]] = transitionEntities[0];
            expect(transComp.timer).toBe(500);
        });

        it('关卡过渡完成应该更新 currentLevel', () => {
            // 设置当前关卡为 1
            world.levelState!.currentLevel = 1;

            // 开始过渡到关卡 2
            startLevelTransition(world, 1, 2);

            // 模拟过渡完成
            LevelSystem(world, 1500);

            // 检查 currentLevel 是否更新
            expect(world.levelState?.currentLevel).toBe(2);
        });

        it('关卡过渡完成应该推送 LevelTransitionCompleteEvent', () => {
            startLevelTransition(world, 1, 2);

            // 模拟过渡完成
            LevelSystem(world, 1500);

            // 检查是否推送了事件
            const completeEvents = getEvents<LevelTransitionCompleteEvent>(world, 'LevelTransitionComplete');
            expect(completeEvents.length).toBe(1);
            expect(completeEvents[0].level).toBe(2);
        });

        it('第一关应该触发进入动画', () => {
            // 设置当前关卡为 0（游戏初始状态）
            world.levelState!.currentLevel = 0;

            // 开始第一关过渡
            startLevelTransition(world, 0, 1);

            // 模拟过渡完成
            LevelSystem(world, 1500);

            // 检查是否推送了 StageOneIntroEvent
            const introEvents = getEvents<StageOneIntroEvent>(world, 'StageOneIntro');
            expect(introEvents.length).toBe(1);
            expect(introEvents[0].duration).toBe(2000);
        });

        it('非第一关不应该触发进入动画', () => {
            // 设置当前关卡为 1
            world.levelState!.currentLevel = 1;

            // 开始第二关过渡
            startLevelTransition(world, 1, 2);

            // 模拟过渡完成
            LevelSystem(world, 1500);

            // 检查不应该推送 StageOneIntroEvent
            const introEvents = getEvents<StageOneIntroEvent>(world, 'StageOneIntro');
            expect(introEvents.length).toBe(0);
        });
    });
});
