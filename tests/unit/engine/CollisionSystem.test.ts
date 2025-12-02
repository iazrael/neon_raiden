import { CollisionSystem } from '@/game/engine/CollisionSystem';
import { EventBus } from '@/game/engine/EventBus';
import { EventPayloads } from '@/game/engine/events';
import { Entity, EntityType } from '@/types';

test('CollisionSystem detects bullet hit enemy', async () => {
  const bus = new EventBus<EventPayloads>();
  const hits: Array<{ b: Entity; e: Entity }> = [];
  const system = new CollisionSystem(bus, {
    onBulletHit: (b, e) => hits.push({ b, e }),
    onPlayerHit: () => {},
    onPowerup: () => {}
  });
  const player: Entity = { x: 0, y: 0, width: 10, height: 10, vx: 0, vy: 0, hp: 1, maxHp: 1, type: EntityType.PLAYER, color: '#fff', markedForDeletion: false };
  const bullet: Entity = { x: 0, y: 0, width: 5, height: 5, vx: 0, vy: 0, hp: 1, maxHp: 1, type: EntityType.BULLET, color: '#fff', markedForDeletion: false };
  const enemy: Entity = { x: 0, y: 0, width: 5, height: 5, vx: 0, vy: 0, hp: 1, maxHp: 1, type: EntityType.ENEMY, color: '#fff', markedForDeletion: false };
  await system.update({ player, enemies: [enemy], bullets: [bullet], enemyBullets: [], powerups: [], boss: null, bossWingmen: [] }, 0);
  expect(hits.length).toBe(1);
});

