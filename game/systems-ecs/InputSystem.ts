import { World } from '../types/world';
import { EntityType } from '@/types';

export function InputSystem(world: World, dt: number): void {
  const playerId = world.player;
  if (!playerId) return;

  const input = world.components.inputs.get(playerId);
  const velocity = world.components.velocities.get(playerId);
  const position = world.components.positions.get(playerId);

  if (!input || !velocity || !position) return;

  const { keys, touch, touchDelta } = input;

  let dx = 0;
  let dy = 0;

  if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
  if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
  if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
  if (keys['ArrowDown'] || keys['KeyS']) dy += 1;

  const speed = velocity.speed || 7;

  velocity.vx = dx * speed;
  velocity.vy = dy * speed;

  if (touch.active) {
    velocity.vx = touchDelta.x;
    velocity.vy = touchDelta.y;
    touchDelta.x = 0;
    touchDelta.y = 0;

    if (touch.x > 0 && touch.y > 0) {
      const targetX = touch.x;
      const targetY = touch.y - 50;
      const diffX = targetX - position.x;
      const diffY = targetY - position.y;
      const dist = Math.sqrt(diffX * diffX + diffY * diffY);

      if (dist > 5) {
        velocity.vx = (diffX / dist) * speed;
        velocity.vy = (diffY / dist) * speed;
      }
    }
  }
}
