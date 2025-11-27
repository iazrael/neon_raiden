export enum GameState {
  MENU,
  PLAYING,
  PAUSED,
  GAME_OVER,
  VICTORY,
  GALLERY
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
