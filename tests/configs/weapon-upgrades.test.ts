/**
 * 武器升级配置测试
 *
 * 测试目标：
 * - 验证 getWeaponUpgrade 函数正确返回升级配置
 * - 验证各武器升级属性的正确性
 * - 验证缺失配置时的默认值处理
 */

import { describe, it, expect } from '@jest/globals';
import { WeaponId } from '../../src/engine/types';
import { getWeaponUpgrade, WEAPON_UPGRADE_TABLE } from '../../src/engine/configs/weapon-upgrades';

describe('getWeaponUpgrade', () => {
    describe('VULCAN 升级配置', () => {
        it('Lv1 应返回基础配置', () => {
            const config = getWeaponUpgrade(WeaponId.VULCAN, 1);
            expect(config.level).toBe(1);
            expect(config.damageMultiplier).toBe(1.0);
            expect(config.fireRateMultiplier).toBe(1.0);
            expect(config.bulletCount).toBe(1);
            expect(config.spread).toBe(0);
        });

        it('Lv3 应返回中级配置', () => {
            const config = getWeaponUpgrade(WeaponId.VULCAN, 3);
            expect(config.level).toBe(3);
            expect(config.damageMultiplier).toBe(1.2);
            expect(config.fireRateMultiplier).toBe(1.1);
            expect(config.bulletCount).toBe(3);
            expect(config.spread).toBe(6);
        });

        it('Lv6 应返回最高级配置', () => {
            const config = getWeaponUpgrade(WeaponId.VULCAN, 6);
            expect(config.level).toBe(6);
            expect(config.damageMultiplier).toBe(1.5);
            expect(config.fireRateMultiplier).toBe(1.25);
            expect(config.bulletCount).toBe(6);
            expect(config.spread).toBe(15);
        });
    });

    describe('MISSILE 升级配置', () => {
        it('Lv1 应包含索敌属性', () => {
            const config = getWeaponUpgrade(WeaponId.MISSILE, 1);
            expect(config.level).toBe(1);
            expect(config.bulletCount).toBe(1);
            expect(config.homing).toBeDefined();
            expect(config.homing?.searchRange).toBe(600);
            expect(config.homing?.turnSpeed).toBe(0.15);
        });

        it('Lv3 应提升索敌属性', () => {
            const config = getWeaponUpgrade(WeaponId.MISSILE, 3);
            expect(config.bulletCount).toBe(3);
            expect(config.homing?.searchRange).toBe(700);
            expect(config.homing?.turnSpeed).toBe(0.20);
        });
    });

    describe('TESLA 升级配置', () => {
        it('Lv1 应包含连锁属性', () => {
            const config = getWeaponUpgrade(WeaponId.TESLA, 1);
            expect(config.level).toBe(1);
            expect(config.chain).toBeDefined();
            expect(config.chain?.count).toBe(2);
            expect(config.chain?.range).toBe(500);
        });

        it('Lv6 应返回最高连锁配置', () => {
            const config = getWeaponUpgrade(WeaponId.TESLA, 6);
            expect(config.chain?.count).toBe(5);
            expect(config.chain?.range).toBe(1700);
        });
    });

    describe('LASER 升级配置', () => {
        it('Lv1 应包含激光属性', () => {
            const config = getWeaponUpgrade(WeaponId.LASER, 1);
            expect(config.level).toBe(1);
            expect(config.laser).toBeDefined();
            expect(config.laser?.beamCount).toBe(1);
            expect(config.laser?.widthMultiplier).toBe(1.0);
        });

        it('Lv3 应包含双光束配置', () => {
            const config = getWeaponUpgrade(WeaponId.LASER, 3);
            expect(config.laser?.beamCount).toBe(2);
            expect(config.laser?.widthMultiplier).toBe(2.0);
        });
    });

    describe('PLASMA 升级配置', () => {
        it('Lv1 应返回基础尺寸', () => {
            const config = getWeaponUpgrade(WeaponId.PLASMA, 1);
            expect(config.sizeMultiplier).toBe(1.0);
        });

        it('Lv6 应返回最大尺寸', () => {
            const config = getWeaponUpgrade(WeaponId.PLASMA, 6);
            expect(config.sizeMultiplier).toBe(2.5);
        });
    });

    describe('默认值处理', () => {
        it('无效武器 ID 应返回默认配置', () => {
            // @ts-expect-error - 测试无效输入
            const config = getWeaponUpgrade('INVALID_WEAPON', 1);
            expect(config.level).toBe(1);
            expect(config.damageMultiplier).toBe(1.0);
            expect(config.fireRateMultiplier).toBe(1.0);
        });

        it('无效等级应返回默认配置', () => {
            const config = getWeaponUpgrade(WeaponId.VULCAN, 999);
            expect(config.level).toBe(1);
            expect(config.damageMultiplier).toBe(1.0);
        });

        it('可选属性应为 undefined', () => {
            const config = getWeaponUpgrade(WeaponId.VULCAN, 1);
            expect(config.sizeMultiplier).toBeUndefined();
            expect(config.homing).toBeUndefined();
            expect(config.chain).toBeUndefined();
        });
    });
});

describe('WEAPON_UPGRADE_TABLE 完整性', () => {
    it('应包含所有武器类型', () => {
        const weapons = [
            WeaponId.VULCAN,
            WeaponId.LASER,
            WeaponId.MISSILE,
            WeaponId.WAVE,
            WeaponId.PLASMA,
            WeaponId.TESLA,
            WeaponId.MAGMA,
            WeaponId.SHURIKEN,
        ];

        for (const weapon of weapons) {
            expect(WEAPON_UPGRADE_TABLE[weapon]).toBeDefined();
        }
    });

    it('每个武器应有至少 3 个等级', () => {
        for (const weapon in WEAPON_UPGRADE_TABLE) {
            const spec = WEAPON_UPGRADE_TABLE[weapon as WeaponId];
            expect(spec.levels.length).toBeGreaterThanOrEqual(3);
        }
    });

    it('每个等级应有正确的序号', () => {
        for (const weapon in WEAPON_UPGRADE_TABLE) {
            const spec = WEAPON_UPGRADE_TABLE[weapon as WeaponId];
            spec.levels.forEach((level, index) => {
                expect(level.level).toBe(index + 1);
            });
        }
    });
});

describe('升级配置与老版本映射', () => {
    describe('VULCAN 子弹数量映射', () => {
        it('应与老版本 bulletCount 一致', () => {
            const expectedCounts = [1, 2, 3, 4, 5, 6];
            for (let level = 1; level <= 6; level++) {
                const config = getWeaponUpgrade(WeaponId.VULCAN, level);
                expect(config.bulletCount).toBe(expectedCounts[level - 1]);
            }
        });
    });

    describe('MISSILE 索敌属性映射', () => {
        it('Lv1 应与老版本一致', () => {
            const config = getWeaponUpgrade(WeaponId.MISSILE, 1);
            expect(config.bulletCount).toBe(1);
            expect(config.homing?.searchRange).toBe(600);
            expect(config.homing?.turnSpeed).toBe(0.15);
        });

        it('Lv3 应与老版本一致', () => {
            const config = getWeaponUpgrade(WeaponId.MISSILE, 3);
            expect(config.bulletCount).toBe(3);
            expect(config.homing?.searchRange).toBe(700);
            expect(config.homing?.turnSpeed).toBe(0.20);
        });
    });

    describe('TESLA 连锁属性映射', () => {
        const expectedChains: [number, number][] = [
            [1, 2], [2, 3], [3, 3], [4, 4], [5, 4], [6, 5]
        ];

        expectedChains.forEach(([level, expectedCount]) => {
            it(`Lv${level} 应有 ${expectedCount} 次连锁`, () => {
                const config = getWeaponUpgrade(WeaponId.TESLA, level);
                expect(config.chain?.count).toBe(expectedCount);
            });
        });
    });
});
