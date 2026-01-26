import { World, createWorld } from '../types/world';
import { EntityType } from '@/types';
import { spawnPlayer, spawnEnemy, spawnBullet } from '../factory';
import { ECSTestSuite } from '../utils/ECSTestSuite';
import { RenderSystem } from '../systems-ecs/RenderSystem';
import { InputSystem } from '../systems-ecs/InputSystem';
import { CollisionSystem } from '../systems-ecs/CollisionSystem';
import { AudioSystem } from '../systems-ecs/AudioSystem';

// 创建测试用的Canvas
function createTestCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  canvas.style.border = '2px solid #333';
  canvas.style.backgroundColor = '#000';
  return canvas;
}

// 创建测试用的World
function createTestWorld(): World {
  const world = createWorld();
  world.width = 800;
  world.height = 600;
  
  // 添加玩家
  spawnPlayer(world, 400, 500);
  
  // 添加敌人
  spawnEnemy(world, 200, 100, 'normal' as any);
  
  // 添加子弹
  spawnBullet(world, 400, 450, 0, -10, 10, 'player' as any);
  
  return world;
}

// 主测试函数
export function runECSTests(): boolean {
  console.log('🧪 Starting ECS System Tests...\n');
  
  const canvas = createTestCanvas();
  const ctx = canvas.getContext('2d')!;
  const world = createTestWorld();
  
  const testSuite = new ECSTestSuite();
  
  // 运行所有测试
  const allPassed = testSuite.runAllTests(world, ctx);
  
  // 打印详细报告
  testSuite.printReport();
  
  // 清理
  canvas.remove();
  
  console.log('\n🧪 ECS Tests completed');
  return allPassed;
}

// 快速测试单个系统
export function quickTestSystem(systemName: string): boolean {
  const canvas = createTestCanvas();
  const ctx = canvas.getContext('2d')!;
  const world = createTestWorld();
  const testSuite = new ECSTestSuite();
  
  let result = false;
  
  switch (systemName.toLowerCase()) {
    case 'render':
      result = testSuite.testSpriteRendering(world, ctx);
      break;
    case 'input':
      result = testSuite.testInputControl(world);
      break;
    case 'collision':
      result = testSuite.testCollisionDetection(world);
      break;
    case 'audio':
      result = testSuite.testAudioSystem(world);
      break;
    default:
      console.log(`❌ Unknown test system: ${systemName}`);
      return false;
  }
  
  testSuite.printReport();
  canvas.remove();
  
  return result;
}

// 导出测试函数
export { runECSTests, quickTestSystem };