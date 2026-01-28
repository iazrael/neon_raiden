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
import { Transform, Sprite, Particle, Lifetime } from '../components';
import { HitEvent, KillEvent, PickupEvent, BossPhaseChangeEvent, CamShakeEvent, BloodFogEvent, LevelUpEvent, ComboUpgradeEvent, BerserkModeEvent, BombExplodedEvent } from '../events';
import { triggerCameraShake } from './RenderSystem';
import { generateId } from '../world';
import { SpriteKey } from '../configs/sprites';

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
        }
    }
}

/**
 * 处理命中事件
 */
function handleHitEvent(world: World, event: HitEvent): void {
    // 根据伤害值选择爆炸大小
    let effectKey = 'explosion_small';
    if (event.damage > 30) {
        effectKey = 'explosion_medium';
    }
    if (event.damage > 60) {
        effectKey = 'explosion_large';
    }

    // 生成爆炸粒子
    spawnParticle(world, effectKey, event.pos.x, event.pos.y);

    // 根据血量等级生成飙血特效
    const bloodKey = `blood_${event.bloodLevel === 1 ? 'light' : event.bloodLevel === 2 ? 'medium' : 'heavy'}`;
    spawnParticle(world, bloodKey, event.pos.x, event.pos.y);
}

/**
 * 处理击杀事件
 */
function handleKillEvent(world: World, event: KillEvent): void {
    // 生成大型爆炸特效
    spawnParticle(world, 'explosion_large', event.pos.x, event.pos.y);
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
    const playerComps = world.entities.get(world.playerId);
    const transform = playerComps?.find(Transform.check) as Transform | undefined;

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

    // 创建粒子组件
    const transform = new Transform({ x, y, rot: 0 });
    // TODO: 粒子效果不需要精灵图吧？
    // const sprite = new Sprite({
    //     spriteKey: SpriteKey.PARTICLE,
    //     color: config.color,
    //     scale: config.scale
    // });
    const particle = new Particle({
        frame: 0,
        maxFrame: config.frames,
        fps: config.fps
    });
    // Lifetime 使用 timer (秒 * 1000 = 毫秒)
    const lifetime = new Lifetime({ timer: config.lifetime * 1000 });

    // 生成实体 ID
    const id = generateId();

    // 存储组件
    world.entities.set(id, [transform, particle, lifetime]);

    return id;
}

/**
 * 更新粒子动画帧
 */
export function updateParticles(world: World, dt: number): void {
    for (const [id, comps] of world.entities) {
        const particle = comps.find(Particle.check) as Particle | undefined;
        if (!particle) continue;

        // 累加帧时间
        particle.frame += dt * particle.fps;

        // 检查是否播放完毕
        if (particle.frame >= particle.maxFrame) {
            // 标记为销毁
            const lifetime = comps.find(Lifetime.check) as Lifetime | undefined;
            if (lifetime) {
                lifetime.timer = 0; // 强制过期
            }
        }
    }
}
