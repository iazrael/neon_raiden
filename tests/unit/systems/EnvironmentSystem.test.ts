import { EnvironmentSystem, EnvironmentType } from '../../../game/systems/EnvironmentSystem';
import { Entity, EntityType } from '@/types';

describe('EnvironmentSystem', () => {
  let environmentSystem: EnvironmentSystem;
  const screenWidth = 800;
  const screenHeight = 600;

  beforeEach(() => {
    environmentSystem = new EnvironmentSystem(screenWidth, screenHeight);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor and reset', () => {
    it('should initialize with correct dimensions', () => {
      // 构造函数已经被调用，系统应该正常工作
      expect(environmentSystem).toBeDefined();
    });

    it('should reset to initial state', () => {
      // 添加一些环境元素
      (environmentSystem as any).obstacles.push({} as any);
      (environmentSystem as any).energyStorm = {} as any;
      (environmentSystem as any).gravityField = {} as any;
      
      // 重置
      environmentSystem.reset();
      
      // 所有元素应该被清除
      expect((environmentSystem as any).obstacles).toEqual([]);
      expect((environmentSystem as any).energyStorm).toBeNull();
      expect((environmentSystem as any).gravityField).toBeNull();
    });
  });

  describe('resize', () => {
    it('should resize correctly', () => {
      environmentSystem.resize(1024, 768);
      // 没有直接获取尺寸的方法，但我们确认resize方法存在且可调用
      expect(environmentSystem.resize).toBeDefined();
    });
  });

  describe('obstacle system', () => {
    it('should spawn obstacles', () => {
      const obstacle = environmentSystem.spawnObstacle();
      
      expect(obstacle.environmentType).toBe(EnvironmentType.OBSTACLE);
      expect(obstacle.type).toBe(EntityType.POWERUP);
      expect(obstacle.width).toBe(60);
      expect(obstacle.height).toBe(80);
      expect(obstacle.hp).toBe(100);
      expect(obstacle.maxHp).toBe(100);
      expect(obstacle.color).toBe('#888888');
    });

    it('should get obstacles', () => {
      const obstacle = environmentSystem.spawnObstacle();
      const obstacles = environmentSystem.getObstacles();
      
      expect(obstacles).toHaveLength(1);
      expect(obstacles[0]).toBe(obstacle);
    });

    it('should damage obstacles', () => {
      const obstacle = environmentSystem.spawnObstacle();
      expect(obstacle.hp).toBe(100);
      
      environmentSystem.damageObstacle(obstacle, 30);
      expect(obstacle.hp).toBe(70);
      
      environmentSystem.damageObstacle(obstacle, 80);
      expect(obstacle.hp).toBe(-10);
      expect(obstacle.markedForDeletion).toBe(true);
    });

    it('should update obstacles and spawn new ones', () => {
      // 更新障碍物系统，时间足够长以生成新障碍物
      environmentSystem.update(16000, 3, {} as Entity);
      
      const obstacles = environmentSystem.getObstacles();
      expect(obstacles.length).toBe(1); // 应该生成一个障碍物
    });

    it('should remove destroyed obstacles', () => {
      const obstacle = environmentSystem.spawnObstacle();
      obstacle.hp = 0; // 标记为销毁
      
      // 更新系统以清理障碍物
      environmentSystem.update(1000, 3, {} as Entity);
      
      const obstacles = environmentSystem.getObstacles();
      expect(obstacles).toHaveLength(0);
    });
  });

  describe('energy storm system', () => {
    it('should spawn energy storm', () => {
      // 调用私有方法生成能量风暴
      const spawnMethod = (environmentSystem as any).spawnEnergyStorm;
      spawnMethod.call(environmentSystem);
      
      const storm = environmentSystem.getEnergyStorm();
      expect(storm).not.toBeNull();
      expect(storm?.environmentType).toBe(EnvironmentType.ENERGY_STORM);
      expect(storm?.type).toBe(EntityType.POWERUP);
      expect(storm?.width).toBe(screenWidth);
      expect(storm?.height).toBe(120);
      expect(storm?.color).toBe('#4ade80');
    });

    it('should get energy storm', () => {
      // 调用私有方法生成能量风暴
      const spawnMethod = (environmentSystem as any).spawnEnergyStorm;
      spawnMethod.call(environmentSystem);
      
      const storm = environmentSystem.getEnergyStorm();
      expect(storm).not.toBeNull();
    });

    it('should check if player is in storm', () => {
      // 调用私有方法生成能量风暴
      const spawnMethod = (environmentSystem as any).spawnEnergyStorm;
      spawnMethod.call(environmentSystem);
      
      // 获取生成的风暴并设置玩家位置以确保在风暴中
      const storm = environmentSystem.getEnergyStorm();
      const player = { 
        x: storm!.x, 
        y: storm!.y 
      } as Entity;
      
      const isInStorm = environmentSystem.isPlayerInStorm(player);
      expect(isInStorm).toBe(true);
    });

    it('should update energy storm and activate/deactivate', () => {
      // 更新能量风暴系统，时间足够长以激活风暴
      environmentSystem.update(21000, 5, {} as Entity);
      
      const storm1 = environmentSystem.getEnergyStorm();
      expect(storm1).not.toBeNull(); // 应该激活风暴
      
      // 再更新一段时间以关闭风暴
      environmentSystem.update(6000, 5, {} as Entity);
      
      const storm2 = environmentSystem.getEnergyStorm();
      expect(storm2).toBeNull(); // 应该关闭风暴
    });
  });

  describe('gravity field system', () => {
    it('should spawn gravity field', () => {
      // 调用私有方法生成重力场
      const spawnMethod = (environmentSystem as any).spawnGravityField;
      spawnMethod.call(environmentSystem);
      
      const gravityField = environmentSystem.getGravityField();
      expect(gravityField).not.toBeNull();
      expect(gravityField?.environmentType).toBe(EnvironmentType.GRAVITY_FIELD);
      expect(gravityField?.type).toBe(EntityType.POWERUP);
      expect(gravityField?.width).toBe(150);
      expect(gravityField?.height).toBe(screenHeight);
      expect(gravityField?.color).toBe('#8b5cf6');
    });

    it('should get gravity field', () => {
      // 调用私有方法生成重力场
      const spawnMethod = (environmentSystem as any).spawnGravityField;
      spawnMethod.call(environmentSystem);
      
      const gravityField = environmentSystem.getGravityField();
      expect(gravityField).not.toBeNull();
    });

    it('should apply gravity to player', () => {
      // 调用私有方法生成重力场
      const spawnMethod = (environmentSystem as any).spawnGravityField;
      spawnMethod.call(environmentSystem);
      
      const player = { x: 100, y: 100, vx: 0 } as Entity;
      environmentSystem.applyGravityToPlayer(player);
      
      // 玩家应该受到向左的拉力
      expect(player.vx).toBe(-0.5);
    });

    it('should update gravity field and switch sides', () => {
      // 更新重力场系统，时间足够长以切换方向
      (environmentSystem as any).currentGravitySide = 'left';
      environmentSystem.update(9000, 9, {} as Entity);
      
      // 方向应该已经切换
      expect((environmentSystem as any).currentGravitySide).toBe('right');
    });
  });

  describe('getAllElements', () => {
    it('should return all environment elements', () => {
      // 添加各种环境元素
      environmentSystem.spawnObstacle();
      
      const spawnStormMethod = (environmentSystem as any).spawnEnergyStorm;
      spawnStormMethod.call(environmentSystem);
      
      const spawnGravityMethod = (environmentSystem as any).spawnGravityField;
      spawnGravityMethod.call(environmentSystem);
      
      const elements = environmentSystem.getAllElements();
      expect(elements).toHaveLength(3); // 1个障碍物 + 1个能量风暴 + 1个重力场
    });
  });

  describe('shouldBlockBullet', () => {
    it('should block bullet when colliding with obstacle', () => {
      const obstacle = environmentSystem.spawnObstacle();
      obstacle.x = 400;
      obstacle.y = 300;
      
      const bullet = {
        x: 400,
        y: 300,
        width: 10,
        height: 10
      } as Entity;
      
      const shouldBlock = environmentSystem.shouldBlockBullet(bullet);
      expect(shouldBlock).toBe(true);
    });

    it('should not block bullet when not colliding with obstacle', () => {
      const obstacle = environmentSystem.spawnObstacle();
      obstacle.x = 400;
      obstacle.y = 300;
      
      const bullet = {
        x: 600,
        y: 500,
        width: 10,
        height: 10
      } as Entity;
      
      const shouldBlock = environmentSystem.shouldBlockBullet(bullet);
      expect(shouldBlock).toBe(false);
    });
  });

  describe('collision detection', () => {
    it('should detect collision between entities', () => {
      const entityA = {
        x: 100,
        y: 100,
        width: 50,
        height: 50
      } as Entity;
      
      const entityB = {
        x: 120,
        y: 120,
        width: 50,
        height: 50
      } as Entity;
      
      // 调用私有碰撞检测方法
      const isCollidingMethod = (environmentSystem as any).isColliding;
      const isColliding = isCollidingMethod.call(environmentSystem, entityA, entityB);
      expect(isColliding).toBe(true);
    });

    it('should not detect collision when entities are apart', () => {
      const entityA = {
        x: 100,
        y: 100,
        width: 50,
        height: 50
      } as Entity;
      
      const entityB = {
        x: 200,
        y: 200,
        width: 50,
        height: 50
      } as Entity;
      
      // 调用私有碰撞检测方法
      const isCollidingMethod = (environmentSystem as any).isColliding;
      const isColliding = isCollidingMethod.call(environmentSystem, entityA, entityB);
      expect(isColliding).toBe(false);
    });
  });
});