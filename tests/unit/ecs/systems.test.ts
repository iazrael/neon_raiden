import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { runECSTests, quickTestSystem } from '@/game/utils/ECSTests';

describe('ECS System Tests', () => {
  let world: World;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    // 创建测试环境
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.border = '2px solid #333';
    canvas.style.backgroundColor = '#000';
    document.body.appendChild(canvas);
    
    ctx = canvas.getContext('2d')!;
    world = require('@/game/types/world').createWorld();
    world.width = 800;
    world.height = 600;
    
    // 添加测试实体
    require('@/game/factory').spawnPlayer(world, 400, 500);
    require('@/game/factory').spawnEnemy(world, 200, 100, 'normal' as any);
    require('@/game/factory').spawnBullet(world, 400, 450, 0, -10, 10, 'player' as any);
  });

  afterEach(() => {
    // 清理测试环境
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    world = null!;
    ctx = null!;
  });

  describe('ECS Core Functionality', () => {
    it('should create world and entities', () => {
      expect(world.entities.size).toBeGreaterThan(0);
      expect(world.player).toBeDefined();
      expect(world.components.positions.size).toBe(3);
      expect(world.components.renders.size).toBe(3);
      expect(world.components.colliders.size).toBe(3);
    });

    it('should run all ECS tests successfully', () => {
      const result = runECSTests();
      expect(result).toBe(true);
    });
  });

  describe('Individual System Tests', () => {
    it('should test render system', () => {
      const result = quickTestSystem('render');
      expect(result).toBe(true);
    });

    it('should test input system', () => {
      const result = quickTestSystem('input');
      expect(result).toBe(true);
    });

    it('should test collision system', () => {
      const result = quickTestSystem('collision');
      expect(result).toBe(true);
    });

    it('should test audio system', () => {
      const result = quickTestSystem('audio');
      expect(result).toBe(true);
    });
  });
});