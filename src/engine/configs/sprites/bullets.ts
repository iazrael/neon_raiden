import { AmmoType } from '../../types';
import { SpriteSpec } from '../types';
import { ASSETS } from '../global';

// 玩家武器子弹精灵配置
export const PLAYER_BULLET_SPRITES: Record<AmmoType, SpriteSpec> = {
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

// 敌人子弹精灵配置
export const ENEMY_BULLET_SPRITES: Record<string, SpriteSpec> = {
  'enemy_orb': {
    texture: ASSETS.ENEMIE_BULLETS.orb,
    color: '#ff9999',
    size: { width: 14, height: 14 },
  },
  'enemy_beam': {
    texture: ASSETS.ENEMIE_BULLETS.beam,
    color: '#f97316ff',
    size: { width: 12, height: 32 },
  },
  'enemy_rapid': {
    texture: ASSETS.ENEMIE_BULLETS.rapid,
    color: '#ecc94b',
    size: { width: 10, height: 20 },
  },
  'enemy_heavy': {
    texture: ASSETS.ENEMIE_BULLETS.heavy,
    color: '#9f7aea',
    size: { width: 28, height: 28 },
  },
  'enemy_homing': {
    texture: ASSETS.ENEMIE_BULLETS.homing,
    color: '#48bb78',
    size: { width: 16, height: 16 },
  },
  'enemy_spiral': {
    texture: ASSETS.ENEMIE_BULLETS.spiral,
    color: '#4299e1',
    size: { width: 14, height: 14 },
  }
};

// 合并所有子弹精灵配置
export const BULLET_SPRITES: Record<string, SpriteSpec> = {
  ...PLAYER_BULLET_SPRITES,
  ...ENEMY_BULLET_SPRITES
};