import { BulletSystem } from '@/game/systems/BulletSystem';
import { LevelManager } from '@/game/engine/LevelManager';
import { EventBus } from '@/game/engine/EventBus';
import { EventPayloads } from '@/game/engine/events';
import { Entity, EntityType } from '@/types';

test('BulletSystem rotates enemy bullets', () => {
  const sys = new BulletSystem();
  const player: Entity = { x: 0, y: 0, width: 10, height: 10, vx: 0, vy: 0, hp: 1, maxHp: 1, type: EntityType.PLAYER, color: '#fff', markedForDeletion: false };
  const b: Entity = { x: 0, y: 0, width: 5, height: 5, vx: 1, vy: 0, hp: 1, maxHp: 1, type: EntityType.BULLET, color: '#fff', markedForDeletion: false };
  sys.updateEnemyBullets([b], player, [], 16, 1, 800);
  expect(typeof b.angle).toBe('number');
});

test('LevelManager spawn rate uses multiplier', () => {
  const bus = new EventBus<EventPayloads>();
  const lm = new LevelManager(bus, false);
  lm.reset(1);
  const base = lm.getSpawnRateForLevel(1);
  const faster = lm.getSpawnRateForLevel(0.5);
  expect(faster).toBeLessThan(base);
});

