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

import { World } from '../types';
import { Health, BossTag, BossAI, Weapon, SpeedStat } from '../components';
import { BOSS_DATA } from '../configs/bossData';
import { BossPhaseChangeEvent, PlaySoundEvent } from '../events';
import { pushEvent } from '../world';
import { EnemyWeaponId } from '../types';

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
    for (const [id, comps] of world.entities) {
        const bossTag = comps.find(BossTag.check) as BossTag | undefined;
        if (!bossTag) continue;

        const health = comps.find(Health.check) as Health | undefined;
        const bossAI = comps.find(BossAI.check) as BossAI | undefined;

        if (!health || !bossAI) continue;

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
    bossId: string,
    health: Health,
    bossAI: BossAI,
    comps: any[]
): void {
    const bossSpec = BOSS_DATA[bossId as keyof typeof BOSS_DATA];
    if (!bossSpec) return;

    // 计算当前血量百分比
    const hpPercent = health.hp / health.max;

    // 找到应该处于的阶段
    let targetPhase = 0;
    for (let i = 0; i < bossSpec.phases.length; i++) {
        if (hpPercent <= bossSpec.phases[i].threshold) {
            targetPhase = i;
            break;
        }
    }

    // 如果阶段变化，应用新阶段
    const previousPhase = bossPreviousPhases.get(entityId) ?? 0;
    if (targetPhase !== previousPhase && targetPhase !== bossAI.phase) {
        applyPhase(world, entityId, bossAI, targetPhase, bossSpec.phases[targetPhase], comps);
        bossPreviousPhases.set(entityId, targetPhase);
    }
}

/**
 * 应用新阶段
 */
function applyPhase(
    world: World,
    entityId: number,
    bossAI: BossAI,
    phaseIndex: number,
    phaseSpec: any,
    comps: any[]
): void {
    // 更新 Boss AI 阶段
    bossAI.phase = phaseIndex;

    // 生成阶段切换事件
    pushEvent(world, {
        type: 'BossPhaseChange',
        phase: phaseIndex + 1, // 阶段从 1 开始显示
        bossId: entityId
    } as BossPhaseChangeEvent);

    // 播放阶段切换音效
    pushEvent(world, {
        type: 'PlaySound',
        name: 'boss_phase_change'
    } as PlaySoundEvent);

    // 应用阶段属性修正
    applyPhaseModifiers(comps, phaseSpec);
}

/**
 * 应用阶段属性修正
 */
function applyPhaseModifiers(comps: any[], phaseSpec: any): void {
    const modifiers = phaseSpec.modifiers || {};

    // 应用速度修正
    const speedStat = comps.find(SpeedStat.check) as SpeedStat | undefined;
    if (speedStat && modifiers.moveSpeed) {
        speedStat.maxLinear *= modifiers.moveSpeed;
    }

    // 应用武器切换
    if (phaseSpec.weaponId) {
        const weapon = comps.find(Weapon.check) as Weapon | undefined;
        if (weapon) {
            // 这里需要根据 weaponId 切换武器
            // 简化处理：更新武器配置
            // 实际项目中可能需要从 WEAPON_TABLE 获取新武器配置
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
