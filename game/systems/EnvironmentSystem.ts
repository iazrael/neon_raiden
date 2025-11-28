/**
 * EnvironmentSystem - P2 Advanced Feature
 * 环境机制系统: 为特定关卡添加环境元素,增加策略深度和视觉多样性
 * 
 * 核心机制:
 * - 第3关: 障碍物系统(可摧毁,阻挡双方子弹)
 * - 第5关: 能量风暴(周期性出现,减速30%)
 * - 第7关: 陨石雨(随机降落,可击碎获得分数)
 * - 第9关: 重力场(左右交替,拉向一侧)
 */

import { Entity, EntityType } from '@/types';

// ==================== 环境元素类型 ====================
export enum EnvironmentType {
    OBSTACLE = 'OBSTACLE',           // 障碍物
    ENERGY_STORM = 'ENERGY_STORM',   // 能量风暴
    METEOR = 'METEOR',                // 陨石
    GRAVITY_FIELD = 'GRAVITY_FIELD'  // 重力场
}

// ==================== 环境元素接口 ====================
export interface EnvironmentElement extends Entity {
    environmentType: EnvironmentType;
    /** 特定环境元素的数据 */
    data?: any;
}

// ==================== 障碍物配置 ====================
export interface ObstacleConfig {
    hp: number;              // 血量
    width: number;           // 宽度
    height: number;          // 高度
    color: string;           // 颜色
    maxCount: number;        // 同时存在的最大数量
    spawnInterval: number;   // 生成间隔(ms)
}

export const OBSTACLE_CONFIG: ObstacleConfig = {
    hp: 100,
    width: 60,
    height: 80,
    color: '#888888',
    maxCount: 3,
    spawnInterval: 15000  // 15秒生成一次
};

// ==================== 能量风暴配置 ====================
export interface EnergyStormConfig {
    width: number;           // 宽度(全屏)
    height: number;          // 高度
    color: string;           // 颜色
    speedMultiplier: number; // 速度倍率(0.7 = 减速30%)
    cycleTime: number;       // 循环时间(ms)
    duration: number;        // 持续时间(ms)
    position: 'top' | 'bottom'; // 位置
}

export const ENERGY_STORM_CONFIG: EnergyStormConfig = {
    width: 0,  // 运行时设置为屏幕宽度
    height: 120,
    color: '#4ade80',
    speedMultiplier: 0.7,
    cycleTime: 20000,  // 每20秒一次
    duration: 5000,     // 持续5秒
    position: 'top'
};

// ==================== 陨石雨配置 ====================
export interface MeteorConfig {
    baseDamage: number;      // 基础伤害
    baseHp: number;          // 基础血量
    baseSpeed: number;       // 基础速度
    scoreReward: number;     // 击碎奖励分数
    spawnInterval: number;   // 生成间隔(ms)
    maxCount: number;        // 同时存在的最大数量
}

export const METEOR_CONFIG: MeteorConfig = {
    baseDamage: 20,
    baseHp: 50,
    baseSpeed: 8,
    scoreReward: 150,
    spawnInterval: 2000,  // 每2秒生成一个
    maxCount: 5
};

// ==================== 重力场配置 ====================
export interface GravityFieldConfig {
    pullForce: number;       // 拉力强度
    width: number;           // 宽度
    color: string;           // 颜色
    switchInterval: number;  // 切换间隔(ms)
    side: 'left' | 'right';  // 当前侧
}

export const GRAVITY_FIELD_CONFIG: GravityFieldConfig = {
    pullForce: 0.5,
    width: 220,
    color: '#8b5cf6',
    switchInterval: 8000,  // 每8秒切换一次
    side: 'left'
};

// ==================== 环境系统类 ====================
export class EnvironmentSystem {
    private screenWidth: number;
    private screenHeight: number;
    
    // 障碍物系统
    private obstacles: EnvironmentElement[] = [];
    private obstacleTimer: number = 0;
    
    // 能量风暴系统
    private energyStorm: EnvironmentElement | null = null;
    private stormTimer: number = 0;
    private stormActive: boolean = false;
    
    // 重力场系统
    private gravityField: EnvironmentElement | null = null;
    private gravityTimer: number = 0;
    private currentGravitySide: 'left' | 'right' = 'left';

    constructor(screenWidth: number, screenHeight: number) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
    }

    /**
     * 重置所有环境元素
     */
    reset() {
        this.obstacles = [];
        this.energyStorm = null;
        this.gravityField = null;
        this.obstacleTimer = 0;
        this.stormTimer = 0;
        this.gravityTimer = 0;
        this.stormActive = false;
        this.currentGravitySide = 'left';
    }

    /**
     * 调整屏幕尺寸
     */
    resize(width: number, height: number) {
        this.screenWidth = width;
        this.screenHeight = height;
    }

    /**
     * 更新环境系统(每帧调用)
     */
    update(dt: number, currentLevel: number, player: Entity) {
        // 根据关卡决定更新哪个环境系统
        switch (currentLevel) {
            case 3:
                this.updateObstacles(dt);
                break;
            case 5:
                this.updateEnergyStorm(dt);
                break;
            case 7:
                // 陨石雨由GameEngine的现有系统处理,这里不需要额外处理
                break;
            case 9:
                this.updateGravityField(dt, player);
                break;
        }
    }

    // ==================== 障碍物系统 ====================
    
    /**
     * 更新障碍物系统
     */
    private updateObstacles(dt: number) {
        this.obstacleTimer += dt;
        
        // 定期生成新障碍物
        if (this.obstacles.length < OBSTACLE_CONFIG.maxCount && 
            this.obstacleTimer >= OBSTACLE_CONFIG.spawnInterval) {
            this.spawnObstacle();
            this.obstacleTimer = 0;
        }
        
        // 移除被标记删除的障碍物
        this.obstacles = this.obstacles.filter(o => !o.markedForDeletion && o.hp > 0);
    }

    /**
     * 生成障碍物
     */
    spawnObstacle(): EnvironmentElement {
        const x = Math.random() * (this.screenWidth - OBSTACLE_CONFIG.width * 2) + OBSTACLE_CONFIG.width;
        const y = this.screenHeight * 0.3 + Math.random() * (this.screenHeight * 0.3); // 屏幕中部
        
        const obstacle: EnvironmentElement = {
            x,
            y,
            width: OBSTACLE_CONFIG.width,
            height: OBSTACLE_CONFIG.height,
            vx: 0,
            vy: 0,
            hp: OBSTACLE_CONFIG.hp,
            maxHp: OBSTACLE_CONFIG.hp,
            type: EntityType.POWERUP, // 复用POWERUP类型,通过environmentType区分
            color: OBSTACLE_CONFIG.color,
            markedForDeletion: false,
            environmentType: EnvironmentType.OBSTACLE,
            spriteKey: 'obstacle'
        };
        
        this.obstacles.push(obstacle);
        return obstacle;
    }

    /**
     * 获取所有障碍物
     */
    getObstacles(): EnvironmentElement[] {
        return this.obstacles;
    }

    /**
     * 障碍物受到伤害
     */
    damageObstacle(obstacle: EnvironmentElement, damage: number) {
        obstacle.hp -= damage;
        if (obstacle.hp <= 0) {
            obstacle.markedForDeletion = true;
        }
    }

    // ==================== 能量风暴系统 ====================
    
    /**
     * 更新能量风暴系统
     */
    private updateEnergyStorm(dt: number) {
        this.stormTimer += dt;
        
        if (!this.stormActive && this.stormTimer >= ENERGY_STORM_CONFIG.cycleTime) {
            // 激活风暴
            this.spawnEnergyStorm();
            this.stormActive = true;
            this.stormTimer = 0;
        } else if (this.stormActive && this.stormTimer >= ENERGY_STORM_CONFIG.duration) {
            // 结束风暴
            this.energyStorm = null;
            this.stormActive = false;
            this.stormTimer = 0;
        }
    }

    /**
     * 生成能量风暴
     */
    private spawnEnergyStorm() {
        const position = Math.random() > 0.5 ? 'top' : 'bottom';
        const y = position === 'top' ? 100 : this.screenHeight - 100 - ENERGY_STORM_CONFIG.height;
        
        this.energyStorm = {
            x: this.screenWidth / 2,
            y,
            width: this.screenWidth,
            height: ENERGY_STORM_CONFIG.height,
            vx: 0,
            vy: 0,
            hp: 1,
            maxHp: 1,
            type: EntityType.POWERUP,
            color: ENERGY_STORM_CONFIG.color,
            markedForDeletion: false,
            environmentType: EnvironmentType.ENERGY_STORM,
            data: { speedMultiplier: ENERGY_STORM_CONFIG.speedMultiplier },
            spriteKey: 'energy_storm'
        };
    }

    /**
     * 获取能量风暴
     */
    getEnergyStorm(): EnvironmentElement | null {
        return this.energyStorm;
    }

    /**
     * 检查玩家是否在风暴中
     */
    isPlayerInStorm(player: Entity): boolean {
        if (!this.energyStorm) return false;
        
        return (
            player.x >= this.energyStorm.x - this.energyStorm.width / 2 &&
            player.x <= this.energyStorm.x + this.energyStorm.width / 2 &&
            player.y >= this.energyStorm.y - this.energyStorm.height / 2 &&
            player.y <= this.energyStorm.y + this.energyStorm.height / 2
        );
    }

    // ==================== 重力场系统 ====================
    
    /**
     * 更新重力场系统
     */
    private updateGravityField(dt: number, player: Entity) {
        this.gravityTimer += dt;
        
        // 定期切换重力场方向
        if (this.gravityTimer >= GRAVITY_FIELD_CONFIG.switchInterval) {
            this.currentGravitySide = this.currentGravitySide === 'left' ? 'right' : 'left';
            this.gravityTimer = 0;
            this.spawnGravityField();
        }
        
        // 如果没有重力场,创建一个
        if (!this.gravityField) {
            this.spawnGravityField();
        }
    }

    /**
     * 生成重力场
     */
    private spawnGravityField() {
        const x = this.currentGravitySide === 'left' 
            ? GRAVITY_FIELD_CONFIG.width / 2 
            : this.screenWidth - GRAVITY_FIELD_CONFIG.width / 2;
        
        this.gravityField = {
            x,
            y: this.screenHeight / 2,
            width: GRAVITY_FIELD_CONFIG.width,
            height: this.screenHeight,
            vx: 0,
            vy: 0,
            hp: 1,
            maxHp: 1,
            type: EntityType.POWERUP,
            color: GRAVITY_FIELD_CONFIG.color,
            markedForDeletion: false,
            environmentType: EnvironmentType.GRAVITY_FIELD,
            data: { 
                pullForce: GRAVITY_FIELD_CONFIG.pullForce,
                side: this.currentGravitySide
            },
            spriteKey: 'gravity_field'
        };
    }

    /**
     * 获取重力场
     */
    getGravityField(): EnvironmentElement | null {
        return this.gravityField;
    }

    /**
     * 应用重力场效果到玩家
     */
    applyGravityToPlayer(player: Entity): void {
        if (!this.gravityField) return;
        
        const pullDirection = this.currentGravitySide === 'left' ? -1 : 1;
        player.vx += GRAVITY_FIELD_CONFIG.pullForce * pullDirection;
    }

    // ==================== 通用方法 ====================
    
    /**
     * 获取当前关卡的所有环境元素
     */
    getAllElements(): EnvironmentElement[] {
        const elements: EnvironmentElement[] = [];
        
        elements.push(...this.obstacles);
        
        if (this.energyStorm) {
            elements.push(this.energyStorm);
        }
        
        if (this.gravityField) {
            elements.push(this.gravityField);
        }
        
        return elements;
    }

    /**
     * 检查子弹是否应该被障碍物阻挡
     */
    shouldBlockBullet(bullet: Entity): boolean {
        for (const obstacle of this.obstacles) {
            if (this.isColliding(bullet, obstacle)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 碰撞检测
     */
    private isColliding(a: Entity, b: Entity): boolean {
        return (
            a.x - a.width / 2 < b.x + b.width / 2 &&
            a.x + a.width / 2 > b.x - b.width / 2 &&
            a.y - a.height / 2 < b.y + b.height / 2 &&
            a.y + a.height / 2 > b.y - b.height / 2
        );
    }
}
