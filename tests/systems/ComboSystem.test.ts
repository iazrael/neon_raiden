/**
 * ComboSystem 单元测试
 */

import { createWorld, generateId, addComponent } from '../../src/engine/world';
import { ComboSystem, resetWorldCombo, getComboScoreMultiplier, getComboDamageMultiplier } from '../../src/engine/systems/ComboSystem';
import { Transform, PlayerTag } from '../../src/engine/components';
import { KillEvent } from '../../src/engine/events';
import { pushEvent } from '../../src/engine/world';

describe('ComboSystem', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
        world.playerId = 1;
        resetWorldCombo(world);
    });

    describe('连击计数', () => {
        it('击杀应该增加连击数', () => {
            pushEvent(world, {
                type: 'Kill',
                pos: { x: 400, y: 300 },
                victim: generateId(),
                killer: 1,
                score: 100
            } as KillEvent);

            ComboSystem(world, 0.016);

            expect(world.comboState?.count).toBe(1);
        });

        it('多次击杀应该累加连击数', () => {
            for (let i = 0; i < 5; i++) {
                pushEvent(world, {
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: 1,
                    score: 100
                } as KillEvent);
            }

            ComboSystem(world, 0.016);

            expect(world.comboState?.count).toBe(5);
        });
    });

    describe('连击计时器', () => {
        it('击杀应该重置计时器', () => {
            pushEvent(world, {
                type: 'Kill',
                pos: { x: 400, y: 300 },
                victim: generateId(),
                killer: 1,
                score: 100
            } as KillEvent);

            ComboSystem(world, 0.016);

            expect(world.comboState?.timer).toBe(5000); // 应该重置为5000毫秒（5秒）
        });

        it('没有击杀时计时器应该递减', () => {
            pushEvent(world, {
                type: 'Kill',
                pos: { x: 400, y: 300 },
                victim: generateId(),
                killer: 1,
                score: 100
            } as KillEvent);

            ComboSystem(world, 0.016);
            const initialTimer = world.comboState?.timer ?? 0;

            // 清空 events，模拟没有新击杀
            world.events = [];

            // 下一次调用没有新的 KillEvent，计时器应该减少
            ComboSystem(world, 1); // 1秒后

            expect(world.comboState?.timer).toBeLessThan(initialTimer);
        });

        it('计时器超时应该重置连击', () => {
            pushEvent(world, {
                type: 'Kill',
                pos: { x: 400, y: 300 },
                victim: generateId(),
                killer: 1,
                score: 100
            } as KillEvent);

            ComboSystem(world, 0.016);
            expect(world.comboState?.count).toBeGreaterThan(0);

            // 清空 events，模拟没有新击杀
            world.events = [];

            // 模拟超时（5000 + 1000 毫秒，确保超时）
            ComboSystem(world, 6000);

            expect(world.comboState?.count).toBe(0);
            expect(world.comboState?.timer).toBe(0);
        });

        it('超时应该生成 ComboBreak 事件', () => {
            pushEvent(world, {
                type: 'Kill',
                pos: { x: 400, y: 300 },
                victim: generateId(),
                killer: 1,
                score: 100
            } as KillEvent);

            ComboSystem(world, 0.016);
            const initialCombo = world.comboState?.count ?? 0;

            // 清空 events，模拟没有新击杀
            world.events = [];

            // 模拟超时（5000 + 1000 毫秒，确保超时）
            ComboSystem(world, 6000);

            const breakEvents = world.events.filter(e => e.type === 'ComboBreak');
            expect(breakEvents.length).toBeGreaterThan(0);
            expect(breakEvents[0]).toMatchObject({
                type: 'ComboBreak',
                combo: initialCombo,
                reason: 'timeout'
            });
        });
    });

    describe('连击等级', () => {
        it('10连击应该达到1级', () => {
            for (let i = 0; i < 10; i++) {
                pushEvent(world, {
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: 1,
                    score: 100
                } as KillEvent);
            }

            ComboSystem(world, 0.016);

            expect(world.comboState?.level).toBe(1);
        });

        it('25连击应该达到2级', () => {
            for (let i = 0; i < 25; i++) {
                pushEvent(world, {
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: 1,
                    score: 100
                } as KillEvent);
            }

            ComboSystem(world, 0.016);

            expect(world.comboState?.level).toBe(2);
        });

        it('50连击应该达到3级', () => {
            for (let i = 0; i < 50; i++) {
                pushEvent(world, {
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: 1,
                    score: 100
                } as KillEvent);
            }

            ComboSystem(world, 0.016);

            expect(world.comboState?.level).toBe(3);
        });

        it('100连击应该达到狂暴(4级)', () => {
            for (let i = 0; i < 100; i++) {
                pushEvent(world, {
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: 1,
                    score: 100
                } as KillEvent);
            }

            ComboSystem(world, 0.016);

            expect(world.comboState?.level).toBe(4);
            expect(world.comboState?.hasBerserk).toBe(true);
        });
    });

    describe('得分计算', () => {
        it('应该根据连击倍率计算得分', () => {
            const baseScore = 100;

            pushEvent(world, {
                type: 'Kill',
                pos: { x: 400, y: 300 },
                victim: generateId(),
                killer: 1,
                score: baseScore
            } as KillEvent);

            ComboSystem(world, 0.016);

            // 1连击 = 1倍率
            expect(world.score).toBe(baseScore);
        });

        it('高连击应该获得更高得分', () => {
            const baseScore = 100;
            const initialScore = world.score;

            // 25连击 = 2倍率
            for (let i = 0; i < 25; i++) {
                pushEvent(world, {
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: 1,
                    score: baseScore
                } as KillEvent);
            }

            ComboSystem(world, 0.016);

            const scoreGain = world.score - initialScore;
            expect(scoreGain).toBeGreaterThan(baseScore * 25); // 应该有倍率加成
        });
    });

    describe('连击升级事件', () => {
        it('10连击应该生成 ComboUpgrade 事件', () => {
            for (let i = 0; i < 10; i++) {
                pushEvent(world, {
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: 1,
                    score: 100
                } as KillEvent);
            }

            ComboSystem(world, 0.016);

            const upgradeEvents = world.events.filter(e => e.type === 'ComboUpgrade');
            expect(upgradeEvents.length).toBeGreaterThan(0);
        });

        it('100连击应该生成 BerserkMode 事件', () => {
            for (let i = 0; i < 100; i++) {
                pushEvent(world, {
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: 1,
                    score: 100
                } as KillEvent);
            }

            ComboSystem(world, 0.016);

            const berserkEvents = world.events.filter(e => e.type === 'BerserkMode');
            expect(berserkEvents.length).toBeGreaterThan(0);
        });
    });

    describe('辅助函数', () => {
        it('getComboScoreMultiplier 应该返回得分倍率', () => {
            for (let i = 0; i < 25; i++) {
                pushEvent(world, {
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: 1,
                    score: 100
                } as KillEvent);
            }

            ComboSystem(world, 0.016);

            // 25连击 = 2级，得分倍率是2.0
            expect(getComboScoreMultiplier(world)).toBe(2.0);
        });

        it('getComboDamageMultiplier 应该返回伤害倍率', () => {
            for (let i = 0; i < 25; i++) {
                pushEvent(world, {
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: 1,
                    score: 100
                } as KillEvent);
            }

            ComboSystem(world, 0.016);

            expect(getComboDamageMultiplier(world)).toBeGreaterThan(1);
        });

        it('resetWorldCombo 应该重置连击状态', () => {
            for (let i = 0; i < 10; i++) {
                pushEvent(world, {
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: 1,
                    score: 100
                } as KillEvent);
            }

            ComboSystem(world, 0.016);
            expect(world.comboState?.count).toBeGreaterThan(0);

            resetWorldCombo(world);

            expect(world.comboState?.count).toBe(0);
            expect(world.comboState?.level).toBe(0);
        });
    });

    describe('初始化', () => {
        it('首次运行应该初始化 comboState', () => {
            expect(world.comboState).toBeDefined();

            ComboSystem(world, 0.016);
            
            expect(world.comboState?.count).toBe(0);
            expect(world.comboState?.timer).toBe(0);
            expect(world.comboState?.level).toBe(0);
            expect(world.comboState?.maxCombo).toBe(0);
            expect(world.comboState?.hasBerserk).toBe(false);
        });
    });
});
