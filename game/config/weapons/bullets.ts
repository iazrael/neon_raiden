import {
    BulletType,
    BulletEntity,
} from '@/types';

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