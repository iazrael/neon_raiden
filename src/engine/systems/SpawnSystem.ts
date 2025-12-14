import { ENEMIES_TABLE } from '../blueprints';
import { LEVEL_CONFIGS } from '../configs/levels';
import { spawnEnemy } from '../factory';
import { World } from '../types';
import { getRandomSpawnPos, pickEnemyByWeight } from '../utils/random';

/**
 * 生成系统
 * 根据游戏进度生成敌人和Boss实体
 * 控制刷怪节奏和Boss战时机
 */
// export function SpawnSystem(w: World, dt: number) {
//   // TODO: 实现生成系统逻辑
//   // 根据游戏进度生成敌人和Boss实体
//   // 控制刷怪节奏和Boss战时机
// }

export function SpawnSystem(world: World, dt: number) {
  const config = LEVEL_CONFIGS[world.level];

  // ==============================
  // 1. 发工资 (Income Phase)
  // ==============================

  // 进阶技巧：使用正弦波模拟“张弛有度”
  // Math.sin 的周期决定了波次间隔 (例如每 20秒 一波高潮)
  const timeFactor = (Math.sin(world.time * 0.3) + 1) / 2; // 0.0 ~ 1.0 之间波动
  const waveMultiplier = 0.5 + (1.5 * timeFactor); // 在 0.5倍 ~ 2.0倍 之间波动

  const income = config.baseIncome * waveMultiplier * dt;

  // 存入钱包，但不超过上限
  world.spawnCredits = Math.min(
    world.spawnCredits + income,
    config.creditCap
  );

  // ==============================
  // 2. 消费 (Spending Phase)
  // ==============================

  // 每 0.2 秒检查一次，避免每帧都计算
  world.spawnTimer += dt;
  if (world.spawnTimer < 0.2) return;
  world.spawnTimer = 0;

  // 只要还有钱，就尝试买怪
  // 限制单帧最大购买次数(比如 5次)，防止一瞬间卡顿
  let attempts = 0;
  while (attempts < 5) {
    attempts++;

    // A. 随机挑一个怪
    const enemyProto = pickEnemyByWeight(config.enemyPool);

    // B. 买得起吗？
    if (world.spawnCredits >= enemyProto.cost) {

      // C. 场上怪物是不是太多了？(性能保护)
      if (world.enemyCount >= 50) break;

      // D. 成交！
      world.spawnCredits -= enemyProto.cost;
      // 使用 getRandomSpawnPos 获取坐标
      const pos = getRandomSpawnPos();
      spawnEnemy(world, ENEMIES_TABLE[enemyProto.id], pos.x, pos.y, 0);
    } else {
      // 买不起当前随机到的这个，就跳出循环存钱
      // (或者可以尝试随机一个更便宜的)
      break;
    }
  }
}