import { LEVEL_CONFIG } from '../../src/engine/configs/level-config';

describe('LEVEL_CONFIG', () => {
  test('进度配置存在', () => {
    expect(LEVEL_CONFIG.PROGRESS).toBeDefined();
    expect(LEVEL_CONFIG.PROGRESS.PER_SECOND_GROWTH_RATE).toBe(1.5);
    expect(LEVEL_CONFIG.PROGRESS.KILL_BONUS).toBe(0.5);
    expect(LEVEL_CONFIG.PROGRESS.MIN_LEVEL_DURATION).toBe(60000);
    expect(LEVEL_CONFIG.PROGRESS.BOSS_READY_THRESHOLD).toBe(90);
    expect(LEVEL_CONFIG.PROGRESS.MAX_PROGRESS).toBe(120);
  });

  test('动画时长配置存在', () => {
    expect(LEVEL_CONFIG.ANIMATION.LEVEL_TRANSITION_DURATION).toBe(1500);
    expect(LEVEL_CONFIG.ANIMATION.BOSS_EXIT_DURATION).toBe(2000);
    expect(LEVEL_CONFIG.ANIMATION.BOSS_WARNING_DURATION).toBe(3000);
    expect(LEVEL_CONFIG.ANIMATION.STAGE_ONE_INTRO_DURATION).toBe(2000);
  });

  test('生成配置存在', () => {
    expect(LEVEL_CONFIG.SPAWN.MIN_ENEMY_INTERVAL).toBe(800);
    expect(LEVEL_CONFIG.SPAWN.MAX_ENEMY_INTERVAL).toBe(2000);
  });

  test('配置为只读', () => {
    // 尝试修改应该抛出异常（严格模式下）
    expect(() => {
      (LEVEL_CONFIG as any).PROGRESS.PER_SECOND_GROWTH_RATE = 999;
    }).toThrow();
    // 值应该保持不变
    expect(LEVEL_CONFIG.PROGRESS.PER_SECOND_GROWTH_RATE).toBe(1.5);
  });
});
