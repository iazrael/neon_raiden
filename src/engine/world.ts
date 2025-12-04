import { World, EntityId, Component, ComponentType } from './types';
import { Event } from './events';

// ========== 世界与工具 ==========

export function createWorld(): World {
    return {
        entities: new Map(),
        events: [],
        score: 0,
        level: 1,        // 关卡序号
        playerId: 0,
        playerLevel: 1,  // 战机等级
        difficulty: 1    // 动态倍率
    };
}

// ========== ID 生成器 ==========

let nextId = 1;
const recycled: number[] = [];
export function generateId(): EntityId {
    return recycled.pop() ?? nextId++;
}
export function freeId(id: EntityId) {
    recycled.push(id);
}

// ========== 视图迭代器 ==========
/**
 * Creates a view over the world's entities, filtering by component type.
 * @param w The world to view.
 * @param types The component types to filter by.
 * @returns An iterable of [EntityId, Component[]] pairs.
 */

export function* view<T extends ComponentType[]>(w: World, types: T): Iterable<[EntityId, InstanceType<T[number]>[]]> {
    for (const [id, comps] of w.entities) {
        const bucket: any[] = [];
        for (const T of types) {
            const found = comps.find(c => c instanceof T);
            if (!found) break;
            bucket.push(found);
        }
        if (bucket.length === types.length) yield [id, bucket] as const;
    }
}

// ========== 添加组件 ==========
export function addComponent<T extends Component>(w: World, id: EntityId, comp: T) {
    if (!w.entities.has(id)) w.entities.set(id, []);
    w.entities.get(id)!.push(comp);
}

// ========== 删除实体 ==========
export function removeEntity(w: World, id: EntityId) {
    w.entities.delete(id);
}

// ========== 事件推送 ==========
export function pushEvent(w: World, event: Event) {
    w.events.push(event);
}