/**
 * EliteAISystem - P3 Experimental Feature
 * 精英敌人AI系统: 为精英敌人添加专属行为模式
 * 
 * 核心机制:
 * - 精英TANK: 生成时携带2个NORMAL僚机,形成护卫阵型
 * - 精英FAST: 移动时留下能量轨迹,延迟0.5秒后发射追踪弹
 * - 精英KAMIKAZE: 血量低于30%时速度×1.5,最后的冲刺
 * - 精英LASER_INTERCEPTOR: 激光蓄力时间减半,但伤害-20%
 * - 精英FORTRESS: 每5秒发射一次"重力场",减缓范围内玩家子弹速度30%
 * 
 * 设计目标:
 * - 增强精英敌人的独特性和威胁感
 * - 提供差异化的战斗体验
 * - 不破坏原有平衡,仅增强特色
 */

import { Entity, EntityType, EnemyType } from '@/types';
import { EnemyConfig } from '../config';

// ==================== 精英行为类型 ====================
export enum EliteBehaviorType {
    ESCORT = 'escort',           // 护卫阵型
    TRAIL = 'trail',             // 能量轨迹
    BERSERK = 'berserk',         // 狂暴冲刺
    RAPID_CHARGE = 'rapid_charge', // 快速蓄力
    GRAVITY_FIELD = 'gravity_field' // 重力场
}

// ==================== 轨迹点接口 ====================
export interface TrailPoint {
    x: number;
    y: number;
    createdTime: number;
    fired: boolean;
}

// ==================== 精英AI状态 ====================
export interface EliteAIState {
    behaviorType: EliteBehaviorType;
    escorts?: Entity[];           // 护卫敌人
    trailPoints?: TrailPoint[];   // 轨迹点
    gravityTimer?: number;        // 重力场计时器
    berserked?: boolean;          // 是否已进入狂暴
}

// ==================== 精英AI系统类 ====================
export class EliteAISystem {
    private eliteStates: Map<Entity, EliteAIState> = new Map();
    private width: number = 0;
    private height: number = 0;
    
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }
    
    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }
    
    /**
     * 初始化精英敌人
     */
    initializeElite(elite: Entity, enemies: Entity[]): void {
        if (!elite.isElite) return;
        
        const enemyType = elite.subType as EnemyType;
        let state: EliteAIState | null = null;
        
        switch (enemyType) {
            case EnemyType.TANK:
                state = this.initializeTankElite(elite, enemies);
                break;
            case EnemyType.FAST:
                state = this.initializeFastElite(elite);
                break;
            case EnemyType.KAMIKAZE:
                state = this.initializeKamikazeElite(elite);
                break;
            case EnemyType.LASER_INTERCEPTOR:
                state = this.initializeLaserElite(elite);
                break;
            case EnemyType.FORTRESS:
                state = this.initializeFortressElite(elite);
                break;
        }
        
        if (state) {
            this.eliteStates.set(elite, state);
        }
    }
    
    /**
     * 初始化精英TANK: 生成2个护卫
     */
    private initializeTankElite(elite: Entity, enemies: Entity[]): EliteAIState {
        const escorts: Entity[] = [];
        
        // 生成2个NORMAL护卫
        for (let i = 0; i < 2; i++) {
            const offsetX = (i === 0 ? -1 : 1) * 50;
            const normalConfig = EnemyConfig[EnemyType.NORMAL];
            
            const escort: Entity = {
                x: elite.x + offsetX,
                y: elite.y + 30,
                width: normalConfig.size.width,
                height: normalConfig.size.height,
                vx: 0,
                vy: normalConfig.baseSpeed,
                hp: normalConfig.baseHp,
                maxHp: normalConfig.baseHp,
                type: EntityType.ENEMY,
                subType: EnemyType.NORMAL,
                color: normalConfig.color,
                markedForDeletion: false,
                angle: 0,
                spriteKey: normalConfig.sprite,
                isElite: false,
                state: 0,
                timer: 0
            };
            
            escorts.push(escort);
            enemies.push(escort);
        }
        
        return {
            behaviorType: EliteBehaviorType.ESCORT,
            escorts
        };
    }
    
    /**
     * 初始化精英FAST: 准备轨迹系统
     */
    private initializeFastElite(elite: Entity): EliteAIState {
        return {
            behaviorType: EliteBehaviorType.TRAIL,
            trailPoints: []
        };
    }
    
    /**
     * 初始化精英KAMIKAZE: 准备狂暴模式
     */
    private initializeKamikazeElite(elite: Entity): EliteAIState {
        return {
            behaviorType: EliteBehaviorType.BERSERK,
            berserked: false
        };
    }
    
    /**
     * 初始化精英激光拦截机: 快速蓄力
     */
    private initializeLaserElite(elite: Entity): EliteAIState {
        return {
            behaviorType: EliteBehaviorType.RAPID_CHARGE
        };
    }
    
    /**
     * 初始化精英堡垒: 重力场
     */
    private initializeFortressElite(elite: Entity): EliteAIState {
        return {
            behaviorType: EliteBehaviorType.GRAVITY_FIELD,
            gravityTimer: 0
        };
    }
    
    /**
     * 更新精英AI
     */
    update(elite: Entity, dt: number, enemies: Entity[], bullets: Entity[], player: Entity): void {
        const state = this.eliteStates.get(elite);
        if (!state) return;
        
        switch (state.behaviorType) {
            case EliteBehaviorType.ESCORT:
                this.updateEscortBehavior(elite, state, dt);
                break;
            case EliteBehaviorType.TRAIL:
                this.updateTrailBehavior(elite, state, dt, bullets, player);
                break;
            case EliteBehaviorType.BERSERK:
                this.updateBerserkBehavior(elite, state);
                break;
            case EliteBehaviorType.RAPID_CHARGE:
                this.updateRapidChargeBehavior(elite, state);
                break;
            case EliteBehaviorType.GRAVITY_FIELD:
                this.updateGravityFieldBehavior(elite, state, dt, bullets);
                break;
        }
    }
    
    /**
     * 更新护卫行为
     */
    private updateEscortBehavior(elite: Entity, state: EliteAIState, dt: number): void {
        if (!state.escorts) return;
        
        // 护卫跟随精英TANK
        state.escorts.forEach((escort, index) => {
            if (escort.markedForDeletion) return;
            
            const offsetX = (index === 0 ? -1 : 1) * 50;
            const targetX = elite.x + offsetX;
            const targetY = elite.y + 30;
            
            // 平滑跟随
            escort.x += (targetX - escort.x) * 0.1;
            escort.y += (targetY - escort.y) * 0.1;
        });
        
        // 清理已销毁的护卫
        state.escorts = state.escorts.filter(e => !e.markedForDeletion);
    }
    
    /**
     * 更新轨迹行为
     */
    private updateTrailBehavior(
        elite: Entity,
        state: EliteAIState,
        dt: number,
        bullets: Entity[],
        player: Entity
    ): void {
        if (!state.trailPoints) return;
        
        // 每0.2秒留下一个轨迹点
        if (Math.random() < 0.05) {
            state.trailPoints.push({
                x: elite.x,
                y: elite.y,
                createdTime: Date.now(),
                fired: false
            });
        }
        
        // 检查轨迹点,0.5秒后发射追踪弹
        const now = Date.now();
        state.trailPoints.forEach(point => {
            if (!point.fired && now - point.createdTime >= 500) {
                // 发射追踪弹
                const dx = player.x - point.x;
                const dy = player.y - point.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    bullets.push({
                        x: point.x,
                        y: point.y,
                        width: 12,
                        height: 12,
                        vx: (dx / dist) * 4,
                        vy: (dy / dist) * 4,
                        hp: 1,
                        maxHp: 1,
                        type: EntityType.BULLET,
                        color: '#ff44ff',
                        markedForDeletion: false,
                        spriteKey: 'bullet_enemy_homing',
                        damage: 10
                    });
                }
                
                point.fired = true;
            }
        });
        
        // 清理旧轨迹点(超过2秒)
        state.trailPoints = state.trailPoints.filter(p => now - p.createdTime < 2000);
    }
    
    /**
     * 更新狂暴行为
     */
    private updateBerserkBehavior(elite: Entity, state: EliteAIState): void {
        const hpPercent = elite.hp / elite.maxHp;
        
        // 血量低于30%时进入狂暴
        if (hpPercent < 0.3 && !state.berserked) {
            state.berserked = true;
            
            // 提升速度×1.5
            elite.vy *= 1.5;
            
            // 视觉效果: 变为红色
            elite.color = '#ff0000';
        }
    }
    
    /**
     * 更新快速蓄力行为
     */
    private updateRapidChargeBehavior(elite: Entity, state: EliteAIState): void {
        // 激光拦截机的蓄力时间减半在EnemySystem中处理
        // 这里仅作标记
        elite.state = elite.state || 0;
    }
    
    /**
     * 更新重力场行为
     */
    private updateGravityFieldBehavior(
        elite: Entity,
        state: EliteAIState,
        dt: number,
        bullets: Entity[]
    ): void {
        if (state.gravityTimer === undefined) {
            state.gravityTimer = 0;
        }
        
        state.gravityTimer += dt;
        
        // 每5秒触发一次重力场
        if (state.gravityTimer >= 5000) {
            state.gravityTimer = 0;
            
            // 减缓范围内(150px)的玩家子弹速度
            bullets.forEach(bullet => {
                if (bullet.type === EntityType.BULLET) {
                    const dx = bullet.x - elite.x;
                    const dy = bullet.y - elite.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 150) {
                        // 子弹速度×0.7
                        bullet.vx *= 0.7;
                        bullet.vy *= 0.7;
                        
                        // 视觉效果: 子弹变紫色
                        bullet.color = '#9b59b6';
                    }
                }
            });
        }
    }
    
    /**
     * 清理精英状态
     */
    cleanup(elite: Entity): void {
        this.eliteStates.delete(elite);
    }
    
    /**
     * 清理所有状态
     */
    clear(): void {
        this.eliteStates.clear();
    }
    
    /**
     * 获取轨迹点(用于渲染)
     */
    getTrailPoints(elite: Entity): TrailPoint[] {
        const state = this.eliteStates.get(elite);
        return state?.trailPoints || [];
    }
    
    /**
     * 检查精英是否有特殊行为
     */
    hasBehavior(elite: Entity, behaviorType: EliteBehaviorType): boolean {
        const state = this.eliteStates.get(elite);
        return state?.behaviorType === behaviorType;
    }
}
