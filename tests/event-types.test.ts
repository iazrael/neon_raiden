import type { GameEvent, EventType, HitEvent } from '../src/engine/events/index';

describe('Event Types', () => {
  it('应该正确导出 GameEvent 联合类型', () => {
    const event: GameEvent = {
      type: 'Hit',
      pos: { x: 100, y: 200 },
      damage: 10,
      owner: 1,
      victim: 2,
    };
    expect(event.type).toBe('Hit');
  });

  it('应该正确导出 EventType 类型标签联合', () => {
    const eventType: EventType = 'Hit';
    expect(eventType).toBe('Hit');
  });

  it('应该正确导出具体事件类型', () => {
    const hitEvent: HitEvent = {
      type: 'Hit',
      pos: { x: 100, y: 200 },
      damage: 10,
      owner: 1,
      victim: 2,
    };
    expect(hitEvent.type).toBe('Hit');
  });

  it('EventType 应该包含所有事件类型标签', () => {
    const validTypes: EventType[] = [
      'Hit',
      'Kill',
      'Pickup',
      'WeaponFired',
      'BossPhaseChange',
      'BossSpecialEvent',
      'CamShake',
      'BloodFog',
      'LevelUp',
      'ComboBreak',
      'ScreenClear',
      'PlaySound',
      'BerserkMode',
      'ComboUpgrade',
      'BombExploded',
      'WeaponEffect',
      'ShieldBroken',
      'TimeSlow',
    ];
    expect(validTypes.length).toBeGreaterThan(0);
  });
});
