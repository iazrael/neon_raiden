/**
 * 相机系统 (CameraSystem)
 *
 * 职责：
 * - 跟随玩家移动
 * - 处理震屏事件
 * - 平滑相机移动（Lerp）
 * - 限制相机范围
 *
 * 系统类型：表现层
 * 执行顺序：P7 - 最先执行的表现层系统
 */

import { World } from '../types';
import { Transform, PlayerTag, CameraShake } from '../components';
import { CamShakeEvent } from '../events';
import { camera, triggerCameraShake as triggerShake, updateCameraShake } from './RenderSystem';

/**
 * 相机配置
 */
interface CameraConfig {
    /** 跟随平滑度 (0-1, 越小越平滑) */
    followSmooth: number;
    /** 震屏衰减速度 */
    shakeDecay: number;
    /** 最大震屏强度 */
    maxShakeIntensity: number;
}

/**
 * 默认相机配置
 */
const DEFAULT_CONFIG: CameraConfig = {
    followSmooth: 0.1,
    shakeDecay: 0.9,
    maxShakeIntensity: 20
};

/**
 * 当前相机配置
 */
let cameraConfig: CameraConfig = { ...DEFAULT_CONFIG };

/**
 * 目标相机位置
 */
let targetX = 0;
let targetY = 0;

/**
 * 相机系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 *
 * 注意：对于纵向卷轴射击游戏，相机是固定的（0, 0），
 * 世界坐标就是屏幕坐标，不跟随玩家移动
 */
export function CameraSystem(world: World, dt: number): void {
    // 1. 处理震屏事件
    handleShakeEvents(world);

    // 相机固定在 (0, 0)，不跟随玩家
    // 世界坐标 = 屏幕坐标

    // 2. 更新震屏衰减
    updateCameraShake(dt);

    // 3. 处理 CameraShake 组件（实体上的震屏请求）
    processCameraShakeComponents(world, dt);
}

/**
 * 处理震屏事件
 */
function handleShakeEvents(world: World): void {
    const events = world.events;

    for (const event of events) {
        if (event.type === 'CamShake') {
            const shakeEvent = event as CamShakeEvent;
            const intensity = Math.min(shakeEvent.intensity, cameraConfig.maxShakeIntensity);
            // CamShakeEvent.duration 是秒，转换为毫秒
            triggerShake(intensity, shakeEvent.duration * 1000);
        }
    }
}

/**
 * 更新跟随目标
 */
function updateFollowTarget(world: World): void {
    const playerComps = world.entities.get(world.playerId);
    if (!playerComps) return;

    const transform = playerComps.find(Transform.check) as Transform | undefined;
    if (!transform) return;

    // 设置目标为玩家位置（居中）
    // 假设世界坐标系原点在左上角，相机位置为左上角位置
    targetX = transform.x - world.width / 2;
    targetY = transform.y - world.height / 2;
}

/**
 * 平滑移动相机
 */
function smoothMoveCamera(): void {
    // 使用 Lerp 平滑移动
    camera.x += (targetX - camera.x) * cameraConfig.followSmooth;
    camera.y += (targetY - camera.y) * cameraConfig.followSmooth;

    // 限制相机范围（可选）
    // clampCameraBounds();
}

/**
 * 限制相机边界
 */
function clampCameraBounds(minX = -100, minY = -100, maxX = 100, maxY = 100): void {
    camera.x = Math.max(minX, Math.min(maxX, camera.x));
    camera.y = Math.max(minY, Math.min(maxY, camera.y));
}

/**
 * 处理 CameraShake 组件
 */
function processCameraShakeComponents(world: World, dt: number): void {
    for (const [id, comps] of world.entities) {
        const shake = comps.find(CameraShake.check) as CameraShake | undefined;
        if (!shake) continue;

        // 应用震屏（timer 和 triggerShake 都是毫秒）
        triggerShake(shake.intensity, shake.timer);

        // 更新计时器（dt 是毫秒）
        shake.timer -= dt;

        // 移除组件
        if (shake.timer <= 0) {
            const idx = comps.indexOf(shake);
            if (idx > -1) {
                comps.splice(idx, 1);
            }
        }
    }
}

/**
 * 设置相机配置
 */
export function setCameraConfig(config: Partial<CameraConfig>): void {
    cameraConfig = { ...cameraConfig, ...config };
}

/**
 * 获取相机配置
 */
export function getCameraConfig(): CameraConfig {
    return { ...cameraConfig };
}

/**
 * 重置相机配置
 */
export function resetCameraConfig(): void {
    cameraConfig = { ...DEFAULT_CONFIG };
}

/**
 * 设置相机位置（直接设置，不平滑）
 */
export function setCameraPosition(x: number, y: number): void {
    camera.x = x;
    camera.y = y;
    targetX = x;
    targetY = y;
}

/**
 * 获取相机位置
 */
export function getCameraPosition(): { x: number; y: number } {
    return { x: camera.x, y: camera.y };
}

/**
 * 世界坐标转屏幕坐标
 */
export function worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
        x: worldX - camera.x,
        y: worldY - camera.y
    };
}

/**
 * 屏幕坐标转世界坐标
 */
export function screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
        x: screenX + camera.x,
        y: screenY + camera.y
    };
}

/**
 * 添加震屏组件到实体
 */
export function addCameraShake(world: World, entityId: number, intensity: number, duration: number): void {
    const comps = world.entities.get(entityId);
    if (!comps) return;

    // 检查是否已有 CameraShake 组件
    const existing = comps.find(CameraShake.check);
    if (existing) {
        // 更新现有组件
        (existing as CameraShake).intensity = intensity;
        (existing as CameraShake).timer = duration;
    } else {
        // 添加新组件
        comps.push(new CameraShake({ intensity, timer: duration }));
    }
}
