/**
 * 掉落系统 (LootSystem)
 *
 * 职责：
 * - 监听 KillEvent（敌人死亡）
 * - 根据敌人的 DropTable 组件进行随机掉落
 * - 生成拾取物实体到场景中
 *
 * 系统类型：结算层
 * 执行顺序：P5 - 在交互层之后
 */

import { World, EntityId } from '../types';
import { DropTable, Transform } from '../components';
import { spawnPickup } from '../factory';
import { PickupId } from '../types/ids';
import { PICKUP_REGISTRY } from '../configs/droptables';
import { KillEvent, PickupEvent } from '../events';
import { pushEvent } from '../world';

/**
 * 保底掉落配置
 */
interface GuaranteedDropConfig {
    enabled: boolean;
    timer: number;           // 毫秒
    lastDropTime: number;    // 上次掉落时间
}

/**
 * 保底掉落状态
 */
const guaranteedDropState: GuaranteedDropConfig = {
    enabled: false,
    timer: 30000,            // 默认30秒
    lastDropTime: 0
};

/**
 * 掉落系统主函数
 * @param world 世界对象
 * @param dt 时间增量（秒）
 */
export function LootSystem(world: World, dt: number): void {
    // 更新保底掉落计时
    updateGuaranteedDropTimer(world, dt * 1000);

    // 收集本帧的所有死亡事件
    const killEvents = world.events.filter(e => e.type === 'Kill') as KillEvent[];

    if (killEvents.length === 0) return;

    // 处理每个死亡事件
    for (const event of killEvents) {
        handleEntityDeath(world, event);
    }
}

/**
 * 处理实体死亡
 */
function handleEntityDeath(world: World, event: KillEvent): void {
    const { victim: entityId } = event;
    const entityComps = world.entities.get(entityId);

    if (!entityComps) return;

    // 查找 DropTable 组件
    const dropTable = entityComps.find(c => c instanceof DropTable) as DropTable | undefined;
    const transform = entityComps.find(Transform.check) as Transform | undefined;

    if (!dropTable || !transform) return;

    // 检查是否需要保底掉落
    if (guaranteedDropState.enabled && shouldTriggerGuaranteedDrop()) {
        // 强制掉落（跳过随机，直接掉落）
        forceDrop(world, transform.x, transform.y);
        resetGuaranteedDropTimer();
        return;
    }

    // 正常随机掉落
    rollAndSpawnLoot(world, dropTable.table, transform.x, transform.y);
}

/**
 * 随机掉落算法
 */
function rollAndSpawnLoot(
    world: World,
    table: Array<{ item: string; weight: number; min?: number; max?: number }>,
    x: number,
    y: number
): void {
    if (!table || table.length === 0) return;

    // 1. 计算总权重
    let totalWeight = 0;
    for (const entry of table) {
        totalWeight += entry.weight;
    }

    if (totalWeight === 0) return;

    // 2. 随机取值
    const random = Math.random() * totalWeight;

    // 3. 查找命中项
    let selectedItem: { item: string; weight: number; min?: number; max?: number } | null = null;
    let currentWeight = 0;

    for (const entry of table) {
        currentWeight += entry.weight;
        if (random <= currentWeight) {
            selectedItem = entry;
            break;
        }
    }

    // 4. 处理生成
    if (selectedItem && selectedItem.item !== PickupId.NONE) {
        spawnPickupFromItem(world, selectedItem.item, x, y);

        // 更新保底掉落计时
        guaranteedDropState.lastDropTime = world.time;
    }
}

/**
 * 根据物品 ID 生成拾取物
 */
function spawnPickupFromItem(world: World, itemId: string, x: number, y: number): void {
    const blueprint = PICKUP_REGISTRY[itemId];

    if (!blueprint) {
        console.warn(`LootSystem: No blueprint found for ID '${itemId}'`);
        return;
    }

    // 稍微随机偏移位置
    const offsetX = (Math.random() - 0.5) * 20;
    const offsetY = (Math.random() - 0.5) * 20;

    spawnPickup(world, blueprint, x + offsetX, y + offsetY, 0);
}

/**
 * 强制掉落（保底）
 */
function forceDrop(world: World, x: number, y: number): void {
    // 掉落一个 POWER 或 HP
    const items = [PickupId.POWER, PickupId.HP];
    const itemId = items[Math.floor(Math.random() * items.length)];
    spawnPickupFromItem(world, itemId, x, y);
}

/**
 * 更新保底掉落计时器
 */
function updateGuaranteedDropTimer(world: World, dtMs: number): void {
    if (!guaranteedDropState.enabled) return;

    // 如果是首次启用，初始化计时器
    if (guaranteedDropState.lastDropTime === 0) {
        guaranteedDropState.lastDropTime = world.time;
    }
}

/**
 * 检查是否应该触发保底掉落
 */
function shouldTriggerGuaranteedDrop(): boolean {
    const now = Date.now();
    return (now - guaranteedDropState.lastDropTime) >= guaranteedDropState.timer;
}

/**
 * 重置保底掉落计时器
 */
function resetGuaranteedDropTimer(): void {
    guaranteedDropState.lastDropTime = Date.now();
}

/**
 * 启用保底掉落
 */
export function enableGuaranteedDrop(timerMs: number = 30000): void {
    guaranteedDropState.enabled = true;
    guaranteedDropState.timer = timerMs;
    guaranteedDropState.lastDropTime = Date.now();
}

/**
 * 禁用保底掉落
 */
export function disableGuaranteedDrop(): void {
    guaranteedDropState.enabled = false;
}

/**
 * 设置保底掉落时间
 */
export function setGuaranteedDropTimer(timerMs: number): void {
    guaranteedDropState.timer = timerMs;
}
