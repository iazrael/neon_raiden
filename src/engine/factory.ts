import { Blueprint } from './blueprints';
import { BossAI, BossTag, BossEntrance, EnemyTag, Transform, FireIntent, MoveIntent, SpeedStat, Sprite, Weapon, Option } from './components';
import { EntityId, Component } from './types';
import { World, generateId, getFromPool } from './world';
import * as Components from './components';

/** 根据蓝图生成实体，支持对象池 */
export function spawnFromBlueprint(world: World, bp: Blueprint,
    x = 0, y = 0, rot = 0,
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
        const ComponentCtor = Components[key];
        if (!ComponentCtor) {
            console.error('[factory] Missing component constructor for key:', key);
            continue;
        }
        const comp = new ComponentCtor(args);
        if (Transform.check(comp)) {
            // 动态注入出生点
            comp.x = x;
            comp.y = y;
            comp.rot = rot;
        }
        comps.push(comp);
    }

    // 调试：如果是子弹，检查是否有 Sprite 组件
    if (pool === 'bullet') {
        const hasSprite = comps.some(Sprite.check);
        if (!hasSprite) {
            console.error('[factory] Bullet spawned without Sprite!', bp);
        }
    }

    world.entities.set(id, comps);
    return id;
}


export function spawnPlayer(world: World, bp: Blueprint, x: number, y: number, rot: number): EntityId {
    const id = spawnFromBlueprint(world, bp, x, y, rot);
    world.playerId = id;
    return id;
}

export function spawnEnemy(world: World, bp: Blueprint, x: number, y: number, rot: number): EntityId {
    const id = spawnFromBlueprint(world, bp, x, y, rot, 'enemy');
    world.enemyCount++;

    // 给敌人的移动添加随机相位偏移，避免同步摆动
    const enemyComps = world.entities.get(id);
    if (enemyComps) {
        const enemyTag = enemyComps.find(EnemyTag.check);
        if (enemyTag) {
            // 随机相位偏移：0-2000ms，让同类型敌人的摆动错开
            // 注意：这里设置的是 phaseOffset，不是 timer，避免影响攻击计时
            enemyTag.phaseOffset = Math.random() * 2000;
        }
    }

    return id;
}

export function spawnBoss(world: World, bp: Blueprint, x: number, y: number, rot: number): EntityId {
    const id = spawnFromBlueprint(world, bp, x, y, rot);
    return id;
}

export function spawnBullet(world: World, bp: Blueprint, x: number = 0, y: number = 0, rot: number = 0): EntityId {
    const id = spawnFromBlueprint(world, bp, x, y, rot, 'bullet');
    return id;
}

export function spawnPickup(world: World, bp: Blueprint, x: number, y: number, rot: number): EntityId {
    const id = spawnFromBlueprint(world, bp, x, y, rot, 'pickup');
    return id;
}

/**
 * 生成僚机实体
 * @param world World 实例
 * @param bp 僚机蓝图
 * @param index 僚机索引（0 或 1）
 * @param x 初始 X 坐标
 * @param y 初始 Y 坐标
 * @returns 僚机实体 ID
 */
export function spawnOption(world: World, bp: Blueprint, index: number, x: number, y: number): EntityId {
    const id = spawnFromBlueprint(world, bp, x, y, 0);

    // 设置僚机的索引
    const optionComps = world.entities.get(id);
    const option = optionComps?.find(Option.check);
    if (option) {
        option.index = index;
    }

    return id;
}
