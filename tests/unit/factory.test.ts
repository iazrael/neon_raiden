/**
 * factory 单元测试
 * 测试 spawnOption 函数
 */

import { World } from '../../src/engine/types';
import { createWorld } from '../../src/engine/world';
import { spawnOption } from '../../src/engine/factory';
import { BLUEPRINT_OPTION_VULCAN } from '../../src/engine/blueprints/fighters';
import { Option, PlayerTag } from '../../src/engine/components';

describe('factory - spawnOption', () => {
    let world: World;

    beforeEach(() => {
        world = createWorld();
    });

    it('应该创建僚机实体并设置正确的索引', () => {
        const index = 0;
        const x = 100;
        const y = 200;

        const entityId = spawnOption(world, BLUEPRINT_OPTION_VULCAN, index, x, y);

        // 验证实体被创建
        const comps = world.entities.get(entityId);
        expect(comps).toBeDefined();
        expect(comps?.length).toBeGreaterThan(0);

        // 验证 Option 组件存在且索引正确
        const option = comps?.find(Option.check);
        expect(option).toBeDefined();
        expect(option?.index).toBe(index);

        // 验证 PlayerTag 组件存在且标记为僚机
        const playerTag = comps?.find(PlayerTag.check);
        expect(playerTag).toBeDefined();
        expect(playerTag?.isOption).toBe(true);
    });

    it('应该创建索引为1的僚机', () => {
        const index = 1;
        const x = 150;
        const y = 250;

        const entityId = spawnOption(world, BLUEPRINT_OPTION_VULCAN, index, x, y);

        const comps = world.entities.get(entityId);
        const option = comps?.find(Option.check);

        expect(option?.index).toBe(index);
    });

    it('应该在正确的位置创建僚机', () => {
        const index = 0;
        const x = 300;
        const y = 400;

        const entityId = spawnOption(world, BLUEPRINT_OPTION_VULCAN, index, x, y);

        const comps = world.entities.get(entityId);
        const transform = comps?.find((c: any) => c.constructor.name === 'Transform');

        expect(transform).toBeDefined();
        expect(transform?.x).toBe(x);
        expect(transform?.y).toBe(y);
    });
});
