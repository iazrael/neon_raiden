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

import { World } from '../world';
import { Transform, Particle, Lifetime, Shockwave, Velocity } from '../components';
import { HitEvent, KillEvent, PickupEvent, BossPhaseChangeEvent, CamShakeEvent, BloodFogEvent, LevelUpEvent, ComboUpgradeEvent, BerserkModeEvent, BombExplodedEvent, WeaponEffectEvent } from '../events';
import { triggerCameraShake } from './RenderSystem';
import { getComponents, view } from '../world';
import { Blueprint } from '../blueprints';
import { spawnFromBlueprint } from '../factory';
import { PARTICLE_EFFECTS, EXPLOSION_PARTICLES, PARTICLE_DEBUG } from '../blueprints/effects';

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
    // 生成爆炸粒子 - 使用新的物理粒子系统
    const config = EXPLOSION_PARTICLES.hit;
    spawnExplosionParticles(world, event.pos.x, event.pos.y, config);
}

/**
 * 处理击杀事件
 * 采用旧版本的"多粒子飞散"爆炸效果
 */
function handleKillEvent(world: World, event: KillEvent): void {
    // 生成大型爆炸粒子 - 使用新的物理粒子系统
    const config = EXPLOSION_PARTICLES.large;
    spawnExplosionParticles(world, event.pos.x, event.pos.y, config);

    // 添加冲击波 - 缩小最大半径，避免圈太大
    spawnShockwave(world, event.pos.x, event.pos.y, '#ffffff', 120, 6);
}

/**
 * 生成爆炸粒子 - 模仿旧版本的物理粒子系统
 * 生成多个粒子，每个有随机速度向四周飞散
 */
function spawnExplosionParticles(world: World, x: number, y: number, config: typeof EXPLOSION_PARTICLES[keyof typeof EXPLOSION_PARTICLES]): void {
    // 调试日志
    if (PARTICLE_DEBUG.enabled && PARTICLE_DEBUG.logSpawns) {
        console.log(`[EffectPlayer] 生成爆炸粒子: ${config.count}个, 位置(${x.toFixed(1)}, ${y.toFixed(1)}), 颜色=${config.color}`);
    }

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
                timer: config.life  // config.life 已经是毫秒，Lifetime.timer 也是毫秒
            }
        };

        spawnFromBlueprint(world, particleBlueprint, x, y, 0);
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

    // 触发震屏（500毫秒）
    triggerCameraShake(10, 500);
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

    // 触发震屏（300毫秒）
    triggerCameraShake(5, 300);
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

    // 触发强烈震屏（800毫秒）
    triggerCameraShake(15, 800);
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
    const config = PARTICLE_EFFECTS[effectKey];
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
            timer: config.lifetime  // lifetime 已经是毫秒，直接使用
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
    for (const [_id, [particle, lifetime]] of view(world, [Particle, Lifetime])) {

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
