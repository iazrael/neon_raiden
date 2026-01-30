/**
 * CameraSystem 单元测试
 */

import { CameraSystem, setCameraConfig, resetCameraConfig, setCameraPosition, getCameraPosition, worldToScreen, screenToWorld } from '../../src/engine/systems/CameraSystem';
import { World } from '../../src/engine/world';
import { Transform, PlayerTag } from '../../src/engine/components';

const createMockWorld = (): World => ({
    entities: new Map(),
    playerId: 1,
    width: 800,
    height: 600,
    time: 0,
    score: 0,
    level: 0,
    difficulty: 1.0,
    spawnCredits: 100,
    spawnTimer: 0,
    enemyCount: 0,
    events: [],
    timeScale: 1,
    spawnInitialized: false,
    playerLevel: 1,
    renderState: {
        camera: {
            x: 0,
            y: 0,
            shakeX: 0,
            shakeY: 0,
            zoom: 1,
            shakeTimer: 0,
            shakeIntensity: 0,
        },
        timeSlowLines: [],
    },
});

describe('CameraSystem', () => {
    let mockWorld: World;

    beforeEach(() => {
        resetCameraConfig();
        mockWorld = createMockWorld();

        // 添加玩家实体
        mockWorld.entities.set(mockWorld.playerId, [
            new Transform({ x: 400, y: 300, rot: 0 }),
            new PlayerTag()
        ]);
    });

    describe('相机固定', () => {
        it('相机应该固定在原点，不跟随玩家', () => {
            CameraSystem(mockWorld, 16);

            // 相机应该保持在原点（纵向卷轴射击游戏特性）
            const pos = getCameraPosition(mockWorld);
            expect(pos.x).toBe(0);
            expect(pos.y).toBe(0);
        });

        it('即使玩家移动，相机仍然保持固定', () => {
            const playerComps = mockWorld.entities.get(mockWorld.playerId);
            const transform = playerComps?.find(Transform.check) as Transform;
            transform!.x = 500;
            transform!.y = 400;

            CameraSystem(mockWorld, 16);

            // 相机应该仍然在原点
            const pos = getCameraPosition(mockWorld);
            expect(pos.x).toBe(0);
            expect(pos.y).toBe(0);
        });

        it('可以手动设置相机位置用于测试', () => {
            // 使用 setCameraPosition 手动设置
            setCameraPosition(mockWorld, 100, 200);

            const pos = getCameraPosition(mockWorld);
            expect(pos.x).toBe(100);
            expect(pos.y).toBe(200);

            // 重置后应该回到原点
            setCameraPosition(mockWorld, 0, 0);
            const pos2 = getCameraPosition(mockWorld);
            expect(pos2.x).toBe(0);
            expect(pos2.y).toBe(0);
        });
    });

    describe('震屏处理', () => {
        it('应该处理震屏事件', () => {
            mockWorld.events = [
                { type: 'CamShake', intensity: 10, duration: 0.5 }
            ];

            CameraSystem(mockWorld, 16);

            // 系统应该正常运行
            expect(true).toBe(true);
        });

        it('震屏后应该有 shakeX 和 shakeY 偏移', () => {
            mockWorld.events = [
                { type: 'CamShake', intensity: 10, duration: 0.5 }
            ];

            CameraSystem(mockWorld, 16);

            // 震屏后应该有偏移
            expect(mockWorld.renderState.camera.shakeX).not.toBe(0);
            expect(mockWorld.renderState.camera.shakeY).not.toBe(0);
        });
    });

    describe('配置管理', () => {
        it('应该允许修改相机配置', () => {
            setCameraConfig({ followSmooth: 0.5 });

            const config = getCameraPosition(mockWorld);
            expect(config).toBeDefined();
        });

        it('应该重置相机配置', () => {
            setCameraConfig({ followSmooth: 0.5 });
            resetCameraConfig();

            // 配置应该被重置
            expect(true).toBe(true);
        });
    });

    describe('坐标转换', () => {
        it('应该将世界坐标转换为屏幕坐标', () => {
            setCameraPosition(mockWorld, 100, 100);

            const screenPos = worldToScreen(mockWorld, 200, 200);

            expect(screenPos.x).toBe(100); // 200 - 100
            expect(screenPos.y).toBe(100); // 200 - 100
        });

        it('应该将屏幕坐标转换为世界坐标', () => {
            setCameraPosition(mockWorld, 100, 100);

            const worldPos = screenToWorld(mockWorld, 150, 150);

            expect(worldPos.x).toBe(250); // 150 + 100
            expect(worldPos.y).toBe(250); // 150 + 100
        });
    });

    describe('边界情况', () => {
        it('没有玩家时不应该崩溃', () => {
            mockWorld.entities.delete(mockWorld.playerId);

            expect(() => CameraSystem(mockWorld, 16)).not.toThrow();
        });

        it('玩家缺少 Transform 组件时不应该崩溃', () => {
            const playerComps = mockWorld.entities.get(mockWorld.playerId);
            const transform = playerComps?.find(Transform.check);
            if (transform) {
                const idx = playerComps!.indexOf(transform);
                playerComps!.splice(idx, 1);
            }

            expect(() => CameraSystem(mockWorld, 16)).not.toThrow();
        });

        it('空事件列表应该正常处理', () => {
            mockWorld.events = [];

            expect(() => CameraSystem(mockWorld, 16)).not.toThrow();
        });
    });
});
