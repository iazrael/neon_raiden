import { Blueprint } from './blueprints';
import { BossAI, BossTag, BossEntrance, EnemyTag, Transform, FireIntent, MoveIntent, SpeedStat, Sprite, Weapon } from './components';
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

    // 初始化Boss相关组件
    const bossComps = world.entities.get(id);
    if (bossComps) {
        // 确保Boss有必要的组件
        const bossTag = bossComps.find(BossTag.check);
        if (bossTag) {
            // 初始化Boss AI组件
            let bossAI = bossComps.find(BossAI.check);
            if (!bossAI) {
                bossAI = new BossAI({ phase: 0, nextPatternTime: 0 }); // 修复：初始化为0（0-based索引）
                bossComps.push(bossAI);
            }

            // 初始化Boss移动意图组件
            let moveIntent = bossComps.find(MoveIntent.check);
            if (!moveIntent) {
                moveIntent = new MoveIntent({ dx: 0, dy: 0, type: 'velocity' });
                bossComps.push(moveIntent);
            }

            // 初始化Boss开火意图组件
            let fireIntent = bossComps.find(FireIntent.check);
            if (!fireIntent) {
                fireIntent = new FireIntent({ firing: false });
                bossComps.push(fireIntent);
            }

            // 确保Boss有武器组件
            let weapon = bossComps.find(Weapon.check);
            if (!weapon) {
                // 如果蓝图中没有武器组件，添加默认武器
                weapon = new Weapon({
                    id: 'boss_default' as any,
                    ammoType: AmmoType.ENEMY_ORB_GREEN,
                    cooldown: 1000,
                    level: 1
                });
                bossComps.push(weapon);
            }

            // 确保Boss有速度状态组件
            let speedStat = bossComps.find(SpeedStat.check);
            if (!speedStat) {
                speedStat = new SpeedStat({ maxLinear: 120, maxAngular: 2 });
                bossComps.push(speedStat);
            }

            // 添加Boss入场状态组件（使Boss快速进入可视区域）
            const entrance = new BossEntrance({
                targetY: 150,      // 可视区域顶部
                entranceSpeed: 150 // 快速向下移动（150像素/秒）
            });
            bossComps.push(entrance);
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
