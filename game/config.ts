import { WeaponType } from '@/types';

// Powerup types enumeration for better readability
export enum PowerupType {
    POWER = 0,      // 武器能量提升
    LASER = 1,      // 激光武器
    VULCAN = 2,     // 散弹武器
    HP = 3,         // 生命值恢复
    WAVE = 4,       // 波动炮
    PLASMA = 5,     // 等离子炮
    BOMB = 6,       // 炸弹
    OPTION = 7,     // 僚机
    TESLA = 8,      // 电磁炮
    MAGMA = 9,      // 熔岩炮
    SHURIKEN = 10   // 手里剑
}

// Enemy types enumeration for better readability
export enum EnemyType {
    NORMAL = 0,             // 普通敌人
    FAST = 1,               // 快速移动
    TANK = 2,               // 坦克型
    KAMIKAZE = 3,           // 神风特攻
    ELITE_GUNBOAT = 4,      // 精英炮艇
    LASER_INTERCEPTOR = 5,  // 激光拦截机
    MINE_LAYER = 6          // 布雷机
}

export const GameConfig = {
    width: 0, // Set dynamically
    height: 0, // Set dynamically
    maxLevels: 10,
    debug: false,
};

export const PlayerConfig = {
    speed: 7,
    width: 48,
    height: 48,
    initialHp: 100,
    maxHp: 100,
    initialBombs: 3,
    maxBombs: 6,
    maxShield: 50,
    color: '#00ffff',
    hitboxShrink: 0, // Future use
};

export const WeaponConfig = {
    [WeaponType.VULCAN]: {
        baseDamage: 10,
        damagePerLevel: 3,
        speed: 15,
        baseFireRate: 100,
        ratePerLevel: 2,
        width: 10,
        height: 20,
        color: '#fff',
        sprite: 'bullet_vulcan'
    },
    [WeaponType.LASER]: {
        baseDamage: 5,
        damagePerLevel: 3,
        speed: 25,
        baseFireRate: 60,
        ratePerLevel: 0, // Fixed rate
        width: 12,
        height: 60,
        color: '#f0f',
        sprite: 'bullet_laser'
    },
    [WeaponType.MISSILE]: {
        baseDamage: 15,
        damagePerLevel: 6,
        speed: 12,
        baseFireRate: 100,
        ratePerLevel: 2,
        width: 16,
        height: 32,
        color: '#f00',
        sprite: 'bullet_missile'
    },
    [WeaponType.WAVE]: {
        baseDamage: 20,
        damagePerLevel: 6,
        speed: 15,
        baseFireRate: 350,
        ratePerLevel: 20,
        width: 80,
        height: 30,
        color: '#0ff',
        sprite: 'bullet_wave'
    },
    [WeaponType.PLASMA]: {
        baseDamage: 80,
        damagePerLevel: 25,
        speed: 8,
        baseFireRate: 600,
        ratePerLevel: 50,
        width: 48,
        height: 48,
        color: '#ed64a6',
        sprite: 'bullet_plasma'
    },
    [WeaponType.TESLA]: {
        baseDamage: 15,
        damagePerLevel: 4,
        speed: 20,
        baseFireRate: 200,
        ratePerLevel: 10,
        width: 32,
        height: 32,
        color: '#ccf',
        sprite: 'bullet_tesla'
    },
    [WeaponType.MAGMA]: {
        baseDamage: 8,
        damagePerLevel: 2,
        speed: 12, // Avg
        baseFireRate: 50,
        ratePerLevel: 0,
        width: 24,
        height: 24,
        color: '#f60',
        sprite: 'bullet_magma'
    },
    [WeaponType.SHURIKEN]: {
        baseDamage: 12,
        damagePerLevel: 3,
        speed: 12,
        baseFireRate: 400,
        ratePerLevel: 30,
        width: 24,
        height: 24,
        color: '#ccc',
        sprite: 'bullet_shuriken'
    }
};

// Enemy spawn weights by level - higher weight = more frequent spawning
export const EnemySpawnWeights = {
    1: { [EnemyType.NORMAL]: 10 },
    2: { [EnemyType.NORMAL]: 7, [EnemyType.FAST]: 5 },
    3: { [EnemyType.NORMAL]: 5, [EnemyType.FAST]: 4, [EnemyType.TANK]: 3, [EnemyType.KAMIKAZE]: 3 },
    4: { [EnemyType.NORMAL]: 4, [EnemyType.FAST]: 5, [EnemyType.TANK]: 3, [EnemyType.KAMIKAZE]: 4 },
    5: { [EnemyType.NORMAL]: 3, [EnemyType.FAST]: 5, [EnemyType.TANK]: 3, [EnemyType.KAMIKAZE]: 5, [EnemyType.ELITE_GUNBOAT]: 2 },
    6: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 6, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 6, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 3 },
    7: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 6, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 7, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 3, [EnemyType.MINE_LAYER]: 2 },
    8: { [EnemyType.NORMAL]: 1, [EnemyType.FAST]: 7, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 8, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 4, [EnemyType.MINE_LAYER]: 3 },
    9: { [EnemyType.NORMAL]: 1, [EnemyType.FAST]: 8, [EnemyType.TANK]: 1, [EnemyType.KAMIKAZE]: 9, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 4, [EnemyType.MINE_LAYER]: 3 },
    10: { [EnemyType.NORMAL]: 1, [EnemyType.FAST]: 9, [EnemyType.TANK]: 1, [EnemyType.KAMIKAZE]: 10, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 5, [EnemyType.MINE_LAYER]: 4 }
};

export const EnemyConfig = {
    baseSpawnRate: 1500,
    spawnRateReductionPerLevel: 200,
    minSpawnRate: 300,
    eliteChance: 0.15,
    eliteHpMultiplier: 3,
    eliteSizeMultiplier: 1.3,
    enemyCountMultiplier: 1.15, // Enemies increase by 15% per level
    types: {
        [EnemyType.NORMAL]: { // 普通敌人
            baseHp: 20,
            hpPerLevel: 10,
            baseSpeed: 2,
            speedPerLevel: 0.5,
            width: 40,
            height: 40,
            score: 100
        },
        [EnemyType.FAST]: { // 快速移动
            baseHp: 10,
            hpPerLevel: 0,
            baseSpeed: 5,
            speedPerLevel: 1,
            width: 30,
            height: 40,
            score: 200,
            shootFrequency: 0.015 // Increased shooting frequency
        },
        [EnemyType.TANK]: { // 坦克型
            baseHp: 60,
            hpPerLevel: 20,
            baseSpeed: 1,
            speedPerLevel: 0,
            width: 60,
            height: 60,
            score: 300
        },
        [EnemyType.KAMIKAZE]: { // 神风特攻
            baseHp: 5,
            hpPerLevel: 0,
            baseSpeed: 7,
            speedPerLevel: 0,
            width: 30,
            height: 30,
            score: 400,
            shootFrequency: 0.02 // Increased shooting frequency
        },
        [EnemyType.ELITE_GUNBOAT]: { // 精英炮艇
            baseHp: 150,
            hpPerLevel: 30,
            baseSpeed: 0.5,
            speedPerLevel: 0,
            width: 70,
            height: 50,
            score: 500
        },
        [EnemyType.LASER_INTERCEPTOR]: { // 激光拦截机
            baseHp: 80,
            hpPerLevel: 15,
            baseSpeed: 4,
            speedPerLevel: 0,
            width: 50,
            height: 50,
            score: 600
        },
        [EnemyType.MINE_LAYER]: { // 布雷机
            baseHp: 120,
            hpPerLevel: 20,
            baseSpeed: 1.5,
            speedPerLevel: 0,
            width: 60,
            height: 40,
            score: 700
        }
    }
};

// Powerup drop rates configuration
export const PowerupDropRates = {
    [PowerupType.POWER]: 0.25,      // 武器能量提升: 25%
    [PowerupType.LASER]: 0.10,      // 激光武器: 10%
    [PowerupType.VULCAN]: 0.10,     // 散弹武器: 10%
    [PowerupType.HP]: 0.20,         // 生命值恢复: 20%
    [PowerupType.WAVE]: 0.15,       // 波动炮: 15%
    [PowerupType.PLASMA]: 0.10,     // 等离子炮: 10%
    [PowerupType.BOMB]: 0.05,       // 炸弹: 5%
    [PowerupType.OPTION]: 0.08,     // 僚机: 8%
    [PowerupType.TESLA]: 0.05,      // 电磁炮: 5%
    [PowerupType.MAGMA]: 0.05,      // 熔岩炮: 5%
    [PowerupType.SHURIKEN]: 0.05    // 手里剑: 5%
};

// Helper function to select powerup type based on drop rates
export function selectPowerupType(): number {
    const r = Math.random();
    let cumulative = 0;

    for (let type = PowerupType.POWER; type <= PowerupType.SHURIKEN; type++) {
        cumulative += PowerupDropRates[type as keyof typeof PowerupDropRates];
        if (r < cumulative) {
            return type;
        }
    }

    return PowerupType.POWER; // Fallback to Power
};

// Powerup effects configuration
export const PowerupEffects = {
    maxWeaponLevel: 10,
    maxOptions: 3,
    maxBombs: 6,
    hpRestoreAmount: 30,
    shieldRestoreAmount: 25,

    // Weapon type mapping for powerups
    weaponTypeMap: {
        [PowerupType.POWER]: null,        // Generic power upgrade
        [PowerupType.LASER]: WeaponType.LASER,
        [PowerupType.VULCAN]: WeaponType.VULCAN,
        [PowerupType.WAVE]: WeaponType.WAVE,
        [PowerupType.PLASMA]: WeaponType.PLASMA,
        [PowerupType.TESLA]: WeaponType.TESLA,
        [PowerupType.MAGMA]: WeaponType.MAGMA,
        [PowerupType.SHURIKEN]: WeaponType.SHURIKEN
    }
};

// Boss spawn timing configuration (in seconds)
export const BossSpawnConfig = {
    minLevelDuration: 60, // Minimum seconds before boss can spawn
};

// Boss names for better readability
export enum BossName {
    GUARDIAN = 'GUARDIAN',           // 守护者 - Level 1
    INTERCEPTOR = 'INTERCEPTOR',     // 拦截者 - Level 2
    DESTROYER = 'DESTROYER',         // 毁灭者 - Level 3
    ANNIHILATOR = 'ANNIHILATOR',     // 歼灭者 - Level 4
    DOMINATOR = 'DOMINATOR',         // 主宰者 - Level 5
    OVERLORD = 'OVERLORD',           // 霸主 - Level 6
    TITAN = 'TITAN',                 // 泰坦 - Level 7
    COLOSSUS = 'COLOSSUS',           // 巨像 - Level 8
    LEVIATHAN = 'LEVIATHAN',         // 利维坦 - Level 9
    APOCALYPSE = 'APOCALYPSE'        // 天启 - Level 10
}

export const BossConfig = {
    [BossName.GUARDIAN]: {
        level: 1,
        hp: 1500,
        speed: 1.0,
        size: 0.8,
        bulletCount: 8,
        bulletSpeed: 4.0,
        fireRate: 0.05,
        targetedShotSpeed: 0,
        hasLaser: false,
        weaponCount: 1,
        score: 5000,
        weapons: ['radial'],
        movementPattern: 'sine',
        spawnX: 'random',
        wingmenCount: 0,
        wingmenType: 0,
        laserType: 'none',
        laserDamage: 0,
        laserCooldown: 0,
        hitboxScale: 0.8
    },
    [BossName.INTERCEPTOR]: {
        level: 2,
        hp: 1800, // 1500 × 1.2
        speed: 1.2,
        size: 0.8,
        bulletCount: 11,
        bulletSpeed: 4.5,
        fireRate: 0.06,
        targetedShotSpeed: 9,
        hasLaser: false,
        weaponCount: 1,
        score: 10000,
        weapons: ['radial', 'targeted'],
        movementPattern: 'sine',
        spawnX: 'random',
        wingmenCount: 0,
        wingmenType: 0,
        laserType: 'none',
        laserDamage: 0,
        laserCooldown: 0,
        hitboxScale: 0.8
    },
    [BossName.DESTROYER]: {
        level: 3,
        hp: 2160, // 1800 × 1.2
        speed: 1.4,
        size: 0.85,
        bulletCount: 14,
        bulletSpeed: 5.0,
        fireRate: 0.065,
        targetedShotSpeed: 10,
        hasLaser: false,
        weaponCount: 1,
        score: 15000,
        weapons: ['radial', 'targeted'],
        movementPattern: 'figure8',
        spawnX: 'random',
        wingmenCount: 0,
        wingmenType: 0,
        laserType: 'none',
        laserDamage: 0,
        laserCooldown: 0,
        hitboxScale: 0.8
    },
    [BossName.ANNIHILATOR]: {
        level: 4,
        hp: 2592, // 2160 × 1.2
        speed: 1.6,
        size: 0.85,
        bulletCount: 17,
        bulletSpeed: 5.5,
        fireRate: 0.07,
        targetedShotSpeed: 11,
        hasLaser: false,
        weaponCount: 1,
        score: 20000,
        weapons: ['radial', 'targeted'],
        movementPattern: 'figure8',
        spawnX: 'random',
        wingmenCount: 0,
        wingmenType: 0,
        laserType: 'none',
        laserDamage: 0,
        laserCooldown: 0,
        hitboxScale: 0.8
    },
    [BossName.DOMINATOR]: {
        level: 5,
        hp: 3110, // 2592 × 1.2
        speed: 1.8,
        size: 0.9,
        bulletCount: 20,
        bulletSpeed: 6.0,
        fireRate: 0.075,
        targetedShotSpeed: 12,
        hasLaser: false,
        weaponCount: 1,
        score: 25000,
        weapons: ['radial', 'targeted'],
        movementPattern: 'figure8',
        spawnX: 'random',
        wingmenCount: 0,
        wingmenType: 0,
        laserType: 'none',
        laserDamage: 0,
        laserCooldown: 0,
        hitboxScale: 0.8
    },
    [BossName.OVERLORD]: {
        level: 6,
        hp: 3732, // 3110 × 1.2
        speed: 2.0,
        size: 0.9,
        bulletCount: 23,
        bulletSpeed: 6.5,
        fireRate: 0.08,
        targetedShotSpeed: 13,
        hasLaser: true,
        weaponCount: 2,
        score: 30000,
        weapons: ['radial', 'targeted', 'laser'],
        movementPattern: 'tracking',
        spawnX: 'random',
        wingmenCount: 0,
        wingmenType: 0,
        laserType: 'continuous',
        laserDamage: 30,
        laserCooldown: 3000,
        hitboxScale: 0.8
    },
    [BossName.TITAN]: {
        level: 7,
        hp: 4478, // 3732 × 1.2
        speed: 2.2,
        size: 0.95,
        bulletCount: 26,
        bulletSpeed: 7.0,
        fireRate: 0.085,
        targetedShotSpeed: 14,
        hasLaser: true,
        weaponCount: 2,
        score: 35000,
        weapons: ['radial', 'targeted', 'laser'],
        movementPattern: 'tracking',
        spawnX: 'random',
        wingmenCount: 0,
        wingmenType: 0,
        laserType: 'continuous',
        laserDamage: 35,
        laserCooldown: 2800,
        hitboxScale: 0.8
    },
    [BossName.COLOSSUS]: {
        level: 8,
        hp: 5374, // 4478 × 1.2
        speed: 2.4,
        size: 0.95,
        bulletCount: 29,
        bulletSpeed: 7.5,
        fireRate: 0.09,
        targetedShotSpeed: 15,
        hasLaser: true,
        weaponCount: 2,
        score: 40000,
        weapons: ['radial', 'targeted', 'laser', 'spread'],
        movementPattern: 'aggressive',
        spawnX: 'random',
        wingmenCount: 1,
        wingmenType: 5,
        laserType: 'pulsed',
        laserDamage: 40,
        laserCooldown: 2500,
        hitboxScale: 0.8
    },
    [BossName.LEVIATHAN]: {
        level: 9,
        hp: 6449, // 5374 × 1.2
        speed: 2.6,
        size: 1.0,
        bulletCount: 32,
        bulletSpeed: 8.0,
        fireRate: 0.095,
        targetedShotSpeed: 16,
        hasLaser: true,
        weaponCount: 3,
        score: 45000,
        weapons: ['radial', 'targeted', 'laser', 'spread', 'homing'],
        movementPattern: 'aggressive',
        spawnX: 'random',
        wingmenCount: 2,
        wingmenType: 5,
        laserType: 'pulsed',
        laserDamage: 45,
        laserCooldown: 2200,
        hitboxScale: 0.8
    },
    [BossName.APOCALYPSE]: {
        level: 10,
        hp: 7739, // 6449 × 1.2
        speed: 2.8,
        size: 1.0,
        bulletCount: 35,
        bulletSpeed: 8.5,
        fireRate: 0.1,
        targetedShotSpeed: 17,
        hasLaser: true,
        weaponCount: 3,
        score: 50000,
        weapons: ['radial', 'targeted', 'laser', 'spread', 'homing'],
        movementPattern: 'aggressive',
        spawnX: 'random',
        wingmenCount: 2,
        wingmenType: 6,
        laserType: 'pulsed',
        laserDamage: 50,
        laserCooldown: 2000,
        hitboxScale: 0.8
    }
};

// Helper function to get boss config by level
export function getBossConfigByLevel(level: number) {
    const bossEntry = Object.entries(BossConfig).find(([_, config]) => config.level === level);
    return bossEntry ? bossEntry[1] : null;
}
