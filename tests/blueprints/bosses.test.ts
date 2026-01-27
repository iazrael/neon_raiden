/**
 * Boss蓝图测试
 *
 * 测试Boss蓝图的正确性
 */

import {
    BLUEPRINT_BOSS_GUARDIAN,
    BLUEPRINT_BOSS_DESTROYER,
    BLUEPRINT_BOSS_APOCALYPSE,
    BOSSES_TABLE
} from '../../src/engine/blueprints/bosses';
import { BossId } from '../../src/engine/types/ids';
import { BossTag, BossAI, Weapon } from '../../src/engine/components';

describe('Boss蓝图测试', () => {
    describe('蓝图存在性', () => {
        it('所有Boss都应该有对应的蓝图', () => {
            const allBossIds = Object.values(BossId);
            const definedBosses = Object.keys(BOSSES_TABLE);

            allBossIds.forEach(bossId => {
                expect(definedBosses).toContain(bossId);
            });
        });
    });

    describe('组件完整性', () => {
        it('Guardian蓝图应该包含所有必需组件', () => {
            const blueprint = BLUEPRINT_BOSS_GUARDIAN;

            expect(blueprint.Transform).toBeDefined();
            expect(blueprint.Health).toBeDefined();
            expect(blueprint.Sprite).toBeDefined();
            expect(blueprint.BossTag).toBeDefined();
            expect(blueprint.BossAI).toBeDefined();
            expect(blueprint.HitBox).toBeDefined();
            expect(blueprint.SpeedStat).toBeDefined();
            expect(blueprint.ScoreValue).toBeDefined();
            expect(blueprint.DropTable).toBeDefined();
        });

        it('所有Boss蓝图都应该有Weapon组件', () => {
            Object.values(BOSSES_TABLE).forEach(blueprint => {
                expect(blueprint.Weapon).toBeDefined();
            });
        });
    });

    describe('Weapon组件', () => {
        it('Guardian P1武器应该是GUARDIAN_RADIAL', () => {
            const blueprint = BLUEPRINT_BOSS_GUARDIAN;
            expect(blueprint.Weapon!.id).toBe('boss_guardian_radial');
        });

        it('Destroyer P1武器应该是DESTROYER_MAIN', () => {
            const blueprint = BLUEPRINT_BOSS_DESTROYER;
            expect(blueprint.Weapon!.id).toBe('boss_destroyer_main');
        });

        it('Apocalypse P1武器应该是APOCALYPSE_MIXED', () => {
            const blueprint = BLUEPRINT_BOSS_APOCALYPSE;
            expect(blueprint.Weapon!.id).toBe('boss_apocalypse_mixed');
        });

        it('Weapon组件应该包含所有必需字段', () => {
            const blueprint = BLUEPRINT_BOSS_GUARDIAN;
            const weapon = blueprint.Weapon!;

            expect(weapon.id).toBeDefined();
            expect(weapon.ammoType).toBeDefined();
            expect(weapon.cooldown).toBeDefined();
            expect(weapon.bulletCount).toBeDefined();
            expect(weapon.pattern).toBeDefined();
        });
    });

    describe('BossAI组件', () => {
        it('BossAI.phase应该初始化为0', () => {
            const blueprint = BLUEPRINT_BOSS_GUARDIAN;
            expect(blueprint.BossAI!.phase).toBe(0);
        });

        it('所有Boss的BossAI.phase都应该是0', () => {
            Object.values(BOSSES_TABLE).forEach(blueprint => {
                expect(blueprint.BossAI!.phase).toBe(0);
            });
        });

        it('BossAI.nextPatternTime应该初始化为0', () => {
            const blueprint = BLUEPRINT_BOSS_GUARDIAN;
            expect(blueprint.BossAI!.nextPatternTime).toBe(0);
        });
    });

    describe('BossTag组件', () => {
        it('Guardian的BossTag.id应该是GUARDIAN', () => {
            const blueprint = BLUEPRINT_BOSS_GUARDIAN;
            expect(blueprint.BossTag!.id).toBe(BossId.GUARDIAN);
        });

        it('所有Boss的BossTag应该匹配对应的BossId', () => {
            Object.entries(BOSSES_TABLE).forEach(([bossId, blueprint]) => {
                expect(blueprint.BossTag!.id).toBe(bossId);
            });
        });
    });

    describe('Health组件', () => {
        it('Guardian HP应该是2000', () => {
            const blueprint = BLUEPRINT_BOSS_GUARDIAN;
            expect(blueprint.Health!.hp).toBe(2000);
            expect(blueprint.Health!.max).toBe(2000);
        });

        it('Destroyer HP应该是5800', () => {
            const blueprint = BLUEPRINT_BOSS_DESTROYER;
            expect(blueprint.Health!.hp).toBe(5800);
            expect(blueprint.Health!.max).toBe(5800);
        });

        it('Apocalypse HP应该是20000', () => {
            const blueprint = BLUEPRINT_BOSS_APOCALYPSE;
            expect(blueprint.Health!.hp).toBe(20000);
            expect(blueprint.Health!.max).toBe(20000);
        });

        it('HP和max应该相等', () => {
            Object.values(BOSSES_TABLE).forEach(blueprint => {
                expect(blueprint.Health!.hp).toBe(blueprint.Health!.max);
            });
        });
    });

    describe('SpeedStat组件', () => {
        it('所有Boss的maxLinear应该是120', () => {
            Object.values(BOSSES_TABLE).forEach(blueprint => {
                expect(blueprint.SpeedStat!.maxLinear).toBe(120);
            });
        });

        it('所有Boss的maxAngular应该是2', () => {
            Object.values(BOSSES_TABLE).forEach(blueprint => {
                expect(blueprint.SpeedStat!.maxAngular).toBe(2);
            });
        });
    });

    describe('Transform组件', () => {
        it('所有Boss应该生成在相同位置', () => {
            const blueprint1 = BLUEPRINT_BOSS_GUARDIAN;
            const blueprint2 = BLUEPRINT_BOSS_DESTROYER;

            expect(blueprint1.Transform!.x).toBe(blueprint2.Transform!.x);
            expect(blueprint1.Transform!.y).toBe(blueprint2.Transform!.y);
        });

        it('Boss应该生成在屏幕中央上方', () => {
            const blueprint = BLUEPRINT_BOSS_GUARDIAN;
            expect(blueprint.Transform!.x).toBe(400);
            expect(blueprint.Transform!.y).toBe(-200);
        });

        it('Boss应该朝向下方', () => {
            const blueprint = BLUEPRINT_BOSS_GUARDIAN;
            expect(blueprint.Transform!.rot).toBe(180);
        });
    });

    describe('ScoreValue组件', () => {
        it('分数应该随Boss等级递增', () => {
            const guardian = BLUEPRINT_BOSS_GUARDIAN;
            const destroyer = BLUEPRINT_BOSS_DESTROYER;
            const apocalypse = BLUEPRINT_BOSS_APOCALYPSE;

            expect(guardian.ScoreValue!.value).toBeLessThan(destroyer.ScoreValue!.value);
            expect(destroyer.ScoreValue!.value).toBeLessThan(apocalypse.ScoreValue!.value);
        });
    });

    describe('蓝图一致性', () => {
        it('相同BossId的蓝图应该在BOSSES_TABLE中', () => {
            const blueprint = BLUEPRINT_BOSS_GUARDIAN;
            const bossId = blueprint.BossTag!.id;

            expect(BOSSES_TABLE[bossId]).toBeDefined();
            expect(BOSSES_TABLE[bossId]).toBe(blueprint);
        });
    });
});
