import { World } from '../types';
import { view } from '../world';
import { BossAI, Transform, InvulnerableState, Weapon } from '../components';
import { BOSS_DATA } from '../configs/bossData';
import { BossPhaseChangeEvent, PlaySoundEvent, ScreenClearEvent } from '../events';

export function BossPhaseSystem(world: World, dt: number) {
    for (const [id, [bossAi, tr]] of view(world, [BossAI, Transform])) {
        const phaseSpec = BOSS_DATA[bossAi.id];
        if (!phaseSpec) continue;

        // 检查阶段切换条件
        let shouldChangePhase = false;
        if (bossAi.phaseTimer >= phaseSpec.duration) {
            shouldChangePhase = true;
        } else if (phaseSpec.hpTrigger && bossAi.currentHp <= phaseSpec.hpTrigger) {
            shouldChangePhase = true;
        } else if (phaseSpec.timeTrigger && world.time >= phaseSpec.timeTrigger) {
            shouldChangePhase = true;
        }

        // 处理阶段切换
        if (shouldChangePhase) {
            const nextPhaseIndex = bossAi.currentPhase + 1;
            const nextPhaseKey = Object.keys(phaseSpec.phases)[nextPhaseIndex];

            if (!nextPhaseKey) {
                continue;
            }

            const nextPhaseSpec = phaseSpec.phases[nextPhaseKey];
            bossAi.currentPhase = nextPhaseIndex;
            bossAi.phaseTimer = 0;

            world.events.push({
                type: 'BossPhaseChange',
                phase: nextPhaseIndex + 1,
                bossId: id
            });

            weapon.curCD = 1000;

            addComponent(world, id, new InvulnerableState({ duration: 2000, flashColor: phaseSpec.phaseColor || '#ffffff' }));

            if (phaseSpec.specialEvents && phaseSpec.specialEvents.length > 0) {
                if (phaseSpec.specialEvents.includes('screen_clear')) {
                    world.events.push({
                        type: 'ScreenClear',
                        bubbles: false,
                        cancelBubble: true,
                        cancelable: false,
                        composed: true
                    });
                }
            }
        }
    }
}
