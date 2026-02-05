// tests/unit/storage/GameStorage.test.ts

import { describe, it, expect, beforeEach } from '@jest/globals';
import { GameStorage } from '../../../src/engine/storage/GameStorage';
import { FighterId, WeaponId, EnemyId, BossId } from '../../../src/engine/types/ids';
import type { IStorageBackend } from '../../../src/engine/storage/base/IStorageBackend';

// Mock storage backend for testing
class MockStorageBackend implements IStorageBackend {
  private store: Record<string, any> = {};

  isAvailable(): boolean {
    return true;
  }

  async get<T>(key: string): Promise<{ success: boolean; data?: T; error?: string }> {
    if (this.store[key] === undefined) {
      return { success: false, error: 'Key not found' };
    }
    return { success: true, data: this.store[key] as T };
  }

  async set<T>(key: string, value: T): Promise<{ success: boolean; error?: string }> {
    this.store[key] = value;
    return { success: true };
  }

  async remove(key: string): Promise<{ success: boolean; error?: string }> {
    delete this.store[key];
    return { success: true };
  }

  async clear(): Promise<{ success: boolean; error?: string }> {
    this.store = {};
    return { success: true };
  }
}

describe('GameStorage', () => {
  let storage: GameStorage;
  let mockBackend: MockStorageBackend;

  beforeEach(() => {
    // Reset singleton
    GameStorage.resetInstance();
    mockBackend = new MockStorageBackend();
    storage = GameStorage.initialize({
      version: 1,
      backend: mockBackend,
    });
  });

  it('should create singleton instance', () => {
    const instance1 = GameStorage.getInstance();
    const instance2 = GameStorage.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should load default save data on first load', async () => {
    const data = await storage.load();

    expect(data.version).toBe(1);
    expect(data.progress.maxLevel).toBe(0);
    expect(data.progress.highScore).toBe(0);
    expect(data.fighters[FighterId.NEON].unlocked).toBe(true);
  });

  it('should save and load data', async () => {
    await storage.load();
    await storage.updateHighScore(5, 10000);

    // Create new instance to simulate reload
    GameStorage.resetInstance();
    const storage2 = GameStorage.initialize({
      version: 1,
      backend: mockBackend,
    });
    const data = await storage2.load();

    expect(data.progress.maxLevel).toBe(5);
    expect(data.progress.highScore).toBe(10000);
  });

  it('should handle version mismatch', async () => {
    let mismatchCalled = false;
    storage = GameStorage.initialize({
      version: 2,
      backend: mockBackend,
      onVersionMismatch: (current, saved) => {
        mismatchCalled = true;
        expect(current).toBe(2);
        expect(saved).toBe(1);
      },
    });

    // First call load() to initialize cache with default save
    await storage.load();

    // Simulate old save data by directly setting it in the backend
    await mockBackend.set('game_save', {
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      progress: { maxLevel: 3, highScore: 5000, totalPlayCount: 1, totalPlayTimeMs: 60000 },
      fighters: {},
      weapons: {},
      items: {},
      enemies: {},
      bosses: {},
    });

    // Reset instance to trigger reload
    GameStorage.resetInstance();
    storage = GameStorage.initialize({
      version: 2,
      backend: mockBackend,
      onVersionMismatch: (current, saved) => {
        mismatchCalled = true;
        expect(current).toBe(2);
        expect(saved).toBe(1);
      },
    });

    const data = await storage.load();

    expect(mismatchCalled).toBe(true);
    expect(data.version).toBe(2); // Should return default save
  });

  it('should record weapon pickup', async () => {
    await storage.load();
    // First ensure the weapon stats exist by setting it manually
    // This is needed because createDefaultEntityStatsRecord returns empty object
    const data = storage.getData();
    data.weapons[WeaponId.LASER] = {
      unlocked: false,
      encounterCount: 0,
      killCount: 0,
      highestDamage: 0,
      highestDamageReceived: 0,
    };
    await storage.save(data);

    await storage.recordWeapon(WeaponId.LASER, 1000);

    const stats = storage.getWeaponStats(WeaponId.LASER);
    expect(stats.unlocked).toBe(true);
    expect(stats.encounterCount).toBe(1);
    expect(stats.highestDamage).toBe(1000);
  });

  it('should record enemy kill', async () => {
    await storage.load();
    // First ensure the enemy stats exist
    const data = storage.getData();
    data.enemies[EnemyId.NORMAL] = {
      unlocked: false,
      encounterCount: 0,
      killCount: 0,
      highestDamage: 0,
      highestDamageReceived: 0,
    };
    await storage.save(data);

    await storage.recordEnemy(EnemyId.NORMAL, true, 500, 100);

    const stats = storage.getEnemyStats(EnemyId.NORMAL);
    expect(stats.unlocked).toBe(true);
    expect(stats.killCount).toBe(1);
    expect(stats.highestDamage).toBe(500);
    expect(stats.highestDamageReceived).toBe(100);
  });

  it('should record boss defeat', async () => {
    await storage.load();
    // First ensure the boss stats exist
    const data = storage.getData();
    data.bosses[BossId.GUARDIAN] = {
      unlocked: false,
      encounterCount: 0,
      killCount: 0,
      highestDamage: 0,
      highestDamageReceived: 0,
    };
    await storage.save(data);

    await storage.recordBoss(BossId.GUARDIAN, true, 2000, 500);

    const stats = storage.getBossStats(BossId.GUARDIAN);
    expect(stats.unlocked).toBe(true);
    expect(stats.killCount).toBe(1);
    expect(stats.highestDamage).toBe(2000);
  });

  it('should update fighter stats', async () => {
    await storage.load();
    await storage.updateFighterStats(FighterId.NEON, {
      totalEnemyKills: 100,
      totalBossKills: 5,
    });

    const stats = storage.getFighterStats(FighterId.NEON);
    expect(stats.totalEnemyKills).toBe(100);
    expect(stats.totalBossKills).toBe(5);
  });

  it('should reset save data', async () => {
    await storage.load();
    await storage.updateHighScore(10, 50000);
    await storage.reset();

    const data = storage.getData();
    expect(data.progress.maxLevel).toBe(0);
    expect(data.progress.highScore).toBe(0);
  });
});
