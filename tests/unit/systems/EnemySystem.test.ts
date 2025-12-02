import { EnemySystem } from '@/game/systems/EnemySystem';
import { EnemyType, Entity } from '@/types';
import { AudioMock } from '../mocks/audioMock';
import { createPlayer, createEnemy } from '../mocks/entityFactory';

describe('EnemySystem', () => {
  let enemySystem: EnemySystem;
  let audioMock: AudioMock;
  let player: Entity;
  let enemies: Entity[];
  let enemyBullets: Entity[];

  beforeEach(() => {
    audioMock = new AudioMock();
    // Initialize with reasonable screen dimensions
    enemySystem = new EnemySystem(audioMock as any, 800, 600);
    player = createPlayer();
    enemies = [];
    enemyBullets = [];
  });

  describe('spawnEnemy', () => {
    it('should spawn an enemy at a random x position', () => {
      const initialEnemiesCount = enemies.length;
      enemySystem.spawnEnemy(1, enemies);
      
      expect(enemies.length).toBe(initialEnemiesCount + 1);
      const spawnedEnemy = enemies[enemies.length - 1];
      expect(spawnedEnemy.type).toBe('enemy');
      // Enemy should be spawned above the screen
      expect(spawnedEnemy.y).toBe(-50);
    });

    it('should spawn different enemy types based on level', () => {
      // Test with multiple spawns to check randomness
      for (let i = 0; i < 10; i++) {
        enemySystem.spawnEnemy(1, enemies);
      }
      
      // Should have spawned normal enemies (default for level 1)
      const normalEnemies = enemies.filter(e => e.subType === EnemyType.NORMAL);
      expect(normalEnemies.length).toBeGreaterThan(0);
    });

    it('should apply elite stats to some enemies', () => {
      // Mock Math.random to control elite chance
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.01); // Force elite spawn
      
      enemySystem.spawnEnemy(1, enemies);
      const spawnedEnemy = enemies[enemies.length - 1];
      
      expect(spawnedEnemy.isElite).toBe(true);
      // Elite enemies should have increased size and HP
      expect(spawnedEnemy.width).toBeGreaterThan(32); // Normal width
      expect(spawnedEnemy.hp).toBeGreaterThan(50); // Normal HP
      
      // Restore original Math.random
      Math.random = originalRandom;
    });

    it('should respect eliteChanceOverride parameter', () => {
      enemySystem.spawnEnemy(1, enemies, 0);
      const e1 = enemies[enemies.length - 1];
      expect(e1.isElite).toBe(false);

      enemySystem.spawnEnemy(1, enemies, 1);
      const e2 = enemies[enemies.length - 1];
      expect(e2.isElite).toBe(true);
    });
  });

  describe('update', () => {
    it('should update enemy positions based on velocity', () => {
      const enemy = createEnemy();
      enemy.vx = 5;
      enemy.vy = 3;
      enemies.push(enemy);
      
      const initialX = enemy.x;
      const initialY = enemy.y;
      
      // Update with 16ms delta time (60fps)
      enemySystem.update(16, 1, enemies, player, enemyBullets);
      
      expect(enemy.x).toBe(initialX + 5);
      expect(enemy.y).toBe(initialY + 3);
    });

    it('should handle kamikaze enemy AI', () => {
      const kamikaze = createEnemy(EnemyType.KAMIKAZE);
      kamikaze.y = 50; // Above player
      player.y = 100; // Player below enemy
      enemies.push(kamikaze);
      
      const initialVX = kamikaze.vx;
      enemySystem.update(16, 1, enemies, player, enemyBullets);
      
      // Kamikaze should move toward player
      expect(kamikaze.vx).not.toBe(initialVX);
    });

    it('should handle mine layer enemy firing', () => {
      const mineLayer = createEnemy(EnemyType.MINE_LAYER);
      mineLayer.y = 100; // On screen
      enemies.push(mineLayer);
      
      const initialBulletCount = enemyBullets.length;
      
      // Update with enough time to trigger firing (1500ms interval by default)
      enemySystem.update(1600, 1, enemies, player, enemyBullets);
      
      expect(enemyBullets.length).toBeGreaterThan(initialBulletCount);
      const bullet = enemyBullets[enemyBullets.length - 1];
      expect(bullet.vx).toBe(0); // Mines don't move horizontally
      expect(bullet.vy).toBe(0); // Mines don't move vertically
    });
  });
});
