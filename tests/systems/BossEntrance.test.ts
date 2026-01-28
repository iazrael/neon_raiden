/**
 * Boss入场行为测试
 *
 * 验证Boss能够正确地从屏幕上方移动到可视区域
 */

import { BossSystem } from '../../src/engine/systems/BossSystem';
import { MovementSystem } from '../../src/engine/systems/MovementSystem';
import { World } from '../../src/engine/types';
import { Transform, Health, BossTag, BossAI, SpeedStat, Weapon, Velocity, BossEntrance, MoveIntent } from '../../src/engine/components';
import { BossId, EnemyWeaponId } from '../../src/engine/types/ids';
import { BLUEPRINT_BOSS_GUARDIAN } from '../../src/engine/blueprints/bosses';
import { spawnBoss } from '../../src/engine/factory';

describe('Boss入场行为测试', () => {
    let mockWorld: World;
    let bossId: number;

    beforeEach(() => {
        // 创建模拟世界对象
        mockWorld = {
            entities: new Map(),
            width: 800,
            height: 600,
            time: 0,
            events: [],
            playerId: 1,
            score: 0,
            level: 1,
            playerLevel: 1,
            difficulty: 1.0,
            spawnCredits: 100,
            spawnTimer: 0,
            enemyCount: 0,
            spawnInitialized: true,
        } as unknown as World;

        // 添加玩家实体
        mockWorld.entities.set(1, [
            new Transform({ x: 400, y: 500, rot: 0 }),
        ]);

        // 使用spawnBoss生成Boss
        bossId = spawnBoss(mockWorld, BLUEPRINT_BOSS_GUARDIAN, 400, -150, 0);
    });

    describe('BossEntrance组件', () => {
        it('应该在Boss生成时自动添加BossEntrance组件', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const entrance = bossComps?.find(BossEntrance.check);

            expect(entrance).toBeDefined();
            expect(entrance?.targetY).toBe(150);
            expect(entrance?.entranceSpeed).toBe(150);
        });

        it('应该设置正确的入场参数', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const entrance = bossComps?.find(BossEntrance.check) as BossEntrance;

            expect(entrance?.targetY).toBe(150); // 目标Y坐标
            expect(entrance?.entranceSpeed).toBe(150); // 150像素/秒
        });
    });

    describe('入场移动逻辑', () => {
        it('应该在入场阶段产生向下移动意图', () => {
            const bossComps = mockWorld.entities.get(bossId);

            // 初始位置在屏幕上方
            expect(bossComps?.find(Transform.check)!.y).toBe(-150);

            // 执行BossSystem（Boss入场阶段）产生MoveIntent
            BossSystem(mockWorld, 16);

            // Boss应该产生向下移动的MoveIntent
            const moveIntent = bossComps?.find(MoveIntent.check) as MoveIntent;
            expect(moveIntent).toBeDefined();
            expect(moveIntent!.dy).toBeGreaterThan(0);
            expect(moveIntent!.dx).toBe(0);
            expect(moveIntent!.type).toBe('velocity');
        });

        it('应该在入场阶段通过MoveIntent产生实际移动', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const transform = bossComps?.find(Transform.check) as Transform;

            // 初始位置在屏幕上方
            const initialY = transform!.y;
            expect(initialY).toBe(-150);

            // 执行BossSystem产生MoveIntent
            BossSystem(mockWorld, 16);

            // 执行MovementSystem应用MoveIntent（实际移动）
            MovementSystem(mockWorld, 16);

            // Boss的Y坐标应该增加（向下移动）
            expect(transform!.y).toBeGreaterThan(initialY);

            // MoveIntent应该被MovementSystem消费掉
            const moveIntent = bossComps?.find(MoveIntent.check);
            expect(moveIntent).toBeUndefined();
        });

        it('应该在到达目标位置后移除BossEntrance组件', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const transform = bossComps?.find(Transform.check) as Transform;

            // 模拟Boss到达目标位置
            transform!.y = 160; // 超过targetY=150

            // 执行系统
            BossSystem(mockWorld, 16);

            // BossEntrance组件应该被移除
            const entrance = bossComps?.find(BossEntrance.check);
            expect(entrance).toBeUndefined();
        });

        it('应该在入场完成后开始执行战斗移动模式', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const transform = bossComps?.find(Transform.check) as Transform;

            // 让Boss先完成入场（通过多次调用系统）
            while (bossComps?.find(BossEntrance.check)) {
                BossSystem(mockWorld, 16);
                MovementSystem(mockWorld, 16);
            }

            // 现在Boss应该执行战斗移动模式（Guardian P1是SINE模式）
            const velocity = bossComps?.find(Velocity.check) as Velocity;

            // 继续执行系统
            mockWorld.time += 100;
            BossSystem(mockWorld, 16);
            MovementSystem(mockWorld, 16);

            // 速度应该改变（SINE模式会有横向移动）
            expect(velocity!.vx).not.toBe(0);
        });
    });

    describe('时间计算验证', () => {
        it('应该在合理时间内到达可视区域', () => {
            const bossComps = mockWorld.entities.get(bossId);
            const transform = bossComps?.find(Transform.check) as Transform;
            const entrance = bossComps?.find(BossEntrance.check) as BossEntrance;

            const initialY = transform!.y; // -150
            const targetY = entrance!.targetY; // 150

            // 模拟Boss完成入场
            let accumulatedTime = 0;
            const dt = 16; // 60fps
            const maxTime = 3000; // 最多3秒（安全上限）

            while (accumulatedTime < maxTime) {
                // 检查是否还在入场中
                const currentEntrance = bossComps?.find(BossEntrance.check);
                if (!currentEntrance) {
                    // 入场完成
                    break;
                }

                BossSystem(mockWorld, dt);      // Boss系统产生MoveIntent
                MovementSystem(mockWorld, dt);  // MovementSystem应用移动
                accumulatedTime += dt;
            }

            // Boss应该到达或超过目标位置
            expect(transform!.y).toBeGreaterThanOrEqual(targetY);

            // 所用时间应该在合理范围内（2秒左右，最多2.5秒）
            expect(accumulatedTime).toBeLessThanOrEqual(2500);
        });
    });
});
