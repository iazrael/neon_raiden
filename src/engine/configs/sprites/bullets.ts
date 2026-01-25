import { AmmoType } from '../../types';
import { SpriteSpec } from '../index';
import { ASSETS } from '../assets';

/**
 * 子弹外观配置
 * 职责：纯视觉配置，与数值配置（AMMO_TABLE）分离
 * 多种子弹类型可共用同一纹理，通过颜色区分
 */

// 玩家子弹类型列表
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

type PlayerAmmoType = typeof PLAYER_AMMO_TYPES[number];

// 敌人子弹类型列表
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

type EnemyAmmoType = typeof ENEMY_AMMO_TYPES[number];

// 玩家子弹外观配置
export const PLAYER_BULLET_SPRITES: Record<PlayerAmmoType, SpriteSpec> = {
    [AmmoType.VULCAN_SPREAD]: {
        texture: ASSETS.BULLETS.vulcan,
        color: '#ebdd17ff',
        srcW: 10, srcH: 20,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.LASER_BEAM]: {
        texture: ASSETS.BULLETS.laser,
        color: '#3fc4f0ff',
        srcW: 8, srcH: 50,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.MISSILE_HOMING]: {
        texture: ASSETS.BULLETS.missile,
        color: '#ca0ac7ff',
        srcW: 16, srcH: 32,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.WAVE_PULSE]: {
        texture: ASSETS.BULLETS.wave,
        color: '#1e8de7ff',
        srcW: 60, srcH: 12,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.PLASMA_ORB]: {
        texture: ASSETS.BULLETS.plasma,
        color: '#ed64a6ff',
        srcW: 32, srcH: 32,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.TESLA_CHAIN]: {
        texture: ASSETS.BULLETS.tesla,
        color: '#1053d9ff',
        srcW: 16, srcH: 64,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.MAGMA_POOL]: {
        texture: ASSETS.BULLETS.magma,
        color: '#ff6600ff',
        srcW: 24, srcH: 24,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.SHURIKEN_BOUNCE]: {
        texture: ASSETS.BULLETS.shuriken,
        color: '#ccccccff',
        srcW: 24, srcH: 24,
        pivotX: 0.5, pivotY: 0.5,
    }
};

// 敌人子弹外观配置（多种子弹共用同一纹理，通过颜色区分）
export const ENEMY_BULLET_SPRITES: Record<EnemyAmmoType, SpriteSpec> = {
    // 球体类子弹 - 共用 orb 纹理
    [AmmoType.ENEMY_ORB_RED]: {
        texture: ASSETS.ENEMIE_BULLETS.orb,
        color: '#ff9999ff',
        srcW: 14, srcH: 14,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.ENEMY_ORB_BLUE]: {
        texture: ASSETS.ENEMIE_BULLETS.orb,
        color: '#9999ffff',
        srcW: 14, srcH: 14,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.ENEMY_ORB_GREEN]: {
        texture: ASSETS.ENEMIE_BULLETS.orb,
        color: '#99ff99ff',
        srcW: 14, srcH: 14,
        pivotX: 0.5, pivotY: 0.5,
    },
    // 光束类子弹 - 共用 beam 纹理
    [AmmoType.ENEMY_BEAM_THIN]: {
        texture: ASSETS.ENEMIE_BULLETS.beam,
        color: '#f97316ff',
        srcW: 12, srcH: 32,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.ENEMY_BEAM_THICK]: {
        texture: ASSETS.ENEMIE_BULLETS.beam,
        color: '#f97316ff',
        srcW: 16, srcH: 48,
        pivotX: 0.5, pivotY: 0.5,
    },
    // 其他类型
    [AmmoType.ENEMY_RAPID]: {
        texture: ASSETS.ENEMIE_BULLETS.rapid,
        color: '#ecc94bff',
        srcW: 10, srcH: 20,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.ENEMY_HEAVY]: {
        texture: ASSETS.ENEMIE_BULLETS.heavy,
        color: '#9f7aeaff',
        srcW: 28, srcH: 28,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.ENEMY_HOMING]: {
        texture: ASSETS.ENEMIE_BULLETS.homing,
        color: '#48bb78ff',
        srcW: 16, srcH: 16,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.ENEMY_SPIRAL]: {
        texture: ASSETS.ENEMIE_BULLETS.spiral,
        color: '#4299e1ff',
        srcW: 14, srcH: 14,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.ENEMY_MISSILE]: {
        texture: ASSETS.ENEMIE_BULLETS.missile,
        color: '#ff9999ff',
        srcW: 16, srcH: 16,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.ENEMY_PULSE]: {
        texture: ASSETS.ENEMIE_BULLETS.pulse,
        color: '#ff9999ff',
        srcW: 16, srcH: 16,
        pivotX: 0.5, pivotY: 0.5,
    },
    [AmmoType.ENEMY_VOID_ORB]: {
        texture: ASSETS.ENEMIE_BULLETS.voidOrb,
        color: '#ff9999ff',
        srcW: 16, srcH: 16,
        pivotX: 0.5, pivotY: 0.5,
    },
};

// 合并所有子弹外观配置
export const BULLET_SPRITE_CONFIG: Record<AmmoType, SpriteSpec> = {
    ...PLAYER_BULLET_SPRITES,
    ...ENEMY_BULLET_SPRITES
};
