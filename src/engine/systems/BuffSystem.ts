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

import { Component, World } from '../types';
import { Buff, Health, Shield, InvulnerableState, SpeedModifier, EnemyTag } from '../components';
import { BuffType } from '../types';
import { removeComponent, view, addComponent } from '../world';

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
            // 持续恢复护盾（dt 是毫秒，需要转换为秒）
            shield.regen = buff.value;
            shield.value = Math.min(shield.value + buff.value * (dt / 1000), 100);
        } else if (buff.value > 0) {
            // 如果没有护盾组件，添加一个
            const Shield = require('../components/combat').Shield;
            comps.push(new Shield({ value: buff.value, regen: 0 }));
        }
    }
};

/**
 * INVINCIBILITY Buff - 无敌状态
 */
const invincibilityHandler: DurationBuffHandler = {
    update(buff: Buff, world: World, comps: Component[], dt: number): void {
        // 检查是否已有无敌状态组件
        let invState = comps.find(InvulnerableState.check);

        if (!invState && buff.remaining > 0) {
            // 添加无敌状态组件
            invState = new InvulnerableState({
                duration: buff.remaining * 1000,
                flashColor: '#ffff00' // 金色闪烁
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
    }
};

/**
 * TIME_SLOW Buff - 时间减速（影响敌人）
 *
 * 玩家拾取后，所有敌人移动速度降低 50%
 */
const timeSlowHandler: DurationBuffHandler = {
    update(buff: Buff, world: World, comps: Component[], dt: number): void {
        // 首次应用时，给所有敌人添加减速效果
        if (buff.originalValues.affectedEnemies === undefined) {
            buff.originalValues.affectedEnemies = [];

            // 遍历所有实体，找到敌人
            for (const [enemyId, enemyComps] of world.entities.entries()) {
                const enemyTag = enemyComps.find(EnemyTag.check);
                if (enemyTag) {
                    // 保存敌人的原始速度
                    const speedStat = enemyComps.find(c => c.constructor.name === 'SpeedStat');
                    if (speedStat && (speedStat as any).maxLinear) {
                        const originalSpeed = (speedStat as any).maxLinear;

                        // 添加 SpeedModifier 组件，降低敌人速度到 50%
                        addComponent(world, enemyId, new SpeedModifier({
                            maxLinearOverride: originalSpeed * 0.5,
                            duration: -1 // 持续到手动移除
                        }));

                        // 保存受影响的敌人 ID 和原始速度
                        buff.originalValues.affectedEnemies.push({
                            id: enemyId,
                            originalSpeed: originalSpeed
                        });
                    }
                }
            }
        }
    },

    onExpired(buff: Buff, world: World, comps: Component[]): void {
        // 移除所有敌人的减速效果
        if (buff.originalValues.affectedEnemies) {
            for (const { id } of buff.originalValues.affectedEnemies) {
                const enemyComps = world.entities.get(id);
                if (enemyComps) {
                    // 移除 SpeedModifier 组件
                    const speedModifier = enemyComps.find(SpeedModifier.check);
                    if (speedModifier) {
                        const idx = enemyComps.indexOf(speedModifier);
                        if (idx !== -1) {
                            enemyComps.splice(idx, 1);
                        }
                    }
                }
            }
            delete buff.originalValues.affectedEnemies;
        }
    }
};

/**
 * 持续效果 Buff 处理器映射表
 * 只包含需要持续更新的 Buff 类型
 */
const DURATION_BUFF_HANDLERS: Partial<Record<BuffType, DurationBuffHandler>> = {
    [BuffType.SHIELD]: shieldHandler,
    [BuffType.INVINCIBILITY]: invincibilityHandler,
    [BuffType.TIME_SLOW]: timeSlowHandler
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
