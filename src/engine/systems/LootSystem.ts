import { PickupId, World} from '../types';
import { DropTable, Transform ,PickupItem} from '../components';
import { PICKUP_REGISTRY } from '../configs/droptables';
import { spawnPickup } from '../factory';
import { KillEvent } from '../events';
/**
 * 掉落系统
 * 监听带有DestroyTag且具有DropTable组件的实体
 * 根据掉落表生成相应的PickupItem实体
 */
// export function LootSystem(w: World, dt: number) {
//   // TODO: 实现掉落系统逻辑
//   // 监听带有DestroyTag且具有DropTable组件的实体
//   // 根据掉落表生成相应的PickupItem实体
// }


export function LootSystem(world: World) {
    // 遍历本帧所有事件
    for (const event of world.events) {
        // 只处理死亡事件
        if (event.type !== 'Kill') continue;
        const killEvt = event as KillEvent;
        const entityId = killEvt.victim;
        const entityComp = world.entities.get(entityId);
        if (!entityComp) continue;

        // 1. 查找该实体是否有 DropTable 组件
        // 注意：这里假设你有一个 helper 或者直接遍历查找
        const dropTableComp = entityComp.find(c => c instanceof DropTable) as DropTable;
        const transformComp = entityComp.find(c => c instanceof Transform) as Transform;

        if (dropTableComp && transformComp) {
            rollAndSpawnLoot(world, dropTableComp.table, transformComp.x, transformComp.y);
        }
    }
}

/** 核心掉落算法 */
function rollAndSpawnLoot(
    world: World, 
    table: Array<{ item: string; weight: number; min?: number; max?: number }>, 
    x: number, 
    y: number
) {
    if (!table || table.length === 0) return;

    // 1. 计算总权重
    let totalWeight = 0;
    for (const entry of table) {
        totalWeight += entry.weight;
    }

    // 2. 随机取值
    let random = Math.random() * totalWeight;

    // 3. 查找命中项
    let selectedItem = null;
    for (const entry of table) {
        random -= entry.weight;
        if (random <= 0) {
            selectedItem = entry;
            break;
        }
    }

    // 4. 处理生成
    if (selectedItem && selectedItem.item !== PickupId.NONE) {
        const blueprint = PICKUP_REGISTRY[selectedItem.item];
        
        if (blueprint) {
            // 计算掉落数量 (默认为 1)
            const min = selectedItem.min ?? 1;
            const max = selectedItem.max ?? 1;
            const count = Math.floor(Math.random() * (max - min + 1)) + min;

            for (let i = 0; i < count; i++) {
                // 如果掉落多个，稍微打散一下位置
                const offsetX = (Math.random() - 0.5) * 20;
                const offsetY = (Math.random() - 0.5) * 20;
                
                spawnPickup(world, blueprint, x + offsetX, y + offsetY);
            }
        } else {
            console.warn(`LootSystem: No blueprint found for ID '${selectedItem.item}'`);
        }
    }
}