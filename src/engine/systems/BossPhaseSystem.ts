
import {
    BossAI,
    BossTag,
    Health,
    Transform,
    Weapon,
    InvulnerableState
} from '@/engine/components';
import { BOSS_DATA } from '@/engine/configs/bossData';
import { World } from '@/engine/types';
import { view, addComponent } from '@/engine/world';

/**
 * BossPhaseSystem
 * 
 * 通用 Boss 阶段管理器
 * - 监听 Boss 血量变化
 * - 驱动阶段转换 (AI.phase)
 * - 切换武器 (Weapon.id)
 * - 触发特殊事件 (无敌、音效、特效)
 */
export function BossPhaseSystem(world: World, dt: number) {
    // 遍历所有存活的 Boss
    for (const [id, [bossAi, bossTag, health, weapon, transform]] of view(world, [BossAI, BossTag, Health, Weapon, Transform])) {

        // 1. 获取配置
        const bossSpec = BOSS_DATA[bossTag.id];
        if (!bossSpec) continue;

        // 2. 计算当前血量百分比
        const hpPercent = health.hp / health.max;

        // 3. 确定应该处于的阶段
        // 查找满足 hpPercent <= threshold 的索引最大的那个阶段
        let targetPhaseIndex = 0;

        // 我们假设 phases 也是有序的，但为了保险，按照 threshold 倒序查或者正序查都行
        // 通常 phases[0] is 1.0, phases[1] is 0.7...
        // 如果 hp = 0.8, 它小于 1.0, 但大于 0.7. 所以应该停留在 phase 1.
        // 如果 hp = 0.5, 它小于 0.7. 所以应该进 phase 2.
        // 逻辑：找到最后一个 threshold >= hpPercent 的 item?
        // 不，应该找 "threshold 小于等于当前 hp" 的配置里，最靠后的吗？不对。
        // Design definition:
        // P1: threshold 1.0. Active when hp <= 1.0 DOWN TO next threshold.
        // P2: threshold 0.7. Active when hp <= 0.7.
        // So if hp is 0.8, it is NOT <= 0.7. So it is NOT P2. It must be P1.

        // 我们需要找到满足 (hpPercent <= phase.threshold) 的所有 phase 中，threshold 最小的那个？
        // Ex: hp=0.5.
        // P1(1.0) >= 0.5. Matches.
        // P2(0.7) >= 0.5. Matches.
        // P3(0.4) < 0.5. No match.
        // So we are in P2 range.

        // Let's rely on the array index.
        // default phase is 1 (index 0).
        // Check if we qualify for phase 2 (index 1) -> is hp <= phases[1].threshold?
        // Check if we qualify for phase 3 (index 2) -> is hp <= phases[2].threshold?

        let qualifiedPhaseVal = 1;
        for (let i = 1; i < bossSpec.phases.length; i++) {
            if (hpPercent <= bossSpec.phases[i].threshold) {
                qualifiedPhaseVal = i + 1; // Phase is 1-based
            }
        }

        const currentPhaseVal = bossAi.phase;

        // 4. 检测是否需要切换
        if (qualifiedPhaseVal > currentPhaseVal) {
            const targetPhaseIndex = qualifiedPhaseVal - 1;
            // 发生了阶段推进 (升级)
            // 执行切换逻辑
            performPhaseTransition(world, id, bossAi, weapon, bossSpec.phases[targetPhaseIndex], qualifiedPhaseVal);
        }
    }
}

function performPhaseTransition(
    world: World,
    entityId: number,
    bossAi: BossAI,
    weapon: Weapon,
    phaseSpec: any, // BossPhaseSpec
    newPhaseVal: number
) {
    // 1. 更新 Phase
    console.log(`[BossPhaseSystem] Boss entered Phase ${newPhaseVal}`);
    bossAi.phase = newPhaseVal;

    // 2. 切换武器
    if (phaseSpec.weaponId) {
        weapon.id = phaseSpec.weaponId;
        // 切换阶段给人反应时间
        weapon.curCD = 1000;
    }

    // 3. 播放音效
    world.events.push({
        type: 'PlaySound',
        name: 'warning_alarm' // 播放警告音
    });

    // 4. 视觉反馈：无敌帧 + 闪光
    addComponent(world, entityId, new InvulnerableState({ duration: 2000, flashColor: phaseSpec.phaseColor || '#ffffff' }));

    // 5. 特殊事件处理 (Special Events)
    if (phaseSpec.specialEvents && phaseSpec.specialEvents.length > 0) {
        if (phaseSpec.specialEvents.includes('screen_clear')) {
            world.events.push({ type: 'ScreenClear' });
        }
    }
}
