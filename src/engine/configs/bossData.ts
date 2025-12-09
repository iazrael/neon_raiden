//
// Boss配置数据文件
// 定义各个Boss的基础配置信息
//

import { BossType, BossEntity, BossMovementPattern, BossSpawnPosition, EnemyType, BossWeaponType } from '@/types';

/**
 * Boss配置数据
 * 定义了各个Boss的基础配置信息，不包含生命值、精灵图和尺寸等动态数据
 */
export const BossConfigData: Record<BossType, Omit<BossEntity, 'hp' | 'sprite' | 'size'>> = {
    /** 赛博守护者Boss配置 */
    [BossType.GUARDIAN]: {
        /** Boss类型 */
        type: BossType.GUARDIAN,
        /** Boss唯一标识 */
        id: 'boss_guardian',
        /** 英文名称 */
        name: 'Guardian',
        /** 中文名称 */
        chineseName: '赛博守护者',
        /** Boss描述 */
        describe: '赛博空间的初级守护程序,以优雅的正弦轨迹游弋于霓虹战场,全向弹幕系统是对新手飞行员的第一道试炼。',
        /** 主题颜色 */
        color: '#4488ff',
        /** 关卡等级 */
        level: 1,
        /** 移动速度 */
        speed: 1.5,
        /** 击杀得分 */
        score: 5000,
        /** 武器类型列表 */
        weapons: [BossWeaponType.RADIAL],
        /** 武器配置 */
        weaponConfigs: {
            /** 子弹数量 */
            bulletCount: 6,
            /** 子弹速度 */
            bulletSpeed: 4.0,
            /** 开火频率 */
            fireRate: 0.07,
            /** 瞄准射击速度 */
            targetedShotSpeed: 0
        },
        /** 移动配置 */
        movement: {
            /** 移动模式 */
            pattern: BossMovementPattern.SINE,
            /** 生成位置 */
            spawnX: BossSpawnPosition.RANDOM
        },
        /** 激光配置 */
        laser: {
            /** 激光类型 */
            type: 'none',
            /** 激光伤害 */
            damage: 0,
            /** 激光冷却时间 */
            cooldown: 0
        },
        /** 碰撞箱缩放比例 */
        hitboxScale: 0.7
    },
    /** 疾风拦截者Boss配置 */
    [BossType.INTERCEPTOR]: {
        /** Boss类型 */
        type: BossType.INTERCEPTOR,
        /** Boss唯一标识 */
        id: 'boss_interceptor',
        /** 英文名称 */
        name: 'Interceptor',
        /** 中文名称 */
        chineseName: '疾风拦截者',
        /** Boss描述 */
        describe: '突击型战斗平台,以之字形轨迹高速机动,双模式火力系统兼顾区域封锁与精准打击,是速度与火力的完美结合。',
        /** 主题颜色 */
        color: '#ff4488',
        /** 关卡等级 */
        level: 2,
        /** 移动速度 */
        speed: 2.0,
        /** 击杀得分 */
        score: 10000,
        /** 武器类型列表 */
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        /** 武器配置 */
        weaponConfigs: {
            /** 子弹数量 */
            bulletCount: 6,
            /** 子弹速度 */
            bulletSpeed: 4.2,
            /** 开火频率 */
            fireRate: 0.09,
            /** 瞄准射击速度 */
            targetedShotSpeed: 2
        },
        /** 移动配置 */
        movement: {
            /** 移动模式 */
            pattern: BossMovementPattern.ZIGZAG,
            /** 生成位置 */
            spawnX: BossSpawnPosition.RANDOM
        },
        /** 激光配置 */
        laser: {
            /** 激光类型 */
            type: 'none',
            /** 激光伤害 */
            damage: 0,
            /** 激光冷却时间 */
            cooldown: 0
        },
        /** 碰撞箱缩放比例 */
        hitboxScale: 0.7
    },
    /** 装甲毁灭者Boss配置 */
    [BossType.DESTROYER]: {
        /** Boss类型 */
        type: BossType.DESTROYER,
        /** Boss唯一标识 */
        id: 'boss_destroyer',
        /** 英文名称 */
        name: 'Destroyer',
        /** 中文名称 */
        chineseName: '装甲毁灭者',
        /** Boss描述 */
        describe: '重型装甲作战单元,以八字轨迹碾压战场,三重进化形态层层解锁毁灭之力,每个阶段都更加致命。',
        /** 主题颜色 */
        color: '#44ff88',
        /** 关卡等级 */
        level: 3,
        /** 移动速度 */
        speed: 1.2,
        /** 击杀得分 */
        score: 15000,
        /** 武器类型列表 */
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        /** 武器配置 */
        weaponConfigs: {
            /** 子弹数量 */
            bulletCount: 6,
            /** 子弹速度 */
            bulletSpeed: 5,
            /** 开火频率 */
            fireRate: 0.05,
            /** 瞄准射击速度 */
            targetedShotSpeed: 3
        },
        /** 移动配置 */
        movement: {
            /** 移动模式 */
            pattern: BossMovementPattern.FIGURE_8,
            /** 生成位置 */
            spawnX: BossSpawnPosition.RANDOM
        },
        /** 激光配置 */
        laser: {
            /** 激光类型 */
            type: 'none',
            /** 激光伤害 */
            damage: 0,
            /** 激光冷却时间 */
            cooldown: 0
        },
        /** 碰撞箱缩放比例 */
        hitboxScale: 0.7
    },
    /** 幽灵歼灭者Boss配置 */
    [BossType.ANNIHILATOR]: {
        /** Boss类型 */
        type: BossType.ANNIHILATOR,
        /** Boss唯一标识 */
        id: 'boss_annihilator',
        /** 英文名称 */
        name: 'Annihilator',
        /** 中文名称 */
        chineseName: '幽灵歼灭者',
        /** Boss描述 */
        describe: '装备光学迷彩的幽灵战斗机,空间跃迁轨迹如鬼魅般难以捉摸,全方位弹雨与锁定追踪的双重威胁令人防不胜防。',
        /** 主题颜色 */
        color: '#ff8844',
        /** 关卡等级 */
        level: 4,
        /** 移动速度 */
        speed: 1.8,
        /** 击杀得分 */
        score: 20000,
        /** 武器类型列表 */
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        /** 武器配置 */
        weaponConfigs: {
            /** 子弹数量 */
            bulletCount: 6,
            /** 子弹速度 */
            bulletSpeed: 5.0,
            /** 开火频率 */
            fireRate: 0.07,
            /** 瞄准射击速度 */
            targetedShotSpeed: 3
        },
        /** 移动配置 */
        movement: {
            /** 移动模式 */
            pattern: BossMovementPattern.RANDOM_TELEPORT,
            /** 生成位置 */
            spawnX: BossSpawnPosition.RANDOM
        },
        /** 激光配置 */
        laser: {
            /** 激光类型 */
            type: 'none',
            /** 激光伤害 */
            damage: 0,
            /** 激光冷却时间 */
            cooldown: 0
        },
        /** 碰撞箱缩放比例 */
        hitboxScale: 0.7
    },
    /** 弹幕主宰者Boss配置 */
    [BossType.DOMINATOR]: {
        /** Boss类型 */
        type: BossType.DOMINATOR,
        /** Boss唯一标识 */
        id: 'boss_dominator',
        /** 英文名称 */
        name: 'Dominator',
        /** 中文名称 */
        chineseName: '弹幕主宰者',
        /** Boss描述 */
        describe: '高能粒子壁垒,沿螺旋轨道释放无尽弹幕洪流,致密火力网封锁一切突破可能,是弹幕艺术的极致体现。',
        /** 主题颜色 */
        color: '#8844ff',
        /** 关卡等级 */
        level: 5,
        /** 移动速度 */
        speed: 1.0,
        /** 击杀得分 */
        score: 25000,
        /** 武器类型列表 */
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        /** 武器配置 */
        weaponConfigs: {
            /** 子弹数量 */
            bulletCount: 6,
            /** 子弹速度 */
            bulletSpeed: 5.0,
            /** 开火频率 */
            fireRate: 0.08,
            /** 瞄准射击速度 */
            targetedShotSpeed: 1
        },
        /** 移动配置 */
        movement: {
            /** 移动模式 */
            pattern: BossMovementPattern.CIRCLE,
            /** 生成位置 */
            spawnX: BossSpawnPosition.RANDOM
        },
        /** 激光配置 */
        laser: {
            /** 激光类型 */
            type: 'none',
            /** 激光伤害 */
            damage: 0,
            /** 激光冷却时间 */
            cooldown: 0
        },
        /** 碰撞箱缩放比例 */
        hitboxScale: 0.7
    },
    /** 战场霸主Boss配置 */
    [BossType.OVERLORD]: {
        /** Boss类型 */
        type: BossType.OVERLORD,
        /** Boss唯一标识 */
        id: 'boss_overlord',
        /** 英文名称 */
        name: 'Overlord',
        /** 中文名称 */
        chineseName: '战场霸主',
        /** Boss描述 */
        describe: '双体协同战舰,智能追踪锁定目标,融合扩散弹幕、制导武器与连续激光的复合火力系统,是战场的绝对统治者。',
        /** 主题颜色 */
        color: '#ff44ff',
        /** 关卡等级 */
        level: 6,
        /** 移动速度 */
        speed: 1.3,
        /** 击杀得分 */
        score: 30000,
        /** 武器类型列表 */
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER],
        /** 武器配置 */
        weaponConfigs: {
            /** 子弹数量 */
            bulletCount: 6,
            /** 子弹速度 */
            bulletSpeed: 5.2,
            /** 开火频率 */
            fireRate: 0.07,
            /** 瞄准射击速度 */
            targetedShotSpeed: 3
        },
        /** 移动配置 */
        movement: {
            /** 移动模式 */
            pattern: BossMovementPattern.TRACKING,
            /** 生成位置 */
            spawnX: BossSpawnPosition.RANDOM
        },
        /** 激光配置 */
        laser: {
            /** 激光类型 */
            type: 'continuous',
            /** 激光伤害 */
            damage: 35,
            /** 激光冷却时间 */
            cooldown: 3000
        },
        /** 碰撞箱缩放比例 */
        hitboxScale: 0.7
    },
    /** 泰坦要塞Boss配置 */
    [BossType.TITAN]: {
        /** Boss类型 */
        type: BossType.TITAN,
        /** Boss唯一标识 */
        id: 'boss_titan',
        /** 英文名称 */
        name: 'Titan',
        /** 中文名称 */
        chineseName: '泰坦要塞',
        /** Boss描述 */
        describe: '三角构型的空中要塞,缓慢降临碾压战场,三阶觉醒形态逐步释放激光风暴与制导毁灭,每次觉醒都是噩梦的升级。',
        /** 主题颜色 */
        color: '#44ff44',
        /** 关卡等级 */
        level: 7,
        /** 移动速度 */
        speed: 0.8,
        /** 击杀得分 */
        score: 35000,
        /** 武器类型列表 */
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER],
        /** 武器配置 */
        weaponConfigs: {
            /** 子弹数量 */
            bulletCount: 6,
            /** 子弹速度 */
            bulletSpeed: 6,
            /** 开火频率 */
            fireRate: 0.065,
            /** 瞄准射击速度 */
            targetedShotSpeed: 3
        },
        /** 移动配置 */
        movement: {
            /** 移动模式 */
            pattern: BossMovementPattern.SLOW_DESCENT,
            /** 生成位置 */
            spawnX: BossSpawnPosition.RANDOM
        },
        /** 激光配置 */
        laser: {
            /** 激光类型 */
            type: 'continuous',
            /** 激光伤害 */
            damage: 30,
            /** 激光冷却时间 */
            cooldown: 3500
        },
        /** 碰撞箱缩放比例 */
        hitboxScale: 0.7
    },
    /** 钢铁巨像Boss配置 */
    [BossType.COLOSSUS]: {
        /** Boss类型 */
        type: BossType.COLOSSUS,
        /** Boss唯一标识 */
        id: 'boss_colossus',
        /** 英文名称 */
        name: 'Colossus',
        /** 中文名称 */
        chineseName: '钢铁巨像',
        /** Boss描述 */
        describe: '八足钢铁巨蛛,激进突进撕裂战线,多重武装系统配合激光护卫机提供防空掩护,是移动的死亡堡垒。',
        /** 主题颜色 */
        color: '#ffff44',
        /** 关卡等级 */
        level: 8,
        /** 移动速度 */
        speed: 1.1,
        /** 击杀得分 */
        score: 40000,
        /** 武器类型列表 */
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER, BossWeaponType.SPREAD],
        /** 武器配置 */
        weaponConfigs: {
            /** 子弹数量 */
            bulletCount: 3,
            /** 子弹速度 */
            bulletSpeed: 7.0,
            /** 开火频率 */
            fireRate: 0.07,
            /** 瞄准射击速度 */
            targetedShotSpeed: 6
        },
        /** 移动配置 */
        movement: {
            /** 移动模式 */
            pattern: BossMovementPattern.AGGRESSIVE,
            /** 生成位置 */
            spawnX: BossSpawnPosition.RANDOM
        },
        /** 激光配置 */
        laser: {
            /** 激光类型 */
            type: 'pulsed',
            /** 激光伤害 */
            damage: 50,
            /** 激光冷却时间 */
            cooldown: 2500
        },
        /** 僚机配置 */
        wingmen: {
            /** 僚机数量 */
            count: 1,
            /** 僚机类型 */
            type: EnemyType.LASER_INTERCEPTOR
        },
        /** 碰撞箱缩放比例 */
        hitboxScale: 0.7
    },
    /** 深渊利维坦Boss配置 */
    [BossType.LEVIATHAN]: {
        /** Boss类型 */
        type: BossType.LEVIATHAN,
        /** Boss唯一标识 */
        id: 'boss_leviathan',
        /** 英文名称 */
        name: 'Leviathan',
        /** 中文名称 */
        chineseName: '深渊利维坦',
        /** Boss描述 */
        describe: '环状中枢战体,以极限机动穿梭战场,五重武器矩阵配合双护卫机编队协防,构筑无法逃脱的死亡领域。',
        /** 主题颜色 */
        color: '#44ffff',
        /** 关卡等级 */
        level: 9,
        /** 移动速度 */
        speed: 1.4,
        /** 击杀得分 */
        score: 45000,
        /** 武器类型列表 */
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER, BossWeaponType.SPREAD, BossWeaponType.HOMING],
        /** 武器配置 */
        weaponConfigs: {
            /** 子弹数量 */
            bulletCount: 5,
            /** 子弹速度 */
            bulletSpeed: 7.5,
            /** 开火频率 */
            fireRate: 0.08,
            /** 瞄准射击速度 */
            targetedShotSpeed: 5
        },
        /** 移动配置 */
        movement: {
            /** 移动模式 */
            pattern: BossMovementPattern.AGGRESSIVE,
            /** 生成位置 */
            spawnX: BossSpawnPosition.RANDOM
        },
        /** 激光配置 */
        laser: {
            /** 激光类型 */
            type: 'pulsed',
            /** 激光伤害 */
            damage: 45,
            /** 激光冷却时间 */
            cooldown: 2200
        },
        /** 僚机配置 */
        wingmen: {
            /** 僚机数量 */
            count: 2,
            /** 僚机类型 */
            type: EnemyType.LASER_INTERCEPTOR
        },
        /** 碰撞箱缩放比例 */
        hitboxScale: 0.7
    },
    /** 天启审判Boss配置 */
    [BossType.APOCALYPSE]: {
        /** Boss类型 */
        type: BossType.APOCALYPSE,
        /** Boss唯一标识 */
        id: 'boss_apocalypse',
        /** 英文名称 */
        name: 'Apocalypse',
        /** 中文名称 */
        chineseName: '天启审判',
        /** Boss描述 */
        describe: '终极龙王,轨迹莫测难寻,五维火力全域覆盖,双布雷机僚机协同,四重超载形态逐次显现,是霓虹战场的终极审判。',
        /** 主题颜色 */
        color: '#ff0000',
        /** 关卡等级 */
        level: 10,
        /** 移动速度 */
        speed: 1.6,
        /** 击杀得分 */
        score: 50000,
        /** 武器类型列表 */
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER, BossWeaponType.SPREAD, BossWeaponType.HOMING],
        /** 武器配置 */
        weaponConfigs: {
            /** 子弹数量 */
            bulletCount: 8,
            /** 子弹速度 */
            bulletSpeed: 8.0,
            /** 开火频率 */
            fireRate: 0.10,
            /** 瞄准射击速度 */
            targetedShotSpeed: 3
        },
        /** 移动配置 */
        movement: {
            /** 移动模式 */
            pattern: BossMovementPattern.ADAPTIVE,
            /** 生成位置 */
            spawnX: BossSpawnPosition.RANDOM
        },
        /** 激光配置 */
        laser: {
            /** 激光类型 */
            type: 'pulsed',
            /** 激光伤害 */
            damage: 55,
            /** 激光冷却时间 */
            cooldown: 2000
        },
        /** 僚机配置 */
        wingmen: {
            /** 僚机数量 */
            count: 2,
            /** 僚机类型 */
            type: EnemyType.MINE_LAYER
        },
        /** 碰撞箱缩放比例 */
        hitboxScale: 0.7
    }
};

// 根据关卡等级获取Boss配置
export function getBossConfigByLevel(level: number): Omit<BossEntity, 'hp' | 'sprite' | 'size'> | null {
    const bossEntry = Object.values(BossConfigData).find((config) => config.level === level);
    return bossEntry || null;
}

// src/engine/configs/bossData.ts

export enum BossMovePattern {
    SINE = 'sine',       // 正弦游弋 (旧配置中的 pattern)
    FOLLOW = 'follow',   // 追踪玩家
    IDLE = 'idle',       // 定点站桩
    DASH = 'dash',       // 冲刺
}

/** 定义 Boss 每个阶段的行为 */
export interface BossPhaseSpec {
    /** 触发该阶段的血量阈值 (0-1), 例如 0.5 表示 50% 血量进入此阶段 */
    threshold: number;      
    /** 该阶段的移动模式 */
    movePattern: BossMovePattern; 
    /** 该阶段使用的武器 ID (引用 weapons.ts) */
    weaponId: string;       
    /** 移动参数 (例如正弦波的振幅/频率) */
    moveParams?: { xSpeed?: number; ySpeed?: number; frequency?: number };
}

export interface BossSpec {
    id: string;
    phases: BossPhaseSpec[];
}

// 静态配置表：Boss 的行为逻辑
export const BOSS_DATA: Record<string, BossSpec> = {
    'boss_guardian': {
        id: 'boss_guardian',
        phases: [
            // 第一阶段：满血，正弦游动，用普通放射炮
            {
                threshold: 1.0,
                movePattern: BossMovePattern.SINE,
                weaponId: 'boss_guardian_radial', // 对应 weapons.ts
                moveParams: { xSpeed: 1.5, frequency: 2 } // 对应旧配置 speed: 1.5
            },
            // 第二阶段：50%血，狂暴，追踪玩家，射速变快
            {
                threshold: 0.5,
                movePattern: BossMovePattern.FOLLOW,
                weaponId: 'boss_guardian_radial_enraged',
                moveParams: { xSpeed: 3.0 }
            }
        ]
    }
};