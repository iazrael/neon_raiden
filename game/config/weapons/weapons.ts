import {
    WeaponType,
    BulletType,
    WeaponEntity,
} from '@/types';
import { BulletConfigs } from './bullets';

// ==================== 武器配置 ====================
export const WeaponConfig: Record<WeaponType, WeaponEntity> = {
    [WeaponType.VULCAN]: {
        type: WeaponType.VULCAN,
        id: 'weapon_vulcan',
        name: 'Vulcan Gun',
        chineseName: '星裂火神炮',
        describe: '智能弹道预测系统根据敌机密度自动调整扇形覆盖,纳米级表面处理确保远距离精准打击,是可靠而优雅的基础武装。',

        color: '#ebdd17ff',
        baseDamage: 12,
        damagePerLevel: 3,
        speed: 15,
        baseSpeed: 15,
        baseFireRate: 150,
        ratePerLevel: 2,
        bullet: BulletConfigs[BulletType.VULCAN],
        sprite: 'bullet_vulcan',
        maxLevel: 6
    },
    [WeaponType.LASER]: {
        type: WeaponType.LASER,
        id: 'weapon_laser',
        name: 'Laser Cannon',
        chineseName: '裂空镭射炮',
        describe: '零点能量凝聚核心生成的高聚焦光束,升级时激活谐振腔使光束分裂增宽,形成穿透网络。每道光束穿透多个目标后仍保持80%能量,是对抗集群的终极利器。',

        color: '#3fc4f0ff',
        baseDamage: 6,
        damagePerLevel: 2,
        speed: 25,
        baseSpeed: 15,
        baseFireRate: 180,
        ratePerLevel: 5,
        bullet: BulletConfigs[BulletType.LASER],
        sprite: 'bullet_laser',
        maxLevel: 3
    },
    [WeaponType.MISSILE]: {
        type: WeaponType.MISSILE,
        id: 'weapon_missile',
        name: 'Homing Missile',
        chineseName: '幽影追踪弹',
        describe: '自主学习型量子计算机同时锁定多个高价值目标,复合推进技术在接近时加速至亚光速,高爆核心产生定向能爆炸,即使最敏捷的敌机也难逃毁灭。',

        color: '#ec6f73',
        baseDamage: 35,
        damagePerLevel: 5,
        speed: 50,
        baseSpeed: 15,
        baseFireRate: 400,
        ratePerLevel: 20,
        bullet: BulletConfigs[BulletType.MISSILE],
        sprite: 'bullet_missile',
        maxLevel: 3,
    },
    [WeaponType.WAVE]: {
        type: WeaponType.WAVE,
        id: 'weapon_wave',
        name: 'Wave Cannon',
        chineseName: '宙域震荡波',
        describe: '特殊晶体阵列产生的宽幅能量震荡波,升级时解锁更多晶体使波宽呈指数增长,穿过目标时释放脉冲能量引发连锁反应,是清场的终极武器。',

        color: '#1e8de7ff',
        baseDamage: 18,
        damagePerLevel: 6,
        speed: 10,
        baseSpeed: 15,
        baseFireRate: 400,
        ratePerLevel: 20,
        bullet: BulletConfigs[BulletType.WAVE],
        sprite: 'bullet_wave',
        maxLevel: 3
    },
    [WeaponType.PLASMA]: {
        type: WeaponType.PLASMA,
        id: 'weapon_plasma',
        name: 'Plasma Cannon',
        chineseName: '等离子炮',
        describe: '磁场约束技术压缩不稳定虚空能量形成高密度等离子球,接触时磁场解除产生微型黑洞效应,形成大范围杀伤。稀有而强大,是对抗Boss的终极选择。',

        color: '#ed64a6',
        baseDamage: 45,
        damagePerLevel: 12,
        speed: 8,
        baseSpeed: 15,
        baseFireRate: 600,
        ratePerLevel: 20,
        bullet: BulletConfigs[BulletType.PLASMA],
        sprite: 'bullet_plasma',
        maxLevel: 3
    },
    [WeaponType.TESLA]: {
        type: WeaponType.TESLA,
        id: 'weapon_tesla',
        name: 'Tesla Coil',
        chineseName: '量子电磁炮',
        describe: '量子电磁脉冲系统生成高浓度电浆团,击中目标后电流在敌人间跳跃传导形成闭合电路。升级后传导距离增加、连锁次数增多,在密集战场中发挥最大效能。',

        color: '#1053d9ff',
        baseDamage: 15,
        damagePerLevel: 1,
        speed: 25,
        baseSpeed: 15,
        baseFireRate: 200,
        ratePerLevel: 0,
        bullet: BulletConfigs[BulletType.TESLA],
        sprite: 'bullet_tesla',
        maxLevel: 6
    },
    [WeaponType.MAGMA]: {
        type: WeaponType.MAGMA,
        id: 'weapon_magma',
        name: 'Magma Burst',
        chineseName: '恒星熔岩炮',
        describe: '超压缩技术将恒星核心物质封装成弹丸,锥形散射最大化覆盖目标区域,命中后形成持续灼烧场熔穿装甲。高射速配合持续伤害,是持续输出的理想选择。',

        color: '#f60',
        baseDamage: 15,
        damagePerLevel: 5,
        speed: 10,
        baseSpeed: 15,
        baseFireRate: 220,
        ratePerLevel: 0,
        bullet: BulletConfigs[BulletType.MAGMA],
        sprite: 'bullet_magma',
        maxLevel: 6
    },
    [WeaponType.SHURIKEN]: {
        type: WeaponType.SHURIKEN,
        id: 'weapon_shuriken',
        name: 'Shuriken',
        chineseName: '量子飞镖',
        describe: '记忆金属与量子核心打造的特制飞镖,在战场边界完美反弹并通过量子感应追踪敌人。每次反弹吸收环境能量使伤害指数增长,熟练飞行员可利用复杂轨迹造成毁灭性打击。',

        color: '#ccccccff',
        baseDamage: 15,
        damagePerLevel: 3,
        speed: 20,
        baseSpeed: 15,
        baseFireRate: 300,
        ratePerLevel: 20,
        bullet: BulletConfigs[BulletType.SHURIKEN],
        sprite: 'bullet_shuriken',
        maxLevel: 6
    }
};
