/**
 * Boss战斗系统
 *
 * 职责：
 * - 处理Boss的武器攻击逻辑
 * - 创建FireIntent组件供WeaponSystem使用
 *
 * 注意：冷却管理由WeaponSystem统一处理，本系统只负责创建开火意图
 *
 * 系统类型：决策层
 * 执行顺序：P1.7 - 在BossMovementSystem之后
 *
 * 依赖组件：
 * - Input: BossTag, BossAI, Weapon, FireIntent
 * - Output: FireIntent, BossPhaseChangeEvent
 *
 * 与其他系统的关系：
 * - BossEntranceSystem: 并行执行（Boss入场时也能开火）
 * - BossMovementSystem: 并行执行，各司其职
 * - WeaponSystem: 消费FireIntent，发射子弹并管理冷却
 */

import { World, EntityId, Component } from '../../types';
import { BossTag, BossAI, Weapon, FireIntent, BossEntrance } from '../../components';
import { pushEvent, view, addComponent } from '../../world';
import { BOSS_DATA } from '../../configs/bossData';

/**
 * Boss战斗系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function BossCombatSystem(world: World, dt: number): void {
    // 查询所有有BossTag、BossAI、Weapon的Boss
    for (const [id, [bossTag, bossAI, weapon], comps] of view(world, [BossTag, BossAI, Weapon])) {

        // 获取Boss配置
        const bossSpec = BOSS_DATA[bossTag.id];
        if (!bossSpec) {
            console.error(`Boss配置不存在: ${bossTag.id}`);
            continue;
        }

        const phaseSpec = bossSpec.phases[bossAI.phase];
        if (!phaseSpec) {
            console.error(`Boss阶段不存在: phase=${bossAI.phase}`);
            continue;
        }

        // 诊断日志：检查Boss武器状态
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[BossCombatSystem] Boss ${bossTag.id} (entity ${id}): phase=${bossAI.phase}, curCD=${weapon.curCD}, cooldown=${weapon.cooldown}, firing=${comps.some(FireIntent.check)}`);
        }

        // 处理开火
        handleBossFiring(world, comps, { id, weapon });
    }
}

/**
 * 处理 Boss 开火
 *
 * 注意：冷却管理由WeaponSystem统一处理，本系统只负责创建开火意图
 * 武器冷却完成后，WeaponSystem会消费FireIntent并发射子弹
 *
 * @param world 世界对象
 * @param comps 组件数组
 * @param boss Boss对象
 */
function handleBossFiring(
    world: World,
    comps: Component[],
    boss: { id: EntityId; weapon?: Weapon }
): void {
    if (!boss.weapon) return;

    // 检查是否已有开火意图（避免重复创建）
    const hasFireIntent = comps.some(FireIntent.check);
    if (hasFireIntent) {
        return; // 已有待处理的开火意图，跳过
    }

    // 创建开火意图（WeaponSystem会在武器冷却完成后发射子弹）
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[BossCombatSystem] Boss ${boss.id}: 创建FireIntent`);
    }
    addComponent(world, boss.id, new FireIntent({ firing: true }));
}
