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

import { World } from '../types';
import { Buff, Health, Shield, SpeedStat, Weapon, InvulnerableState } from '../components';
import { BuffType } from '../types';

/**
 * Buff效果处理器
 */
interface BuffHandler {
    apply(buff: Buff, comps: unknown[], dt: number): void;
}

/**
 * HP Buff - 恢复生命值
 */
const hpHandler: BuffHandler = {
    apply(buff: Buff, comps: unknown[], dt: number): void {
        const health = comps.find(Health.check) as Health | undefined;
        if (health) {
            // 持续恢复生命值
            const healAmount = buff.value * dt;
            health.hp = Math.min(health.hp + healAmount, health.max);
        }
    }
};

/**
 * POWER Buff - 增加武器伤害
 */
const powerHandler: BuffHandler = {
    apply(buff: Buff, comps: unknown[], dt: number): void {
        const weapons = comps.filter(c => c instanceof Weapon) as Weapon[];
        for (const weapon of weapons) {
            // 增加伤害倍率
            weapon.damageMultiplier = 1 + buff.value * 0.1;
        }
    }
};

/**
 * SPEED Buff - 增加移动速度
 */
const speedHandler: BuffHandler = {
    apply(buff: Buff, comps: unknown[], dt: number): void {
        const speedStat = comps.find(c => c instanceof SpeedStat) as SpeedStat | undefined;
        if (speedStat) {
            // 增加移动速度
            speedStat.maxLinear *= (1 + buff.value * 0.01);
        }
    }
};

/**
 * SHIELD Buff - 增加护盾值或恢复护盾
 */
const shieldHandler: BuffHandler = {
    apply(buff: Buff, comps: unknown[], dt: number): void {
        const shield = comps.find(Shield.check) as Shield | undefined;
        if (shield) {
            // 持续恢复护盾
            shield.regen = buff.value;
            shield.value = Math.min(shield.value + buff.value * dt, 100);
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
const invincibilityHandler: BuffHandler = {
    apply(buff: Buff, comps: unknown[], dt: number): void {
        // 检查是否已有无敌状态组件
        let invState = comps.find(InvulnerableState.check) as InvulnerableState | undefined;

        if (!invState && buff.remaining > 0) {
            // 添加无敌状态组件
            invState = new InvulnerableState({
                duration: buff.remaining * 1000,
                flashColor: '#ffff00' // 金色闪烁
            });
            comps.push(invState);
        }
    }
};

/**
 * RAPID_FIRE Buff - 增加射速
 */
const rapidFireHandler: BuffHandler = {
    apply(buff: Buff, comps: unknown[], dt: number): void {
        const weapons = comps.filter(c => c instanceof Weapon) as Weapon[];
        for (const weapon of weapons) {
            // 增加射速倍率
            weapon.fireRateMultiplier = 1 + buff.value * 0.05;
        }
    }
};

/**
 * PENETRATION Buff - 增加穿透
 */
const penetrationHandler: BuffHandler = {
    apply(buff: Buff, comps: unknown[], dt: number): void {
        const weapons = comps.filter(c => c instanceof Weapon) as Weapon[];
        for (const weapon of weapons) {
            // 增加穿透次数
            weapon.pierce += Math.floor(buff.value * 0.5);
        }
    }
};

/**
 * TIME_SLOW Buff - 时间减速（影响全局）
 */
const timeSlowHandler: BuffHandler = {
    apply(buff: Buff, comps: unknown[], dt: number): void {
        // 注意：timeSlowHandler 没有访问 world 的权限
        // 实际的 difficulty 修改将在 BuffSystem 主函数中处理
    }
};

/**
 * Buff处理器映射
 */
const BUFF_HANDLERS: Partial<Record<BuffType, BuffHandler>> = {
    [BuffType.HP]: hpHandler,
    [BuffType.POWER]: powerHandler,
    [BuffType.SPEED]: speedHandler,
    [BuffType.SHIELD]: shieldHandler,
    [BuffType.INVINCIBILITY]: invincibilityHandler,
    [BuffType.RAPID_FIRE]: rapidFireHandler,
    [BuffType.PENETRATION]: penetrationHandler,
    [BuffType.TIME_SLOW]: timeSlowHandler
};

/**
 * Buff系统主函数
 * @param world 世界对象
 * @param dt 时间增量（秒）
 */
export function BuffSystem(world: World, dt: number): void {
    // 遍历所有实体的 Buff 组件
    for (const [id, comps] of world.entities) {
        const buffs = comps.filter(c => c instanceof Buff) as Buff[];

        // 处理每个 Buff
        for (const buff of buffs) {
            // 更新 Buff 剩余时间
            buff.update(dt);

            // 应用 Buff 效果
            const handler = BUFF_HANDLERS[buff.type];
            if (handler) {
                handler.apply(buff, comps, dt);
            }
        }

        // 移除已结束的 Buff
        const finishedBuffs = comps.filter(c => c instanceof Buff && (c as Buff).isFinished());
        for (const buff of finishedBuffs) {
            const idx = comps.indexOf(buff);
            if (idx !== -1) {
                comps.splice(idx, 1);
            }

            // 如果是无敌状态结束，移除 InvulnerableState 组件
            if ((buff as Buff).type === BuffType.INVINCIBILITY) {
                const invState = comps.find(InvulnerableState.check);
                if (invState) {
                    const invIdx = comps.indexOf(invState);
                    if (invIdx !== -1) comps.splice(invIdx, 1);
                }
            }
        }
    }

    // 如果没有时间减速 buff，恢复游戏速度
    let hasTimeSlow = false;
    for (const comps of world.entities.values()) {
        if (comps.some(c => c instanceof Buff && (c as Buff).type === BuffType.TIME_SLOW)) {
            hasTimeSlow = true;
            break;
        }
    }

    if (!hasTimeSlow) {
        world.difficulty = 1;
    } else {
        world.difficulty = 0.5; // 有时间减速buff，降低游戏速度
    }
}
