/**
 * LevelSystem Boss 击杀处理功能单元测试
 */

import { createWorld, generateId, addComponent, view } from '../../src/engine/world';
import { LevelSystem } from '../../src/engine/systems/LevelSystem';
import { BossExitComponent, LevelTransitionComponent } from '../../src/engine/components/transition';
import { BossDefeatEvent, BossExitStartEvent } from '../../src/engine/events';
import { pushEvent, getEvents } from '../../src/engine/world';

describe('LevelSystem - Boss 击杀处理功能', () => {
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

    describe('processBossDefeat', () => {
        it('Boss 击杀应该添加退场组件', () => {
            const bossId = generateId();

            pushEvent(world, {
                type: 'BossDefeat',
                bossId: 'boss1',
            } as BossDefeatEvent);

            LevelSystem(world, 0);

            // 检查是否添加了 BossExitComponent
            const exitEntities = [...view(world, [BossExitComponent])];
            expect(exitEntities.length).toBe(1);
            const [, [exitComp]] = exitEntities[0];
            expect(exitComp.bossId).toBe('boss1');
            expect(exitComp.timer).toBe(0);
        });

        it('Boss 击杀连发防护：已有退场组件时不重复添加', () => {
            const bossId = generateId();

            // 先添加一个退场组件
            addComponent(world, 999, new BossExitComponent({
                kind: 'BossExit',
                timer: 500,
                duration: 2000,
                bossId: 'boss1',
                bossType: 'boss1',
            }));

            // 推送两次 BossDefeatEvent
            pushEvent(world, {
                type: 'BossDefeat',
                bossId: 'boss1',
            } as BossDefeatEvent);

            pushEvent(world, {
                type: 'BossDefeat',
                bossId: 'boss1',
            } as BossDefeatEvent);

            LevelSystem(world, 0);

            // 应该只有一个退场组件
            const exitEntities = [...view(world, [BossExitComponent])];
            expect(exitEntities.length).toBe(1);
        });

        it('Boss 击杀应该推送 BossExitStartEvent', () => {
            pushEvent(world, {
                type: 'BossDefeat',
                bossId: 'boss2',
            } as BossDefeatEvent);

            LevelSystem(world, 0);

            // 检查是否推送了 BossExitStartEvent
            const exitStartEvents = getEvents<BossExitStartEvent>(world, 'BossExitStart');
            expect(exitStartEvents.length).toBe(1);
            expect(exitStartEvents[0].bossId).toBe('boss2');
            expect(exitStartEvents[0].bossType).toBe('boss2');
        });
    });

    describe('updateBossExit', () => {
        it('Boss 退场计时器应该正确更新', () => {
            const bossId = generateId();

            // 添加退场组件
            addComponent(world, 999, new BossExitComponent({
                kind: 'BossExit',
                timer: 0,
                duration: 2000,
                bossId: 'boss1',
                bossType: 'boss1',
            }));

            LevelSystem(world, 500);

            // 检查计时器更新
            const exitEntities = [...view(world, [BossExitComponent])];
            const [, [exitComp]] = exitEntities[0];
            expect(exitComp.timer).toBe(500);
        });

        it('Boss 退场完成后应该触发关卡过渡', () => {
            const bossId = generateId();

            // 添加退场组件（timer 接近 duration）
            addComponent(world, 999, new BossExitComponent({
                kind: 'BossExit',
                timer: 1900,
                duration: 2000,
                bossId: 'boss1',
                bossType: 'boss1',
            }));

            // 设置当前关卡为 1
            world.levelState!.currentLevel = 1;

            LevelSystem(world, 100);

            // 检查是否创建了关卡过渡组件
            const transitionEntities = [...view(world, [LevelTransitionComponent])];
            expect(transitionEntities.length).toBe(1);
            const [, [transComp]] = transitionEntities[0];
            expect(transComp.fromLevel).toBe(1);
            expect(transComp.toLevel).toBe(2);
        });

        it('Boss 退场完成后应该移除退场组件', () => {
            // 添加退场组件
            addComponent(world, 999, new BossExitComponent({
                kind: 'BossExit',
                timer: 1900,
                duration: 2000,
                bossId: 'boss1',
                bossType: 'boss1',
            }));

            LevelSystem(world, 100);

            // 检查退场组件是否被移除
            const exitEntities = [...view(world, [BossExitComponent])];
            expect(exitEntities.length).toBe(0);
        });
    });
});
