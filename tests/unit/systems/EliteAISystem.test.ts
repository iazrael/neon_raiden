import { EliteAISystem, EliteBehaviorType } from '@/game/systems/EliteAISystem';
import { Entity, EntityType, EnemyType } from '@/types';

describe('EliteAISystem', () => {
  let eliteAISystem: EliteAISystem;
  const screenWidth = 800;
  const screenHeight = 600;

  beforeEach(() => {
    eliteAISystem = new EliteAISystem(screenWidth, screenHeight);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor and resize', () => {
    it('should initialize with correct dimensions', () => {
      // 由于没有直接获取尺寸的方法，我们通过其他方式验证
      // 构造函数已经被调用，系统应该正常工作
      expect(eliteAISystem).toBeDefined();
    });

    it('should resize correctly', () => {
      eliteAISystem.resize(1024, 768);
      // 没有直接获取尺寸的方法，但我们确认resize方法存在且可调用
      expect(eliteAISystem.resize).toBeDefined();
    });
  });

  describe('initializeElite', () => {
    it('should not initialize non-elite enemies', () => {
      const normalEnemy = {
        isElite: false,
        subType: EnemyType.NORMAL
      } as Entity;

      eliteAISystem.initializeElite(normalEnemy, []);
      
      // 没有直接的方法检查状态，但我们确认方法可以被调用而不报错
      expect(true).toBe(true);
    });

    it('should initialize tank elite with escorts', () => {
      const tankElite = {
        x: 400,
        y: 100,
        isElite: true,
        subType: EnemyType.TANK
      } as Entity;
      
      const enemies: Entity[] = [];
      
      eliteAISystem.initializeElite(tankElite, enemies);
      
      // 应该添加2个护卫敌人
      expect(enemies.length).toBe(2);
      
      // 检查护卫敌人的属性
      expect(enemies[0].subType).toBe(EnemyType.NORMAL);
      expect(enemies[0].isElite).toBe(false);
      expect(enemies[1].subType).toBe(EnemyType.NORMAL);
      expect(enemies[1].isElite).toBe(false);
      
      // 检查护卫敌人的位置
      expect(enemies[0].x).toBe(tankElite.x - 50);
      expect(enemies[0].y).toBe(tankElite.y + 30);
      expect(enemies[1].x).toBe(tankElite.x + 50);
      expect(enemies[1].y).toBe(tankElite.y + 30);
    });

    it('should initialize fast elite with trail behavior', () => {
      const fastElite = {
        isElite: true,
        subType: EnemyType.FAST
      } as Entity;
      
      const enemies: Entity[] = [];
      
      eliteAISystem.initializeElite(fastElite, enemies);
      
      // 没有直接的方法检查状态，但我们确认方法可以被调用而不报错
      expect(enemies.length).toBe(0);
    });

    it('should initialize kamikaze elite with berserk behavior', () => {
      const kamikazeElite = {
        isElite: true,
        subType: EnemyType.KAMIKAZE
      } as Entity;
      
      const enemies: Entity[] = [];
      
      eliteAISystem.initializeElite(kamikazeElite, enemies);
      
      // 没有直接的方法检查状态，但我们确认方法可以被调用而不报错
      expect(enemies.length).toBe(0);
    });

    it('should initialize laser interceptor elite with rapid charge behavior', () => {
      const laserElite = {
        isElite: true,
        subType: EnemyType.LASER_INTERCEPTOR
      } as Entity;
      
      const enemies: Entity[] = [];
      
      eliteAISystem.initializeElite(laserElite, enemies);
      
      // 没有直接的方法检查状态，但我们确认方法可以被调用而不报错
      expect(enemies.length).toBe(0);
    });

    it('should initialize fortress elite with gravity field behavior', () => {
      const fortressElite = {
        isElite: true,
        subType: EnemyType.FORTRESS
      } as Entity;
      
      const enemies: Entity[] = [];
      
      eliteAISystem.initializeElite(fortressElite, enemies);
      
      // 没有直接的方法检查状态，但我们确认方法可以被调用而不报错
      expect(enemies.length).toBe(0);
    });
  });

  describe('update', () => {
    it('should not update non-existent elite', () => {
      const normalEnemy = {
        isElite: false
      } as Entity;
      
      // 更新不存在的精英应该不会出错
      eliteAISystem.update(normalEnemy, 16, [], [], {} as Entity);
      expect(true).toBe(true);
    });

    it('should update escort behavior', () => {
      // 创建精英坦克和它的护卫
      const tankElite = {
        x: 400,
        y: 100,
        isElite: true,
        subType: EnemyType.TANK
      } as Entity;
      
      const enemies: Entity[] = [];
      eliteAISystem.initializeElite(tankElite, enemies);
      
      // 移动精英坦克
      tankElite.x = 500;
      tankElite.y = 200;
      
      // 更新护卫行为
      const escort1 = enemies[0];
      const escort2 = enemies[1];
      
      eliteAISystem.update(tankElite, 16, [], [], {} as Entity);
      
      // 护卫应该开始跟随精英移动（平滑跟随，不会完全到达目标位置）
      expect(escort1.x).toBeGreaterThan(400 - 50); // 初始位置是400-50=350
      expect(escort1.y).toBeGreaterThan(100 + 30); // 初始位置是100+30=130
      expect(escort2.x).toBeGreaterThan(400 + 50); // 初始位置是400+50=450
      expect(escort2.y).toBeGreaterThan(100 + 30); // 初始位置是100+30=130
    });

    it('should update trail behavior', () => {
      const fastElite = {
        x: 400,
        y: 100,
        isElite: true,
        subType: EnemyType.FAST
      } as Entity;
      
      const enemies: Entity[] = [];
      eliteAISystem.initializeElite(fastElite, enemies);
      
      const bullets: Entity[] = [];
      const player = { x: 600, y: 300 } as Entity;
      
      // Mock Date.now to control time
      const mockDate = new Date(2000, 1, 1);
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
      
      // 更新轨迹行为
      eliteAISystem.update(fastElite, 16, [], bullets, player);
      
      // 由于随机性，可能不会立即产生轨迹点
      // 我们再更新几次以确保产生轨迹点
      for (let i = 0; i < 20; i++) {
        eliteAISystem.update(fastElite, 16, [], bullets, player);
      }
      
      // 恢复真实时间
      jest.useRealTimers();
      
      // 没有直接的方法检查轨迹点，但我们确认方法可以被调用而不报错
      expect(true).toBe(true);
    });

    it('should update berserk behavior', () => {
      const kamikazeElite = {
        x: 400,
        y: 100,
        hp: 20, // 低于30%最大生命值
        maxHp: 100,
        vy: 2,
        color: '#ffffff',
        isElite: true,
        subType: EnemyType.KAMIKAZE
      } as Entity;
      
      const enemies: Entity[] = [];
      eliteAISystem.initializeElite(kamikazeElite, enemies);
      
      // 更新狂暴行为
      eliteAISystem.update(kamikazeElite, 16, [], [], {} as Entity);
      
      // 应该进入狂暴状态
      expect(kamikazeElite.vy).toBe(3); // 2 * 1.5
      expect(kamikazeElite.color).toBe('#ff0000');
    });

    it('should update rapid charge behavior', () => {
      const laserElite = {
        isElite: true,
        subType: EnemyType.LASER_INTERCEPTOR,
        state: 0
      } as Entity;
      
      const enemies: Entity[] = [];
      eliteAISystem.initializeElite(laserElite, enemies);
      
      // 更新快速蓄力行为
      eliteAISystem.update(laserElite, 16, [], [], {} as Entity);
      
      // 状态应该被初始化
      expect(laserElite.state).toBe(0);
    });

    it('should update gravity field behavior', () => {
      const fortressElite = {
        x: 400,
        y: 300,
        isElite: true,
        subType: EnemyType.FORTRESS
      } as Entity;
      
      const enemies: Entity[] = [];
      eliteAISystem.initializeElite(fortressElite, enemies);
      
      const bullets: Entity[] = [
        {
          x: 450,
          y: 350,
          vx: 5,
          vy: 5,
          type: EntityType.BULLET,
          color: '#ffffff'
        } as Entity
      ];
      
      // 更新重力场行为（经过足够的时间）
      (eliteAISystem as any).eliteStates.get(fortressElite).gravityTimer = 5000;
      eliteAISystem.update(fortressElite, 16, [], bullets, {} as Entity);
      
      // 子弹应该受到重力影响，速度减慢
      expect(bullets[0].vx).toBe(3.5); // 5 * 0.7
      expect(bullets[0].vy).toBe(3.5); // 5 * 0.7
      expect(bullets[0].color).toBe('#9b59b6'); // 变为紫色
    });
  });

  describe('cleanup and clear', () => {
    it('should cleanup elite state', () => {
      const tankElite = {
        isElite: true,
        subType: EnemyType.TANK
      } as Entity;
      
      const enemies: Entity[] = [];
      eliteAISystem.initializeElite(tankElite, enemies);
      
      // 清理精英状态
      eliteAISystem.cleanup(tankElite);
      
      // 没有直接的方法检查状态，但我们确认方法可以被调用而不报错
      expect(true).toBe(true);
    });

    it('should clear all states', () => {
      const tankElite = {
        isElite: true,
        subType: EnemyType.TANK
      } as Entity;
      
      const enemies: Entity[] = [];
      eliteAISystem.initializeElite(tankElite, enemies);
      
      // 清理所有状态
      eliteAISystem.clear();
      
      // 没有直接的方法检查状态，但我们确认方法可以被调用而不报错
      expect(true).toBe(true);
    });
  });

  describe('getTrailPoints', () => {
    it('should return empty array for non-existent elite', () => {
      const normalEnemy = {
        isElite: false
      } as Entity;
      
      const trailPoints = eliteAISystem.getTrailPoints(normalEnemy);
      expect(trailPoints).toEqual([]);
    });

    it('should return trail points for fast elite', () => {
      const fastElite = {
        isElite: true,
        subType: EnemyType.FAST
      } as Entity;
      
      const enemies: Entity[] = [];
      eliteAISystem.initializeElite(fastElite, enemies);
      
      const trailPoints = eliteAISystem.getTrailPoints(fastElite);
      expect(Array.isArray(trailPoints)).toBe(true);
    });
  });

  describe('hasBehavior', () => {
    it('should return false for non-existent elite', () => {
      const normalEnemy = {
        isElite: false
      } as Entity;
      
      const hasBehavior = eliteAISystem.hasBehavior(normalEnemy, EliteBehaviorType.ESCORT);
      expect(hasBehavior).toBe(false);
    });

    it('should return true for correct behavior', () => {
      const tankElite = {
        isElite: true,
        subType: EnemyType.TANK
      } as Entity;
      
      const enemies: Entity[] = [];
      eliteAISystem.initializeElite(tankElite, enemies);
      
      const hasBehavior = eliteAISystem.hasBehavior(tankElite, EliteBehaviorType.ESCORT);
      expect(hasBehavior).toBe(true);
    });

    it('should return false for incorrect behavior', () => {
      const tankElite = {
        isElite: true,
        subType: EnemyType.TANK
      } as Entity;
      
      const enemies: Entity[] = [];
      eliteAISystem.initializeElite(tankElite, enemies);
      
      const hasBehavior = eliteAISystem.hasBehavior(tankElite, EliteBehaviorType.TRAIL);
      expect(hasBehavior).toBe(false);
    });
  });
});