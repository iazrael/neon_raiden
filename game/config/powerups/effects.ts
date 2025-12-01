import {
    PowerupType,
} from '@/types';
import { WeaponType } from '@/types';

// ==================== 道具效果配置 ====================
export const PowerupEffects = {
    maxWeaponLevel: 9,
    maxOptions: 3,
    initialBombs: 3,
    maxBombs: 9,
    hpRestoreAmount: 30,
    shieldRestoreAmount: 25,
    weaponTypeMap: {
        [PowerupType.VULCAN]: WeaponType.VULCAN,
        [PowerupType.LASER]: WeaponType.LASER,
        [PowerupType.MISSILE]: WeaponType.MISSILE,
        [PowerupType.WAVE]: WeaponType.WAVE,
        [PowerupType.PLASMA]: WeaponType.PLASMA,
        [PowerupType.TESLA]: WeaponType.TESLA,
        [PowerupType.MAGMA]: WeaponType.MAGMA,
        [PowerupType.SHURIKEN]: WeaponType.SHURIKEN
    }
};