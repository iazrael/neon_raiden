//
// Boss单位蓝图文件
// 包含游戏中所有Boss类型的蓝图定义
//

import { ASSETS } from '../configs';
import { BOSS_DATA } from '../configs/bossData';
import { DROPTABLE_BOSS } from '../configs/droptables/common';
import { BossId } from '../types';
import { Blueprint } from './types';


/**
 * 守护者Boss蓝图
 * 初级Boss，以正弦轨迹移动
 */
export const BLUEPRINT_BOSS_GUARDIAN: Blueprint = {
    /** 变换组件 - 设置Boss的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
    Health: { hp: 2000, max: 2000 },

    /** 精灵组件 - 设置Boss的纹理信息 */
    Sprite: { texture: ASSETS.BOSSES.guardian, srcX: 0, srcY: 0, srcW: 180, srcH: 180, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** Boss标签组件 - 标识此实体为Boss */
    BossTag: { id: BossId.GUARDIAN },

    /** Boss AI组件 - 控制Boss的行为模式 */
    BossAI: { phase: 0, nextPatternTime: 0 },

    /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 90 * 0.7 },
    // 击杀得分 (原配置 score: 5000)
    ScoreValue: { value: 5000 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_BOSS }
};

/**
 * 拦截者Boss蓝图
 * 中级Boss，以之字形轨迹高速机动
 */
export const BLUEPRINT_BOSS_INTERCEPTOR: Blueprint = {
    /** 变换组件 - 设置Boss的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
    Health: { hp: 3200, max: 3200 },

    /** 精灵组件 - 设置Boss的纹理信息 */
    Sprite: { texture: ASSETS.BOSSES.interceptor, srcX: 0, srcY: 0, srcW: 200, srcH: 200, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** Boss标签组件 - 标识此实体为Boss */
    BossTag: { id: BossId.INTERCEPTOR },

    /** Boss AI组件 - 控制Boss的行为模式 */
    BossAI: { phase: 0, nextPatternTime: 0 },

    /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 100 * 0.7 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_BOSS }
};

/**
 * 毁灭者Boss蓝图
 * 高级Boss，以八字轨迹碾压战场
 */
export const BLUEPRINT_BOSS_DESTROYER: Blueprint = {
    /** 变换组件 - 设置Boss的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
    Health: { hp: 5800, max: 5800 },

    /** 精灵组件 - 设置Boss的纹理信息 */
    Sprite: { texture: ASSETS.BOSSES.destroyer, srcX: 0, srcY: 0, srcW: 220, srcH: 220, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** Boss标签组件 - 标识此实体为Boss */
    BossTag: { id: BossId.DESTROYER },

    /** Boss AI组件 - 控制Boss的行为模式 */
    BossAI: { phase: 0, nextPatternTime: 0 },

    /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 110 * 0.7 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_BOSS }
};

/**
 * 歼灭者Boss蓝图
 * 装备光学迷彩的幽灵战斗机
 */
export const BLUEPRINT_BOSS_ANNIHILATOR: Blueprint = {
    /** 变换组件 - 设置Boss的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
    Health: { hp: 7000, max: 7000 },

    /** 精灵组件 - 设置Boss的纹理信息 */
    Sprite: { texture: ASSETS.BOSSES.annihilator, srcX: 0, srcY: 0, srcW: 240, srcH: 240, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** Boss标签组件 - 标识此实体为Boss */
    BossTag: { id: BossId.ANNIHILATOR },

    /** Boss AI组件 - 控制Boss的行为模式 */
    BossAI: { phase: 0, nextPatternTime: 0 },

    /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 120 * 0.7 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_BOSS }
};

/**
 * 主宰者Boss蓝图
 * 高能粒子壁垒，释放无尽弹幕洪流
 */
export const BLUEPRINT_BOSS_DOMINATOR: Blueprint = {
    /** 变换组件 - 设置Boss的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
    Health: { hp: 8200, max: 8200 },

    /** 精灵组件 - 设置Boss的纹理信息 */
    Sprite: { texture: ASSETS.BOSSES.dominator, srcX: 0, srcY: 0, srcW: 260, srcH: 260, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** Boss标签组件 - 标识此实体为Boss */
    BossTag: { id: BossId.DOMINATOR },

    /** Boss AI组件 - 控制Boss的行为模式 */
    BossAI: { phase: 0, nextPatternTime: 0 },

    /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 130 * 0.7 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_BOSS }
};

/**
 * 霸主Boss蓝图
 * 双体协同战舰，融合多种火力系统
 */
export const BLUEPRINT_BOSS_OVERLORD: Blueprint = {
    /** 变换组件 - 设置Boss的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
    Health: { hp: 10600, max: 10600 },

    /** 精灵组件 - 设置Boss的纹理信息 */
    Sprite: { texture: ASSETS.BOSSES.overlord, srcX: 0, srcY: 0, srcW: 280, srcH: 280, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** Boss标签组件 - 标识此实体为Boss */
    BossTag: { id: BossId.OVERLORD },

    /** Boss AI组件 - 控制Boss的行为模式 */
    BossAI: { phase: 0, nextPatternTime: 0 },

    /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 140 * 0.7 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_BOSS }
};

/**
 * 泰坦Boss蓝图
 * 三角构型的空中要塞，缓慢降临碾压战场
 */
export const BLUEPRINT_BOSS_TITAN: Blueprint = {
    /** 变换组件 - 设置Boss的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
    Health: { hp: 16000, max: 16000 },

    /** 精灵组件 - 设置Boss的纹理信息 */
    Sprite: { texture: ASSETS.BOSSES.titan, srcX: 0, srcY: 0, srcW: 300, srcH: 300, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** Boss标签组件 - 标识此实体为Boss */
    BossTag: { id: BossId.TITAN },

    /** Boss AI组件 - 控制Boss的行为模式 */
    BossAI: { phase: 0, nextPatternTime: 0 },

    /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 150 * 0.7 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_BOSS }
};

/**
 * 巨像Boss蓝图
 * 八足钢铁巨蛛，激进突进撕裂战线
 */
export const BLUEPRINT_BOSS_COLOSSUS: Blueprint = {
    /** 变换组件 - 设置Boss的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
    Health: { hp: 17200, max: 17200 },

    /** 精灵组件 - 设置Boss的纹理信息 */
    Sprite: { texture: ASSETS.BOSSES.colossus, srcX: 0, srcY: 0, srcW: 320, srcH: 320, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** Boss标签组件 - 标识此实体为Boss */
    BossTag: { id: BossId.COLOSSUS },

    /** Boss AI组件 - 控制Boss的行为模式 */
    BossAI: { phase: 0, nextPatternTime: 0 },

    /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 160 * 0.7 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_BOSS }
};

/**
 * 利维坦Boss蓝图
 * 环状中枢战体，以极限机动穿梭战场
 */
export const BLUEPRINT_BOSS_LEVIATHAN: Blueprint = {
    /** 变换组件 - 设置Boss的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
    Health: { hp: 18400, max: 18400 },

    /** 精灵组件 - 设置Boss的纹理信息 */
    Sprite: { texture: ASSETS.BOSSES.leviathan, srcX: 0, srcY: 0, srcW: 340, srcH: 340, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** Boss标签组件 - 标识此实体为Boss */
    BossTag: { id: BossId.LEVIATHAN },

    /** Boss AI组件 - 控制Boss的行为模式 */
    BossAI: { phase: 0, nextPatternTime: 0 },

    /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 170 * 0.7 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_BOSS }
};

/**
 * 天启Boss蓝图
 * 终极龙王，轨迹莫测难寻
 */
export const BLUEPRINT_BOSS_APOCALYPSE: Blueprint = {
    /** 变换组件 - 设置Boss的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置Boss的当前生命值和最大生命值 */
    Health: { hp: 20000, max: 20000 },

    /** 精灵组件 - 设置Boss的纹理信息 */
    Sprite: { texture: ASSETS.BOSSES.apocalypse, srcX: 0, srcY: 0, srcW: 360, srcH: 360, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** Boss标签组件 - 标识此实体为Boss */
    BossTag: { id: BossId.APOCALYPSE },

    /** Boss AI组件 - 控制Boss的行为模式 */
    BossAI: { phase: 0, nextPatternTime: 0 },

    /** 碰撞盒组件 - 设置Boss的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 180 * 0.7 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_BOSS }
};

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

// 辅助函数：快速生成 Boss 蓝图
function createBossBlueprint(
    bossId: BossId,
    sprite: string,
    hp: number,
    radius: number,
    score: number
): Blueprint {
    // 自动查找该 Boss 的初始武器 (P1 阶段)
    const bossSpec = BOSS_DATA[bossId];
    const initialWeaponId = bossSpec?.phases[0]?.weaponId || 'boss_weapon_radial';

    return {
        Transform: { x: 400, y: -200, rot: 180 },
        Health: { hp, max: hp },
        Sprite: { texture: sprite, srcX: 0, srcY: 0, srcW: radius * 2, srcH: radius * 2, scale: 1 },
        BossTag: { id: bossId }, // 标记为 Boss
        BossAI: { phase: 0, nextPatternTime: 0 }, // 初始阶段 0
        Weapon: { id: initialWeaponId, ammoType: 'orb_red', cooldown: 1000, slot: 'main' },
        HitBox: { shape: 'circle', radius: radius * 0.7 },
        // 速度限制
        // maxLinear: 120 (每秒120像素，用于追踪/移动时的基准速度) 
        // maxAngular: 2 (旋转速度，用于转头瞄准)
        // 建议值：maxLinear: 100 ~ 200 (像素/秒)。
        SpeedStat: { maxLinear: 120, maxAngular: 2 },
        ScoreValue: { value: score },
        DropTable: { table: DROPTABLE_BOSS }
    };
}


// export const BLUEPRINT_BOSS_GUARDIAN = createBossBlueprint('boss_guardian', ASSETS.BOSSES.guardian, 2000, 90, 5000);
// export const BLUEPRINT_BOSS_INTERCEPTOR = createBossBlueprint('boss_interceptor', ASSETS.BOSSES.interceptor, 3200, 100, 10000);
// export const BLUEPRINT_BOSS_DESTROYER = createBossBlueprint('boss_destroyer', ASSETS.BOSSES.destroyer, 5800, 110, 15000);
// export const BLUEPRINT_BOSS_ANNIHILATOR = createBossBlueprint('boss_annihilator', ASSETS.BOSSES.annihilator, 7000, 120, 20000);
// export const BLUEPRINT_BOSS_DOMINATOR = createBossBlueprint('boss_dominator', ASSETS.BOSSES.dominator, 8200, 130, 25000);
// export const BLUEPRINT_BOSS_OVERLORD = createBossBlueprint('boss_overlord', ASSETS.BOSSES.overlord, 10600, 140, 30000);
// export const BLUEPRINT_BOSS_TITAN = createBossBlueprint('boss_titan', ASSETS.BOSSES.titan, 16000, 150, 35000);
// export const BLUEPRINT_BOSS_COLOSSUS = createBossBlueprint('boss_colossus', ASSETS.BOSSES.colossus, 17200, 160, 40000);
// export const BLUEPRINT_BOSS_LEVIATHAN = createBossBlueprint('boss_leviathan', ASSETS.BOSSES.leviathan, 18400, 170, 45000);
// export const BLUEPRINT_BOSS_APOCALYPSE = createBossBlueprint('boss_apocalypse', ASSETS.BOSSES.apocalypse, 20000, 180, 50000);

// export const BOSSES_TABLE: Record<BossId, Blueprint> = {
//     [BossId.GUARDIAN]: BLUEPRINT_BOSS_GUARDIAN,
//     [BossId.INTERCEPTOR]: BLUEPRINT_BOSS_INTERCEPTOR,
//     [BossId.DESTROYER]: BLUEPRINT_BOSS_DESTROYER,
//     [BossId.ANNIHILATOR]: BLUEPRINT_BOSS_ANNIHILATOR,
//     [BossId.DOMINATOR]: BLUEPRINT_BOSS_DOMINATOR,
//     [BossId.OVERLORD]: BLUEPRINT_BOSS_OVERLORD,
//     [BossId.TITAN]: BLUEPRINT_BOSS_TITAN,
//     [BossId.COLOSSUS]: BLUEPRINT_BOSS_COLOSSUS,
//     [BossId.LEVIATHAN]: BLUEPRINT_BOSS_LEVIATHAN,
//     [BossId.APOCALYPSE]: BLUEPRINT_BOSS_APOCALYPSE,
// };