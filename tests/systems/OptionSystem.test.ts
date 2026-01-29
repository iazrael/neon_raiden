/**
 * OptionSystem 单元测试
 * 测试僚机系统的位置更新、数量同步等功能
 */

import { World } from '../../src/engine/types';
import { createWorld, addComponent } from '../../src/engine/world';
import { OptionSystem } from '../../src/engine/systems/OptionSystem';
import { Transform, Option, PlayerTag, OptionCount } from '../../src/engine/components';
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
            new Option(0),
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

    it('应该根据 OptionCount 同步僚机数量', () => {
        // 设置玩家有 2 个僚机
        const playerComps = world.entities.get(playerId);
        if (playerComps) {
            const optionCount = playerComps.find(OptionCount.check);
            if (optionCount) {
                optionCount.count = 2;
            } else {
                playerComps.push(new OptionCount({ count: 2, maxCount: 2 }));
            }
        }

        // 执行系统
        OptionSystem(world, 16);

        // 应该创建 2 个僚机
        let optionCount = 0;
        for (const [id, comps] of world.entities) {
            const playerTag = comps.find(PlayerTag.check);
            if (playerTag && playerTag.isOption) {
                optionCount++;
            }
        }

        expect(optionCount).toBe(2);
    });

    it('应该删除多余的僚机', () => {
        // 手动添加 2 个僚机实体
        world.entities.set(1, [
            new Transform({ x: 400, y: 500, rot: 0 }),
            new Option(0),
            new PlayerTag({ isOption: true })
        ]);
        world.entities.set(2, [
            new Transform({ x: 400, y: 500, rot: 0 }),
            new Option(1),
            new PlayerTag({ isOption: true })
        ]);

        // 设置玩家只有 1 个僚机
        const playerComps = world.entities.get(playerId);
        if (playerComps) {
            const optionCount = playerComps.find(OptionCount.check);
            if (optionCount) {
                optionCount.count = 1;
            } else {
                playerComps.push(new OptionCount({ count: 1, maxCount: 2 }));
            }
        }

        // 执行系统
        OptionSystem(world, 16);

        // 应该只剩下 1 个僚机
        let optionCount = 0;
        for (const [id, comps] of world.entities) {
            const playerTag = comps.find(PlayerTag.check);
            if (playerTag && playerTag.isOption) {
                optionCount++;
            }
        }

        expect(optionCount).toBe(1);
    });

    it('应该在没有玩家时正常返回', () => {
        world.playerId = 999;

        // 不应该抛出错误
        expect(() => OptionSystem(world, 16)).not.toThrow();
    });
});
