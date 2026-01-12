import { World } from '../types/world';

export function MovementSystem(world: World, dt: number): void {
  for (const [id, velocity] of world.components.velocities) {
    const position = world.components.positions.get(id);
    if (!position) continue;

    position.x += velocity.vx;
    position.y += velocity.vy;

    if (position.x < 0) position.x = 0;
    if (position.x > world.width) position.x = world.width;
    if (position.y < 0) position.y = 0;
    if (position.y > world.height) position.y = world.height;
  }
}
