import { FighterFactory } from '@/game/engine/FighterFactory';
import { EventBus } from '@/game/engine/EventBus';
import { EventPayloads } from '@/game/engine/events';
import { PlayerConfig } from '@/game/config/player';

test('FighterFactory creates Starfighter with config', () => {
  const bus = new EventBus<EventPayloads>();
  const fighter = FighterFactory.createByConfig(PlayerConfig, 100, 200, bus);
  expect(fighter.x).toBe(100);
  expect(fighter.y).toBe(200);
  expect(fighter.hp).toBe(PlayerConfig.initialHp);
  expect(fighter.maxHp).toBe(PlayerConfig.maxHp);
});

