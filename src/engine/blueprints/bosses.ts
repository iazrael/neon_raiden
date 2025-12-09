//
// Boss单位蓝图文件
// 包含游戏中所有Boss类型的蓝图定义
//

import { ASSETS } from '@/engine/configs';
import { BOSS_DATA } from '@/engine/configs/bossData';
import { DROPTABLE_BOSS } from '@/engine/configs/droptables/common';
import { BossId } from '@/engine/types';
import { Blueprint } from './types';
import { WEAPON_TABLE } from './weapons';


// 辅助函数：快速生成 Boss 蓝图
function createBossBlueprint(
    bossId: BossId,
    sprite: string,
    hp: number,
    radius: number,
    score: number
): Blueprint {
    // 自动查找该 Boss 的初始武器 (P1 阶段)
    const bossSpec = BOSS_DATA[bossId]!;
    const initialWeaponId = bossSpec.phases[0]!.weaponId;

    return {
        Transform: { x: 400, y: -200, rot: 180 },
        Health: { hp, max: hp },
        Sprite: { texture: sprite, srcX: 0, srcY: 0, srcW: radius * 2, srcH: radius * 2, scale: 1 },
        BossTag: { id: bossId }, // 标记为 Boss
        BossAI: { phase: 0, nextPatternTime: 0 }, // 初始阶段 0
        Weapon: WEAPON_TABLE[initialWeaponId],
        HitBox: { shape: 'circle', radius: radius * 0.8 },
        // 速度限制
        // maxLinear: 120 (每秒120像素，用于追踪/移动时的基准速度) 
        // maxAngular: 2 (旋转速度，用于转头瞄准)
        // 建议值：maxLinear: 100 ~ 200 (像素/秒)。
        SpeedStat: { maxLinear: 120, maxAngular: 2 },
        ScoreValue: { value: score },
        DropTable: { table: DROPTABLE_BOSS }
    };
}


export const BLUEPRINT_BOSS_GUARDIAN = createBossBlueprint(BossId.GUARDIAN, ASSETS.BOSSES.guardian, 2000, 90, 5000);
export const BLUEPRINT_BOSS_INTERCEPTOR = createBossBlueprint(BossId.INTERCEPTOR, ASSETS.BOSSES.interceptor, 3200, 100, 10000);
export const BLUEPRINT_BOSS_DESTROYER = createBossBlueprint(BossId.DESTROYER, ASSETS.BOSSES.destroyer, 5800, 110, 15000);
export const BLUEPRINT_BOSS_ANNIHILATOR = createBossBlueprint(BossId.ANNIHILATOR, ASSETS.BOSSES.annihilator, 7000, 120, 20000);
export const BLUEPRINT_BOSS_DOMINATOR = createBossBlueprint(BossId.DOMINATOR, ASSETS.BOSSES.dominator, 8200, 130, 25000);
export const BLUEPRINT_BOSS_OVERLORD = createBossBlueprint(BossId.OVERLORD, ASSETS.BOSSES.overlord, 10600, 140, 30000);
export const BLUEPRINT_BOSS_TITAN = createBossBlueprint(BossId.TITAN, ASSETS.BOSSES.titan, 16000, 150, 35000);
export const BLUEPRINT_BOSS_COLOSSUS = createBossBlueprint(BossId.COLOSSUS, ASSETS.BOSSES.colossus, 17200, 160, 40000);
export const BLUEPRINT_BOSS_LEVIATHAN = createBossBlueprint(BossId.LEVIATHAN, ASSETS.BOSSES.leviathan, 18400, 170, 45000);
export const BLUEPRINT_BOSS_APOCALYPSE = createBossBlueprint(BossId.APOCALYPSE, ASSETS.BOSSES.apocalypse, 20000, 180, 50000);


// 导出Boss蓝图表
export const BOSSES_TABLE: Record<BossId, Blueprint> = {
    [BossId.GUARDIAN]: BLUEPRINT_BOSS_GUARDIAN,
    [BossId.INTERCEPTOR]: BLUEPRINT_BOSS_INTERCEPTOR,
    [BossId.DESTROYER]: BLUEPRINT_BOSS_DESTROYER,
    [BossId.ANNIHILATOR]: BLUEPRINT_BOSS_ANNIHILATOR,
    [BossId.DOMINATOR]: BLUEPRINT_BOSS_DOMINATOR,
    [BossId.OVERLORD]: BLUEPRINT_BOSS_OVERLORD,
    [BossId.TITAN]: BLUEPRINT_BOSS_TITAN,
    [BossId.COLOSSUS]: BLUEPRINT_BOSS_COLOSSUS,
    [BossId.LEVIATHAN]: BLUEPRINT_BOSS_LEVIATHAN,
    [BossId.APOCALYPSE]: BLUEPRINT_BOSS_APOCALYPSE,
};