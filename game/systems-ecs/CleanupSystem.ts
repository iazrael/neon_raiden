import { World } from '../types/world';

export function CleanupSystem(world: World, dt: number): void {
  for (const [id, entity] of world.entities) {
    if (entity.markedForDeletion) {
      world.entities.delete(id);

      const { components } = world;
      Object.values(components).forEach(componentMap => {
        componentMap.delete(id);
      });

      if (world.player === id) {
        world.player = undefined;
      }
      if (world.boss === id) {
        world.boss = undefined;
      }
    }
  }
}
