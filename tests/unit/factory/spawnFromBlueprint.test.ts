import { spawnFromBlueprint } from '@/src/engine/factory';
import { createWorld, pools } from '@/src/engine/world';
import type { World } from '@/src/engine/types';
import { Transform, Health } from '@/src/engine/components';
import { BLUEPRINT_FIGHTER_NEON } from '@/src/engine/blueprints';

// 测试蓝图数据
const mockBlueprint = {
  Transform: { x: 0, y: 0, rot: 0 },
  Health: { hp: 100, max: 100 }
};

describe('spawnFromBlueprint', () => {
  let world: World;

  beforeEach(() => {
    world = createWorld();
  });

  afterEach(() => {
    // 清理world中的所有实体
    world.entities.clear();
  });

  // 测试创建 player BLUEPRINT_FIGHTER_NEON
  test('should create player entity from blueprint', () => {
    const entityId = spawnFromBlueprint(world, BLUEPRINT_FIGHTER_NEON, 100, 200);

    // 验证实体创建成功
    expect(entityId).toBeDefined();
    expect(world.entities.has(entityId)).toBe(true);
    // 有 8 个组件
    expect(world.entities.get(entityId)!.length).toBe(8);
  });

  // 基础功能测试
  describe('basic functionality', () => {
    test('should create entity from blueprint', () => {
      const entityId = spawnFromBlueprint(world, mockBlueprint, 100, 200);

      // 验证返回的实体ID有效
      expect(entityId).toBeDefined();
      expect(typeof entityId).toBe('number');
      expect(entityId).toBeGreaterThan(0);

      // 验证实体已添加到world中
      expect(world.entities.has(entityId)).toBe(true);
    });

    test('should set entity position correctly', () => {
      const x = 150;
      const y = 250;
      const entityId = spawnFromBlueprint(world, mockBlueprint, x, y);

      // 获取创建的实体
      const components = world.entities.get(entityId);
      expect(components).toBeDefined();

      // 查找Transform组件
      const transformComponent = components!.find(component => component instanceof Transform);
      expect(transformComponent).toBeDefined();
      expect(transformComponent instanceof Transform).toBe(true);

      // 验证坐标被正确设置
      // 注意：在spawnFromBlueprint中，x和y参数会覆盖蓝图中的Transform组件的x和y值
      expect((transformComponent as Transform).x).toBe(x);
      expect((transformComponent as Transform).y).toBe(y);
    });


    test('should include all components from blueprint', () => {
      const entityId = spawnFromBlueprint(world, mockBlueprint, 100, 200);

      // 获取创建的实体
      const components = world.entities.get(entityId);
      expect(components).toBeDefined();

      // 验证包含Transform组件
      const transformComponent = components!.find(component => component instanceof Transform);
      expect(transformComponent).toBeDefined();

      // 验证包含Health组件
      const healthComponent = components!.find(component => component instanceof Health);
      expect(healthComponent).toBeDefined();
    });
  });

  // 对象池测试
  describe('object pooling', () => {
    test('should use object pool when specified', () => {
      // 使用对象池创建实体
      const entityId = spawnFromBlueprint(world, mockBlueprint, 100, 200, 'enemy');

      // 验证实体创建成功
      expect(entityId).toBeDefined();
      expect(world.entities.has(entityId)).toBe(true);
    });

    test('should create new component array when no pool specified', () => {
      // 不使用对象池创建实体
      const entityId = spawnFromBlueprint(world, mockBlueprint, 100, 200);

      // 验证实体创建成功
      expect(entityId).toBeDefined();
      expect(world.entities.has(entityId)).toBe(true);

      // 获取实体的组件
      const components = world.entities.get(entityId);
      expect(components).toBeDefined();
      expect(Array.isArray(components)).toBe(true);
    });
  });

  // 边界条件测试
  describe('edge cases', () => {
    test('should handle empty blueprint', () => {
      const emptyBlueprint = {};
      const entityId = spawnFromBlueprint(world, emptyBlueprint, 100, 200);

      // 验证实体创建成功
      expect(entityId).toBeDefined();
      expect(world.entities.has(entityId)).toBe(true);

      // 空蓝图应该创建没有组件的实体
      const components = world.entities.get(entityId);
      expect(components).toBeDefined();
      expect(components!.length).toBe(0);
    });

    test('should handle partial components in blueprint', () => {
      const partialBlueprint = {
        Transform: { x: 0, y: 0, rot: 0 }
        // 只有Transform组件，没有Health组件
      };

      const entityId = spawnFromBlueprint(world, partialBlueprint, 100, 200);

      // 验证实体创建成功
      expect(entityId).toBeDefined();
      expect(world.entities.has(entityId)).toBe(true);

      // 获取实体的组件
      const components = world.entities.get(entityId);
      expect(components).toBeDefined();

      // 应该只有Transform组件
      const transformComponent = components!.find(component => component instanceof Transform);
      expect(transformComponent).toBeDefined();

      const healthComponent = components!.find(component => component instanceof Health);
      expect(healthComponent).toBeUndefined();
    });
  });
});