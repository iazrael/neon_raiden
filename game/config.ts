import { WeaponType, BulletType } from '@/types';

// ==================== 道具类型枚举 ====================
// Powerup types enumeration for better readability
export enum PowerupType {
    POWER = 0,      // 武器能量提升 - 提升当前武器等级
    LASER = 1,      // 激光武器 - 切换/升级为激光
    VULCAN = 2,     // 散弹武器 - 切换/升级为散弹
    HP = 3,         // 生命值恢复 - 恢复30HP，满血转为护盾
    WAVE = 4,       // 波动炮 - 切换/升级为波动炮
    PLASMA = 5,     // 等离子炮 - 切换/升级为等离子炮
    BOMB = 6,       // 炸弹 - 增加一个全屏炸弹
    OPTION = 7,     // 僚机 - 增加一个僚机（上限3个）
    TESLA = 8,      // 电磁炮 - 切换/升级为电磁武器
    MAGMA = 9,      // 熔岩炮 - 切换/升级为熔岩弹
    SHURIKEN = 10   // 手里剑 - 切换/升级为手里剑
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
    MINE_LAYER = 6          // 布雷机 - Layer (深灰/黄色)
}

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
    speed: 7,           // 移动速度
    width: 48,          // 碰撞箱宽度
    height: 48,         // 碰撞箱高度
    initialHp: 100,     // 初始生命值
    maxHp: 100,         // 最大生命值
    initialBombs: 3,    // 初始炸弹数量
    maxBombs: 6,        // 最大炸弹数量
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
        baseDamage: 5,          // 基础伤害
        damagePerLevel: 3,      // 每级伤害增长
        speed: 25,              // 子弹速度
        baseFireRate: 60,       // 基础射速（毫秒）
        ratePerLevel: 0,        // 固定射速，不随等级变化
        width: 12,              // 子弹基础宽度（随等级变粗）
        height: 60,             // 子弹高度
        color: '#f0f',          // 子弹颜色
        sprite: 'bullet_laser'  // 精灵图名称
    },
    // MISSILE - 导弹（紫色）
    // 特性：跟踪导弹，自动追踪最近敌人
    // 升级：等级1-2(2发)，3-5(4发)，6-8(6发)，9-10(8发)
    [WeaponType.MISSILE]: {
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
        baseDamage: 20,         // 基础伤害
        damagePerLevel: 6,      // 每级伤害增长
        speed: 15,              // 子弹速度
        baseFireRate: 350,      // 基础射速（毫秒）
        ratePerLevel: 20,       // 每级射速提升（毫秒减少）
        width: 80,              // 子弹基础宽度（随等级变宽）
        height: 30,             // 子弹高度
        color: '#0ff',          // 子弹颜色
        sprite: 'bullet_wave'   // 精灵图名称
    },
    // PLASMA - 等离子炮（粉色）
    // 特性：缓慢移动能量球，AOE爆炸伤害
    // 升级：尺寸56×56→128×128，爆炸范围扩大
    [WeaponType.PLASMA]: {
        baseDamage: 80,         // 基础伤害（单发最高）
        damagePerLevel: 25,     // 每级伤害增长
        speed: 8,               // 子弹速度（缓慢）
        baseFireRate: 600,      // 基础射速（毫秒）
        ratePerLevel: 50,       // 每级射速提升（毫秒减少）
        width: 48,              // 子弹基础宽度（随等级变大）
        height: 48,             // 子弹基础高度（随等级变大）
        color: '#ed64a6',       // 子弹颜色
        sprite: 'bullet_plasma' // 精灵图名称
    },
    // TESLA - 电磁炮（淡蓝）
    // 特性：自动锁定最近敌人，连锁攻击
    // 升级：连锁范围扩大，伤害递增
    [WeaponType.TESLA]: {
        baseDamage: 15,         // 基础伤害
        damagePerLevel: 4,      // 每级伤害增长
        speed: 20,              // 子弹速度
        baseFireRate: 200,      // 基础射速（毫秒）
        ratePerLevel: 10,       // 每级射速提升（毫秒减少）
        width: 32,              // 子弹宽度
        height: 32,             // 子弹高度
        color: '#ccf',          // 子弹颜色
        sprite: 'bullet_tesla'  // 精灵图名称
    },
    // MAGMA - 熔岩弹（橙红）
    // 特性：锥形散射，持续灼烧伤害
    // 升级：等级1-2(3发)，3-5(4发)，6-8(5发)，9-10(6发)
    [WeaponType.MAGMA]: {
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

// ==================== 敌人生成权重配置 ====================
// 按关卡配置敌人类型的生成权重 - 权重越高，生成概率越大
export const EnemySpawnWeights = {
    1: { [EnemyType.NORMAL]: 10 },
    2: { [EnemyType.NORMAL]: 7, [EnemyType.FAST]: 5 },
    3: { [EnemyType.NORMAL]: 5, [EnemyType.FAST]: 4, [EnemyType.TANK]: 3, [EnemyType.KAMIKAZE]: 3 },
    4: { [EnemyType.NORMAL]: 4, [EnemyType.FAST]: 5, [EnemyType.TANK]: 3, [EnemyType.KAMIKAZE]: 4 },
    5: { [EnemyType.NORMAL]: 3, [EnemyType.FAST]: 5, [EnemyType.TANK]: 3, [EnemyType.KAMIKAZE]: 5, [EnemyType.ELITE_GUNBOAT]: 2 },
    6: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 6, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 6, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 3 },
    7: { [EnemyType.NORMAL]: 2, [EnemyType.FAST]: 6, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 7, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 3, [EnemyType.MINE_LAYER]: 2 },
    8: { [EnemyType.NORMAL]: 1, [EnemyType.FAST]: 7, [EnemyType.TANK]: 2, [EnemyType.KAMIKAZE]: 8, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 4, [EnemyType.MINE_LAYER]: 3 },
    9: { [EnemyType.NORMAL]: 1, [EnemyType.FAST]: 8, [EnemyType.TANK]: 1, [EnemyType.KAMIKAZE]: 9, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 4, [EnemyType.MINE_LAYER]: 3 },
    10: { [EnemyType.NORMAL]: 1, [EnemyType.FAST]: 9, [EnemyType.TANK]: 1, [EnemyType.KAMIKAZE]: 10, [EnemyType.ELITE_GUNBOAT]: 2, [EnemyType.LASER_INTERCEPTOR]: 5, [EnemyType.MINE_LAYER]: 4 }
};

// ==================== 敌人配置 ====================
export const EnemyConfig = {
    baseSpawnRate: 1500,                // 基础生成间隔（毫秒）
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
            baseHp: 120,            // 基础生命值
            hpPerLevel: 20,         // 每关生命值增长
            baseSpeed: 1.5,         // 基础速度
            speedPerLevel: 0,       // 速度不随关卡增长
            width: 60,              // 宽度
            height: 40,             // 高度
            score: 700              // 击杀得分
        }
    }
};

// ==================== 敌人掉落物配置 ====================
export const PowerupDropConfig = {
    elitePowerupDropRate: 0.8,      // 精英怪掉落概率（80%）
    normalPowerupDropRate: 0.2,     // 普通怪掉落概率（20%）
};

// ==================== 道具掉落概率配置 ====================
// 击杀敌人有20%概率掉落道具，以下为各类道具的相对权重
// 权重分配基于武器强度：强力武器（PLASMA、WAVE）较稀有，基础武器较常见
export const PowerupDropRates = {
    [PowerupType.POWER]: 0.20,      // 武器能量提升: 20% (通用升级，最常见)
    [PowerupType.HP]: 0.18,         // 生命值恢复: 18% (生存必需)
    [PowerupType.LASER]: 0.12,      // 激光武器: 12% (平衡型武器)
    [PowerupType.VULCAN]: 0.12,     // 散弹武器: 12% (基础武器)
    [PowerupType.SHURIKEN]: 0.10,   // 手里剑: 10% (手里剑)
    [PowerupType.TESLA]: 0.09,      // 电磁炮: 9% (进阶武器)
    [PowerupType.MAGMA]: 0.09,      // 熔岩炮: 9% (进阶武器)
    [PowerupType.WAVE]: 0.05,       // 波动炮: 5% (强力武器，稀有)
    [PowerupType.PLASMA]: 0.03,     // 等离子炮: 3% (终极武器，非常稀有)
    [PowerupType.BOMB]: 0.02,       // 炸弹: 2% (战略道具，罕见)
    [PowerupType.OPTION]: 0.02      // 僚机: 0% (战略道具，罕见)
};

// 根据掉落概率选择道具类型的辅助函数
export function selectPowerupType(): number {
    const r = Math.random();
    let cumulative = 0;

    for (let type = PowerupType.POWER; type <= PowerupType.SHURIKEN; type++) {
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
        [PowerupType.POWER]: null,              // 通用武器升级（无特定武器类型）
        [PowerupType.HP]: null,                     // HP恢复（单独处理）
        [PowerupType.BOMB]: null,                   // 炸弹（单独处理）
        [PowerupType.OPTION]: null,                 // 僚机（单独处理）
        [PowerupType.LASER]: WeaponType.LASER,      // 激光武器
        [PowerupType.VULCAN]: WeaponType.VULCAN,    // 散弹武器
        [PowerupType.WAVE]: WeaponType.WAVE,        // 波动炮
        [PowerupType.PLASMA]: WeaponType.PLASMA,    // 等离子炮
        [PowerupType.TESLA]: WeaponType.TESLA,      // 电磁炮
        [PowerupType.MAGMA]: WeaponType.MAGMA,      // 熔岩炮
        [PowerupType.SHURIKEN]: WeaponType.SHURIKEN // 手里剑
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

// ==================== Boss配置 ====================
export const BossConfig = {
    // 第1关 - 守护者（无人机母舰）
    // 特点：平衡型新手教学Boss
    // 攻击模式：环形弹幕
    // 移动模式：正弦波动
    [BossName.GUARDIAN]: {
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
        weapons: ['radial'],            // 武器类型：环形弹幕
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
        weapons: ['radial', 'targeted'], // 武器类型：环形 + 瞄准
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
    // 特点：血厚攻击强，但速度慢，重型坦克
    // 攻击模式：环形弹幕 + 瞄准弹
    // 移动模式：8字盘旋
    [BossName.DESTROYER]: {
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
        weapons: ['radial', 'targeted'],
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
        weapons: ['radial', 'targeted'],
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
        weapons: ['radial', 'targeted'],
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
        weapons: ['radial', 'targeted', 'laser'], // 武器类型：环形 + 瞄准 + 激光
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
        weapons: ['radial', 'targeted', 'laser'],
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
        weapons: ['radial', 'targeted', 'laser', 'spread'], // 武器类型：环形 + 瞄准 + 激光 + 扇形
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
        weapons: ['radial', 'targeted', 'laser', 'spread', 'homing'], // 武器类型：环形 + 瞄准 + 激光 + 扇形 + 追踪
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
        weapons: ['radial', 'targeted', 'laser', 'spread', 'homing'],
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

// ==================== 子弹尺寸配置 ====================
// 子弹类型到其显示尺寸的映射
export const BulletSizeConfig = {
    [BulletType.VULCAN]: { width: 16, height: 32 },
    [BulletType.LASER]: { width: 24, height: 64 },
    [BulletType.MISSILE]: { width: 24, height: 48 },
    [BulletType.WAVE]: { width: 64, height: 32 },
    [BulletType.PLASMA]: { width: 48, height: 48 },
    [BulletType.ENEMY_ORB]: { width: 32, height: 32 },
    [BulletType.ENEMY_BEAM]: { width: 32, height: 32 },
    [BulletType.TESLA]: { width: 32, height: 32 },
    [BulletType.MAGMA]: { width: 32, height: 32 },
    [BulletType.SHURIKEN]: { width: 32, height: 32 }
};

// 根据关卡等级获取Boss配置的辅助函数
export function getBossConfigByLevel(level: number) {
    const bossEntry = Object.entries(BossConfig).find(([_, config]) => config.level === level);
    return bossEntry ? bossEntry[1] : null;
}
