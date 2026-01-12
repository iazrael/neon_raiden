import { World } from '../types/world';
import { EntityType } from '@/types';

export function AISteerSystem(world: World, dt: number): void {
  const enemies = Array.from(world.entities.entries())
    .filter(([_, entity]) => entity.type === EntityType.ENEMY && !entity.markedForDeletion);

  const playerId = world.player;
  if (!playerId) return;

  const playerPosition = world.components.positions.get(playerId);
  if (!playerPosition) return;

  for (const [id, _] of enemies) {
    const ai = world.components.ais.get(id);
    const velocity = world.components.velocities.get(id);
    const position = world.components.positions.get(id);

    if (!ai || !velocity || !position) continue;

    if (ai.target) {
      const targetPosition = world.components.positions.get(ai.target);
      if (targetPosition) {
        const dx = targetPosition.x - position.x;
        const dy = targetPosition.y - position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
          const turnSpeed = ai.turnSpeed || 0.1;
          const targetAngle = Math.atan2(dy, dx);
          const currentAngle = Math.atan2(velocity.vy, velocity.vx);

          let angleDiff = targetAngle - currentAngle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          const newAngle = currentAngle + Math.max(-turnSpeed, Math.min(turnSpeed, angleDiff));
          const speed = velocity.speed || 3;

          velocity.vx = Math.cos(newAngle) * speed;
          velocity.vy = Math.sin(newAngle) * speed;
        }
      }
    }
  }
}
