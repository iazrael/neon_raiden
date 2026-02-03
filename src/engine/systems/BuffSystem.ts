/**
 * Buff系统 (BuffSystem)
 *
 * 职责：
 * - 处理实体身上的 Buff 效果
 * - 更新 Buff 剩余时间
 * - 应用 Buff 效果到目标组件（生命值、速度、武器等）
 * - 移除过期的 Buff
 *
 * 系统类型：状态层
 * 执行顺序：P2 - 在决策层之后
 */

import { view, removeComponentFromComps, World, pushEvent } from "../world";
import { Component } from "../types";
import { Shield, InvulnerableState, ShieldAutoRegen, TimeSlowState, PlayerTag } from "../components";
import { TimeSlowEvent } from "../events";

/**
 * SHIELD Buff - 增加护盾值或恢复护盾
 */
function handleShieldRegen(world: World, dt: number, comps: Component[], shieldAutoRegen: ShieldAutoRegen): void {
    // 找到护盾组件
    const shield = comps.find(Shield.check);
    if (shield) {
        // 持续恢复护盾（buff.value 是每秒恢复量，dt 是毫秒）
        const recovery = (shieldAutoRegen.regenPerSecond * dt) / 1000;
        shield.value = Math.min(shield.value + recovery, shield.max);
    }
    // 更新buff时间
    shieldAutoRegen.duration -= dt;
    if (shieldAutoRegen.duration <= 0) {
        // 移除buff组件
        removeComponentFromComps(comps, shieldAutoRegen);
    }
}

/**
 * INVINCIBILITY Buff - 无敌状态
 */
function handleInvincibility(world: World, dt: number, comps: Component[], invState: InvulnerableState): void {
    // 更新时间
    invState.duration -= dt;
    // 如果时间过期，移除组件
    if (invState.duration <= 0) {
        // 移除buff组件
        removeComponentFromComps(comps, invState);
    }
}

/**
 * TIME_SLOW Buff - 时间减速
 */
function handleTimeSlow(world: World, dt: number, comps: Component[], timeSlow: TimeSlowState): void {
    // 更新时间
    timeSlow.duration -= dt;
    // 应用时间缩放
    // 限制范围防止异常值
    const safeScale = Math.max(0.1, Math.min(2.0, timeSlow.scale));
    const oldScale = world.timeScale;
    world.timeScale = safeScale;

    // 如果之前没有减速, 那就抛出一个 Start 事件
    if (!world.timeSlowActive) {
        pushEvent(world, {
            type: "TimeSlow",
            scale: safeScale,
            duration: timeSlow.duration,
            action: "start",
        });
    }
    world.timeSlowActive = true;

    // 如果时间过期，移除组件
    if (timeSlow.duration <= 0) {
        // 移除buff组件
        removeComponentFromComps(comps, timeSlow);
        // 重置时间缩放
        world.timeScale = 1.0;
        // 抛出一个 End 事件
        if (world.timeSlowActive) {
            pushEvent(world, {
                type: "TimeSlow",
                scale: safeScale,
                duration: timeSlow.duration,
                action: "end",
            });
        }
        world.timeSlowActive = false;
    }else{
        // 抛一个 TimeSlow 的更新事件
        pushEvent(world, {
            type: "TimeSlow",
            scale: safeScale,
            duration: timeSlow.duration,
            action: "update",
        });
    }
}

/**
 * Buff系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function BuffSystem(world: World, dt: number): void {
    // 更新无敌状态
    for (const [id, [invulnerableState], comps] of view(world, [InvulnerableState])) {
        // 更新无敌状态剩余时间
        handleInvincibility(world, dt, comps, invulnerableState);
    }
    // 更新护盾恢复buff
    for (const [id, [shieldRegen], comps] of view(world, [ShieldAutoRegen])) {
        handleShieldRegen(world, dt, comps, shieldRegen);
    }
    // 更新时间减缓buff, 时间减速只能玩家有
    for (const [id, [timeSlow, tag], comps] of view(world, [TimeSlowState, PlayerTag])) {
        handleTimeSlow(world, dt, comps, timeSlow);
    }
}
