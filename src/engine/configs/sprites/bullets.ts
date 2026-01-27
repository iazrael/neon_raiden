/**
 * 子弹外观配置
 * 职责：纯视觉配置，与数值配置（AMMO_TABLE）分离
 *
 * 重构说明：
 * - 使用 SpriteKey 枚举替代 texture 路径
 * - 保留颜色配置用于区分不同子弹类型
 * - 尺寸和 pivot 从 SpriteRegistry 统一获取
 */

import { AmmoType } from '../../types';
import { SpriteKey } from './base';

// ==================== 类型定义 ====================

/**
 * 子弹外观规格
 */
export interface BulletSpriteSpec {
    /** Sprite 唯一标识符 */
    spriteKey: SpriteKey;
    /** 颜色（可选覆盖） */
    color: string;
}

// ==================== 玩家子弹配置 ====================

/**
 * 玩家子弹类型列表
 */
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

/**
 * 玩家子弹 SpriteKey 映射
 */
export const PLAYER_BULLET_SPRITES: Record<PlayerAmmoType, BulletSpriteSpec> = {
    [AmmoType.VULCAN_SPREAD]: {
        spriteKey: SpriteKey.BULLET_VULCAN,
        color: '#ebdd17ff',
    },
    [AmmoType.LASER_BEAM]: {
        spriteKey: SpriteKey.BULLET_LASER,
        color: '#3fc4f0ff',
    },
    [AmmoType.MISSILE_HOMING]: {
        spriteKey: SpriteKey.BULLET_MISSILE,
        color: '#ca0ac7ff',
    },
    [AmmoType.WAVE_PULSE]: {
        spriteKey: SpriteKey.BULLET_WAVE,
        color: '#1e8de7ff',
    },
    [AmmoType.PLASMA_ORB]: {
        spriteKey: SpriteKey.BULLET_PLASMA,
        color: '#ed64a6ff',
    },
    [AmmoType.TESLA_CHAIN]: {
        spriteKey: SpriteKey.BULLET_TESLA,
        color: '#1053d9ff',
    },
    [AmmoType.MAGMA_POOL]: {
        spriteKey: SpriteKey.BULLET_MAGMA,
        color: '#ff6600ff',
    },
    [AmmoType.SHURIKEN_BOUNCE]: {
        spriteKey: SpriteKey.BULLET_SHURIKEN,
        color: '#ccccccff',
    }
};

// ==================== 敌人子弹配置 ====================

/**
 * 敌人子弹类型列表
 */
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

/**
 * 敌人子弹 SpriteKey 映射
 * 多种子弹类型可共用同一 SpriteKey，通过颜色区分
 */
export const ENEMY_BULLET_SPRITES: Record<EnemyAmmoType, BulletSpriteSpec> = {
    // 球体类子弹 - 共用 orb SpriteKey
    [AmmoType.ENEMY_ORB_RED]: {
        spriteKey: SpriteKey.BULLET_ENEMY_ORB,
        color: '#ff9999ff',
    },
    [AmmoType.ENEMY_ORB_BLUE]: {
        spriteKey: SpriteKey.BULLET_ENEMY_ORB,
        color: '#9999ffff',
    },
    [AmmoType.ENEMY_ORB_GREEN]: {
        spriteKey: SpriteKey.BULLET_ENEMY_ORB,
        color: '#99ff99ff',
    },
    // 光束类子弹 - 共用 beam SpriteKey
    [AmmoType.ENEMY_BEAM_THIN]: {
        spriteKey: SpriteKey.BULLET_ENEMY_BEAM,
        color: '#f97316ff',
    },
    [AmmoType.ENEMY_BEAM_THICK]: {
        spriteKey: SpriteKey.BULLET_ENEMY_BEAM,
        color: '#f97316ff',
    },
    // 其他类型
    [AmmoType.ENEMY_RAPID]: {
        spriteKey: SpriteKey.BULLET_ENEMY_RAPID,
        color: '#ecc94bff',
    },
    [AmmoType.ENEMY_HEAVY]: {
        spriteKey: SpriteKey.BULLET_ENEMY_HEAVY,
        color: '#9f7aeaff',
    },
    [AmmoType.ENEMY_HOMING]: {
        spriteKey: SpriteKey.BULLET_ENEMY_HOMING,
        color: '#48bb78ff',
    },
    [AmmoType.ENEMY_SPIRAL]: {
        spriteKey: SpriteKey.BULLET_ENEMY_SPIRAL,
        color: '#4299e1ff',
    },
    [AmmoType.ENEMY_MISSILE]: {
        spriteKey: SpriteKey.BULLET_ENEMY_MISSILE,
        color: '#ff9999ff',
    },
    [AmmoType.ENEMY_PULSE]: {
        spriteKey: SpriteKey.BULLET_ENEMY_PULSE,
        color: '#ff9999ff',
    },
    [AmmoType.ENEMY_VOID_ORB]: {
        spriteKey: SpriteKey.BULLET_ENEMY_VOID_ORB,
        color: '#ff9999ff',
    },
};

// ==================== 合并配置 ====================

/**
 * 所有子弹外观配置（玩家 + 敌人）
 */
export const BULLET_SPRITE_CONFIG: Record<AmmoType, BulletSpriteSpec> = {
    ...PLAYER_BULLET_SPRITES,
    ...ENEMY_BULLET_SPRITES
};

// ==================== 便捷函数 ====================

/**
 * 根据 AmmoType 获取子弹的 SpriteKey
 */
export function getBulletSpriteKey(ammoType: AmmoType): SpriteKey {
    return BULLET_SPRITE_CONFIG[ammoType]?.spriteKey ?? SpriteKey.BULLET_ENEMY_ORB;
}

/**
 * 根据 AmmoType 获取子弹颜色
 */
export function getBulletColor(ammoType: AmmoType): string {
    return BULLET_SPRITE_CONFIG[ammoType]?.color ?? '#ffffffff';
}
