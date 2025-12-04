//
// 道具静态数据配置文件
// 定义游戏中各种道具的基础配置信息
//

import { PowerupType, EntityType, Entity } from '../../../../types';

/**
 * 道具静态数据
 * 定义了游戏中各种道具的基础配置信息，不包含位置、速度、生命值等动态数据
 */
export const PowerupStaticData: Record<PowerupType, {
  id?: string;
  name?: string;
  chineseName?: string;
  describe?: string;
  width: number;
  height: number;
  speed?: number;
  hp: number;
  maxHp: number;
  type: EntityType;
  subType?: string | number;
  color: string;
  markedForDeletion: boolean;
  angle?: number;
  rotationSpeed?: number;
  spriteKey?: string;
  frame?: number;
  damage?: number;
  owner?: any;
  angleOffset?: number;
  isElite?: boolean;
  state?: number;
  timer?: number;
  chainCount?: number;
  chainRange?: number;
  weaponType?: string;
  isHoming?: boolean;
  invulnerable?: boolean;
  invulnerableTimer?: number;
  tags?: Record<string, number>;
  slowed?: boolean;
  originalBulletCount?: number;
  currentBulletCount?: number;
  teleportTimer?: number;
  phaseGlowColor?: string;
  phaseGlowUntil?: number;
  hitFlashUntil?: number;
  playerLevel?: number;
  defensePct?: number;
  target?: any;
  searchRange?: number;
  turnSpeed?: number;
  lifetime?: number;
  incomingMissiles?: number;
  attenuation?: number;
}> = {
    /** 能量提升道具配置 */
    [PowerupType.POWER]: {
        /** 实体类型 */
        type: EntityType.POWERUP,
        /** 道具子类型 */
        subType: PowerupType.POWER,
        /** 道具唯一标识 */
        id: 'powerup_power',
        /** 英文名称 */
        name: 'Power Boost',
        /** 中文名称 */
        chineseName: '能量提升',
        /** 道具描述 */
        describe: '提升武器能量等级',
        /** 主题颜色 */
        color: '#ffff00',
        /** 宽度 */
        width: 24,
        /** 高度 */
        height: 24,
        /** 精灵图键名 */
        spriteKey: 'powerup_power'
    },
    /** 生命恢复道具配置 */
    [PowerupType.HP]: {
        /** 实体类型 */
        type: EntityType.POWERUP,
        /** 道具子类型 */
        subType: PowerupType.HP,
        /** 道具唯一标识 */
        id: 'powerup_hp',
        /** 英文名称 */
        name: 'Health Restore',
        /** 中文名称 */
        chineseName: '生命恢复',
        /** 道具描述 */
        describe: '恢复玩家生命值',
        /** 主题颜色 */
        color: '#ff0000',
        /** 宽度 */
        width: 24,
        /** 高度 */
        height: 24,
        /** 精灵图键名 */
        spriteKey: 'powerup_hp'
    },
    /** 炸弹道具配置 */
    [PowerupType.BOMB]: {
        /** 实体类型 */
        type: EntityType.POWERUP,
        /** 道具子类型 */
        subType: PowerupType.BOMB,
        /** 道具唯一标识 */
        id: 'powerup_bomb',
        /** 英文名称 */
        name: 'Bomb',
        /** 中文名称 */
        chineseName: '炸弹',
        /** 道具描述 */
        describe: '获得一枚炸弹',
        /** 主题颜色 */
        color: '#00ff00',
        /** 宽度 */
        width: 24,
        /** 高度 */
        height: 24,
        /** 精灵图键名 */
        spriteKey: 'powerup_bomb'
    },
    /** 僚机单元道具配置 */
    [PowerupType.OPTION]: {
        /** 实体类型 */
        type: EntityType.POWERUP,
        /** 道具子类型 */
        subType: PowerupType.OPTION,
        /** 道具唯一标识 */
        id: 'powerup_option',
        /** 英文名称 */
        name: 'Option Unit',
        /** 中文名称 */
        chineseName: '僚机单元',
        /** 道具描述 */
        describe: '获得一个僚机',
        /** 主题颜色 */
        color: '#00ffff',
        /** 宽度 */
        width: 24,
        /** 高度 */
        height: 24,
        /** 精灵图键名 */
        spriteKey: 'powerup_option'
    },
    /** 离子机炮武器道具配置 */
    [PowerupType.VULCAN]: {
        /** 实体类型 */
        type: EntityType.POWERUP,
        /** 道具子类型 */
        subType: PowerupType.VULCAN,
        /** 道具唯一标识 */
        id: 'powerup_vulcan',
        /** 英文名称 */
        name: 'Vulcan Weapon',
        /** 中文名称 */
        chineseName: '离子机炮',
        /** 道具描述 */
        describe: '获得离子机炮武器',
        /** 主题颜色 */
        color: '#ffffff',
        /** 宽度 */
        width: 24,
        /** 高度 */
        height: 24,
        /** 精灵图键名 */
        spriteKey: 'powerup_vulcan'
    },
    /** 量子激光阵武器道具配置 */
    [PowerupType.LASER]: {
        /** 实体类型 */
        type: EntityType.POWERUP,
        /** 道具子类型 */
        subType: PowerupType.LASER,
        /** 道具唯一标识 */
        id: 'powerup_laser',
        /** 英文名称 */
        name: 'Laser Weapon',
        /** 中文名称 */
        chineseName: '量子激光阵',
        /** 道具描述 */
        describe: '获得量子激光阵武器',
        /** 主题颜色 */
        color: '#ff00ff',
        /** 宽度 */
        width: 24,
        /** 高度 */
        height: 24,
        /** 精灵图键名 */
        spriteKey: 'powerup_laser'
    },
    /** 智能追踪系统武器道具配置 */
    [PowerupType.MISSILE]: {
        /** 实体类型 */
        type: EntityType.POWERUP,
        /** 道具子类型 */
        subType: PowerupType.MISSILE,
        /** 道具唯一标识 */
        id: 'powerup_missile',
        /** 英文名称 */
        name: 'Missile Weapon',
        /** 中文名称 */
        chineseName: '智能追踪系统',
        /** 道具描述 */
        describe: '获得智能追踪系统武器',
        /** 主题颜色 */
        color: '#ff0000',
        /** 宽度 */
        width: 24,
        /** 高度 */
        height: 24,
        /** 精灵图键名 */
        spriteKey: 'powerup_missile'
    },
    /** 量子飞镖武器道具配置 */
    [PowerupType.SHURIKEN]: {
        /** 实体类型 */
        type: EntityType.POWERUP,
        /** 道具子类型 */
        subType: PowerupType.SHURIKEN,
        /** 道具唯一标识 */
        id: 'powerup_shuriken',
        /** 英文名称 */
        name: 'Shuriken Weapon',
        /** 中文名称 */
        chineseName: '量子飞镖',
        /** 道具描述 */
        describe: '获得量子飞镖武器',
        /** 主题颜色 */
        color: '#cccccc',
        /** 宽度 */
        width: 24,
        /** 高度 */
        height: 24,
        /** 精灵图键名 */
        spriteKey: 'powerup_shuriken'
    },
    /** 特斯拉线圈武器道具配置 */
    [PowerupType.TESLA]: {
        /** 实体类型 */
        type: EntityType.POWERUP,
        /** 道具子类型 */
        subType: PowerupType.TESLA,
        /** 道具唯一标识 */
        id: 'powerup_tesla',
        /** 英文名称 */
        name: 'Tesla Weapon',
        /** 中文名称 */
        chineseName: '特斯拉线圈',
        /** 道具描述 */
        describe: '获得特斯拉线圈武器',
        /** 主题颜色 */
        color: '#ccccff',
        /** 宽度 */
        width: 24,
        /** 高度 */
        height: 24,
        /** 精灵图键名 */
        spriteKey: 'powerup_tesla'
    },
    /** 恒星熔岩炮武器道具配置 */
    [PowerupType.MAGMA]: {
        /** 实体类型 */
        type: EntityType.POWERUP,
        /** 道具子类型 */
        subType: PowerupType.MAGMA,
        /** 道具唯一标识 */
        id: 'powerup_magma',
        /** 英文名称 */
        name: 'Magma Weapon',
        /** 中文名称 */
        chineseName: '恒星熔岩炮',
        /** 道具描述 */
        describe: '获得恒星熔岩炮武器',
        /** 主题颜色 */
        color: '#ff6600',
        /** 宽度 */
        width: 24,
        /** 高度 */
        height: 24,
        /** 精灵图键名 */
        spriteKey: 'powerup_magma'
    },
    /** 相位波动炮武器道具配置 */
    [PowerupType.WAVE]: {
        /** 实体类型 */
        type: EntityType.POWERUP,
        /** 道具子类型 */
        subType: PowerupType.WAVE,
        /** 道具唯一标识 */
        id: 'powerup_wave',
        /** 英文名称 */
        name: 'Wave Weapon',
        /** 中文名称 */
        chineseName: '相位波动炮',
        /** 道具描述 */
        describe: '获得相位波动炮武器',
        /** 主题颜色 */
        color: '#00ffff',
        /** 宽度 */
        width: 24,
        /** 高度 */
        height: 24,
        /** 精灵图键名 */
        spriteKey: 'powerup_wave'
    },
    /** 虚空等离子炮武器道具配置 */
    [PowerupType.PLASMA]: {
        /** 实体类型 */
        type: EntityType.POWERUP,
        /** 道具子类型 */
        subType: PowerupType.PLASMA,
        /** 道具唯一标识 */
        id: 'powerup_plasma',
        /** 英文名称 */
        name: 'Plasma Weapon',
        /** 中文名称 */
        chineseName: '虚空等离子炮',
        /** 道具描述 */
        describe: '获得虚空等离子炮武器',
        /** 主题颜色 */
        color: '#ed64a6',
        /** 宽度 */
        width: 24,
        /** 高度 */
        height: 24,
        /** 精灵图键名 */
        spriteKey: 'powerup_plasma'
    },
    // 新增容错道具
    /** 无敌护盾道具配置 */
    [PowerupType.INVINCIBILITY]: {
        /** 实体类型 */
        type: EntityType.POWERUP,
        /** 道具子类型 */
        subType: PowerupType.INVINCIBILITY,
        /** 道具唯一标识 */
        id: 'powerup_invincibility',
        /** 英文名称 */
        name: 'Invincibility Shield',
        /** 中文名称 */
        chineseName: '无敌护盾',
        /** 道具描述 */
        describe: '获得短暂的无敌护盾',
        /** 主题颜色 */
        color: '#00ff00',
        /** 宽度 */
        width: 24,
        /** 高度 */
        height: 24,
        /** 精灵图键名 */
        spriteKey: 'powerup_invincibility'
    },
    /** 时间减缓道具配置 */
    [PowerupType.TIME_SLOW]: {
        /** 实体类型 */
        type: EntityType.POWERUP,
        /** 道具子类型 */
        subType: PowerupType.TIME_SLOW,
        /** 道具唯一标识 */
        id: 'powerup_time_slow',
        /** 英文名称 */
        name: 'Time Slow',
        /** 中文名称 */
        chineseName: '时间减缓',
        /** 道具描述 */
        describe: '短暂减缓游戏速度',
        /** 主题颜色 */
        color: '#0000ff',
        /** 宽度 */
        width: 24,
        /** 高度 */
        height: 24,
        /** 精灵图键名 */
        spriteKey: 'powerup_time_slow'
    }
};