/**
 * 渲染系统 (RenderSystem)
 *
 * 职责：
 * - 遍历所有有 Sprite 组件的实体并绘制
 * - 处理粒子渲染
 * - 根据 Camera 偏移调整绘制位置
 * - 按层级排序（背景 < 敌人 < 玩家 < UI < 特效）
 *
 * 系统类型：表现层
 * 执行顺序：P7 - 在 CameraSystem 之后
 */

import { World } from '../types';
import { Transform, Sprite, Particle, PlayerTag, EnemyTag } from '../components';

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

    // 清空画布
    context.clearRect(0, 0, width, height);

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

    // 计算相机偏移
    const camX = camera.x + camera.shakeX;
    const camY = camera.y + camera.shakeY;

    // 绘制所有实体
    for (const item of renderItems) {
        drawSprite(context, item, camX, camY, camera.zoom);
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

    // 应用颜色
    if (sprite.color) {
        ctx.fillStyle = sprite.color;
    }

    // 绘制（这里是简化版，实际应该从图集加载纹理）
    if (sprite.texture) {
        // TODO: 从纹理图集加载并绘制
        // 这里用简化版矩形代替
        ctx.fillRect(-pivotX, -pivotY, width, height);
    } else {
        // 使用颜色绘制矩形
        ctx.fillRect(-pivotX, -pivotY, width, height);
    }

    // 恢复上下文状态
    ctx.restore();
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
