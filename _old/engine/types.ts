export type EntityId = number;

export interface Transform {
  x: number;
  y: number;
  rot: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface Health {
  hp: number;
  max: number;
}

export interface Weapon {
  damage: number;
  cooldown: number; // ms
  curCD: number;    // ms
}

export interface Bullet {
  owner: EntityId;  // 谁射的
  speed: number;
}

export interface Sprite {
  texture: string;
}

export interface Shield {
  value: number;
  regen: number;    // 每秒回复量
}

export interface World {
  entities: Map<EntityId, Component[]>;
  playerId: EntityId;
}

export type Component = Transform | Velocity | Health | Weapon | Bullet | Sprite | Shield;

// Component type discriminators for the view function
export const ComponentTypes = {
  Transform: 'Transform',
  Velocity: 'Velocity', 
  Health: 'Health',
  Weapon: 'Weapon',
  Bullet: 'Bullet',
  Sprite: 'Sprite',
  Shield: 'Shield'
} as const;

export type ComponentType = typeof ComponentTypes[keyof typeof ComponentTypes];

export interface GameSnapshot {
  t: number;
  player: {
    hp: number;
    maxHp: number;
    ammo: number;
    maxAmmo: number;
    shield: number;
    x: number;
    y: number;
  };
  bullets: Array<{ x: number; y: number }>;
  enemies: Array<{ x: number; y: number; hp: number }>;
}