import {
    WeaponType,
    WeaponUpgradeEnhancements,
} from '@/types';

// ==================== 武器升级配置 ====================
export const WeaponUpgradeConfig: {
    [key in WeaponType]: {
        [level: number]: WeaponUpgradeEnhancements
    }
} = {
    [WeaponType.VULCAN]: {
        1: { bulletCount: 1 },
        2: { bulletCount: 2 },
        3: { bulletCount: 3 },
        4: { bulletCount: 4 },
        5: { bulletCount: 5 },
        6: { bulletCount: 6 },
        7: { bulletCount: 7 },
        8: { bulletCount: 8 },
        9: { bulletCount: 9 }
    },
    [WeaponType.LASER]: {
        1: { bulletWidth: 1, beamCount: 1 },
        2: { bulletWidth: 2, beamCount: 1 },
        3: { bulletWidth: 3, beamCount: 1 },
        4: { bulletWidth: 4, beamCount: 2 },
        5: { bulletWidth: 5, beamCount: 2 },
        6: { bulletWidth: 6, beamCount: 2 },
        7: { bulletWidth: 7, beamCount: 3 },
        8: { bulletWidth: 8, beamCount: 3 },
        9: { bulletWidth: 9, beamCount: 3 }
    },
    [WeaponType.MISSILE]: {
        1: { bulletCount: 1 },
        2: { bulletCount: 2 },
        3: { bulletCount: 3 },
        4: { bulletCount: 4 },
        5: { bulletCount: 4 },
        6: { bulletCount: 4 },
        7: { bulletCount: 6 },
        8: { bulletCount: 6 },
        9: { bulletCount: 8 }
    },
    [WeaponType.WAVE]: {
        1: { bulletWidth: 12 },
        2: { bulletWidth: 24 },
        3: { bulletWidth: 36 },
        4: { bulletWidth: 48 },
        5: { bulletWidth: 60 },
        6: { bulletWidth: 72 },
        7: { bulletWidth: 84 },
        8: { bulletWidth: 96 },
        9: { bulletWidth: 108 }
    },
    [WeaponType.PLASMA]: {
        1: { bulletWidth: 8, bulletHeight: 8 },
        2: { bulletWidth: 16, bulletHeight: 16 },
        3: { bulletWidth: 24, bulletHeight: 24 },
        4: { bulletWidth: 32, bulletHeight: 32 },
        5: { bulletWidth: 40, bulletHeight: 40 },
        6: { bulletWidth: 48, bulletHeight: 48 },
        7: { bulletWidth: 56, bulletHeight: 56 },
        8: { bulletWidth: 64, bulletHeight: 64 },
        9: { bulletWidth: 72, bulletHeight: 72 }
    },
    [WeaponType.TESLA]: {
        1: { chainCount: 1, chainRange: 400 },
        2: { chainCount: 1, chainRange: 500 },
        3: { chainCount: 2, chainRange: 600 },
        4: { chainCount: 2, chainRange: 700 },
        5: { chainCount: 3, chainRange: 800 },
        6: { chainCount: 3, chainRange: 900 },
        7: { chainCount: 4, chainRange: 1000 },
        8: { chainCount: 4, chainRange: 1000 },
        9: { chainCount: 5, chainRange: 1000 }
    },
    [WeaponType.MAGMA]: {
        1: { bulletCount: 2 },
        2: { bulletCount: 2 },
        3: { bulletCount: 3 },
        4: { bulletCount: 3 },
        5: { bulletCount: 4 },
        6: { bulletCount: 4 },
        7: { bulletCount: 5 },
        8: { bulletCount: 5 },
        9: { bulletCount: 6 }
    },
    [WeaponType.SHURIKEN]: {
        1: { bulletCount: 1 },
        2: { bulletCount: 1 },
        3: { bulletCount: 2 },
        4: { bulletCount: 2 },
        5: { bulletCount: 3 },
        6: { bulletCount: 3 },
        7: { bulletCount: 4 },
        8: { bulletCount: 4 },
        9: { bulletCount: 4 }
    }
};