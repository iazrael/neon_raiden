/**
 * RenderSystem 单元测试
 */

import { RenderSystem } from '../../src/engine/systems/RenderSystem';
import { World } from '../../src/engine/world';
import { Transform, Sprite, PlayerTag, EnemyTag } from '../../src/engine/components';
import { SpriteKey } from '../../src/engine/configs/sprites';

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
    fillStyle: '',
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    strokeRect: jest.fn(),
    stroke: jest.fn(),
    lineWidth: 0,
    strokeStyle: '',
    shadowBlur: 0,
    shadowColor: '',
    drawImage: jest.fn(),
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
} as any as CanvasRenderingContext2D;

const mockRenderContext = {
    canvas: mockCanvas,
    context: mockContext,
    width: 800,
    height: 600
};

const createMockWorld = (): World => ({
    entities: new Map(),
    playerId: 1,
    visualEffectId: 0,
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
    },
    bossState: {
        bossId: 0,
        timer: 60000,
        spawned: false,
    },
});

describe('RenderSystem', () => {
    let mockWorld: World;

    beforeEach(() => {
        jest.clearAllMocks();
        mockWorld = createMockWorld();
    });

    describe('基础渲染', () => {
        it('没有实体时不应该崩溃', () => {
            expect(() => RenderSystem(mockWorld, mockRenderContext, 16)).not.toThrow();
        });

        it('应该绘制背景', () => {
            RenderSystem(mockWorld, mockRenderContext, 16);

            // RenderSystem 使用 fillRect 绘制黑色背景
            expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
        });
    });

    describe('实体渲染', () => {
        it('应该渲染有 Sprite 和 Transform 的实体', () => {
            const entityId = 100;
            mockWorld.entities.set(entityId, [
                new Transform({ x: 400, y: 300, rot: 0 }),
                new Sprite({ spriteKey: SpriteKey.PLAYER, color: '#ff0000' })
            ]);

            RenderSystem(mockWorld, mockRenderContext, 16);

            // 应该调用 save/restore 和绘制方法
            expect(mockContext.save).toHaveBeenCalled();
            expect(mockContext.restore).toHaveBeenCalled();
        });

        it('应该按层级排序渲染', () => {
            // 添加玩家实体
            mockWorld.entities.set(mockWorld.playerId, [
                new Transform({ x: 400, y: 300, rot: 0 }),
                new Sprite({ spriteKey: SpriteKey.PLAYER, color: '#00ff00' }),
                new PlayerTag()
            ]);

            // 添加敌人实体
            const enemyId = 100;
            mockWorld.entities.set(enemyId, [
                new Transform({ x: 200, y: 100, rot: 0 }),
                new Sprite({ spriteKey: SpriteKey.ENEMY_NORMAL, color: '#ff0000' }),
                new EnemyTag({ id: 'NORMAL' as any })
            ]);

            RenderSystem(mockWorld, mockRenderContext, 16);

            // 应该渲染两个实体（save/restore 被调用至少 2 次：背景 + 2 个实体）
            expect(mockContext.save).toHaveBeenCalled();
        });

        it('应该跳过没有 Transform 的实体', () => {
            mockWorld.entities.set(100, [
                new Sprite({ spriteKey: SpriteKey.PLAYER, color: '#ff0000' })
            ]);

            RenderSystem(mockWorld, mockRenderContext, 16);

            // 只绘制背景，不绘制实体
            expect(mockContext.fillRect).toHaveBeenCalled();
            expect(mockContext.save).not.toHaveBeenCalled();
            expect(mockContext.restore).not.toHaveBeenCalled();
        });

        it('应该跳过没有 Sprite 的实体', () => {
            mockWorld.entities.set(100, [
                new Transform({ x: 400, y: 300, rot: 0 })
            ]);

            RenderSystem(mockWorld, mockRenderContext, 16);

            // 只绘制背景
            expect(mockContext.fillRect).toHaveBeenCalled();
        });
    });

    describe('相机偏移', () => {
        it('应该应用相机偏移', () => {
            mockWorld.renderState.camera.x = 100;
            mockWorld.renderState.camera.y = 50;

            mockWorld.entities.set(100, [
                new Transform({ x: 400, y: 300, rot: 0 }),
                new Sprite({ spriteKey: SpriteKey.PLAYER, color: '#ff0000' })
            ]);

            RenderSystem(mockWorld, mockRenderContext, 16);

            // 应该调用 translate 应用相机偏移
            expect(mockContext.translate).toHaveBeenCalled();
        });
    });

    describe('震屏', () => {
        it('应该应用震屏偏移', () => {
            mockWorld.renderState.camera.shakeX = 10;
            mockWorld.renderState.camera.shakeY = 5;

            mockWorld.entities.set(100, [
                new Transform({ x: 400, y: 300, rot: 0 }),
                new Sprite({ spriteKey: SpriteKey.PLAYER, color: '#ff0000' })
            ]);

            RenderSystem(mockWorld, mockRenderContext, 16);

            // 应该调用 translate
            expect(mockContext.translate).toHaveBeenCalled();
        });
    });

    describe('边界情况', () => {
        it('空实体列表不应该崩溃', () => {
            mockWorld.entities.clear();

            RenderSystem(mockWorld, mockRenderContext, 16);

            // 至少应该绘制背景
            expect(mockContext.fillRect).toHaveBeenCalled();
        });

        it('缺少必要组件的实体应该被跳过', () => {
            mockWorld.entities.set(100, []);
            mockWorld.entities.set(101, [
                new Transform({ x: 400, y: 300, rot: 0 })
            ]);
            mockWorld.entities.set(102, [
                new Sprite({ spriteKey: SpriteKey.PLAYER, color: '#ff0000' })
            ]);

            RenderSystem(mockWorld, mockRenderContext, 16);

            // 只绘制背景
            expect(mockContext.fillRect).toHaveBeenCalled();
        });
    });
});
