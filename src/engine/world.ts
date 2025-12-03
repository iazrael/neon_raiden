import { EntityId, Component, ComponentType } from './types';

// ========== 世界与工具 ==========
export interface World {
    entities: Map<EntityId, Component[]>;
    playerId: EntityId;
}

export function createWorld(): World {
    return { entities: new Map(), playerId: 0 };
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
