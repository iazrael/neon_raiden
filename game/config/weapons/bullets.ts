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
        chineseName: '中子火神炮',
        describe: '采用超密度中子合金弹头,通过电磁加速器快速形成扇形弹幕网,每发子弹携带微型反应堆,在空间中划出炫目的等离子轨迹,是压制集群目标的终极火力方案。',
        color: '#fff',
        size: { width: 10, height: 20 },
        sprite: 'bullet_vulcan'
    },
    [BulletType.LASER]: {
        type: BulletType.LASER,
        id: 'bullet_laser',
        name: 'Laser Beam',
        chineseName: '量子穿刺光束',
        describe: '通过量子纠缠技术聚焦的高能光束武器,能够无视常规护盾直接穿透目标核心,在空间中留下短暂的量子残影,对分子结构造成不可逆的解离,是精准狙击的科技结晶。',
        color: '#f0f',
        size: { width: 8, height: 50 },
        sprite: 'bullet_laser'
    },
    [BulletType.MISSILE]: {
        type: BulletType.MISSILE,
        id: 'bullet_missile',
        name: 'Homing Missile',
        chineseName: '幽灵追踪导弹',
        describe: '搭载第五代AI导航系统的智能导弹,通过量子雷达锁定目标生命信号,可进行多次空间折跃追击,弹头内置反物质炸药,接触瞬间释放强大的能量,绽放出致命的等离子爆炸。',
        color: '#f00',
        size: { width: 16, height: 32 },
        sprite: 'bullet_missile'
    },
    [BulletType.WAVE]: {
        type: BulletType.WAVE,
        id: 'bullet_wave',
        name: 'Wave Cannon',
        chineseName: '相位海啸炮',
        describe: '通过大量共振水晶同步激发的宽频能量波,形成覆盖大范围扇区的相位潮汐,穿透目标时触发连锁共振反应,在战场上掀起蓝色的能量海啸,可同时瓦解密集阵型中的所有目标。',
        color: '#0ff',
        size: { width: 60, height: 24 },
        sprite: 'bullet_wave'
    },
    [BulletType.PLASMA]: {
        type: BulletType.PLASMA,
        id: 'bullet_plasma',
        name: 'Plasma Orb',
        chineseName: '虚空等离子球',
        describe: '通过反物质约束场封装的超高温等离子体,内部温度达到极限,接触瞬间形成微型奇点,产生强大的引力坍缩效应,绽放出粉色的湮灭之光,是禁忌级的终极武器。',
        color: '#ed64a6',
        size: { width: 32, height: 32 },
        sprite: 'bullet_plasma'
    },
    [BulletType.TESLA]: {
        type: BulletType.TESLA,
        id: 'bullet_tesla',
        name: 'Tesla Bolt',
        chineseName: '特斯拉链式闪电',
        describe: '释放超高压电弧武器,通过离子化空气在敌群间形成连锁传导,可多次跳跃目标并递增伤害,编织出覆盖全场的紫色闪电网络,对电子系统造成永久性瘫痪。',
        color: '#ccf',
        size: { width: 16, height: 64 },
        sprite: 'bullet_tesla'
    },
    [BulletType.MAGMA]: {
        type: BulletType.MAGMA,
        id: 'bullet_magma',
        name: 'Magma Burst',
        chineseName: '恒星熔岩弹',
        describe: '封装恒星核心物质的超高温武器,弹体温度极高,命中后形成持续灼烧的熔岩区域,持续造成伤害,同时释放强辐射削弱敌方护盾再生,将战场化为橙色的炼狱熔炉。',
        color: '#f60',
        size: { width: 24, height: 24 },
        sprite: 'bullet_magma'
    },
    [BulletType.SHURIKEN]: {
        type: BulletType.SHURIKEN,
        id: 'bullet_shuriken',
        name: 'Shuriken',
        chineseName: '量子回旋刃',
        describe: '采用单分子锋刃技术的回旋武器,边缘锋利度达原子级,可在战场边界间进行多次完美反弹,每次碰撞吸收动能使伤害递增,银色轨迹编织出无法躲避的死亡之网。',
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