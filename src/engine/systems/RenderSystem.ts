/**
 * 渲染系统 (RenderSystem)
 *
 * 职责：
 * - 遍历所有有 Sprite 组件的实体并绘制
 * - 处理粒子渲染
 * - 绘制背景星空效果
 * - 绘制护盾、无敌状态等特效
 * - 绘制 Boss 血条
 * - 根据 Camera 偏移调整绘制位置（仅震屏，相机固定）
 * - 按固定顺序渲染（背景 < 精灵 < 玩家特效 < 粒子 < 冲击波 < UI）
 *
 * 系统类型：表现层
 * 执行顺序：P7 - 在 CameraSystem 之后
 */

import { Component } from '../types/base';
import { World, view } from '../world';
import { Transform, Sprite, Particle, PlayerTag, EnemyTag, Shield, InvulnerableState, Health, BossTag, TimeSlow, Shockwave, Lifetime, VisualEffect, VisualLine } from '../components';
import { DebugConfig } from '../config/DebugConfig';

/**
 * 渲染上下文
 */
export interface RenderContext {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
}

/**
 * 渲染层级
 */
enum RenderLayer {
    ENEMY = 0,
    PLAYER = 1,
    PICKUP = 2,
}

/**
 * 渲染项类型
 */
type RenderItemType = 'sprite' | 'particle' | 'shockwave';

/**
 * 渲染项
 */
interface RenderItem {
    type: RenderItemType;
    layer: number;
    transform: Transform;
    sprite?: Sprite;
    particle?: Particle;
    shockwave?: Shockwave;
    lifetime?: Lifetime;
}

/**
 * 玩家特效数据
 */
interface PlayerEffectData {
    transform: Transform;
    shield?: Shield;
    invulnerable?: InvulnerableState;
    health?: Health;
}

/**
 * Boss 信息
 */
interface BossInfo {
    transform: Transform;
    health: Health;
}

/**
 * 收集结果
 */
interface RenderQueue {
    sprites: RenderItem[];
    particles: RenderItem[];
    shockwaves: RenderItem[];
    playerEffect: PlayerEffectData | null;
    bossInfo: BossInfo | null;
    timeSlowActive: boolean;
}

/**
 * 确定实体的渲染层级
 */
function determineLayer(comps: Component[]): number {
    if (comps.some(PlayerTag.check)) {
        return RenderLayer.PLAYER;
    }
    if (comps.some(EnemyTag.check)) {
        return RenderLayer.ENEMY;
    }
    return RenderLayer.PICKUP;
}

/**
 * 单次遍历收集所有渲染项
 */
function collectRenderItems(world: World): RenderQueue {
    const queue: RenderQueue = {
        sprites: [],
        particles: [],
        shockwaves: [],
        playerEffect: null,
        bossInfo: null,
        timeSlowActive: false,
    };

    for (const [id, comps] of world.entities) {
        const transform = comps.find(Transform.check) as Transform | undefined;
        if (!transform) continue;

        // 精灵
        const sprite = comps.find(Sprite.check) as Sprite | undefined;
        if (sprite) {
            queue.sprites.push({
                type: 'sprite',
                layer: determineLayer(comps),
                transform,
                sprite,
            });
        }

        // 粒子
        const particle = comps.find(Particle.check) as Particle | undefined;
        if (particle) {
            queue.particles.push({
                type: 'particle',
                layer: 0,
                transform,
                particle,
                lifetime: comps.find(Lifetime.check) as Lifetime | undefined,
            });
        }

        // 冲击波
        const shockwave = comps.find(Shockwave.check) as Shockwave | undefined;
        if (shockwave) {
            queue.shockwaves.push({
                type: 'shockwave',
                layer: 0,
                transform,
                shockwave,
            });
        }

        // 玩家特效
        if (id === world.playerId) {
            const shield = comps.find(Shield.check) as Shield | undefined;
            const invulnerable = comps.find(InvulnerableState.check) as InvulnerableState | undefined;
            const health = comps.find(Health.check) as Health | undefined;
            if (shield || invulnerable) {
                queue.playerEffect = { transform, shield, invulnerable, health };
            }
        }

        // Boss 信息
        const bossTag = comps.find(BossTag.check) as BossTag | undefined;
        const health = comps.find(Health.check) as Health | undefined;
        if (bossTag && health) {
            queue.bossInfo = { transform, health };
        }

        // 时间减速状态
        if (comps.some(TimeSlow.check)) {
            queue.timeSlowActive = true;
        }
    }

    return queue;
}

/**
 * 绘制时间减速特效
 */
function drawTimeSlowEffect(ctx: CanvasRenderingContext2D, world: World, width: number, height: number): void {
    // 从 VisualEffect 组件获取线条
    let lines: VisualLine[] = [];
    for (const [_id, [effect]] of view(world, [VisualEffect])) {
        lines = effect.lines;
        break;
    }

    ctx.save();

    // 蓝色色调覆盖
    ctx.fillStyle = 'rgba(200, 230, 255, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // 绘制线条
    for (const line of lines) {
        ctx.strokeStyle = `rgba(173, 216, 230, ${line.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x, line.y + line.length);
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * 绘制背景星空效果
 */
function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number, timeSlowActive: boolean): void {
    // 黑色背景
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    const t = Date.now() / 1000;
    const timeScale = timeSlowActive ? 0.5 : 1.0;

    // 远处的星星（慢速）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 50; i++) {
        const sx = (i * 137) % width;
        const sy = (i * 97 + t * 20 * timeScale) % height;
        ctx.fillRect(sx, sy, 1, 1);
    }

    // 近处的星星（快速）
    ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
    for (let i = 0; i < 30; i++) {
        const speed = (i % 3) + 2;
        const sx = (i * 57) % width;
        const sy = (i * 31 + t * 60 * speed * timeScale) % height;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * 绘制单个精灵
 */
function drawSprite(
    ctx: CanvasRenderingContext2D,
    item: RenderItem,
    camX: number,
    camY: number,
    zoom: number
): void {
    const { transform, sprite } = item;
    if (!sprite) return;

    // 计算屏幕坐标
    const screenX = transform.x - camX;
    const screenY = transform.y - camY;

    // 从 Sprite 获取配置
    const config = sprite.config;
    const image = sprite.image;

    // 计算绘制参数
    const itemWidth = config.width * sprite.scale * zoom;
    const itemHeight = config.height * sprite.scale * zoom;
    const pivotX = itemWidth * (config.pivotX ?? 0.5);
    const pivotY = itemHeight * (config.pivotY ?? 0.5);

    ctx.save();

    // 移动到绘制位置
    ctx.translate(screenX, screenY);

    // 应用旋转
    const rotation = transform.rot + sprite.rotate90 * 90;
    ctx.rotate((rotation * Math.PI) / 180);

    // 绘制图片
    if (image && image.complete) {
        ctx.drawImage(image, -pivotX, -pivotY, itemWidth, itemHeight);
    } else {
        // 图片未加载，使用颜色占位
        ctx.fillStyle = sprite.color || '#fff';
        ctx.fillRect(-pivotX, -pivotY, itemWidth, itemHeight);
    }

    // 受伤闪烁效果
    if (sprite.hitFlashUntil && Date.now() < sprite.hitFlashUntil) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(-pivotX, -pivotY, itemWidth, itemHeight);
    }

    ctx.restore();
}

/**
 * 绘制粒子
 */
function drawParticle(
    ctx: CanvasRenderingContext2D,
    item: RenderItem,
    camX: number,
    camY: number
): void {
    const { transform, particle, lifetime } = item;
    if (!particle) return;

    // 计算透明度 - 基于 Lifetime 衰减
    let alpha = 1;
    if (lifetime) {
        const maxLife = particle.maxLife > 0
            ? particle.maxLife
            : particle.maxFrame * 16.66;
        alpha = Math.max(0, Math.min(1, lifetime.timer / maxLife));
    }

    const size = particle.scale;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(transform.x - camX, transform.y - camY, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

/**
 * 绘制冲击波
 */
function drawShockwave(
    ctx: CanvasRenderingContext2D,
    item: RenderItem,
    camX: number,
    camY: number,
    dt: number
): void {
    const { transform, shockwave } = item;
    if (!shockwave) return;

    // 更新冲击波动画
    const timeScale = dt / 16.66;
    shockwave.radius += (shockwave.maxRadius - shockwave.radius) * 0.1 * timeScale;
    shockwave.life -= 0.02 * timeScale;

    ctx.save();
    ctx.globalAlpha = Math.max(0, shockwave.life);
    ctx.shadowColor = shockwave.color;
    ctx.shadowBlur = 15;
    ctx.lineWidth = shockwave.width;
    ctx.strokeStyle = shockwave.color;
    ctx.beginPath();
    ctx.arc(transform.x - camX, transform.y - camY, shockwave.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

/**
 * 绘制玩家特效（护盾、无敌状态）
 */
function drawPlayerEffect(
    ctx: CanvasRenderingContext2D,
    data: PlayerEffectData,
    camX: number,
    camY: number
): void {
    const { transform, shield, invulnerable, health } = data;
    const x = transform.x - camX;
    const y = transform.y - camY;

    // 绘制护盾
    if (shield && shield.value > 0) {
        ctx.save();
        ctx.translate(x, y);

        const maxShield = health ? health.max * 0.5 : 50;
        const alpha = Math.min(1, shield.value / maxShield);

        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    // 绘制无敌状态
    if (invulnerable && invulnerable.duration > 0) {
        ctx.save();
        ctx.translate(x, y);

        const t = Date.now() / 100;
        const alpha = 0.6 + Math.sin(t) * 0.4;

        ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.stroke();

        // 粒子效果
        for (let i = 0; i < 5; i++) {
            const angle = (t + i * Math.PI * 2 / 5) % (Math.PI * 2);
            const radius = 45 + Math.sin(t * 2 + i) * 5;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.arc(px, py, 3 + Math.sin(t * 3 + i) * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.7})`;
            ctx.fill();
        }

        ctx.restore();
    }
}

/**
 * 绘制 Boss 血条
 */
function drawBossHealthBar(
    ctx: CanvasRenderingContext2D,
    bossInfo: BossInfo,
    screenWidth: number,
    screenHeight: number
): void {
    const { health } = bossInfo;
    const hpPercent = health.hp / health.max;

    const barWidth = Math.min(400, screenWidth * 0.8);
    const barHeight = 12;
    const barX = (screenWidth - barWidth) / 2;
    const barY = 20;

    // 背景条
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // 当前血量
    let barColor: string;
    if (hpPercent > 0.6) {
        barColor = '#00ff00';
    } else if (hpPercent > 0.3) {
        barColor = '#ffff00';
    } else {
        barColor = '#ff0000';
    }

    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
}

/**
 * 渲染系统主函数
 */
export function RenderSystem(
    world: World,
    renderCtx: RenderContext,
    dt: number
): void {
    const { canvas, context } = renderCtx;
    const { camera } = world.renderState;

    // 调试日志
    if (DebugConfig.render.enabled && DebugConfig.render.logEntities) {
        console.log('[RenderSystem] Entities:', world.entities.size);
    }

    // 1. 单次收集所有渲染项
    const queue = collectRenderItems(world);

    // 2. 绘制背景
    drawBackground(context, canvas.width, canvas.height, queue.timeSlowActive);

    // 绘制时间减速特效
    if (queue.timeSlowActive) {
        drawTimeSlowEffect(context, world, canvas.width, canvas.height);
    }

    // 计算相机偏移
    const camX = camera.shakeX;
    const camY = camera.shakeY;

    // 4. 绘制精灵（按 layer 排序）
    queue.sprites.sort((a, b) => a.layer - b.layer);
    for (const item of queue.sprites) {
        drawSprite(context, item, camX, camY, camera.zoom);
    }

    // 5. 绘制玩家特效
    if (queue.playerEffect) {
        drawPlayerEffect(context, queue.playerEffect, camX, camY);
    }

    // 6. 绘制粒子
    context.globalCompositeOperation = 'lighter';
    for (const item of queue.particles) {
        drawParticle(context, item, camX, camY);
    }
    context.globalCompositeOperation = 'source-over';

    // 7. 绘制冲击波
    for (const item of queue.shockwaves) {
        drawShockwave(context, item, camX, camY, dt);
    }

    // 8. 绘制 Boss 血条
    if (queue.bossInfo) {
        drawBossHealthBar(context, queue.bossInfo, canvas.width, canvas.height);
    }
}
