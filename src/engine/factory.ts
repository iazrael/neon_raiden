import { Blueprint } from './blueprints';
import { World, EntityId, Component, ComponentConstructor } from './types';
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
        const ComponentClass = Components[key] as ComponentConstructor;
        const comp = new ComponentClass(args);
        if (Components.Transform.check(comp)){
            // 动态注入出生点
            comp.x = x; comp.y = y;
        }
        comps.push(comp);
    }

    world.entities.set(id, comps);
    return id;
}


export function spawnPlayer(world: World, bp: Blueprint, x: number, y: number): EntityId {
    const id = spawnFromBlueprint(world, bp, x, y);
    world.playerId = id;
    return id;
}

export function spawnEnemy(world: World, bp: Blueprint, x: number, y: number): EntityId {
    const id = spawnFromBlueprint(world, bp, x, y, 'enemy');
    world.enemyCount++;
    return id;
}

export function spawnBoss(world: World, bp: Blueprint, x: number, y: number): EntityId {
    const id = spawnFromBlueprint(world, bp, x, y);
    return id;
}

export function spawnBullet(world: World, bp: Blueprint, x: number, y: number): EntityId {
    const id = spawnFromBlueprint(world, bp, x, y, 'bullet');
    return id;
}

export function spawnPickup(world: World, bp: Blueprint, x: number, y: number): EntityId {
    const id = spawnFromBlueprint(world, bp, x, y, 'pickup');
    return id;
}
