import { Blueprint } from './blueprints';
import { World, EntityId, Component } from './types';
import { AmmoType } from './types/ids';
import { addComponent, generateId, getFromPool } from './world';
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
        const comp = new ComponentCtor(args);
        if (Components.Transform.check(comp)) {
            // 动态注入出生点
            comp.x = x;
            comp.y = y;
            comp.rot = rot;
        }
        comps.push(comp);
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
    return id;
}

export function spawnBoss(world: World, bp: Blueprint, x: number, y: number, rot: number): EntityId {
    const id = spawnFromBlueprint(world, bp, x, y, rot);

    // 初始化Boss相关组件
    const bossComps = world.entities.get(id);
    if (bossComps) {
        // 确保Boss有必要的组件
        const bossTag = bossComps.find(c => c instanceof Components.BossTag) as Components.BossTag;
        if (bossTag) {
            // 初始化Boss AI组件
            let bossAI = bossComps.find(c => c instanceof Components.BossAI) as Components.BossAI;
            if (!bossAI) {
                bossAI = new Components.BossAI({ phase: 1, nextPatternTime: 0 });
                bossComps.push(bossAI);
            }

            // 初始化Boss移动意图组件
            let moveIntent = bossComps.find(c => c instanceof Components.MoveIntent) as Components.MoveIntent;
            if (!moveIntent) {
                moveIntent = new Components.MoveIntent({ dx: 0, dy: 0, type: 'velocity' });
                bossComps.push(moveIntent);
            }

            // 初始化Boss开火意图组件
            let fireIntent = bossComps.find(c => c instanceof Components.FireIntent) as Components.FireIntent;
            if (!fireIntent) {
                fireIntent = new Components.FireIntent({ firing: false });
                bossComps.push(fireIntent);
            }

            // 确保Boss有武器组件
            let weapon = bossComps.find(c => c instanceof Components.Weapon) as Components.Weapon;
            if (!weapon) {
                // 如果蓝图中没有武器组件，添加默认武器
                weapon = new Components.Weapon({
                    id: 'boss_default' as any,
                    ammoType: AmmoType.ENEMY_ORB_GREEN,
                    cooldown: 1000,
                    level: 1
                });
                bossComps.push(weapon);
            }

            // 确保Boss有速度状态组件
            let speedStat = bossComps.find(c => c instanceof Components.SpeedStat) as Components.SpeedStat;
            if (!speedStat) {
                speedStat = new Components.SpeedStat({ maxLinear: 120, maxAngular: 2 });
                bossComps.push(speedStat);
            }
        }
    }

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
