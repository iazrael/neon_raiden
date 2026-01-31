/**
 * VisualEffectSystem 单元测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createWorld, generateId, World, addComponent } from '../../src/engine/world';
import { VisualEffectSystem, spawnParticles, spawnLines, clearLines, spawnCircle } from '../../src/engine/systems/VisualEffectSystem';
import { VisualEffect } from '../../src/engine/components/visual';

describe('VisualEffectSystem', () => {
    let world: World;
    let visualEffect: VisualEffect;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;

        // 创建 VisualEffect 实体
        const id = generateId();
        visualEffect = new VisualEffect();
        addComponent(world, id, visualEffect);
        world.visualEffectId = id;
    });

    describe('spawnParticles API', () => {
        it('应该创建正确数量的粒子', () => {
            spawnParticles(world, 100, 200, {
                count: 10,
                speedMin: 0,
                speedMax: 0,
                sizeMin: 2,
                sizeMax: 2,
                life: 1000,
                color: '#ff0000',
            });

            expect(visualEffect.particles.length).toBe(10);
        });

        it('应该正确设置粒子初始位置', () => {
            spawnParticles(world, 100, 200, {
                count: 5,
                speedMin: 0,
                speedMax: 0,
                sizeMin: 2,
                sizeMax: 2,
                life: 1000,
                color: '#ff0000',
            });

            for (const p of visualEffect.particles) {
                expect(p.x).toBe(100);
                expect(p.y).toBe(200);
            }
        });
    });

    describe('spawnLines API', () => {
        it('应该补充到指定数量的线条', () => {
            spawnLines(world, 800, 20);

            expect(visualEffect.lines.length).toBe(20);
        });

        it('多次调用应该维持最大数量', () => {
            spawnLines(world, 800, 10);
            expect(visualEffect.lines.length).toBe(10);

            spawnLines(world, 800, 10);
            expect(visualEffect.lines.length).toBe(10); // 不会重复添加
        });

        it('clearLines 应该清空所有线条', () => {
            spawnLines(world, 800, 20);
            expect(visualEffect.lines.length).toBe(20);

            clearLines(world);
            expect(visualEffect.lines.length).toBe(0);
        });
    });

    describe('spawnCircle API', () => {
        it('应该创建圆环', () => {
            spawnCircle(world, 100, 200, '#ff0000', 150, 5);

            expect(visualEffect.circles.length).toBe(1);
            expect(visualEffect.circles[0].x).toBe(100);
            expect(visualEffect.circles[0].y).toBe(200);
            expect(visualEffect.circles[0].color).toBe('#ff0000');
            expect(visualEffect.circles[0].maxRadius).toBe(150);
            expect(visualEffect.circles[0].width).toBe(5);
        });

        it('应该使用默认参数', () => {
            spawnCircle(world, 100, 200);

            expect(visualEffect.circles[0].color).toBe('#ffffff');
            expect(visualEffect.circles[0].maxRadius).toBe(150);
            expect(visualEffect.circles[0].width).toBe(5);
        });
    });

    describe('粒子更新', () => {
        it('应该更新粒子位置', () => {
            spawnParticles(world, 100, 200, {
                count: 1,
                speedMin: 50,
                speedMax: 50,
                sizeMin: 2,
                sizeMax: 2,
                life: 1000,
                color: '#ff0000',
            });

            VisualEffectSystem(world, 100); // 100ms

            expect(visualEffect.particles[0].x).not.toBe(100);
            expect(visualEffect.particles[0].y).not.toBe(200);
        });

        it('应该减少粒子生命周期', () => {
            spawnParticles(world, 0, 0, {
                count: 1,
                speedMin: 0,
                speedMax: 0,
                sizeMin: 2,
                sizeMax: 2,
                life: 500,
                color: '#ff0000',
            });

            VisualEffectSystem(world, 100);

            expect(visualEffect.particles[0].life).toBe(400);
        });

        it('应该清理过期的粒子', () => {
            spawnParticles(world, 0, 0, {
                count: 1,
                speedMin: 0,
                speedMax: 0,
                sizeMin: 2,
                sizeMax: 2,
                life: 50,
                color: '#ff0000',
            });

            VisualEffectSystem(world, 100);

            expect(visualEffect.particles.length).toBe(0);
        });
    });

    describe('线条更新', () => {
        it('应该更新线条位置', () => {
            spawnLines(world, 800, 1);
            const initialY = visualEffect.lines[0].y;

            VisualEffectSystem(world, 16);

            expect(visualEffect.lines[0].y).toBeGreaterThan(initialY);
        });

        it('应该清理超出屏幕的线条', () => {
            spawnLines(world, 800, 1);
            visualEffect.lines[0].y = 700; // 超出 height (600) + 100

            VisualEffectSystem(world, 16);

            expect(visualEffect.lines.length).toBe(0);
        });
    });

    describe('圆环更新', () => {
        it('应该增加圆环半径', () => {
            spawnCircle(world, 0, 0);
            const initialRadius = visualEffect.circles[0].radius;

            VisualEffectSystem(world, 16);

            expect(visualEffect.circles[0].radius).toBeGreaterThan(initialRadius);
        });

        it('应该减少圆环生命周期', () => {
            spawnCircle(world, 0, 0);
            const initialLife = visualEffect.circles[0].life;

            VisualEffectSystem(world, 16);

            expect(visualEffect.circles[0].life).toBeLessThan(initialLife);
        });

        it('应该清理过期的圆环', () => {
            spawnCircle(world, 0, 0);
            visualEffect.circles[0].life = 0.01;

            VisualEffectSystem(world, 16);

            expect(visualEffect.circles.length).toBe(0);
        });
    });

    describe('边界情况', () => {
        it('空的 VisualEffect 不应该崩溃', () => {
            expect(() => VisualEffectSystem(world, 16)).not.toThrow();
        });

        it('没有 VisualEffect 实体不应该崩溃', () => {
            world.entities.clear();
            expect(() => VisualEffectSystem(world, 16)).not.toThrow();
            expect(() => spawnParticles(world, 0, 0, {
                count: 1,
                speedMin: 0,
                speedMax: 0,
                sizeMin: 2,
                sizeMax: 2,
                life: 100,
                color: '#fff'
            })).not.toThrow();
            expect(() => spawnLines(world, 800)).not.toThrow();
            expect(() => spawnCircle(world, 0, 0)).not.toThrow();
        });
    });
});
