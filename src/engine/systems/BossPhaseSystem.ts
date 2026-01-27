/**
 * Boss阶段系统 (BossPhaseSystem)
 *
 * 职责：
 * - 监听 Boss 血量变化
 * - 根据血量阈值切换 Boss 阶段
 * - 生成 BossPhaseChangeEvent
 * - 应用阶段属性修正
 *
 * 系统类型：刷怪层
 * 执行顺序：P6 - 在 BossSystem 之前
 */

import { BossId, Component, World } from '../types';
import { Health, BossTag, BossAI, Weapon, SpeedStat, BossVisual } from '../components';
import { BOSS_DATA, BossPhaseSpec } from '../configs/bossData';
import { BossPhaseChangeEvent, PlaySoundEvent, BossSpecialEvent } from '../events';
import { pushEvent, view } from '../world';
import { ENEMY_WEAPON_TABLE } from '../blueprints/weapons';

/**
 * 记录每个 Boss 的上一阶段
 */
const bossPreviousPhases = new Map<number, number>();

/**
 * Boss 阶段系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function BossPhaseSystem(world: World, dt: number): void {
    // 收集所有 Boss 实体
    for (const [id, [bossTag, health, bossAI]] of view(world, [BossTag, Health, BossAI])) {
        const comps = world.entities.get(id);
        // 检查是否需要切换阶段
        checkPhaseTransition(world, id, bossTag.id, health, bossAI, comps);
    }
}

/**
 * 检查阶段切换
 */
function checkPhaseTransition(
    world: World,
    entityId: number,
    bossId: BossId,
    health: Health,
    bossAI: BossAI,
    comps: Component[]
): void {
    const bossSpec = BOSS_DATA[bossId];
    if (!bossSpec) return;

    // 计算当前血量百分比
    const hpPercent = health.hp / health.max;

    // 找到应该处于的阶段（从后往前遍历，找第一个满足条件的）
    let targetPhase = 0;
    for (let i = bossSpec.phases.length - 1; i >= 0; i--) {
        if (hpPercent <= bossSpec.phases[i].threshold) {
            targetPhase = i;
            break;
        }
    }

    // 如果阶段变化，应用新阶段
    if (targetPhase !== bossAI.phase) {
        applyPhaseModifiers(world, entityId, bossAI, targetPhase, bossSpec.phases[targetPhase], comps);
        bossPreviousPhases.set(entityId, targetPhase);
    }
}

/**
 * 应用阶段属性修正
 *
 * 实现内容：
 * - 速度修正器（覆盖模式，使用基础值120）
 * - 武器切换（从ENEMY_WEAPON_TABLE读取新武器配置）
 * - 伤害和射速修正器（应用到Weapon组件）
 * - 阶段颜色（应用到BossVisual组件）
 * - 特殊事件触发
 * - 武器冷却重置
 */
function applyPhaseModifiers(
    world: World,
    entityId: number,
    bossAI: BossAI,
    phaseIndex: number,
    phaseSpec: BossPhaseSpec,
    comps: Component[]
): void {
    // 1. 更新阶段索引
    bossAI.phase = phaseIndex;

    // 2. 生成阶段切换事件
    pushEvent(world, {
        type: 'BossPhaseChange',
        phase: phaseIndex + 1, // 阶段从1开始显示
        bossId: entityId
    } as BossPhaseChangeEvent);

    // 3. 播放阶段切换音效
    pushEvent(world, {
        type: 'PlaySound',
        name: 'boss_phase_change'
    } as PlaySoundEvent);

    // 4. 应用修正器
    const modifiers = phaseSpec.modifiers || {};

    // 速度修正（覆盖模式，使用基础值120）
    const speedStat = comps.find(SpeedStat.check);
    if (speedStat && modifiers.moveSpeed !== undefined) {
        speedStat.maxLinear = 120 * modifiers.moveSpeed; // 覆盖模式，不是累乘
    }

    // 武器切换
    if (phaseSpec.weaponId) {
        const weapon = comps.find(Weapon.check);
        if (weapon) {
            const newWeaponSpec = ENEMY_WEAPON_TABLE[phaseSpec.weaponId];
            if (newWeaponSpec) {
                // 应用新武器配置
                Object.assign(weapon, {
                    id: newWeaponSpec.id,
                    ammoType: newWeaponSpec.ammoType,
                    cooldown: newWeaponSpec.cooldown,
                    bulletCount: newWeaponSpec.bulletCount,
                    spread: newWeaponSpec.spread || 0,
                    pattern: newWeaponSpec.pattern,
                    curCD: 0, // 重置冷却时间
                    // 应用修正器
                    damageMultiplier: modifiers.damage || 1.0,
                    fireRateMultiplier: modifiers.fireRate || 1.0
                });
            }
        }
    }

    // 阶段颜色
    if (phaseSpec.phaseColor) {
        let visual = comps.find(BossVisual.check);
        if (!visual) {
            // 创建BossVisual组件
            visual = new BossVisual({ color: phaseSpec.phaseColor });
            comps.push(visual);
        } else {
            // 更新现有BossVisual组件
            visual.color = phaseSpec.phaseColor;
        }
    }

    // 特殊事件
    if (phaseSpec.specialEvents && phaseSpec.specialEvents.length > 0) {
        for (const eventName of phaseSpec.specialEvents) {
            pushEvent(world, {
                type: 'BossSpecialEvent',
                event: eventName,
                bossId: entityId,
                phase: phaseIndex
            });
        }
    }
}

/**
 * 重置 Boss 阶段状态
 */
export function resetBossPhases(): void {
    bossPreviousPhases.clear();
}

/**
 * 移除 Boss 的阶段记录
 */
export function removeBossPhase(entityId: number): void {
    bossPreviousPhases.delete(entityId);
}
