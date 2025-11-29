import { WeaponEntity } from '@/types';

/**
 * DPS计算器 - 计算武器的每秒伤害
 * 
 * DPS = (基础伤害 + 等级伤害加成) × (1000 / 射击间隔) × (子弹速度 / 基准速度)
 * 
 * @param weapon 武器配置
 * @param level 武器等级 (默认为0)
 * @returns 计算出的DPS值
 */
export function calculateDPS(weapon: WeaponEntity, level: number = 0): number {
    // 计算实际伤害
    const actualDamage = weapon.baseDamage + (level * weapon.damagePerLevel);
    
    // 计算射击间隔（毫秒）
    const fireRate = Math.max(30, weapon.baseFireRate - (level * weapon.ratePerLevel));
    
    // 获取基准速度（默认为15）
    const baseSpeed = weapon.baseSpeed || 15;
    
    // 计算DPS
    // (伤害) × (射击频率) × (速度修正)
    const dps = actualDamage * (1000 / fireRate) * (weapon.speed / baseSpeed);
    
    return Math.round(dps * 100) / 100; // 保留两位小数
}

/**
 * 获取武器在不同等级下的DPS值
 * 
 * @param weapon 武器配置
 * @returns 包含各等级DPS值的对象
 */
export function getDPSByLevel(weapon: WeaponEntity): Record<number, number> {
    const dpsValues: Record<number, number> = {};
    
    // 计算0-9级的DPS值
    for (let level = 0; level <= 9; level++) {
        dpsValues[level] = calculateDPS(weapon, level);
    }
    
    return dpsValues;
}