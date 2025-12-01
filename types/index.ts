import { WeaponType } from './sprite';

export enum GameState {
  MENU,
  PLAYING,
  PAUSED,
  GAME_OVER,
  VICTORY,
  GALLERY
}

export enum ClickType {
  DEFAULT = 'default',
  CONFIRM = 'confirm',
  CANCEL = 'cancel',
  MENU = 'menu'
}

export enum ExplosionSize {
  SMALL = 'small',
  LARGE = 'large'
}

// Re-export all types from sprite.ts
export * from './sprite';


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

export enum EntityType {
  PLAYER = 'player',
  ENEMY = 'enemy',
  BOSS = 'boss',
  BULLET = 'bullet',
  POWERUP = 'powerup',
  OPTION = 'option'
}

export interface Entity {
  id?: string;
  name?: string;
  chineseName?: string;
  describe?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  type: EntityType;
  subType?: string | number;
  color: string;
  markedForDeletion: boolean;
  angle?: number;
  rotationSpeed?: number; // Rotation speed in radians per frame for self-rotating bullets
  spriteKey?: string;
  frame?: number;
  damage?: number;
  owner?: Entity; // For options
  angleOffset?: number; // For options
  isElite?: boolean;
  state?: number; // For AI state
  timer?: number; // For AI timer
  chainCount?: number; // For Tesla chain lightning
  chainRange?: number; // For Tesla chain lightning
  weaponType?: WeaponType; // Track which weapon fired this bullet (player weapons only)
  isHoming?: boolean; // For homing missiles that track the player
  invulnerable?: boolean; // Invulnerability status
  invulnerableTimer?: number; // Invulnerability duration in milliseconds
  tags?: Record<string, number>;
  slowed?: boolean;
  // Boss special mechanics fields
  originalBulletCount?: number; // Boss armor break: store original bullet count
  currentBulletCount?: number; // Boss armor break: effective bullet count based on armor phase
  teleportTimer?: number; // P3: Boss random teleport timer
  phaseGlowColor?: string; // Boss phase transition glow color
  phaseGlowUntil?: number; // Boss phase transition glow expiration timestamp
  hitFlashUntil?: number;
  playerLevel?: number;
  defensePct?: number;
  target?: Entity; // For homing missiles
  searchRange?: number;
  turnSpeed?: number; // Override rotationSpeed for steering logic
  lifetime?: number; // Time in milliseconds before entity expires
  incomingMissiles?: number; // Track number of missiles targeting this entity
}

export enum CombatEventType {
  HIT = 'hit',
  EXPLODE = 'explode',
  BOUNCE = 'bounce',
  KILL = 'kill'
}

export enum SynergyEffectType {
  CHAIN_LIGHTNING = 'chain_lightning',
  DAMAGE_BOOST = 'damage_boost',
  BURN = 'burn',
  SHIELD_REGEN = 'shield_regen',
  INVULNERABLE = 'invulnerable',
  SLOW_FIELD = 'slow_field',
  SPEED_BOOST = 'speed_boost'
}

export type SpriteMap = { [key: string]: HTMLCanvasElement | HTMLImageElement };
