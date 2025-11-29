/**
 * BossPhaseSystem - P2 Advanced Feature
 * Boss阶段系统: 为特定Boss添加多阶段战斗机制
 * 
 * 核心机制:
 * - DESTROYER (第3关): 三阶段战斗
 *   - 阶段1 (100%-70%): 侧翼掩护,正常攻击
 *   - 阶段2 (70%-40%): 侧翼破坏,冲刺撞击
 *   - 阶段3 (40%-0%): 核心暴露,狂暴模式
 * 
 * - TITAN (第7关): 三阶段战斗
 *   - 阶段1 (100%-65%): 重装防御,标准激光攻击
 *   - 阶段2 (65%-30%): 能量过载,激光频率提升
 *   - 阶段3 (30%-0%): 最终防线,全弹幕释放
 * 
 * - APOCALYPSE (第10关): 四阶段终极战
 *   - 阶段1 (100%-75%): 全武器展示
 *   - 阶段2 (75%-50%): 装甲模式,提升防御
 *   - 阶段3 (50%-25%): 狂暴模式,高速攻击
 *   - 阶段4 (25%-0%): 绝境反击,最强形态
 */

import { Entity, BossType, ExplosionSize } from '@/types';
import { AudioSystem } from './AudioSystem';

// ==================== Boss阶段枚举 ====================
export enum BossPhase {
    PHASE_1 = 1,
    PHASE_2 = 2,
    PHASE_3 = 3,
    PHASE_4 = 4
}

// ==================== 阶段配置接口 ====================
export interface PhaseConfig {
    phase: BossPhase;
    hpThreshold: number;      // 血量阈值(百分比)
    name: string;             // 阶段名称
    description: string;      // 阶段描述

    // 行为配置
    moveSpeed?: number;       // 移动速度倍率
    fireRate?: number;        // 射击速率倍率
    bulletCount?: number;     // 子弹数量倍率
    damageMultiplier?: number; // 伤害倍率

    // 特殊技能
    specialAbilities?: string[]; // 特殊技能列表

    // 视觉效果
    color?: string;           // 阶段颜色
    flashEffect?: boolean;    // 闪光效果
}

// ==================== DESTROYER三阶段配置 ====================
export const DESTROYER_PHASES: PhaseConfig[] = [
    {
        phase: BossPhase.PHASE_1,
        hpThreshold: 0.70,
        name: '侧翼掩护',
        description: '护翼完整,正常攻击模式',
        moveSpeed: 1.0,
        fireRate: 1.0,
        bulletCount: 1.0,
        damageMultiplier: 1.0,
        specialAbilities: ['wingman_support'],
        color: '#ff6b6b',
        flashEffect: false
    },
    {
        phase: BossPhase.PHASE_2,
        hpThreshold: 0.40,
        name: '冲刺撞击',
        description: '侧翼破坏,开始冲刺攻击',
        moveSpeed: 1.5,
        fireRate: 1.2,
        bulletCount: 1.3,
        damageMultiplier: 1.2,
        specialAbilities: ['dash_attack', 'enhanced_barrage'],
        color: '#ff4757',
        flashEffect: true
    },
    {
        phase: BossPhase.PHASE_3,
        hpThreshold: 0.0,
        name: '狂暴核心',
        description: '核心暴露,进入狂暴状态',
        moveSpeed: 2.0,
        fireRate: 1.5,
        bulletCount: 1.5,
        damageMultiplier: 1.5,
        specialAbilities: ['berserk_mode', 'spiral_barrage', 'laser_sweep'],
        color: '#ee5a6f',
        flashEffect: true
    }
];

// ==================== TITAN三阶段配置 ====================
export const TITAN_PHASES: PhaseConfig[] = [
    {
        phase: BossPhase.PHASE_1,
        hpThreshold: 0.65,
        name: '重装防御',
        description: '三角要塞完整形态,标准激光攻击',
        moveSpeed: 1.0,
        fireRate: 1.0,
        bulletCount: 1.0,
        damageMultiplier: 1.0,
        specialAbilities: ['continuous_laser', 'tracking_shot'],
        color: '#44ff44',
        flashEffect: false
    },
    {
        phase: BossPhase.PHASE_2,
        hpThreshold: 0.30,
        name: '能量过载',
        description: '能量核心过载,激光频率大幅提升',
        moveSpeed: 1.3,
        fireRate: 1.5,
        bulletCount: 1.3,
        damageMultiplier: 1.3,
        specialAbilities: ['rapid_laser', 'enhanced_tracking', 'energy_burst'],
        color: '#66ff66',
        flashEffect: true
    },
    {
        phase: BossPhase.PHASE_3,
        hpThreshold: 0.0,
        name: '最终防线',
        description: '全力防御,激光连发+密集弹幕',
        moveSpeed: 1.5,
        fireRate: 2.0,
        bulletCount: 1.8,
        damageMultiplier: 1.5,
        specialAbilities: ['laser_barrage', 'omnidirectional_fire', 'fortress_mode'],
        color: '#88ff88',
        flashEffect: true
    }
];

// ==================== APOCALYPSE四阶段配置 ====================
export const APOCALYPSE_PHASES: PhaseConfig[] = [
    {
        phase: BossPhase.PHASE_1,
        hpThreshold: 0.75,
        name: '全武器展示',
        description: '展示所有武器系统',
        moveSpeed: 1.0,
        fireRate: 1.0,
        bulletCount: 1.0,
        damageMultiplier: 1.0,
        specialAbilities: ['weapon_rotation', 'plasma_volley', 'missile_barrage'],
        color: '#9b59b6',
        flashEffect: false
    },
    {
        phase: BossPhase.PHASE_2,
        hpThreshold: 0.50,
        name: '装甲模式',
        description: '启动防御装甲,降低受伤',
        moveSpeed: 0.8,
        fireRate: 1.2,
        bulletCount: 1.2,
        damageMultiplier: 1.3,
        specialAbilities: ['armor_shield', 'counter_attack', 'energy_barrier'],
        color: '#3498db',
        flashEffect: true
    },
    {
        phase: BossPhase.PHASE_3,
        hpThreshold: 0.25,
        name: '狂暴模式',
        description: '解除限制器,高速攻击',
        moveSpeed: 1.5,
        fireRate: 1.6,
        bulletCount: 1.5,
        damageMultiplier: 1.3,
        specialAbilities: ['berserk_rage', 'rapid_fire', 'tracking_missiles'],
        color: '#e74c3c',
        flashEffect: true
    },
    {
        phase: BossPhase.PHASE_4,
        hpThreshold: 0.0,
        name: '绝境反击',
        description: '全力一击,最终形态',
        moveSpeed: 2.0,
        fireRate: 2.0,
        bulletCount: 1.7,
        damageMultiplier: 1.7,
        specialAbilities: ['last_stand', 'screen_clear', 'omnidirectional_laser'],
        color: '#c0392b',
        flashEffect: true
    }
];

// ==================== Boss阶段状态 ====================
export interface BossPhaseState {
    currentPhase: BossPhase;
    previousPhase: BossPhase;
    phaseConfig: PhaseConfig;
    transitionTimer: number;
    isTransitioning: boolean;

    // 特殊技能计时器
    dashTimer?: number;
    laserTimer?: number;
    barrageTimer?: number;
}

// ==================== Boss阶段系统类 ====================
export class BossPhaseSystem {
    private audio: AudioSystem;
    private phaseStates: Map<string, BossPhaseState> = new Map();

    constructor(audio: AudioSystem) {
        this.audio = audio;
    }

    /**
     * 初始化Boss阶段状态
     */
    initializeBoss(boss: Entity, bossType: BossType): BossPhaseState {
        const phases = this.getPhaseConfigs(bossType);
        if (phases.length === 0) {
            // 非多阶段Boss,返回空状态
            return {
                currentPhase: BossPhase.PHASE_1,
                previousPhase: BossPhase.PHASE_1,
                phaseConfig: this.createDefaultPhaseConfig(),
                transitionTimer: 0,
                isTransitioning: false
            };
        }

        const initialState: BossPhaseState = {
            currentPhase: BossPhase.PHASE_1,
            previousPhase: BossPhase.PHASE_1,
            phaseConfig: phases[0],
            transitionTimer: 0,
            isTransitioning: false,
            dashTimer: 0,
            laserTimer: 0,
            barrageTimer: 0
        };

        // 使用boss的ID作为key存储状态
        const key = this.getBossKey(boss);
        this.phaseStates.set(key, initialState);

        return initialState;
    }

    /**
     * 更新Boss阶段系统
     */
    update(boss: Entity, dt: number): void {
        const key = this.getBossKey(boss);
        const state = this.phaseStates.get(key);
        if (!state) return;

        const bossType = boss.subType as BossType;
        const phases = this.getPhaseConfigs(bossType);
        if (phases.length === 0) return;

        // 检查是否需要切换阶段
        const hpPercent = boss.hp / boss.maxHp;
        const newPhase = this.determinePhase(hpPercent, phases);

        if (newPhase !== state.currentPhase && !state.isTransitioning) {
            this.startPhaseTransition(boss, state, newPhase, phases);
        }

        // 更新阶段过渡
        if (state.isTransitioning) {
            state.transitionTimer += dt;
            if (state.transitionTimer >= 2000) { // 2秒过渡时间
                this.completePhaseTransition(boss, state);
            }
        }

        // 更新特殊技能计时器
        this.updateAbilityTimers(boss, state, dt);
    }

    /**
     * 获取Boss当前阶段状态
     */
    getPhaseState(boss: Entity): BossPhaseState | undefined {
        const key = this.getBossKey(boss);
        return this.phaseStates.get(key);
    }

    /**
     * 清理Boss阶段状态
     */
    cleanupBoss(boss: Entity): void {
        const key = this.getBossKey(boss);
        this.phaseStates.delete(key);
    }

    /**
     * 检查Boss是否应该触发特殊技能
     */
    shouldTriggerAbility(boss: Entity, abilityName: string): boolean {
        const state = this.getPhaseState(boss);
        if (!state || state.isTransitioning) return false;

        return state.phaseConfig.specialAbilities?.includes(abilityName) || false;
    }

    /**
     * 获取阶段倍率
     */
    getPhaseMultipliers(boss: Entity): {
        moveSpeed: number;
        fireRate: number;
        bulletCount: number;
        damageMultiplier: number;
    } {
        const state = this.getPhaseState(boss);
        if (!state) {
            return { moveSpeed: 1.0, fireRate: 1.0, bulletCount: 1.0, damageMultiplier: 1.0 };
        }

        return {
            moveSpeed: state.phaseConfig.moveSpeed || 1.0,
            fireRate: state.phaseConfig.fireRate || 1.0,
            bulletCount: state.phaseConfig.bulletCount || 1.0,
            damageMultiplier: state.phaseConfig.damageMultiplier || 1.0
        };
    }

    // ==================== 私有方法 ====================

    private getBossKey(boss: Entity): string {
        // 使用boss的位置和类型作为唯一标识
        return `${boss.subType}_${Math.floor(boss.x)}_${Math.floor(boss.y)}`;
    }

    private getPhaseConfigs(bossType: BossType): PhaseConfig[] {
        switch (bossType) {
            case BossType.DESTROYER:
                return DESTROYER_PHASES;
            case BossType.TITAN:
                return TITAN_PHASES;
            case BossType.APOCALYPSE:
                return APOCALYPSE_PHASES;
            default:
                return [];
        }
    }

    private determinePhase(hpPercent: number, phases: PhaseConfig[]): BossPhase {
        // 从后向前检查,找到第一个满足条件的阶段
        for (let i = phases.length - 1; i >= 0; i--) {
            if (hpPercent <= phases[i].hpThreshold) {
                return phases[i].phase;
            }
        }
        return BossPhase.PHASE_1;
    }

    private startPhaseTransition(
        boss: Entity,
        state: BossPhaseState,
        newPhase: BossPhase,
        phases: PhaseConfig[]
    ): void {
        state.previousPhase = state.currentPhase;
        state.currentPhase = newPhase;
        state.isTransitioning = true;
        state.transitionTimer = 0;

        // 找到新阶段的配置
        const newConfig = phases.find(p => p.phase === newPhase);
        if (newConfig) {
            state.phaseConfig = newConfig;
        }

        // 触发视觉效果
        if (newConfig?.flashEffect) {
            // 这里可以通过回调触发屏幕闪光等效果
            boss.invulnerable = true; // 阶段切换时短暂无敌
        }

        // 播放音效
        this.audio.playExplosion(ExplosionSize.LARGE);

        console.log(`Boss phase transition: ${state.previousPhase} -> ${state.currentPhase}`);
    }

    private completePhaseTransition(boss: Entity, state: BossPhaseState): void {
        state.isTransitioning = false;
        state.transitionTimer = 0;
        boss.invulnerable = false;

        // 重置技能计时器
        state.dashTimer = 0;
        state.laserTimer = 0;
        state.barrageTimer = 0;
    }

    private updateAbilityTimers(boss: Entity, state: BossPhaseState, dt: number): void {
        if (state.isTransitioning) return;

        // 更新各种技能计时器
        if (state.dashTimer !== undefined) {
            state.dashTimer += dt;
        }
        if (state.laserTimer !== undefined) {
            state.laserTimer += dt;
        }
        if (state.barrageTimer !== undefined) {
            state.barrageTimer += dt;
        }
    }

    private createDefaultPhaseConfig(): PhaseConfig {
        return {
            phase: BossPhase.PHASE_1,
            hpThreshold: 1.0,
            name: 'Default',
            description: 'Default phase',
            moveSpeed: 1.0,
            fireRate: 1.0,
            bulletCount: 1.0,
            damageMultiplier: 1.0,
            specialAbilities: [],
            color: '#ffffff',
            flashEffect: false
        };
    }
}
