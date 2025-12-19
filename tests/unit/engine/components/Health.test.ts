import { Health } from '@/engine/components/combat';

describe('Health Component', () => {
  test('should create with default values', () => {
    const health = new Health({});
    expect(health.hp).toBe(100);
    expect(health.max).toBe(100);
  });

  test('should create with custom values', () => {
    const health = new Health({ hp: 50, max: 200 });
    expect(health.hp).toBe(50);
    expect(health.max).toBe(200);
  });

  test('should clamp hp to max', () => {
    const health = new Health({ hp: 150, max: 100 });
    expect(health.hp).toBe(100);
  });

  test('check method should identify Health instances', () => {
    const health = new Health({});
    const notHealth = { hp: 100, max: 100 };

    expect(Health.check(health)).toBe(true);
    expect(Health.check(notHealth)).toBe(false);
  });
});