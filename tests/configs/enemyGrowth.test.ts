/**
 * enemyGrowth 单元测试
 */

import { getEnemyStats, getEnemyBehavior, ENEMY_CONFIGS, EnemyBehavior } from '../../src/engine/configs/enemyGrowth';
import { EnemyId } from '../../src/engine/types';

describe('enemyGrowth 配置', () => {
    describe('ENEMY_CONFIGS 配置完整性', () => {
        it('所有敌人类型都应该有配置', () => {
            const enemyTypes: EnemyId[] = [
                EnemyId.NORMAL,
                EnemyId.FAST,
                EnemyId.TANK,
                EnemyId.KAMIKAZE,
                EnemyId.ELITE_GUNBOAT,
                EnemyId.LASER_INTERCEPTOR,
                EnemyId.MINE_LAYER,
                EnemyId.PULSAR,
                EnemyId.FORTRESS,
                EnemyId.STALKER,
                EnemyId.BARRAGE,
            ];

            enemyTypes.forEach(type => {
                expect(ENEMY_CONFIGS[type]).toBeDefined();
                const config = ENEMY_CONFIGS[type];

                // 检查必要字段存在
                expect(config).toHaveProperty('moveSpeed');
                expect(config).toHaveProperty('fireInterval');
                expect(config).toHaveProperty('behavior');
                expect(config).toHaveProperty('baseHp');
                expect(config).toHaveProperty('hpPerLevel');
                expect(config).toHaveProperty('baseDamage');
                expect(config).toHaveProperty('damagePerLevel');
                expect(config).toHaveProperty('baseFireRate');
                expect(config).toHaveProperty('fireRatePerLevel');
                expect(config).toHaveProperty('score');

                // 检查数值合理性
                expect(config.moveSpeed).toBeGreaterThan(0);
                expect(config.baseHp).toBeGreaterThan(0);
                expect(config.hpPerLevel).toBeGreaterThanOrEqual(0);
                expect(config.baseDamage).toBeGreaterThan(0);
                expect(config.baseFireRate).toBeGreaterThan(0);
                expect(config.score).toBeGreaterThan(0);
            });
        });

        it('KAMIKAZE 敌人的 fireInterval 应该是 Infinity', () => {
            const kamikaze = ENEMY_CONFIGS[EnemyId.KAMIKAZE];
            expect(kamikaze.fireInterval).toBe(Infinity);
        });
    });

    describe('getEnemyStats', () => {
        it('第1关应该无加成（levelBonus = 0）', () => {
            const stats = getEnemyStats(EnemyId.NORMAL, 1);

            // 第1关应该是基础值
            expect(stats.hp).toBe(30);
            expect(stats.damageMultiplier).toBe(1.0);
            expect(stats.fireRateMultiplier).toBe(1.0);
        });

        it('第2关应该有 1 级加成', () => {
            const stats = getEnemyStats(EnemyId.NORMAL, 2);

            // baseHp: 30, hpPerLevel: 10
            expect(stats.hp).toBe(30 + 10);
            // baseDamage: 1.0, damagePerLevel: 0.1
            expect(stats.damageMultiplier).toBe(1.0 + 0.1);
            // baseFireRate: 1.0, fireRatePerLevel: 0.05
            expect(stats.fireRateMultiplier).toBe(1.0 + 0.05);
        });

        it('第5关应该有 4 级加成', () => {
            const stats = getEnemyStats(EnemyId.NORMAL, 5);

            // level = 5, levelBonus = 4
            expect(stats.hp).toBe(30 + 10 * 4);
            expect(stats.damageMultiplier).toBe(1.0 + 0.1 * 4);
            expect(stats.fireRateMultiplier).toBe(1.0 + 0.05 * 4);
        });

        it('不同敌人类型应该有不同的成长率', () => {
            const tankStats = getEnemyStats(EnemyId.TANK, 2);
            const fastStats = getEnemyStats(EnemyId.FAST, 2);

            // TANK 血量成长高（20），FAST 血量成长低（2）
            expect(tankStats.hp).toBe(60 + 20);
            expect(fastStats.hp).toBe(10 + 2);
        });

        it('未配置的敌人类型应该返回默认值', () => {
            const stats = getEnemyStats('UNKNOWN' as EnemyId, 5);

            expect(stats.hp).toBe(30);
            expect(stats.damageMultiplier).toBe(1.0);
            expect(stats.fireRateMultiplier).toBe(1.0);
            expect(stats.score).toBe(100);
        });

        it('击杀得分应该不随关卡变化', () => {
            const stats1 = getEnemyStats(EnemyId.NORMAL, 1);
            const stats2 = getEnemyStats(EnemyId.NORMAL, 5);
            const stats3 = getEnemyStats(EnemyId.NORMAL, 10);

            expect(stats1.score).toBe(stats2.score);
            expect(stats2.score).toBe(stats3.score);
        });
    });

    describe('getEnemyBehavior', () => {
        it('应该返回正确的行为配置', () => {
            const behavior = getEnemyBehavior(EnemyId.NORMAL);

            expect(behavior).toHaveProperty('moveSpeed');
            expect(behavior).toHaveProperty('fireInterval');
            expect(behavior).toHaveProperty('behavior');

            expect(behavior.moveSpeed).toBe(100);
            expect(behavior.fireInterval).toBe(2000);
            expect(behavior.behavior).toBe(EnemyBehavior.SINE_WAVE);
        });

        it('不同敌人应该有不同的行为模式', () => {
            const normalBehavior = getEnemyBehavior(EnemyId.NORMAL);
            const fastBehavior = getEnemyBehavior(EnemyId.FAST);
            const kamikazeBehavior = getEnemyBehavior(EnemyId.KAMIKAZE);

            expect(normalBehavior.behavior).toBe(EnemyBehavior.SINE_WAVE);
            expect(fastBehavior.behavior).toBe(EnemyBehavior.MOVE_DOWN);
            expect(kamikazeBehavior.behavior).toBe(EnemyBehavior.CHASE);
        });

        it('移动速度应该符合配置', () => {
            const fast = getEnemyBehavior(EnemyId.FAST);
            const tank = getEnemyBehavior(EnemyId.TANK);

            expect(fast.moveSpeed).toBe(250);
            expect(tank.moveSpeed).toBe(50);
        });

        it('未配置的敌人类型应该返回默认行为', () => {
            const behavior = getEnemyBehavior('UNKNOWN' as EnemyId);

            expect(behavior.moveSpeed).toBe(100);
            expect(behavior.fireInterval).toBe(2000);
            expect(behavior.behavior).toBe(EnemyBehavior.MOVE_DOWN);
        });

        it('返回值类型应该是 EnemyBehaviorConfig', () => {
            const behavior = getEnemyBehavior(EnemyId.NORMAL);

            // TypeScript 类型检查
            expect(typeof behavior.moveSpeed).toBe('number');
            expect(typeof behavior.fireInterval).toBe('number');
            expect(typeof behavior.behavior).toBe('string');
        });
    });

    describe('行为模式枚举', () => {
        it('应该包含所有预定义的行为模式', () => {
            expect(EnemyBehavior.IDLE).toBe('idle');
            expect(EnemyBehavior.MOVE_DOWN).toBe('move_down');
            expect(EnemyBehavior.SINE_WAVE).toBe('sine_wave');
            expect(EnemyBehavior.CHASE).toBe('chase');
            expect(EnemyBehavior.RAM).toBe('ram');
            expect(EnemyBehavior.STRAFE).toBe('strafe');
            expect(EnemyBehavior.CIRCLE).toBe('circle');
        });
    });

    describe('数值平衡性检查', () => {
        it('所有敌人的成长率应该合理（不过分强或弱）', () => {
            Object.values(ENEMY_CONFIGS).forEach(config => {
                // 血量成长不应超过基础值太多（不超过 50%）
                const hpGrowthRatio = config.hpPerLevel / config.baseHp;
                expect(hpGrowthRatio).toBeLessThanOrEqual(0.5);

                // 伤害成长不应超过 0.2 每级
                expect(config.damagePerLevel).toBeLessThanOrEqual(0.2);

                // 射速成长不应超过 0.15 每级
                expect(config.fireRatePerLevel).toBeLessThanOrEqual(0.15);
            });
        });

        it('高血量敌人应该有低移动速度', () => {
            const tank = ENEMY_CONFIGS[EnemyId.TANK];
            const fortress = ENEMY_CONFIGS[EnemyId.FORTRESS];

            // TANK: 60 HP, 50 speed
            expect(tank.baseHp).toBeGreaterThan(50);
            expect(tank.moveSpeed).toBeLessThan(100);

            // FORTRESS: 200 HP, 50 speed
            expect(fortress.baseHp).toBeGreaterThan(150);
            expect(fortress.moveSpeed).toBeLessThan(100);
        });

        it('高攻击频率敌人应该有低伤害', () => {
            const gunboat = ENEMY_CONFIGS[EnemyId.ELITE_GUNBOAT];

            // 快速连射（500ms），伤害应该适中
            expect(gunboat.fireInterval).toBeLessThan(1000);
            expect(gunboat.baseDamage).toBeLessThanOrEqual(2.0);
        });
    });
});
