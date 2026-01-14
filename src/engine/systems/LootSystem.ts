import { PickupId, World } from '../types';
import { DropTable, Transform, PickupItem } from '../components';
import { PICKUP_REGISTRY } from '../configs/droptables';
import { spawnPickup } from '../factory';
import { KillEvent } from '../events';

export function LootSystem(world: World, dt: number) {
    for (const event of world.events) {
        if (event.type !== 'Kill') continue;
        const killEvt = event as unknown as KillEvent;
        const entityId = killEvt.victim;
        const entityComp = world.entities.get(entityId);
        if (!entityComp) continue;

        const dropTableComp = entityComp.find(c => c instanceof DropTable) as DropTable;
        const transformComp = entityComp.find(c => c instanceof Transform) as Transform;

        if (dropTableComp && transformComp) {
            rollAndSpawnLoot(world, dropTableComp.table, transformComp.x, transformComp.y);
        }
    }
}

function rollAndSpawnLoot(
    world: World,
    table: Array<{ item: string; weight: number; min?: number; max?: number }>,
    x: number,
    y: number
) {
    if (!table || table.length === 0) return;

    let totalWeight = 0;
    for (const entry of table) {
        totalWeight += entry.weight;
    }

    let random = Math.random() * totalWeight;

    let selectedItem = null;
    for (const entry of table) {
        random -= entry.weight;
        if (random <= 0) {
            selectedItem = entry;
            break;
        }
    }

    if (selectedItem && selectedItem.item !== PickupId.NONE) {
        const blueprint = PICKUP_REGISTRY[selectedItem.item];

        if (blueprint) {
            const min = selectedItem.min ?? 1;
            const max = selectedItem.max ?? 1;
            const count = Math.floor(Math.random() * (max - min + 1)) + min;

            for (let i = 0; i < count; i++) {
                const offsetX = (Math.random() - 0.5) * 20;
                const offsetY = (Math.random() - 0.5) * 20;

                spawnPickup(world, blueprint, x + offsetX, y + offsetY, 0);
            }
        } else {
            console.warn(`LootSystem: No blueprint found for ID '${selectedItem.item}'`);
        }
    }
}
