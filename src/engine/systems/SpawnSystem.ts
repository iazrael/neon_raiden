/**
 * 刷怪系统 (SpawnSystem)
 *
 * 职责：
 * - 使用"刷怪点数"机制生成敌人
 * - 根据关卡配置动态调整刷怪节奏
 * - 使用正弦波实现"张弛有度"的刷怪节奏
 * - 性能保护：限制单帧最大刷怪数和同屏敌人数量
 *
 * 系统类型：刷怪层
 * 执行顺序：P6 - 在结算层之后
 */

import { World } from '../types';
import { LEVEL_CONFIGS } from '../configs/levels';
import { spawnEnemy, spawnBoss } from '../factory';
import { BossTag } from '../components';
import { EnemyId } from '../types';
import { ENEMIES_TABLE } from '../blueprints/enemies';
import { BOSSES_TABLE } from '../blueprints/bosses';

/**
 * 敌人池项
 */
interface EnemyPoolItem {
    id: EnemyId;
    cost: number;
    weight: number;
}

/**
 * 根据权重随机选择敌人
 */
function pickEnemyByWeight(pool: EnemyPoolItem[]): EnemyPoolItem | null {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight === 0) return null;

    let random = Math.random() * totalWeight;
    for (const item of pool) {
        random -= item.weight;
        if (random <= 0) return item;
    }
    return pool[pool.length - 1];
}

/**
 * 获取随机生成位置（在屏幕上方）
 */
function getRandomSpawnPos(world: World): { x: number; y: number } {
    const margin = 50;
    return {
        x: margin + Math.random() * (world.width - margin * 2),
        y: -50 // 从屏幕上方生成
    };
}

/**
 * 刷怪系统主函数
 * @param world 世界对象
 * @param dt 时间增量（秒）
 */
export function SpawnSystem(world: World, dt: number): void {
    const config = LEVEL_CONFIGS[world.level];
    if (!config) return;

    // ==============================
    // 1. 发工资 (Income Phase)
    // ==============================
    // 使用正弦波模拟"张弛有度"的刷怪节奏
    const timeFactor = (Math.sin(world.time * 0.3) + 1) / 2; // 0.0 ~ 1.0 之间波动
    const waveMultiplier = 0.5 + (1.5 * timeFactor); // 在 0.5倍 ~ 2.0倍之间波动

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

    // 检查是否需要刷 Boss
    if (shouldSpawnBoss(world)) {
        doSpawnBoss(world, config.boss);
        return;
    }

    // 只要还有钱，就尝试刷怪
    const maxAttempts = 5; // 限制单帧最大刷怪数
    const maxEnemies = 50; // 性能保护：同屏最大敌人数量

    let attempts = 0;
    while (attempts < maxAttempts && world.enemyCount < maxEnemies) {
        attempts++;

        // A. 随机挑一个怪
        const enemyProto = pickEnemyByWeight(config.enemyPool);
        if (!enemyProto) break;

        // B. 买得起吗？
        if (world.spawnCredits >= enemyProto.cost) {
            // C. 找到对应蓝图
            const blueprint = ENEMIES_TABLE[enemyProto.id];
            if (!blueprint) {
                console.warn(`SpawnSystem: No blueprint found for enemy ID '${enemyProto.id}'`);
                continue;
            }

            // D. 成交！刷怪
            world.spawnCredits -= enemyProto.cost;
            const pos = getRandomSpawnPos(world);
            spawnEnemy(world, blueprint, pos.x, pos.y, 0);

        } else {
            // 买不起最便宜的怪，就跳出循环存钱
            break;
        }
    }
}

/**
 * Boss 刷怪计时器状态
 */
interface BossSpawnState {
    timer: number;
    spawned: boolean;
}

const bossSpawnState: BossSpawnState = {
    timer: 0,
    spawned: false
};

/**
 * Boss 出现时间（秒）
 */
const BOSS_SPAWN_TIME = 60; // 60秒后Boss出现

/**
 * 检查是否需要刷 Boss
 */
function shouldSpawnBoss(world: World): boolean {
    if (bossSpawnState.spawned) return false;

    // 检查场上是否已有 Boss
    for (const [id, comps] of world.entities) {
        const bossTag = comps.find(BossTag.check);
        if (bossTag) return false;
    }

    // 时间到了，刷 Boss (使用配置的时间或默认 60 秒)
    const spawnTime = bossSpawnState.timer > 0 ? bossSpawnState.timer : BOSS_SPAWN_TIME;
    if (world.time >= spawnTime) {
        bossSpawnState.spawned = true;
        return true;
    }

    return false;
}

/**
 * 刷 Boss
 */
function doSpawnBoss(world: World, bossId: string): void {
    const blueprint = BOSSES_TABLE[bossId as keyof typeof BOSSES_TABLE];
    if (!blueprint) {
        console.warn(`SpawnSystem: No blueprint found for Boss ID '${bossId}'`);
        return;
    }

    // 在屏幕上方中央生成 Boss
    const x = world.width / 2;
    const y = -150;
    spawnBoss(world, blueprint, x, y, 0);
}

/**
 * 重置 Boss 刷怪状态（用于关卡切换）
 */
export function resetBossSpawnState(): void {
    bossSpawnState.timer = 0;
    bossSpawnState.spawned = false;
}

/**
 * 设置 Boss 出现时间
 */
export function setBossSpawnTime(time: number): void {
    // 修改 BOSS_SPAWN_TIME 常量的效果需要持久化到状态中
    bossSpawnState.timer = time;
}
