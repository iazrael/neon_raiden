import { World } from './types/world';
import { EntityType } from '@/types';

export interface GameSnapshot {
  player?: EntitySnapshot;
  enemies: EntitySnapshot[];
  bullets: EntitySnapshot[];
  powerups: EntitySnapshot[];
  boss?: EntitySnapshot;
  particles: Particle[];
  score: number;
  level: number;
  combo: number;
  time: number;
}

export interface EntitySnapshot {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  spriteKey?: string;
  angle?: number;
  hp?: number;
  maxHp?: number;
  shield?: number;
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

export function buildSnapshot(world: World): GameSnapshot {
  return {
    player: world.player ? buildEntitySnapshot(world, world.player) : undefined,
    enemies: Array.from(world.entities.keys())
      .filter(id => world.entities.get(id)?.type === EntityType.ENEMY && !world.entities.get(id)?.markedForDeletion)
      .map(id => buildEntitySnapshot(world, id)),
    bullets: Array.from(world.entities.keys())
      .filter(id => world.entities.get(id)?.type === EntityType.BULLET && !world.entities.get(id)?.markedForDeletion)
      .map(id => buildEntitySnapshot(world, id)),
    powerups: Array.from(world.entities.keys())
      .filter(id => world.entities.get(id)?.type === EntityType.POWERUP && !world.entities.get(id)?.markedForDeletion)
      .map(id => buildEntitySnapshot(world, id)),
    boss: world.boss ? buildEntitySnapshot(world, world.boss) : undefined,
    particles: [],
    score: 0,
    level: 1,
    combo: 0,
    time: world.time
  };
}

function buildEntitySnapshot(world: World, entityId: string): EntitySnapshot {
  const entity = world.entities.get(entityId)!;
  const position = world.components.positions.get(entityId);
  const render = world.components.renders.get(entityId);
  const combat = world.components.combats.get(entityId);

  return {
    id: entity.id,
    type: entity.type,
    x: position?.x || 0,
    y: position?.y || 0,
    width: render?.width || 0,
    height: render?.height || 0,
    color: render?.color || '#fff',
    spriteKey: render?.spriteKey,
    angle: position?.angle,
    hp: combat?.hp,
    maxHp: combat?.maxHp,
    shield: combat?.shield
  };
}


