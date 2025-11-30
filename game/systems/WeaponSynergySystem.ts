/**
 * WeaponSynergySystem - P2 Advanced Feature
 * 武器组合技系统: 实现同时装备特定武器时触发的协同效果
 * 
 * 核心机制:
 * - 检测玩家当前装备的武器组合
 * - 在特定条件下触发组合技效果
 * - 提供视觉和数值反馈
 */

import { WeaponType, Entity, EntityType, CombatEventType, SynergyEffectType } from '@/types';

export enum SynergyType {
    LASER_TESLA = 'LASER_TESLA',           // 电磁折射
    WAVE_PLASMA = 'WAVE_PLASMA',           // 能量共鸣
    MISSILE_VULCAN = 'MISSILE_VULCAN',     // 弹幕覆盖
    MAGMA_SHURIKEN = 'MAGMA_SHURIKEN',     // 熔火飞刃
    TESLA_PLASMA = 'TESLA_PLASMA'          // 等离子风暴
}

export interface SynergyConfig {
    /** 组合技类型 */
    type: SynergyType;
    /** 组合技名称 */
    name: string;
    /** 组合技中文名 */
    chineseName: string;
    /** 需要的武器组合 */
    requiredWeapons: WeaponType[];
    /** 组合技描述 */
    description: string;
    /** 触发概率(0-1),1表示必定触发 */
    triggerChance: number;
    /** 效果颜色(用于视觉特效) */
    color: string;
}

export interface SynergyTriggerContext {
    /** 当前武器类型 */
    weaponType: WeaponType;
    /** 子弹位置X */
    bulletX: number;
    /** 子弹位置Y */
    bulletY: number;
    /** 目标敌人 */
    targetEnemy: Entity;
    /** 所有敌人数组(用于生成连锁效果等) */
    enemies: Entity[];
    /** 玩家实体(用于计算位置等) */
    player: Entity;
    /** PLASMA爆炸区域 */
    plasmaExplosions?: { x: number; y: number; range: number }[];
    /** 事件类型 */
    eventType?: CombatEventType;
    /** SHURIKEN是否发生反弹 */
    shurikenBounced?: boolean;
}

// 组合技配置表
export const SYNERGY_CONFIGS: Record<SynergyType, SynergyConfig> = {
    [SynergyType.LASER_TESLA]: {
        type: SynergyType.LASER_TESLA,
        name: 'Electromagnetic Refraction',
        chineseName: '电磁折射',
        requiredWeapons: [WeaponType.LASER, WeaponType.TESLA],
        description: '激光击中敌人时15%概率触发连锁闪电',
        triggerChance: 0.15,
        color: '#a855f7' // 紫色
    },
    [SynergyType.WAVE_PLASMA]: {
        type: SynergyType.WAVE_PLASMA,
        name: 'Energy Resonance',
        chineseName: '能量共鸣',
        requiredWeapons: [WeaponType.WAVE, WeaponType.PLASMA],
        description: 'WAVE命中后沿路径生成涡流区，处于该区的波段伤害+50%',
        triggerChance: 1.0, // 位置判定,不需要概率
        color: '#ec4899' // 粉色
    },
    [SynergyType.MISSILE_VULCAN]: {
        type: SynergyType.MISSILE_VULCAN,
        name: 'Barrage Coverage',
        chineseName: '弹幕覆盖',
        requiredWeapons: [WeaponType.MISSILE, WeaponType.VULCAN],
        description: 'MISSILE锁定目标同时被VULCAN命中时伤害+30%',
        triggerChance: 1.0, // 状态判定,不需要概率
        color: '#f59e0b' // 橙色
    },
    [SynergyType.MAGMA_SHURIKEN]: {
        type: SynergyType.MAGMA_SHURIKEN,
        name: 'Molten Blade',
        chineseName: '熔火飞刃',
        requiredWeapons: [WeaponType.MAGMA, WeaponType.SHURIKEN],
        description: 'SHURIKEN反弹时附加灼烧效果',
        triggerChance: 1.0, // 反弹检测,不需要概率
        color: '#f97316' // 橙红色
    },
    [SynergyType.TESLA_PLASMA]: {
        type: SynergyType.TESLA_PLASMA,
        name: 'Plasma Storm',
        chineseName: '等离子风暴',
        requiredWeapons: [WeaponType.TESLA, WeaponType.PLASMA],
        description: 'PLASMA爆炸触发3道闪电，并为玩家护盾+6与200ms无敌',
        triggerChance: 1.0, // 爆炸触发,不需要概率
        color: '#8b5cf6' // 紫罗兰色
    }
};

export class WeaponSynergySystem {
    /** 当前激活的组合技类型列表 */
    private activeSynergies: Set<SynergyType> = new Set();

    /** 玩家当前装备的武器列表 */
    private equippedWeapons: Set<WeaponType> = new Set();

    constructor() {
        this.reset();
    }

    /**
     * 重置组合技系统
     */
    reset() {
        this.activeSynergies.clear();
        this.equippedWeapons.clear();
    }

    /**
     * 更新玩家装备的武器列表
     * 注意: 游戏中玩家当前只有一个主武器,但可能需要扩展为多武器系统
     * 目前简化为: 将玩家获得过的所有武器都视为"装备"
     */
    updateEquippedWeapons(weapons: WeaponType[]) {
        this.equippedWeapons.clear();
        weapons.forEach(w => this.equippedWeapons.add(w));
        this.updateActiveSynergies();
    }

    /**
     * 更新激活的组合技
     * 检查当前装备是否满足任何组合技的条件
     */
    private updateActiveSynergies() {
        this.activeSynergies.clear();

        Object.values(SYNERGY_CONFIGS).forEach(config => {
            if (this.hasRequiredWeapons(config.requiredWeapons)) {
                this.activeSynergies.add(config.type);
            }
        });
    }

    /**
     * 检查是否装备了所需的武器
     */
    private hasRequiredWeapons(required: WeaponType[]): boolean {
        return required.every(weapon => this.equippedWeapons.has(weapon));
    }

    /**
     * 检查两个武器是否可以组合成协同效果
     */
    canCombine(w1: WeaponType, w2: WeaponType): boolean {
        if (!w1 || !w2 || w1 === w2) return false;

        return Object.values(SYNERGY_CONFIGS).some(config => {
            return config.requiredWeapons.includes(w1) &&
                config.requiredWeapons.includes(w2) &&
                config.requiredWeapons.length === 2;
        });
    }

    /**
     * 获取潜在的协同效果颜色
     * 用于在道具上显示视觉提示，表明该武器可以与当前装备的武器形成协同效果
     * @param weaponType 待检查的武器类型（通常是道具的武器类型）
     * @returns 如果可以形成协同效果，返回包含两种武器颜色的数组；否则返回null
     */
    getPotentialSynergyColors(weaponType: WeaponType): { colors: string[], synergyType: SynergyType } | null {
        if (!weaponType) return null;

        // 检查该武器是否可以与任何已装备的武器形成协同效果
        for (const equippedWeapon of this.equippedWeapons) {
            if (this.canCombine(weaponType, equippedWeapon)) {
                // 找到对应的协同效果配置
                const synergyConfig = Object.values(SYNERGY_CONFIGS).find(config =>
                    config.requiredWeapons.includes(weaponType) &&
                    config.requiredWeapons.includes(equippedWeapon) &&
                    config.requiredWeapons.length === 2
                );

                if (synergyConfig) {
                    // 返回协同效果的颜色（用于闪烁效果）
                    return {
                        colors: [synergyConfig.color],
                        synergyType: synergyConfig.type
                    };
                }
            }
        }

        return null;
    }

    /**
     * 检查特定组合技是否激活
     */
    isSynergyActive(type: SynergyType): boolean {
        return this.activeSynergies.has(type);
    }

    /**
     * 获取所有激活的组合技
     */
    getActiveSynergies(): SynergyConfig[] {
        return Array.from(this.activeSynergies).map(type => SYNERGY_CONFIGS[type]);
    }

    /**
     * 尝试触发组合技效果
     * @param context 触发上下文
     * @returns 触发的组合技列表及其效果
     */
    tryTriggerSynergies(context: SynergyTriggerContext): SynergyTriggerResult[] {
        const results: SynergyTriggerResult[] = [];
        const bulletWeapon = context.weaponType;

        if (!bulletWeapon) return results;

        // LASER + TESLA: 电磁折射
        if (this.isSynergyActive(SynergyType.LASER_TESLA) &&
            bulletWeapon === WeaponType.LASER && (context.eventType === undefined || context.eventType === 'hit')) {
            if (Math.random() < SYNERGY_CONFIGS[SynergyType.LASER_TESLA].triggerChance) {
                results.push({
                    type: SynergyType.LASER_TESLA,
                    effect: SynergyEffectType.CHAIN_LIGHTNING,
                    value: 1, // 触发1次连锁闪电
                    color: SYNERGY_CONFIGS[SynergyType.LASER_TESLA].color
                });
            }
        }

        // WAVE + PLASMA: 能量共鸣（合成弹）：命中事件直接获得伤害加成
        if (this.isSynergyActive(SynergyType.WAVE_PLASMA) &&
            bulletWeapon === WeaponType.WAVE && (context.eventType === undefined || context.eventType === 'hit')) {
            results.push({
                type: SynergyType.WAVE_PLASMA,
                effect: SynergyEffectType.DAMAGE_BOOST,
                value: 1.5,
                color: SYNERGY_CONFIGS[SynergyType.WAVE_PLASMA].color,
                multiplier: 1.5
            });
        }

        // MISSILE + VULCAN: 弹幕覆盖
        if (this.isSynergyActive(SynergyType.MISSILE_VULCAN) &&
            bulletWeapon === WeaponType.MISSILE && (context.eventType === undefined || context.eventType === 'hit')) {
            const targetHitByVulcan = !!context.targetEnemy.tags && context.targetEnemy.tags['hitByVulcan'] && context.targetEnemy.tags['hitByVulcan'] > Date.now();
            if (targetHitByVulcan) {
                results.push({
                    type: SynergyType.MISSILE_VULCAN,
                    effect: SynergyEffectType.DAMAGE_BOOST,
                    value: 1.3, // 伤害×1.3
                    color: SYNERGY_CONFIGS[SynergyType.MISSILE_VULCAN].color,
                    multiplier: 1.3
                });
            }
        }

        // MAGMA + SHURIKEN: 熔火飞刃
        if (this.isSynergyActive(SynergyType.MAGMA_SHURIKEN) &&
            bulletWeapon === WeaponType.SHURIKEN && (context.eventType === undefined || context.eventType === 'hit')) {
            const hasBounced = !!context.shurikenBounced;
            if (hasBounced) {
                results.push({
                    type: SynergyType.MAGMA_SHURIKEN,
                    effect: SynergyEffectType.BURN,
                    value: 5, // 每秒5点灼烧伤害
                    color: SYNERGY_CONFIGS[SynergyType.MAGMA_SHURIKEN].color
                });
            }
        }

        // TESLA + PLASMA: 等离子风暴（防守）：爆炸事件触发护盾回复与短暂无敌
        if (this.isSynergyActive(SynergyType.TESLA_PLASMA) &&
            bulletWeapon === WeaponType.PLASMA && context.eventType === 'explode') {
            results.push({
                type: SynergyType.TESLA_PLASMA,
                effect: SynergyEffectType.SHIELD_REGEN,
                value: 6,
                color: SYNERGY_CONFIGS[SynergyType.TESLA_PLASMA].color
            });
            results.push({
                type: SynergyType.TESLA_PLASMA,
                effect: SynergyEffectType.INVULNERABLE,
                value: 200,
                color: SYNERGY_CONFIGS[SynergyType.TESLA_PLASMA].color
            });
        }

        return results;
    }

    /**
     * 触发TESLA + PLASMA组合技: 等离子风暴
     * 专门的方法,在PLASMA爆炸时调用
     */
    triggerPlasmaStorm(
        explosionX: number,
        explosionY: number,
        explosionRange: number,
        enemies: Entity[]
    ): Entity[] {
        if (!this.isSynergyActive(SynergyType.TESLA_PLASMA)) {
            return [];
        }

        const maxTargets = 3;
        const enemiesInRange = enemies.filter(e => {
            const dist = Math.hypot(e.x - explosionX, e.y - explosionY);
            return dist < explosionRange && !e.markedForDeletion;
        });

        const shuffled = [...enemiesInRange].sort(() => Math.random() - 0.5);
        const targets: Entity[] = [];
        for (let i = 0; i < Math.min(maxTargets, shuffled.length); i++) {
            targets.push(shuffled[i]);
        }

        return targets;
    }
}

export interface SynergyTriggerResult {
    /** 触发的组合技类型 */
    type: SynergyType;
    /** 效果类型 */
    effect: SynergyEffectType;
    /** 效果数值 */
    value: number;
    /** 效果颜色(用于视觉特效) */
    color: string;
    /** 伤害倍率(仅用于damage_boost效果) */
    multiplier?: number;
}
