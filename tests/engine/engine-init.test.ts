/**
 * Engine 初始化测试
 *
 * 测试关卡系统在 Engine 中的正确初始化
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Engine } from '../../src/engine/engine';
import { Blueprint } from '../../src/engine/blueprints';
import { SpriteKey } from '../../src/engine/configs';

// Mock Canvas
class MockCanvasRenderingContext2D {
    clearRect = () => {};
    save = () => {};
    restore = () => {};
    translate = () => {};
    rotate = () => {};
    scale = () => {};
    fillRect = () => {};
    fillStyle = '';
}

class MockCanvas {
    clientWidth = 800;
    clientHeight = 600;
    width = 800;
    height = 600;
    style = { width: '', height: '' } as any;
    getContext = () => new MockCanvasRenderingContext2D();
    addEventListener = () => {};
    removeEventListener = () => {};
}

// Mock ResizeObserver
class MockResizeObserver {
    observe = () => {};
    disconnect = () => {};
    unobserve = () => {};
}

// 简单的玩家蓝图
const PLAYER_BLUEPRINT: Blueprint = {
    Transform: { x: 400, y: 500, rot: 0 },
    Velocity: { vx: 0, vy: 0, vrot: 0 },
    Sprite: { spriteKey: SpriteKey.PLAYER, color: '#00ff00' }
};

describe('Engine 初始化', () => {
    let engine: Engine;
    let mockCanvas: MockCanvas;

    beforeAll(() => {
        // Mock ResizeObserver
        (window as any).ResizeObserver = MockResizeObserver;
    });

    beforeEach(() => {
        mockCanvas = new MockCanvas() as any;
        engine = new Engine();
    });

    afterEach(() => {
        try {
            engine.stop();
        } catch {
            // 忽略停止时的错误
        }
    });

    it('levelState 应该正确初始化', () => {
        // 启动引擎
        engine.start(mockCanvas as any, PLAYER_BLUEPRINT);

        // 验证 world.levelState 已初始化
        const world = engine['world'];
        expect(world.levelState).toBeDefined();
        expect(world.levelState.currentLevel).toBe(1);
        expect(world.levelState.progress).toBe(0);
        expect(world.levelState.elapsedTime).toBe(0);
        expect(world.levelState.killCount).toBe(0);
    });
});
