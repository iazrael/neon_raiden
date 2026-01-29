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

import { BossId, World, EntityId } from '../types';
import { EnemyPoolItem, LEVEL_CONFIGS } from '../configs/levels';
import { spawnEnemy, spawnBoss } from '../factory';
import { BossTag, Health, ScoreValue, Weapon } from '../components';
import { EnemyId } from '../types';
import { ENEMIES_TABLE } from '../blueprints/enemies';
import { BOSSES_TABLE } from '../blueprints/bosses';
import { view } from '../world';
import { getEnemyStats } from '../configs/enemyGrowth';


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
        // y轴也随机一下，避免总是同一高度生成
        y: -50 + Math.random() * 50 // 从屏幕上方生成
    };
}

/**
 * 应用敌人关卡成长属性（内部辅助函数）
 * @param world 世界对象
 * @param enemyId 敌人实体ID
 * @param enemyType 敌人类型
 */
function applyEnemyGrowth(world: World, enemyId: EntityId, enemyType: EnemyId): void {
    // 获取关卡成长后的属性
    const stats = getEnemyStats(enemyType, world.level);

    // 获取敌人组件数组
    const comps = world.entities.get(enemyId);
    if (!comps) {
        console.warn(`[applyEnemyGrowth] Enemy ${enemyId} not found`);
        return;
    }

    // 1. 更新血量
    const health = comps.find(Health.check);
    if (health) {
        health.hp = stats.hp;
        health.max = stats.hp;
    }

    // 2. 更新武器成长倍率（让 WeaponSystem 使用这些倍率）
    const weapon = comps.find(Weapon.check);
    if (weapon) {
        weapon.damageMultiplier = stats.damageMultiplier;
        weapon.fireRateMultiplier = stats.fireRateMultiplier;
    }

    // 3. 添加击杀分数组件
    comps.push(new ScoreValue({value: stats.score}));
}

/**
 * 刷敌人（封装创建、成长应用、点数扣除）
 * @param world 世界对象
 * @param enemyType 敌人类型
 * @param cost 消费点数
 * @param pos 生成位置
 */
function doSpawnEnemy(
    world: World,
    enemyType: EnemyId,
    cost: number,
    pos: { x: number; y: number }
): void {

    // 1. 获取蓝图
    const blueprint = ENEMIES_TABLE[enemyType];
    if (!blueprint) {
        console.warn(`doSpawnEnemy: No blueprint found for '${enemyType}'`);
        return;
    }

    // 2. 创建敌人
    const enemyId = spawnEnemy(world, blueprint, pos.x, pos.y, 0);

    // 3. 应用关卡成长
    applyEnemyGrowth(world, enemyId, enemyType);

    // 4. 扣除点数
    world.spawnCredits -= cost;

    // 5. 日志
    // console.log(`Spawned enemy '${enemyType}' costing ${cost} credits, remaining: ${world.spawnCredits.toFixed(2)} born at (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`);
}

/**
 * 概率保留函数 - 避免刷"便宜货"，强制系统存钱买贵的
 */
function shouldAffordEnemy(cost: number, credits: number, cap: number): boolean {
    // 如果余额超过上限的 70%，就不再保留
    if (credits >= cap * 0.7) return true;

    // 如果是便宜货（成本低于上限的 30%），有概率拒绝
    if (cost < cap * 0.3) {
        // 基于成本比例决定拒绝概率：越便宜，拒绝概率越高
        const rejectionProbability = 0.3 + (cap * 0.3 - cost) / cap * 0.4;
        return Math.random() >= rejectionProbability;
    }

    return true;
}

/**
 * 刷怪系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function SpawnSystem(world: World, dt: number): void {
    const config = LEVEL_CONFIGS[world.level];
    if (!config) return;

    // ==============================
    // 0. 初始化检查（开局赠送）
    // ==============================
    // 如果是第一次运行，赠送初始点数
    if (!world.spawnInitialized) {
        world.spawnCredits = config.startingCredits;
        world.spawnInitialized = true;
        // console.log(`SpawnSystem: Initial bonus - ${config.startingCredits} credits`);
    }

    // ==============================
    // 1. 发工资 (Income Phase)
    // ==============================
    // 使用正弦波模拟"张弛有度"的刷怪节奏
    const timeFactor = (Math.sin(world.time) + 1) / 2; // 0.0 ~ 1.0 之间波动
    const waveMultiplier = 0.5 + (1.5 * timeFactor); // 在 0.5倍 ~ 2.0倍之间波动

    // dt 单位是毫秒，需要转换为秒
    const income = config.baseIncome * waveMultiplier * (dt / 1000);

    // 存入钱包，但不超过上限
    world.spawnCredits = Math.min(
        world.spawnCredits + income,
        config.creditCap
    );

    // ==============================
    // 2. 消费 (Spending Phase)
    // ==============================
    // 方案四：波次延迟 - 每 1 秒才能买一次（让钱有时间积累）
    world.spawnTimer += dt;
    if (world.spawnTimer < 1000) return; // dt 单位是毫秒
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

        // A. 从所有怪物池中按权重随机选择
        const enemyProto = pickEnemyByWeight(config.enemyPool);
        if (!enemyProto) break;

        // B. 方案一：概率保留 - 如果是便宜货，有概率拒绝
        if (!shouldAffordEnemy(enemyProto.cost, world.spawnCredits, config.creditCap)) {
            // 拒绝这个便宜货，选择继续存钱
            break;
        }

        // C. 检查买不买得起
        if (world.spawnCredits >= enemyProto.cost) {
            // D. 成交！刷怪（使用封装函数，包含创建、成长应用、点数扣除）
            const pos = getRandomSpawnPos(world);
            doSpawnEnemy(world, enemyProto.id, enemyProto.cost, pos);
        } else {
            // 买不起，跳出循环存钱
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
 * Boss 出现时间（毫秒）
 */
const BOSS_SPAWN_TIME = 60 * 1000; // 60秒后Boss出现

/**
 * 检查是否需要刷 Boss
 */
function shouldSpawnBoss(world: World): boolean {
    if (bossSpawnState.spawned) return false;

    // 检查场上是否已有 Boss
    for (const [id, [_]] of view(world, [ BossTag ])) {
        return false; // 已有 Boss，不刷新的
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
function doSpawnBoss(world: World, bossId: BossId): void {
    const blueprint = BOSSES_TABLE[bossId];
    if (!blueprint) {
        console.warn(`SpawnSystem: No blueprint found for Boss ID '${bossId}'`);
        return;
    }

    // 在屏幕上方中央生成 Boss
    const x = world.width / 2;
    const y = -150;
    spawnBoss(world, blueprint, x, y, 0);
    console.log(`Spawned Boss '${bossId}' at (${x}, ${y})`);
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
