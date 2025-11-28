import {
    PowerupType,
} from '@/types';

// ==================== 道具掉落配置 ====================
export const PowerupDropConfig = {
    elitePowerupDropRate: 0.6,
    normalPowerupDropRate: 0.1,
    bossDropRate: 1.0,
};

export const PowerupDropRates: Record<PowerupType, number> = {
    [PowerupType.POWER]: 0.20,
    [PowerupType.HP]: 0.18,
    [PowerupType.VULCAN]: 0.10,
    [PowerupType.LASER]: 0.10,
    [PowerupType.MISSILE]: 0.10,
    [PowerupType.SHURIKEN]: 0.08,
    [PowerupType.TESLA]: 0.08,
    [PowerupType.MAGMA]: 0.08,
    [PowerupType.WAVE]: 0.04,
    [PowerupType.PLASMA]: 0.02,
    [PowerupType.BOMB]: 0.01,
    [PowerupType.OPTION]: 0.01
};

export function selectPowerupType(): PowerupType {
    const r = Math.random();
    let cumulative = 0;

    for (const type of Object.values(PowerupType)) {
        cumulative += PowerupDropRates[type];
        if (r < cumulative) {
            return type;
        }
    }

    return PowerupType.POWER;
}