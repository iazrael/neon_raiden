import { EventBus } from '@/game/engine/EventBus';
import { EventPayloads, CombatEventTypeBus } from '@/game/engine/events';

test('EventBus publish/subscribe works', async () => {
  const bus = new EventBus<EventPayloads>();
  let called = 0;
  bus.subscribe(CombatEventTypeBus.PlayerDamaged, p => {
    if (p.amount === 5) called++;
  });
  await bus.publish(CombatEventTypeBus.PlayerDamaged, { amount: 5 });
  expect(called).toBe(1);
});

