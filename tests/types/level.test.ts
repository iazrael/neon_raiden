import { LevelState } from '../../src/engine/types/level';

describe('LevelState', () => {
  test('可以创建 LevelState 对象', () => {
    const state: LevelState = {
      currentLevel: 1,
      progress: 0,
      elapsedTime: 0,
      killCount: 0,
    };

    expect(state.currentLevel).toBe(1);
    expect(state.progress).toBe(0);
    expect(state.elapsedTime).toBe(0);
    expect(state.killCount).toBe(0);
  });

  test('progress 允许超出 100', () => {
    const state: LevelState = {
      currentLevel: 1,
      progress: 120,
      elapsedTime: 60000,
      killCount: 0,
    };

    expect(state.progress).toBe(120);
  });

  test('elapsedTime 单位为毫秒', () => {
    const state: LevelState = {
      currentLevel: 1,
      progress: 50,
      elapsedTime: 30000, // 30秒
      killCount: 0,
    };

    expect(state.elapsedTime).toBe(30000);
  });
});
