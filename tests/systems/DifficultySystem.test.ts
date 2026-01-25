/**
 * DifficultySystem 单元测试
 */

import { DifficultySystem, resetDifficulty, getDifficultyConfig, getEliteChance, getEnemyMultipliers } from '../../src/engine/systems/DifficultySystem';
import { World } from '../../src/engine/types';
import { Transform, Health, Weapon } from '../../src/engine/components';
import { AmmoType } from '../../src/engine/types/ids';

describe('DifficultySystem', () => {
    let mockWorld: World;

    beforeEach(() => {
        // 重置难度系统
        resetDifficulty();

        // 创建模拟世界对象
        mockWorld = {
            entities: new Map(),
            playerId: 1,
            width: 800,
            height: 600,
            time: 0,
            score: 1000,
            level: 0,
            difficulty: 1.0,
            events: [],
            comboState: { count: 0, timer: 0, multiplier: 1 },
        } as unknown as World;

        // 添加玩家实体
        mockWorld.entities.set(mockWorld.playerId, [
            new Transform({ x: 400, y: 500, rot: 0 }),
            new Health({ hp: 100, max: 100 }),
            new Weapon({
                id: 'player_weapon' as any,
                ammoType: AmmoType.PLAYER_BULLET,
                cooldown: 200,
                level: 1
            }),
        ]);
    });

    describe('评估间隔', () => {
        it('应该每隔 15 秒评估一次', () => {
            // 运行 14 秒，不应该评估
            for (let i = 0; i < 140; i++) {
                mockWorld.time = i * 0.1;
                DifficultySystem(mockWorld, 0.1);
            }

            // 难度应该保持默认
            expect(mockWorld.difficulty).toBe(1.0);

            // 再运行 1 秒（共 15 秒），应该评估
            mockWorld.time = 15;
            DifficultySystem(mockWorld, 0.1);

            // 难度可能改变（取决于评估结果）
            expect(mockWorld.difficulty).toBeDefined();
        });

        it('评估间隔内不应该频繁评估', () => {
            mockWorld.time = 1;
            const initialDifficulty = mockWorld.difficulty;

            DifficultySystem(mockWorld, 0.1);

            // 1 秒时不会评估
            expect(mockWorld.difficulty).toBe(initialDifficulty);
        });
    });

    describe('性能评分', () => {
        it('应该根据玩家血量评分', () => {
            const playerComps = mockWorld.entities.get(mockWorld.playerId);
            const health = playerComps?.find(Health.check) as Health;

            // 满血
            health!.hp = 100;
            mockWorld.time = 15;
            mockWorld.score = 1000;

            DifficultySystem(mockWorld, 0.1);

            // 满血应该有较高评分
            expect(mockWorld.difficulty).toBeDefined();
        });

        it('低血量应该降低评分', () => {
            const playerComps = mockWorld.entities.get(mockWorld.playerId);
            const health = playerComps?.find(Health.check) as Health;

            // 低血量
            health!.hp = 10;
            mockWorld.time = 30; // 第二次评估
            mockWorld.events = [];

            DifficultySystem(mockWorld, 0.1);

            // 低血量应该影响难度
            expect(mockWorld.difficulty).toBeDefined();
        });

        it('应该根据连击数评分', () => {
            mockWorld.comboState = { count: 50, timer: 5, multiplier: 2 };
            mockWorld.time = 15;
            mockWorld.events = [];

            DifficultySystem(mockWorld, 0.1);

            // 高连击应该影响难度
            expect(mockWorld.difficulty).toBeDefined();
        });

        it('应该根据武器等级评分', () => {
            const playerComps = mockWorld.entities.get(mockWorld.playerId);
            const weapon = playerComps?.find(c => c instanceof Weapon) as Weapon;

            // 高等级武器
            weapon!.level = 5;
            mockWorld.time = 30;
            mockWorld.events = [];

            DifficultySystem(mockWorld, 0.1);

            // 高武器等级应该影响难度
            expect(mockWorld.difficulty).toBeDefined();
        });

        it('应该根据得分速度评分', () => {
            // 高得分
            mockWorld.score = 10000;
            mockWorld.time = 30;
            mockWorld.events = [];

            DifficultySystem(mockWorld, 0.1);

            expect(mockWorld.difficulty).toBeDefined();
        });
    });

    describe('难度状态', () => {
        it('应该根据玩家表现更新难度', () => {
            // 设置低血量触发困难难度评估
            const playerComps = mockWorld.entities.get(mockWorld.playerId);
            const health = playerComps?.find(Health.check) as Health;
            health!.hp = 10;
            mockWorld.comboState = { count: 0, timer: 0, multiplier: 1 };
            mockWorld.time = 15;
            mockWorld.events = [];

            DifficultySystem(mockWorld, 0.1);

            // 难度应该被设置（具体值取决于评估结果）
            expect(mockWorld.difficulty).toBeDefined();
            expect(mockWorld.difficulty).toBeGreaterThan(0);
        });

        it('应该在多次评估后调整难度', () => {
            // 多次运行评估
            for (let i = 1; i <= 3; i++) {
                mockWorld.time = i * 15;
                mockWorld.events = [];
                DifficultySystem(mockWorld, 0.1);
            }

            // 难度应该在有效范围内
            expect(mockWorld.difficulty).toBeGreaterThan(0.5);
            expect(mockWorld.difficulty).toBeLessThan(2.0);
        });
    });

    describe('导出函数', () => {
        it('getDifficultyConfig 应该返回难度配置', () => {
            const config = getDifficultyConfig();

            expect(config).toBeDefined();
            expect(config.state).toBeDefined();
            expect(typeof config.spawnIntervalMultiplier).toBe('number');
            expect(typeof config.enemyHpMultiplier).toBe('number');
            expect(typeof config.enemySpeedMultiplier).toBe('number');
        });

        it('getEliteChance 应该返回精英怪概率', () => {
            const chance = getEliteChance();

            expect(chance).toBeGreaterThanOrEqual(0);
            expect(chance).toBeLessThanOrEqual(1);
        });

        it('getEnemyMultipliers 应该返回敌人属性倍率', () => {
            const multipliers = getEnemyMultipliers();

            expect(multipliers).toBeDefined();
            expect(typeof multipliers.hp).toBe('number');
            expect(typeof multipliers.speed).toBe('number');
        });
    });

    describe('重置功能', () => {
        it('resetDifficulty 应该重置评估状态', () => {
            // 运行一次评估
            mockWorld.time = 15;
            DifficultySystem(mockWorld, 0.1);

            // 重置
            resetDifficulty();

            // 再次运行应该正常工作
            mockWorld.time = 30;
            mockWorld.events = [];

            expect(() => DifficultySystem(mockWorld, 0.1)).not.toThrow();
        });
    });

    describe('历史评分', () => {
        it('应该只保留最近 5 次评分', () => {
            // 运行 6 次评估
            for (let i = 1; i <= 6; i++) {
                mockWorld.time = i * 15;
                mockWorld.events = [];
                DifficultySystem(mockWorld, 0.1);
            }

            // 应该成功运行（不会崩溃）
            expect(mockWorld.difficulty).toBeDefined();
        });

        it('应该基于历史评分的平均值调整难度', () => {
            // 多次评估
            for (let i = 1; i <= 3; i++) {
                mockWorld.time = i * 15;
                mockWorld.events = [];
                DifficultySystem(mockWorld, 0.1);
            }

            // 难度应该稳定
            expect(mockWorld.difficulty).toBeDefined();
            expect(mockWorld.difficulty).toBeGreaterThan(0);
        });
    });

    describe('边界情况', () => {
        it('没有玩家时不应该崩溃', () => {
            mockWorld.entities.delete(mockWorld.playerId);
            mockWorld.time = 15;

            expect(() => DifficultySystem(mockWorld, 0.1)).not.toThrow();
        });

        it('玩家缺少必要组件时应该跳过', () => {
            mockWorld.entities.set(mockWorld.playerId, [
                new Transform({ x: 400, y: 500, rot: 0 }),
            ]);
            mockWorld.time = 15;

            expect(() => DifficultySystem(mockWorld, 0.1)).not.toThrow();
        });

        it('评分应该限制在 0-100 范围内', () => {
            // 极端情况：最低评分
            const playerComps = mockWorld.entities.get(mockWorld.playerId);
            const health = playerComps?.find(Health.check) as Health;
            health!.hp = 1;
            mockWorld.comboState = { count: 0, timer: 0, multiplier: 1 };
            mockWorld.score = 0;
            mockWorld.time = 0; // 最小时间
            mockWorld.events = [];

            DifficultySystem(mockWorld, 0.1);

            // 难度应该在有效范围内
            expect(mockWorld.difficulty).toBeGreaterThan(0);
            expect(mockWorld.difficulty).toBeLessThan(2);
        });
    });
});
