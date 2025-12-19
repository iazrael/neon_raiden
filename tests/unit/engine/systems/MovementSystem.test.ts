import { createWorld } from '@/engine/world';
import { MovementSystem } from '@/engine/systems/MovementSystem';
import { Transform, MoveIntent, SpeedStat } from '@/engine/components';

describe('MovementSystem', () => {
  let world: any;

  beforeEach(() => {
    world = createWorld();
    world.width = 800;
    world.height = 600;
  });

  test('should move entity with velocity intent', () => {
    const entityId = 1;
    world.entities.set(entityId, [
      new Transform({ x: 100, y: 100 }),
      new MoveIntent({ dx: 1, dy: 0, type: 'velocity' }),
      new SpeedStat({ maxLinear: 200, maxAngular: 2 })
    ]);

    // 模拟1秒的时间差
    MovementSystem(world, 1000);

    const comps = world.entities.get(entityId)!;
    const transform = comps.find((c: any) => c instanceof Transform);

    // 应该移动200像素 (200px/s * 1s)
    expect(transform.x).toBe(300);
    expect(transform.y).toBe(100);
  });

  test('should move entity with offset intent', () => {
    const entityId = 1;
    world.entities.set(entityId, [
      new Transform({ x: 100, y: 100 }),
      new MoveIntent({ dx: 50, dy: -30, type: 'offset' }),
      new SpeedStat({ maxLinear: 200, maxAngular: 2 })
    ]);

    MovementSystem(world, 1000);

    const comps = world.entities.get(entityId)!;
    const transform = comps.find((c: any) => c instanceof Transform);

    // 应该直接应用偏移量
    expect(transform.x).toBe(150);
    expect(transform.y).toBe(70);
  });

  test('should respect world boundaries', () => {
    const entityId = 1;
    world.entities.set(entityId, [
      new Transform({ x: 790, y: 100 }),
      new MoveIntent({ dx: 1, dy: 0, type: 'velocity' }),
      new SpeedStat({ maxLinear: 200, maxAngular: 2 })
    ]);

    // 模拟1秒，应该被边界阻挡
    MovementSystem(world, 1000);

    const comps = world.entities.get(entityId)!;
    const transform = comps.find((c: any) => c instanceof Transform);

    // 不应该超出边界（假设实体宽度为20）
    expect(transform.x).toBeLessThanOrEqual(800 - 10);
  });

  test('should remove MoveIntent after processing', () => {
    const entityId = 1;
    world.entities.set(entityId, [
      new Transform({ x: 100, y: 100 }),
      new MoveIntent({ dx: 1, dy: 0, type: 'velocity' }),
      new SpeedStat({ maxLinear: 200, maxAngular: 2 })
    ]);

    MovementSystem(world, 1000);

    const comps = world.entities.get(entityId)!;
    const moveIntent = comps.find((c: any) => c instanceof MoveIntent);

    // MoveIntent应该被移除（单帧组件）
    expect(moveIntent).toBeUndefined();
  });
});