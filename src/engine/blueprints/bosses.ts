//
// Boss单位蓝图文件
// 包含游戏中所有Boss类型的蓝图定义
//

import { DROPTABLE_BOSS } from '../configs/droptables/common';
import { BossId } from '../types';
import { Blueprint } from './base';
import { SpriteKey } from '../configs/sprites';

// Boss SpriteKey 映射
const BOSS_SPRITE_MAP: Record<BossId, SpriteKey> = {
    [BossId.GUARDIAN]: SpriteKey.BOSS_GUARDIAN,
    [BossId.INTERCEPTOR]: SpriteKey.BOSS_INTERCEPTOR,
    [BossId.DESTROYER]: SpriteKey.BOSS_DESTROYER,
    [BossId.ANNIHILATOR]: SpriteKey.BOSS_ANNIHILATOR,
    [BossId.DOMINATOR]: SpriteKey.BOSS_DOMINATOR,
    [BossId.OVERLORD]: SpriteKey.BOSS_OVERLORD,
    [BossId.TITAN]: SpriteKey.BOSS_TITAN,
    [BossId.COLOSSUS]: SpriteKey.BOSS_COLOSSUS,
    [BossId.LEVIATHAN]: SpriteKey.BOSS_LEVIATHAN,
    [BossId.APOCALYPSE]: SpriteKey.BOSS_APOCALYPSE,
};

// 辅助函数：快速生成 Boss 蓝图
function createBossBlueprint(
    bossId: BossId,
    hp: number,
    radius: number,
    score: number
): Blueprint {
    return {
        Transform: { x: 400, y: -200, rot: 180 },
        Health: { hp, max: hp },
        Sprite: { spriteKey: BOSS_SPRITE_MAP[bossId], scale: 1 },
        BossTag: { id: bossId },
        BossAI: { phase: 0, nextPatternTime: 0 },
        HitBox: { shape: 'circle', radius: radius * 0.8 },
        SpeedStat: { maxLinear: 120, maxAngular: 2 },
        ScoreValue: { value: score },
        DropTable: { table: DROPTABLE_BOSS }
    };
}

export const BLUEPRINT_BOSS_GUARDIAN = createBossBlueprint(BossId.GUARDIAN, 2000, 90, 5000);
export const BLUEPRINT_BOSS_INTERCEPTOR = createBossBlueprint(BossId.INTERCEPTOR, 3200, 100, 10000);
export const BLUEPRINT_BOSS_DESTROYER = createBossBlueprint(BossId.DESTROYER, 5800, 110, 15000);
export const BLUEPRINT_BOSS_ANNIHILATOR = createBossBlueprint(BossId.ANNIHILATOR, 7000, 120, 20000);
export const BLUEPRINT_BOSS_DOMINATOR = createBossBlueprint(BossId.DOMINATOR, 8200, 130, 25000);
export const BLUEPRINT_BOSS_OVERLORD = createBossBlueprint(BossId.OVERLORD, 10600, 140, 30000);
export const BLUEPRINT_BOSS_TITAN = createBossBlueprint(BossId.TITAN, 16000, 150, 35000);
export const BLUEPRINT_BOSS_COLOSSUS = createBossBlueprint(BossId.COLOSSUS, 17200, 160, 40000);
export const BLUEPRINT_BOSS_LEVIATHAN = createBossBlueprint(BossId.LEVIATHAN, 18400, 170, 45000);
export const BLUEPRINT_BOSS_APOCALYPSE = createBossBlueprint(BossId.APOCALYPSE, 20000, 180, 50000);

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
