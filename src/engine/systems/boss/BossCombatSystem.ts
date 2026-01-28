/**
 * Boss战斗系统
 *
 * 职责：
 * - 处理Boss的武器攻击逻辑
 * - 管理武器冷却
 * - 创建FireIntent组件供WeaponSystem使用
 * - 推送BossPhaseChangeEvent
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
 * - WeaponSystem: 消费FireIntent，发射子弹
 */

import { World, EntityId } from '../../types';
import { BossTag, BossAI, Weapon, FireIntent, BossEntrance } from '../../components';
import { pushEvent, view, addComponent } from '../../world';
import { BOSS_DATA, BossPhaseSpec } from '../../configs/bossData';

/**
 * Boss战斗系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function BossCombatSystem(world: World, dt: number): void {
    // 查询所有有BossTag、BossAI、Weapon的Boss
    for (const [id, comps] of view(world, [BossTag, BossAI, Weapon])) {
        const weapon = comps.find(Weapon.check)!;
        const bossAI = comps.find(BossAI.check)!;
        const bossTag = comps.find(BossTag.check)!;

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

        // 处理开火
        handleBossFiring(world, { id, weapon }, phaseSpec, dt);
    }
}

/**
 * 处理 Boss 开火
 *
 * @param world 世界对象
 * @param boss Boss对象
 * @param phaseSpec 阶段配置
 * @param dt 时间增量
 */
function handleBossFiring(
    world: World,
    boss: { id: EntityId; weapon?: Weapon },
    phaseSpec: BossPhaseSpec,
    dt: number
): void {
    if (!boss.weapon) return;

    // 检查武器冷却
    if (boss.weapon.curCD > 0) {
        boss.weapon.curCD -= dt * (phaseSpec.modifiers.fireRate || 1);
        return;
    }

    // 开火
    const comps = world.entities.get(boss.id);
    if (comps) {
        // 检查是否已有开火意图
        const hasFireIntent = comps.some(FireIntent.check);
        if (!hasFireIntent) {
            addComponent(world, boss.id, new FireIntent({ firing: true }));
        }
    }

    // 重置冷却
    boss.weapon.curCD = boss.weapon.cooldown / (phaseSpec.modifiers.fireRate || 1);
}
