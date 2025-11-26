
export enum GameState {
  MENU,
  PLAYING,
  PAUSED,
  GAME_OVER,
  VICTORY,
  GALLERY
}

export enum WeaponType {
  VULCAN, // 散弹
  LASER,  // 激光
  MISSILE, // 跟踪导弹
  WAVE,   // 波动炮 (穿透)
  PLASMA,  // 等离子 (范围爆炸)
  TESLA,   // 电磁 (连锁)
  MAGMA,   // 熔岩 (持续伤害)
  SHURIKEN // 手里剑 (弹射)
}

export enum BulletType {
  VULCAN = 'vulcan',        // 散弹
  LASER = 'laser',          // 激光
  MISSILE = 'missile',      // 导弹
  WAVE = 'wave',            // 波动炮
  PLASMA = 'plasma',        // 等离子炮
  TESLA = 'tesla',          // 电磁炮
  MAGMA = 'magma',          // 熔岩弹
  SHURIKEN = 'shuriken',    // 手里剑
  ENEMY_ORB = 'enemy_orb',  // 敌人普通弹
  ENEMY_BEAM = 'enemy_beam' // 敌人光束
}

// 敌人子弹类型枚举 - 独立管理，方便扩展
export enum EnemyBulletType {
  ORB = 'enemy_orb',      // 普通能量球
  BEAM = 'enemy_beam'     // 光束弹
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type?: 'spark' | 'smoke' | 'star';
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number; // 0 to 1
  width?: number;
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  type: 'player' | 'enemy' | 'boss' | 'bullet' | 'powerup' | 'option';
  subType?: number;
  color: string;
  markedForDeletion: boolean;
  angle?: number;
  spriteKey?: string;
  frame?: number;
  damage?: number;
  owner?: Entity; // For options
  angleOffset?: number; // For options
  isElite?: boolean;
  state?: number; // For AI state
  timer?: number; // For AI timer
}

export type SpriteMap = { [key: string]: HTMLCanvasElement | HTMLImageElement };
