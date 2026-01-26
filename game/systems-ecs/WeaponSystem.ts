import { World, CollisionType } from '../types/world';
import { EntityType } from '@/types';
import { WeaponType } from '@/types/sprite';
import { createEntity } from '../types/world';
import { WeaponConfig } from '../config/weapons/weapons';

export function WeaponSystem(world: World, dt: number): void {
  const playerId = world.player;
  if (!playerId) return;

  const weapon = world.components.weapons.get(playerId);
  const position = world.components.positions.get(playerId);

  if (!weapon || !position) return;

  weapon.fireTimer -= dt;

  if (weapon.fireTimer <= 0) {
    const config = WeaponConfig[weapon.weaponType as WeaponType];

    if (config) {
      fireBullet(world, position.x, position.y, weapon.weaponType, weapon.level, playerId);

      weapon.fireTimer = config.baseFireRate;

      world.events.push({
        type: 'weapon_fired',
        entityId: playerId,
        bulletIds: [],
        weaponType: weapon.weaponType
      });
    }
  }
}

function fireBullet(
  world: World,
  x: number,
  y: number,
  weaponType: string,
  level: number,
  ownerId: string
): void {
  const bulletId = createEntity(world, EntityType.BULLET);

  const bulletX = x;
  const bulletY = y - 20;

  world.components.positions.set(bulletId, { x: bulletX, y: bulletY });
  world.components.velocities.set(bulletId, { vx: 0, vy: -15, speed: 15 });
  world.components.renders.set(bulletId, {
    spriteKey: `bullet_${weaponType}`,
    width: 8,
    height: 16,
    color: '#ffff00'
  });
  world.components.colliders.set(bulletId, {
    width: 8,
    height: 16,
    collisionType: CollisionType.BULLET
  });
  world.components.combats.set(bulletId, {
    hp: 1,
    maxHp: 1,
    damage: 10 + level * 2
  });
  world.components.lifetimes.set(bulletId, {
    lifetime: 3000,
    createdAt: world.time
  });
}
