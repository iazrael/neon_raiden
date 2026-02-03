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

import { ensureComponent, getEntity, removeEntity, World } from "../world";
import {
    Transform,
    Particle,
    Lifetime,
    PlayerTag,
    EnemyTag,
    BossTag,
    Shockwave,
    BulletTimeLine,
    Meteor,
} from "../components";
import {
    HitEvent,
    KillEvent,
    PickupEvent,
    BossPhaseChangeEvent,
    CamShakeEvent,
    BloodFogEvent,
    LevelUpEvent,
    ComboUpgradeEvent,
    BerserkModeEvent,
    BombExplodedEvent,
    WeaponEffectEvent,
    ShieldBrokenEvent,
    TimeSlowEvent,
    GameEvent,
} from "../events";
import { triggerShake } from "./CameraSystem";
import { getComponents, view } from "../world";
import { spawnEntity } from "../factory";
import { PARTICLE_EFFECTS, ParticleId, ParticleEffectConfig } from "../blueprints/effects";

/**
 * 特效播放器主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function EffectSystem(world: World, dt: number): void {
    // 处理相关事件
    processEvents(world, world.events);

    // 处理特效更新
    updateEffects(world, dt);

}

/**
 * 处理事件
 * @param world 世界对象
 * @param events 事件数组
 */
function processEvents(world: World, events: GameEvent[]): void {
    // 处理每种事件类型
    for (const event of events) {
        switch (event.type) {
            case "Hit":
                // 碰撞
                handleHitEvent(world, event);
                break;
            case "Kill":
                // 击杀
                handleKillEvent(world, event);
                break;
            case "Pickup":
                handlePickupEvent(world, event);
                break;
            case "BossPhaseChange":
                handleBossPhaseChangeEvent(world, event);
                break;
            case "CamShake":
                handleCamShakeEvent(world, event);
                break;
            case "BloodFog":
                // 飙血
                handleBloodFogEvent(world, event);
                break;
            case "LevelUp":
                handleLevelUpEvent(world, event);
                break;
            case "ComboUpgrade":
                handleComboUpgradeEvent(world, event);
                break;
            case "BerserkMode":
                handleBerserkModeEvent(world, event);
                break;
            case "BombExploded":
                handleBombExplodedEvent(world, event);
                break;
            case "WeaponEffect":
                handleWeaponEffectEvent(world, event);
                break;
            case "ShieldBroken":
                handleShieldBrokenEvent(world, event);
                break;
            case "TimeSlow":
                handleTimeSlowEvent(world, event);
                break;
        }
    }
}

//************************** 各种事件处理 ***************************/

/**
 * 处理命中事件
 * 采用旧版本的"多粒子飞散"爆炸效果
 */
function handleHitEvent(world: World, event: HitEvent): void {
    // 生成爆炸粒子 - 使用新的物理粒子系统
    // FIXME: 受伤效果在 handleBloodFogEvent 里已经有了
    // if (event.victim === world.playerId) {
    //     // 玩家受伤
    //     spawnParticles(world, event.pos.x, event.pos.y, PARTICLE_EFFECTS[ParticleId.PlayerHited])
    // } else {
    //     // 敌人或boss
    //     spawnParticles(world, event.pos.x, event.pos.y, PARTICLE_EFFECTS[ParticleId.EnemyHited])
    // }
}

/**
 * 处理击杀事件
 * 采用旧版本的"多粒子飞散"爆炸效果
 */
function handleKillEvent(world: World, event: KillEvent): void {
    // 生成大型爆炸粒子 - 使用新的物理粒子系统
    // 获取实体
    const entity = getEntity(world, event.victim);
    if (entity.find(PlayerTag.check)) {
        spawnParticles(world, event.pos.x, event.pos.y, PARTICLE_EFFECTS[ParticleId.PlayerDefeated]);
    } else if (entity.find(EnemyTag.check)) {
        spawnParticles(world, event.pos.x, event.pos.y, PARTICLE_EFFECTS[ParticleId.EnemyDefeated]);
    } else if (entity.find(BossTag.check)) {
        spawnParticles(world, event.pos.x, event.pos.y, PARTICLE_EFFECTS[ParticleId.BossDefeated]);
    }
}

/**
 * 处理拾取事件
 */
function handlePickupEvent(world: World, event: PickupEvent): void {
    // 生成拾取特效
    // spawnParticle(world, 'pickup', event.pos.x, event.pos.y);
}

/**
 * 处理 Boss 阶段切换事件
 */
function handleBossPhaseChangeEvent(world: World, event: BossPhaseChangeEvent): void {
    // // 生成 Boss 阶段切换特效
    // spawnParticle(world, 'boss_phase', world.width / 2, world.height / 2);
    // // 触发震屏（500毫秒）
    // triggerShake(world, 10, 500);
}

/**
 * 处理震屏事件
 */
function handleCamShakeEvent(world: World, event: CamShakeEvent): void {
    triggerShake(world, event.intensity, event.duration);
}

/**
 * 处理飙血特效事件
 */
function handleBloodFogEvent(world: World, event: BloodFogEvent): void {
    let bloodKey = ParticleId.BloodLight;
    if (event.level === 2) {
        bloodKey = ParticleId.BloodMedium;
    } else if (event.level === 3) {
        bloodKey = ParticleId.BloodHeavy;
    }
    // console.log(`[EffectPlayer] bloodKey=${bloodKey}`)
    spawnParticles(world, event.pos.x, event.pos.y, PARTICLE_EFFECTS[bloodKey]);
}

/**
 * 处理升级事件
 */
function handleLevelUpEvent(world: World, event: LevelUpEvent): void {
    // // 获取玩家位置
    // const [transform] = getComponents(world, world.playerId, [Transform])
    // if (transform) {
    //     spawnParticle(world, 'levelup', transform.x, transform.y);
    // } else {
    //     spawnParticle(world, 'levelup', world.width / 2, world.height - 100);
    // }
    // // 触发震屏（300毫秒）
    // triggerShake(world, 5, 300);
}

/**
 * 处理武器特效事件
 */
function handleWeaponEffectEvent(world: World, event: WeaponEffectEvent): void {
    // let effectKey: string;
    // switch (event.effectType) {
    //     case "explosion":
    //         effectKey = "plasma_explosion";
    //         break;
    //     case "chain":
    //         effectKey = "tesla_chain";
    //         break;
    //     case "burn":
    //         effectKey = "magma_burn";
    //         break;
    //     case "bounce":
    //         effectKey = "shuriken_bounce";
    //         break;
    //     default:
    //         return;
    // }
    // spawnParticle(world, effectKey, event.pos.x, event.pos.y);
}

/**
 * 处理连击升级事件
 */
function handleComboUpgradeEvent(world: World, event: ComboUpgradeEvent): void {
    // // 生成连击升级特效
    // spawnParticle(world, 'combo_upgrade', event.pos.x, event.pos.y);
    // // 添加冲击波
    // spawnShockwave(world, event.pos.x, event.pos.y, event.color, 200, 8);
}

/**
 * 处理狂暴模式事件
 */
function handleBerserkModeEvent(world: World, event: BerserkModeEvent): void {
    // // 生成狂暴模式特效
    // spawnParticle(world, 'berserk', event.pos.x, event.pos.y);
    // // 触发强烈震屏（800毫秒）
    // triggerShake(world, 15, 800);
}

/**
 * 处理炸弹爆炸事件
 */
function handleBombExplodedEvent(world: World, event: BombExplodedEvent): void {
    spawnShockwave(world, world.width / 2, world.height / 2, "#fff", 500, 30);
}

/**
 * 处理护盾破碎事件
 */
function handleShieldBrokenEvent(world: World, event: ShieldBrokenEvent): void {
    // 护盾这个圈, 从owner位置来开始
    const [transform] = getComponents(world, event.owner, [Transform]);
    if (transform) {
        spawnShockwave(world, transform.x, transform.y, "#00ffff", 60, 3);
    }
}

/**
 * 处理时间减速事件
 */
function handleTimeSlowEvent(world: World, event: TimeSlowEvent): void {
    if (event.action === "start") {
        spawnEntity(world, [
            new BulletTimeLine({
                maxLines: 20,
            }),
        ]);
    } else if (event.action === "end") {
        // 移除 包含 BulletTimeLine 的实体
        for (const [id, []] of view(world, [BulletTimeLine])) {
            removeEntity(world, id);
        }
    }
}

//********************** 特效更新函数 ********************** */
/**
 * 更新所有特效
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
function updateEffects(world: World, dt: number): void {
    // 更新包含 BulletTimeLine 的实体
    for (const [id, [bt]] of view(world, [BulletTimeLine])) {
        // 检查是否要生成新的光线
        spawnBulletTimeLines(world, bt);
        // 更新每条光线的位置
        updateBulletTimeLines(world, dt, bt);
    }

    // 更新粒子动画
    for (const [id, [particle]] of view(world, [Particle])) {
        updateParticles(world, dt, particle, id);
    }

    // 更新冲击波动画
    for (const [id, [sw]] of view(world, [Shockwave])) {
        updateShockwaves(world, dt, sw, id);
    }

    // 更新流星位置
    for (const [id, [meteor]] of view(world, [Meteor])) {
        // 生成流星
        spawnMeteor(world, dt, meteor);
        // 更新位置
        updateMeteors(world, dt, meteor);
    }
}
/**
 * 更新粒子位置和生命周期
 */
function updateParticles(world: World, dt: number, pt: Particle, id: number): void {
    const timeScale = dt / (1000 / 60); // 60 fps

    for (let i = pt.particles.length - 1; i >= 0; i--) {
        const p = pt.particles[i];
        // 更新位置
        p.x += p.vx * timeScale;
        p.y += p.vy * timeScale;

        // 更新生命周期
        p.life -= dt;
        // 清理过期粒子
        if (p.life <= 0) {
            pt.particles.splice(i, 1);
        }
    }
    // 如果所有粒子都不存在了, 清理实体
    if (pt.particles.length === 0) {
        removeEntity(world, id);
    }
}
/**
 * 更新冲击波位置
 */
function updateShockwaves(world: World, dt: number, sw: Shockwave, id: number): void {
    const timeScale = dt / (1000 / 60); // 60 fps

    for (let i = sw.circles.length - 1; i >= 0; i--) {
        const circle = sw.circles[i];
        // 更新半径（缓动接近最大半径）
        circle.radius += (circle.maxRadius - circle.radius) * 0.1 * timeScale;

        // 更新生命周期
        circle.life -= 0.02 * timeScale;

        // 清理过期圆环
        if (circle.life <= 0) {
            sw.circles.splice(i, 1);
        }
    }
    // 如果所有圆环都不存在了, 清理实体
    if (sw.circles.length === 0) {
        removeEntity(world, id);
    }
}

/**
 * 更新线条位置
 */
function updateBulletTimeLines(world: World, dt: number, bt: BulletTimeLine): void {
    const timeScale = dt / (1000 / 60); // 60 fps

    for (let i = bt.lines.length - 1; i >= 0; i--) {
        const line = bt.lines[i];
        // 更新位置
        line.y += line.speed * timeScale;
        // 清理超出屏幕的线条
        if (line.y > world.height + 100) {
            bt.lines.splice(i, 1);
        }
    }
}

/**
 * 更新流星位置
 */
function updateMeteors(world: World, dt: number, meteor: Meteor): void {
    const timeScale = dt / (1000 / 60); // 60 fps

    for (let i = meteor.meteors.length - 1; i >= 0; i--) {
        const m = meteor.meteors[i];

        // 更新位置
        m.x += m.vx * timeScale;
        m.y += m.vy * timeScale;

        // 清理超出屏幕的流星
        if (m.y > world.height + 100 || m.x < -100 || m.x > world.width + 100) {
            meteor.meteors.splice(i, 1);
        }
    }
}

//********************** 一些生成特效的函数 ********************** */

/**
 * 生成粒子特效
 * @param world 世界对象
 * @param x X 坐标
 * @param y Y 坐标
 * @param config 粒子特效配置
 */
function spawnParticles(world: World, x: number, y: number, config: ParticleEffectConfig): void {
    const particle = new Particle({
        position: { x, y },
    });
    for (let i = 0; i < config.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speedMin = config.speedMin;
        const speedMax = config.speedMax;
        const speed = speedMin + Math.random() * (speedMax - speedMin);
        const size = config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin);
        particle.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: config.life,
            maxLife: config.life,
            color: config.color,
            size: size,
        });
    }
    spawnEntity(world, [particle, new Lifetime({ timer: config.life })]);
}

/**
 * 生成冲击波特效
 * @param world 世界对象
 * @param x X 坐标
 * @param y Y 坐标
 * @param color 颜色
 * @param maxRadius 最大半径
 * @param width 线宽
 */
function spawnShockwave(
    world: World,
    x: number,
    y: number,
    color: string = "#ffffff",
    maxRadius: number = 150,
    width: number = 5
): void {
    const shockwave = new Shockwave({
        position: { x, y },
    });
    shockwave.circles.push({
        x,
        y,
        radius: 10,
        maxRadius,
        life: 1.0,
        color,
        width,
    });
    spawnEntity(world, [shockwave]);
}
/**
 * 生成子弹时间的光线
 *
 */
function spawnBulletTimeLines(world: World, bt: BulletTimeLine): void {
    // 补充到最大数量
    while (bt.lines.length < bt.maxLines) {
        bt.lines.push({
            x: Math.random() * world.width,
            y: -50,
            length: Math.random() * 100 + 50,
            speed: Math.random() * 5 + 2,
            alpha: Math.random() * 0.5 + 0.2,
        });
    }
}

/**
 * 生成流星
 * @param world 世界对象
 * @param width 画布宽度
 * @param height 画布高度
 * @param dt 距离上次调用的时间（毫秒）
 * @param timer 累积计时器（引用传递）
 */
function spawnMeteor(world: World, dt: number, meteor: Meteor): void {
    // 累加计时器
    meteor.timer += dt;

    // 每 200ms 检查一次
    if (meteor.timer < meteor.spawnInterval) {
        return;
    }
    meteor.timer = 0;

    // 10% 概率生成
    if (Math.random() >= meteor.spawnChance) {
        return;
    }

    // 生成流星
    meteor.meteors.push({
        x: Math.random() * world.width,
        y: -100,
        length: Math.random() * 50 + 20, // 20-70
        vx: (Math.random() - 0.5) * 5, // -2.5 到 2.5
        vy: Math.random() * 10 + 10, // 10-20
    });
}

