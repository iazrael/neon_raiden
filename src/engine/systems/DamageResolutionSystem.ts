/**
 * 伤害结算系统 (DamageResolutionSystem)
 *
 * 职责：
 * - 处理 HitEvent，计算并应用伤害
 * - 更新 Health 组件
 * - 处理持续伤害 (DOT)
 * - 处理死亡，生成 KillEvent
 * - 处理护盾 (Shield)
 *
 * 系统类型：结算层
 * 执行顺序：P5 - 在 CollisionSystem 之后
 */

import { EntityId } from '../types';
import { Health, Shield, DamageOverTime, DestroyTag, ScoreValue, Transform } from '../components';
import { HitEvent, KillEvent, BloodFogEvent, CamShakeEvent, PlaySoundEvent, BombExplodedEvent, EventTags } from '../events';
import { removeComponent, view, getEvents, World } from '../world';

/**
 * 伤害结算系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function DamageResolutionSystem(world: World, dt: number): void {
    // 处理所有 HitEvent
    const hitEvents = getEvents<HitEvent>(world, EventTags.Hit);

    for (const event of hitEvents) {
        applyDamage(world, event);
    }

    // 处理持续伤害 (DOT)
    processDamageOverTime(world, dt);

    // 处理炸弹爆炸事件
    const bombEvents = getEvents<BombExplodedEvent>(world, EventTags.BombExploded);
    for (const event of bombEvents) {
        handleBombExplosion(world, event);
    }
}

/**
 * 应用伤害
 */
function applyDamage(world: World, event: HitEvent): void {
    const victimComps = world.entities.get(event.victim);
    if (!victimComps) return;

    // 检查是否已销毁（避免重复伤害）
    const hasDestroyTag = victimComps.some(DestroyTag.check);
    if (hasDestroyTag) return; // 已销毁，跳过伤害

    // 获取护盾组件
    const shield = victimComps.find(Shield.check);

    // 获取生命值组件
    const health = victimComps.find(Health.check);

    if (!health) return;

    let remainingDamage = event.damage;

    // 先扣除护盾
    if (shield && shield.value > 0) {
        if (shield.value >= remainingDamage) {
            shield.value -= remainingDamage;
            remainingDamage = 0;
        } else {
            remainingDamage -= shield.value;
            shield.value = 0;
        }
    }

    // 扣除生命值
    if (remainingDamage > 0) {
        health.hp -= remainingDamage;

        // 生成飙血特效事件
        const bloodFogEvent: BloodFogEvent = {
            type: 'BloodFog',
            pos: event.pos,
            level: event.bloodLevel,
            duration: 300
        };
        world.events.push(bloodFogEvent);

        // 生成相机震动事件（根据伤害等级）
        if (event.bloodLevel >= 2) {
            const shakeEvent: CamShakeEvent = {
                type: 'CamShake',
                intensity: event.bloodLevel * 3,
                duration: 200
            };
            world.events.push(shakeEvent);
        }

        // 生成音效事件
        const soundEvent: PlaySoundEvent = {
            type: 'PlaySound',
            name: 'hit'
        };
        world.events.push(soundEvent);
    }

    // 检查死亡
    if (health.hp <= 0) {
        handleDeath(world, event.victim, event.owner, event.pos);
    }
}

/**
 * 处理持续伤害 (DOT)
 */
function processDamageOverTime(world: World, dt: number): void {
    for (const [id, [dot], comps] of view(world, [DamageOverTime])) {
        // 更新 DOT
        const shouldDamage = dot.tick(dt);
        if (shouldDamage) {
            // 应用 DOT 伤害
            const transform = comps.find(Transform.check);
            const health = comps.find(Health.check);

            if (health && transform) {
                health.hp -= dot.damagePerSecond * dot.interval / 1000;

                // 检查死亡
                if (health.hp <= 0) {
                    handleDeath(world, id, 0, { x: transform.x, y: transform.y });
                }
            }
        }
        // 检查 DOT 是否结束
        if (dot.isFinished()) {
            removeComponent(world, id, dot);
        }
    }
}

/**
 * 处理死亡
 */
function handleDeath(world: World, victimId: EntityId, killerId: EntityId, pos: { x: number; y: number }): void {
    const victimComps = world.entities.get(victimId);
    if (!victimComps) return;

    // 获取分数值
    const scoreValue = victimComps.find(ScoreValue.check);
    const score = scoreValue?.value ?? 100;

    // 生成 KillEvent
    const killEvent: KillEvent = {
        type: 'Kill',
        pos,
        victim: victimId,
        killer: killerId,
        score
    };
    world.events.push(killEvent);

    // 播放死亡音效
    const soundEvent: PlaySoundEvent = {
        type: 'PlaySound',
        name: 'explosion'
    };
    world.events.push(soundEvent);

    // 添加销毁标记
    const hasDestroyTag = victimComps.some(DestroyTag.check);
    if (!hasDestroyTag) {
        victimComps.push(new DestroyTag({ reason: 'killed' }));
    }
}

/**
 * 处理炸弹爆炸 - 对所有敌人造成致命伤害
 */
function handleBombExplosion(world: World, event: BombExplodedEvent): void {
    // 遍历所有实体，找到敌人
    for (const [enemyId, comps] of world.entities) {
        // 检查是否是敌人（有 EnemyTag 组件）
        const hasEnemyTag = comps.some(c =>
            c.constructor.name === 'EnemyTag' ||
            (c as any).id?.startsWith?.('ENEMY_')
        );

        if (!hasEnemyTag) continue;

        // 获取敌人的生命值组件
        const health = comps.find(Health.check);
        if (!health) continue;

        // 造成致命伤害（直接扣完所有血量）
        const maxHp = health.max || 100;
        const hitEvent: HitEvent = {
            type: 'Hit',
            pos: { x: 0, y: 0 },
            damage: maxHp * 2,  // 造成200%最大生命值的伤害，确保击杀
            owner: event.playerId,
            victim: enemyId,
            bloodLevel: 3  // 最大飙血等级
        };
        world.events.push(hitEvent);
    }
}
