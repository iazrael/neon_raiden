/**
 * OptionSystem 单元测试
 * 测试僚机系统的位置更新功能
 *
 * 架构说明：
 * - OptionSystem 只负责更新现有僚机的位置（环绕玩家旋转）
 * - 僚机的创建和删除由 PickupSystem 负责（拾取 OPTION 道具时）
 */

import { World } from '../../src/engine/types';
import { createWorld } from '../../src/engine/world';
import { OptionSystem } from '../../src/engine/systems/OptionSystem';
import { Transform, Option, PlayerTag } from '../../src/engine/components';
import { BLUEPRINT_FIGHTER_NEON } from '../../src/engine/blueprints/fighters';
import { spawnPlayer } from '../../src/engine/factory';

describe('OptionSystem', () => {
    let world: World;
    let playerId: number;

    beforeEach(() => {
        world = createWorld();
        playerId = spawnPlayer(world, BLUEPRINT_FIGHTER_NEON, 400, 500, 0);
    });

    it('应该正确更新僚机位置（环绕玩家旋转）', () => {
        // 手动添加一个僚机实体
        const optionId = 1;
        world.entities.set(optionId, [
            new Transform({ x: 400, y: 500, rot: 0 }),
            new Option({ index: 0 }),
            new PlayerTag({ isOption: true })
        ]);

        const playerTransform = world.entities.get(playerId)?.find(Transform.check);
        const optionTransform = world.entities.get(optionId)?.find(Transform.check);

        const initialX = optionTransform?.x ?? 0;
        const initialY = optionTransform?.y ?? 0;

        // 执行系统（模拟 100ms 过去）
        world.time = 100;
        OptionSystem(world, 100);

        // 位置应该有变化（因为旋转）
        expect(optionTransform?.x).not.toBe(initialX);
        expect(optionTransform?.y).not.toBe(initialY);
    });

    it('应该更新多个僚机的位置', () => {
        // 手动添加两个僚机实体
        const option1Id = 1;
        const option2Id = 2;

        world.entities.set(option1Id, [
            new Transform({ x: 400, y: 500, rot: 0 }),
            new Option({ index: 0 }),
            new PlayerTag({ isOption: true })
        ]);

        world.entities.set(option2Id, [
            new Transform({ x: 400, y: 500, rot: 0 }),
            new Option({ index: 1 }),
            new PlayerTag({ isOption: true })
        ]);

        // 执行系统
        world.time = 100;
        OptionSystem(world, 100);

        // 两个僚机都应该在移动
        const option1Transform = world.entities.get(option1Id)?.find(Transform.check);
        const option2Transform = world.entities.get(option2Id)?.find(Transform.check);

        // 两个僚机的位置应该不同（因为它们的初始角度不同：0 和 π）
        expect(option1Transform?.x).not.toBe(option2Transform?.x);
        expect(option1Transform?.y).not.toBe(option2Transform?.y);
    });

    it('应该在没有玩家时正常返回', () => {
        world.playerId = 999;

        // 不应该抛出错误
        expect(() => OptionSystem(world, 16)).not.toThrow();
    });

    it('应该在没有僚机时正常返回', () => {
        // 不添加任何僚机实体，只执行系统
        expect(() => OptionSystem(world, 16)).not.toThrow();
    });
});
