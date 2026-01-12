import { World } from '../types/world';

export function LifetimeSystem(world: World, dt: number): void {
  const now = world.time;

  for (const [id, lifetime] of world.components.lifetimes) {
    if (now - lifetime.createdAt > lifetime.lifetime) {
      world.entities.get(id)!.markedForDeletion = true;
    }
  }
}
