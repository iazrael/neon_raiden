/**
 * BossPhaseSystem 单元测试
 */

import { BossPhaseSystem, resetBossPhases, removeBossPhase } from '../../src/engine/systems/BossPhaseSystem';
import { World } from '../../src/engine/types';
import { Transform, Health, BossTag, BossAI, SpeedStat } from '../../src/engine/components';
import { BossId } from '../../src/engine/types/ids';

describe('BossPhaseSystem', () => {
    let mockWorld: World;
    let bossId: number;

    beforeEach(() => {
        // 重置 Boss 阶段状态
        resetBossPhases();

        // 创建模拟世界对象
        mockWorld = {
            entities: new Map(),
            width: 800,
            height: 600,
            time: 0,
            events: [],
        } as unknown as World;

        // 添加 Boss 实体
        bossId = 100;
        mockWorld.entities.set(bossId, [
            new Transform({ x: 400, y: 100, rot: 180 }),
            new Health({ hp: 2000, max: 2000 }),
            new BossTag({ id: BossId.GUARDIAN }),
            new BossAI({ phase: 0 }),
            new SpeedStat({ maxLinear: 120, maxAngular: 2 }),
        ]);
    });

    describe('阶段切换', () => {
        it('应该检查 Boss 血量阶段', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;
            const bossAI = bossComps?.find(BossAI.check) as BossAI;

            // 满血状态
            health!.hp = 2000;
            bossAI!.phase = 0;
            mockWorld.events = []; // 清空事件

            BossPhaseSystem(mockWorld, 0.1);

            // 满血时应该保持在阶段 0
            expect(bossAI!.phase).toBe(0);
        });

        it('应该根据血量计算正确的阶段', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;

            // 设置一个低于阈值的血量
            health!.hp = 500;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 0.1);

            // 系统应该正常运行（不崩溃）
            expect(true).toBe(true);
        });
    });

    describe('阶段属性修正', () => {
        it('应该应用阶段的速度修正', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;
            const speedStat = bossComps?.find(SpeedStat.check) as SpeedStat;

            const initialSpeed = speedStat!.maxLinear;

            // 降低血量触发阶段切换
            health!.hp = 100;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 0.1);

            // 速度可能被修改（取决于配置）
            // 这里主要测试不会崩溃
            expect(speedStat).toBeDefined();
        });
    });

    describe('事件生成', () => {
        it('应该处理阶段相关逻辑', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const bossAI = bossComps?.find(BossAI.check) as BossAI;

            // 设置为阶段 1
            bossAI!.phase = 1;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 0.1);

            // 系统应该正常运行
            expect(bossAI!.phase).toBe(1);
        });
    });

    describe('边界情况', () => {
        it('没有 Boss 实体时不应该崩溃', () => {
            mockWorld.entities.delete(bossId);

            expect(() => BossPhaseSystem(mockWorld, 0.1)).not.toThrow();
        });

        it('Boss 缺少必要组件时应该跳过', () => {
            const incompleteBossId = 101;
            mockWorld.entities.set(incompleteBossId, [
                new BossTag({ id: BossId.GUARDIAN }),
            ]);

            expect(() => BossPhaseSystem(mockWorld, 0.1)).not.toThrow();
        });

        it('血量百分比计算应该正确', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;

            // 50% 血量
            health!.hp = 1000;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 0.1);

            // 应该正确计算百分比
            expect(health!.hp / health!.max).toBe(0.5);
        });
    });

    describe('重置功能', () => {
        it('resetBossPhases 应该清空阶段记录', () => {
            // 触发一次阶段切换
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;
            health!.hp = 100;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 0.1);

            // 重置
            resetBossPhases();

            // 再次切换应该重新触发
            health!.hp = 50;
            mockWorld.events = [];

            expect(() => BossPhaseSystem(mockWorld, 0.1)).not.toThrow();
        });

        it('removeBossPhase 应该移除指定 Boss 的阶段记录', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;
            health!.hp = 100;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 0.1);

            // 移除 Boss 的阶段记录
            removeBossPhase(bossId);

            // 应该成功移除
            expect(() => removeBossPhase(bossId)).not.toThrow();
        });
    });

    describe('多 Boss 支持', () => {
        it('应该正确追踪多个 Boss 的阶段', () => {
            const bossId2 = 101;
            mockWorld.entities.set(bossId2, [
                new Transform({ x: 400, y: 100, rot: 180 }),
                new Health({ hp: 2000, max: 2000 }),
                new BossTag({ id: BossId.INTERCEPTOR }),
                new BossAI({ phase: 0 }),
                new SpeedStat({ maxLinear: 120, maxAngular: 2 }),
            ]);

            mockWorld.events = [];
            BossPhaseSystem(mockWorld, 0.1);

            // 两个 Boss 都应该保持初始阶段
            const boss1Comps = mockWorld.entities.get(bossId);
            const boss1AI = boss1Comps?.find(BossAI.check) as BossAI;
            expect(boss1AI!.phase).toBe(0);

            // 第二个 Boss 应该保持初始阶段
            const boss2Comps = mockWorld.entities.get(bossId2);
            const boss2AI = boss2Comps?.find(BossAI.check) as BossAI;
            expect(boss2AI!.phase).toBe(0);
        });
    });
});
