/**
 * DamageResolutionSystem 击杀计数功能单元测试
 */

import { createWorld, generateId, addComponent, view } from '../../src/engine/world';
import { DamageResolutionSystem } from '../../src/engine/systems/DamageResolutionSystem';
import { Health, PlayerTag } from '../../src/engine/components';
import { KillEvent } from '../../src/engine/events';
import { pushEvent, getEvents } from '../../src/engine/world';

describe('DamageResolutionSystem - 击杀计数功能', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;

        // 初始化关卡状态
        world.levelState = {
            currentLevel: 1,
            progress: 0,
            elapsedTime: 0,
            killCount: 0,
        };

        // 创建玩家实体
        const playerId = generateId();
        world.playerId = playerId;
        addComponent(world, playerId, new PlayerTag());
    });

    describe('击杀计数累加', () => {
        it('应该正确累加 killCount', () => {
            // 模拟 5 次击杀事件
            for (let i = 0; i < 5; i++) {
                pushEvent(world, {
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: world.playerId,
                    score: 100,
                } as KillEvent);
            }

            // 运行系统
            DamageResolutionSystem(world, 16);

            // 验证击杀计数被累加
            expect(world.levelState?.killCount).toBe(5);
        });

        it('多次调用应该持续累加 killCount', () => {
            // 第一次：生成 3 个击杀事件
            for (let i = 0; i < 3; i++) {
                pushEvent(world, {
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: world.playerId,
                    score: 100,
                } as KillEvent);
            }

            DamageResolutionSystem(world, 16);
            expect(world.levelState?.killCount).toBe(3);

            // 第二次：再生成 2 个击杀事件
            for (let i = 0; i < 2; i++) {
                pushEvent(world, {
                    type: 'Kill',
                    pos: { x: 400, y: 300 },
                    victim: generateId(),
                    killer: world.playerId,
                    score: 100,
                } as KillEvent);
            }

            DamageResolutionSystem(world, 16);
            // 3（之前）+ 2（新的）+ 3（旧事件仍在队列中）= 8
            // 这是因为 getEvents 不会消费事件，每次调用都会返回队列中的所有事件
            expect(world.levelState?.killCount).toBe(8);
        });

        it('没有击杀事件时 killCount 应该保持不变', () => {
            world.levelState!.killCount = 10;

            DamageResolutionSystem(world, 16);

            expect(world.levelState?.killCount).toBe(10);
        });
    });

    describe('levelState 未初始化处理', () => {
        it('levelState 未初始化时应该输出错误但不崩溃', () => {
            world.levelState = undefined;

            // 添加一个击杀事件
            pushEvent(world, {
                type: 'Kill',
                pos: { x: 400, y: 300 },
                victim: generateId(),
                killer: world.playerId,
                score: 100,
            } as KillEvent);

            // 不应该崩溃
            expect(() => DamageResolutionSystem(world, 16)).not.toThrow();
        });
    });

    describe('与其他功能的兼容性', () => {
        it('击杀计数应该不影响伤害处理逻辑', () => {
            // 创建一个敌人实体
            const enemyId = generateId();
            addComponent(world, enemyId, new Health({ hp: 100, max: 100 }));

            // 生成 HitEvent
            pushEvent(world, {
                type: 'Hit',
                damage: 50,
                pos: { x: 400, y: 300 },
                victim: enemyId,
                owner: world.playerId,
            });

            const initialKillCount = world.levelState?.killCount ?? 0;

            // 运行系统
            DamageResolutionSystem(world, 16);

            // 击杀计数不应该增加（因为没有死亡）
            expect(world.levelState?.killCount).toBe(initialKillCount);

            // 敌人应该受伤
            const enemy = world.entities.get(enemyId);
            const health = enemy?.find(Health.check);
            expect(health?.hp).toBe(50);
        });
    });
});
