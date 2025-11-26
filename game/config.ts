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

export const EnemyConfig = {
    baseSpawnRate: 1500,
    spawnRateReductionPerLevel: 200,
    minSpawnRate: 300,
    eliteChance: 0.15,
    eliteHpMultiplier: 3,
    eliteSizeMultiplier: 1.3,
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
            score: 200
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
            score: 400
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

export const BossConfig = {
    1: {
        hp: 1500,
        speed: 1.0,
        size: 0.8,
        bulletCount: 8,
        bulletSpeed: 4.0,
        fireRate: 0.03,
        targetedShotSpeed: 0,
        hasLaser: false,
        weaponCount: 1,
        score: 5000
    },
    2: {
        hp: 3000,
        speed: 1.2,
        size: 0.8,
        bulletCount: 11,
        bulletSpeed: 4.5,
        fireRate: 0.04,
        targetedShotSpeed: 9,
        hasLaser: false,
        weaponCount: 1,
        score: 10000
    },
    3: {
        hp: 4500,
        speed: 1.4,
        size: 0.85,
        bulletCount: 14,
        bulletSpeed: 5.0,
        fireRate: 0.045,
        targetedShotSpeed: 10,
        hasLaser: false,
        weaponCount: 1,
        score: 15000
    },
    4: {
        hp: 6000,
        speed: 1.6,
        size: 0.85,
        bulletCount: 17,
        bulletSpeed: 5.5,
        fireRate: 0.05,
        targetedShotSpeed: 11,
        hasLaser: false,
        weaponCount: 1,
        score: 20000
    },
    5: {
        hp: 7500,
        speed: 1.8,
        size: 0.9,
        bulletCount: 20,
        bulletSpeed: 6.0,
        fireRate: 0.055,
        targetedShotSpeed: 12,
        hasLaser: false,
        weaponCount: 1,
        score: 25000
    },
    6: {
        hp: 9000,
        speed: 2.0,
        size: 0.9,
        bulletCount: 23,
        bulletSpeed: 6.5,
        fireRate: 0.06,
        targetedShotSpeed: 13,
        hasLaser: true,
        weaponCount: 2,
        score: 30000
    },
    7: {
        hp: 10500,
        speed: 2.2,
        size: 0.95,
        bulletCount: 26,
        bulletSpeed: 7.0,
        fireRate: 0.065,
        targetedShotSpeed: 14,
        hasLaser: true,
        weaponCount: 2,
        score: 35000
    },
    8: {
        hp: 12000,
        speed: 2.4,
        size: 0.95,
        bulletCount: 29,
        bulletSpeed: 7.5,
        fireRate: 0.07,
        targetedShotSpeed: 15,
        hasLaser: true,
        weaponCount: 2,
        score: 40000
    },
    9: {
        hp: 13500,
        speed: 2.6,
        size: 1.0,
        bulletCount: 32,
        bulletSpeed: 8.0,
        fireRate: 0.075,
        targetedShotSpeed: 16,
        hasLaser: true,
        weaponCount: 3,
        score: 45000
    },
    10: {
        hp: 15000,
        speed: 2.8,
        size: 1.0,
        bulletCount: 35,
        bulletSpeed: 8.5,
        fireRate: 0.08,
        targetedShotSpeed: 17,
        hasLaser: true,
        weaponCount: 3,
        score: 50000
    }
};
