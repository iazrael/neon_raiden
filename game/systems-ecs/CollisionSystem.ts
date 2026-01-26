import { World, CollisionType } from '../types/world';
import { EntityType } from '@/types';

export function CollisionSystem(world: World, dt: number): void {
  const colliders = Array.from(world.components.colliders.entries());
  const positions = world.components.positions;

  // 调试：显示碰撞检测信息
  const collisionCount = world.events.filter(e => e.type === 'collision').length;
  if (collisionCount > 0) {
    console.log(`[Collision] Found ${collisionCount} collisions this frame`);
  }

  for (let i = 0; i < colliders.length; i++) {
    const [id1, collider1] = colliders[i];
    const pos1 = positions.get(id1);
    if (!pos1) continue;

    for (let j = i + 1; j < colliders.length; j++) {
      const [id2, collider2] = colliders[j];
      const pos2 = positions.get(id2);
      if (!pos2) continue;

      if (!shouldCollide(collider1, collider2)) continue;

      if (checkCollision(pos1, collider1, pos2, collider2)) {
        console.log(`[Collision] Collision: ${id1} <-> ${id2}`);
        world.events.push({
          type: 'collision',
          entityId: id1,
          otherId: id2
        });
        world.events.push({
          type: 'collision',
          entityId: id2,
          otherId: id1
        });
      }
    }
  }
}

function shouldCollide(
  collider1: { collisionType: CollisionType },
  collider2: { collisionType: CollisionType }
): boolean {
  const { collisionType: type1 } = collider1;
  const { collisionType: type2 } = collider2;

  if (type1 === type2) return false;

  const playerCollisions = [
    [CollisionType.PLAYER, CollisionType.ENEMY],
    [CollisionType.PLAYER, CollisionType.ENEMY_BULLET],
    [CollisionType.PLAYER, CollisionType.POWERUP]
  ];

  const bulletCollisions = [
    [CollisionType.BULLET, CollisionType.ENEMY]
  ];

  const pair = type1 < type2 ? [type1, type2] : [type2, type1] as [CollisionType, CollisionType];

  return playerCollisions.some(c => c[0] === pair[0] && c[1] === pair[1]) ||
         bulletCollisions.some(c => c[0] === pair[0] && c[1] === pair[1]);
}

function checkCollision(
  pos1: { x: number, y: number },
  collider1: { width: number, height: number, hitboxShrink?: number },
  pos2: { x: number, y: number },
  collider2: { width: number, height: number, hitboxShrink?: number }
): boolean {
  const w1 = collider1.width * (1 - (collider1.hitboxShrink || 0));
  const h1 = collider1.height * (1 - (collider1.hitboxShrink || 0));
  const w2 = collider2.width * (1 - (collider2.hitboxShrink || 0));
  const h2 = collider2.height * (1 - (collider2.hitboxShrink || 0));

  return pos1.x < pos2.x + w2 &&
         pos1.x + w1 > pos2.x &&
         pos1.y < pos2.y + h2 &&
         pos1.y + h1 > pos2.y;
}
