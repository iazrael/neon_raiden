/**
 * Boss系统集成测试
 *
 * 测试Boss的完整生命周期：
 * - 生成 -> 阶段切换 -> 死亡
 */

import { BossPhaseSystem } from '../../src/engine/systems/BossPhaseSystem';
import { BossSystem } from '../../src/engine/systems/BossSystem';
import { WeaponSystem } from '../../src/engine/systems/WeaponSystem';
import { World } from '../../src/engine/types';
import { Transform, Health, BossTag, BossAI, SpeedStat, Weapon, Velocity } from '../../src/engine/components';
import { BossId, EnemyWeaponId } from '../../src/engine/types/ids';

describe('Boss集成测试', () => {
    let mockWorld: World;
    let bossId: number;

    beforeEach(() => {
        // 创建模拟世界对象
        mockWorld = {
            entities: new Map(),
            width: 800,
            height: 600,
            time: 0,
            events: [],
            playerId: 1,
            score: 0,
            level: 1,
            playerLevel: 1,
            difficulty: 1.0,
            spawnCredits: 100,
            spawnTimer: 0,
            enemyCount: 0,
            spawnInitialized: true,
        } as unknown as World;

        // 添加玩家实体（用于追踪移动模式）
        mockWorld.entities.set(1, [
            new Transform({ x: 400, y: 500, rot: 0 }),
        ]);

        // 添加Boss实体
        bossId = 100;
        mockWorld.entities.set(bossId, [
            new Transform({ x: 400, y: -200, rot: 180 }),
            new Health({ hp: 2000, max: 2000 }),
            new BossTag({ id: BossId.GUARDIAN }),
            new BossAI({ phase: 0, nextPatternTime: 0 }),
            new SpeedStat({ maxLinear: 120, maxAngular: 2 }),
            new Weapon({
                id: EnemyWeaponId.GUARDIAN_RADIAL,
                ammoType: 'enemy_orb_blue' as any,
                cooldown: 1000,
                curCD: 0,
                bulletCount: 6,
                spread: 360,
                pattern: 'radial' as any
            }),
            new Velocity({ vx: 0, vy: 0 }),
        ]);
    });

    describe('Guardian完整生命周期', () => {
        it('应该经历P1 -> P2阶段切换', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;
            const bossAI = bossComps?.find(BossAI.check) as BossAI;
            const weapon = bossComps?.find(Weapon.check) as Weapon;

            // 初始状态：P1阶段
            expect(bossAI!.phase).toBe(0);
            expect(weapon!.id).toBe(EnemyWeaponId.GUARDIAN_RADIAL);

            // 执行系统
            BossPhaseSystem(mockWorld, 16);
            BossSystem(mockWorld, 16);

            // 模拟时间流逝
            mockWorld.time += 1000;

            // 降低血量到50%以下触发P2
            health!.hp = 900;
            mockWorld.events = [];

            // 执行系统触发阶段切换
            BossPhaseSystem(mockWorld, 16);

            // 应该切换到P2阶段
            expect(bossAI!.phase).toBe(1);
            expect(weapon!.id).toBe(EnemyWeaponId.GUARDIAN_RADIAL_ENRAGED);
            expect(weapon!.curCD).toBe(0); // 冷却重置

            // BossSystem创建开火意图，WeaponSystem处理冷却和开火
            BossSystem(mockWorld, 16);
            WeaponSystem(mockWorld, 16);
            expect(weapon!.curCD).toBe(400); // 600 / 1.5 = 400
        });

        it('应该正确应用P2阶段的修正器', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;
            const speedStat = bossComps?.find(SpeedStat.check) as SpeedStat;

            // 降低血量到50%以下触发P2
            health!.hp = 900;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 16);

            // P2阶段moveSpeed修正器为1.5
            expect(speedStat!.maxLinear).toBe(180); // 120 * 1.5
        });
    });

    describe('Destroyer三阶段切换', () => {
        beforeEach(() => {
            // 使用Destroyer Boss（3阶段）
            mockWorld.entities.set(bossId, [
                new Transform({ x: 400, y: -200, rot: 180 }),
                new Health({ hp: 5800, max: 5800 }),
                new BossTag({ id: BossId.DESTROYER }),
                new BossAI({ phase: 0, nextPatternTime: 0 }),
                new SpeedStat({ maxLinear: 120, maxAngular: 2 }),
                new Weapon({
                    id: EnemyWeaponId.DESTROYER_MAIN,
                    ammoType: 'enemy_missile' as any,
                    cooldown: 800,
                    curCD: 0,
                    bulletCount: 4,
                    spread: 60,
                    pattern: 'spread' as any
                }),
                new Velocity({ vx: 0, vy: 0 }),
            ]);
        });

        it('应该正确切换P1 -> P2 -> P3', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;
            const bossAI = bossComps?.find(BossAI.check) as BossAI;
            const weapon = bossComps?.find(Weapon.check) as Weapon;

            // 初始：P1
            expect(bossAI!.phase).toBe(0);
            expect(weapon!.id).toBe(EnemyWeaponId.DESTROYER_MAIN);

            // P1 -> P2（70%阈值）
            health!.hp = 4000;
            mockWorld.events = [];
            BossPhaseSystem(mockWorld, 16);

            expect(bossAI!.phase).toBe(1);
            expect(weapon!.id).toBe(EnemyWeaponId.DESTROYER_DASH);

            // P2 -> P3（40%阈值）
            health!.hp = 2000;
            mockWorld.events = [];
            BossPhaseSystem(mockWorld, 16);

            expect(bossAI!.phase).toBe(2);
            expect(weapon!.id).toBe(EnemyWeaponId.DESTROYER_BERSERK);
        });
    });

    describe('Apocalypse四阶段 + 特殊事件', () => {
        beforeEach(() => {
            // 使用Apocalypse Boss（4阶段）
            mockWorld.entities.set(bossId, [
                new Transform({ x: 400, y: -200, rot: 180 }),
                new Health({ hp: 20000, max: 20000 }),
                new BossTag({ id: BossId.APOCALYPSE }),
                new BossAI({ phase: 0, nextPatternTime: 0 }),
                new SpeedStat({ maxLinear: 120, maxAngular: 2 }),
                new Weapon({
                    id: EnemyWeaponId.APOCALYPSE_MIXED,
                    ammoType: 'enemy_orb_red' as any,
                    cooldown: 1000,
                    curCD: 0,
                    bulletCount: 8,
                    spread: 360,
                    pattern: 'radial' as any
                }),
                new Velocity({ vx: 0, vy: 0 }),
            ]);
        });

        it('应该经历所有4个阶段', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;
            const bossAI = bossComps?.find(BossAI.check) as BossAI;

            // P1 -> P2（75%阈值）
            health!.hp = 14000;
            mockWorld.events = [];
            BossPhaseSystem(mockWorld, 16);
            expect(bossAI!.phase).toBe(1);

            // P2 -> P3（50%阈值）
            health!.hp = 9000;
            mockWorld.events = [];
            BossPhaseSystem(mockWorld, 16);
            expect(bossAI!.phase).toBe(2);

            // P3 -> P4（25%阈值）
            health!.hp = 4000;
            mockWorld.events = [];
            BossPhaseSystem(mockWorld, 16);
            expect(bossAI!.phase).toBe(3);
        });

        it('应该在P4阶段触发特殊事件', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;

            // 直接到P4阶段
            health!.hp = 4000;
            mockWorld.events = [];
            BossPhaseSystem(mockWorld, 16);

            // 应该触发BossSpecialEvent
            const specialEvents = mockWorld.events.filter(e => e.type === 'BossSpecialEvent');
            expect(specialEvents.length).toBeGreaterThan(0);

            // 验证事件内容
            const lastEvent = specialEvents[specialEvents.length - 1] as any;
            expect(lastEvent.event).toBeDefined();
            expect(lastEvent.bossId).toBe(bossId);
            expect(lastEvent.phase).toBe(3);
        });
    });

    describe('移动模式切换', () => {
        it('应该在阶段切换时改变移动模式', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;
            const bossAI = bossComps?.find(BossAI.check) as BossAI;
            const velocity = bossComps?.find(Velocity.check) as Velocity;

            // Guardian P1: SINE模式（vy=0，只有横向移动）
            mockWorld.time = 1000;
            BossSystem(mockWorld, 16);
            const vy1 = velocity!.vy;

            // SINE模式不应该有垂直速度
            expect(vy1).toBe(0);

            // 切换到P2: FOLLOW模式
            health!.hp = 900;
            mockWorld.events = [];
            BossPhaseSystem(mockWorld, 16);

            mockWorld.time += 100;
            BossSystem(mockWorld, 16);
            const vy2 = velocity!.vy;

            // FOLLOW模式应该有轻微的垂直波动（Math.sin(time * 3) * 5）
            // 在time=1100ms时，Math.sin(3.3) * 5 ≈ -4.9
            expect(vy2).not.toBe(0);
        });
    });

    describe('多Boss并存', () => {
        it('应该正确处理多个Boss的阶段', () => {
            // 添加第二个Boss
            const bossId2 = 101;
            mockWorld.entities.set(bossId2, [
                new Transform({ x: 400, y: -200, rot: 180 }),
                new Health({ hp: 3200, max: 3200 }),
                new BossTag({ id: BossId.INTERCEPTOR }),
                new BossAI({ phase: 0, nextPatternTime: 0 }),
                new SpeedStat({ maxLinear: 120, maxAngular: 2 }),
                new Weapon({
                    id: EnemyWeaponId.GENERIC_TARGETED,
                    ammoType: 'enemy_orb_red' as any,
                    cooldown: 1000,
                    curCD: 0,
                    bulletCount: 1,
                    pattern: 'aimed' as any
                }),
                new Velocity({ vx: 0, vy: 0 }),
            ]);

            const bossComps1 = mockWorld.entities.get(bossId);
            const bossComps2 = mockWorld.entities.get(bossId2);
            const bossAI1 = bossComps1?.find(BossAI.check) as BossAI;
            const bossAI2 = bossComps2?.find(BossAI.check) as BossAI;

            // 执行系统
            BossPhaseSystem(mockWorld, 16);
            BossSystem(mockWorld, 16);

            // 两个Boss应该都在P1阶段
            expect(bossAI1!.phase).toBe(0);
            expect(bossAI2!.phase).toBe(0);

            // 降低第一个Boss的血量
            const health1 = bossComps1?.find(Health.check) as Health;
            health1!.hp = 900;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 16);

            // 只有第一个Boss切换到P2
            expect(bossAI1!.phase).toBe(1);
            expect(bossAI2!.phase).toBe(0);
        });
    });

    describe('边界情况', () => {
        it('应该处理血量刚好等于阈值的情况', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;
            const bossAI = bossComps?.find(BossAI.check) as BossAI;

            // 血量刚好等于50%阈值
            health!.hp = 1000;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 16);

            // 应该触发阶段切换
            expect(bossAI!.phase).toBe(1);
        });

        it('应该处理快速连续阶段切换', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const health = bossComps?.find(Health.check) as Health;
            const bossAI = bossComps?.find(BossAI.check) as BossAI;

            // 快速降低血量跳过多个阶段
            health!.hp = 100;
            mockWorld.events = [];

            BossPhaseSystem(mockWorld, 16);

            // Guardian只有2个阶段，应该在P2
            expect(bossAI!.phase).toBe(1);
        });
    });
});
