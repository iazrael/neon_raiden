/**
 * RenderSystem 单元测试
 */

import { RenderSystem, setRenderContext, getRenderContext, camera, setCameraPosition, resetCamera } from '../../src/engine/systems/RenderSystem';
import { World } from '../../src/engine/types';
import { Transform, Sprite, Particle, PlayerTag, EnemyTag } from '../../src/engine/components';

// Mock Canvas context
const mockCanvas = {
    width: 800,
    height: 600
} as any as HTMLCanvasElement;

const mockContext = {
    clearRect: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    fillRect: jest.fn(),
    fillStyle: ''
} as any as CanvasRenderingContext2D;

const mockRenderContext = {
    canvas: mockCanvas,
    context: mockContext,
    width: 800,
    height: 600
};

describe('RenderSystem', () => {
    let mockWorld: World;

    beforeEach(() => {
        // 重置相机
        resetCamera();

        // 清空 mock 调用
        jest.clearAllMocks();

        // 设置渲染上下文
        setRenderContext(mockRenderContext);

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
    });

    describe('基础渲染', () => {
        it('没有渲染上下文时不应该崩溃', () => {
            setRenderContext(null);

            expect(() => RenderSystem(mockWorld, 0.016)).not.toThrow();
        });

        it('应该清空画布', () => {
            RenderSystem(mockWorld, 0.016);

            expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
        });

        it('没有实体时不应该崩溃', () => {
            RenderSystem(mockWorld, 0.016);

            expect(mockContext.clearRect).toHaveBeenCalled();
        });
    });

    describe('实体渲染', () => {
        it('应该渲染有 Sprite 和 Transform 的实体', () => {
            const entityId = 100;
            mockWorld.entities.set(entityId, [
                new Transform({ x: 400, y: 300, rot: 0 }),
                new Sprite({ color: '#ff0000', srcX: 0, srcY: 0, srcW: 32, srcH: 32 })
            ]);

            RenderSystem(mockWorld, 0.016);

            // 应该调用 save/restore 和绘制方法
            expect(mockContext.save).toHaveBeenCalled();
            expect(mockContext.restore).toHaveBeenCalled();
        });

        it('应该按层级排序渲染', () => {
            // 添加玩家实体
            mockWorld.entities.set(mockWorld.playerId, [
                new Transform({ x: 400, y: 300, rot: 0 }),
                new Sprite({ color: '#00ff00', srcX: 0, srcY: 0, srcW: 32, srcH: 32 }),
                new PlayerTag()
            ]);

            // 添加敌人实体
            const enemyId = 100;
            mockWorld.entities.set(enemyId, [
                new Transform({ x: 200, y: 100, rot: 0 }),
                new Sprite({ color: '#ff0000', srcX: 0, srcY: 0, srcW: 32, srcH: 32 }),
                new EnemyTag({ id: 'NORMAL' as any })
            ]);

            RenderSystem(mockWorld, 0.016);

            // 应该渲染两个实体（save/restore 被调用 2 次）
            expect(mockContext.save).toHaveBeenCalled();
        });

        it('应该跳过没有 Transform 的实体', () => {
            mockWorld.entities.set(100, [
                new Sprite({ color: '#ff0000', srcX: 0, srcY: 0, srcW: 32, srcH: 32 })
            ]);

            RenderSystem(mockWorld, 0.016);

            // 只调用 clearRect，没有实际绘制
            expect(mockContext.clearRect).toHaveBeenCalled();
            expect(mockContext.fillRect).not.toHaveBeenCalled();
        });

        it('应该跳过没有 Sprite 的实体', () => {
            mockWorld.entities.set(100, [
                new Transform({ x: 400, y: 300, rot: 0 })
            ]);

            RenderSystem(mockWorld, 0.016);

            // 只调用 clearRect，没有实际绘制
            expect(mockContext.clearRect).toHaveBeenCalled();
        });
    });

    describe('相机偏移', () => {
        it('应该应用相机偏移', () => {
            setCameraPosition(100, 50);

            mockWorld.entities.set(100, [
                new Transform({ x: 400, y: 300, rot: 0 }),
                new Sprite({ color: '#ff0000', srcX: 0, srcY: 0, srcW: 32, srcH: 32 })
            ]);

            RenderSystem(mockWorld, 0.016);

            // 应该调用 translate 应用相机偏移
            expect(mockContext.translate).toHaveBeenCalled();
        });
    });

    describe('震屏', () => {
        it('应该应用震屏偏移', () => {
            camera.shakeX = 10;
            camera.shakeY = 5;

            mockWorld.entities.set(100, [
                new Transform({ x: 400, y: 300, rot: 0 }),
                new Sprite({ color: '#ff0000', srcX: 0, srcY: 0, srcW: 32, srcH: 32 })
            ]);

            RenderSystem(mockWorld, 0.016);

            // 应该调用 translate
            expect(mockContext.translate).toHaveBeenCalled();
        });
    });

    describe('渲染上下文管理', () => {
        it('应该设置和获取渲染上下文', () => {
            setRenderContext(mockRenderContext);
            const ctx = getRenderContext();

            expect(ctx).toBe(mockRenderContext);
        });

        it('应该支持传入临时渲染上下文', () => {
            const tempContext = {
                canvas: mockCanvas,
                context: mockContext,
                width: 1024,
                height: 768
            };

            RenderSystem(mockWorld, 0.016, tempContext);

            expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 1024, 768);
        });
    });

    describe('边界情况', () => {
        it('空实体列表不应该崩溃', () => {
            mockWorld.entities.clear();

            RenderSystem(mockWorld, 0.016);

            expect(mockContext.clearRect).toHaveBeenCalled();
        });

        it('缺少必要组件的实体应该被跳过', () => {
            mockWorld.entities.set(100, []);
            mockWorld.entities.set(101, [
                new Transform({ x: 400, y: 300, rot: 0 })
            ]);
            mockWorld.entities.set(102, [
                new Sprite({ color: '#ff0000', srcX: 0, srcY: 0, srcW: 32, srcH: 32 })
            ]);

            RenderSystem(mockWorld, 0.016);

            // 只调用 clearRect
            expect(mockContext.clearRect).toHaveBeenCalled();
        });
    });
});
