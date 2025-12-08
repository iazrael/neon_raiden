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
    VULCAN = 'vulcan',      // 散弹枪
    LASER = 'laser',        // 激光枪 （穿透）
    MISSILE = 'missile',    // 跟踪导弹
    WAVE = 'wave',          // 波动炮 (大面积波)
    PLASMA = 'plasma',      // 等离子炮 (范围爆炸)
    TESLA = 'tesla',        // 电磁枪 (连锁)
    MAGMA = 'magma',        // 熔岩炉 (持续伤害)
    SHURIKEN = 'shuriken'   // 手里剑 (弹射)
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
    VULCAN_SPREAD = 'vulcanSpread',   // 散弹扇形
    LASER_BEAM = 'laserBeam',         // 激光束
    MISSILE_HOMING = 'missileHoming', // 追踪导弹
    WAVE_PULSE = 'wavePulse',         // 波动脉冲
    PLASMA_ORB = 'plasmaOrb',         // 等离子球
    TESLA_CHAIN = 'teslaChain',       // 电磁连锁
    MAGMA_POOL = 'magmaPool',         // 熔岩池
    SHURIKEN_BOUNCE = 'shurikenBounce' // 手里剑反弹
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
