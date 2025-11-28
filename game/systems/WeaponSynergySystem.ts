/**
 * WeaponSynergySystem - P2 Advanced Feature
 * 武器组合技系统: 实现同时装备特定武器时触发的协同效果
 * 
 * 核心机制:
 * - 检测玩家当前装备的武器组合
 * - 在特定条件下触发组合技效果
 * - 提供视觉和数值反馈
 */

import { WeaponType, Entity, EntityType } from '@/types';

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
        description: 'WAVE子弹穿过PLASMA爆炸区时伤害+50%',
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
        description: 'PLASMA爆炸范围内额外触发3道闪电',
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
            bulletWeapon === WeaponType.LASER) {
            if (Math.random() < SYNERGY_CONFIGS[SynergyType.LASER_TESLA].triggerChance) {
                results.push({
                    type: SynergyType.LASER_TESLA,
                    effect: 'chain_lightning',
                    value: 1, // 触发1次连锁闪电
                    color: SYNERGY_CONFIGS[SynergyType.LASER_TESLA].color
                });
            }
        }

        // WAVE + PLASMA: 能量共鸣
        if (this.isSynergyActive(SynergyType.WAVE_PLASMA) && 
            bulletWeapon === WeaponType.WAVE) {
            // 检查WAVE子弹是否穿过PLASMA爆炸区
            // 这需要在GameEngine中跟踪PLASMA爆炸位置和时间
            // 此处返回标记,由调用方判断并应用伤害加成
            results.push({
                type: SynergyType.WAVE_PLASMA,
                effect: 'damage_boost',
                value: 1.5, // 伤害×1.5
                color: SYNERGY_CONFIGS[SynergyType.WAVE_PLASMA].color,
                multiplier: 1.5
            });
        }

        // MISSILE + VULCAN: 弹幕覆盖
        if (this.isSynergyActive(SynergyType.MISSILE_VULCAN) && 
            bulletWeapon === WeaponType.MISSILE) {
            // 检查目标是否同时被VULCAN子弹命中
            // 通过检查目标身上的"被击中标记"
            const targetHitByVulcan = context.targetEnemy.state === 1; // 简化标记
            if (targetHitByVulcan) {
                results.push({
                    type: SynergyType.MISSILE_VULCAN,
                    effect: 'damage_boost',
                    value: 1.3, // 伤害×1.3
                    color: SYNERGY_CONFIGS[SynergyType.MISSILE_VULCAN].color,
                    multiplier: 1.3
                });
            }
        }

        // MAGMA + SHURIKEN: 熔火飞刃
        if (this.isSynergyActive(SynergyType.MAGMA_SHURIKEN) && 
            bulletWeapon === WeaponType.SHURIKEN) {
            // 检查SHURIKEN是否发生过反弹
            // 通过检查子弹的速度方向变化(简化)
            const hasBounced = context.targetEnemy.state === 1; // 反弹标记
            if (hasBounced) {
                results.push({
                    type: SynergyType.MAGMA_SHURIKEN,
                    effect: 'burn',
                    value: 5, // 每秒5点灼烧伤害
                    color: SYNERGY_CONFIGS[SynergyType.MAGMA_SHURIKEN].color
                });
            }
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

        const lightningBullets: Entity[] = [];
        let lightningCount = 0;
        const maxLightning = 3;

        // 在爆炸范围内随机找3个敌人发射闪电
        const enemiesInRange = enemies.filter(e => {
            const dist = Math.hypot(e.x - explosionX, e.y - explosionY);
            return dist < explosionRange && !e.markedForDeletion;
        });

        // 随机选择最多3个敌人
        const shuffled = [...enemiesInRange].sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(maxLightning, shuffled.length); i++) {
            const target = shuffled[i];
            const angle = Math.atan2(target.y - explosionY, target.x - explosionX);
            
            lightningBullets.push({
                x: explosionX,
                y: explosionY,
                width: 16,
                height: 64,
                vx: Math.cos(angle) * 20,
                vy: Math.sin(angle) * 20,
                hp: 1,
                maxHp: 1,
                type: EntityType.BULLET,
                color: SYNERGY_CONFIGS[SynergyType.TESLA_PLASMA].color,
                markedForDeletion: false,
                spriteKey: 'bullet_tesla',
                damage: 25, // 风暴闪电伤害
                weaponType: WeaponType.TESLA,
                chainCount: 1, // 可以继续连锁1次
                chainRange: 150
            });
            
            lightningCount++;
        }

        return lightningBullets;
    }
}

export interface SynergyTriggerResult {
    /** 触发的组合技类型 */
    type: SynergyType;
    /** 效果类型 */
    effect: 'chain_lightning' | 'damage_boost' | 'burn';
    /** 效果数值 */
    value: number;
    /** 效果颜色(用于视觉特效) */
    color: string;
    /** 伤害倍率(仅用于damage_boost效果) */
    multiplier?: number;
}
