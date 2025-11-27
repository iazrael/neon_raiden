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
    describe: '高级原型战斗机，配备自适应武器系统，速度快、护盾强大，是抵挡敌人进攻的最后防线。',
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
        chineseName: '散弹',
        describe: '扇形发射的基础子弹',
        color: '#fff',
        size: { width: 10, height: 20 },
        sprite: 'bullet_vulcan'
    },
    [BulletType.LASER]: {
        type: BulletType.LASER,
        id: 'bullet_laser',
        name: 'Laser Beam',
        chineseName: '激光束',
        describe: '高能激光束，可穿透敌人',
        color: '#f0f',
        size: { width: 8, height: 50 },
        sprite: 'bullet_laser'
    },
    [BulletType.MISSILE]: {
        type: BulletType.MISSILE,
        id: 'bullet_missile',
        name: 'Homing Missile',
        chineseName: '追踪导弹',
        describe: '自动追踪敌人的智能导弹',
        color: '#f00',
        size: { width: 16, height: 32 },
        sprite: 'bullet_missile'
    },
    [BulletType.WAVE]: {
        type: BulletType.WAVE,
        id: 'bullet_wave',
        name: 'Wave Cannon',
        chineseName: '波动炮',
        describe: '宽幅能量波，可穿透敌人',
        color: '#0ff',
        size: { width: 60, height: 24 },
        sprite: 'bullet_wave'
    },
    [BulletType.PLASMA]: {
        type: BulletType.PLASMA,
        id: 'bullet_plasma',
        name: 'Plasma Orb',
        chineseName: '等离子球',
        describe: '高能等离子球，触发爆炸产生范围伤害',
        color: '#ed64a6',
        size: { width: 32, height: 32 },
        sprite: 'bullet_plasma'
    },
    [BulletType.TESLA]: {
        type: BulletType.TESLA,
        id: 'bullet_tesla',
        name: 'Tesla Bolt',
        chineseName: '电磁脉冲',
        describe: '电磁脉冲，支持连锁攻击',
        color: '#ccf',
        size: { width: 16, height: 64 },
        sprite: 'bullet_tesla'
    },
    [BulletType.MAGMA]: {
        type: BulletType.MAGMA,
        id: 'bullet_magma',
        name: 'Magma Burst',
        chineseName: '熔岩弹',
        describe: '炽热的熔岩弹，命中后产生灼烧效果',
        color: '#f60',
        size: { width: 24, height: 24 },
        sprite: 'bullet_magma'
    },
    [BulletType.SHURIKEN]: {
        type: BulletType.SHURIKEN,
        id: 'bullet_shuriken',
        name: 'Shuriken',
        chineseName: '手里剑',
        describe: '可反弹的飞镖',
        color: '#ccc',
        size: { width: 24, height: 24 },
        sprite: 'bullet_shuriken'
    },
    // 敌人子弹
    [BulletType.ENEMY_ORB]: {
        type: BulletType.ENEMY_ORB,
        id: 'bullet_enemy_orb',
        name: 'Enemy Orb',
        chineseName: '敌人能量球',
        describe: '普通敌人发射的能量球',
        color: '#ff9999',
        size: { width: 14, height: 14 },
        sprite: 'bullet_enemy_orb'
    },
    [BulletType.ENEMY_BEAM]: {
        type: BulletType.ENEMY_BEAM,
        id: 'bullet_enemy_beam',
        name: 'Enemy Beam',
        chineseName: '敌人光束',
        describe: '敌人发射的光束弹',
        color: '#f97316',
        size: { width: 12, height: 32 },
        sprite: 'bullet_enemy_beam'
    },
    [BulletType.ENEMY_RAPID]: {
        type: BulletType.ENEMY_RAPID,
        id: 'bullet_enemy_rapid',
        name: 'Enemy Rapid',
        chineseName: '敌人快速弹',
        describe: '敌人发射的快速弹',
        color: '#ecc94b',
        size: { width: 10, height: 20 },
        sprite: 'bullet_enemy_rapid'
    },
    [BulletType.ENEMY_HEAVY]: {
        type: BulletType.ENEMY_HEAVY,
        id: 'bullet_enemy_heavy',
        name: 'Enemy Heavy',
        chineseName: '敌人重型弹',
        describe: '敌人发射的重型弹',
        color: '#9f7aea',
        size: { width: 28, height: 28 },
        sprite: 'bullet_enemy_heavy'
    },
    [BulletType.ENEMY_HOMING]: {
        type: BulletType.ENEMY_HOMING,
        id: 'bullet_enemy_homing',
        name: 'Enemy Homing',
        chineseName: '敌人追踪弹',
        describe: '敌人发射的追踪弹',
        color: '#48bb78',
        size: { width: 16, height: 16 },
        sprite: 'bullet_enemy_homing'
    },
    [BulletType.ENEMY_SPIRAL]: {
        type: BulletType.ENEMY_SPIRAL,
        id: 'bullet_enemy_spiral',
        name: 'Enemy Spiral',
        chineseName: '敌人螺旋弹',
        describe: '敌人发射的螺旋弹',
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
        chineseName: '散弹枪',
        describe: '扇形发射的经典近距离武器，子弹密度随等级提升而增加。火力覆盖广泛但威力一般。',
        color: '#fff',
        baseDamage: 10,
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
        chineseName: '激光炮',
        describe: '高能激光束，笔直射出可穿透敌人，威力稳定。高等级时可分裂成多道光束。',
        color: '#f0f',
        baseDamage: 5,
        damagePerLevel: 3,
        speed: 25,
        baseFireRate: 60,
        ratePerLevel: 0,
        bullet: BulletConfigs[BulletType.LASER],
        sprite: 'bullet_laser'
    },
    [WeaponType.MISSILE]: {
        type: WeaponType.MISSILE,
        id: 'weapon_missile',
        name: 'Homing Missile',
        chineseName: '追踪导弹',
        describe: '自动追踪敌人的智能导弹，发射数量随等级增加。威力强劲但射速较慢。',
        color: '#f00',
        baseDamage: 15,
        damagePerLevel: 6,
        speed: 12,
        baseFireRate: 100,
        ratePerLevel: 2,
        bullet: BulletConfigs[BulletType.MISSILE],
        sprite: 'bullet_missile'
    },
    [WeaponType.WAVE]: {
        type: WeaponType.WAVE,
        id: 'weapon_wave',
        name: 'Wave Cannon',
        chineseName: '波动炮',
        describe: '宽幅能量波冲击，覆盖面积大可穿透敌人。威力极大但射速较慢，适合清场。',
        color: '#0ff',
        baseDamage: 20,
        damagePerLevel: 6,
        speed: 15,
        baseFireRate: 350,
        ratePerLevel: 20,
        bullet: BulletConfigs[BulletType.WAVE],
        sprite: 'bullet_wave'
    },
    [WeaponType.PLASMA]: {
        type: WeaponType.PLASMA,
        id: 'weapon_plasma',
        name: 'Plasma Cannon',
        chineseName: '等离子炮',
        describe: '高能等离子球，触发爆炸产生范围伤害。威力最强但射速最慢，稀有武器。',
        color: '#ed64a6',
        baseDamage: 80,
        damagePerLevel: 25,
        speed: 8,
        baseFireRate: 600,
        ratePerLevel: 50,
        bullet: BulletConfigs[BulletType.PLASMA],
        sprite: 'bullet_plasma'
    },
    [WeaponType.TESLA]: {
        type: WeaponType.TESLA,
        id: 'weapon_tesla',
        name: 'Tesla Coil',
        chineseName: '电磁炮',
        describe: '释放电磁脉冲锁定敌人，支持连锁攻击。等级越高连锁范围越大威力越强。',
        color: '#ccf',
        baseDamage: 15,
        damagePerLevel: 4,
        speed: 20,
        baseFireRate: 200,
        ratePerLevel: 10,
        bullet: BulletConfigs[BulletType.TESLA],
        sprite: 'bullet_tesla'
    },
    [WeaponType.MAGMA]: {
        type: WeaponType.MAGMA,
        id: 'weapon_magma',
        name: 'Magma Burst',
        chineseName: '熔岩弹',
        describe: '锥形散射的炽热熔岩弹，命中后产生灼烧效果。覆盖面广但单发威力较弱。',
        color: '#f60',
        baseDamage: 8,
        damagePerLevel: 2,
        speed: 12,
        baseFireRate: 50,
        ratePerLevel: 0,
        bullet: BulletConfigs[BulletType.MAGMA],
        sprite: 'bullet_magma'
    },
    [WeaponType.SHURIKEN]: {
        type: WeaponType.SHURIKEN,
        id: 'weapon_shuriken',
        name: 'Shuriken',
        chineseName: '手里剑',
        describe: '东方古老武器的现代版本，扇形发射可反弹。等级高时大范围覆盖地面。',
        color: '#ccc',
        baseDamage: 12,
        damagePerLevel: 3,
        speed: 12,
        baseFireRate: 400,
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
        2: { bulletCount: 1 },
        3: { bulletCount: 3 },
        4: { bulletCount: 3 },
        5: { bulletCount: 3 },
        6: { bulletCount: 5 },
        7: { bulletCount: 5 },
        8: { bulletCount: 5 },
        9: { bulletCount: 7 },
        10: { bulletCount: 7 }
    },
    [WeaponType.LASER]: {
        1: { bulletWidth: 1, beamCount: 1 },
        2: { bulletWidth: 2, beamCount: 1 },
        3: { bulletWidth: 3, beamCount: 1 },
        4: { bulletWidth: 4, beamCount: 1 },
        5: { bulletWidth: 5, beamCount: 2 },
        6: { bulletWidth: 6, beamCount: 2 },
        7: { bulletWidth: 7, beamCount: 2 },
        8: { bulletWidth: 8, beamCount: 3 },
        9: { bulletWidth: 9, beamCount: 3 },
        10: { bulletWidth: 10, beamCount: 3 }
    },
    [WeaponType.MISSILE]: {
        1: { bulletCount: 2 },
        2: { bulletCount: 2 },
        3: { bulletCount: 4 },
        4: { bulletCount: 4 },
        5: { bulletCount: 4 },
        6: { bulletCount: 6 },
        7: { bulletCount: 6 },
        8: { bulletCount: 6 },
        9: { bulletCount: 8 },
        10: { bulletCount: 8 }
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
        9: { bulletWidth: 108 },
        10: { bulletWidth: 120 }
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
        9: { bulletWidth: 72, bulletHeight: 72 },
        10: { bulletWidth: 80, bulletHeight: 80 }
    },
    [WeaponType.TESLA]: {
        1: {}, 2: {}, 3: {}, 4: {}, 5: {},
        6: {}, 7: {}, 8: {}, 9: {}, 10: {}
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
        9: { bulletCount: 6 },
        10: { bulletCount: 6 }
    },
    [WeaponType.SHURIKEN]: {
        1: { bulletCount: 2 },
        2: { bulletCount: 2 },
        3: { bulletCount: 3 },
        4: { bulletCount: 3 },
        5: { bulletCount: 3 },
        6: { bulletCount: 4 },
        7: { bulletCount: 4 },
        8: { bulletCount: 4 },
        9: { bulletCount: 5 },
        10: { bulletCount: 5 }
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
    baseSpawnRate: 1000,
    spawnRateReductionPerLevel: 200,
    minSpawnRate: 300,
    eliteChance: 0.15,
    eliteHpMultiplier: 3,
    eliteSizeMultiplier: 1.3,
    enemyCountMultiplier: 1.15,
};

export const EnemyConfig: Record<EnemyType, EnemyEntity> = {
    [EnemyType.NORMAL]: {
        type: EnemyType.NORMAL,
        id: 'enemy_normal',
        name: 'Scout',
        chineseName: '红色无人机',
        describe: '最基础的敌人单位，速度慢、血量低，是水送的得分来源。',
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
        chineseName: '紫色飞翼',
        describe: '速度轻快的飞翼敌机，折线移动较难瞄准。虽然血量低但子弹轰炸强，带来麻烦。',
        color: '#aa44ff',
        baseHp: 10,
        hpPerLevel: 0,
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
        chineseName: '绿色重坦',
        describe: '默无声息的重型坦克车，体积大血量厚，移动缓慢。是不容忽视的重大威胁。',
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
        chineseName: '橙色尖刺',
        describe: '橙色尖刺形的尖兵机，速度最快直接冲撞。血量低但子弹轰炸强，带来残血。',
        color: '#ffaa44',
        baseHp: 5,
        hpPerLevel: 0,
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
        chineseName: '蓝色炮舰',
        describe: '蓝色炮艇级、体积巨大血量厚。移动极慢但火力猛烈，是中低等级的大麻烦。',
        color: '#4444ff',
        baseHp: 150,
        hpPerLevel: 30,
        baseSpeed: 0.5,
        speedPerLevel: 0,
        sprite: 'enemy_gunboat',
        size: { width: 70, height: 50 },
        score: 500,
        weapon: { bulletType: EnemyBulletType.RAPID, frequency: 0.02 ,speed: 4},
    },
    [EnemyType.LASER_INTERCEPTOR]: {
        type: EnemyType.LASER_INTERCEPTOR,
        id: 'enemy_interceptor',
        name: 'Interceptor',
        chineseName: '激光拦截机',
        describe: '白色/青色的双翼拦截机。会在屏幕中段悬停，然后发射强大激光造成较高伤害。',
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
        chineseName: '布雷机',
        describe: '深灰/黄色的布雷敌机。缓慢移动但持续留下静止空雷，是中后期关卡会遇到的障碍。',
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
        chineseName: '脉冲机',
        describe: '高频发射脉冲弹的轻型战机。速度快射速高，但装甲薄弱。',
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
        chineseName: '堡垒机',
        describe: '重装甲空中堡垒，移动缓慢但火力威力巨大。',
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
        chineseName: '追踪机',
        describe: '装备追踪系统的猎杀者，爆发伤害高且灵活，但持续作战能力弱。',
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
        chineseName: '弹幕机',
        describe: '专门用于制造弹幕压制的重型机，虽然单发伤害低但覆盖面极广。',
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
    maxWeaponLevel: 10,
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
        chineseName: '环形弹幕',
        describe: '环形弹幕武器，快速密集的弹幕覆盖范围广。',
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
        chineseName: '瞄准弹',
        describe: '瞄准弹武器，弹道会追踪目标造成持续伤害。',
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
        chineseName: '散射弹',
        describe: '散射弹武器，弹道会向四周散射造成广泛伤害。',
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
        chineseName: '追击弹',
        describe: '追击弹武器，弹道会追踪目标造成持续伤害。',
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
        chineseName: '激光',
        describe: '激光武器，连续发射的激光对目标造成持续伤害。',
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
        chineseName: '守护者',
        describe: '无人机母舰，第一个会遭遇的Boss。装备环形弹幕武器。平衡的攻防配置是学习的好机会。',
        color: '#4488ff',
        level: 1,
        hp: 1500,
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
        hitboxScale: 0.8
    },
    [BossType.INTERCEPTOR]: {
        type: BossType.INTERCEPTOR,
        id: 'boss_interceptor',
        name: 'Interceptor',
        chineseName: '拦截者',
        describe: '突击巡洋舰，速度轻快血量较低。装备环形弹幕、瞄准弹武器。攻击速度快需要提高警惕才能躲避。',
        color: '#ff4488',
        level: 2,
        hp: 1400,
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
            pattern: BossMovementPattern.SINE,
            spawnX: BossSpawnPosition.RANDOM
        },
        laser: {
            type: 'none',
            damage: 0,
            cooldown: 0
        },
        hitboxScale: 0.8
    },
    [BossType.DESTROYER]: {
        type: BossType.DESTROYER,
        id: 'boss_destroyer',
        name: 'Destroyer',
        chineseName: '毁灭者',
        describe: '重型战列舰，血量可观。装备环形弹幕、瞄准弹武器。密集的攻击需要敏感期锐的反应能力。',
        color: '#44ff88',
        level: 3,
        hp: 2400,
        speed: 0.8,
        size: { width: 220, height: 220 },
        score: 15000,
        sprite: 'boss_destroyer',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        weaponConfigs: {
            bulletCount: 16,
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
        hitboxScale: 0.8
    },
    [BossType.ANNIHILATOR]: {
        type: BossType.ANNIHILATOR,
        id: 'boss_annihilator',
        name: 'Annihilator',
        chineseName: '歼灭者',
        describe: '隐形战机，射击速度快为其特点。装备环形弹幕、瞄准弹武器。密集攻击需要大量躲避和反应。',
        color: '#ff8844',
        level: 4,
        hp: 2000,
        speed: 1.5,
        size: { width: 240, height: 240 },
        score: 20000,
        sprite: 'boss_annihilator',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        weaponConfigs: {
            bulletCount: 12,
            bulletSpeed: 5.0,
            fireRate: 0.06,
            targetedShotSpeed: 14
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
        hitboxScale: 0.8
    },
    [BossType.DOMINATOR]: {
        type: BossType.DOMINATOR,
        id: 'boss_dominator',
        name: 'Dominator',
        chineseName: '主宰者',
        describe: '能量要塞，弹幕最密集难以躲避。装备环形弹幕、瞄准弹武器。等级越高攻击越强，是中期的大麻烦。',
        color: '#8844ff',
        level: 5,
        hp: 2800,
        speed: 1.3,
        size: { width: 260, height: 260 },
        score: 25000,
        sprite: 'boss_dominator',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        weaponConfigs: {
            bulletCount: 24,
            bulletSpeed: 5.0,
            fireRate: 0.09,
            targetedShotSpeed: 10
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
        hitboxScale: 0.8
    },
    [BossType.OVERLORD]: {
        type: BossType.OVERLORD,
        id: 'boss_overlord',
        name: 'Overlord',
        chineseName: '霸主',
        describe: '双子舰，首次提升激光攻击。装备环形弹幕、瞄准弹、连续激光武器。追踪你的位置然后画激光求救。',
        color: '#ff44ff',
        level: 6,
        hp: 3200,
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
        hitboxScale: 0.8
    },
    [BossType.TITAN]: {
        type: BossType.TITAN,
        id: 'boss_titan',
        name: 'Titan',
        chineseName: '泰坦',
        describe: '三角要塞，血段你的第一道大关。装备环形弹幕、瞄准弹、连续激光武器。重装坦克的防御是你最强的寄望。',
        color: '#44ff44',
        level: 7,
        hp: 5000,
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
            pattern: BossMovementPattern.TRACKING,
            spawnX: BossSpawnPosition.RANDOM
        },
        laser: {
            type: 'continuous',
            damage: 30,
            cooldown: 3500
        },
        hitboxScale: 0.8
    },
    [BossType.COLOSSUS]: {
        type: BossType.COLOSSUS,
        id: 'boss_colossus',
        name: 'Colossus',
        chineseName: '巨像',
        describe: '蛛型机甲，爆发刺客型内下手。装备环形弹幕、瞄准弹、脉冲激光、扇形弹幕武器，配置1个激光拦截机僚机。脉冲激光是其主要威胁，需要全力象。',
        color: '#ffff44',
        level: 8,
        hp: 4000,
        speed: 2.2,
        size: { width: 320, height: 320 },
        score: 40000,
        sprite: 'boss_colossus',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER, BossWeaponType.SPREAD],
        weaponConfigs: {
            bulletCount: 22,
            bulletSpeed: 7.0,
            fireRate: 0.08,
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
        hitboxScale: 0.8
    },
    [BossType.LEVIATHAN]: {
        type: BossType.LEVIATHAN,
        id: 'boss_leviathan',
        name: 'Leviathan',
        chineseName: '利维坦',
        describe: '环形核心，全能战士不可谋下。装备环形弹幕、瞄准弹、脉冲激光、扇形弹幕、追踪导弹武器，配置2个激光拦截机僚机。那些会发动旁点的激光是你最大的敌手。',
        color: '#44ffff',
        level: 9,
        hp: 6000,
        speed: 1.6,
        size: { width: 340, height: 340 },
        score: 45000,
        sprite: 'boss_leviathan',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER, BossWeaponType.SPREAD, BossWeaponType.HOMING],
        weaponConfigs: {
            bulletCount: 26,
            bulletSpeed: 7.5,
            fireRate: 0.095,
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
        hitboxScale: 0.8
    },
    [BossType.APOCALYPSE]: {
        type: BossType.APOCALYPSE,
        id: 'boss_apocalypse',
        name: 'Apocalypse',
        chineseName: '天启',
        describe: '最终龙王，装备环形弹幕、瞄准弹、脉冲激光、扇形弹幕、追踪导弹武器，配置2个布雷机僚机。五重弹幕与激光齐飞，僚机掩护下势不可挡。唯有掌握节奏、把握间隙，才能突破天启的绝望防线。',
        color: '#ff0000',
        level: 10,
        hp: 10000,
        speed: 2.3,
        size: { width: 360, height: 360 },
        score: 50000,
        sprite: 'boss_apocalypse',
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER, BossWeaponType.SPREAD, BossWeaponType.HOMING],
        weaponConfigs: {
            bulletCount: 30,
            bulletSpeed: 8.0,
            fireRate: 0.10,
            targetedShotSpeed: 15
        },
        movement: {
            pattern: BossMovementPattern.AGGRESSIVE,
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
        hitboxScale: 0.8
    }
};

// 根据关卡等级获取Boss配置
export function getBossConfigByLevel(level: number): BossEntity | null {
    const bossEntry = Object.values(BossConfig).find((config) => config.level === level);
    return bossEntry || null;
}
