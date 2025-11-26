import { WeaponType } from '@/types';
import { EnemyType } from '@/game/config';

/**
 * 图鉴解锁管理系统
 * 使用 localStorage 存储玩家获得的武器和击败的敌人/Boss信息
 */

// ==================== 常量定义 ====================
const UNLOCKED_WEAPONS_KEY = 'neon_raiden_unlocked_weapons';
const UNLOCKED_ENEMIES_KEY = 'neon_raiden_unlocked_enemies';
const UNLOCKED_BOSSES_KEY = 'neon_raiden_unlocked_bosses';

// ==================== 武器解锁管理 ====================

/**
 * 获取已解锁的武器列表
 */
export function getUnlockedWeapons(): WeaponType[] {
    const saved = localStorage.getItem(UNLOCKED_WEAPONS_KEY);
    if (!saved) return [];
    try {
        return JSON.parse(saved);
    } catch {
        return [];
    }
}

/**
 * 检查特定武器是否已解锁
 */
export function isWeaponUnlocked(weaponType: WeaponType): boolean {
    return getUnlockedWeapons().includes(weaponType);
}

/**
 * 解锁武器（玩家拾取武器时调用）
 */
export function unlockWeapon(weaponType: WeaponType): void {
    const unlocked = getUnlockedWeapons();
    if (!unlocked.includes(weaponType)) {
        unlocked.push(weaponType);
        localStorage.setItem(UNLOCKED_WEAPONS_KEY, JSON.stringify(unlocked));
    }
}

/**
 * 解锁多个武器
 */
export function unlockWeapons(weaponTypes: WeaponType[]): void {
    const unlocked = getUnlockedWeapons();
    let changed = false;
    weaponTypes.forEach(type => {
        if (!unlocked.includes(type)) {
            unlocked.push(type);
            changed = true;
        }
    });
    if (changed) {
        localStorage.setItem(UNLOCKED_WEAPONS_KEY, JSON.stringify(unlocked));
    }
}

// ==================== 敌人解锁管理 ====================

/**
 * 获取已击败的敌人类型列表
 */
export function getUnlockedEnemies(): EnemyType[] {
    const saved = localStorage.getItem(UNLOCKED_ENEMIES_KEY);
    if (!saved) return [];
    try {
        return JSON.parse(saved);
    } catch {
        return [];
    }
}

/**
 * 检查特定敌人是否已击败解锁
 */
export function isEnemyUnlocked(enemyType: EnemyType): boolean {
    return getUnlockedEnemies().includes(enemyType);
}

/**
 * 解锁敌人（玩家击败敌人时调用）
 */
export function unlockEnemy(enemyType: EnemyType): void {
    const unlocked = getUnlockedEnemies();
    if (!unlocked.includes(enemyType)) {
        unlocked.push(enemyType);
        localStorage.setItem(UNLOCKED_ENEMIES_KEY, JSON.stringify(unlocked));
    }
}

/**
 * 解锁多个敌人
 */
export function unlockEnemies(enemyTypes: EnemyType[]): void {
    const unlocked = getUnlockedEnemies();
    let changed = false;
    enemyTypes.forEach(type => {
        if (!unlocked.includes(type)) {
            unlocked.push(type);
            changed = true;
        }
    });
    if (changed) {
        localStorage.setItem(UNLOCKED_ENEMIES_KEY, JSON.stringify(unlocked));
    }
}

// ==================== Boss解锁管理 ====================

/**
 * 获取已击败的Boss关卡列表
 */
export function getUnlockedBosses(): number[] {
    const saved = localStorage.getItem(UNLOCKED_BOSSES_KEY);
    if (!saved) return [];
    try {
        return JSON.parse(saved);
    } catch {
        return [];
    }
}

/**
 * 检查特定关卡的Boss是否已击败
 */
export function isBossUnlocked(level: number): boolean {
    return getUnlockedBosses().includes(level);
}

/**
 * 解锁Boss（击败Boss时调用）
 */
export function unlockBoss(level: number): void {
    const unlocked = getUnlockedBosses();
    if (!unlocked.includes(level)) {
        unlocked.push(level);
        localStorage.setItem(UNLOCKED_BOSSES_KEY, JSON.stringify(unlocked));
    }
}

/**
 * 解锁多个Boss
 */
export function unlockBosses(levels: number[]): void {
    const unlocked = getUnlockedBosses();
    let changed = false;
    levels.forEach(level => {
        if (!unlocked.includes(level)) {
            unlocked.push(level);
            changed = true;
        }
    });
    if (changed) {
        localStorage.setItem(UNLOCKED_BOSSES_KEY, JSON.stringify(unlocked));
    }
}

// ==================== 重置函数（调试用） ====================

/**
 * 清除所有解锁记录（仅用于测试/调试）
 */
export function clearAllUnlocks(): void {
    localStorage.removeItem(UNLOCKED_WEAPONS_KEY);
    localStorage.removeItem(UNLOCKED_ENEMIES_KEY);
    localStorage.removeItem(UNLOCKED_BOSSES_KEY);
}

/**
 * 清除武器解锁记录
 */
export function clearWeaponUnlocks(): void {
    localStorage.removeItem(UNLOCKED_WEAPONS_KEY);
}

/**
 * 清除敌人解锁记录
 */
export function clearEnemyUnlocks(): void {
    localStorage.removeItem(UNLOCKED_ENEMIES_KEY);
}

/**
 * 清除Boss解锁记录
 */
export function clearBossUnlocks(): void {
    localStorage.removeItem(UNLOCKED_BOSSES_KEY);
}
