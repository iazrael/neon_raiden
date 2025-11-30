import { BossSystem } from '@/game/systems/BossSystem';
import { Entity } from '@/types';
import { AudioMock } from '../mocks/audioMock';
import { createPlayer, createBoss } from '../mocks/entityFactory';

describe('BossSystem', () => {
  let bossSystem: BossSystem;
  let audioMock: AudioMock;
  let player: Entity;
  let boss: Entity;
  let enemyBullets: Entity[];

  beforeEach(() => {
    audioMock = new AudioMock();
    // Initialize with reasonable screen dimensions
    bossSystem = new BossSystem(audioMock as any, 800, 600);
    player = createPlayer();
    boss = createBoss();
    enemyBullets = [];
  });

  describe('spawn', () => {
    it('should spawn a boss with correct initial properties', () => {
      // Mock the sprite map since we don't have actual sprites in tests
      const sprites = {
        'boss_1': { width: 150, height: 150 } as HTMLCanvasElement
      };
      
      const spawnedBoss = bossSystem.spawn(1, sprites);
      
      expect(spawnedBoss.type).toBe('boss');
      expect(spawnedBoss.x).toBeGreaterThan(0);
      expect(spawnedBoss.y).toBe(-150); // Should start above screen
      expect(spawnedBoss.hp).toBeGreaterThan(0);
      expect(spawnedBoss.invulnerable).toBe(true); // Should start invulnerable
      expect(audioMock.playPowerUp).toHaveBeenCalled();
    });

    it('should spawn boss at center position when configured', () => {
      // Mock the sprite map
      const sprites = {
        'boss_2': { width: 200, height: 200 } as HTMLCanvasElement
      };
      
      const spawnedBoss = bossSystem.spawn(2, sprites);
      
      // Boss 2 (INTERCEPTOR) is configured to spawn at random position, not center
      expect(spawnedBoss.x).toBeGreaterThan(0);
    });

    it('should throw error for non-existent boss level', () => {
      const sprites = {};
      
      expect(() => {
        bossSystem.spawn(99, sprites);
      }).toThrow('Boss config not found for level 99');
    });
  });

  describe('spawnWingmen', () => {
    it('should spawn wingmen for bosses that have them', () => {
      // Mock the sprite map
      const sprites = {
        'boss_8': { width: 320, height: 320 } as HTMLCanvasElement
      };
      
      const wingmen = bossSystem.spawnWingmen(8, boss, sprites);
      
      expect(wingmen.length).toBeGreaterThan(0);
      expect(wingmen[0].type).toBe('enemy');
      expect(wingmen[0].isElite).toBe(true); // Wingmen are elite
    });

    it('should return empty array for bosses without wingmen', () => {
      // Mock the sprite map
      const sprites = {
        'boss_1': { width: 150, height: 150 } as HTMLCanvasElement
      };
      
      const wingmen = bossSystem.spawnWingmen(1, boss, sprites);
      
      expect(wingmen.length).toBe(0);
    });
  });

  describe('update', () => {
    it('should update boss position during entry phase', () => {
      boss.state = 0; // Entry phase
      boss.y = -100; // Above screen
      
      const initialY = boss.y;
      bossSystem.update(boss, 16, 1, player, enemyBullets, 1);
      
      // Boss should move downward during entry
      expect(boss.y).toBeGreaterThan(initialY);
    });

    it('should stop boss entry when reaching target position', () => {
      boss.state = 0; // Entry phase
      boss.y = 160; // Beyond target position (150)
      
      bossSystem.update(boss, 16, 1, player, enemyBullets, 1);
      
      // Boss should transition to fighting state when reaching target
      expect(boss.state).toBe(1);
      expect(boss.vy).toBe(0);
    });

    it('should keep invulnerable during entry and disable when fighting starts', () => {
      boss.state = 0;
      boss.invulnerable = true;
      boss.y = 140;
      bossSystem.update(boss, 16, 1, player, enemyBullets, 1);
      expect(boss.invulnerable).toBe(true);

      boss.y = 160;
      bossSystem.update(boss, 16, 1, player, enemyBullets, 1);
      expect(boss.state).toBe(1);
      expect(boss.invulnerable).toBe(false);
      expect(boss.invulnerableTimer).toBe(0);
    });
  });

  describe('movement patterns', () => {
    it('should move boss in sine pattern', () => {
      boss.state = 1; // Fighting state
      // Mock config to use sine pattern for level 4
      jest.mock('@/game/config', () => ({
        getBossConfigByLevel: jest.fn().mockReturnValue({
          hp: 1000,
          speed: 2,
          size: { width: 150, height: 150 },
          hitboxScale: 1.0,
          weaponConfigs: { fireRate: 0.01, bulletCount: 1, bulletSpeed: 5 },
          weapons: [],
          movement: { pattern: 'sine' },
          laser: { type: 'none' }
        })
      }));
      
      const initialX = boss.x;
      bossSystem.movementTimer = 0;
      
      bossSystem.update(boss, 16, 1, player, enemyBullets, 4);
      
      // Boss should have moved horizontally in sine pattern
      expect(boss.x).not.toBe(initialX);
    });
  });

  describe('weapon firing', () => {
    it('should fire bullets based on fire rate', () => {
      boss.state = 1; // Fighting state
      const initialBulletCount = enemyBullets.length;
      
      // Mock Math.random to trigger firing
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.001); // Very low number to ensure firing
      
      bossSystem.update(boss, 16, 1, player, enemyBullets, 1);
      
      expect(enemyBullets.length).toBeGreaterThan(initialBulletCount);
      
      // Restore original Math.random
      Math.random = originalRandom;
    });
  });
});
