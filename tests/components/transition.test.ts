import { LevelTransitionComponent, BossExitComponent } from '../../src/engine/components/transition';

describe('LevelTransitionComponent', () => {
  test('可以创建 LevelTransitionComponent', () => {
    const component: LevelTransitionComponent = {
      kind: 'LevelTransition',
      timer: 0,
      duration: 1500,
      fromLevel: 1,
      toLevel: 2,
    };

    expect(component.kind).toBe('LevelTransition');
    expect(component.timer).toBe(0);
    expect(component.duration).toBe(1500);
    expect(component.fromLevel).toBe(1);
    expect(component.toLevel).toBe(2);
  });

  test('通过 timer 判断状态', () => {
    const component: LevelTransitionComponent = {
      kind: 'LevelTransition',
      timer: 750,
      duration: 1500,
      fromLevel: 1,
      toLevel: 2,
    };

    // timer < duration 表示未完成
    expect(component.timer < component.duration).toBe(true);
  });
});

describe('BossExitComponent', () => {
  test('可以创建 BossExitComponent', () => {
    const component: BossExitComponent = {
      kind: 'BossExit',
      timer: 0,
      duration: 2000,
      bossId: 'entity123',
    };

    expect(component.kind).toBe('BossExit');
    expect(component.timer).toBe(0);
    expect(component.duration).toBe(2000);
    expect(component.bossId).toBe('entity123');
  });
});
