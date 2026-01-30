/**
 * 特效播放器 (EffectPlayer)
 *
 * 职责：
 * - 监听游戏事件并生成对应的粒子特效
 * - 管理粒子生命周期
 * - 支持多种特效类型（爆炸、飙血、升级提示等）
 *
 * 系统类型：表现层
 * 执行顺序：P7 - 在 DamageResolutionSystem 之后
 */

import { World } from '../types';
import { Transform, Particle, Lifetime, Shockwave, Velocity } from '../components';
import { HitEvent, KillEvent, PickupEvent, BossPhaseChangeEvent, CamShakeEvent, BloodFogEvent, LevelUpEvent, ComboUpgradeEvent, BerserkModeEvent, BombExplodedEvent, WeaponEffectEvent } from '../events';
import { triggerCameraShake } from './RenderSystem';
import { generateId, getComponents, view } from '../world';
import { Blueprint } from '../blueprints';
import { spawnFromBlueprint } from '../factory';

/**
 * 粒子类型配置
 */
interface ParticleConfig {
    scale: number;
    color: string;
    frames: number;
    fps: number;
    lifetime: number;
}

/**
 * 特效配置表
 */
const EFFECT_CONFIGS: Record<string, ParticleConfig> = {
    // 爆炸特效
    explosion_small: {
        scale: 1,
        color: '#ff6600',
        frames: 8,
        fps: 16,
        lifetime: 0.5
    },
    explosion_medium: {
        scale: 1.5,
        color: '#ff4400',
        frames: 12,
        fps: 16,
        lifetime: 0.75
    },
    explosion_large: {
        scale: 2,
        color: '#ff2200',
        frames: 16,
        fps: 16,
        lifetime: 1.0
    },

    // 飙血特效
    blood_light: {
        scale: 0.5,
        color: '#ff3333',
        frames: 4,
        fps: 12,
        lifetime: 0.3
    },
    blood_medium: {
        scale: 0.8,
        color: '#ff0000',
        frames: 6,
        fps: 12,
        lifetime: 0.4
    },
    blood_heavy: {
        scale: 1.2,
        color: '#cc0000',
        frames: 8,
        fps: 12,
        lifetime: 0.5
    },

    // 拾取特效
    pickup: {
        scale: 1,
        color: '#00ff88',
        frames: 10,
        fps: 20,
        lifetime: 0.5
    },

    // 升级特效
    levelup: {
        scale: 2,
        color: '#ffff00',
        frames: 20,
        fps: 20,
        lifetime: 1.0
    },

    // 连击升级特效
    combo_upgrade: {
        scale: 1.5,
        color: '#00ffff',
        frames: 15,
        fps: 20,
        lifetime: 0.75
    },

    // Boss 阶段切换特效
    boss_phase: {
        scale: 3,
        color: '#ff00ff',
        frames: 24,
        fps: 24,
        lifetime: 1.0
    },

    // 狂暴模式特效
    berserk: {
        scale: 4,
        color: '#ff0000',
        frames: 30,
        fps: 30,
        lifetime: 1.5
    },

    // 炸弹爆炸特效
    bomb_explosion: {
        scale: 5,           // 超大尺寸
        color: '#ffaa00',   // 橙黄色爆炸
        frames: 30,         // 30帧动画
        fps: 30,            // 30fps播放
        lifetime: 1.0       // 持续1秒
    },

    // 全屏闪光特效
    screen_flash: {
        scale: 20,          // 覆盖全屏
        color: '#ffffff',   // 白色闪光
        frames: 5,          // 快速闪烁
        fps: 30,
        lifetime: 0.2       // 0.2秒
    },

    // 武器特效
    plasma_explosion: {
        scale: 2,
        color: '#ed64a6',   // 粉色
        frames: 16,
        fps: 16,
        lifetime: 1.0
    },
    tesla_chain: {
        scale: 1.5,
        color: '#a855f7',   // 紫色
        frames: 8,
        fps: 24,
        lifetime: 0.3
    },
    magma_burn: {
        scale: 1.2,
        color: '#ef4444',   // 红色
        frames: 12,
        fps: 12,
        lifetime: 0.6
    },
    shuriken_bounce: {
        scale: 1,
        color: '#fbbf24',   // 黄色
        frames: 6,
        fps: 20,
        lifetime: 0.3
    }
};

/**
 * 爆炸粒子配置 - 模仿旧版本的物理粒子系统
 */
interface ExplosionConfig {
    count: number;           // 粒子数量
    speedMin: number;        // 最小速度
    speedMax: number;        // 最大速度
    sizeMin: number;         // 最小大小
    sizeMax: number;         // 最大大小
    life: number;            // 生命周期 (ms)
    color: string;           // 颜色
}

/**
 * 爆炸效果配置表
 */
const EXPLOSION_CONFIGS: Record<string, ExplosionConfig> = {
    small: {
        count: 8,
        speedMin: 1,
        speedMax: 4,
        sizeMin: 2,
        sizeMax: 4,
        life: 300,
        color: '#ffe066'  // 黄色火花
    },
    large: {
        count: 30,
        speedMin: 3,
        speedMax: 10,
        sizeMin: 2,
        sizeMax: 6,
        life: 800,
        color: '#ff6600'  // 橙红色爆炸
    },
    hit: {
        count: 5,
        speedMin: 2,
        speedMax: 5,
        sizeMin: 2,
        sizeMax: 4,
        life: 200,
        color: '#ffffff'  // 白色击中闪光
    }
};

/**
 * 特效播放器主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function EffectPlayer(world: World, dt: number): void {
    // 收集本帧的所有事件
    const events = world.events;

    // 处理每种事件类型
    for (const event of events) {
        switch (event.type) {
            case 'Hit':
                handleHitEvent(world, event as HitEvent);
                break;
            case 'Kill':
                handleKillEvent(world, event as KillEvent);
                break;
            case 'Pickup':
                handlePickupEvent(world, event as PickupEvent);
                break;
            case 'BossPhaseChange':
                handleBossPhaseChangeEvent(world, event as BossPhaseChangeEvent);
                break;
            case 'CamShake':
                handleCamShakeEvent(world, event as CamShakeEvent);
                break;
            case 'BloodFog':
                handleBloodFogEvent(world, event as BloodFogEvent);
                break;
            case 'LevelUp':
                handleLevelUpEvent(world, event as LevelUpEvent);
                break;
            case 'ComboUpgrade':
                handleComboUpgradeEvent(world, event as ComboUpgradeEvent);
                break;
            case 'BerserkMode':
                handleBerserkModeEvent(world, event as BerserkModeEvent);
                break;
            case 'BombExploded':
                handleBombExplodedEvent(world, event as BombExplodedEvent);
                break;
            case 'WeaponEffect':
                handleWeaponEffectEvent(world, event as WeaponEffectEvent);
                break;
        }
    }

    // 更新所有粒子动画帧
    updateParticles(world, dt);
}

/**
 * 处理命中事件
 * 采用旧版本的"多粒子飞散"爆炸效果
 */
function handleHitEvent(world: World, event: HitEvent): void {
    // 调试：确认 HitEvent 到达
    console.log('[EffectPlayer] HitEvent received:', { pos: event.pos, damage: event.damage, bloodLevel: event.bloodLevel });

    // 生成爆炸粒子 - 使用新的物理粒子系统
    const config = EXPLOSION_CONFIGS.hit;
    spawnExplosionParticles(world, event.pos.x, event.pos.y, config);
}

/**
 * 处理击杀事件
 * 采用旧版本的"多粒子飞散"爆炸效果
 */
function handleKillEvent(world: World, event: KillEvent): void {
    // 生成大型爆炸粒子 - 使用新的物理粒子系统
    const config = EXPLOSION_CONFIGS.large;
    spawnExplosionParticles(world, event.pos.x, event.pos.y, config);

    // 添加冲击波 - 缩小最大半径，避免圈太大
    spawnShockwave(world, event.pos.x, event.pos.y, '#ffffff', 120, 6);
}

/**
 * 生成爆炸粒子 - 模仿旧版本的物理粒子系统
 * 生成多个粒子，每个有随机速度向四周飞散
 */
function spawnExplosionParticles(world: World, x: number, y: number, config: ExplosionConfig): void {
    console.log('[EffectPlayer] Spawning explosion particles:', { x, y, count: config.count, color: config.color });

    for (let i = 0; i < config.count; i++) {
        // 随机角度和速度
        const angle = Math.random() * Math.PI * 2;
        const speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);

        // 粒子蓝图 - 包含 Velocity 组件
        const particleBlueprint: Blueprint = {
            Transform: { x: 0, y: 0, rot: 0 },
            Velocity: {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed
            },
            Particle: {
                frame: 0,
                maxFrame: 60,  // 帧动画相关（物理粒子不使用）
                fps: 60,
                color: config.color,
                scale: config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin),
                maxLife: config.life  // 明确的生命周期（毫秒）
            },
            Lifetime: {
                timer: config.life / 1000  // 转换为秒（Lifetime 组件期望秒）
            }
        };

        const id = spawnFromBlueprint(world, particleBlueprint, x, y, 0);

        // 调试：确认粒子被创建，验证位置是否正确
        const createdComps = world.entities.get(id);
        if (createdComps) {
            const transform = createdComps.find(c => c.constructor.name === 'Transform');
            const lifetime = createdComps.find((c: any) => c.constructor.name === 'Lifetime');
            console.log('[EffectPlayer] Particle created:', {
                id,
                transformPos: transform ? { x: (transform as any).x, y: (transform as any).y } : 'NO_TRANSFORM',
                lifetimeTimer: lifetime ? (lifetime as any).timer : 'NO_LIFETIME',
                configLife: config.life
            });
        }
    }
}

/**
 * 处理拾取事件
 */
function handlePickupEvent(world: World, event: PickupEvent): void {
    // 生成拾取特效
    spawnParticle(world, 'pickup', event.pos.x, event.pos.y);
}

/**
 * 处理 Boss 阶段切换事件
 */
function handleBossPhaseChangeEvent(world: World, event: BossPhaseChangeEvent): void {
    // 生成 Boss 阶段切换特效
    spawnParticle(world, 'boss_phase', world.width / 2, world.height / 2);

    // 触发震屏
    triggerCameraShake(10, 0.5);
}

/**
 * 处理震屏事件
 */
function handleCamShakeEvent(world: World, event: CamShakeEvent): void {
    triggerCameraShake(event.intensity, event.duration);
}

/**
 * 处理飙血特效事件
 */
function handleBloodFogEvent(world: World, event: BloodFogEvent): void {
    const bloodKey = `blood_${event.level === 1 ? 'light' : event.level === 2 ? 'medium' : 'heavy'}`;
    spawnParticle(world, bloodKey, event.pos.x, event.pos.y);
}

/**
 * 处理升级事件
 */
function handleLevelUpEvent(world: World, event: LevelUpEvent): void {
    // 获取玩家位置
    const [transform] = getComponents(world, world.playerId, [Transform])

    if (transform) {
        spawnParticle(world, 'levelup', transform.x, transform.y);
    } else {
        spawnParticle(world, 'levelup', world.width / 2, world.height - 100);
    }

    // 触发震屏
    triggerCameraShake(5, 0.3);
}

/**
 * 处理连击升级事件
 */
function handleComboUpgradeEvent(world: World, event: ComboUpgradeEvent): void {
    // 生成连击升级特效
    spawnParticle(world, 'combo_upgrade', event.pos.x, event.pos.y);

    // 添加冲击波
    spawnShockwave(world, event.pos.x, event.pos.y, event.color, 200, 8);
}

/**
 * 处理狂暴模式事件
 */
function handleBerserkModeEvent(world: World, event: BerserkModeEvent): void {
    // 生成狂暴模式特效
    spawnParticle(world, 'berserk', event.pos.x, event.pos.y);

    // 触发强烈震屏
    triggerCameraShake(15, 0.8);
}

/**
 * 处理炸弹爆炸事件
 */
function handleBombExplodedEvent(world: World, event: BombExplodedEvent): void {
    // 生成全屏闪光特效
    spawnParticle(world, 'screen_flash', world.width / 2, world.height / 2);

    // 在爆炸位置生成超大型爆炸粒子
    spawnParticle(world, 'bomb_explosion', event.pos.x, event.pos.y);

    // 在屏幕四周生成额外的爆炸装饰
    const margin = 100;
    spawnParticle(world, 'explosion_large', margin, margin);
    spawnParticle(world, 'explosion_large', world.width - margin, margin);
    spawnParticle(world, 'explosion_large', margin, world.height - margin);
    spawnParticle(world, 'explosion_large', world.width - margin, world.height - margin);
}

/**
 * 生成粒子实体
 */
function spawnParticle(world: World, effectKey: string, x: number, y: number): number {
    const config = EFFECT_CONFIGS[effectKey];
    if (!config) {
        console.warn(`EffectPlayer: No config found for effect '${effectKey}'`);
        return 0;
    }

    // 创建粒子动画蓝图
    const particleBlueprint: Blueprint = {
        Transform: { x: 0, y: 0, rot: 0 },  // 位置通过参数传入
        Particle: {
            frame: 0,
            maxFrame: config.frames,
            fps: config.fps,
            color: config.color,  // 存储颜色用于渲染
            scale: config.scale   // 存储缩放用于大小
        },
        Lifetime: {
            timer: config.lifetime * 1000
        }
    };

    // 关键修复：x, y 必须作为参数传入
    const id = spawnFromBlueprint(world, particleBlueprint, x, y, 0);

    return id;
}

/**
 * 更新粒子动画帧
 */
export function updateParticles(world: World, dt: number): void {
    for (const [id, [particle, lifetime], comps] of view(world, [Particle, Lifetime])) {

        // 累加帧时间
        particle.frame += dt * particle.fps;

        // 检查是否播放完毕
        if (particle.frame >= particle.maxFrame) {
            // 标记为销毁
            lifetime.timer = 0; // 强制过期
        }
    }
}

/**
 * 生成冲击波特效
 * @param world 世界对象
 * @param x X 坐标
 * @param y Y 坐标
 * @param color 颜色
 * @param maxRadius 最大半径
 * @param width 线宽
 * @returns 实体 ID
 */
export function spawnShockwave(
    world: World,
    x: number,
    y: number,
    color: string = '#ffffff',
    maxRadius: number = 150,
    width: number = 5
): number {
    const shockwaveBlueprint: Blueprint = {
        Transform: { x: 0, y: 0, rot: 0 },  // 位置通过参数传入，不放在蓝图里
        Shockwave: { maxRadius, color, width },
        Lifetime: {
            timer: 1000 // 1秒生命周期
        }
    };

    // 关键修复：x, y 必须作为参数传入，否则 factory 会用默认值 0,0
    const id = spawnFromBlueprint(world, shockwaveBlueprint, x, y, 0);

    return id;
}

/**
 * 处理武器特效事件
 */
function handleWeaponEffectEvent(world: World, event: WeaponEffectEvent): void {
    let effectKey: string;

    switch (event.effectType) {
        case 'explosion':
            effectKey = 'plasma_explosion';
            break;
        case 'chain':
            effectKey = 'tesla_chain';
            break;
        case 'burn':
            effectKey = 'magma_burn';
            break;
        case 'bounce':
            effectKey = 'shuriken_bounce';
            break;
        default:
            return;
    }

    spawnParticle(world, effectKey, event.pos.x, event.pos.y);
}
