import { WeaponType, BulletType, EnemyBulletType } from '@/types';

// ==================== 道具类型枚举 ====================
// Powerup types enumeration for better readability
export enum PowerupType {
    // Weapon Types (Directly mapped to WeaponType 0-7)
    VULCAN = 0,     // 散弹武器
    LASER = 1,      // 激光武器
    MISSILE = 2,    // 跟踪导弹
    WAVE = 3,       // 波动炮
    PLASMA = 4,     // 等离子炮
    TESLA = 5,      // 电磁炮
    MAGMA = 6,      // 熔岩炮
    SHURIKEN = 7,   // 手里剑

    // Special Powerups (Start from 100)
    POWER = 100,    // 武器能量提升
    HP = 101,       // 生命值恢复
    BOMB = 102,     // 炸弹
    OPTION = 103    // 僚机
}

// ==================== 敌人类型枚举 ====================
// Enemy types enumeration for better readability
export enum EnemyType {
    NORMAL = 0,             // 普通敌人 - Scout (红色无人机)
    FAST = 1,               // 快速移动 - Wing (紫色飞翼)
    TANK = 2,               // 坦克型 - Tank (绿色重坦)
    KAMIKAZE = 3,           // 神风特攻 - Kamikaze (橙色尖刺，自爆机)
    ELITE_GUNBOAT = 4,      // 精英炮艇 - Gunboat (蓝色炮舰)
    LASER_INTERCEPTOR = 5,  // 激光拦截机 - Interceptor (白色/青色)
    MINE_LAYER = 6,         // 布雷机 - Layer (深灰/黄色)
    PULSAR = 7,             // 脉冲机 - Pulsar (高攻速高速低血低伤)
    FORTRESS = 8,           // 堡垒机 - Fortress (高血高伤低速低攻速)
    STALKER = 9,            // 追踪机 - Stalker (高攻高移低血低攻速)
    BARRAGE = 10            // 弹幕机 - Barrage (高血高攻速低速低伤)
}

// ==================== 类型映射 ====================
// BulletType to WeaponType mapping for sprite generation
export const BulletToWeaponMap: { [key in BulletType]?: WeaponType } = {
    [BulletType.VULCAN]: WeaponType.VULCAN,
    [BulletType.LASER]: WeaponType.LASER,
    [BulletType.MISSILE]: WeaponType.MISSILE,
    [BulletType.WAVE]: WeaponType.WAVE,
    [BulletType.PLASMA]: WeaponType.PLASMA,
    [BulletType.TESLA]: WeaponType.TESLA,
    [BulletType.MAGMA]: WeaponType.MAGMA,
    [BulletType.SHURIKEN]: WeaponType.SHURIKEN,
};

// PowerupType to WeaponType mapping for powerup icons
// PowerupType to WeaponType mapping for powerup icons
// Now much simpler as weapon powerups match WeaponType values
export const PowerupToWeaponMap: { [key: number]: WeaponType } = {
    [PowerupType.VULCAN]: WeaponType.VULCAN,
    [PowerupType.LASER]: WeaponType.LASER,
    [PowerupType.MISSILE]: WeaponType.MISSILE,
    [PowerupType.WAVE]: WeaponType.WAVE,
    [PowerupType.PLASMA]: WeaponType.PLASMA,
    [PowerupType.TESLA]: WeaponType.TESLA,
    [PowerupType.MAGMA]: WeaponType.MAGMA,
    [PowerupType.SHURIKEN]: WeaponType.SHURIKEN
};

// Weapon Names Map for Audio and UI
export const WEAPON_NAMES: { [key in WeaponType]: string } = {
    [WeaponType.VULCAN]: 'vulcan',
    [WeaponType.LASER]: 'laser',
    [WeaponType.MISSILE]: 'missile',
    [WeaponType.WAVE]: 'wave',
    [WeaponType.PLASMA]: 'plasma',
    [WeaponType.TESLA]: 'tesla',
    [WeaponType.MAGMA]: 'magma',
    [WeaponType.SHURIKEN]: 'shuriken'
};

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
export const PlayerConfig = {
    chineseName: '霓虹雷电',
    chineseDescription: '高级原型战斗机，配备自适应武器系统，速度快、护盾强大，是抵挡敌人进攻的最后防线。',
    speed: 7,           // 移动速度
    width: 48,          // 碰撞箱宽度
    height: 48,         // 碰撞箱高度
    initialHp: 100,     // 初始生命值
    maxHp: 100,         // 最大生命值
    initialBombs: 3,    // 初始炸弹数量
    maxBombs: 9,        // 最大炸弹数量
    maxShield: 50,      // 最大护盾值
    color: '#00ffff',   // 显示颜色（青色）
    hitboxShrink: 0,    // 碰撞箱缩小（预留功能）
};

// ==================== 武器配置 ====================
export const WeaponConfig = {
    // VULCAN - 散弹（黄色）
    // 特性：扇形发射，子弹分裂（1→3→5→7）
    // 升级：等级1-2(1发)，3-5(3发)，6-8(5发)，9-10(7发)
    [WeaponType.VULCAN]: {
        chineseName: '散弹枪',
        chineseDescription: '扇形发射的经典近距离武器，子弹密度随等级提升而增加。火力覆盖广泛但威力一般。',
        baseDamage: 10,         // 基础伤害
        damagePerLevel: 3,      // 每级伤害增长
        speed: 15,              // 子弹速度
        baseFireRate: 100,      // 基础射速（毫秒）
        ratePerLevel: 2,        // 每级射速提升（毫秒减少）
        width: 10,              // 子弹宽度
        height: 20,             // 子弹高度
        color: '#fff',          // 子弹颜色
        sprite: 'bullet_vulcan' // 精灵图名称
    },
    // LASER - 激光（青色）
    // 特性：笔直高能激光，可穿透
    // 升级：等级1-4(单光束)，5-7(双光束)，8-10(三光束)
    [WeaponType.LASER]: {
        chineseName: '激光炮',
        chineseDescription: '高能激光束，笔直射出可穿透敌人，威力稳定。高等级时可分裂成多道光束。',
        baseDamage: 5,          // 基础伤害
        damagePerLevel: 3,      // 每级伤害增长
        speed: 25,              // 子弹速度
        baseFireRate: 60,       // 基础射速（毫秒）
        ratePerLevel: 0,        // 固定射速，不随等级变化
        width: 8,               // 子弹基础宽度（随等级变粗）
        height: 50,             // 子弹高度
        color: '#f0f',          // 子弹颜色
        sprite: 'bullet_laser'  // 精灵图名称
    },
    // MISSILE - 导弹（紫色）
    // 特性：跟踪导弹，自动追踪最近敌人
    // 升级：等级1-2(2发)，3-5(4发)，6-8(6发)，9-10(8发)
    [WeaponType.MISSILE]: {
        chineseName: '追踪导弹',
        chineseDescription: '自动追踪敌人的智能导弹，发射数量随等级增加。威力强劲但射速较慢。',
        baseDamage: 15,         // 基础伤害
        damagePerLevel: 6,      // 每级伤害增长
        speed: 12,              // 子弹速度
        baseFireRate: 100,      // 基础射速（毫秒）
        ratePerLevel: 2,        // 每级射速提升（毫秒减少）
        width: 16,              // 子弹宽度
        height: 32,             // 子弹高度
        color: '#f00',          // 子弹颜色
        sprite: 'bullet_missile' // 精灵图名称
    },
    // WAVE - 波动炮（蓝色）
    // 特性：宽幅波动，可穿透，威力巨大但射速慢
    // 升级：宽度92px→200px，射速330ms→150ms
    [WeaponType.WAVE]: {
        chineseName: '波动炮',
        chineseDescription: '宽幅能量波冲击，覆盖面积大可穿透敌人。威力极大但射速较慢，适合清场。',
        baseDamage: 20,         // 基础伤害
        damagePerLevel: 6,      // 每级伤害增长
        speed: 15,              // 子弹速度
        baseFireRate: 350,      // 基础射速（毫秒）
        ratePerLevel: 20,       // 每级射速提升（毫秒减少）
        width: 60,              // 子弹基础宽度（随等级变宽）
        height: 24,             // 子弹高度
        color: '#0ff',          // 子弹颜色
        sprite: 'bullet_wave'   // 精灵图名称
    },
    // PLASMA - 等离子炮（粉色）
    // 特性：缓慢移动能量球，AOE爆炸伤害
    // 升级：尺寸56×56→128×128，爆炸范围扩大
    [WeaponType.PLASMA]: {
        chineseName: '等离子炮',
        chineseDescription: '高能等离子球，触发爆炸产生范围伤害。威力最强但射速最慢，稀有武器。',
        baseDamage: 80,         // 基础伤害（单发最高）
        damagePerLevel: 25,     // 每级伤害增长
        speed: 8,               // 子弹速度（缓慢）
        baseFireRate: 600,      // 基础射速（毫秒）
        ratePerLevel: 50,       // 每级射速提升（毫秒减少）
        width: 32,              // 子弹基础宽度（随等级变大）
        height: 32,             // 子弹基础高度（随等级变大）
        color: '#ed64a6',       // 子弹颜色
        sprite: 'bullet_plasma' // 精灵图名称
    },
    // TESLA - 电磁炮（淡蓝）
    // 特性：自动锁定最近敌人，连锁攻击
    // 升级：连锁范围扩大，伤害递增
    [WeaponType.TESLA]: {
        chineseName: '电磁炮',
        chineseDescription: '释放电磁脉冲锁定敌人，支持连锁攻击。等级越高连锁范围越大威力越强。',
        baseDamage: 15,         // 基础伤害
        damagePerLevel: 4,      // 每级伤害增长
        speed: 20,              // 子弹速度
        baseFireRate: 200,      // 基础射速（毫秒）
        ratePerLevel: 10,       // 每级射速提升（毫秒减少）
        width: 16,              // 子弹宽度
        height: 64,             // 子弹高度
        color: '#ccf',          // 子弹颜色
        sprite: 'bullet_tesla'  // 精灵图名称
    },
    // MAGMA - 熔岩弹（橙红）
    // 特性：锥形散射，持续灼烧伤害
    // 升级：等级1-2(3发)，3-5(4发)，6-8(5发)，9-10(6发)
    [WeaponType.MAGMA]: {
        chineseName: '熔岩弹',
        chineseDescription: '锥形散射的炽热熔岩弹，命中后产生灼烧效果。覆盖面广但单发威力较弱。',
        baseDamage: 8,          // 基础伤害
        damagePerLevel: 2,      // 每级伤害增长
        speed: 12,              // 子弹平均速度（有随机变化）
        baseFireRate: 50,       // 基础射速（毫秒）
        ratePerLevel: 0,        // 固定射速
        width: 24,              // 子弹宽度
        height: 24,             // 子弹高度
        color: '#f60',          // 子弹颜色
        sprite: 'bullet_magma'  // 精灵图名称
    },
    // SHURIKEN - 手里剑（银灰）
    // 特性：扇形发射，可弹射反弹
    // 升级：等级1-2(2发)，3-5(3发)，6-8(4发)，9-10(5发)
    [WeaponType.SHURIKEN]: {
        chineseName: '手里剑',
        chineseDescription: '东方古老武器的现代版本，扇形发射可反弹。等级高时大范围覆盖地面。',
        baseDamage: 12,         // 基础伤害
        damagePerLevel: 3,      // 每级伤害增长
        speed: 12,              // 子弹速度
        baseFireRate: 400,      // 基础射速（毫秒）
        ratePerLevel: 30,       // 每级射速提升（毫秒减少）
        width: 24,              // 子弹宽度
        height: 24,             // 子弹高度
        color: '#ccc',          // 子弹颜色
        sprite: 'bullet_shuriken' // 精灵图名称
    }
};

// ==================== 武器升级配置 ====================
// 定义武器升级时的增强效果
export interface WeaponUpgradeEnhancements {
    bulletCount?: number;      // 子弹数量
    bulletWidth?: number;       // 子弹宽度增量
    bulletHeight?: number;      // 子弹高度增量
    beamCount?: number;         // 光束数量
    spread?: number;            // 散射角度
    offsetX?: number;           // X轴偏移
    offsetY?: number;           // Y轴偏移
    widthMultiplier?: number;   // 宽度倍数
    heightMultiplier?: number;  // 高度倍数
}

// 武器升级配置 - 每种武器在不同等级下的增强效果
export const WeaponUpgradeConfig: {
    [key in WeaponType]: {
        [level: number]: WeaponUpgradeEnhancements
    }
} = {
    // VULCAN - 散弹：子弹数量递增 1→3→5→7
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
    // LASER - 激光：宽度递增，光束数量增加
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
    // MISSILE - 导弹：数量递增 2→4→6→8
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
    // WAVE - 波动炮：宽度线性增长
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
    // PLASMA - 等离子炮：尺寸线性增长
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
    // TESLA - 电磁炮：保持默认配置（锁定范围在代码中处理）
    [WeaponType.TESLA]: {
        1: {},
        2: {},
        3: {},
        4: {},
        5: {},
        6: {},
        7: {},
        8: {},
        9: {},
        10: {}
    },
    // MAGMA - 熔岩炮：子弹数量递增
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
    // SHURIKEN - 手里剑：子弹数量递增
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
export const EnemyBulletConfig = {
    // ENEMY_ORB - 敌人普通能量球（红色）
    [EnemyBulletType.ORB]: {
        width: 20,              // 子弹宽度
        height: 20,             // 子弹高度
        color: '#f56565',       // 子弹颜色（红色）
        sprite: 'bullet_enemy_orb' // 精灵图名称
    },
    // ENEMY_BEAM - 敌人光束弹（橙色）
    [EnemyBulletType.BEAM]: {
        width: 12,              // 子弹宽度
        height: 32,             // 子弹高度
        color: '#f97316',       // 子弹颜色（橙色）
        sprite: 'bullet_enemy_beam' // 精灵图名称
    },
    // ENEMY_RAPID - 敌人快速弹（黄色）
    [EnemyBulletType.RAPID]: {
        width: 10,
        height: 20,
        color: '#ecc94b',       // 黄色
        sprite: 'bullet_enemy_rapid'
    },
    // ENEMY_HEAVY - 敌人重型弹（紫色）
    [EnemyBulletType.HEAVY]: {
        width: 28,
        height: 28,
        color: '#9f7aea',       // 紫色
        sprite: 'bullet_enemy_heavy'
    },
    // ENEMY_HOMING - 敌人追踪弹（绿色）
    [EnemyBulletType.HOMING]: {
        width: 16,
        height: 16,
        color: '#48bb78',       // 绿色
        sprite: 'bullet_enemy_homing'
    },
    // ENEMY_SPIRAL - 敌人螺旋弹（蓝色）
    [EnemyBulletType.SPIRAL]: {
        width: 14,
        height: 14,
        color: '#4299e1',       // 蓝色
        sprite: 'bullet_enemy_spiral'
    }
};

// ==================== 敌人生成权重配置 ====================
// 按关卡配置敌人类型的生成权重 - 权重越高，生成概率越大
export const EnemySpawnWeights = {
    1: { [EnemyType.NORMAL]: 10, [EnemyType.FAST]: 3, [EnemyType.TANK]: 1, [EnemyType.PULSAR]: 1 },
    2: { [EnemyType.NORMAL]: 3, [EnemyType.FAST]: 10, [EnemyType.TANK]: 2, [EnemyType.PULSAR]: 5, [EnemyType.STALKER]: 1 },
    3: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 3, [EnemyType.TANK]: 10, [EnemyType.KAMIKAZE]: 2, [EnemyType.PULSAR]: 3, [EnemyType.STALKER]: 3, [EnemyType.FORTRESS]: 1 },
    4: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 2, [EnemyType.TANK]: 3, [EnemyType.KAMIKAZE]: 10, [EnemyType.STALKER]: 5, [EnemyType.FORTRESS]: 3, [EnemyType.BARRAGE]: 1 },
    5: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 3, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 3, [EnemyType.ELITE_GUNBOAT]: 10, [EnemyType.FORTRESS]: 5, [EnemyType.BARRAGE]: 3 },
    6: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 3, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 3, [EnemyType.ELITE_GUNBOAT]: 3, [EnemyType.LASER_INTERCEPTOR]: 10, [EnemyType.BARRAGE]: 5, [EnemyType.PULSAR]: 5 },
    7: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 3, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 3, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 3, [EnemyType.MINE_LAYER]: 10, [EnemyType.STALKER]: 5 },
    8: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 10, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 8, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 4, [EnemyType.MINE_LAYER]: 3, [EnemyType.PULSAR]: 5, [EnemyType.STALKER]: 5, [EnemyType.FORTRESS]: 5, [EnemyType.BARRAGE]: 5 },
    9: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 8, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 10, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 4, [EnemyType.MINE_LAYER]: 3, [EnemyType.PULSAR]: 8, [EnemyType.STALKER]: 8, [EnemyType.FORTRESS]: 8, [EnemyType.BARRAGE]: 8 },
    10: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 9, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 10, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 5, [EnemyType.MINE_LAYER]: 4, [EnemyType.PULSAR]: 10, [EnemyType.STALKER]: 10, [EnemyType.FORTRESS]: 10, [EnemyType.BARRAGE]: 10 }
};

// ==================== 敌人配置 ====================
export const EnemyConfig = {
    baseSpawnRate: 1000,                // 基础生成间隔（毫秒） - 这里的数值越小，生成越快
    spawnRateReductionPerLevel: 200,    // 每关生成间隔减少量（毫秒）
    minSpawnRate: 300,                  // 最小生成间隔（毫秒）
    eliteChance: 0.15,                  // 精英怪生成概率（15%）
    eliteHpMultiplier: 3,               // 精英怪生命值倍率
    eliteSizeMultiplier: 1.3,           // 精英怪体积倍率
    enemyCountMultiplier: 1.15,         // 每关敌人数量增长倍率（15%）
    types: {
        // Scout - 红色无人机（普通敌人）
        // 行为：缓慢直线飞行，偶尔发射子弹
        [EnemyType.NORMAL]: {
            chineseName: '红色无人机',
            chineseDescription: '最基础的敌人单位，速度慢、血量低，是水送的得分来源。',
            baseHp: 20,             // 基础生命值
            hpPerLevel: 10,         // 每关生命值增长
            baseSpeed: 2,           // 基础速度
            speedPerLevel: 0.5,     // 每关速度增长
            width: 40,              // 宽度
            height: 40,             // 高度
            score: 100              // 击杀得分
        },
        // Wing - 紫色飞翼（快速移动）
        // 行为：快速折线移动，难以瞄准
        [EnemyType.FAST]: {
            chineseName: '紫色飞翼',
            chineseDescription: '速度轻快的飞翼敌机，折线移动较难瞄准。虽然血量低但子弹轰炸强，带来麻烦。',
            baseHp: 10,             // 基础生命值
            hpPerLevel: 0,          // 生命值不随关卡增长
            baseSpeed: 5,           // 基础速度
            speedPerLevel: 1,       // 每关速度增长
            width: 30,              // 宽度
            height: 40,             // 高度
            score: 200,             // 击杀得分
            shootFrequency: 0.015   // 射击频率（提高）
        },
        // Tank - 绿色重坦（坦克型）
        // 行为：移动缓慢，体积大，血厚
        [EnemyType.TANK]: {
            chineseName: '绿色重坦',
            chineseDescription: '默无声息的重型坦克车，体积大血量厚，移动缓慢。是不容忽视的重大威胁。',
            baseHp: 60,             // 基础生命值
            hpPerLevel: 20,         // 每关生命值增长
            baseSpeed: 1,           // 基础速度
            speedPerLevel: 0,       // 速度不随关卡增长
            width: 60,              // 宽度
            height: 60,             // 高度
            score: 300              // 击杀得分
        },
        // Kamikaze - 橙色尖刺（神风特攻）
        // 行为：快速冲向玩家位置，不发射子弹（自爆机）
        [EnemyType.KAMIKAZE]: {
            chineseName: '橙色尖刺',
            chineseDescription: '橙色尖刺形的尖兵机，速度最快直接冲撞。血量低但子弹轰炸强，带来残血。',
            baseHp: 5,              // 基础生命值
            hpPerLevel: 0,          // 生命值不随关卡增长
            baseSpeed: 7,           // 基础速度
            speedPerLevel: 0,       // 速度不随关卡增长
            width: 30,              // 宽度
            height: 30,             // 高度
            score: 400,             // 击杀得分
            shootFrequency: 0.02    // 射击频率（提高）
        },
        // Gunboat - 蓝色炮舰（精英炮艇）
        // 行为：移动极慢，发射瞄准玩家的快速弹幕
        [EnemyType.ELITE_GUNBOAT]: {
            chineseName: '蓝色炮舰',
            chineseDescription: '蓝色炮艇级、体积巨大血量厚。移动极慢但火力猛烈，是中低等级的大麻烦。',
            baseHp: 150,            // 基础生命值
            hpPerLevel: 30,         // 每关生命值增长
            baseSpeed: 0.5,         // 基础速度
            speedPerLevel: 0,       // 速度不随关卡增长
            width: 70,              // 宽度
            height: 50,             // 高度
            score: 500              // 击杀得分
        },
        // Interceptor - 白色/青色（激光拦截机）
        // 行为：移动到屏幕中段悬停，预警后发射贯穿激光
        [EnemyType.LASER_INTERCEPTOR]: {
            chineseName: '激光拦截机',
            chineseDescription: '白色/青色的双翼拦截机。会在屏幕中段悬停，然后发射强大激光造成较高伤害。',
            baseHp: 80,             // 基础生命值
            hpPerLevel: 15,         // 每关生命值增长
            baseSpeed: 4,           // 基础速度
            speedPerLevel: 0,       // 速度不随关卡增长
            width: 50,              // 宽度
            height: 50,             // 高度
            score: 600              // 击杀得分
        },
        // Layer - 深灰/黄色（布雷机）
        // 行为：移动缓慢，在身后持续留下静止空雷
        [EnemyType.MINE_LAYER]: {
            chineseName: '布雷机',
            chineseDescription: '深灰/黄色的布雷敌机。缓慢移动但持续留下静止空雷，是中后期关卡会遇到的障碍。',
            baseHp: 120,            // 基础生命值
            hpPerLevel: 20,         // 每关生命值增长
            baseSpeed: 1.5,         // 基础速度
            speedPerLevel: 0,       // 速度不随关卡增长
            width: 60,              // 宽度
            height: 40,             // 高度
            score: 700              // 击杀得分
        },
        // Pulsar - 脉冲机 (高攻速高速低血低伤)
        [EnemyType.PULSAR]: {
            chineseName: '脉冲机',
            chineseDescription: '高频发射脉冲弹的轻型战机。速度快射速高，但装甲薄弱。',
            baseHp: 15,
            hpPerLevel: 5,
            baseSpeed: 6,
            speedPerLevel: 0.5,
            width: 32,
            height: 32,
            score: 250,
            shootFrequency: 0.08
        },
        // Fortress - 堡垒机 (高血高伤低速低攻速)
        [EnemyType.FORTRESS]: {
            chineseName: '堡垒机',
            chineseDescription: '重装甲空中堡垒，移动缓慢但火力威力巨大。',
            baseHp: 200,
            hpPerLevel: 40,
            baseSpeed: 0.8,
            speedPerLevel: 0,
            width: 70,
            height: 70,
            score: 800,
            shootFrequency: 0.02
        },
        // Stalker - 追踪机 (高攻高移低血低攻速)
        [EnemyType.STALKER]: {
            chineseName: '追踪机',
            chineseDescription: '装备追踪系统的猎杀者，爆发伤害高且灵活，但持续作战能力弱。',
            baseHp: 30,
            hpPerLevel: 10,
            baseSpeed: 5,
            speedPerLevel: 0.5,
            width: 36,
            height: 36,
            score: 350,
            shootFrequency: 0.03
        },
        // Barrage - 弹幕机 (高血高攻速低速低伤)
        [EnemyType.BARRAGE]: {
            chineseName: '弹幕机',
            chineseDescription: '专门用于制造弹幕压制的重型机，虽然单发伤害低但覆盖面极广。',
            baseHp: 100,
            hpPerLevel: 20,
            baseSpeed: 1.2,
            speedPerLevel: 0.1,
            width: 50,
            height: 50,
            score: 600,
            shootFrequency: 0.1
        }
    }
};

// ==================== 敌人掉落物配置 ====================
export const PowerupDropConfig = {
    elitePowerupDropRate: 0.6,      // 精英怪掉落概率（60%）
    normalPowerupDropRate: 0.1,     // 普通怪掉落概率（10%）
};

// ==================== 道具掉落概率配置 ====================
// 击杀敌人有20%概率掉落道具，以下为各类道具的相对权重
// 权重分配基于武器强度：强力武器（PLASMA、WAVE）较稀有，基础武器较常见
export const PowerupDropRates = {
    [PowerupType.POWER]: 0.20,      // 武器能量提升: 20%
    [PowerupType.HP]: 0.18,         // 生命值恢复: 18%
    [PowerupType.VULCAN]: 0.10,     // 散弹武器: 10%
    [PowerupType.LASER]: 0.10,      // 激光武器: 10%
    [PowerupType.MISSILE]: 0.10,    // 导弹: 10%
    [PowerupType.SHURIKEN]: 0.08,   // 手里剑: 8%
    [PowerupType.TESLA]: 0.08,      // 电磁炮: 8%
    [PowerupType.MAGMA]: 0.08,      // 熔岩炮: 8%
    [PowerupType.WAVE]: 0.04,       // 波动炮: 4%
    [PowerupType.PLASMA]: 0.02,     // 等离子炮: 2%
    [PowerupType.BOMB]: 0.01,       // 炸弹: 1%
    [PowerupType.OPTION]: 0.01      // 僚机: 1%
};

// 根据掉落概率选择道具类型的辅助函数
export function selectPowerupType(): number {
    const r = Math.random();
    let cumulative = 0;

    for (const typeStr in PowerupDropRates) {
        const type = Number(typeStr);
        cumulative += PowerupDropRates[type as keyof typeof PowerupDropRates];
        if (r < cumulative) {
            return type;
        }
    }

    return PowerupType.POWER; // 默认返回武器能量提升
};

// ==================== 道具效果配置 ====================
export const PowerupEffects = {
    maxWeaponLevel: 10,         // 武器最高等级
    maxOptions: 3,              // 僚机最大数量
    maxBombs: 6,                // 炸弹最大数量
    hpRestoreAmount: 30,        // HP道具恢复量
    shieldRestoreAmount: 25,    // 护盾恢复量

    // 道具与武器类型映射
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
    minLevelDuration: 60,   // Boss生成前的最小关卡持续时间（秒）
    minLevelProgress: 99    // Boss生成前的最小关卡进度（%）
};

// ==================== Boss名称枚举 ====================
export enum BossName {
    GUARDIAN = 'GUARDIAN',           // 第1关 - 守护者
    INTERCEPTOR = 'INTERCEPTOR',     // 第2关 - 拦截者
    DESTROYER = 'DESTROYER',         // 第3关 - 毁灭者
    ANNIHILATOR = 'ANNIHILATOR',     // 第4关 - 歼灭者
    DOMINATOR = 'DOMINATOR',         // 第5关 - 主宰者
    OVERLORD = 'OVERLORD',           // 第6关 - 霸主
    TITAN = 'TITAN',                 // 第7关 - 泰坦
    COLOSSUS = 'COLOSSUS',           // 第8关 - 巨像
    LEVIATHAN = 'LEVIATHAN',         // 第9关 - 利维坦
    APOCALYPSE = 'APOCALYPSE'        // 第10关 - 天启
}

// ==================== Boss武器类型枚举 ====================
export enum BossWeaponType {
    RADIAL = 'radial',       // 环形弹幕
    TARGETED = 'targeted',   // 瞄准弹
    SPREAD = 'spread',       // 扇形弹幕
    HOMING = 'homing',       // 追踪导弹
    LASER = 'laser'          // 激光
}

// Boss武器名称映射
export const BossWeaponNames: { [key in BossWeaponType]: string } = {
    [BossWeaponType.RADIAL]: '环形弹幕',
    [BossWeaponType.TARGETED]: '瞄准弹',
    [BossWeaponType.SPREAD]: '扇形弹幕',
    [BossWeaponType.HOMING]: '追踪导弹',
    [BossWeaponType.LASER]: '激光'
};

// 敌人类型中文名称映射（用于Boss僚机）
export const WingmenNames: { [key: number]: string } = {
    0: '红色无人机',
    1: '紫色飞翼',
    2: '绿色重坦',
    3: '橙色尖刺',
    4: '蓝色炮舰',
    5: '激光拦截机',
    6: '布雷机'
};

// ==================== Boss配置 ====================
export const BossConfig = {
    // 第1关 - 守护者（无人机母舰）
    // 特点：平衡型新手教学Boss
    // 攻击模式：环形弹幕
    // 移动模式：正弦波动
    [BossName.GUARDIAN]: {
        chineseName: '守护者',
        chineseDescription: '无人机母舰，第一个会遭遇的Boss。装备环形弹幕武器。平衡的攻防配置是学习的好机会。',
        level: 1,                       // 关卡等级
        hp: 1500,                       // 生命值（基准值）
        speed: 1.2,                     // 移动速度
        size: 0.8,                      // 体积缩放
        bulletCount: 8,                 // 环形弹幕子弹数
        bulletSpeed: 4.0,               // 子弹速度
        fireRate: 0.06,                 // 开火频率（6%每帧，提升基础难度）
        targetedShotSpeed: 0,           // 瞄准弹速度（0=无）
        hasLaser: false,                // 是否具备激光
        weaponCount: 1,                 // 武器系统数量
        score: 5000,                    // 击杀得分
        weapons: [BossWeaponType.RADIAL],            // 武器类型：环形弹幕
        movementPattern: 'sine',        // 移动模式：正弦波动
        spawnX: 'random',               // 生成位置：随机
        wingmenCount: 0,                // 僚机数量
        wingmenType: 0,                 // 僚机类型
        laserType: 'none',              // 激光类型：无
        laserDamage: 0,                 // 激光伤害
        laserCooldown: 0,               // 激光冷却时间（毫秒）
        hitboxScale: 0.8                // 碰撞箱缩放比例
    },
    // 第2关 - 拦截者（突击巡洋舰）
    // 特点：高速低血，灵活骚扰型
    // 攻击模式：环形弹幕 + 瞄准弹
    // 移动模式：正弦波动
    [BossName.INTERCEPTOR]: {
        chineseName: '拦截者',
        chineseDescription: '突击巡洋舰，速度轻快血量较低。装备环形弹幕、瞄准弹武器。攻击速度快需要提高警惕才能躲避。',
        level: 2,
        hp: 1400,                       // 较低血量
        speed: 2.0,                     // 高速
        size: 0.8,
        bulletCount: 10,
        bulletSpeed: 4.5,
        fireRate: 0.08,                 // 高频率攻击
        targetedShotSpeed: 8,           // 瞄准弹速度
        hasLaser: false,
        weaponCount: 1,
        score: 10000,
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED], // 武器类型：环形 + 瞄准
        movementPattern: 'sine',
        spawnX: 'random',
        wingmenCount: 0,
        wingmenType: 0,
        laserType: 'none',
        laserDamage: 0,
        laserCooldown: 0,
        hitboxScale: 0.8
    },
    // 第3关 - 毁灭者（重型战列舰）
    // 特点：血厚攻击强，但速度慢，重型坂克
    // 攻击模式：环形弹幕 + 瞄准弹
    // 移动模式：8字盘旋
    [BossName.DESTROYER]: {
        chineseName: '毁灭者',
        chineseDescription: '重型战列舰，血量可观。装备环形弹幕、瞄准弹武器。密集的攻击需要敏感期锐的反应能力。',
        level: 3,
        hp: 2400,                       // 高血量
        speed: 0.8,                     // 低速
        size: 0.85,
        bulletCount: 16,                // 密集弹幕
        bulletSpeed: 5.5,               // 高速子弹
        fireRate: 0.04,                 // 低频高伤
        targetedShotSpeed: 9,
        hasLaser: false,
        weaponCount: 1,
        score: 15000,
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        movementPattern: 'figure8',     // 移动模式：8字盘旋
        spawnX: 'random',
        wingmenCount: 0,
        wingmenType: 0,
        laserType: 'none',
        laserDamage: 0,
        laserCooldown: 0,
        hitboxScale: 0.8
    },
    // 第4关 - 歼灭者（隐形战机）
    // 特点：瞄准弹极快，精准狙击型，血量中等
    // 攻击模式：环形弹幕 + 瞄准弹
    // 移动模式：8字盘旋
    [BossName.ANNIHILATOR]: {
        chineseName: '歼灭者',
        chineseDescription: '隐形战机，射击速度快为其特点。装备环形弹幕、瞄准弹武器。密集攻击需要大量躲避和反应。',
        level: 4,
        hp: 2000,                       // 中等血量
        speed: 1.5,
        size: 0.85,
        bulletCount: 12,                // 较少环形弹
        bulletSpeed: 5.0,
        fireRate: 0.06,
        targetedShotSpeed: 14,          // 极快瞄准弹
        hasLaser: false,
        weaponCount: 1,
        score: 20000,
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        movementPattern: 'figure8',
        spawnX: 'random',
        wingmenCount: 0,
        wingmenType: 0,
        laserType: 'none',
        laserDamage: 0,
        laserCooldown: 0,
        hitboxScale: 0.8
    },
    // 第5关 - 主宰者（能量要塞）
    // 特点：弹幕密集覆盖型，高频攻击
    // 攻击模式：环形弹幕 + 瞄准弹
    // 移动模式：8字盘旋
    [BossName.DOMINATOR]: {
        chineseName: '主宰者',
        chineseDescription: '能量要塞，弹幕最密集难以躲避。装备环形弹幕、瞄准弹武器。等级越高攻击越强，是中期的大麻烦。',
        level: 5,
        hp: 2800,                       // 中等血量
        speed: 1.3,                     // 中等偏慢
        size: 0.9,
        bulletCount: 24,                // 密集弹幕
        bulletSpeed: 5.0,
        fireRate: 0.09,                 // 高频攻击
        targetedShotSpeed: 10,
        hasLaser: false,
        weaponCount: 1,
        score: 25000,
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED],
        movementPattern: 'figure8',
        spawnX: 'random',
        wingmenCount: 0,
        wingmenType: 0,
        laserType: 'none',
        laserDamage: 0,
        laserCooldown: 0,
        hitboxScale: 0.8
    },
    // 第6关 - 霸主（双子舰）
    // 特点：首个激光Boss，激光突破型
    // 攻击模式：环形弹幕 + 瞄准弹 + 连续光束激光
    // 移动模式：追踪模式
    [BossName.OVERLORD]: {
        chineseName: '霸主',
        chineseDescription: '双子舰，首次提升激光攻击。装备环形弹幕、瞄准弹、连续激光武器。追踪你的位置然后画激光求救。',
        level: 6,
        hp: 3200,                       // 中等血量
        speed: 1.8,                     // 中快
        size: 0.9,
        bulletCount: 18,
        bulletSpeed: 6.0,
        fireRate: 0.07,
        targetedShotSpeed: 10,
        hasLaser: true,                 // 具备激光
        weaponCount: 2,
        score: 30000,
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER], // 武器类型：环形 + 瞄准 + 激光
        movementPattern: 'tracking',    // 移动模式：追踪
        spawnX: 'random',
        wingmenCount: 0,
        wingmenType: 0,
        laserType: 'continuous',        // 激光类型：连续光束
        laserDamage: 35,                // 激光伤害
        laserCooldown: 3000,            // 激光冷却时间3秒
        hitboxScale: 0.8
    },
    // 第7关 - 泰坦（三角要塞）
    // 特点：超高血量重装坦克型，速度慢
    // 攻击模式：环形弹幕 + 瞄准弹 + 连续光束激光
    // 移动模式：追踪模式
    [BossName.TITAN]: {
        chineseName: '泰坦',
        chineseDescription: '三角要塞，血段你的第一道大关。装备环形弹幕、瞄准弹、连续激光武器。重装坦克的防御是你最强的寄望。',
        level: 7,
        hp: 5000,                       // 超高血量
        speed: 1.0,                     // 慢速
        size: 0.95,
        bulletCount: 20,
        bulletSpeed: 6.5,
        fireRate: 0.065,                // 中低频
        targetedShotSpeed: 11,
        hasLaser: true,
        weaponCount: 2,
        score: 35000,
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER],
        movementPattern: 'tracking',
        spawnX: 'random',
        wingmenCount: 0,
        wingmenType: 0,
        laserType: 'continuous',
        laserDamage: 30,                // 中等激光伤害
        laserCooldown: 3500,            // 激光冷却时间3.5秒
        hitboxScale: 0.8
    },
    // 第8关 - 巨像（蛛型机甲）
    // 特点：爆发刺客型，脉冲激光高爆发，血量较低速度快
    // 攻击模式：环形弹幕 + 瞄准弹 + 脉冲激光 + 扇形弹幕
    // 移动模式：激进模式（主动追踪）
    // 僚机：1个激光拦截机
    [BossName.COLOSSUS]: {
        chineseName: '巨像',
        chineseDescription: '蛛型机甲，爆发刺客型内下手。装备环形弹幕、瞄准弹、脉冲激光、扇形弹幕武器，配置1个激光拦截机僚机。脉冲激光是其主要威胁，需要全力象。',
        level: 8,
        hp: 4000,                       // 较低血量
        speed: 2.2,                     // 高速
        size: 0.95,
        bulletCount: 22,
        bulletSpeed: 7.0,
        fireRate: 0.08,                 // 中高频
        targetedShotSpeed: 12,
        hasLaser: true,
        weaponCount: 2,
        score: 40000,
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER, BossWeaponType.SPREAD], // 武器类型：环形 + 瞄准 + 激光 + 扇形
        movementPattern: 'aggressive',  // 移动模式：激进（追踪+俯冲）
        spawnX: 'random',
        wingmenCount: 1,                // 僚机数量：1个
        wingmenType: 5,                 // 僚机类型：激光拦截机
        laserType: 'pulsed',            // 激光类型：脉冲
        laserDamage: 50,                // 激光伤害（单发10，5连发）
        laserCooldown: 2500,            // 激光冷却时间2.5秒
        hitboxScale: 0.8
    },
    // 第9关 - 利维坦（环形核心）
    // 特点：全能战士型，追踪导弹+高频攻击
    // 攻击模式：环形弹幕 + 瞄准弹 + 脉冲激光 + 扇形弹幕 + 追踪导弹
    // 移动模式：激进模式
    // 僚机：2个激光拦截机
    [BossName.LEVIATHAN]: {
        chineseName: '利维坦',
        chineseDescription: '环形核心，全能战士不可谋下。装备环形弹幕、瞄准弹、脉冲激光、扇形弹幕、追踪导弹武器，配置2个激光拦截机僚机。那些会发动旁点的激光是你最大的敌手。',
        level: 9,
        hp: 6000,                       // 中上血量
        speed: 1.6,                     // 中等速度
        size: 1.0,
        bulletCount: 26,
        bulletSpeed: 7.5,
        fireRate: 0.095,                // 高频攻击
        targetedShotSpeed: 13,
        hasLaser: true,
        weaponCount: 3,
        score: 45000,
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER, BossWeaponType.SPREAD, BossWeaponType.HOMING], // 武器类型：环形 + 瞄准 + 激光 + 扇形 + 追踪
        movementPattern: 'aggressive',
        spawnX: 'random',
        wingmenCount: 2,                // 僚机数量：2个
        wingmenType: 5,                 // 僚机类型：激光拦截机
        laserType: 'pulsed',
        laserDamage: 45,                // 激光伤害（单发9，5连发）
        laserCooldown: 2200,            // 激光冷却时间2.2秒
        hitboxScale: 0.8
    },
    // 第10关 - 天启（最终恶魔）
    // 特点：终极Boss，全面强化但不过分突兀
    // 攻击模式：环形弹幕 + 瞄准弹 + 脉冲激光 + 扇形弹幕 + 追踪导弹
    // 移动模式：激进模式
    // 僚机：2个布雷机
    [BossName.APOCALYPSE]: {
        chineseName: '天启',
        chineseDescription: '最终龙王，装备环形弹幕、瞄准弹、脉冲激光、扇形弹幕、追踪导弹武器，配置2个布雷机僚机。五重弹幕与激光齐飞，僚机掩护下势不可挡。唯有掌握节奏、把握间隙，才能突破天启的绝望防线。',
        level: 10,
        hp: 10000,                      // 1.67倍增长（相比第9关）
        speed: 2.3,                     // 高速
        size: 1.0,
        bulletCount: 30,
        bulletSpeed: 8.0,
        fireRate: 0.10,                 // 高频攻击
        targetedShotSpeed: 15,
        hasLaser: true,
        weaponCount: 3,
        score: 50000,
        weapons: [BossWeaponType.RADIAL, BossWeaponType.TARGETED, BossWeaponType.LASER, BossWeaponType.SPREAD, BossWeaponType.HOMING],
        movementPattern: 'aggressive',
        spawnX: 'random',
        wingmenCount: 2,                // 僚机数量：2个
        wingmenType: 6,                 // 僚机类型：布雷机
        laserType: 'pulsed',
        laserDamage: 55,                // 激光伤害（单发11，5连发）
        laserCooldown: 2000,            // 激光冷却时间2秒
        hitboxScale: 0.8
    }
};

// 根据关卡等级获取Boss配置的辅助函数
export function getBossConfigByLevel(level: number) {
    const bossEntry = Object.entries(BossConfig).find(([_, config]) => config.level === level);
    return bossEntry ? bossEntry[1] : null;
}
