// configs/weaponGrowth.ts  （武器成长数据）
import { WeaponType } from '@/types';

export const WeaponGrowthData: Record<WeaponType, Omit<WeaponEntity, 'type' | 'id' | 'name' | 'chineseName' | 'describe' | 'color' | 'bullet' | 'sprite'>> = {
    [WeaponType.VULCAN]: {
        baseDamage: 12,
        damagePerLevel: 3,
        speed: 15,
        baseSpeed: 15,
        baseFireRate: 150,
        ratePerLevel: 2,
        maxLevel: 6
    },
    [WeaponType.LASER]: {
        baseDamage: 6,
        damagePerLevel: 2,
        speed: 25,
        baseSpeed: 15,
        baseFireRate: 180,
        ratePerLevel: 5,
        maxLevel: 3,
        attenuation: 0.25
    },
    [WeaponType.MISSILE]: {
        baseDamage: 35,
        damagePerLevel: 5,
        speed: 50,
        baseSpeed: 15,
        baseFireRate: 400,
        ratePerLevel: 20,
        maxLevel: 3,
    },
    [WeaponType.WAVE]: {
        baseDamage: 18,
        damagePerLevel: 6,
        speed: 10,
        baseSpeed: 15,
        baseFireRate: 400,
        ratePerLevel: 20,
        maxLevel: 3,
        attenuation: 0.5
    },
    [WeaponType.PLASMA]: {
        baseDamage: 45,
        damagePerLevel: 12,
        speed: 8,
        baseSpeed: 15,
        baseFireRate: 600,
        ratePerLevel: 20,
        maxLevel: 3
    },
    [WeaponType.TESLA]: {
        baseDamage: 15,
        damagePerLevel: 1,
        speed: 25,
        baseSpeed: 15,
        baseFireRate: 200,
        ratePerLevel: 0,
        maxLevel: 6
    },
    [WeaponType.MAGMA]: {
        baseDamage: 15,
        damagePerLevel: 5,
        speed: 10,
        baseSpeed: 15,
        baseFireRate: 220,
        ratePerLevel: 0,
        maxLevel: 6
    },
    [WeaponType.SHURIKEN]: {
        baseDamage: 15,
        damagePerLevel: 3,
        speed: 20,
        baseSpeed: 15,
        baseFireRate: 300,
        ratePerLevel: 20,
        maxLevel: 6
    }
};