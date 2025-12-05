import { Blueprint } from './blueprints';
import { World, EntityId, Component } from './types';
import { addComponent, generateId, getFromPool } from './world';
import * as Components from './components';

/** 根据蓝图生成实体，支持对象池 */
export function spawnFromBlueprint(world: World, bp: Blueprint,
    x = 0, y = 0,
    pool?: 'bullet' | 'enemy' | 'pickup'
): EntityId {
    const id = generateId();
    // 1. 拿数组（可能来自池）
    let comps: Component[];
    if (pool) {
        comps = getFromPool(pool);
    } else {
        comps = [];
    }

    // 2. 按蓝图 push 组件
    for (const [key, args] of Object.entries(bp)) {
        const Ctor = Components[key] as new (...a: any[]) => Component;
        if (key === 'Transform') {
            (args as [number, number, number])[0] = x;
        }
        comps.push(new Ctor(args));
    }

    world.entities.set(id, comps);
    return id;
}

// export function spawnPlayer(
//     world: World,
//     bp: Blueprint,
//     x: number,
//     y: number
// ): EntityId {
//     const id = generateId();
//     const comps = Object.values(bp).map((data) => cloneComponent(data)); // 深拷贝
//     const tr = comps.find(C.Transform.check)!;
//     tr.x = x; tr.y = y;                       // 动态注入出生点
//     world.entities.set(id, comps);
//     world.playerId = id;
//     return id;
// }

export function spawnPlayer(world: World, bp: any): EntityId {
    const id = generateId();
    if (bp.transform) addComponent(world, id, bp.transform);
    if (bp.health) addComponent(world, id, bp.health);
    if (bp.weapon) addComponent(world, id, bp.weapon);
    if (bp.sprite) addComponent(world, id, bp.sprite);
    if (bp.shield) addComponent(world, id, bp.shield);
    if (bp.velocity) addComponent(world, id, bp.velocity);

    world.playerId = id;
    return id;
}

export function spawnEnemy(world: World, bp: any, x: number, y: number): EntityId {
    const id = generateId();
    if (bp.transform) {
        const transform = { ...bp.transform, x, y };
        addComponent(world, id, transform);
    }
    if (bp.health) addComponent(world, id, bp.health);
    if (bp.weapon) addComponent(world, id, bp.weapon);
    if (bp.sprite) addComponent(world, id, bp.sprite);
    if (bp.shield) addComponent(world, id, bp.shield);
    if (bp.velocity) addComponent(world, id, bp.velocity);

    return id;
}