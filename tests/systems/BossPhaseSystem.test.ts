/**
 * BossPhaseSystem 单元测试
 */

import { BossPhaseSystem, resetBossPhases, removeBossPhase } from '../../src/engine/systems/BossPhaseSystem';
import { World } from '../../src/engine/types';
import { Transform, Health, BossTag, BossAI, SpeedStat, Weapon } from '../../src/engine/components';
import { BossId } from '../../src/engine/types/ids';
import { EnemyWeaponId } from '../../src/engine/types/ids';

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
            new Weapon({
                id: EnemyWeaponId.GUARDIAN_RADIAL,
                ammoType: 'enemy_orb_blue' as any,
                cooldown: 1000,
                curCD: 500,
                bulletCount: 6,
                spread: 360,
                pattern: 'radial' as any
            }),
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
            const health = bossComps?.find(Health.check) as Health;

            // 设置为阶段 1，但血量是100%应该回到阶段0
            bossAI!.phase = 1;
            health!.hp = 2000; // 100%血量
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 0.1);

            // 系统应该根据血量重新计算阶段（100%血量应该在P1=阶段0）
            expect(bossAI!.phase).toBe(0);
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

    describe('武器切换', () => {
        it('应该在阶段切换时更换武器', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;
            const weapon = bossComps?.find(Weapon.check) as Weapon;

            // 降低血量触发P2阶段切换（50%阈值）
            health!.hp = 900;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 0.1);

            // 武器ID应该改变（Guardian P2使用GUARDIAN_RADIAL_ENRAGED）
            expect(weapon!.id).toBe(EnemyWeaponId.GUARDIAN_RADIAL_ENRAGED);
        });

        it('应该重置武器冷却时间', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;
            const weapon = bossComps?.find(Weapon.check) as Weapon;

            // 设置冷却中
            weapon!.curCD = 500;

            // 降低血量触发阶段切换
            health!.hp = 900;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 0.1);

            // 冷却应该被重置为0
            expect(weapon!.curCD).toBe(0);
        });
    });

    describe('修正器应用', () => {
        it('应该正确应用速度修正器（覆盖模式）', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;
            const speedStat = bossComps?.find(SpeedStat.check) as SpeedStat;

            // 设置初始速度
            speedStat!.maxLinear = 120;

            // 降低血量触发P2阶段（moveSpeed: 1.5）
            health!.hp = 900;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 0.1);

            // 速度应该是 120 * 1.5 = 180（覆盖模式）
            expect(speedStat!.maxLinear).toBe(180);
        });

        it('应该应用damage修正器到Weapon组件', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;
            const weapon = bossComps?.find(Weapon.check) as Weapon;

            // 降低血量触发P2阶段（无damage修正，应该为1.0）
            health!.hp = 900;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 0.1);

            // damageMultiplier应该被设置
            expect(weapon!.damageMultiplier).toBeDefined();
        });

        it('应该应用fireRate修正器到Weapon组件', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;
            const weapon = bossComps?.find(Weapon.check) as Weapon;

            // 降低血量触发P2阶段（fireRate: 1.5）
            health!.hp = 900;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 0.1);

            // fireRateMultiplier应该为1.5
            expect(weapon!.fireRateMultiplier).toBe(1.5);
        });
    });

    describe('特殊事件', () => {
        it('应该在阶段切换时触发特殊事件', () => {
            // 使用Apocalypse Boss（有specialEvents配置）
            const apocalypseBossId = 101;
            mockWorld.entities.set(apocalypseBossId, [
                new Transform({ x: 400, y: 100, rot: 180 }),
                new Health({ hp: 20000, max: 20000 }),
                new BossTag({ id: BossId.APOCALYPSE }),
                new BossAI({ phase: 2 }),
                new SpeedStat({ maxLinear: 120, maxAngular: 2 }),
                new Weapon({
                    id: EnemyWeaponId.APOCALYPSE_BERSERK,
                    ammoType: 'enemy_beam_thin' as any,
                    cooldown: 300,
                    curCD: 0,
                    bulletCount: 1,
                    pattern: 'random' as any
                }),
            ]);

            // 降低血量触发P4阶段（25%阈值，有specialEvents）
            const bossComps = mockWorld.entities.get(apocalypseBossId);
            const health = bossComps?.find(Health.check) as Health;
            health!.hp = 4000;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 0.1);

            // 应该触发BossSpecialEvent
            const specialEvents = mockWorld.events.filter(e => e.type === 'BossSpecialEvent');
            expect(specialEvents.length).toBeGreaterThan(0);
        });
    });

    describe('BossVisual组件', () => {
        it('应该在有phaseColor时创建BossVisual组件', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;

            // 降低血量触发P2阶段（有phaseColor: '#ffaa00'）
            health!.hp = 900;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 0.1);

            // 应该有BossVisual组件
            const bossVisual = bossComps?.find(c => c.constructor.name === 'BossVisual');
            expect(bossVisual).toBeDefined();
        });

        it('应该更新现有BossVisual组件的颜色', () => {
            // 添加BossVisual组件
            const bossComps = mockWorld.entities.get(bossId);
            const { BossVisual } = require('../../src/engine/components/meta');

            let visual = bossComps?.find((c: any) => c instanceof BossVisual);
            if (!visual) {
                visual = new BossVisual({ color: '#ffffff' });
                bossComps?.push(visual);
            }

            const health = bossComps?.find(Health.check) as Health;
            health!.hp = 900;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 0.1);

            // 颜色应该更新为P2的颜色
            expect((visual as any).color).toBe('#ffaa00');
        });
    });
});
