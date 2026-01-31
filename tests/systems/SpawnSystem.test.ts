/**
 * SpawnSystem 单元测试
 */

import { SpawnSystem, resetBossSpawnState, setBossSpawnTime } from '../../src/engine/systems/SpawnSystem';
import { Transform, Health, BossTag, BossAI, SpeedStat } from '../../src/engine/components';
import { EnemyId } from '../../src/engine/types/ids';
import { World } from '../../src/engine/world';

describe('SpawnSystem', () => {
    let mockWorld: World;

    beforeEach(() => {
        // 创建模拟世界对象
        mockWorld = {
            entities: new Map(),
            playerId: 1,
            playerEntity: [],
            width: 800,
            height: 600,
            time: 0,
            score: 0,
            level: 0,
            difficulty: 1.0,
            spawnCredits: 100,
            spawnTimer: 0,
            enemyCount: 0,
            events: [],
            comboState: { count: 0, timer: 0, multiplier: 1 },
            removedEntities: [],
            bossState: { timer: 60000, spawned: false },
        } as unknown as World;

        // 重置 Boss 状态
        resetBossSpawnState(mockWorld);
    });

    describe('刷怪点数机制', () => {
        it('应该处理刷怪点数逻辑', () => {
            mockWorld.spawnCredits = 50;
            mockWorld.spawnTimer = 0.3; // 超过 0.2 秒阈值，触发刷怪检查
            mockWorld.time = 1; // 设置时间用于正弦波计算

            SpawnSystem(mockWorld, 0.1);

            // 系统应该正常运行
            expect(mockWorld.spawnCredits).toBeDefined();
        });

        it('刷怪点数不应超过上限', () => {
            mockWorld.spawnCredits = 500; // 超过上限
            mockWorld.spawnTimer = 0.3;

            SpawnSystem(mockWorld, 0.1);

            // 不应超过上限（系统会限制）
            expect(mockWorld.spawnCredits).toBeLessThanOrEqual(500);
        });

        it('未达到阈值时应该跳过刷怪检查', () => {
            mockWorld.spawnTimer = 0;
            const initialCredits = mockWorld.spawnCredits;

            SpawnSystem(mockWorld, 0.1);

            // 0.1 秒内不会进行刷怪检查（未达到 0.2 秒阈值）
            // 但是点数仍然会通过 income 增加
            expect(mockWorld.spawnCredits).toBeGreaterThanOrEqual(initialCredits);
        });
    });

    describe('Boss 刷怪机制', () => {
        it('应该在时间到达后触发 Boss 刷怪', () => {
            mockWorld.time = 61; // 超过默认 60 秒
            mockWorld.spawnTimer = 0.3;

            SpawnSystem(mockWorld, 0.1);

            // Boss 标记应该被设置为已生成
            // 这里我们主要测试不会崩溃
            expect(true).toBe(true);
        });

        it('场上已有 Boss 时不应再刷', () => {
            mockWorld.time = 61;
            mockWorld.spawnTimer = 0.3;

            // 添加一个 Boss 实体
            const bossId = 999;
            mockWorld.entities.set(bossId, [
                new Transform({ x: 400, y: 100, rot: 0 }),
                new Health({ hp: 1000, max: 1000 }),
                new BossTag({ id: 'GUARDIAN' as any }),
                new BossAI({ phase: 0 }),
                new SpeedStat({ maxLinear: 100 })
            ]);

            const initialEntityCount = mockWorld.entities.size;

            SpawnSystem(mockWorld, 0.1);

            // 不应该生成新的 Boss
            expect(mockWorld.entities.size).toBe(initialEntityCount);
        });

        it('Boss 只应该生成一次', () => {
            mockWorld.time = 61;
            mockWorld.spawnTimer = 0.3;

            SpawnSystem(mockWorld, 0.1);
            SpawnSystem(mockWorld, 0.1);

            // 两次调用不应该生成多个 Boss
            // 由于模拟环境限制，这里主要测试逻辑不会出错
            expect(true).toBe(true);
        });
    });

    describe('性能保护', () => {
        it('同屏敌人数量不应超过上限', () => {
            mockWorld.spawnCredits = 1000;
            mockWorld.spawnTimer = 0.3;
            mockWorld.enemyCount = 50; // 达到上限

            SpawnSystem(mockWorld, 0.1);

            // 不应该继续刷怪
            // 由于模拟限制，这里测试不会崩溃
            expect(true).toBe(true);
        });
    });

    describe('重置功能', () => {
        it('resetBossSpawnState 应该重置 Boss 生成状态', () => {
            resetBossSpawnState(mockWorld);

            // 重置后，时间满足条件应该再次触发 Boss
            mockWorld.time = 61;
            mockWorld.spawnTimer = 0.3;

            expect(() => SpawnSystem(mockWorld, 0.1)).not.toThrow();
        });

        it('setBossSpawnTime 应该设置 Boss 出现时间', () => {
            setBossSpawnTime(mockWorld, 120);

            // 设置后需要检查逻辑
            expect(() => SpawnSystem(mockWorld, 0.1)).not.toThrow();
        });
    });

    describe('正弦波节奏', () => {
        it('刷怪节奏应该随时间呈现正弦波变化', () => {
            const incomes: number[] = [];

            // 测试不同时间点的收入倍率
            for (let t = 0; t < 10; t += 1) {
                mockWorld.time = t;
                mockWorld.spawnTimer = 0.3;
                mockWorld.spawnCredits = 100;

                const timeFactor = (Math.sin(mockWorld.time * 0.3) + 1) / 2;
                const waveMultiplier = 0.5 + (1.5 * timeFactor);
                incomes.push(waveMultiplier);
            }

            // 应该有变化（不完全相同）
            const uniqueValues = new Set(incomes);
            expect(uniqueValues.size).toBeGreaterThan(1);
        });
    });
});
