
export enum GameState {
  MENU,
  PLAYING,
  PAUSED,
  GAME_OVER,
  VICTORY
}

export enum WeaponType {
  VULCAN, // 散弹
  LASER,  // 激光
  MISSILE, // 跟踪导弹
  WAVE,   // 波动炮 (穿透)
  PLASMA  // 等离子 (范围爆炸)
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

export type SpriteMap = { [key: string]: HTMLCanvasElement | HTMLImageElement };
