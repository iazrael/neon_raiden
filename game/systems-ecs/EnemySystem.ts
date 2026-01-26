import { World, CollisionType, MovePattern } from '../types/world';
import { EntityType, EnemyType } from '@/types';
import { createEntity } from '../types/world';
import { EnemyConfig } from '../config/enemies/entities';

export function EnemySystem(world: World, dt: number): void {
  const enemies = Array.from(world.entities.entries())
    .filter(([_, entity]) => entity.type === EntityType.ENEMY && !entity.markedForDeletion);

  for (const [id, entity] of enemies) {
    const ai = world.components.ais.get(id);
    const velocity = world.components.velocities.get(id);

    if (!ai || !velocity) continue;

    ai.timer -= dt;

    if (ai.timer <= 0) {
      updateAIDecision(world, id, ai);
      ai.timer = 500;
    }
  }
}

function updateAIDecision(world: World, id: string, ai: { state: number, timer: number, movePattern: MovePattern }): void {
  const position = world.components.positions.get(id);
  const velocity = world.components.velocities.get(id);

  if (!position || !velocity) return;

  switch (ai.movePattern) {
    case MovePattern.STRAIGHT:
      velocity.vy = 3;
      velocity.vx = 0;
      break;

    case MovePattern.SINE:
      ai.state = (ai.state + 0.1) % (Math.PI * 2);
      velocity.vy = 2;
      velocity.vx = Math.sin(ai.state) * 2;
      break;

    case MovePattern.CIRCLE:
      ai.state = (ai.state + 0.1) % (Math.PI * 2);
      velocity.vx = Math.cos(ai.state) * 3;
      velocity.vy = Math.sin(ai.state) * 3;
      break;

    case MovePattern.FIGURE_8:
      ai.state = (ai.state + 0.05) % (Math.PI * 2);
      velocity.vx = Math.sin(ai.state) * 4;
      velocity.vy = Math.sin(ai.state * 2) * 2;
      break;
  }
}

export function SpawnSystem(world: World, dt: number): void {
  const spawnTimer = world.time % 2000;

  if (spawnTimer < dt) {
    const x = Math.random() * (world.width - 60) + 30;
    spawnEnemy(world, x, -50, EnemyType.NORMAL);
  }
}

function spawnEnemy(world: World, x: number, y: number, enemyType: EnemyType): void {
  const enemyId = createEntity(world, EntityType.ENEMY);

  const config = EnemyConfig[enemyType];

  world.components.positions.set(enemyId, { x, y });
  world.components.velocities.set(enemyId, {
    vx: (Math.random() - 0.5) * 2,
    vy: config.baseSpeed,
    speed: config.baseSpeed
  });
  world.components.renders.set(enemyId, {
    spriteKey: `enemy_${enemyType}`,
    width: config.size.width,
    height: config.size.height,
    color: '#ff0000'
  });
  world.components.colliders.set(enemyId, {
    width: config.size.width,
    height: config.size.height,
    collisionType: CollisionType.ENEMY
  });
  const isEliteVar = true;
  world.components.combats.set(enemyId, {
    hp: config.baseHp * (isEliteVar ? 2 : 1),
    maxHp: config.baseHp * (isEliteVar ? 2 : 1),
    damage: config.weapon.damage || 10
  });
  world.components.ais.set(enemyId, {
    state: 0,
    timer: 0,
    movePattern: MovePattern.STRAIGHT
  });
}
