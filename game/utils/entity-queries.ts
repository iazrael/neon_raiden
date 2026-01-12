import { World, CollisionType } from '@/game/types/world';
import { EntityType } from '@/types';

export type ComponentType = keyof World['components'];

export function queryEntities(world: World, ...componentTypes: ComponentType[]): string[] {
  if (componentTypes.length === 0) {
    return Array.from(world.entities.keys());
  }

  const firstComponent = componentTypes[0];
  const entities = world.components[firstComponent]?.keys() || [];

  return Array.from(entities).filter(id =>
    componentTypes.every(type => world.components[type]?.has(id))
  );
}

export function getEntitiesByType(world: World, type: EntityType): string[] {
  return Array.from(world.entities.entries())
    .filter(([_, entity]) => entity.type === type && !entity.markedForDeletion)
    .map(([id]) => id);
}

export function getEntitiesInRange(world: World, x: number, y: number, range: number): string[] {
  const rangeSquared = range * range;

  return queryEntities(world, 'positions').filter(id => {
    const position = world.components.positions.get(id);
    if (!position) return false;

    const dx = position.x - x;
    const dy = position.y - y;
    return dx * dx + dy * dy < rangeSquared;
  });
}

export function getEntitiesWithCollision(world: World, collisionType: CollisionType): string[] {
  return queryEntities(world, 'colliders').filter(id => {
    const collider = world.components.colliders.get(id);
    return collider?.collisionType === collisionType;
  });
}

export function getPlayer(world: World): string | undefined {
  return world.player && world.entities.has(world.player) ? world.player : undefined;
}

export function getBossEntity(world: World): string | undefined {
  return world.boss && world.entities.has(world.boss) ? world.boss : undefined;
}

export function hasComponent<K extends ComponentType>(
  world: World,
  entityId: string,
  componentType: K
): boolean {
  return world.components[componentType]?.has(entityId) || false;
}

export function getComponent<K extends ComponentType>(
  world: World,
  entityId: string,
  componentType: K
): World['components'][K] extends Map<string, infer T> ? T : undefined {
  return world.components[componentType]?.get(entityId) as any;
}

export function setComponent<K extends ComponentType>(
  world: World,
  entityId: string,
  componentType: K,
  component: World['components'][K] extends Map<string, infer T> ? T : any
): void {
  world.components[componentType]?.set(entityId, component as any);
}

export function removeComponent<K extends ComponentType>(
  world: World,
  entityId: string,
  componentType: K
): void {
  world.components[componentType]?.delete(entityId);
}

export function getPosition(world: World, entityId: string) {
  return getComponent(world, entityId, 'positions');
}

export function setPosition(world: World, entityId: string, x: number, y: number) {
  const position = getPosition(world, entityId);
  if (position) {
    position.x = x;
    position.y = y;
  }
}

export function getVelocity(world: World, entityId: string) {
  return getComponent(world, entityId, 'velocities');
}

export function setVelocity(world: World, entityId: string, vx: number, vy: number) {
  const velocity = getVelocity(world, entityId);
  if (velocity) {
    velocity.vx = vx;
    velocity.vy = vy;
  }
}

export function getCombat(world: World, entityId: string) {
  return getComponent(world, entityId, 'combats');
}

export function getCollider(world: World, entityId: string) {
  return getComponent(world, entityId, 'colliders');
}

export function getRender(world: World, entityId: string) {
  return getComponent(world, entityId, 'renders');
}

export function getWeapon(world: World, entityId: string) {
  return getComponent(world, entityId, 'weapons');
}

export function getAI(world: World, entityId: string) {
  return getComponent(world, entityId, 'ais');
}

export function getBossComponent(world: World, entityId: string) {
  return getComponent(world, entityId, 'bosses');
}

export function getBuff(world: World, entityId: string) {
  return getComponent(world, entityId, 'buffs');
}

export function getLifetime(world: World, entityId: string) {
  return getComponent(world, entityId, 'lifetimes');
}

export function getCamera(world: World, entityId: string) {
  return getComponent(world, entityId, 'cameras');
}
