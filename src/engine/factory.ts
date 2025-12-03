import { World, EntityId } from './types';
import { addComponent, generateId } from './world';

export let world: World;

export function setWorld(w: World) {
    world = w;
}

export function spawnPlayer(bp: any): EntityId {
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

export function spawnEnemy(bp: any, x: number, y: number): EntityId {
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