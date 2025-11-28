import {
    WeaponType,
    BulletType,
    EnemyType,
    BossType,
    EnemyBulletType,
    BossWeaponType,
    PowerupType,
    FighterType,
    FighterEntity,
    WeaponEntity,
    BulletEntity,
    EnemyEntity,
    BossEntity,
    WeaponUpgradeEnhancements,
    BossMovementPattern,
    BossSpawnPosition,
    BossWeaponEntity
} from '@/types';

// Re-export types for backward compatibility
export { EnemyType, PowerupType, BossWeaponType };


// ==================== 游戏基础配置 ====================
export const GameConfig = {
    width: 0,           // 游戏宽度（动态设置）
    height: 0,          // 游戏高度（动态设置）
    maxLevels: 10,      // 最大关卡数
    debug: false,       // 调试模式开关
};

// ==================== 资源路径配置 ====================
export const ASSETS_BASE_PATH = './assets/sprites/';

// ==================== 玩家配置 ====================
export const PlayerConfig: FighterEntity = {
    type: FighterType.PLAYER,
    id: 'player',
    name: 'Neon Raiden',
    chineseName: '霓虹雷电',
    describe: '第七代量子战机原型,搭载神经同步武器矩阵与相位能量护盾,以超光速机动性和次元防御技术成为银河防线的终极守护者。通过意识直连系统实现人机合一,展现超越极限的战斗美学。',
    color: '#00ffff',
    sprite: 'player',
    size: {
        width: 48,
        height: 48
    },
    speed: 7,
    initialHp: 100,
    maxHp: 100,
    initialBombs: 3,
    maxBombs: 9,
    maxShield: 50,
    hitboxShrink: 0
};

// ==================== 子弹配置 ====================
// 玩家武器子弹配置
export const BulletConfigs: Record<BulletType, BulletEntity> = {
    [BulletType.VULCAN]: {
        type: BulletType.VULCAN,
        id: 'bullet_vulcan',
        name: 'Vulcan Bullet',
        chineseName: '离子散射弹',
        describe: '超压缩稀土合金弹头,经纳米级表面处理后以扇形阵列覆盖战场,每发子弹都蕴含微型能量核心,在空间中划出炫目的霓虹轨迹,是面对集群敌人的优雅解决方案。',
        color: '#fff',
        size: { width: 10, height: 20 },
        sprite: 'bullet_vulcan'
    },
    [BulletType.LASER]: {
        type: BulletType.LASER,
        id: 'bullet_laser',
        name: 'Laser Beam',
        chineseName: '量子光束',
        describe: '零点能量凝聚而成的纯粹光之矛,穿透多层目标时会在空间中留下炫目的量子残影,对敌方结构造成分子级解离,是精准打击的艺术体现。',
        color: '#f0f',
        size: { width: 8, height: 50 },
        sprite: 'bullet_laser'
    },
    [BulletType.MISSILE]: {
        type: BulletType.MISSILE,
        id: 'bullet_missile',
        name: 'Homing Missile',
        chineseName: '智能追踪弹',
        describe: '搭载量子计算核心的自主武器,能够预判目标轨迹并进行空间跳跃式追击,接触瞬间释放超临界能量,绽放出致命而绚烂的等离子之花。',
        color: '#f00',
        size: { width: 16, height: 32 },
        sprite: 'bullet_missile'
    },
    [BulletType.WAVE]: {
        type: BulletType.WAVE,
        id: 'bullet_wave',
        name: 'Wave Cannon',
        chineseName: '相位波动',
        describe: '由共鸣水晶阵列激发的宽幅能量潮汐,穿透目标时释放连锁脉冲,在战场上掀起蓝色的能量风暴,是对抗密集阵型的终极利器。',
        color: '#0ff',
        size: { width: 60, height: 24 },
        sprite: 'bullet_wave'
    },
    [BulletType.PLASMA]: {
        type: BulletType.PLASMA,
        id: 'bullet_plasma',
        name: 'Plasma Orb',
        chineseName: '虚空等离子',
        describe: '反物质磁场约束的不稳定能量体,接触瞬间释放虚空之力,在目标表面形成微型奇点,绽放出粉色的毁灭之光,是稀有而强大的终极武器。',
        color: '#ed64a6',
        size: { width: 32, height: 32 },
        sprite: 'bullet_plasma'
    },
    [BulletType.TESLA]: {
        type: BulletType.TESLA,
        id: 'bullet_tesla',
        name: 'Tesla Bolt',
        chineseName: '特斯拉脉冲',
        describe: '高浓度电浆核心在目标间跳跃传导,编织出致命的电弧网络,每次跳跃都伴随着炫目的紫色闪电,对电子系统造成毁灭性的过载冲击。',
        color: '#ccf',
        size: { width: 16, height: 64 },
        sprite: 'bullet_tesla'
    },
    [BulletType.MAGMA]: {
        type: BulletType.MAGMA,
        id: 'bullet_magma',
        name: 'Magma Burst',
        chineseName: '恒星熔岩',
        describe: '封装恒星核心物质的超高温弹丸,命中后形成持续灼烧的橙色地狱,熔穿装甲的同时释放辐射热能,将战场化为炼狱。',
        color: '#f60',
        size: { width: 24, height: 24 },
        sprite: 'bullet_magma'
    },
    [BulletType.SHURIKEN]: {
        type: BulletType.SHURIKEN,
        id: 'bullet_shuriken',
        name: 'Shuriken',
        chineseName: '量子飞镖',
        describe: '记忆金属与量子核心的完美结合,在战场边界间完美反弹,每次碰撞都吸收环境能量,伤害呈指数增长,银色轨迹编织出死亡之舞。',
        color: '#ccc',
        size: { width: 24, height: 24 },
        sprite: 'bullet_shuriken'
    },
    // 敌人子弹
    [BulletType.ENEMY_ORB]: {
        type: BulletType.ENEMY_ORB,
        id: 'bullet_enemy_orb',
        name: 'Enemy Orb',
        chineseName: '能量弹',
        describe: '敌军标准武器系统发射的不稳定能量体,接触时释放腐蚀性冲击波,虽然基础但仍具威胁。',
        color: '#ff9999',
        size: { width: 14, height: 14 },
        sprite: 'bullet_enemy_orb'
    },
    [BulletType.ENEMY_BEAM]: {
        type: BulletType.ENEMY_BEAM,
        id: 'bullet_enemy_beam',
        name: 'Enemy Beam',
        chineseName: '光束',
        describe: '聚焦水晶强化的高密度能量流,持续穿透装甲并形成高温熔蚀通道,对护盾系统造成持续压制。',
        color: '#f97316',
        size: { width: 12, height: 32 },
        sprite: 'bullet_enemy_beam'
    },
    [BulletType.ENEMY_RAPID]: {
        type: BulletType.ENEMY_RAPID,
        id: 'bullet_enemy_rapid',
        name: 'Enemy Rapid',
        chineseName: '速射弹',
        describe: '轻量化弹头通过高频发射形成密集弹幕,单发伤害虽低但足以撕裂轻型护盾,数量即是力量。',
        color: '#ecc94b',
        size: { width: 10, height: 20 },
        sprite: 'bullet_enemy_rapid'
    },
    [BulletType.ENEMY_HEAVY]: {
        type: BulletType.ENEMY_HEAVY,
        id: 'bullet_enemy_heavy',
        name: 'Enemy Heavy',
        chineseName: '重炮弹',
        describe: '敌方重装单位的主力武器,填充高爆炸药与穿甲核心,对重型装甲目标造成毁灭性打击。',
        color: '#9f7aea',
        size: { width: 28, height: 28 },
        sprite: 'bullet_enemy_heavy'
    },
    [BulletType.ENEMY_HOMING]: {
        type: BulletType.ENEMY_HOMING,
        id: 'bullet_enemy_homing',
        name: 'Enemy Homing',
        chineseName: '追踪弹',
        describe: '配备双重锁定系统的智能导弹,追踪能量信号并调整轨迹,机动规避也难以摆脱。',
        color: '#48bb78',
        size: { width: 16, height: 16 },
        sprite: 'bullet_enemy_homing'
    },
    [BulletType.ENEMY_SPIRAL]: {
        type: BulletType.ENEMY_SPIRAL,
        id: 'bullet_enemy_spiral',
        name: 'Enemy Spiral',
        chineseName: '螺旋弹',
        describe: '螺旋力场维持的高速旋转弹,干扰锁定系统并在接近时突然加速,编织难以躲避的弹幕之网。',
        color: '#4299e1',
        size: { width: 14, height: 14 },
        sprite: 'bullet_enemy_spiral'
    }
};

// ==================== 武器配置 ====================
export const WeaponConfig: Record<WeaponType, WeaponEntity> = {
    [WeaponType.VULCAN]: {
        type: WeaponType.VULCAN,
        id: 'weapon_vulcan',
        name: 'Vulcan Gun',
        chineseName: '离子机炮',
        describe: '智能弹道预测系统根据敌机密度自动调整扇形覆盖,纳米级表面处理确保远距离精准打击,是可靠而优雅的基础武装。',

        color: '#fff',
        baseDamage: 8,
        damagePerLevel: 3,
        speed: 15,
        baseFireRate: 100,
        ratePerLevel: 2,
        bullet: BulletConfigs[BulletType.VULCAN],
        sprite: 'bullet_vulcan'
    },
    [WeaponType.LASER]: {
        type: WeaponType.LASER,
        id: 'weapon_laser',
        name: 'Laser Cannon',
        chineseName: '量子激光阵',
        describe: '零点能量凝聚核心生成的高聚焦光束,升级时激活谐振腔使光束分裂增宽,形成穿透网络。每道光束穿透多个目标后仍保持80%能量,是对抗集群的终极利器。',

        color: '#f0f',
        baseDamage: 8,
        damagePerLevel: 3,
        speed: 25,
        baseFireRate: 120,
        ratePerLevel: 0,
        bullet: BulletConfigs[BulletType.LASER],
        sprite: 'bullet_laser'
    },
    [WeaponType.MISSILE]: {
        type: WeaponType.MISSILE,
        id: 'weapon_missile',
        name: 'Homing Missile',
        chineseName: '智能追踪系统',
        describe: '自主学习型量子计算机同时锁定多个高价值目标,复合推进技术在接近时加速至亚光速,高爆核心产生定向能爆炸,即使最敏捷的敌机也难逃毁灭。',

        color: '#f00',
        baseDamage: 15,
        damagePerLevel: 6,
        speed: 15,
        baseFireRate: 350,
        ratePerLevel: 15,
        bullet: BulletConfigs[BulletType.MISSILE],
        sprite: 'bullet_missile'
    },
    [WeaponType.WAVE]: {
        type: WeaponType.WAVE,
        id: 'weapon_wave',
        name: 'Wave Cannon',
        chineseName: '相位波动炮',
        describe: '特殊晶体阵列产生的宽幅能量震荡波,升级时解锁更多晶体使波宽呈指数增长,穿过目标时释放脉冲能量引发连锁反应,是清场的终极武器。',

        color: '#0ff',
        baseDamage: 20,
        damagePerLevel: 6,
        speed: 12,
        baseFireRate: 400,
        ratePerLevel: 20,
        bullet: BulletConfigs[BulletType.WAVE],
        sprite: 'bullet_wave'
    },
    [WeaponType.PLASMA]: {
        type: WeaponType.PLASMA,
        id: 'weapon_plasma',
        name: 'Plasma Cannon',
        chineseName: '虚空等离子炮',
        describe: '磁场约束技术压缩不稳定虚空能量形成高密度等离子球,接触时磁场解除产生微型黑洞效应,形成大范围杀伤。稀有而强大,是对抗Boss的终极选择。',

        color: '#ed64a6',
        baseDamage: 60,
        damagePerLevel: 15,
        speed: 8,
        baseFireRate: 600,
        ratePerLevel: 20,
        bullet: BulletConfigs[BulletType.PLASMA],
        sprite: 'bullet_plasma'
    },
    [WeaponType.TESLA]: {
        type: WeaponType.TESLA,
        id: 'weapon_tesla',
        name: 'Tesla Coil',
        chineseName: '特斯拉线圈',
        describe: '量子电磁脉冲系统生成高浓度电浆团,击中目标后电流在敌人间跳跃传导形成闭合电路。升级后传导距离增加、连锁次数增多,在密集战场中发挥最大效能。',

        color: '#ccf',
        baseDamage: 15,
        damagePerLevel: 4,
        speed: 25,
        baseFireRate: 200,
        ratePerLevel: 10,
        bullet: BulletConfigs[BulletType.TESLA],
        sprite: 'bullet_tesla'
    },
    [WeaponType.MAGMA]: {
        type: WeaponType.MAGMA,
        id: 'weapon_magma',
        name: 'Magma Burst',
        chineseName: '恒星熔岩炮',
        describe: '超压缩技术将恒星核心物质封装成弹丸,锥形散射最大化覆盖目标区域,命中后形成持续灼烧场熔穿装甲。高射速配合持续伤害,是持续输出的理想选择。',

        color: '#f60',
        baseDamage: 8,
        damagePerLevel: 2,
        speed: 12,
        baseFireRate: 75,
        ratePerLevel: 0,
        bullet: BulletConfigs[BulletType.MAGMA],
        sprite: 'bullet_magma'
    },
    [WeaponType.SHURIKEN]: {
        type: WeaponType.SHURIKEN,
        id: 'weapon_shuriken',
        name: 'Shuriken',
        chineseName: '量子飞镖',
        describe: '记忆金属与量子核心打造的特制飞镖,在战场边界完美反弹并通过量子感应追踪敌人。每次反弹吸收环境能量使伤害指数增长,熟练飞行员可利用复杂轨迹造成毁灭性打击。',

        color: '#ccc',
        baseDamage: 12,
        damagePerLevel: 3,
        speed: 12,
        baseFireRate: 300,
        ratePerLevel: 30,
        bullet: BulletConfigs[BulletType.SHURIKEN],
        sprite: 'bullet_shuriken'
    }
};

// ==================== 武器升级配置 ====================
export const WeaponUpgradeConfig: {
    [key in WeaponType]: {
        [level: number]: WeaponUpgradeEnhancements
    }
} = {
    [WeaponType.VULCAN]: {
        1: { bulletCount: 1 },
        2: { bulletCount: 2 },
        3: { bulletCount: 3 },
        4: { bulletCount: 4 },
        5: { bulletCount: 5 },
        6: { bulletCount: 6 },
        7: { bulletCount: 7 },
        8: { bulletCount: 8 },
        9: { bulletCount: 9 }
    },
    [WeaponType.LASER]: {
        1: { bulletWidth: 1, beamCount: 1 },
        2: { bulletWidth: 2, beamCount: 1 },
        3: { bulletWidth: 3, beamCount: 1 },
        4: { bulletWidth: 4, beamCount: 2 },
        5: { bulletWidth: 5, beamCount: 2 },
        6: { bulletWidth: 6, beamCount: 2 },
        7: { bulletWidth: 7, beamCount: 3 },
        8: { bulletWidth: 8, beamCount: 3 },
        9: { bulletWidth: 9, beamCount: 3 }
    },
    [WeaponType.MISSILE]: {
        1: { bulletCount: 1 },
        2: { bulletCount: 2 },
        3: { bulletCount: 4 },
        4: { bulletCount: 4 },
        5: { bulletCount: 4 },
        6: { bulletCount: 6 },
        7: { bulletCount: 6 },
        8: { bulletCount: 6 },
        9: { bulletCount: 8 }
    },
    [WeaponType.WAVE]: {
        1: { bulletWidth: 12 },
        2: { bulletWidth: 24 },
        3: { bulletWidth: 36 },
        4: { bulletWidth: 48 },
        5: { bulletWidth: 60 },
        6: { bulletWidth: 72 },
        7: { bulletWidth: 84 },
        8: { bulletWidth: 96 },
        9: { bulletWidth: 108 }
    },
    [WeaponType.PLASMA]: {
        1: { bulletWidth: 8, bulletHeight: 8 },
        2: { bulletWidth: 16, bulletHeight: 16 },
        3: { bulletWidth: 24, bulletHeight: 24 },
        4: { bulletWidth: 32, bulletHeight: 32 },
        5: { bulletWidth: 40, bulletHeight: 40 },
        6: { bulletWidth: 48, bulletHeight: 48 },
        7: { bulletWidth: 56, bulletHeight: 56 },
        8: { bulletWidth: 64, bulletHeight: 64 },
        9: { bulletWidth: 72, bulletHeight: 72 }
    },
    [WeaponType.TESLA]: {
        1: { chainCount: 1, chainRange: 150 },
        2: { chainCount: 1, chainRange: 160 },
        3: { chainCount: 2, chainRange: 170 },
        4: { chainCount: 2, chainRange: 180 },
        5: { chainCount: 3, chainRange: 190 },
        6: { chainCount: 3, chainRange: 200 },
        7: { chainCount: 4, chainRange: 210 },
        8: { chainCount: 4, chainRange: 220 },
        9: { chainCount: 5, chainRange: 230 }
    },
    [WeaponType.MAGMA]: {
        1: { bulletCount: 3 },
        2: { bulletCount: 3 },
        3: { bulletCount: 4 },
        4: { bulletCount: 4 },
        5: { bulletCount: 4 },
        6: { bulletCount: 5 },
        7: { bulletCount: 5 },
        8: { bulletCount: 5 },
        9: { bulletCount: 6 }
    },
    [WeaponType.SHURIKEN]: {
        1: { bulletCount: 2 },
        2: { bulletCount: 3 },
        3: { bulletCount: 3 },
        4: { bulletCount: 4 },
        5: { bulletCount: 4 },
        6: { bulletCount: 5 },
        7: { bulletCount: 5 },
        8: { bulletCount: 6 },
        9: { bulletCount: 6 }
    }
};

// ==================== 敌人子弹配置 ====================

// ==================== 敌人生成权重配置 ====================
export const EnemySpawnWeights: Record<number, Record<EnemyType, number>> = {
    1: { [EnemyType.NORMAL]: 10, [EnemyType.FAST]: 3, [EnemyType.TANK]: 1, [EnemyType.PULSAR]: 1, [EnemyType.KAMIKAZE]: 0, [EnemyType.ELITE_GUNBOAT]: 0, [EnemyType.LASER_INTERCEPTOR]: 0, [EnemyType.MINE_LAYER]: 0, [EnemyType.FORTRESS]: 0, [EnemyType.STALKER]: 0, [EnemyType.BARRAGE]: 0 },
    2: { [EnemyType.NORMAL]: 3, [EnemyType.FAST]: 10, [EnemyType.TANK]: 2, [EnemyType.PULSAR]: 5, [EnemyType.STALKER]: 1, [EnemyType.KAMIKAZE]: 0, [EnemyType.ELITE_GUNBOAT]: 0, [EnemyType.LASER_INTERCEPTOR]: 0, [EnemyType.MINE_LAYER]: 0, [EnemyType.FORTRESS]: 0, [EnemyType.BARRAGE]: 0 },
    3: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 3, [EnemyType.TANK]: 10, [EnemyType.KAMIKAZE]: 2, [EnemyType.PULSAR]: 3, [EnemyType.STALKER]: 3, [EnemyType.FORTRESS]: 1, [EnemyType.ELITE_GUNBOAT]: 0, [EnemyType.LASER_INTERCEPTOR]: 0, [EnemyType.MINE_LAYER]: 0, [EnemyType.BARRAGE]: 0 },
    4: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 2, [EnemyType.TANK]: 3, [EnemyType.KAMIKAZE]: 10, [EnemyType.STALKER]: 5, [EnemyType.FORTRESS]: 3, [EnemyType.BARRAGE]: 1, [EnemyType.PULSAR]: 0, [EnemyType.ELITE_GUNBOAT]: 0, [EnemyType.LASER_INTERCEPTOR]: 0, [EnemyType.MINE_LAYER]: 0 },
    5: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 3, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 3, [EnemyType.ELITE_GUNBOAT]: 10, [EnemyType.FORTRESS]: 5, [EnemyType.BARRAGE]: 3, [EnemyType.PULSAR]: 0, [EnemyType.STALKER]: 0, [EnemyType.LASER_INTERCEPTOR]: 0, [EnemyType.MINE_LAYER]: 0 },
    6: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 3, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 3, [EnemyType.ELITE_GUNBOAT]: 3, [EnemyType.LASER_INTERCEPTOR]: 10, [EnemyType.BARRAGE]: 5, [EnemyType.PULSAR]: 5, [EnemyType.FORTRESS]: 0, [EnemyType.STALKER]: 0, [EnemyType.MINE_LAYER]: 0 },
    7: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 3, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 3, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 3, [EnemyType.MINE_LAYER]: 10, [EnemyType.STALKER]: 5, [EnemyType.PULSAR]: 0, [EnemyType.FORTRESS]: 0, [EnemyType.BARRAGE]: 0 },
    8: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 10, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 8, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 4, [EnemyType.MINE_LAYER]: 3, [EnemyType.PULSAR]: 5, [EnemyType.STALKER]: 5, [EnemyType.FORTRESS]: 5, [EnemyType.BARRAGE]: 5 },
    9: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 8, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 10, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 4, [EnemyType.MINE_LAYER]: 3, [EnemyType.PULSAR]: 8, [EnemyType.STALKER]: 8, [EnemyType.FORTRESS]: 8, [EnemyType.BARRAGE]: 8 },
    10: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 9, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 10, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 5, [EnemyType.MINE_LAYER]: 4, [EnemyType.PULSAR]: 10, [EnemyType.STALKER]: 10, [EnemyType.FORTRESS]: 10, [EnemyType.BARRAGE]: 10 }
};

// ==================== 敌人配置 ====================

export const EnemyCommonConfig = {
    baseSpawnRate: 1200,
    spawnRateReductionPerLevel: 200,
    minSpawnRate: 300,
    eliteChance: 0.15,
    eliteHpMultiplier: 3,
    eliteSizeMultiplier: 1.3,
    eliteScoreMultiplier: 3,
    eliteDamageMultiplier: 1.5,
    eliteFireRateMultiplier: 1.5,
    enemyCountMultiplier: 1.15,
};

export const EnemyConfig: Record<EnemyType, EnemyEntity> = {
    [EnemyType.NORMAL]: {
        type: EnemyType.NORMAL,
        id: 'enemy_normal',
        name: 'Scout',
        chineseName: '侦察机',
        describe: '敌军基础侦察单位,轻装甲低速度,是战场上最常见的炮灰,也是积累分数的主要来源。',
        color: '#ff4444',
        baseHp: 20,
        hpPerLevel: 10,
        baseSpeed: 2,
        speedPerLevel: 0.5,
        sprite: 'enemy_normal',
        size: { width: 40, height: 40 },
        score: 100,
        weapon: { bulletType: EnemyBulletType.ORB, frequency: 0.015 }
    },
    [EnemyType.FAST]: {
        type: EnemyType.FAST,
        id: 'enemy_fast',
        name: 'Wing',
        chineseName: '疾风飞翼',
        describe: '高速飞翼战机,以折线轨迹高速机动难以锁定,虽然装甲薄弱但射速惊人,是灵活而危险的对手。',
        color: '#aa44ff',
        baseHp: 10,
        hpPerLevel: 2,
        baseSpeed: 8,
        speedPerLevel: 0.5,
        sprite: 'enemy_fast',
        size: { width: 30, height: 40 },
        score: 200,
        weapon: { bulletType: EnemyBulletType.ORB, frequency: 0.05 }
    },
    [EnemyType.TANK]: {
        type: EnemyType.TANK,
        id: 'enemy_tank',
        name: 'Tank',
        chineseName: '重装坦克',
        describe: '搭载纳米复合装甲的移动堡垒,吸收80%常规武器伤害,虽然移动缓慢但配备矢量推进系统可短距冲刺,需要集火才能快速摧毁。',
        color: '#44ff44',
        baseHp: 60,
        hpPerLevel: 20,
        baseSpeed: 1,
        speedPerLevel: 0,
        sprite: 'enemy_tank',
        size: { width: 60, height: 60 },
        score: 300,
        weapon: { bulletType: EnemyBulletType.ORB, frequency: 0.015 }
    },
    [EnemyType.KAMIKAZE]: {
        type: EnemyType.KAMIKAZE,
        id: 'enemy_kamikaze',
        name: 'Kamikaze',
        chineseName: '自杀尖刺',
        describe: '装备量子斥力场的高速突击单位,接近时瞬间加速至亚光速,机身覆盖超硬合金刺状结构,血量极低但速度极快,以冲撞造成致命伤害。',
        color: '#ffaa44',
        baseHp: 5,
        hpPerLevel: 1,
        baseSpeed: 10,
        speedPerLevel: 0.8,
        sprite: 'enemy_kamikaze',
        size: { width: 30, height: 30 },
        score: 400,
        weapon: { bulletType: EnemyBulletType.ORB, frequency: 0.02 }
    },
    [EnemyType.ELITE_GUNBOAT]: {
        type: EnemyType.ELITE_GUNBOAT,
        id: 'enemy_gunboat',
        name: 'Gunboat',
        chineseName: '精英炮艇',
        describe: '星核驱动的精英级重型炮艇,血量火力机动性全面超越常规单位,同时锁定多目标发射能量聚合光束,核心反应堆护盾抵御90%常规攻击,是敌方舰队的终极杀器。',
        color: '#4444ff',
        baseHp: 150,
        hpPerLevel: 30,
        baseSpeed: 0.5,
        speedPerLevel: 0,
        sprite: 'enemy_gunboat',
        size: { width: 70, height: 50 },
        score: 500,
        weapon: { bulletType: EnemyBulletType.RAPID, frequency: 0.02, speed: 4 },
    },
    [EnemyType.LASER_INTERCEPTOR]: {
        type: EnemyType.LASER_INTERCEPTOR,
        id: 'enemy_interceptor',
        name: 'Interceptor',
        chineseName: '光束拦截机',
        describe: '装备相位锁定光束炮的双翼拦截机,在战场中段悬停蓄力后发射切割空间的强大激光束,对直线上所有目标造成毁灭性打击。',
        color: '#44ffff',
        baseHp: 80,
        hpPerLevel: 15,
        baseSpeed: 4,
        speedPerLevel: 0,
        sprite: 'enemy_interceptor',
        size: { width: 50, height: 50 },
        score: 600,
        weapon: { bulletType: EnemyBulletType.BEAM, speed: 12, damage: 30, chargeTime: 2000, cooldownTime: 1000 }
    },
    [EnemyType.MINE_LAYER]: {
        type: EnemyType.MINE_LAYER,
        id: 'enemy_layer',
        name: 'Mine Layer',
        chineseName: '战术布雷机',
        describe: '配备量子感应地雷部署系统的战术单位,缓慢移动但持续留下隐形空雷,根据能量特征自动触发,形成致命的防御网络。',
        color: '#aaaa44',
        baseHp: 120,
        hpPerLevel: 20,
        baseSpeed: 1.5,
        speedPerLevel: 0,
        sprite: 'enemy_layer',
        size: { width: 60, height: 40 },
        score: 700,
        weapon: { bulletType: EnemyBulletType.HEAVY, interval: 1500, damage: 25 },
    },
    [EnemyType.PULSAR]: {
        type: EnemyType.PULSAR,
        id: 'enemy_pulsar',
        name: 'Pulsar',
        chineseName: '脉冲战机',
        describe: '轻量化合金机身的高速战机,配备高频脉冲武器系统在短时间内倾泻大量弹药,虽然装甲薄弱但依靠高机动性规避火力。',
        color: '#ff44ff',
        baseHp: 15,
        hpPerLevel: 5,
        baseSpeed: 6,
        speedPerLevel: 0.5,
        sprite: 'enemy_pulsar',
        size: { width: 32, height: 32 },
        score: 250,
        weapon: { bulletType: EnemyBulletType.RAPID, frequency: 0.08, speed: 6 },
    },
    [EnemyType.FORTRESS]: {
        type: EnemyType.FORTRESS,
        id: 'enemy_fortress',
        name: 'Fortress',
        chineseName: '空中堡垒',
        describe: '搭载多层能量护盾和复合装甲的重装单位,移动缓慢但火力巨大,多管火炮系统覆盖广阔战场,是敌方舰队的核心火力输出。',
        color: '#666666',
        baseHp: 200,
        hpPerLevel: 40,
        baseSpeed: 0.8,
        speedPerLevel: 0,
        sprite: 'enemy_fortress',
        size: { width: 70, height: 70 },
        score: 800,
        weapon: { bulletType: EnemyBulletType.ORB, frequency: 0.02 }
    },
    [EnemyType.STALKER]: {
        type: EnemyType.STALKER,
        id: 'enemy_stalker',
        name: 'Stalker',
        chineseName: '猎杀追踪机',
        describe: '装备量子纠缠锁定系统的精英猎杀单位,动作灵活爆发伤害高,预判移动轨迹发射的追踪弹几乎无法被常规手段规避。',
        color: '#ff8844',
        baseHp: 30,
        hpPerLevel: 10,
        baseSpeed: 5,
        speedPerLevel: 0.5,
        sprite: 'enemy_stalker',
        size: { width: 36, height: 36 },
        score: 350,
        weapon: { bulletType: EnemyBulletType.HOMING, frequency: 0.03, speed: 3 },
    },
    [EnemyType.BARRAGE]: {
        type: EnemyType.BARRAGE,
        id: 'enemy_barrage',
        name: 'Barrage',
        chineseName: '弹幕压制机',
        describe: '搭载多管螺旋弹幕系统的战术压制单位,制造覆盖面极广的弹幕,螺旋能量弹形成复杂弹道网络,迫使玩家在极小安全区域内机动。',
        color: '#8844ff',
        baseHp: 100,
        hpPerLevel: 20,
        baseSpeed: 1.2,
        speedPerLevel: 0.1,
        sprite: 'enemy_barrage',
        size: { width: 50, height: 50 },
        score: 600,
        weapon: { bulletType: EnemyBulletType.SPIRAL, frequency: 0.2, speed: 3 },
    }
};


// ==================== 道具掉落配置 ====================
export const PowerupDropConfig = {
    elitePowerupDropRate: 0.6,
    normalPowerupDropRate: 0.1,
    bossDropRate: 1.0,
};

export const PowerupDropRates: Record<PowerupType, number> = {
    [PowerupType.POWER]: 0.20,
    [PowerupType.HP]: 0.18,
    [PowerupType.VULCAN]: 0.10,
    [PowerupType.LASER]: 0.10,
    [PowerupType.MISSILE]: 0.10,
    [PowerupType.SHURIKEN]: 0.08,
    [PowerupType.TESLA]: 0.08,
    [PowerupType.MAGMA]: 0.08,
    [PowerupType.WAVE]: 0.04,
    [PowerupType.PLASMA]: 0.02,
    [PowerupType.BOMB]: 0.01,
    [PowerupType.OPTION]: 0.01
};

export function selectPowerupType(): PowerupType {
    const r = Math.random();
    let cumulative = 0;

    for (const type of Object.values(PowerupType)) {
        cumulative += PowerupDropRates[type];
        if (r < cumulative) {
            return type;
        }
    }

    return PowerupType.POWER;
}

export const PowerupEffects = {
    maxWeaponLevel: 9,
    maxOptions: 3,
    maxBombs: 6,
    hpRestoreAmount: 30,
    shieldRestoreAmount: 25,
    weaponTypeMap: {
        [PowerupType.POWER]: null,
        [PowerupType.HP]: null,
        [PowerupType.BOMB]: null,
        [PowerupType.OPTION]: null,
        [PowerupType.VULCAN]: WeaponType.VULCAN,
        [PowerupType.LASER]: WeaponType.LASER,
        [PowerupType.MISSILE]: WeaponType.MISSILE,
        [PowerupType.WAVE]: WeaponType.WAVE,
        [PowerupType.PLASMA]: WeaponType.PLASMA,
        [PowerupType.TESLA]: WeaponType.TESLA,
        [PowerupType.MAGMA]: WeaponType.MAGMA,
        [PowerupType.SHURIKEN]: WeaponType.SHURIKEN
    }
};

// ==================== Boss生成时机配置 ====================
export const BossSpawnConfig = {
    minLevelDuration: 50,
    minLevelProgress: 100
};

// ==================== Boss武器配置 ====================
export const BossWeaponConfig: Record<BossWeaponType, BossWeaponEntity> = {
    [BossWeaponType.RADIAL]: {
        type: BossWeaponType.RADIAL,
        id: 'boss_weapon_radial',
        name: 'Radial',
        chineseName: '全向弹幕',
        describe: '量子脉冲加速引擎驱动的环形弹幕系统,超光速同时发射多枚高能弹丸,形成360度无死角的致命弹幕网,覆盖范围广密度极高。',
        bulletSpeed: 3.0,
        bulletCount: 8,
        fireRate: 0.05,
        cooldown: 0,
        color: '#ff4444',
    },
    [BossWeaponType.TARGETED]: {
        type: BossWeaponType.TARGETED,
        id: 'boss_weapon_targeted',
        name: 'Targeted',
        chineseName: '精准制导',
        describe: '神经同步锁定技术驱动的高精度制导系统,实时分析目标轨迹进行预判性打击,即使最敏捷的目标也难以逃脱。',
        bulletSpeed: 5.0,
        bulletCount: 1,
        fireRate: 0.05,
        cooldown: 0,
        color: '#ff8844',
    },
    [BossWeaponType.SPREAD]: {
        type: BossWeaponType.SPREAD,
        id: 'boss_weapon_spread',
        name: 'Spread',
        chineseName: '扇形散射',
        describe: '多弹头系统母弹发射后分裂为多枚子弹形成扇形攻击面,子弹间产生量子纠缠效应,即使部分被拦截其余仍保持高精度打击。',
        bulletSpeed: 4.0,
        bulletCount: 3,
        fireRate: 0.05,
        cooldown: 0,
        color: '#44ff88',
    },
    [BossWeaponType.HOMING]: {
        type: BossWeaponType.HOMING,
        id: 'boss_weapon_homing',
        name: 'Homing',
        chineseName: '智能追击',
        describe: '搭载微型AI核心和时空感知模块的智能导弹系统,无视物理障碍进行空间跳跃式追踪,一旦锁定便穷追不舍直至命中或被摧毁。',
        bulletSpeed: 4.0,
        bulletCount: 2,
        fireRate: 0.05,
        cooldown: 0,
        color: '#44ffff',
    },
    [BossWeaponType.LASER]: {
        type: BossWeaponType.LASER,
        id: 'boss_weapon_laser',
        name: 'Laser',
        chineseName: '粒子光束',
        describe: '核聚变反应产生的超高温粒子流武器系统,切割任何已知物质,激光束具有量子穿透特性,绕过常规护盾直接攻击目标核心。',
        bulletSpeed: 2.0,
        bulletCount: 1,
        fireRate: 0.05,
        cooldown: 0,
        color: '#ff44ff',
    },
};

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
        hp: 1800,
        speed: 1.2,
        size: { width: 180, height: 180 },
        score: 5000,
        sprite: 'boss_guardian',
        weapons: [BossWeaponType.RADIAL],
        weaponConfigs: {
            bulletCount: 8,
            bulletSpeed: 4.0,
            fireRate: 0.06,
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
        hp: 2400,
        speed: 2.0,
        size: { width: 200, height: 200 },
        score: 10000,
        sprite: 'boss_interceptor',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        weaponConfigs: {
            bulletCount: 10,
            bulletSpeed: 4.5,
            fireRate: 0.08,
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
        hp: 3200,
        speed: 0.8,
        size: { width: 220, height: 220 },
        score: 15000,
        sprite: 'boss_destroyer',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        weaponConfigs: {
            bulletCount: 24,
            bulletSpeed: 5.5,
            fireRate: 0.04,
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
        hp: 4000,
        speed: 1.5,
        size: { width: 240, height: 240 },
        score: 20000,
        sprite: 'boss_annihilator',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        weaponConfigs: {
            bulletCount: 15,
            bulletSpeed: 5.0,
            fireRate: 0.06,
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
        hp: 5500,
        speed: 1.3,
        size: { width: 260, height: 260 },
        score: 25000,
        sprite: 'boss_dominator',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        weaponConfigs: {
            bulletCount: 18,
            bulletSpeed: 5.0,
            fireRate: 0.07,
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
        hp: 16000,
        speed: 2.3,
        size: { width: 360, height: 360 },
        score: 50000,
        sprite: 'boss_apocalypse',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER, BossWeaponType.SPREAD, BossWeaponType.HOMING],
        weaponConfigs: {
            bulletCount: 26,
            bulletSpeed: 8.0,
            fireRate: 0.09,
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
