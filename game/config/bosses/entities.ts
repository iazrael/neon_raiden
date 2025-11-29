import {
    BossType,
    BossEntity,
    BossMovementPattern,
    BossSpawnPosition,
    EnemyType,
    BossWeaponType,
} from '@/types';

// ==================== Boss配置 ====================
export const BossConfig: Record<BossType, BossEntity> = {
    [BossType.GUARDIAN]: {
        type: BossType.GUARDIAN,
        id: 'boss_guardian',
        name: 'Guardian',
        chineseName: '赛博守护者',
        describe: '赛博空间的初级守护程序,以优雅的正弦轨迹游弋于霓虹战场,全向弹幕系统是对新手飞行员的第一道试炼。',
        color: '#4488ff',
        level: 1,
        hp: 1600,
        speed: 1.2,
        size: { width: 180, height: 180 },
        score: 5000,
        sprite: 'boss_guardian',
        weapons: [BossWeaponType.RADIAL],
        weaponConfigs: {
            bulletCount: 6,
            bulletSpeed: 4.0,
            fireRate: 0.07,
            targetedShotSpeed: 0
        },
        movement: {
            pattern: BossMovementPattern.SINE,
            spawnX: BossSpawnPosition.RANDOM
        },
        laser: {
            type: 'none',
            damage: 0,
            cooldown: 0
        },
        hitboxScale: 0.7
    },
    [BossType.INTERCEPTOR]: {
        type: BossType.INTERCEPTOR,
        id: 'boss_interceptor',
        name: 'Interceptor',
        chineseName: '疾风拦截者',
        describe: '突击型战斗平台,以之字形轨迹高速机动,双模式火力系统兼顾区域封锁与精准打击,是速度与火力的完美结合。',
        color: '#ff4488',
        level: 2,
        hp: 2100,
        speed: 2.0,
        size: { width: 200, height: 200 },
        score: 10000,
        sprite: 'boss_interceptor',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        weaponConfigs: {
            bulletCount: 8,
            bulletSpeed: 4.5,
            fireRate: 0.09,
            targetedShotSpeed: 8
        },
        movement: {
            pattern: BossMovementPattern.ZIGZAG,
            spawnX: BossSpawnPosition.RANDOM
        },
        laser: {
            type: 'none',
            damage: 0,
            cooldown: 0
        },
        hitboxScale: 0.7
    },
    [BossType.DESTROYER]: {
        type: BossType.DESTROYER,
        id: 'boss_destroyer',
        name: 'Destroyer',
        chineseName: '装甲毁灭者',
        describe: '重型装甲作战单元,以八字轨迹碾压战场,三重进化形态层层解锁毁灭之力,每个阶段都更加致命。',
        color: '#44ff88',
        level: 3,
        hp: 2800,
        speed: 0.8,
        size: { width: 220, height: 220 },
        score: 15000,
        sprite: 'boss_destroyer',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        weaponConfigs: {
            bulletCount: 20,
            bulletSpeed: 5.5,
            fireRate: 0.05,
            targetedShotSpeed: 9
        },
        movement: {
            pattern: BossMovementPattern.FIGURE_8,
            spawnX: BossSpawnPosition.RANDOM
        },
        laser: {
            type: 'none',
            damage: 0,
            cooldown: 0
        },
        hitboxScale: 0.7
    },
    [BossType.ANNIHILATOR]: {
        type: BossType.ANNIHILATOR,
        id: 'boss_annihilator',
        name: 'Annihilator',
        chineseName: '幽灵歼灭者',
        describe: '装备光学迷彩的幽灵战斗机,空间跃迁轨迹如鬼魅般难以捉摸,全方位弹雨与锁定追踪的双重威胁令人防不胜防。',
        color: '#ff8844',
        level: 4,
        hp: 3600,
        speed: 1.5,
        size: { width: 240, height: 240 },
        score: 20000,
        sprite: 'boss_annihilator',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        weaponConfigs: {
            bulletCount: 13,
            bulletSpeed: 5.0,
            fireRate: 0.07,
            targetedShotSpeed: 14
        },
        movement: {
            pattern: BossMovementPattern.RANDOM_TELEPORT,
            spawnX: BossSpawnPosition.RANDOM
        },
        laser: {
            type: 'none',
            damage: 0,
            cooldown: 0
        },
        hitboxScale: 0.7
    },
    [BossType.DOMINATOR]: {
        type: BossType.DOMINATOR,
        id: 'boss_dominator',
        name: 'Dominator',
        chineseName: '弹幕主宰',
        describe: '高能粒子壁垒,沿螺旋轨道释放无尽弹幕洪流,致密火力网封锁一切突破可能,是弹幕艺术的极致体现。',
        color: '#8844ff',
        level: 5,
        hp: 4800,
        speed: 1.3,
        size: { width: 260, height: 260 },
        score: 25000,
        sprite: 'boss_dominator',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        weaponConfigs: {
            bulletCount: 16,
            bulletSpeed: 5.0,
            fireRate: 0.08,
            targetedShotSpeed: 10
        },
        movement: {
            pattern: BossMovementPattern.CIRCLE,
            spawnX: BossSpawnPosition.RANDOM
        },
        laser: {
            type: 'none',
            damage: 0,
            cooldown: 0
        },
        hitboxScale: 0.7
    },
    [BossType.OVERLORD]: {
        type: BossType.OVERLORD,
        id: 'boss_overlord',
        name: 'Overlord',
        chineseName: '战场霸主',
        describe: '双体协同战舰,智能追踪锁定目标,融合扩散弹幕、制导武器与连续激光的复合火力系统,是战场的绝对统治者。',
        color: '#ff44ff',
        level: 6,
        hp: 7800,
        speed: 1.8,
        size: { width: 280, height: 280 },
        score: 30000,
        sprite: 'boss_overlord',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER],
        weaponConfigs: {
            bulletCount: 18,
            bulletSpeed: 6.0,
            fireRate: 0.07,
            targetedShotSpeed: 10
        },
        movement: {
            pattern: BossMovementPattern.TRACKING,
            spawnX: BossSpawnPosition.RANDOM
        },
        laser: {
            type: 'continuous',
            damage: 35,
            cooldown: 3000
        },
        hitboxScale: 0.7
    },
    [BossType.TITAN]: {
        type: BossType.TITAN,
        id: 'boss_titan',
        name: 'Titan',
        chineseName: '泰坦要塞',
        describe: '三角构型的空中要塞,缓慢降临碾压战场,三阶觉醒形态逐步释放激光风暴与制导毁灭,每次觉醒都是噩梦的升级。',
        color: '#44ff44',
        level: 7,
        hp: 10500,
        speed: 1.0,
        size: { width: 300, height: 300 },
        score: 35000,
        sprite: 'boss_titan',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER],
        weaponConfigs: {
            bulletCount: 20,
            bulletSpeed: 6.5,
            fireRate: 0.065,
            targetedShotSpeed: 11
        },
        movement: {
            pattern: BossMovementPattern.SLOW_DESCENT,
            spawnX: BossSpawnPosition.RANDOM
        },
        laser: {
            type: 'continuous',
            damage: 30,
            cooldown: 3500
        },
        hitboxScale: 0.7
    },
    [BossType.COLOSSUS]: {
        type: BossType.COLOSSUS,
        id: 'boss_colossus',
        name: 'Colossus',
        chineseName: '钢铁巨像',
        describe: '八足钢铁巨蛛,激进突进撕裂战线,多重武装系统配合激光护卫机提供防空掩护,是移动的死亡堡垒。',
        color: '#ffff44',
        level: 8,
        hp: 9500,
        speed: 2.2,
        size: { width: 320, height: 320 },
        score: 40000,
        sprite: 'boss_colossus',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER, BossWeaponType.SPREAD],
        weaponConfigs: {
            bulletCount: 20,
            bulletSpeed: 7.0,
            fireRate: 0.07,
            targetedShotSpeed: 12
        },
        movement: {
            pattern: BossMovementPattern.AGGRESSIVE,
            spawnX: BossSpawnPosition.RANDOM
        },
        laser: {
            type: 'pulsed',
            damage: 50,
            cooldown: 2500
        },
        wingmen: {
            count: 1,
            type: EnemyType.LASER_INTERCEPTOR
        },
        hitboxScale: 0.7
    },
    [BossType.LEVIATHAN]: {
        type: BossType.LEVIATHAN,
        id: 'boss_leviathan',
        name: 'Leviathan',
        chineseName: '深渊利维坦',
        describe: '环状中枢战体,以极限机动穿梭战场,五重武器矩阵配合双护卫机编队协防,构筑无法逃脱的死亡领域。',
        color: '#44ffff',
        level: 9,
        hp: 12000,
        speed: 1.6,
        size: { width: 340, height: 340 },
        score: 45000,
        sprite: 'boss_leviathan',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER, BossWeaponType.SPREAD, BossWeaponType.HOMING],
        weaponConfigs: {
            bulletCount: 22,
            bulletSpeed: 7.5,
            fireRate: 0.08,
            targetedShotSpeed: 13
        },
        movement: {
            pattern: BossMovementPattern.AGGRESSIVE,
            spawnX: BossSpawnPosition.RANDOM
        },
        laser: {
            type: 'pulsed',
            damage: 45,
            cooldown: 2200
        },
        wingmen: {
            count: 2,
            type: EnemyType.LASER_INTERCEPTOR
        },
        hitboxScale: 0.7
    },
    [BossType.APOCALYPSE]: {
        type: BossType.APOCALYPSE,
        id: 'boss_apocalypse',
        name: 'Apocalypse',
        chineseName: '天启审判',
        describe: '终极龙王,轨迹莫测难寻,五维火力全域覆盖,双布雷机僚机协同,四重超载形态逐次显现,是霓虹战场的终极审判。',
        color: '#ff0000',
        level: 10,
        hp: 14000,
        speed: 2.3,
        size: { width: 360, height: 360 },
        score: 50000,
        sprite: 'boss_apocalypse',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER, BossWeaponType.SPREAD, BossWeaponType.HOMING],
        weaponConfigs: {
            bulletCount: 22,
            bulletSpeed: 8.0,
            fireRate: 0.10,
            targetedShotSpeed: 15
        },
        movement: {
            pattern: BossMovementPattern.ADAPTIVE,
            spawnX: BossSpawnPosition.RANDOM
        },
        laser: {
            type: 'pulsed',
            damage: 55,
            cooldown: 2000
        },
        wingmen: {
            count: 2,
            type: EnemyType.MINE_LAYER
        },
        hitboxScale: 0.7
    }
};

// 根据关卡等级获取Boss配置
export function getBossConfigByLevel(level: number): BossEntity | null {
    const bossEntry = Object.values(BossConfig).find((config) => config.level === level);
    return bossEntry || null;
}