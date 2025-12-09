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
        1: { bulletCount: 1, searchRange: 600, turnSpeed: 4 },
        2: { bulletCount: 2, searchRange: 600, turnSpeed: 4 },
        3: { bulletCount: 3, searchRange: 700, turnSpeed: 8 },
        4: { bulletCount: 4, searchRange: 700, turnSpeed: 8 },
        5: { bulletCount: 5, searchRange: 800, turnSpeed: 10 },
        6: { bulletCount: 6, searchRange: 800, turnSpeed: 10 },
        7: { bulletCount: 7, searchRange: 800, turnSpeed: 12 },
        8: { bulletCount: 8, searchRange: 1000, turnSpeed: 14 },
        9: { bulletCount: 9, searchRange: 1000, turnSpeed: 16 }
    },
    [WeaponType.WAVE]: {
        1: { bulletWidth: 0 },
        2: { bulletWidth: 5 },
        3: { bulletWidth: 10 },
        4: { bulletWidth: 15 },
        5: { bulletWidth: 20 },
        6: { bulletWidth: 25 },
        7: { bulletWidth: 30 },
        8: { bulletWidth: 35 },
        9: { bulletWidth: 40 }
    },
    [WeaponType.PLASMA]: {
        1: { bulletWidth: 2, bulletHeight: 2 },
        2: { bulletWidth: 4, bulletHeight: 4 },
        3: { bulletWidth: 6, bulletHeight: 6 },
        4: { bulletWidth: 8, bulletHeight: 8 },
        5: { bulletWidth: 10, bulletHeight: 10 },
        6: { bulletWidth: 12, bulletHeight: 12 },
        7: { bulletWidth: 14, bulletHeight: 14 },
        8: { bulletWidth: 16, bulletHeight: 16 },
        9: { bulletWidth: 18, bulletHeight: 18 }
    },
    [WeaponType.TESLA]: {
        1: { chainCount: 2, chainRange: 500 },
        2: { chainCount: 3, chainRange: 700 },
        3: { chainCount: 3, chainRange: 1000 },
        4: { chainCount: 4, chainRange: 1200 },
        5: { chainCount: 4, chainRange: 1500 },
        6: { chainCount: 5, chainRange: 1700 },
        7: { chainCount: 5, chainRange: 2000 },
        8: { chainCount: 5, chainRange: 2000 },
        9: { chainCount: 5, chainRange: 2000 }
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
        2: { bulletCount: 2 },
        3: { bulletCount: 3 },
        4: { bulletCount: 3 },
        5: { bulletCount: 3 },
        6: { bulletCount: 4 },
        7: { bulletCount: 4 },
        8: { bulletCount: 4 },
        9: { bulletCount: 5 }
    }
};