import {
    PowerupType,
} from '@/types';

// ==================== 道具视觉配置 ====================
export interface PowerupVisualConfig {
    color: string;      // 边框颜色
    label: string;      // 显示标签
}

export const PowerupVisuals: Record<PowerupType, PowerupVisualConfig> = {
    // 武器道具 - 这些会使用武器配置中的颜色和图标
    [PowerupType.VULCAN]: { color: '', label: '' },
    [PowerupType.LASER]: { color: '', label: '' },
    [PowerupType.MISSILE]: { color: '', label: '' },
    [PowerupType.WAVE]: { color: '', label: '' },
    [PowerupType.PLASMA]: { color: '', label: '' },
    [PowerupType.TESLA]: { color: '', label: '' },
    [PowerupType.MAGMA]: { color: '', label: '' },
    [PowerupType.SHURIKEN]: { color: '', label: '' },

    // 特殊道具
    [PowerupType.POWER]: { color: '#ecc94b', label: 'P' },  // 武器能量提升
    [PowerupType.HP]: { color: '#48bb78', label: 'H' },     // 生命值恢复
    [PowerupType.BOMB]: { color: '#f56565', label: 'B' },   // 炸弹
    [PowerupType.OPTION]: { color: '#a0aec0', label: 'O' },  // 僚机
    [PowerupType.TEMP_SHIELD]: { color: '#cbd5e1', label: 'S' },
    [PowerupType.TIME_SLOW]: { color: '#22d3ee', label: 'T' }
};

export function registerPowerupVisual(type: PowerupType, config: PowerupVisualConfig): void {
    (PowerupVisuals as any)[type] = config;
}

export function validatePowerupVisuals(requiredTypes: PowerupType[]): void {
    requiredTypes.forEach(t => {
        if (!(t in PowerupVisuals)) {
            console.warn(`Missing visuals for powerup: ${t}`);
        }
    });
}
