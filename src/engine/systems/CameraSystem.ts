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

import { World } from '../world';
import { CameraShake } from '../components';
import { CamShakeEvent } from '../events';

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
 * 相机系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 *
 * 注意：对于纵向卷轴射击游戏，相机是固定的（0, 0），
 * 世界坐标就是屏幕坐标，不跟随玩家移动
 */
export function CameraSystem(world: World, dt: number): void {
    const camera = world.renderState.camera;

    // 1. 处理震屏事件
    handleShakeEvents(world, camera);

    // 2. 更新震屏衰减
    updateCameraShake(camera, dt);

    // 3. 处理 CameraShake 组件（实体上的震屏请求）
    processCameraShakeComponents(world, camera, dt);
}

/**
 * 处理震屏事件
 */
function handleShakeEvents(world: World, camera: World['renderState']['camera']): void {
    const events = world.events;

    for (const event of events) {
        if (event.type === 'CamShake') {
            const shakeEvent = event as CamShakeEvent;
            const intensity = Math.min(shakeEvent.intensity, cameraConfig.maxShakeIntensity);
            // CamShakeEvent.duration 是秒，转换为毫秒
            triggerCameraShake(camera, intensity, shakeEvent.duration * 1000);
        }
    }
}

/**
 * 更新相机震屏
 */
function updateCameraShake(camera: World['renderState']['camera'], dt: number): void {
    if (camera.shakeTimer <= 0) {
        camera.shakeX = 0;
        camera.shakeY = 0;
        camera.shakeIntensity = 0;
        return;
    }

    camera.shakeTimer -= dt;
    camera.shakeX = (Math.random() - 0.5) * 2 * camera.shakeIntensity;
    camera.shakeY = (Math.random() - 0.5) * 2 * camera.shakeIntensity;

    if (camera.shakeTimer <= 0) {
        camera.shakeTimer = 0;
        camera.shakeX = 0;
        camera.shakeY = 0;
        camera.shakeIntensity = 0;
    }
}

/**
 * 触发相机震屏
 */
function triggerCameraShake(
    camera: World['renderState']['camera'],
    intensity: number,
    duration: number
): void {
    camera.shakeIntensity = intensity;
    camera.shakeTimer = duration;
    camera.shakeX = (Math.random() - 0.5) * 2 * intensity;
    camera.shakeY = (Math.random() - 0.5) * 2 * intensity;
}

/**
 * 处理 CameraShake 组件
 */
function processCameraShakeComponents(world: World, camera: World['renderState']['camera'], dt: number): void {
    for (const [, comps] of world.entities) {
        const shake = comps.find(CameraShake.check) as CameraShake | undefined;
        if (!shake) continue;

        // 应用震屏（timer 和 triggerShake 都是毫秒）
        triggerCameraShake(camera, shake.intensity, shake.timer);

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
export function setCameraPosition(world: World, x: number, y: number): void {
    world.renderState.camera.x = x;
    world.renderState.camera.y = y;
}

/**
 * 获取相机位置
 */
export function getCameraPosition(world: World): { x: number; y: number } {
    const { x, y } = world.renderState.camera;
    return { x, y };
}

/**
 * 世界坐标转屏幕坐标
 */
export function worldToScreen(world: World, worldX: number, worldY: number): { x: number; y: number } {
    const { x: camX, y: camY } = world.renderState.camera;
    return {
        x: worldX - camX,
        y: worldY - camY
    };
}

/**
 * 屏幕坐标转世界坐标
 */
export function screenToWorld(world: World, screenX: number, screenY: number): { x: number; y: number } {
    const { x: camX, y: camY } = world.renderState.camera;
    return {
        x: screenX + camX,
        y: screenY + camY
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

/**
 * 触发震屏（直接设置相机状态）
 */
export function triggerShake(world: World, intensity: number, duration: number): void {
    triggerCameraShake(world.renderState.camera, intensity, duration);
}
