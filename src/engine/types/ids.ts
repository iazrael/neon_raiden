// 常量

/**
 * 战机 ID
 */
export enum FighterId {
    NEON = 'neon_7'
}

/**
 * 武器 ID
 */
export enum WeaponId {
    // === 玩家武器 ===
    VULCAN = 'vulcan',      // 散弹枪
    LASER = 'laser',        // 激光枪 （穿透）
    MISSILE = 'missile',    // 跟踪导弹
    WAVE = 'wave',          // 波动炮 (大面积波)
    PLASMA = 'plasma',      // 等离子炮 (范围爆炸)
    TESLA = 'tesla',        // 电磁枪 (连锁)
    MAGMA = 'magma',        // 熔岩炉 (持续伤害)
    SHURIKEN = 'shuriken',   // 手里剑 (弹射)
}

// === 敌人通用武器 ===
export enum EnemyWeaponId {
    ENEMY_NORMAL = 'enemy_normal',
    ENEMY_FAST = 'enemy_fast',
    ENEMY_TANK = 'enemy_tank',
    ENEMY_ELITE = 'enemy_elite',
    ENEMY_SNIPER = 'enemy_sniper',
    ENEMY_LAYER = 'enemy_layer',
    ENEMY_PULSAR = 'enemy_pulsar',
    ENEMY_BARRAGE = 'enemy_barrage',

// === Boss 专用武器 (按 ID 映射) ===
    // Guardian
    GUARDIAN_RADIAL = 'boss_guardian_radial',
    GUARDIAN_RADIAL_ENRAGED = 'boss_guardian_radial_enraged',

    // Destroyer
    DESTROYER_MAIN = 'boss_destroyer_main',
    DESTROYER_DASH = 'boss_destroyer_dash',
    DESTROYER_BERSERK = 'boss_destroyer_berserk',

    // Titan
    TITAN_LASER_BASE = 'boss_titan_laser_base',
    TITAN_LASER_RAPID = 'boss_titan_laser_rapid',
    TITAN_OMNI = 'boss_titan_omni',

    // Apocalypse
    APOCALYPSE_MIXED = 'boss_apocalypse_mixed',
    APOCALYPSE_DEFENSE = 'boss_apocalypse_defense',
    APOCALYPSE_BERSERK = 'boss_apocalypse_berserk',
    APOCALYPSE_FINAL = 'boss_apocalypse_final',

    // Generic Boss Weapons (其他 Boss 复用)
    GENERIC_TARGETED = 'boss_generic_targeted',
    GENERIC_RADIAL = 'boss_generic_radial',
    GENERIC_LASER = 'boss_generic_laser',
    GENERIC_SPREAD = 'boss_generic_spread',
    GENERIC_HOMING = 'boss_generic_homing'
}

// | 武器枚举       | 弹种 ID              | 语义说明  |
// | ---------- | ------------------ | ----- |
// | `VULCAN`   | `'vulcanSpread'`   | 散弹扇形  |
// | `LASER`    | `'laserBeam'`      | 激光束   |
// | `MISSILE`  | `'missileHoming'`  | 追踪导弹  |
// | `WAVE`     | `'wavePulse'`      | 波动脉冲  |
// | `PLASMA`   | `'plasmaOrb'`      | 等离子球  |
// | `TESLA`    | `'teslaChain'`     | 电磁连锁  |
// | `MAGMA`    | `'magmaPool'`      | 熔岩池   |
// | `SHURIKEN` | `'shurikenBounce'` | 手里剑反弹 |

/**
 * 子弹类型的 ID 
 */
export enum AmmoType {
    // === 玩家弹药 ===
    VULCAN_SPREAD = 'vulcanSpread',   // 散弹扇形
    LASER_BEAM = 'laserBeam',         // 激光束
    MISSILE_HOMING = 'missileHoming', // 追踪导弹
    WAVE_PULSE = 'wavePulse',         // 波动脉冲
    PLASMA_ORB = 'plasmaOrb',         // 等离子球
    TESLA_CHAIN = 'teslaChain',       // 电磁连锁
    MAGMA_POOL = 'magmaPool',         // 熔岩池
    SHURIKEN_BOUNCE = 'shurikenBounce', // 手里剑反弹

    // === 敌人弹药 ===
    ENEMY_ORB_RED = 'enemy_orb_red',       // 普通红球
    ENEMY_ORB_BLUE = 'enemy_orb_blue',     // 普通蓝球
    ENEMY_ORB_GREEN = 'enemy_orb_green',   // 普通绿球
    ENEMY_BEAM_THIN = 'enemy_beam_thin',   // 细激光
    ENEMY_BEAM_THICK = 'enemy_beam_thick', // 粗激光 (Titan)
    ENEMY_RAPID = 'enemy_rapid',           // 速射弹
    ENEMY_HEAVY = 'enemy_heavy',           // 重炮弹
    ENEMY_HOMING = 'enemy_homing',         // 追踪弹
    ENEMY_SPIRAL = 'enemy_spiral',         // 螺旋弹
    ENEMY_MISSILE = 'enemy_missile',       // 敌方导弹
    ENEMY_PULSE = 'enemy_pulse',           // 脉冲弹
    ENEMY_VOID_ORB = 'enemy_void_orb',     // 虚空弹 (Apocalypse)
}

/**
 * buff 类型的 ID
 */
export enum BuffType {
    HP = 'hp',                 // 生命值提升
    POWER = 'power',           // 武器升级
    OPTION = 'option',         // 僚机
    BOMB = 'bomb',             // 炸弹
    SPEED = 'speed',           // 速度提升
    DAMAGE = 'damage',         // 伤害提升
    SHIELD = 'shield',         // 护盾提升
    INVINCIBILITY = 'invincibility', // 无敌
    TIME_SLOW = 'timeSlow',    // 时间减速
    RAPID_FIRE = 'rapidFire', // 射速提升
    PENETRATION = 'penetration', // 穿透提升
    CHAIN = 'chain',           // 连锁
    AREA = 'area',             // 范围扩大
    COOLDOWN = 'cooldown',     // 冷却减少
    DURATION = 'duration',     // 持续时间延长
}


/**
 * Boss ID
 */
export enum BossId {
    GUARDIAN = 'guardian',         // 守护者
    INTERCEPTOR = 'interceptor',   // 拦截者
    DESTROYER = 'destroyer',       // 毁灭者
    ANNIHILATOR = 'annihilator',   // 歼灭者
    DOMINATOR = 'dominator',       // 主宰者
    OVERLORD = 'overlord',         // 霸主
    TITAN = 'titan',               // 泰坦
    COLOSSUS = 'colossus',         // 巨像
    LEVIATHAN = 'leviathan',       // 利维坦
    APOCALYPSE = 'apocalypse'      // 天启
}

// 敌人 ID
export enum EnemyId {
    NORMAL = 'normal',           // 普通敌人
    FAST = 'fast',               // 快速敌人
    TANK = 'tank',               // 坦克敌人
    KAMIKAZE = 'kamikaze',       // 自杀式敌人
    ELITE_GUNBOAT = 'elite_gunboat', // 精英炮艇
    LASER_INTERCEPTOR = 'laser_interceptor', // 激光拦截机
    MINE_LAYER = 'mine_layer',   // 布雷船
    PULSAR = 'pulsar',           // 脉冲敌人
    FORTRESS = 'fortress',       // 堡垒敌人
    STALKER = 'stalker',         // 追踪者
    BARRAGE = 'barrage'          // 弹幕敌人
}

// 掉落物 ID
export const PickupId = {
    // 武器
    VULCAN: 'pickup_weapon_vulcan',
    LASER: 'pickup_weapon_laser',
    MISSILE: 'pickup_weapon_missile',
    SHURIKEN: 'pickup_weapon_shuriken',
    TESLA: 'pickup_weapon_tesla',
    MAGMA: 'pickup_weapon_magma',
    WAVE: 'pickup_weapon_wave',
    PLASMA: 'pickup_weapon_plasma',

    // Buff
    POWER: 'pickup_buff_power',
    HP: 'pickup_buff_hp',
    BOMB: 'pickup_buff_bomb',
    OPTION: 'pickup_buff_option',
    INVINCIBILITY: 'pickup_buff_invincibility',
    TIME_SLOW: 'pickup_buff_time_slow',

    // 特殊
    NONE: 'none', // 什么都不掉
};