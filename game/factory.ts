import { World, CollisionType, MovePattern } from './types/world';
import { EntityType, EnemyType, BossType } from '@/types';
import { WeaponType } from '@/types/sprite';
import { PlayerConfig } from './config/player';
import { EnemyConfig } from './config/enemies/entities';
import { createEntity } from './types/world';

export function spawnPlayer(world: World, x: number, y: number): string {
  const id = createEntity(world, EntityType.PLAYER);

  const { components } = world;

  components.positions.set(id, { x, y, angle: 0 });
  components.velocities.set(id, { vx: 0, vy: 0, speed: PlayerConfig.speed || 7 });
  components.renders.set(id, {
    spriteKey: 'player',
    width: PlayerConfig.size.width,
    height: PlayerConfig.size.height,
    color: PlayerConfig.color
  });
  components.colliders.set(id, {
    width: PlayerConfig.size.width,
    height: PlayerConfig.size.height,
    collisionType: CollisionType.PLAYER,
    hitboxShrink: PlayerConfig.hitboxShrink
  });
  components.combats.set(id, {
    hp: PlayerConfig.initialHp || 120,
    maxHp: PlayerConfig.maxHp || 140,
    shield: 0
  });
  components.weapons.set(id, {
    weaponType: WeaponType.VULCAN,
    level: 1,
    fireTimer: 0
  });
  components.inputs.set(id, {
    keys: {},
    touch: { x: 0, y: 0, active: false },
    touchDelta: { x: 0, y: 0 }
  });

  world.player = id;

  return id;
}

export function spawnEnemy(
  world: World,
  x: number,
  y: number,
  enemyType: EnemyType,
  isElite = false
): string {
  const id = createEntity(world, EntityType.ENEMY);
  const config = EnemyConfig[enemyType];

  world.components.positions.set(id, { x, y });
  world.components.velocities.set(id, {
    vx: (Math.random() - 0.5) * 2,
    vy: config.baseSpeed,
    speed: config.baseSpeed
  });
  world.components.renders.set(id, {
    spriteKey: `enemy_${enemyType}`,
    width: isElite ? config.size.width * 1.3 : config.size.width,
    height: isElite ? config.size.height * 1.3 : config.size.height,
    color: isElite ? '#ff00ff' : '#ff0000'
  });
  world.components.colliders.set(id, {
    width: config.size.width,
    height: config.size.height,
    collisionType: CollisionType.ENEMY
  });
  world.components.combats.set(id, {
    hp: config.baseHp * (isElite ? 2 : 1),
    maxHp: config.baseHp * (isElite ? 2 : 1),
    damage: config.weapon.damage || 10
  });
  world.components.ais.set(id, {
    state: 0,
    timer: 0,
    movePattern: MovePattern.STRAIGHT,
    target: undefined,
    searchRange: 300,
    turnSpeed: 0.1
  });

  return id;
}

export function spawnBoss(world: World, x: number, y: number, bossType: BossType): string {
  const id = createEntity(world, EntityType.BOSS);
  world.boss = id;

  world.components.positions.set(id, { x, y });
  world.components.velocities.set(id, { vx: 0, vy: 1, speed: 2 });
  world.components.renders.set(id, {
    spriteKey: `boss_${bossType}`,
    width: 120,
    height: 120,
    color: '#ff8800'
  });
  world.components.colliders.set(id, {
    width: 120,
    height: 120,
    collisionType: CollisionType.ENEMY
  });
  world.components.combats.set(id, {
    hp: 5000,
    maxHp: 5000,
    damage: 50
  });
  world.components.ais.set(id, {
    state: 0,
    timer: 0,
    movePattern: MovePattern.SINE,
    target: undefined
  });
  world.components.bosses.set(id, {
    bossType: bossType as string,
    phase: 0,
    phaseTimer: 10000,
    wingmen: []
  });

  return id;
}

export function spawnBullet(
  world: World,
  x: number,
  y: number,
  vx: number,
  vy: number,
  damage: number,
  weaponType: WeaponType,
  ownerId: string
): string {
  const id = createEntity(world, EntityType.BULLET);

  world.components.positions.set(id, { x, y });
  world.components.velocities.set(id, { vx, vy, speed: Math.sqrt(vx * vx + vy * vy) });
  world.components.renders.set(id, {
    spriteKey: `bullet_${weaponType}`,
    width: 8,
    height: 16,
    color: '#ffff00'
  });
  world.components.colliders.set(id, {
    width: 8,
    height: 16,
    collisionType: CollisionType.BULLET
  });
  world.components.combats.set(id, {
    hp: 1,
    maxHp: 1,
    damage
  });
  world.components.weapons.set(id, {
    weaponType: weaponType as string,
    level: 1,
    fireTimer: 0,
    owner: ownerId
  });
  world.components.lifetimes.set(id, {
    lifetime: 3000,
    createdAt: world.time
  });

  return id;
}

export function spawnPowerup(
  world: World,
  x: number,
  y: number,
  powerupType: string
): string {
  const id = createEntity(world, EntityType.POWERUP);

  world.components.positions.set(id, { x, y });
  world.components.velocities.set(id, { vx: 0, vy: 2, speed: 2 });
  world.components.renders.set(id, {
    spriteKey: `powerup_${powerupType}`,
    width: 20,
    height: 20,
    color: '#00ff00'
  });
  world.components.colliders.set(id, {
    width: 20,
    height: 20,
    collisionType: CollisionType.POWERUP
  });
  world.components.lifetimes.set(id, {
    lifetime: 10000,
    createdAt: world.time
  });

  return id;
}

export function spawnParticle(
  world: World,
  x: number,
  y: number,
  color: string,
  count = 10
): void {
  for (let i = 0; i < count; i++) {
    const id = createEntity(world, 'particle' as EntityType);

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;

    world.components.positions.set(id, { x, y, angle });
    world.components.velocities.set(id, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed
    });
    world.components.renders.set(id, {
      spriteKey: 'particle',
      width: 4,
      height: 4,
      color
    });
    world.components.lifetimes.set(id, {
      lifetime: 1000,
      createdAt: world.time
    });
  }
}
