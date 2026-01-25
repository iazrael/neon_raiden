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
import { Transform, Sprite, Particle, PlayerTag, EnemyTag, Bullet, Shield, InvulnerableState, Health, BossTag } from '../components';
import { SpriteRenderer } from '../SpriteRenderer';

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
 * @param dt 时间增量（秒）
 * @param renderCtx 可选的渲染上下文
 */
export function RenderSystem(world: World, dt: number, renderCtx?: RenderContext): void {
    const ctx = renderCtx || currentContext;
    if (!ctx) {
        // 没有渲染上下文，跳过渲染
        return;
    }

    const { canvas, context, width, height } = ctx;

    // 绘制背景
    drawBackground(context, width, height);

    // 计算相机偏移（只有震屏，相机固定在 0,0）
    const camX = camera.shakeX;
    const camY = camera.shakeY;

    // 收集玩家信息（用于护盾、无敌状态渲染）
    const playerInfo = collectPlayerInfo(world);

    // 收集 Boss 信息（用于血条渲染）
    const bossInfo = collectBossInfo(world);

    // 收集所有需要渲染的实体
    const renderItems: RenderItem[] = [];

    for (const [id, comps] of world.entities) {
        const transform = comps.find(c => c instanceof Transform) as Transform | undefined;
        const sprite = comps.find(c => c instanceof Sprite) as Sprite | undefined;

        if (!transform || !sprite) continue;

        // 确定渲染层级
        const layer = determineLayer(comps);
        const particle = comps.find(c => c instanceof Particle) as Particle | undefined;

        renderItems.push({
            transform,
            sprite,
            layer,
            particle
        });
    }

    // 按层级排序
    renderItems.sort((a, b) => a.layer - b.layer);

    // 绘制所有实体
    for (const item of renderItems) {
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
    if (comps.some(c => c instanceof Particle)) {
        return RenderLayer.PARTICLE;
    }
    if (comps.some(c => c instanceof PlayerTag)) {
        return RenderLayer.PLAYER;
    }
    if (comps.some(c => c instanceof EnemyTag)) {
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

    // 计算绘制参数
    const width = sprite.srcW * sprite.scale * zoom;
    const height = sprite.srcH * sprite.scale * zoom;
    const pivotX = width * sprite.pivotX;
    const pivotY = height * sprite.pivotY;

    // 保存上下文状态
    ctx.save();

    // 移动到绘制位置
    ctx.translate(screenX, screenY);

    // 应用旋转
    const rotation = transform.rot + sprite.rotate90 * 90;
    ctx.rotate((rotation * Math.PI) / 180);

    // 绘制
    if (sprite.texture) {
        // 使用纹理（SVG 图像）
        const textureImage = getTextureImage(sprite.texture);
        if (textureImage && textureImage.complete) {
            ctx.drawImage(
                textureImage,
                -pivotX,
                -pivotY,
                width,
                height
            );
        } else {
            // 图像未加载，使用颜色占位
            ctx.fillStyle = sprite.color || '#fff';
            ctx.fillRect(-pivotX, -pivotY, width, height);
        }
    } else if (sprite.spriteKey) {
        // 使用 spriteKey 加载图像
        const spriteImage = loadSpriteByKey(sprite.spriteKey, sprite.srcW, sprite.srcH);
        if (spriteImage && spriteImage.complete) {
            ctx.drawImage(
                spriteImage,
                -pivotX,
                -pivotY,
                width,
                height
            );
        } else {
            // 图像未加载，使用颜色占位
            ctx.fillStyle = sprite.color || '#fff';
            ctx.fillRect(-pivotX, -pivotY, width, height);
        }
    } else {
        // 使用颜色绘制矩形
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
 * 根据 spriteKey 加载图像
 */
function loadSpriteByKey(spriteKey: string, width: number, height: number): HTMLImageElement | null {
    if (spriteKey.startsWith('player')) {
        return SpriteRenderer.getImage('player') || null;
    } else if (spriteKey.startsWith('bullet_')) {
        return SpriteRenderer.getImage(spriteKey) || null;
    } else if (spriteKey.startsWith('enemy_')) {
        return SpriteRenderer.getImage(spriteKey) || null;
    } else if (spriteKey.startsWith('boss_')) {
        return SpriteRenderer.getImage(spriteKey) || null;
    }
    return null;
}

/**
 * 获取纹理图像
 * 从完整路径中提取资源 key，然后从 SpriteRenderer 获取图像
 */
function getTextureImage(texture: string): HTMLImageElement | null {
    // 从路径中提取资源 key
    // 例如: "/assets/fighters/player.svg" -> "player"
    //        "/assets/bullets/bullet_laser.svg" -> "bullet_laser"
    //        "/assets/bosses/boss_guardian.svg" -> "boss_guardian"
    const filename = texture.split('/').pop() || texture;
    const key = filename.replace('.svg', '').replace('.png', '');

    // 尝试通过 key 获取图像
    let image = SpriteRenderer.getImage(key);

    // 如果没找到，尝试其他 key 格式
    if (!image) {
        // 尝试带 bullet_ 前缀
        image = SpriteRenderer.getImage(`bullet_${key}`);
    }
    if (!image) {
        // 尝试带 enemy_ 前缀
        image = SpriteRenderer.getImage(`enemy_${key}`);
    }
    if (!image) {
        // 尝试带 boss_ 前缀
        image = SpriteRenderer.getImage(`boss_${key}`);
    }

    return image || null;
}

/**
 * 绘制背景星空效果
 */
function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // 黑色背景
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    const t = Date.now() / 1000;

    // 远处的星星（慢速）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 50; i++) {
        const sx = (i * 137) % width;
        const sy = (i * 97 + t * 20) % height;
        ctx.fillRect(sx, sy, 1, 1);
    }

    // 近处的星星（快速，更大）
    ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
    for (let i = 0; i < 30; i++) {
        const speed = (i % 3) + 2;
        const sx = (i * 57) % width;
        const sy = (i * 31 + t * 60 * speed) % height;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
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

    const transform = playerComps.find(c => c instanceof Transform) as Transform | undefined;
    const shield = playerComps.find(c => c instanceof Shield) as Shield | undefined;
    const invulnerable = playerComps.find(c => c instanceof InvulnerableState) as InvulnerableState | undefined;
    const health = playerComps.find(c => c instanceof Health) as Health | undefined;

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
    for (const [, comps] of world.entities) {
        const bossTag = comps.find(c => c instanceof BossTag) as BossTag | undefined;
        if (!bossTag) continue;

        const transform = comps.find(c => c instanceof Transform) as Transform | undefined;
        const health = comps.find(c => c instanceof Health) as Health | undefined;

        if (transform && health) {
            return { transform, health, bossTag };
        }
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
