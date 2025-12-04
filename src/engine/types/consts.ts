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
