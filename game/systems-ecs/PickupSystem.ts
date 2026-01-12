import { World } from '../types/world';
import { EntityType } from '@/types';

export function PickupSystem(world: World, dt: number): void {
  const collisions = world.events.filter(e => e.type === 'collision');

  for (const event of collisions as any[]) {
    const entity1 = world.entities.get(event.entityId);
    const entity2 = world.entities.get(event.otherId);

    if (!entity1 || !entity2) continue;

    const playerCollision = entity1.type === EntityType.PLAYER || entity2.type === EntityType.PLAYER;
    const powerupCollision = entity1.type === EntityType.POWERUP || entity2.type === EntityType.POWERUP;

    if (playerCollision && powerupCollision) {
      const powerupId = entity1.type === EntityType.POWERUP ? event.entityId : event.otherId;
      const playerId = entity1.type === EntityType.PLAYER ? event.entityId : event.otherId;

      world.events.push({
        type: 'pickup',
        entityId: powerupId,
        powerupType: 'weapon',
        collectorId: playerId
      });

      world.entities.get(powerupId)!.markedForDeletion = true;
    }
  }
}

export function DamageResolutionSystem(world: World, dt: number): void {
  const collisions = world.events.filter(e => e.type === 'collision');

  for (const event of collisions as any[]) {
    const entity1 = world.entities.get(event.entityId);
    const entity2 = world.entities.get(event.otherId);

    if (!entity1 || !entity2) continue;

    if (entity1.markedForDeletion || entity2.markedForDeletion) continue;

    const combat1 = world.components.combats.get(event.entityId);
    const combat2 = world.components.combats.get(event.otherId);

    if (combat1 && combat2) {
      const damage1 = combat1.damage || 1;
      const damage2 = combat2.damage || 1;

      world.events.push({
        type: 'damage',
        entityId: event.entityId,
        amount: damage2,
        source: event.otherId
      });

      world.events.push({
        type: 'damage',
        entityId: event.otherId,
        amount: damage1,
        source: event.entityId
      });
    }
  }
}

export function LootSystem(world: World, dt: number): void {
  const deaths = world.events.filter(e => e.type === 'death');

  for (const event of deaths as any[]) {
    const entity = world.entities.get(event.entityId);
    if (!entity) continue;

    if (entity.type === EntityType.ENEMY) {
      const position = world.components.positions.get(event.entityId);
      if (position) {
        if (Math.random() < 0.1) {
          createPowerup(world, position.x, position.y);
        }
      }
    }
  }
}

function createPowerup(world: World, x: number, y: number): void {
  const powerupId = world.entities.get('player') ? world.entities.get('player')!.id : 'p1';
  const id = powerupId + '_powerup_' + Math.random();

  world.entities.set(id, {
    id,
    type: EntityType.POWERUP,
    markedForDeletion: false
  });

  world.components.positions.set(id, { x, y });
  world.components.velocities.set(id, { vx: 0, vy: 2, speed: 2 });
  world.components.renders.set(id, {
    spriteKey: 'powerup',
    width: 20,
    height: 20,
    color: '#00ff00'
  });
  world.components.colliders.set(id, {
    width: 20,
    height: 20,
    collisionType: 'powerup' as any
  });
  world.components.lifetimes.set(id, {
    lifetime: 10000,
    createdAt: world.time
  });
}
