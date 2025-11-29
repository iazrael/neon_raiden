// ==================== 核心类型枚举 ====================
// 所有枚举统一使用字符串值，便于调试和序列化

/**
 * 战机类型
 */
export enum FighterType {
    PLAYER = 'player'
}

/**
 * 武器类型
 */
export enum WeaponType {
    VULCAN = 'vulcan',      // 散弹
    LASER = 'laser',        // 激光
    MISSILE = 'missile',    // 跟踪导弹
    WAVE = 'wave',          // 波动炮 (穿透)
    PLASMA = 'plasma',      // 等离子 (范围爆炸)
    TESLA = 'tesla',        // 电磁 (连锁)
    MAGMA = 'magma',        // 熔岩 (持续伤害)
    SHURIKEN = 'shuriken'   // 手里剑 (弹射)
}

/**
 * 子弹类型
 */
export enum BulletType {
    VULCAN = 'vulcan',
    LASER = 'laser',
    MISSILE = 'missile',
    WAVE = 'wave',
    PLASMA = 'plasma',
    TESLA = 'tesla',
    MAGMA = 'magma',
    SHURIKEN = 'shuriken',
    ENEMY_ORB = 'enemy_orb',
    ENEMY_BEAM = 'enemy_beam',
    ENEMY_RAPID = 'enemy_rapid',
    ENEMY_HEAVY = 'enemy_heavy',
    ENEMY_HOMING = 'enemy_homing',
    ENEMY_SPIRAL = 'enemy_spiral'
}

/**
 * 敌人类型
 */
export enum EnemyType {
    NORMAL = 'normal',                      // 普通敌人 - Scout
    FAST = 'fast',                          // 快速移动 - Wing
    TANK = 'tank',                          // 坦克型 - Tank
    KAMIKAZE = 'kamikaze',                  // 神风特攻 - Kamikaze
    ELITE_GUNBOAT = 'elite_gunboat',        // 精英炮艇 - Gunboat
    LASER_INTERCEPTOR = 'laser_interceptor', // 激光拦截机 - Interceptor
    MINE_LAYER = 'mine_layer',              // 布雷机 - Layer
    PULSAR = 'pulsar',                      // 脉冲机
    FORTRESS = 'fortress',                  // 堡垒机
    STALKER = 'stalker',                    // 追踪机
    BARRAGE = 'barrage'                     // 弹幕机
}

/**
 * Boss类型（重命名自BossName）
 */
export enum BossType {
    GUARDIAN = 'guardian',           // 第1关 - 守护者
    INTERCEPTOR = 'interceptor',     // 第2关 - 拦截者
    DESTROYER = 'destroyer',         // 第3关 - 毁灭者
    ANNIHILATOR = 'annihilator',     // 第4关 - 歼灭者
    DOMINATOR = 'dominator',         // 第5关 - 主宰者
    OVERLORD = 'overlord',           // 第6关 - 霸主
    TITAN = 'titan',                 // 第7关 - 泰坦
    COLOSSUS = 'colossus',           // 第8关 - 巨像
    LEVIATHAN = 'leviathan',         // 第9关 - 利维坦
    APOCALYPSE = 'apocalypse'        // 第10关 - 天启
}

/**
 * 敌人子弹类型
 */
export enum EnemyBulletType {
    ORB = 'enemy_orb',          // 普通能量球
    BEAM = 'enemy_beam',        // 光束弹
    RAPID = 'enemy_rapid',      // 快速弹
    HEAVY = 'enemy_heavy',      // 重型弹
    HOMING = 'enemy_homing',    // 追踪弹
    SPIRAL = 'enemy_spiral'     // 螺旋弹
}

/**
 * Boss武器类型
 */
export enum BossWeaponType {
    RADIAL = 'radial',       // 环形弹幕
    TARGETED = 'targeted',   // 瞄准弹
    SPREAD = 'spread',       // 扇形弹幕
    HOMING = 'homing',       // 追踪导弹
    LASER = 'laser'          // 激光
}

/**
 * 道具类型
 */
export enum PowerupType {
    // Weapon Types (使用武器类型字符串)
    VULCAN = 'vulcan',
    LASER = 'laser',
    MISSILE = 'missile',
    WAVE = 'wave',
    PLASMA = 'plasma',
    TESLA = 'tesla',
    MAGMA = 'magma',
    SHURIKEN = 'shuriken',

    // Special Powerups
    POWER = 'power',    // 武器能量提升
    HP = 'hp',          // 生命值恢复
    BOMB = 'bomb',      // 炸弹
    OPTION = 'option',  // 僚机
    
    // 新增容错道具
    TEMP_SHIELD = 'temp_shield',  // 临时护盾
    TIME_SLOW = 'time_slow'       // 时间减缓
}

/**
 * Boss 的移动模式
 */
export enum BossMovementPattern {
    SINE = 'sine',
    FIGURE_8 = 'figure8',
    TRACKING = 'tracking',
    AGGRESSIVE = 'aggressive',
    // P3新增移动模式
    ZIGZAG = 'zigzag',              // 之字形移动
    RANDOM_TELEPORT = 'random_teleport', // 随机瞬移
    CIRCLE = 'circle',              // 圆形轨迹
    SLOW_DESCENT = 'slow_descent',  // 缓慢下沉
    ADAPTIVE = 'adaptive'           // 自适应追踪
}

/**
 * Boss 的生成位置
 */
export enum BossSpawnPosition {
    RANDOM = 'random',
    CENTER = 'center',
    LEFT = 'left',
    RIGHT = 'right'
}

// ==================== 实体基础接口 ====================

/**
 * 实体基础元数据
 */
export interface BaseEntityMeta {
    type: string;           // 实体类型标识
    id: string;             // 实体唯一ID
    name: string;           // 英文名称
    chineseName: string;        // 中文名称
    describe: string;       // 描述
    color: string;          // 主题颜色
}

/**
 * 尺寸配置
 */
export interface SizeConfig {
    width: number;
    height: number;
}

// ==================== 具体实体接口 ====================

/**
 * 战机实体
 */
export interface FighterEntity extends BaseEntityMeta {
    type: FighterType;
    size: SizeConfig;
    speed: number;              // 移动速度
    initialHp: number;          // 初始生命值
    maxHp: number;              // 最大生命值
    initialBombs: number;       // 初始炸弹数量
    maxBombs: number;           // 最大炸弹数量
    maxShield: number;          // 最大护盾值
    hitboxShrink: number;       // 碰撞箱缩小比例
    sprite: string;             // 精灵图名称
}

/**
 * 武器实体
 */
export interface WeaponEntity extends BaseEntityMeta {
    type: WeaponType;
    baseDamage: number;         // 基础伤害
    damagePerLevel: number;     // 每级伤害增长
    speed: number;              // 子弹速度
    baseFireRate: number;       // 基础射速（毫秒）
    ratePerLevel: number;       // 每级射速提升（毫秒减少）
    bullet: BulletEntity;       // 子弹配置
    sprite: string;             // 精灵图名称
    baseSpeed?: number;         // 基准速度（用于DPS计算，默认为15）
}

/**
 * 子弹实体
 */
export interface BulletEntity extends BaseEntityMeta {
    type: BulletType;
    size: SizeConfig;
    sprite: string;             // 精灵图名称
}

/**
 * 敌人实体
 */
export interface EnemyEntity extends BaseEntityMeta {
    type: EnemyType;
    baseHp: number;             // 基础生命值
    hpPerLevel: number;         // 每关生命值增长
    baseSpeed: number;          // 基础速度
    speedPerLevel: number;      // 每关速度增长
    size: SizeConfig;
    score: number;              // 击杀得分
    sprite: string;             // 精灵图名称
    weapon: {
        bulletType: EnemyBulletType; // 子弹类型
        speed?: number;              // 子弹速度
        damage?: number;             // 子弹伤害
        frequency?: number;          // 子弹频率
        interval?: number;           // 子弹间隔(间隔时间较长的用这个配置)
        chargeTime?: number;     // 充能时间
        cooldownTime?: number;   // 冷却时间
    };
}

/**
 * Boss武器实体
 */
export interface BossWeaponEntity extends BaseEntityMeta {
    type: BossWeaponType;
    bulletCount?: number;       // 子弹数量
    bulletSpeed?: number;       // 子弹速度
    fireRate?: number;          // 开火频率
    damage?: number;            // 伤害值
    cooldown?: number;          // 冷却时间（毫秒）
}

/**
 * Boss实体
 */
export interface BossEntity extends BaseEntityMeta {
    type: BossType;
    level: number;              // 关卡等级
    hp: number;                 // 生命值
    speed: number;              // 移动速度
    size: SizeConfig;           // 体积缩放
    score: number;              // 击杀得分
    weapons: BossWeaponType[];  // 武器类型列表
    sprite: string;             // 精灵图名称
    weaponConfigs: {            // 武器配置
        bulletCount: number;
        bulletSpeed: number;
        fireRate: number;
        targetedShotSpeed: number;
    };
    movement: {                 // 移动配置
        pattern: BossMovementPattern;
        spawnX: BossSpawnPosition;
    };
    laser?: {                   // 激光配置（可选）
        type: 'continuous' | 'pulsed' | 'none';
        damage: number;
        cooldown: number;
    };
    wingmen?: {                 // 僚机配置（可选）
        count: number;
        type: EnemyType;
    };
    hitboxScale: number;        // 碰撞箱缩放比例
}

/**
 * 武器升级增强效果
 */
export interface WeaponUpgradeEnhancements {
    bulletCount?: number;
    bulletWidth?: number;
    bulletHeight?: number;
    beamCount?: number;
    spread?: number;
    offsetX?: number;
    offsetY?: number;
    widthMultiplier?: number;
    heightMultiplier?: number;
    chainCount?: number;
    chainRange?: number;
}
