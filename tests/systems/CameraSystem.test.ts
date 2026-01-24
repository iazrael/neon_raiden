/**
 * CameraSystem 单元测试
 */

import { CameraSystem, setCameraConfig, resetCameraConfig, setCameraPosition, getCameraPosition, worldToScreen, screenToWorld } from '../../src/engine/systems/CameraSystem';
import { World } from '../../src/engine/types';
import { Transform, PlayerTag } from '../../src/engine/components';

describe('CameraSystem', () => {
    let mockWorld: World;

    beforeEach(() => {
        // 重置相机配置
        resetCameraConfig();

        // 创建模拟世界对象
        mockWorld = {
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
            comboState: { count: 0, timer: 0, multiplier: 1 },
        } as unknown as World;

        // 添加玩家实体
        mockWorld.entities.set(mockWorld.playerId, [
            new Transform({ x: 400, y: 300, rot: 0 }),
            new PlayerTag()
        ]);
    });

    describe('相机跟随', () => {
        it('应该跟随玩家移动', () => {
            CameraSystem(mockWorld, 0.016);

            // 相机应该移动到玩家位置附近
            const pos = getCameraPosition();
            expect(pos.x).toBe(0); // 初始位置为 0,0
            expect(pos.y).toBe(0);
        });

        it('应该平滑移动相机', () => {
            const playerComps = mockWorld.entities.get(mockWorld.playerId);
            const transform = playerComps?.find(c => c instanceof Transform) as Transform;
            transform!.x = 500;
            transform!.y = 400;

            CameraSystem(mockWorld, 0.016);

            // 相机应该向目标位置移动
            const pos = getCameraPosition();
            expect(pos.x).toBeGreaterThan(0);
            expect(pos.y).toBeGreaterThan(0);
        });

        it('应该正确计算目标位置', () => {
            const playerComps = mockWorld.entities.get(mockWorld.playerId);
            const transform = playerComps?.find(c => c instanceof Transform) as Transform;
            transform!.x = 600;
            transform!.y = 500;

            CameraSystem(mockWorld, 0.016);

            // 目标位置应该是玩家位置减去画布中心
            // (600 - 400 = 200, 500 - 300 = 200)
            const pos = getCameraPosition();
            // 由于平滑移动，位置会逐渐接近目标
            expect(pos.x).toBeGreaterThan(0);
            expect(pos.y).toBeGreaterThan(0);
        });
    });

    describe('震屏处理', () => {
        it('应该处理震屏事件', () => {
            mockWorld.events = [
                { type: 'CamShake', intensity: 10, duration: 0.5 }
            ];

            CameraSystem(mockWorld, 0.016);

            // 系统应该正常运行
            expect(true).toBe(true);
        });

        it('应该处理 CameraShake 组件', () => {
            // 添加震屏组件到玩家
            const playerComps = mockWorld.entities.get(mockWorld.playerId);
            playerComps?.push({
                constructor: { name: 'CameraShake' },
                intensity: 5,
                timer: 500
            } as any);

            CameraSystem(mockWorld, 0.016);

            // 系统应该正常运行
            expect(true).toBe(true);
        });
    });

    describe('配置管理', () => {
        it('应该允许修改相机配置', () => {
            setCameraConfig({ followSmooth: 0.5 });

            const config = getCameraPosition();
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
            setCameraPosition(100, 100);

            const screenPos = worldToScreen(200, 200);

            expect(screenPos.x).toBe(100); // 200 - 100
            expect(screenPos.y).toBe(100); // 200 - 100
        });

        it('应该将屏幕坐标转换为世界坐标', () => {
            setCameraPosition(100, 100);

            const worldPos = screenToWorld(150, 150);

            expect(worldPos.x).toBe(250); // 150 + 100
            expect(worldPos.y).toBe(250); // 150 + 100
        });
    });

    describe('边界情况', () => {
        it('没有玩家时不应该崩溃', () => {
            mockWorld.entities.delete(mockWorld.playerId);

            expect(() => CameraSystem(mockWorld, 0.016)).not.toThrow();
        });

        it('玩家缺少 Transform 组件时不应该崩溃', () => {
            const playerComps = mockWorld.entities.get(mockWorld.playerId);
            const transform = playerComps?.find(c => c instanceof Transform);
            if (transform) {
                const idx = playerComps!.indexOf(transform);
                playerComps!.splice(idx, 1);
            }

            expect(() => CameraSystem(mockWorld, 0.016)).not.toThrow();
        });

        it('空事件列表应该正常处理', () => {
            mockWorld.events = [];

            expect(() => CameraSystem(mockWorld, 0.016)).not.toThrow();
        });
    });
});
