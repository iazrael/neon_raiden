import { AmmoType } from '@/engine/types';
import { SpriteSpec } from '@/engine/configs';
import { ASSETS } from '@/engine/configs/assets';

// 弹药类型列表
export const PLAYER_AMMO_TYPES = [
    AmmoType.VULCAN_SPREAD,
    AmmoType.LASER_BEAM,
    AmmoType.MISSILE_HOMING,
    AmmoType.WAVE_PULSE,
    AmmoType.PLASMA_ORB,
    AmmoType.TESLA_CHAIN,
    AmmoType.MAGMA_POOL,
    AmmoType.SHURIKEN_BOUNCE,
] as const;

// 定义玩家子弹类型
type PlayerAmmoType = typeof PLAYER_AMMO_TYPES[number];

// 玩家武器子弹精灵配置
export const PLAYER_BULLET_SPRITES: Record<PlayerAmmoType, SpriteSpec> = {
    [AmmoType.VULCAN_SPREAD]: {
        texture: ASSETS.BULLETS.vulcan,
        color: '#ebdd17ff',
        size: { width: 10, height: 20 },
    },
    [AmmoType.LASER_BEAM]: {
        texture: ASSETS.BULLETS.laser,
        color: '#3fc4f0ff',
        size: { width: 8, height: 50 },
    },
    [AmmoType.MISSILE_HOMING]: {
        texture: ASSETS.BULLETS.missile,
        color: '#ca0ac7ff',
        size: { width: 16, height: 32 },
    },
    [AmmoType.WAVE_PULSE]: {
        texture: ASSETS.BULLETS.wave,
        color: '#1e8de7ff',
        size: { width: 60, height: 12 },
    },
    [AmmoType.PLASMA_ORB]: {
        texture: ASSETS.BULLETS.plasma,
        color: '#ed64a6',
        size: { width: 32, height: 32 },
    },
    [AmmoType.TESLA_CHAIN]: {
        texture: ASSETS.BULLETS.tesla,
        color: '#1053d9ff',
        size: { width: 16, height: 64 },
    },
    [AmmoType.MAGMA_POOL]: {
        texture: ASSETS.BULLETS.magma,
        color: '#f60',
        size: { width: 24, height: 24 },
    },
    [AmmoType.SHURIKEN_BOUNCE]: {
        texture: ASSETS.BULLETS.shuriken,
        color: '#ccccccff',
        size: { width: 24, height: 24 },
    }
};

// 定义敌人子弹类型
export const ENEMY_AMMO_TYPES = [
    AmmoType.ENEMY_ORB_RED,
    AmmoType.ENEMY_ORB_BLUE,
    AmmoType.ENEMY_ORB_GREEN,
    AmmoType.ENEMY_BEAM_THIN,
    AmmoType.ENEMY_BEAM_THICK,
    AmmoType.ENEMY_HEAVY,
    AmmoType.ENEMY_RAPID,
    AmmoType.ENEMY_HOMING,
    AmmoType.ENEMY_SPIRAL,
    AmmoType.ENEMY_MISSILE,
    AmmoType.ENEMY_PULSE,
    AmmoType.ENEMY_VOID_ORB,
] as const;

// 定义敌人子弹类型
type EnemyAmmoType = typeof ENEMY_AMMO_TYPES[number];


// 敌人子弹精灵配置
export const ENEMY_BULLET_SPRITES: Record<EnemyAmmoType, SpriteSpec> = {
    [AmmoType.ENEMY_ORB_RED]: {
        texture: ASSETS.ENEMIE_BULLETS.orb,
        color: '#ff9999',
        size: { width: 14, height: 14 },
    },
    [AmmoType.ENEMY_ORB_BLUE]: {
        texture: ASSETS.ENEMIE_BULLETS.orb,
        color: '#ff9999',
        size: { width: 14, height: 14 },
    },
    [AmmoType.ENEMY_ORB_GREEN]: {
        texture: ASSETS.ENEMIE_BULLETS.orb,
        color: '#ff9999',
        size: { width: 14, height: 14 },
    },
    [AmmoType.ENEMY_BEAM_THIN]: {
        texture: ASSETS.ENEMIE_BULLETS.beam,
        color: '#f97316ff',
        size: { width: 12, height: 32 },
    },
    [AmmoType.ENEMY_BEAM_THICK]: {
        texture: ASSETS.ENEMIE_BULLETS.beam,
        color: '#f97316ff',
        size: { width: 16, height: 48 },
    },
    [AmmoType.ENEMY_RAPID]: {
        texture: ASSETS.ENEMIE_BULLETS.rapid,
        color: '#ecc94b',
        size: { width: 10, height: 20 },
    },
    [AmmoType.ENEMY_HEAVY]: {
        texture: ASSETS.ENEMIE_BULLETS.heavy,
        color: '#9f7aea',
        size: { width: 28, height: 28 },
    },
    [AmmoType.ENEMY_HOMING]: {
        texture: ASSETS.ENEMIE_BULLETS.homing,
        color: '#48bb78',
        size: { width: 16, height: 16 },
    },
    [AmmoType.ENEMY_SPIRAL]: {
        texture: ASSETS.ENEMIE_BULLETS.spiral,
        color: '#4299e1',
        size: { width: 14, height: 14 },
    },
    [AmmoType.ENEMY_MISSILE]: {
        texture: ASSETS.ENEMIE_BULLETS.missile,
        color: '#ff9999',
        size: { width: 16, height: 16 },
    },
    [AmmoType.ENEMY_PULSE]: {
        texture: ASSETS.ENEMIE_BULLETS.pulse,
        color: '#ff9999',
        size: { width: 16, height: 16 },
    },
    [AmmoType.ENEMY_VOID_ORB]: {
        texture: ASSETS.ENEMIE_BULLETS.voidOrb,
        color: '#ff9999',
        size: { width: 16, height: 16 },
    },
    
};

// 合并所有子弹精灵配置
export const BULLET_SPRITES: Record<string, SpriteSpec> = {
    ...PLAYER_BULLET_SPRITES,
    ...ENEMY_BULLET_SPRITES
};