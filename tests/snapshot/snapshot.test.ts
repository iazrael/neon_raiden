/**
 * GameSnapshot 测试
 *
 * 测试游戏快照包含正确的关卡系统信息
 */

import { describe, it, expect } from '@jest/globals';
import { buildSnapshot } from '../../src/engine/snapshot';
import { createWorld } from '../../src/engine/world';

describe('GameSnapshot', () => {
    it('应该包含 levelState 信息', () => {
        // 创建 World
        const world = createWorld();

        // 设置 levelState
        world.levelState = {
            currentLevel: 3,
            progress: 75.5,
            elapsedTime: 45000,
            killCount: 20,
        };

        // 构建快照
        const snapshot = buildSnapshot(world, 1000);

        // 验证 level 来自 levelState.currentLevel
        expect(snapshot.level).toBe(3);

        // 验证 progress 来自 levelState.progress
        expect(snapshot.progress).toBe(75.5);
    });

    it('progress 允许小数', () => {
        // 创建 World
        const world = createWorld();

        // 设置带小数的 progress
        world.levelState = {
            currentLevel: 1,
            progress: 123.456,
            elapsedTime: 60000,
            killCount: 0,
        };

        // 构建快照
        const snapshot = buildSnapshot(world, 1000);

        // 验证 progress 保持小数精度
        expect(snapshot.progress).toBe(123.456);
    });
});
