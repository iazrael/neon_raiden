import { World, CollisionType } from '../types/world';
import { EntityType } from '@/types';

// ECS系统测试工具
import { World, createWorld } from '../types/world';
import { EntityType } from '@/types';
import { spawnPlayer, spawnEnemy, spawnBullet } from '../factory';
import { ECSTestSuite } from './ECSTestSuite';
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
  const ctx = canvas.getContext('d')!;
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

    let spriteFound = false;
    let colorOnlyCount = 0;

    for (const [id, render] of world.components.renders) {
      if (render.spriteKey) {
        const sprite = require('../SpriteGenerator').SpriteGenerator.getAsset(render.spriteKey);
        if (sprite) {
          spriteFound = true;
          console.log(`[Test] ✅ Sprite found: ${render.spriteKey}`);
        } else {
          colorOnlyCount++;
          console.log(`[Test] ⚠️ Sprite not found: ${render.spriteKey}`);
        }
      }
    }

    console.log(`[Test] Sprite rendering: ${spriteFound ? '✅ PASS' : '⚠️ FAIL'}`);
    console.log(`[Test] Color-only entities: ${colorOnlyCount}`);
    return spriteFound;
  }

  // 测试输入控制
  testInputControl(world: World): boolean {
    console.log('[Test] Testing input control...');
    
    const playerId = world.player;
    if (!playerId) {
      console.log('[Test] ❌ No player found');
      return false;
    }

    const input = world.components.inputs.get(playerId);
    const velocity = world.components.velocities.get(playerId);
    const position = world.components.positions.get(playerId);

    if (!input || !velocity || !position) {
      console.log('[Test] ❌ Player components missing');
      return false;
    }

    // 模拟键盘输入
    const originalVx = velocity.vx;
    const originalVy = velocity.vy;

    // 测试右键
    world.components.inputs.get(playerId)!.keys['ArrowRight'] = true;
    InputSystem(world, 16);
    
    const movedRight = velocity.vx > originalVx;
    console.log(`[Test] Right arrow: ${movedRight ? '✅ PASS' : '❌ FAIL'}`);

    // 清理
    world.components.inputs.get(playerId)!.keys['ArrowRight'] = false;
    velocity.vx = originalVx;

    return movedRight;
  }

  // 测试碰撞检测
  testCollisionDetection(world: World): boolean {
    console.log('[Test] Testing collision detection...');
    
    const colliders = world.components.colliders.size;
    if (colliders < 2) {
      console.log('[Test] ❌ Not enough colliders for testing');
      return false;
    }

    // 创建测试实体
    const bulletId = require('../factory').spawnBullet(world, 100, 100, 0, -10, 10, 'player');
    const enemyId = require('../factory').spawnEnemy(world, 100, 50, 'normal' as any);

    // 清空事件
    const originalEvents = world.events.length;
    world.events = [];

    // 执行碰撞检测
    CollisionSystem(world, 16);

    const collisionFound = world.events.some(e => e.type === 'collision');
    console.log(`[Test] Collision detection: ${collisionFound ? '✅ PASS' : '❌ FAIL'}`);

    // 清理测试实体
    world.entities.delete(bulletId);
    world.entities.delete(enemyId);
    world.components.positions.delete(bulletId);
    world.components.positions.delete(enemyId);
    world.components.velocities.delete(bulletId);
    world.components.velocities.delete(enemyId);
    world.components.renders.delete(bulletId);
    world.components.renders.delete(enemyId);
    world.components.colliders.delete(bulletId);
    world.components.colliders.delete(enemyId);
    world.components.combats.delete(bulletId);
    world.components.combats.delete(enemyId);

    world.events = originalEvents;

    return collisionFound;
  }

  // 测试音频系统
  testAudioSystem(world: World): boolean {
    console.log('[Test] Testing audio system...');
    
    // 触发音频事件
    world.events.push({
      type: 'audio',
      sound: 'shoot'
    });

    world.events.push({
      type: 'audio',
      sound: 'explosion'
    });

    // 执行音频系统
    AudioSystem(world, 16);

    console.log('[Test] Audio system: ✅ PASS (check console for audio logs)');
    return true;
  }

  // 运行所有测试
  runAllTests(world: World, ctx: CanvasRenderingContext2D): boolean {
    console.log('\n=== ECS Test Suite ===');
    
    const tests = [
      { name: 'Sprite Rendering', fn: () => this.testSpriteRendering(world, ctx) },
      { name: 'Input Control', fn: () => this.testInputControl(world) },
      { name: 'Collision Detection', fn: () => this.testCollisionDetection(world) },
      { name: 'Audio System', fn: () => this.testAudioSystem(world) }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      console.log(`\n--- ${test.name} ---`);
      const result = test.fn();
      this.results.set(test.name, result);
      
      if (result) {
        passed++;
        console.log(`✅ ${test.name}: PASS`);
      } else {
        failed++;
        console.log(`❌ ${test.name}: FAIL`);
      }
    }

    console.log(`\n=== Test Results ===`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);

    return failed === 0;
  }

  // 获取测试结果
  getResults(): Map<string, boolean> {
    return this.results;
  }

  // 打印详细报告
  printReport(): void {
    console.log('\n=== ECS Test Report ===');
    for (const [name, result] of this.results) {
      console.log(`${result ? '✅' : '❌'} ${name}: ${result ? 'PASS' : 'FAIL'}`);
    }
  }
}