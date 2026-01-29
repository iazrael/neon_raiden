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
 * - 按层级排序（背景 < 敌人 < 玩家 < UI < 特效）
 *
 * 系统类型：表现层
 * 执行顺序：P7 - 在 CameraSystem 之后
 */

import { World } from '../types';
import { Transform, Sprite, Particle, PlayerTag, EnemyTag, Shield, InvulnerableState, Health, BossTag, TimeSlow } from '../components';
import { SpriteManager } from '../SpriteManager';
import { view } from '../world';

/**
 * 渲染层级
 */
enum RenderLayer {
    BACKGROUND = 0,
    ENEMY = 1,
    PLAYER = 2,
    PICKUP = 3,
    PARTICLE = 4,
    UI = 5
}

/**
 * 渲染项
 */
interface RenderItem {
    transform: Transform;
    sprite: Sprite;
    layer: RenderLayer;
    particle?: Particle;
}

/**
 * 相机状态
 */
export interface CameraState {
    x: number;
    y: number;
    shakeX: number;
    shakeY: number;
    zoom: number;
}

/**
 * 时间减速线条状态
 */
interface TimeSlowLine {
    x: number;
    y: number;
    length: number;
    speed: number;
    alpha: number;
}

// 全局状态存储
let timeSlowLines: TimeSlowLine[] = [];

/**
 * 全局相机状态
 */
export const camera: CameraState = {
    x: 0,
    y: 0,
    shakeX: 0,
    shakeY: 0,
    zoom: 1.0
};

/**
 * 渲染上下文接口
 * 实际渲染时由外部提供 Canvas 2D 或 WebGL 上下文
 */
export interface RenderContext {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
}

/**
 * 当前渲染上下文（由外部设置）
 */
let currentContext: RenderContext | null = null;

/**
 * 调试模式开关
 */
export const RenderDebug = {
    enabled: false,
    logEntities: false,
    logTextures: false,
    logPlayer: false
};

/**
 * 设置渲染调试模式
 */
export function setRenderDebug(options: {
    enabled?: boolean;
    logEntities?: boolean;
    logTextures?: boolean;
    logPlayer?: boolean;
}): void {
    if (options.enabled !== undefined) RenderDebug.enabled = options.enabled;
    if (options.logEntities !== undefined) RenderDebug.logEntities = options.logEntities;
    if (options.logTextures !== undefined) RenderDebug.logTextures = options.logTextures;
    if (options.logPlayer !== undefined) RenderDebug.logPlayer = options.logPlayer;
    console.log('[RenderSystem] Debug mode:', RenderDebug);
}

/**
 * 设置渲染上下文
 */
export function setRenderContext(ctx: RenderContext): void {
    currentContext = ctx;
}

/**
 * 获取渲染上下文
 */
export function getRenderContext(): RenderContext | null {
    return currentContext;
}

/**
 * 渲染系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 * @param renderCtx 可选的渲染上下文
 */
export function RenderSystem(world: World, dt: number, renderCtx?: RenderContext): void {
    const ctx = renderCtx || currentContext;
    if (!ctx) {
        // 没有渲染上下文，跳过渲染
        return;
    }

    const { canvas, context, width, height } = ctx;

    // ========== 调试日志 ==========
    if (RenderDebug.enabled) {
        console.log('[RenderSystem] === Frame Start ===');
        console.log('[RenderSystem] Canvas size:', width, 'x', height);
        console.log('[RenderSystem] World entities:', world.entities.size);
        console.log('[RenderSystem] Player ID:', world.playerId);
    }
    // ===========================

    // ========== 查询时间减速状态 ==========
    const timeSlowEntities = [...view(world, [TimeSlow])];
    const timeSlowActive = timeSlowEntities.length > 0;
    // ======================================

    // 绘制背景
    drawBackground(context, width, height, timeSlowActive);

    // 计算相机偏移（只有震屏，相机固定在 0,0）
    const camX = camera.shakeX;
    const camY = camera.shakeY;

    // 收集玩家信息（用于护盾、无敌状态渲染）
    const playerInfo = collectPlayerInfo(world);

    // 收集 Boss 信息（用于血条渲染）
    const bossInfo = collectBossInfo(world);

    // ========== 调试：玩家信息 ==========
    if (RenderDebug.enabled && RenderDebug.logPlayer) {
        console.log('[RenderSystem] Player info:', playerInfo ? {
            hasTransform: !!playerInfo.transform,
            position: { x: playerInfo.transform.x, y: playerInfo.transform.y },
            hasShield: !!playerInfo.shield,
            shieldValue: playerInfo.shield?.value,
            hasInvulnerable: !!playerInfo.invulnerable,
            invulnerableDuration: playerInfo.invulnerable?.duration
        } : 'NO PLAYER');
    }
    // ==================================

    // 收集所有需要渲染的实体
    const renderItems: RenderItem[] = [];

    for (const [, comps] of world.entities) {
        const transform = comps.find(Transform.check) as Transform | undefined;
        const sprite = comps.find(Sprite.check) as Sprite | undefined;

        if (!transform || !sprite) continue;

        // 确定渲染层级
        const layer = determineLayer(comps);
        const particle = comps.find(Particle.check) as Particle | undefined;

        renderItems.push({
            transform,
            sprite,
            layer,
            particle
        });
    }

    // ========== 调试：渲染项统计 ==========
    if (RenderDebug.enabled && RenderDebug.logEntities) {
        console.log('[RenderSystem] Render items:', renderItems.length);
        const byLayer: Record<number, number> = {};
        for (const item of renderItems) {
            byLayer[item.layer] = (byLayer[item.layer] || 0) + 1;
        }
        console.log('[RenderSystem] By layer:', byLayer);
    }
    // ====================================

    // 按层级排序
    renderItems.sort((a, b) => a.layer - b.layer);

    // 绘制所有实体
    for (const item of renderItems) {
        if (RenderDebug.enabled && RenderDebug.logTextures) {
            console.log('[RenderSystem] Drawing:', {
                position: { x: item.transform.x, y: item.transform.y },
                spriteKey: item.sprite.spriteKey,
                color: item.sprite.color
            });
        }
        drawSprite(context, item, camX, camY, camera.zoom);
    }

    // 绘制玩家护盾
    if (playerInfo) {
        drawPlayerEffects(context, playerInfo, camX, camY);
    }

    // 绘制 Boss 血条
    if (bossInfo) {
        drawBossHealthBar(context, bossInfo, width, height);
    }
}

/**
 * 确定实体的渲染层级
 */
function determineLayer(comps: any[]): RenderLayer {
    if (comps.some(Particle.check)) {
        return RenderLayer.PARTICLE;
    }
    if (comps.some(PlayerTag.check)) {
        return RenderLayer.PLAYER;
    }
    if (comps.some(EnemyTag.check)) {
        return RenderLayer.ENEMY;
    }
    return RenderLayer.PICKUP;
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

    // 计算屏幕坐标
    const screenX = transform.x - camX;
    const screenY = transform.y - camY;

    // 从 SpriteManager 获取配置
    const config = sprite.config;
    const image = sprite.image;

    // 计算绘制参数
    const width = config.width * sprite.scale * zoom;
    const height = config.height * sprite.scale * zoom;
    const pivotX = width * (config.pivotX ?? 0.5);
    const pivotY = height * (config.pivotY ?? 0.5);

    // 保存上下文状态
    ctx.save();

    // 移动到绘制位置
    ctx.translate(screenX, screenY);

    // 应用旋转
    const rotation = transform.rot + sprite.rotate90 * 90;
    ctx.rotate((rotation * Math.PI) / 180);

    // 绘制图片
    if (image && image.complete) {
        ctx.drawImage(image, -pivotX, -pivotY, width, height);
    } else {
        // 图片未加载，使用颜色占位
        ctx.fillStyle = sprite.color || '#fff';
        ctx.fillRect(-pivotX, -pivotY, width, height);
    }

    // 受伤闪烁效果
    if (sprite.hitFlashUntil && Date.now() < sprite.hitFlashUntil) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(-pivotX, -pivotY, width, height);
    }

    // 恢复上下文状态
    ctx.restore();
}

/**
 * 绘制背景星空效果
 */
function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number, timeSlowActive: boolean = false): void {
    // 黑色背景
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    const t = Date.now() / 1000;
    const timeScale = timeSlowActive ? 0.5 : 1.0;

    // 远处的星星（慢速）- 应用 timeScale
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 50; i++) {
        const sx = (i * 137) % width;
        const sy = (i * 97 + t * 20 * timeScale) % height;
        ctx.fillRect(sx, sy, 1, 1);
    }

    // 近处的星星（快速）- 应用 timeScale
    ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
    for (let i = 0; i < 30; i++) {
        const speed = (i % 3) + 2;
        const sx = (i * 57) % width;
        const sy = (i * 31 + t * 60 * speed * timeScale) % height;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // 时间减速视觉效果
    if (timeSlowActive) {
        drawTimeSlowEffect(ctx, width, height);
    } else {
        timeSlowLines = []; // 清空线条数组
    }
}

/**
 * 绘制时间减速特效
 * 复用旧版 RenderSystem 的 falling lines 效果
 */
function drawTimeSlowEffect(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
): void {
    ctx.save();

    // 蓝色色调覆盖
    ctx.fillStyle = 'rgba(200, 230, 255, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // 生成新的线条(最多 20 条)
    if (timeSlowLines.length < 20) {
        timeSlowLines.push({
            x: Math.random() * width,
            y: -50,
            length: Math.random() * 100 + 50,
            speed: Math.random() * 5 + 2,
            alpha: Math.random() * 0.5 + 0.2
        });
    }

    // 绘制线条
    timeSlowLines.forEach(line => {
        line.y += line.speed;
        ctx.strokeStyle = `rgba(173, 216, 230, ${line.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x, line.y + line.length);
        ctx.stroke();
    });

    // 清理超出屏幕的线条
    timeSlowLines = timeSlowLines.filter(line => line.y < height + 100);

    ctx.restore();
}

/**
 * 收集玩家信息
 */
interface PlayerInfo {
    transform: Transform;
    shield?: Shield;
    invulnerable?: InvulnerableState;
    health?: Health;
}

function collectPlayerInfo(world: World): PlayerInfo | null {
    const playerComps = world.entities.get(world.playerId);
    if (!playerComps) return null;

    const transform = playerComps.find(Transform.check);
    const shield = playerComps.find(Shield.check);
    const invulnerable = playerComps.find(InvulnerableState.check);
    const health = playerComps.find(Health.check);

    if (!transform) return null;

    return { transform, shield, invulnerable, health };
}

/**
 * 收集 Boss 信息
 */
interface BossInfo {
    transform: Transform;
    health: Health;
    bossTag: BossTag;
}

function collectBossInfo(world: World): BossInfo | null {
    for (const [id, [bossTag, transform, health]] of view(world, [BossTag, Transform, Health])) {
        return { transform, health, bossTag };
    }
    return null;
}

/**
 * 绘制玩家特效（护盾、无敌状态）
 */
function drawPlayerEffects(
    ctx: CanvasRenderingContext2D,
    playerInfo: PlayerInfo,
    camX: number,
    camY: number
): void {
    const { transform, shield, invulnerable, health } = playerInfo;
    const x = transform.x - camX;
    const y = transform.y - camY;

    // 绘制护盾
    if (shield && shield.value > 0) {
        ctx.save();
        ctx.translate(x, y);

        // 护盾最大值基于生命值的一半
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

    // 绘制无敌状态（金色光环）
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

    // 血条位置在屏幕顶部中央
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
 * 更新相机震屏
 */
export function updateCameraShake(dt: number): void {
    // 震屏衰减
    if (Math.abs(camera.shakeX) > 0.1 || Math.abs(camera.shakeY) > 0.1) {
        const decay = 0.9;
        camera.shakeX *= decay;
        camera.shakeY *= decay;

        // 阈值以下归零
        if (Math.abs(camera.shakeX) < 0.1) camera.shakeX = 0;
        if (Math.abs(camera.shakeY) < 0.1) camera.shakeY = 0;
    }
}

/**
 * 设置相机位置
 */
export function setCameraPosition(x: number, y: number): void {
    camera.x = x;
    camera.y = y;
}

/**
 * 触发相机震屏
 */
export function triggerCameraShake(intensity: number, duration: number): void {
    camera.shakeX = (Math.random() - 0.5) * 2 * intensity;
    camera.shakeY = (Math.random() - 0.5) * 2 * intensity;
}

/**
 * 重置相机状态
 */
export function resetCamera(): void {
    camera.x = 0;
    camera.y = 0;
    camera.shakeX = 0;
    camera.shakeY = 0;
    camera.zoom = 1.0;
}
