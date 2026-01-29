/**
 * Sprite Registry - 统一的精灵资源配置
 *
 * 职责：
 * - 定义所有 sprite 的唯一标识符 (SpriteKey 枚举)
 * - 集中管理所有 sprite 的元数据（文件名、尺寸、pivot）
 * - 自动映射到正确的文件路径
 */

import { BASE_ASSET_PATH } from '../global';

// ==================== 类型定义 ====================

/**
 * Sprite 条目配置
 */
export interface SpriteEntry {
  /** 唯一标识符 */
  key: SpriteKey;
  /** 文件名 */
  file: string;
  /** 原始宽度（像素） */
  width: number;
  /** 原始高度（像素） */
  height: number;
  /** X轴轴心位置 (0-1) */
  pivotX?: number;
  /** Y轴轴心位置 (0-1) */
  pivotY?: number;
}

// ==================== SpriteKey 枚举 ====================

/**
 * Sprite 唯一标识符枚举
 * 命名规则：{类型}.{名称}
 */
export enum SpriteKey {
  // Fighters
  PLAYER = 'player',
  OPTION = 'option',

  // Particles (纯颜色绘制)
  PARTICLE = 'particle',

  // Bullets (玩家)
  BULLET_VULCAN = 'bullet.vulcan',
  BULLET_LASER = 'bullet.laser',
  BULLET_MISSILE = 'bullet.missile',
  BULLET_WAVE = 'bullet.wave',
  BULLET_PLASMA = 'bullet.plasma',
  BULLET_TESLA = 'bullet.tesla',
  BULLET_MAGMA = 'bullet.magma',
  BULLET_SHURIKEN = 'bullet.shuriken',

  // Bullets (敌人)
  BULLET_ENEMY_ORB = 'bullet.enemy.orb',
  BULLET_ENEMY_BEAM = 'bullet.enemy.beam',
  BULLET_ENEMY_RAPID = 'bullet.enemy.rapid',
  BULLET_ENEMY_HEAVY = 'bullet.enemy.heavy',
  BULLET_ENEMY_HOMING = 'bullet.enemy.homing',
  BULLET_ENEMY_SPIRAL = 'bullet.enemy.spiral',
  BULLET_ENEMY_MISSILE = 'bullet.enemy.missile',
  BULLET_ENEMY_VOID_ORB = 'bullet.enemy.void_orb',
  BULLET_ENEMY_PULSE = 'bullet.enemy.pulse',

  // Enemies
  ENEMY_NORMAL = 'enemy.normal',
  ENEMY_FAST = 'enemy.fast',
  ENEMY_FORTRESS = 'enemy.fortress',
  ENEMY_GUNBOAT = 'enemy.gunboat',
  ENEMY_INTERCEPTOR = 'enemy.interceptor',
  ENEMY_KAMIKAZE = 'enemy.kamikaze',
  ENEMY_PULSAR = 'enemy.pulsar',
  ENEMY_STALKER = 'enemy.stalker',
  ENEMY_TANK = 'enemy.tank',
  ENEMY_BARRAGE = 'enemy.barrage',
  ENEMY_LAYER = 'enemy.layer',

  // Bosses
  BOSS_GUARDIAN = 'boss.guardian',
  BOSS_INTERCEPTOR = 'boss.interceptor',
  BOSS_DESTROYER = 'boss.destroyer',
  BOSS_DOMINATOR = 'boss.dominator',
  BOSS_OVERLORD = 'boss.overlord',
  BOSS_TITAN = 'boss.titan',
  BOSS_COLOSSUS = 'boss.colossus',
  BOSS_LEVIATHAN = 'boss.leviathan',
  BOSS_ANNIHILATOR = 'boss.annihilator',
  BOSS_APOCALYPSE = 'boss.apocalypse',

  // Powerups
  POWERUP_BOMB = 'powerup.bomb',
  POWERUP_HP = 'powerup.hp',
  POWERUP_INVINCIBILITY = 'powerup.invincibility',
  POWERUP_OPTION = 'powerup.option',
  POWERUP_POWER = 'powerup.power',
  POWERUP_TIME_SLOW = 'powerup.time_slow',
  POWERUP_SHIELD = 'powerup.shield',
}

// ==================== 路径映射 ====================

/**
 * 根据 SpriteKey 构建完整的资源路径
 */
export function buildSpritePath(key: SpriteKey, file: string): string {
  if (!file) {
    return '';
  }
  // 敌人子弹: bullet.enemy.xxx -> bullets/bullet_enemy_xxx.svg
  // 玩家子弹: bullet.xxx -> bullets/xxx.svg
  if (key.startsWith('bullet.')) {
    return `${BASE_ASSET_PATH}bullets/${file}`;
  }

  // 敌人: enemy.xxx -> enemies/enemy_xxx.svg
  if (key.startsWith('enemy.')) {
    return `${BASE_ASSET_PATH}enemies/${file}`;
  }

  // Boss: boss.xxx -> bosses/boss_xxx.svg
  if (key.startsWith('boss.')) {
    return `${BASE_ASSET_PATH}bosses/${file}`;
  }

  // 道具: powerup.xxx -> powerups/powerup_xxx.svg
  if (key.startsWith('powerup.')) {
    return `${BASE_ASSET_PATH}powerups/${file}`;
  }

  // 战斗机: player, option -> fighters/xxx.svg
  return `${BASE_ASSET_PATH}fighters/${file}`;
}

// ==================== Sprite Registry ====================

/**
 * 统一的精灵配置注册表
 * 包含所有 sprite 的元数据
 */
export const SPRITE_REGISTRY: Record<SpriteKey, SpriteEntry> = {
  // ==================== Fighters ====================
  [SpriteKey.PLAYER]: {
    key: SpriteKey.PLAYER,
    file: 'player.svg',
    width: 64,
    height: 64,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.OPTION]: {
    key: SpriteKey.OPTION,
    file: 'option.svg',
    width: 32,
    height: 32,
    pivotX: 0.5,
    pivotY: 0.5,
  },

  // ==================== Particles ====================
  [SpriteKey.PARTICLE]: {
    key: SpriteKey.PARTICLE,
    file: '', // 纯颜色绘制，无文件
    width: 32,
    height: 32,
    pivotX: 0.5,
    pivotY: 0.5,
  },

  // ==================== Bullets (玩家) ====================
  [SpriteKey.BULLET_VULCAN]: {
    key: SpriteKey.BULLET_VULCAN,
    file: 'bullet_vulcan.svg',
    width: 10,
    height: 20,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BULLET_LASER]: {
    key: SpriteKey.BULLET_LASER,
    file: 'bullet_laser.svg',
    width: 8,
    height: 50,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BULLET_MISSILE]: {
    key: SpriteKey.BULLET_MISSILE,
    file: 'bullet_missile.svg',
    width: 16,
    height: 32,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BULLET_WAVE]: {
    key: SpriteKey.BULLET_WAVE,
    file: 'bullet_wave.svg',
    width: 60,
    height: 12,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BULLET_PLASMA]: {
    key: SpriteKey.BULLET_PLASMA,
    file: 'bullet_plasma.svg',
    width: 32,
    height: 32,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BULLET_TESLA]: {
    key: SpriteKey.BULLET_TESLA,
    file: 'bullet_tesla.svg',
    width: 16,
    height: 64,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BULLET_MAGMA]: {
    key: SpriteKey.BULLET_MAGMA,
    file: 'bullet_magma.svg',
    width: 24,
    height: 24,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BULLET_SHURIKEN]: {
    key: SpriteKey.BULLET_SHURIKEN,
    file: 'bullet_shuriken.svg',
    width: 24,
    height: 24,
    pivotX: 0.5,
    pivotY: 0.5,
  },

  // ==================== Bullets (敌人) ====================
  [SpriteKey.BULLET_ENEMY_ORB]: {
    key: SpriteKey.BULLET_ENEMY_ORB,
    file: 'bullet_enemy_orb.svg',
    width: 16,
    height: 16,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BULLET_ENEMY_BEAM]: {
    key: SpriteKey.BULLET_ENEMY_BEAM,
    file: 'bullet_enemy_beam.svg',
    width: 8,
    height: 40,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BULLET_ENEMY_RAPID]: {
    key: SpriteKey.BULLET_ENEMY_RAPID,
    file: 'bullet_enemy_rapid.svg',
    width: 8,
    height: 16,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BULLET_ENEMY_HEAVY]: {
    key: SpriteKey.BULLET_ENEMY_HEAVY,
    file: 'bullet_enemy_heavy.svg',
    width: 32,
    height: 32,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BULLET_ENEMY_HOMING]: {
    key: SpriteKey.BULLET_ENEMY_HOMING,
    file: 'bullet_enemy_homing.svg',
    width: 20,
    height: 20,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BULLET_ENEMY_SPIRAL]: {
    key: SpriteKey.BULLET_ENEMY_SPIRAL,
    file: 'bullet_enemy_spiral.svg',
    width: 16,
    height: 16,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BULLET_ENEMY_MISSILE]: {
    key: SpriteKey.BULLET_ENEMY_MISSILE,
    file: 'bullet_enemy_missile.svg',
    width: 20,
    height: 30,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BULLET_ENEMY_VOID_ORB]: {
    key: SpriteKey.BULLET_ENEMY_VOID_ORB,
    file: 'bullet_enemy_void_orb.svg',
    width: 40,
    height: 40,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BULLET_ENEMY_PULSE]: {
    key: SpriteKey.BULLET_ENEMY_PULSE,
    file: 'bullet_enemy_pulse.svg',
    width: 12,
    height: 12,
    pivotX: 0.5,
    pivotY: 0.5,
  },

  // ==================== Enemies ====================
  [SpriteKey.ENEMY_NORMAL]: {
    key: SpriteKey.ENEMY_NORMAL,
    file: 'enemy_normal.svg',
    width: 48,
    height: 48,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.ENEMY_FAST]: {
    key: SpriteKey.ENEMY_FAST,
    file: 'enemy_fast.svg',
    width: 48,
    height: 48,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.ENEMY_FORTRESS]: {
    key: SpriteKey.ENEMY_FORTRESS,
    file: 'enemy_fortress.svg',
    width: 80,
    height: 80,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.ENEMY_GUNBOAT]: {
    key: SpriteKey.ENEMY_GUNBOAT,
    file: 'enemy_gunboat.svg',
    width: 48,
    height: 48,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.ENEMY_INTERCEPTOR]: {
    key: SpriteKey.ENEMY_INTERCEPTOR,
    file: 'enemy_interceptor.svg',
    width: 48,
    height: 48,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.ENEMY_KAMIKAZE]: {
    key: SpriteKey.ENEMY_KAMIKAZE,
    file: 'enemy_kamikaze.svg',
    width: 48,
    height: 48,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.ENEMY_PULSAR]: {
    key: SpriteKey.ENEMY_PULSAR,
    file: 'enemy_pulsar.svg',
    width: 64,
    height: 64,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.ENEMY_STALKER]: {
    key: SpriteKey.ENEMY_STALKER,
    file: 'enemy_stalker.svg',
    width: 64,
    height: 64,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.ENEMY_TANK]: {
    key: SpriteKey.ENEMY_TANK,
    file: 'enemy_tank.svg',
    width: 80,
    height: 80,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.ENEMY_BARRAGE]: {
    key: SpriteKey.ENEMY_BARRAGE,
    file: 'enemy_barrage.svg',
    width: 70,
    height: 70,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.ENEMY_LAYER]: {
    key: SpriteKey.ENEMY_LAYER,
    file: 'enemy_layer.svg',
    width: 80,
    height: 80,
    pivotX: 0.5,
    pivotY: 0.5,
  },

  // ==================== Bosses ====================
  [SpriteKey.BOSS_GUARDIAN]: {
    key: SpriteKey.BOSS_GUARDIAN,
    file: 'boss_guardian.svg',
    width: 128,
    height: 128,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BOSS_INTERCEPTOR]: {
    key: SpriteKey.BOSS_INTERCEPTOR,
    file: 'boss_interceptor.svg',
    width: 128,
    height: 128,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BOSS_DESTROYER]: {
    key: SpriteKey.BOSS_DESTROYER,
    file: 'boss_destroyer.svg',
    width: 128,
    height: 128,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BOSS_DOMINATOR]: {
    key: SpriteKey.BOSS_DOMINATOR,
    file: 'boss_dominator.svg',
    width: 128,
    height: 128,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BOSS_OVERLORD]: {
    key: SpriteKey.BOSS_OVERLORD,
    file: 'boss_overlord.svg',
    width: 128,
    height: 128,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BOSS_TITAN]: {
    key: SpriteKey.BOSS_TITAN,
    file: 'boss_titan.svg',
    width: 128,
    height: 128,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BOSS_COLOSSUS]: {
    key: SpriteKey.BOSS_COLOSSUS,
    file: 'boss_colossus.svg',
    width: 128,
    height: 128,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BOSS_LEVIATHAN]: {
    key: SpriteKey.BOSS_LEVIATHAN,
    file: 'boss_leviathan.svg',
    width: 128,
    height: 128,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BOSS_ANNIHILATOR]: {
    key: SpriteKey.BOSS_ANNIHILATOR,
    file: 'boss_annihilator.svg',
    width: 128,
    height: 128,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.BOSS_APOCALYPSE]: {
    key: SpriteKey.BOSS_APOCALYPSE,
    file: 'boss_apocalypse.svg',
    width: 128,
    height: 128,
    pivotX: 0.5,
    pivotY: 0.5,
  },

  // ==================== Powerups ====================
  [SpriteKey.POWERUP_BOMB]: {
    key: SpriteKey.POWERUP_BOMB,
    file: 'powerup_bomb.svg',
    width: 40,
    height: 40,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.POWERUP_HP]: {
    key: SpriteKey.POWERUP_HP,
    file: 'powerup_hp.svg',
    width: 40,
    height: 40,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.POWERUP_INVINCIBILITY]: {
    key: SpriteKey.POWERUP_INVINCIBILITY,
    file: 'powerup_invincibility.svg',
    width: 40,
    height: 40,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.POWERUP_OPTION]: {
    key: SpriteKey.POWERUP_OPTION,
    file: 'powerup_option.svg',
    width: 40,
    height: 40,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.POWERUP_POWER]: {
    key: SpriteKey.POWERUP_POWER,
    file: 'powerup_power.svg',
    width: 40,
    height: 40,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.POWERUP_TIME_SLOW]: {
    key: SpriteKey.POWERUP_TIME_SLOW,
    file: 'powerup_time_slow.svg',
    width: 40,
    height: 40,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  [SpriteKey.POWERUP_SHIELD]: {
    key: SpriteKey.POWERUP_SHIELD,
    file: 'powerup_shield.svg',
    width: 40,
    height: 40,
    pivotX: 0.5,
    pivotY: 0.5,
  },
};

// ==================== 便捷函数 ====================

/**
 * 获取 sprite 配置
 */
export function getSpriteConfig(key: SpriteKey): SpriteEntry {
  return SPRITE_REGISTRY[key];
}

/**
 * 获取 sprite 完整路径
 */
export function getSpritePath(key: SpriteKey): string {
  const entry = SPRITE_REGISTRY[key];
  return buildSpritePath(key, entry.file);
}


