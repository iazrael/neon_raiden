import { EntityType } from '@/types';

export interface World {
  width: number;
  height: number;
  time: number;

  entities: Map<string, Entity>;
  components: Components;

  events: GameEvent[];

  player?: string;
  boss?: string;
}

export interface Entity {
  id: string;
  type: EntityType;
  markedForDeletion: boolean;
}

export interface Components {
  positions: Map<string, PositionComponent>;
  velocities: Map<string, VelocityComponent>;
  renders: Map<string, RenderComponent>;
  colliders: Map<string, ColliderComponent>;
  combats: Map<string, CombatComponent>;
  weapons: Map<string, WeaponComponent>;
  inputs: Map<string, InputComponent>;
  ais: Map<string, AIComponent>;
  bosses: Map<string, BossComponent>;
  buffs: Map<string, BuffComponent>;
  lifetimes: Map<string, LifetimeComponent>;
  cameras: Map<string, CameraComponent>;
}

export interface PositionComponent {
  x: number;
  y: number;
  angle?: number;
}

export interface VelocityComponent {
  vx: number;
  vy: number;
  speed?: number;
}

export interface RenderComponent {
  spriteKey: string;
  width: number;
  height: number;
  color: string;
  frame?: number;
  hitFlashUntil?: number;
  phaseGlowColor?: string;
  phaseGlowUntil?: number;
}

export interface ColliderComponent {
  width: number;
  height: number;
  hitboxShrink?: number;
  collisionType: CollisionType;
  isElite?: boolean;
  invulnerable?: boolean;
  invulnerableTimer?: number;
  slowed?: boolean;
}

export interface CombatComponent {
  hp: number;
  maxHp: number;
  damage?: number;
  shield?: number;
  defensePct?: number;
  tags?: Record<string, number>;
}

export interface WeaponComponent {
  weaponType: string;
  level: number;
  fireTimer: number;
  owner?: string;
}

export interface InputComponent {
  keys: { [key: string]: boolean };
  touch: { x: number, y: number, active: boolean };
  touchDelta: { x: number, y: number };
}

export interface AIComponent {
  state: number;
  timer: number;
  movePattern: MovePattern;
  target?: string;
  searchRange?: number;
  turnSpeed?: number;
}

export interface BossComponent {
  bossType: string;
  phase: number;
  phaseTimer: number;
  wingmen: string[];
  teleportTimer?: number;
  originalBulletCount?: number;
  currentBulletCount?: number;
}

export interface BuffComponent {
  buffs: Buff[];
}

export interface LifetimeComponent {
  lifetime: number;
  createdAt: number;
}

export interface CameraComponent {
  x: number;
  y: number;
  shake: number;
  shakeDecay: number;
}

export enum CollisionType {
  PLAYER = 'player',
  ENEMY = 'enemy',
  BULLET = 'bullet',
  POWERUP = 'powerup',
  ENEMY_BULLET = 'enemy_bullet'
}

export enum MovePattern {
  STRAIGHT = 'straight',
  SINE = 'sine',
  CIRCLE = 'circle',
  FIGURE_8 = 'figure8',
  TRACKING = 'tracking',
  AGGRESSIVE = 'aggressive',
  ZIGZAG = 'zigzag',
  RANDOM_TELEPORT = 'random_teleport',
  SLOW_DESCENT = 'slow_descent',
  ADAPTIVE = 'adaptive'
}

export interface Buff {
  type: BuffType;
  value: number;
  endTime: number;
}

export enum BuffType {
  DAMAGE_BOOST = 'damage_boost',
  DEFENSE_BOOST = 'defense_boost',
  SPEED_BOOST = 'speed_boost',
  FIRE_RATE_BOOST = 'fire_rate_boost',
  INVINCIBILITY = 'invincibility',
  SHIELD_BOOST = 'shield_boost'
}

export type GameEvent =
  | { type: 'collision', entityId: string, otherId: string }
  | { type: 'damage', entityId: string, amount: number, source?: string }
  | { type: 'death', entityId: string, killer?: string }
  | { type: 'pickup', entityId: string, powerupType: string, collectorId: string }
  | { type: 'boss_phase_change', entityId: string, newPhase: number }
  | { type: 'weapon_fired', entityId: string, bulletIds: string[], weaponType: string }
  | { type: 'enemy_spawn', entityId: string, enemyType: string }
  | { type: 'player_level_up', entityId: string, newLevel: number }
  | { type: 'combo', count: number, bonus: number }
  | { type: 'audio', sound: string, volume?: number };

let entityCounter = 0;

export function generateEntityId(): string {
  return `entity_${++entityCounter}`;
}

export function createWorld(): World {
  return {
    width: 0,
    height: 0,
    time: 0,

    entities: new Map(),
    components: {
      positions: new Map(),
      velocities: new Map(),
      renders: new Map(),
      colliders: new Map(),
      combats: new Map(),
      weapons: new Map(),
      inputs: new Map(),
      ais: new Map(),
      bosses: new Map(),
      buffs: new Map(),
      lifetimes: new Map(),
      cameras: new Map()
    },
    events: [],

    player: undefined,
    boss: undefined
  };
}

export function createEntity(world: World, type: EntityType): string {
  const id = generateEntityId();
  const entity: Entity = {
    id,
    type,
    markedForDeletion: false
  };
  world.entities.set(id, entity);
  return id;
}

export function markEntityForDeletion(world: World, entityId: string): void {
  const entity = world.entities.get(entityId);
  if (entity) {
    entity.markedForDeletion = true;
  }
}

export function deleteEntity(world: World, entityId: string): void {
  world.entities.delete(entityId);

  const { components } = world;
  Object.values(components).forEach(componentMap => {
    componentMap.delete(entityId);
  });

  if (world.player === entityId) {
    world.player = undefined;
  }
  if (world.boss === entityId) {
    world.boss = undefined;
  }
}

export function emitEvent(world: World, event: GameEvent): void {
  world.events.push(event);
}

export function processEvents(world: World): void {
  const events = world.events;
  world.events = [];

  for (const event of events) {
    if (event.type === 'collision') {
      handleCollision(world, event);
    } else if (event.type === 'damage') {
      handleDamage(world, event);
    } else if (event.type === 'death') {
      handleDeath(world, event);
    }
  }
}

function handleCollision(world: World, event: Extract<GameEvent, { type: 'collision' }>): void {
  const entity = world.entities.get(event.entityId);
  if (!entity || entity.markedForDeletion) return;

  const other = world.entities.get(event.otherId);
  if (!other || other.markedForDeletion) return;

  emitEvent(world, {
    type: 'damage',
    entityId: event.entityId,
    amount: 1,
    source: event.otherId
  });
}

function handleDamage(world: World, event: Extract<GameEvent, { type: 'damage' }>): void {
  const combat = world.components.combats.get(event.entityId);
  if (!combat) return;

  const finalDamage = calculateDamage(combat, event.amount);
  combat.hp -= finalDamage;

  if (combat.hp <= 0) {
    emitEvent(world, {
      type: 'death',
      entityId: event.entityId,
      killer: event.source
    });
  }
}

function handleDeath(world: World, event: Extract<GameEvent, { type: 'death' }>): void {
  markEntityForDeletion(world, event.entityId);

  const render = world.components.renders.get(event.entityId);
  if (render) {
    emitEvent(world, {
      type: 'audio',
      sound: 'explosion'
    });
  }
}

function calculateDamage(combat: CombatComponent, amount: number): number {
  const defense = combat.defensePct || 0;
  return amount * (1 - defense / 100);
}
