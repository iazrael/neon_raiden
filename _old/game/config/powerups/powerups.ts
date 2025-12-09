import {
    PowerupType,
    EntityType,
    Entity,
} from '@/types';

// ==================== 道具配置 ====================
export const PowerupConfig: Record<PowerupType, Omit<Entity, 'x' | 'y' | 'vx' | 'vy' | 'hp' | 'maxHp' | 'markedForDeletion'>> = {
    [PowerupType.POWER]: {
        type: EntityType.POWERUP,
        subType: PowerupType.POWER,
        id: 'powerup_power',
        name: 'Power Boost',
        chineseName: '能量提升',
        describe: '提升武器能量等级',
        color: '#ffff00',
        width: 24,
        height: 24,
        spriteKey: 'powerup_power'
    },
    [PowerupType.HP]: {
        type: EntityType.POWERUP,
        subType: PowerupType.HP,
        id: 'powerup_hp',
        name: 'Health Restore',
        chineseName: '生命恢复',
        describe: '恢复玩家生命值',
        color: '#ff0000',
        width: 24,
        height: 24,
        spriteKey: 'powerup_hp'
    },
    [PowerupType.BOMB]: {
        type: EntityType.POWERUP,
        subType: PowerupType.BOMB,
        id: 'powerup_bomb',
        name: 'Bomb',
        chineseName: '炸弹',
        describe: '获得一枚炸弹',
        color: '#00ff00',
        width: 24,
        height: 24,
        spriteKey: 'powerup_bomb'
    },
    [PowerupType.OPTION]: {
        type: EntityType.POWERUP,
        subType: PowerupType.OPTION,
        id: 'powerup_option',
        name: 'Option Unit',
        chineseName: '僚机单元',
        describe: '获得一个僚机',
        color: '#00ffff',
        width: 24,
        height: 24,
        spriteKey: 'powerup_option'
    },
    [PowerupType.VULCAN]: {
        type: EntityType.POWERUP,
        subType: PowerupType.VULCAN,
        id: 'powerup_vulcan',
        name: 'Vulcan Weapon',
        chineseName: '离子机炮',
        describe: '获得离子机炮武器',
        color: '#ffffff',
        width: 24,
        height: 24,
        spriteKey: 'powerup_vulcan'
    },
    [PowerupType.LASER]: {
        type: EntityType.POWERUP,
        subType: PowerupType.LASER,
        id: 'powerup_laser',
        name: 'Laser Weapon',
        chineseName: '量子激光阵',
        describe: '获得量子激光阵武器',
        color: '#ff00ff',
        width: 24,
        height: 24,
        spriteKey: 'powerup_laser'
    },
    [PowerupType.MISSILE]: {
        type: EntityType.POWERUP,
        subType: PowerupType.MISSILE,
        id: 'powerup_missile',
        name: 'Missile Weapon',
        chineseName: '智能追踪系统',
        describe: '获得智能追踪系统武器',
        color: '#ff0000',
        width: 24,
        height: 24,
        spriteKey: 'powerup_missile'
    },
    [PowerupType.SHURIKEN]: {
        type: EntityType.POWERUP,
        subType: PowerupType.SHURIKEN,
        id: 'powerup_shuriken',
        name: 'Shuriken Weapon',
        chineseName: '量子飞镖',
        describe: '获得量子飞镖武器',
        color: '#cccccc',
        width: 24,
        height: 24,
        spriteKey: 'powerup_shuriken'
    },
    [PowerupType.TESLA]: {
        type: EntityType.POWERUP,
        subType: PowerupType.TESLA,
        id: 'powerup_tesla',
        name: 'Tesla Weapon',
        chineseName: '特斯拉线圈',
        describe: '获得特斯拉线圈武器',
        color: '#ccccff',
        width: 24,
        height: 24,
        spriteKey: 'powerup_tesla'
    },
    [PowerupType.MAGMA]: {
        type: EntityType.POWERUP,
        subType: PowerupType.MAGMA,
        id: 'powerup_magma',
        name: 'Magma Weapon',
        chineseName: '恒星熔岩炮',
        describe: '获得恒星熔岩炮武器',
        color: '#ff6600',
        width: 24,
        height: 24,
        spriteKey: 'powerup_magma'
    },
    [PowerupType.WAVE]: {
        type: EntityType.POWERUP,
        subType: PowerupType.WAVE,
        id: 'powerup_wave',
        name: 'Wave Weapon',
        chineseName: '相位波动炮',
        describe: '获得相位波动炮武器',
        color: '#00ffff',
        width: 24,
        height: 24,
        spriteKey: 'powerup_wave'
    },
    [PowerupType.PLASMA]: {
        type: EntityType.POWERUP,
        subType: PowerupType.PLASMA,
        id: 'powerup_plasma',
        name: 'Plasma Weapon',
        chineseName: '虚空等离子炮',
        describe: '获得虚空等离子炮武器',
        color: '#ed64a6',
        width: 24,
        height: 24,
        spriteKey: 'powerup_plasma'
    },
    // 新增容错道具
    [PowerupType.INVINCIBILITY]: {
        type: EntityType.POWERUP,
        subType: PowerupType.INVINCIBILITY,
        id: 'powerup_invincibility',
        name: 'Invincibility Shield',
        chineseName: '无敌护盾',
        describe: '获得短暂的无敌护盾',
        color: '#00ff00',
        width: 24,
        height: 24,
        spriteKey: 'powerup_invincibility'
    },
    [PowerupType.TIME_SLOW]: {
        type: EntityType.POWERUP,
        subType: PowerupType.TIME_SLOW,
        id: 'powerup_time_slow',
        name: 'Time Slow',
        chineseName: '时间减缓',
        describe: '短暂减缓游戏速度',
        color: '#0000ff',
        width: 24,
        height: 24,
        spriteKey: 'powerup_time_slow'
    }
};