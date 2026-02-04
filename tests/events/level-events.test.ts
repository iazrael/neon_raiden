import {
  LevelTransitionStartEvent,
  LevelTransitionCompleteEvent,
  BossExitStartEvent,
  VictoryEvent,
  StageOneIntroEvent,
} from '../../src/engine/events/events';

describe('关卡事件类型', () => {
  test('LevelTransitionStartEvent 结构正确', () => {
    const event: LevelTransitionStartEvent = {
      type: 'LevelTransitionStart',
      fromLevel: 1,
      toLevel: 2,
    };

    expect(event.type).toBe('LevelTransitionStart');
    expect(event.fromLevel).toBe(1);
    expect(event.toLevel).toBe(2);
  });

  test('LevelTransitionCompleteEvent 结构正确', () => {
    const event: LevelTransitionCompleteEvent = {
      type: 'LevelTransitionComplete',
      level: 2,
    };

    expect(event.type).toBe('LevelTransitionComplete');
    expect(event.level).toBe(2);
  });

  test('BossExitStartEvent 结构正确', () => {
    const event: BossExitStartEvent = {
      type: 'BossExitStart',
      bossId: 'entity123',
    };

    expect(event.type).toBe('BossExitStart');
    expect(event.bossId).toBe('entity123');
  });

  test('VictoryEvent 结构正确', () => {
    const event: VictoryEvent = {
      type: 'Victory',
      finalLevel: 10,
    };

    expect(event.type).toBe('Victory');
    expect(event.finalLevel).toBe(10);
  });

  test('StageOneIntroEvent 结构正确', () => {
    const event: StageOneIntroEvent = {
      type: 'StageOneIntro',
      duration: 2000,
    };

    expect(event.type).toBe('StageOneIntro');
    expect(event.duration).toBe(2000);
  });
});
