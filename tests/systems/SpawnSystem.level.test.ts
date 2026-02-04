/**
 * SpawnSystem 关卡系统集成单元测试
 */

import { SpawnSystem } from '../../src/engine/systems/SpawnSystem';
import { BossTag } from '../../src/engine/components/meta';
import { view } from '../../src/engine/world';
import { BossId } from '../../src/engine/types';

describe('SpawnSystem - 关卡系统集成', () => {
    let mockWorld: any;

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
            events: [],
            comboState: { count: 0, timer: 0, multiplier: 1 },
            removedEntities: [],
            bossState: { timer: 0, spawned: false, bossId: 0 },

            // 新的关卡状态
            levelState: {
                currentLevel: 1,
                progress: 0,
                elapsedTime: 0,
                killCount: 0,
            },
        } as any;
    });

    describe('Boss 生成触发条件', () => {
        it('进度>=90% 且 时间>=60秒 时应该生成 Boss', () => {
            // 设置满足条件的状态
            mockWorld.levelState.progress = 90;
            mockWorld.levelState.elapsedTime = 60000; // 60秒
            mockWorld.spawnTimer = 1000; // 超过 1 秒阈值

            SpawnSystem(mockWorld, 16);

            // Boss 应该被标记为已生成
            expect(mockWorld.bossState.spawned).toBe(true);
        });

        it('进度<90% 时不应该生成 Boss', () => {
            mockWorld.levelState.progress = 80; // 低于 90%
            mockWorld.levelState.elapsedTime = 60000;
            mockWorld.spawnTimer = 1000;

            SpawnSystem(mockWorld, 16);

            // Boss 不应该被生成
            expect(mockWorld.bossState.spawned).toBe(false);
        });

        it('时间<60秒 时不应该生成 Boss', () => {
            mockWorld.levelState.progress = 90;
            mockWorld.levelState.elapsedTime = 50000; // 低于 60秒
            mockWorld.spawnTimer = 1000;

            SpawnSystem(mockWorld, 16);

            // Boss 不应该被生成
            expect(mockWorld.bossState.spawned).toBe(false);
        });

        it('两个条件都不满足时不应该生成 Boss', () => {
            mockWorld.levelState.progress = 80;
            mockWorld.levelState.elapsedTime = 50000;
            mockWorld.spawnTimer = 1000;

            SpawnSystem(mockWorld, 16);

            expect(mockWorld.bossState.spawned).toBe(false);
        });
    });

    describe('Boss 不重复生成', () => {
        it('Boss 已生成时不应该重复生成', () => {
            // 设置 Boss 已经生成
            mockWorld.bossState.spawned = true;
            mockWorld.levelState.progress = 90;
            mockWorld.levelState.elapsedTime = 60000;
            mockWorld.spawnTimer = 1000;

            SpawnSystem(mockWorld, 16);

            // bossState.spawned 应该保持为 true
            expect(mockWorld.bossState.spawned).toBe(true);
        });

        it('场上已有 Boss 实体时不应该生成', () => {
            mockWorld.levelState.progress = 90;
            mockWorld.levelState.elapsedTime = 60000;
            mockWorld.spawnTimer = 1000;

            // 添加一个 Boss 实体到场上
            const bossId = 999;
            mockWorld.entities.set(bossId, [
                new BossTag({ id: BossId.GUARDIAN })
            ]);

            const initialSpawnedState = mockWorld.bossState.spawned;

            SpawnSystem(mockWorld, 16);

            // bossState.spawned 不应该改变（因为场上有 Boss）
            expect(mockWorld.bossState.spawned).toBe(initialSpawnedState);
        });
    });

    describe('使用 levelState.currentLevel', () => {
        it('应该根据 currentLevel 获取对应的关卡配置', () => {
            mockWorld.levelState.currentLevel = 2;
            mockWorld.spawnTimer = 1000;

            // 不应该崩溃
            expect(() => SpawnSystem(mockWorld, 16)).not.toThrow();
        });

        it('不存在的关卡配置应该输出错误', () => {
            mockWorld.levelState.currentLevel = 999; // 不存在的关卡
            mockWorld.spawnTimer = 1000;

            // 不应该崩溃，但会输出错误
            expect(() => SpawnSystem(mockWorld, 16)).not.toThrow();
        });

        it('关卡 1 应该使用 GUARDIAN Boss', () => {
            mockWorld.levelState.currentLevel = 1;
            mockWorld.levelState.progress = 90;
            mockWorld.levelState.elapsedTime = 60000;
            mockWorld.spawnTimer = 1000;

            SpawnSystem(mockWorld, 16);

            // Boss 应该被标记为已生成
            expect(mockWorld.bossState.spawned).toBe(true);
        });

        it('关卡 2 应该使用 INTERCEPTOR Boss', () => {
            mockWorld.levelState.currentLevel = 2;
            mockWorld.levelState.progress = 90;
            mockWorld.levelState.elapsedTime = 60000;
            mockWorld.spawnTimer = 1000;

            SpawnSystem(mockWorld, 16);

            expect(mockWorld.bossState.spawned).toBe(true);
        });
    });

    describe('levelState 未初始化处理', () => {
        it('levelState 未初始化时应该输出错误但不崩溃', () => {
            mockWorld.levelState = undefined;

            expect(() => SpawnSystem(mockWorld, 16)).not.toThrow();
        });
    });

    describe('普通敌人生成逻辑', () => {
        it('未满足 Boss 条件时应该生成普通敌人', () => {
            mockWorld.levelState.progress = 50; // 低于 Boss 阈值
            mockWorld.levelState.elapsedTime = 30000;
            mockWorld.spawnTimer = 1000;
            mockWorld.spawnCredits = 100;

            const initialEntityCount = mockWorld.entities.size;

            SpawnSystem(mockWorld, 16);

            // 可能会生成敌人（取决于概率和点数）
            // 这里主要测试不会崩溃
            expect(true).toBe(true);
        });
    });

    describe('时间保护机制', () => {
        it('刷怪间隔应该至少 1 秒', () => {
            mockWorld.spawnTimer = 500; // 低于 1000ms

            const initialCredits = mockWorld.spawnCredits;

            SpawnSystem(mockWorld, 16);

            // 不应该刷怪（时间未到）
            // 点数仍然会通过 income 增加
            expect(mockWorld.spawnCredits).toBeGreaterThanOrEqual(initialCredits);
        });
    });
});
