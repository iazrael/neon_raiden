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

import { World } from "../world";
import { Component } from "../types";
import { Buff, Health, Shield, InvulnerableState } from "../components";
import { BuffType } from "../types";
import { removeComponent, removeTypes, view } from "../world";

/**
 * 持续效果 Buff 处理器
 * 只处理需要在 Buff 持续期间更新效果的情况
 */
interface DurationBuffHandler {
    update(buff: Buff, world: World, comps: Component[], dt: number): void;
    onExpired?(buff: Buff, world: World, comps: Component[]): void;
}

/**
 * SHIELD Buff - 增加护盾值或恢复护盾
 */
const shieldHandler: DurationBuffHandler = {
    update(buff: Buff, world: World, comps: Component[], dt: number): void {
        const shield = comps.find(Shield.check);
        if (shield) {
            // 持续恢复护盾（buff.value 是每秒恢复量，dt 是毫秒）
            const recovery = (buff.value * dt) / 1000;
            shield.value = Math.min(shield.value + recovery, shield.max);
        }
    },
};

/**
 * INVINCIBILITY Buff - 无敌状态
 */
const invincibilityHandler: DurationBuffHandler = {
    update(buff: Buff, world: World, comps: Component[], dt: number): void {
        // 检查是否已有无敌状态组件
        let invState = comps.find(InvulnerableState.check);

        if (!invState && buff.remaining > 0) {
            // 添加无敌状态组件（buff.remaining 单位是毫秒）
            invState = new InvulnerableState({
                duration: buff.remaining,
                flashColor: "#ffff00", // 金色闪烁
            });
            comps.push(invState);
        }
    },

    onExpired(buff: Buff, world: World, comps: Component[]): void {
        // 移除无敌状态组件
        const invState = comps.find(InvulnerableState.check);
        if (invState) {
            const idx = comps.indexOf(invState);
            if (idx !== -1) {
                comps.splice(idx, 1);
            }
        }
    },
};

// /**
//  * TIME_SLOW Buff - 时间减速
//  */
// const timeSlowHandler: DurationBuffHandler = {
//     update(buff: Buff, world: World, comps: Component[], dt: number): void {
//         // 使用 view 查询 TimeSlow 实体
//         const timeSlowEntities = [...view(world, [TimeSlow])];
// TODO: 明天改造
//         if (timeSlowEntities.length > 0) {
//             // 存在 TimeSlow 实体: 应用减速
//             const [, [timeSlow]] = timeSlowEntities[0];

//             // 限制范围防止异常值
//             const safeScale = Math.max(0.1, Math.min(2.0, timeSlow.scale));
//             world.timeScale = safeScale;

//             // 生成时间减速线条特效
//             spawnLines(world, world.width, 20);
//         } else {
//             // ❗不存在 TimeSlow 实体: 重置为正常速度
//             world.timeScale = 1.0;

//             // 清除时间减速线条特效
//             clearLines(world);
//         }
//     },

//     onExpired(buff: Buff, world: World, comps: Component[]): void {
//         // ❗不存在 TimeSlow 实体: 重置为正常速度
//         world.timeScale = 1.0;
//     },
// };

/**
 * 持续效果 Buff 处理器映射表
 * 只包含需要持续更新的 Buff 类型
 */
const DURATION_BUFF_HANDLERS: Partial<Record<BuffType, DurationBuffHandler>> = {
    [BuffType.SHIELD]: shieldHandler,
    [BuffType.INVINCIBILITY]: invincibilityHandler,
    // [BuffType.TIME_SLOW]: timeSlowHandler,
};

/**
 * Buff系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function BuffSystem(world: World, dt: number): void {
    // 遍历所有实体的 Buff 组件
    for (const [id, [buff], comps] of view(world, [Buff])) {
        // 更新 Buff 剩余时间
        buff.update(dt);

        // 应用 Buff 效果
        const handler = DURATION_BUFF_HANDLERS[buff.type];
        if (handler) {
            handler.update(buff, world, comps, dt);
        }

        // 如果 Buff 过期，移除并调用 onExpired 钩子
        if (buff.isFinished()) {
            if (handler?.onExpired) {
                handler.onExpired(buff, world, comps);
            }
            removeComponent(world, id, buff);
        }
    }
}
