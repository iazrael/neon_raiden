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

import { World, EntityId } from '../types';
import { Health, Shield, DamageOverTime, DestroyTag, ScoreValue } from '../components';
import { HitEvent, KillEvent, BloodFogEvent, CamShakeEvent, PlaySoundEvent } from '../events';

/**
 * 伤害结算系统主函数
 * @param world 世界对象
 * @param dt 时间增量（秒）
 */
export function DamageResolutionSystem(world: World, dt: number): void {
    // 处理所有 HitEvent
    const hitEvents = world.events.filter((e): e is HitEvent => e.type === 'Hit');

    for (const event of hitEvents) {
        applyDamage(world, event);
    }

    // 处理持续伤害 (DOT)
    processDamageOverTime(world, dt);
}

/**
 * 应用伤害
 */
function applyDamage(world: World, event: HitEvent): void {
    const victimComps = world.entities.get(event.victim);
    if (!victimComps) return;

    // 获取护盾组件
    const shield = victimComps.find(c => c instanceof Shield) as Shield | undefined;

    // 获取生命值组件
    const health = victimComps.find(c => c instanceof Health) as Health | undefined;

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
            duration: 0.3
        };
        world.events.push(bloodFogEvent);

        // 生成相机震动事件（根据伤害等级）
        if (event.bloodLevel >= 2) {
            const shakeEvent: CamShakeEvent = {
                type: 'CamShake',
                intensity: event.bloodLevel * 3,
                duration: 0.2
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
    for (const [id, comps] of world.entities) {
        const dots = comps.filter(c => c instanceof DamageOverTime) as DamageOverTime[];

        for (const dot of dots) {
            // 检查 DOT 是否结束
            if (dot.isFinished()) {
                const idx = comps.indexOf(dot);
                if (idx !== -1) comps.splice(idx, 1);
                continue;
            }

            // 更新 DOT
            const shouldDamage = dot.tick(dt);

            if (shouldDamage) {
                // 应用 DOT 伤害
                const transform = comps.find(c => c.constructor.name === 'Transform') as { x: number; y: number } | undefined;
                const health = comps.find(c => c instanceof Health) as Health | undefined;

                if (health && transform) {
                    health.hp -= dot.damagePerSecond * dot.interval;

                    // 检查死亡
                    if (health.hp <= 0) {
                        handleDeath(world, id, 0, { x: transform.x, y: transform.y });
                    }
                }
            }
        }

        // 清理已结束的 DOT
        const finishedDots = comps.filter(c => c instanceof DamageOverTime && (c as DamageOverTime).isFinished());
        for (const dot of finishedDots) {
            const idx = comps.indexOf(dot);
            if (idx !== -1) comps.splice(idx, 1);
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
    const scoreValue = victimComps.find(c => c instanceof ScoreValue) as ScoreValue | undefined;
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
    const hasDestroyTag = victimComps.some(c => c instanceof DestroyTag);
    if (!hasDestroyTag) {
        victimComps.push(new DestroyTag({ reason: 'killed' }));
    }
}
