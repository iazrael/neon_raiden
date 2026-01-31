/**
 * Boss配置验证测试
 *
 * 测试Boss配置数据的完整性和正确性
 */

import { ENEMY_WEAPON_TABLE } from '../../src/engine/blueprints';
import { BOSS_DATA, BossMovementPattern, validateBossConfigs } from '../../src/engine/configs/bossData';
import { BossId } from '../../src/engine/types/ids';

describe('Boss配置验证', () => {
    describe('配置完整性', () => {
        it('所有Boss都应该有配置', () => {
            const definedBossIds = Object.keys(BOSS_DATA);
            const allBossIds = Object.values(BossId);

            // 所有Boss ID都应该有配置
            allBossIds.forEach(bossId => {
                expect(definedBossIds).toContain(bossId);
            });
        });

        it('每个Boss至少应该有一个阶段', () => {
            Object.values(BOSS_DATA).forEach(bossSpec => {
                expect(bossSpec.phases.length).toBeGreaterThan(0);
            });
        });

        it('阶段阈值应该按降序排列', () => {
            Object.values(BOSS_DATA).forEach(bossSpec => {
                const thresholds = bossSpec.phases.map(p => p.threshold);
                for (let i = 0; i < thresholds.length - 1; i++) {
                    expect(thresholds[i]).toBeGreaterThan(thresholds[i + 1]);
                }
            });
        });
    });

    describe('武器配置', () => {
        it('所有weaponId应该在ENEMY_WEAPON_TABLE中存在', () => {

            Object.values(BOSS_DATA).forEach(bossSpec => {
                bossSpec.phases.forEach(phase => {
                    expect(ENEMY_WEAPON_TABLE[phase.weaponId]).toBeDefined();
                });
            });
        });

        it('Guardian P1应该使用GUARDIAN_RADIAL', () => {
            const guardian = BOSS_DATA[BossId.GUARDIAN];
            expect(guardian.phases[0].weaponId).toBe('boss_guardian_radial');
        });

        it('Guardian P2应该使用GUARDIAN_RADIAL_ENRAGED', () => {
            const guardian = BOSS_DATA[BossId.GUARDIAN];
            expect(guardian.phases[1].weaponId).toBe('boss_guardian_radial_enraged');
        });
    });

    describe('移动模式配置', () => {
        it('所有movePattern应该是有效的', () => {
            const validPatterns = Object.values(BossMovementPattern);

            Object.values(BOSS_DATA).forEach(bossSpec => {
                bossSpec.phases.forEach(phase => {
                    expect(validPatterns).toContain(phase.movePattern);
                });
            });
        });

        it('Annihilator应该使用RANDOM_TELEPORT', () => {
            const annihilator = BOSS_DATA[BossId.ANNIHILATOR];
            expect(annihilator.phases[0].movePattern).toBe('random_teleport');
        });

        it('Apocalypse P1应该使用ADAPTIVE', () => {
            const apocalypse = BOSS_DATA[BossId.APOCALYPSE];
            expect(apocalypse.phases[0].movePattern).toBe('adaptive');
        });
    });

    describe('修正器配置', () => {
        it('modifiers字段应该包含有效的键', () => {
            const validKeys = ['moveSpeed', 'fireRate', 'damage'];

            Object.values(BOSS_DATA).forEach(bossSpec => {
                bossSpec.phases.forEach(phase => {
                    if (phase.modifiers) {
                        Object.keys(phase.modifiers).forEach(key => {
                            expect(validKeys).toContain(key);
                        });
                    }
                });
            });
        });

        it('修正器值应该是正数', () => {
            Object.values(BOSS_DATA).forEach(bossSpec => {
                bossSpec.phases.forEach(phase => {
                    if (phase.modifiers) {
                        Object.values(phase.modifiers).forEach(value => {
                            if (typeof value === 'number') {
                                expect(value).toBeGreaterThan(0);
                            }
                        });
                    }
                });
            });
        });
    });

    describe('特殊配置', () => {
        it('phaseColor应该是有效的HEX颜色', () => {
            const hexColorRegex = /^#[0-9A-F]{6}$/i;

            Object.values(BOSS_DATA).forEach(bossSpec => {
                bossSpec.phases.forEach(phase => {
                    if (phase.phaseColor) {
                        expect(phase.phaseColor).toMatch(hexColorRegex);
                    }
                });
            });
        });

        it('specialEvents应该是字符串数组', () => {
            Object.values(BOSS_DATA).forEach(bossSpec => {
                bossSpec.phases.forEach(phase => {
                    if (phase.specialEvents) {
                        expect(Array.isArray(phase.specialEvents)).toBe(true);
                        phase.specialEvents.forEach(event => {
                            expect(typeof event).toBe('string');
                        });
                    }
                });
            });
        });
    });

    describe('movementConfig配置', () => {
        it('movementConfig应该是可选的', () => {
            Object.values(BOSS_DATA).forEach(bossSpec => {
                bossSpec.phases.forEach(phase => {
                    // movementConfig是可选的，应该是undefined或对象
                    expect([undefined, expect.any(Object)]).toContainEqual(phase.movementConfig);
                });
            });
        });

        it('如果存在movementConfig，应该包含有效的键', () => {
            const validKeys = [
                'speedMultiplier',
                'radius',
                'frequency',
                'amplitude',
                'verticalSpeed',
                'teleportInterval',
                'dashSpeed',
                'centerY',
                'zigzagInterval',
                'closeRangeThreshold'
            ];

            Object.values(BOSS_DATA).forEach(bossSpec => {
                bossSpec.phases.forEach(phase => {
                    if (phase.movementConfig) {
                        Object.keys(phase.movementConfig).forEach(key => {
                            expect(validKeys).toContain(key);
                        });
                    }
                });
            });
        });
    });

    describe('validateBossConfigs函数', () => {
        it('应该通过验证（当前配置是正确的）', () => {
            const result = validateBossConfigs();
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('应该返回ValidationResult对象', () => {
            const result = validateBossConfigs();
            expect(result).toHaveProperty('valid');
            expect(result).toHaveProperty('errors');
            expect(result).toHaveProperty('warnings');
            expect(Array.isArray(result.errors)).toBe(true);
            expect(Array.isArray(result.warnings)).toBe(true);
        });
    });

    describe('特定Boss配置', () => {
        describe('Guardian', () => {
            it('应该有2个阶段', () => {
                const guardian = BOSS_DATA[BossId.GUARDIAN];
                expect(guardian.phases.length).toBe(2);
            });

            it('P1阈值应该是1.0', () => {
                const guardian = BOSS_DATA[BossId.GUARDIAN];
                expect(guardian.phases[0].threshold).toBe(1.0);
            });

            it('P2阈值应该是0.5', () => {
                const guardian = BOSS_DATA[BossId.GUARDIAN];
                expect(guardian.phases[1].threshold).toBe(0.5);
            });

            it('P2应该有phaseColor', () => {
                const guardian = BOSS_DATA[BossId.GUARDIAN];
                expect(guardian.phases[1].phaseColor).toBe('#ffaa00');
            });
        });

        describe('Destroyer', () => {
            it('应该有3个阶段', () => {
                const destroyer = BOSS_DATA[BossId.DESTROYER];
                expect(destroyer.phases.length).toBe(3);
            });

            it('应该有wingman_support特殊事件', () => {
                const destroyer = BOSS_DATA[BossId.DESTROYER];
                expect(destroyer.phases[0].specialEvents).toContain('wingman_support');
            });
        });

        describe('Apocalypse', () => {
            it('应该有4个阶段', () => {
                const apocalypse = BOSS_DATA[BossId.APOCALYPSE];
                expect(apocalypse.phases.length).toBe(4);
            });

            it('P3应该使用RANDOM_TELEPORT', () => {
                const apocalypse = BOSS_DATA[BossId.APOCALYPSE];
                expect(apocalypse.phases[2].movePattern).toBe('random_teleport');
            });

            it('P4应该有specialEvents', () => {
                const apocalypse = BOSS_DATA[BossId.APOCALYPSE];
                expect(apocalypse.phases[3].specialEvents).toBeDefined();
                expect(apocalypse.phases[3].specialEvents!.length).toBeGreaterThan(0);
            });
        });
    });
});
