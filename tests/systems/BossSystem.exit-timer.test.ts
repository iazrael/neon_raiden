/**
 * BossSystem BossExitComponent timer 更新单元测试
 */

import { BossSystem } from '../../src/engine/systems/BossSystem';
import { BossExitComponent } from '../../src/engine/components/transition';
import { BossTag } from '../../src/engine/components/meta';
import { createWorld, addComponent } from '../../src/engine/world';

describe('BossSystem - BossExitComponent timer 更新', () => {
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

    describe('timer 更新逻辑', () => {
        it('应该更新 BossExitComponent 的 timer', () => {
            const bossId = 1;
            addComponent(world, bossId, new BossTag({ id: 'GUARDIAN' }));
            addComponent(world, bossId, new BossExitComponent({
                kind: 'BossExit',
                timer: 0,
                duration: 2000,
                bossId: 'boss-1',
                bossType: 'GUARDIAN',
            }));

            const dt = 100; // 100毫秒
            BossSystem(world, dt);

            const boss = world.entities.get(bossId);
            const exitComp = boss?.find(c => c instanceof BossExitComponent) as BossExitComponent;

            expect(exitComp).toBeDefined();
            expect(exitComp.timer).toBe(100);
        });

        it('多次调用应该累加 timer', () => {
            const bossId = 1;
            addComponent(world, bossId, new BossTag({ id: 'GUARDIAN' }));
            addComponent(world, bossId, new BossExitComponent({
                kind: 'BossExit',
                timer: 0,
                duration: 2000,
                bossId: 'boss-1',
                bossType: 'GUARDIAN',
            }));

            // 第一次调用
            BossSystem(world, 100);

            const boss = world.entities.get(bossId);
            const exitComp = boss?.find(c => c instanceof BossExitComponent) as BossExitComponent;

            expect(exitComp.timer).toBe(100);

            // 第二次调用
            BossSystem(world, 150);

            const updatedExitComp = boss?.find(c => c instanceof BossExitComponent) as BossExitComponent;

            expect(updatedExitComp.timer).toBe(250); // 100 + 150
        });

        it('timer 应该从初始值开始累加', () => {
            const bossId = 1;
            addComponent(world, bossId, new BossTag({ id: 'GUARDIAN' }));
            addComponent(world, bossId, new BossExitComponent({
                kind: 'BossExit',
                timer: 500, // 初始值为 500
                duration: 2000,
                bossId: 'boss-1',
                bossType: 'GUARDIAN',
            }));

            BossSystem(world, 100);

            const boss = world.entities.get(bossId);
            const exitComp = boss?.find(c => c instanceof BossExitComponent) as BossExitComponent;

            expect(exitComp.timer).toBe(600); // 500 + 100
        });
    });

    describe('多个 Boss 实体', () => {
        it('应该更新所有 Boss 的 BossExitComponent timer', () => {
            const boss1Id = 1;
            const boss2Id = 2;

            // Boss 1
            addComponent(world, boss1Id, new BossTag({ id: 'GUARDIAN' }));
            addComponent(world, boss1Id, new BossExitComponent({
                kind: 'BossExit',
                timer: 0,
                duration: 2000,
                bossId: 'boss-1',
                bossType: 'GUARDIAN',
            }));

            // Boss 2
            addComponent(world, boss2Id, new BossTag({ id: 'INTERCEPTOR' }));
            addComponent(world, boss2Id, new BossExitComponent({
                kind: 'BossExit',
                timer: 100,
                duration: 2000,
                bossId: 'boss-2',
                bossType: 'INTERCEPTOR',
            }));

            const dt = 50;
            BossSystem(world, dt);

            // 检查 Boss 1
            const boss1 = world.entities.get(boss1Id);
            const exitComp1 = boss1?.find(c => c instanceof BossExitComponent) as BossExitComponent;
            expect(exitComp1.timer).toBe(50);

            // 检查 Boss 2
            const boss2 = world.entities.get(boss2Id);
            const exitComp2 = boss2?.find(c => c instanceof BossExitComponent) as BossExitComponent;
            expect(exitComp2.timer).toBe(150); // 100 + 50
        });

        it('只有 BossExitComponent 的 Boss 才会更新 timer', () => {
            const boss1Id = 1;
            const boss2Id = 2;

            // Boss 1: 有 BossExitComponent
            addComponent(world, boss1Id, new BossTag({ id: 'GUARDIAN' }));
            addComponent(world, boss1Id, new BossExitComponent({
                kind: 'BossExit',
                timer: 0,
                duration: 2000,
                bossId: 'boss-1',
                bossType: 'GUARDIAN',
            }));

            // Boss 2: 没有 BossExitComponent
            addComponent(world, boss2Id, new BossTag({ id: 'INTERCEPTOR' }));

            BossSystem(world, 100);

            // Boss 1 应该更新
            const boss1 = world.entities.get(boss1Id);
            const exitComp1 = boss1?.find(c => c instanceof BossExitComponent) as BossExitComponent;
            expect(exitComp1.timer).toBe(100);

            // Boss 2 不应该有 BossExitComponent
            const boss2 = world.entities.get(boss2Id);
            const exitComp2 = boss2?.find(c => c instanceof BossExitComponent);
            expect(exitComp2).toBeUndefined();
        });
    });

    describe('边界条件', () => {
        it('dt 为 0 时 timer 不应该更新', () => {
            const bossId = 1;
            addComponent(world, bossId, new BossTag({ id: 'GUARDIAN' }));
            addComponent(world, bossId, new BossExitComponent({
                kind: 'BossExit',
                timer: 100,
                duration: 2000,
                bossId: 'boss-1',
                bossType: 'GUARDIAN',
            }));

            BossSystem(world, 0);

            const boss = world.entities.get(bossId);
            const exitComp = boss?.find(c => c instanceof BossExitComponent) as BossExitComponent;

            expect(exitComp.timer).toBe(100); // 保持不变
        });

        it('没有 Boss 实体时不应该崩溃', () => {
            expect(() => BossSystem(world, 100)).not.toThrow();
        });

        it('没有 BossExitComponent 的 Boss 不应该崩溃', () => {
            const bossId = 1;
            addComponent(world, bossId, new BossTag({ id: 'GUARDIAN' }));

            expect(() => BossSystem(world, 100)).not.toThrow();
        });
    });
});
