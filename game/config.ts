import { WeaponType } from '@/types';

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
    1: { 0: 10 }, // Only normal enemies
    2: { 0: 7, 1: 5 }, // More fast enemies
    3: { 0: 5, 1: 4, 2: 3, 3: 3 }, // Introduce tank and kamikaze
    4: { 0: 4, 1: 5, 2: 3, 3: 4 }, // More fast and kamikaze
    5: { 0: 3, 1: 5, 2: 3, 3: 5, 4: 2 }, // Elite gunboats appear
    6: { 0: 2, 1: 6, 2: 2, 3: 6, 4: 2, 5: 3 }, // Laser interceptors, more fast/kamikaze
    7: { 0: 2, 1: 6, 2: 2, 3: 7, 4: 2, 5: 3, 6: 2 }, // Mine layers, even more kamikaze
    8: { 0: 1, 1: 7, 2: 2, 3: 8, 4: 2, 5: 4, 6: 3 }, // Heavy emphasis on fast/kamikaze
    9: { 0: 1, 1: 8, 2: 1, 3: 9, 4: 2, 5: 4, 6: 3 }, // Maximum fast/kamikaze
    10: { 0: 1, 1: 9, 2: 1, 3: 10, 4: 2, 5: 5, 6: 4 } // Final level chaos
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
        0: { // Normal
            baseHp: 20,
            hpPerLevel: 10,
            baseSpeed: 2,
            speedPerLevel: 0.5,
            width: 40,
            height: 40,
            score: 100
        },
        1: { // Fast
            baseHp: 10,
            hpPerLevel: 0,
            baseSpeed: 5,
            speedPerLevel: 1,
            width: 30,
            height: 40,
            score: 200,
            shootFrequency: 0.015 // Increased shooting frequency
        },
        2: { // Tank
            baseHp: 60,
            hpPerLevel: 20,
            baseSpeed: 1,
            speedPerLevel: 0,
            width: 60,
            height: 60,
            score: 300
        },
        3: { // Kamikaze
            baseHp: 5,
            hpPerLevel: 0,
            baseSpeed: 7,
            speedPerLevel: 0,
            width: 30,
            height: 30,
            score: 400,
            shootFrequency: 0.02 // Increased shooting frequency
        },
        4: { // Elite Gunboat
            baseHp: 150,
            hpPerLevel: 30,
            baseSpeed: 0.5,
            speedPerLevel: 0,
            width: 70,
            height: 50,
            score: 500
        },
        5: { // Laser Interceptor
            baseHp: 80,
            hpPerLevel: 15,
            baseSpeed: 4,
            speedPerLevel: 0,
            width: 50,
            height: 50,
            score: 600
        },
        6: { // Mine Layer
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
    0: 0.25,  // Power: 25%
    1: 0.10,  // Laser: 10%
    2: 0.10,  // Vulcan: 10%
    3: 0.20,  // HP: 20%
    4: 0.15,  // Wave: 15%
    5: 0.10,  // Plasma: 10%
    6: 0.05,  // Bomb: 5%
    7: 0.08,  // Option: 8%
    8: 0.05,  // Tesla: 5%
    9: 0.05,  // Magma: 5%
    10: 0.05  // Shuriken: 5%
};

// Helper function to select powerup type based on drop rates
export function selectPowerupType(): number {
    const r = Math.random();
    let cumulative = 0;

    for (let type = 0; type <= 10; type++) {
        cumulative += PowerupDropRates[type as keyof typeof PowerupDropRates];
        if (r < cumulative) {
            return type;
        }
    }

    return 0; // Fallback to Power
}

// Boss spawn timing configuration (in seconds)
export const BossSpawnConfig = {
    minLevelDuration: 60, // Minimum seconds before boss can spawn
};

export const BossConfig = {
    1: {
        hp: 1500,
        speed: 1.0,
        size: 0.8,
        bulletCount: 8,
        bulletSpeed: 4.0,
        fireRate: 0.05, // Increased from 0.03 for more aggression
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
        hitboxScale: 0.8 // Tighter hitbox for more precise collision
    },
    2: {
        hp: 1800, // Reduced from 3000, 1500 × 1.2
        speed: 1.2,
        size: 0.8,
        bulletCount: 11,
        bulletSpeed: 4.5,
        fireRate: 0.06, // Increased from 0.04
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
    3: {
        hp: 2160, // Reduced from 4500, 1800 × 1.2
        speed: 1.4,
        size: 0.85,
        bulletCount: 14,
        bulletSpeed: 5.0,
        fireRate: 0.065, // Increased from 0.045
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
    4: {
        hp: 2592, // Reduced from 6000, 2160 × 1.2
        speed: 1.6,
        size: 0.85,
        bulletCount: 17,
        bulletSpeed: 5.5,
        fireRate: 0.07, // Increased from 0.05
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
    5: {
        hp: 3110, // Reduced from 7500, 2592 × 1.2
        speed: 1.8,
        size: 0.9,
        bulletCount: 20,
        bulletSpeed: 6.0,
        fireRate: 0.075, // Increased from 0.055
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
    6: {
        hp: 3732, // Reduced from 9000, 3110 × 1.2
        speed: 2.0,
        size: 0.9,
        bulletCount: 23,
        bulletSpeed: 6.5,
        fireRate: 0.08, // Increased from 0.06
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
    7: {
        hp: 4478, // Reduced from 10500, 3732 × 1.2
        speed: 2.2,
        size: 0.95,
        bulletCount: 26,
        bulletSpeed: 7.0,
        fireRate: 0.085, // Increased from 0.065
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
    8: {
        hp: 5374, // Reduced from 12000, 4478 × 1.2
        speed: 2.4,
        size: 0.95,
        bulletCount: 29,
        bulletSpeed: 7.5,
        fireRate: 0.09, // Increased from 0.07
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
    9: {
        hp: 6449, // Reduced from 13500, 5374 × 1.2
        speed: 2.6,
        size: 1.0,
        bulletCount: 32,
        bulletSpeed: 8.0,
        fireRate: 0.095, // Increased from 0.075
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
    10: {
        hp: 7739, // Reduced from 15000, 6449 × 1.2
        speed: 2.8,
        size: 1.0,
        bulletCount: 35,
        bulletSpeed: 8.5,
        fireRate: 0.1, // Increased from 0.08
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
