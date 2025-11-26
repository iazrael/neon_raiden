import { WeaponType } from './types';

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
    hpPerLevel: 1500,
    baseBulletCount: 5,
    bulletCountPerLevel: 3,
    scorePerLevel: 5000
};
