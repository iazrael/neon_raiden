/**
 * EffectPlayer 单元测试
 *
 * 测试特效播放器的各种功能：
 * - HitEvent 生成爆炸和飙血粒子
 * - KillEvent 生成大型爆炸和冲击波
 * - 粒子动画更新
 * - 冲击波生成和动画
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createWorld, generateId, World, addComponent } from '../../src/engine/world';
import { EffectPlayer, updateParticles, spawnShockwave } from '../../src/engine/systems/EffectPlayer';
import { Transform, Particle, Lifetime, Sprite, Shockwave, VisualEffect } from '../../src/engine/components';
import { HitEvent, KillEvent, ComboUpgradeEvent } from '../../src/engine/events';

describe('EffectPlayer', () => {
    let world: World;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
        // 创建 VisualEffect 实体（测试需要）
        const visualEffectId = generateId();
        world.visualEffectId = visualEffectId;
        addComponent(world, visualEffectId, new VisualEffect());
    });

    describe('HitEvent 处理', () => {
        it('应该在 HitEvent 时生成爆炸粒子', () => {
            const hitEvent: HitEvent = {
                type: 'Hit',
                pos: { x: 100, y: 200 },
                damage: 20,
                owner: 1,
                victim: 2,
                bloodLevel: 2
            };

            world.events.push(hitEvent);
            EffectPlayer(world, 16);

            // 验证爆炸粒子被创建（现在使用 VisualEffect 组件）
            let particleCount = 0;
            for (const [id, comps] of world.entities) {
                const effect = comps.find(VisualEffect.check);
                if (effect && effect.particles.length > 0) {
                    particleCount += effect.particles.length;
                }
            }

            expect(particleCount).toBeGreaterThan(0);
        });

        it('应该根据伤害值选择爆炸大小', () => {
            // 测试小型爆炸
            const smallHit: HitEvent = {
                type: 'Hit',
                pos: { x: 100, y: 200 },
                damage: 10,
                owner: 1,
                victim: 2,
                bloodLevel: 1
            };

            world.events.push(smallHit);
            EffectPlayer(world, 16);

            // 应该生成爆炸粒子（现在使用 VisualEffect 组件）
            let hasExplosion = false;
            for (const [id, comps] of world.entities) {
                const effect = comps.find(VisualEffect.check);
                // 检查是否有颜色为 '#ffffff' 的粒子（hit 配置的颜色）
                if (effect && effect.particles.some(p => p.color === '#ffffff')) {
                    hasExplosion = true;
                    break;
                }
            }

            expect(hasExplosion).toBe(true);
        });

        it('应该生成飙血特效', () => {
            // 飙血特效由 DamageResolutionSystem 生成 BloodFogEvent
            // EffectPlayer 处理 BloodFogEvent 生成粒子
            const bloodFogEvent = {
                type: 'BloodFog',
                pos: { x: 100, y: 200 },
                level: 2,  // medium
                duration: 0.3
            };

            world.events.push(bloodFogEvent);
            EffectPlayer(world, 16);

            // 应该生成飙血粒子（使用 Sprite 组件）
            let hasBlood = false;
            for (const [id, comps] of world.entities) {
                const particle = comps.find(Particle.check);
                // blood_medium 的颜色是 '#ff0000'
                if (particle && particle.color === '#ff0000') {
                    hasBlood = true;
                }
            }

            expect(hasBlood).toBe(true);
        });
    });

    describe('KillEvent 处理', () => {
        it('应该在 KillEvent 时生成大型爆炸', () => {
            const killEvent: KillEvent = {
                type: 'Kill',
                pos: { x: 100, y: 200 },
                victim: 2,
                killer: 1,
                score: 100
            };

            world.events.push(killEvent);
            EffectPlayer(world, 16);

            // 验证大型爆炸粒子被创建（现在使用 VisualEffect 组件）
            let particleCount = 0;
            for (const [id, comps] of world.entities) {
                const effect = comps.find(VisualEffect.check);
                if (effect && effect.particles.length > 0) {
                    particleCount += effect.particles.length;
                }
            }

            expect(particleCount).toBeGreaterThan(0);
        });

        it('应该在 KillEvent 时生成冲击波', () => {
            const killEvent: KillEvent = {
                type: 'Kill',
                pos: { x: 100, y: 200 },
                victim: 2,
                killer: 1,
                score: 100
            };

            world.events.push(killEvent);
            EffectPlayer(world, 16);

            // 验证冲击波被创建（通过 VisualEffect 组件）
            let circleCount = 0;
            for (const [id, comps] of world.entities) {
                const effect = comps.find(VisualEffect.check);
                if (effect && effect.circles.length > 0) {
                    circleCount += effect.circles.length;
                }
            }

            expect(circleCount).toBeGreaterThan(0);
        });
    });

    describe('粒子动画', () => {
        it('应该正确更新粒子帧', () => {
            const id = generateId();
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            const particle = new Particle({ frame: 0, maxFrame: 10, fps: 10 });
            const sprite = new Sprite({ spriteKey: 'particle' as any, color: '#ff0000' });
            const lifetime = new Lifetime({ timer: 1000 });

            world.entities.set(id, [transform, sprite, particle, lifetime]);

            updateParticles(world, 100); // 100ms

            // 帧应该增加
            expect(particle.frame).toBeGreaterThan(0);
        });

        it('应该在动画结束时标记粒子为销毁', () => {
            const id = generateId();
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            const particle = new Particle({ frame: 9, maxFrame: 10, fps: 10 });
            const sprite = new Sprite({ spriteKey: 'particle' as any, color: '#ff0000' });
            const lifetime = new Lifetime({ timer: 1000 });

            world.entities.set(id, [transform, sprite, particle, lifetime]);

            updateParticles(world, 200); // 超过动画结束时间

            // lifetime.timer 应该被设置为 0
            expect(lifetime.timer).toBe(0);
        });

        it('应该在动画播放完成后不增加帧', () => {
            const id = generateId();
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            const particle = new Particle({ frame: 15, maxFrame: 10, fps: 10 });
            const sprite = new Sprite({ spriteKey: 'particle' as any, color: '#ff0000' });
            const lifetime = new Lifetime({ timer: 1000 });

            world.entities.set(id, [transform, sprite, particle, lifetime]);

            updateParticles(world, 100);

            // lifetime 应该被标记为过期
            expect(lifetime.timer).toBe(0);
        });
    });

    describe('冲击波', () => {
        it('应该生成正确的冲击波圆环', () => {
            spawnShockwave(world, 100, 200, '#ff0000', 150, 5);

            // 验证 VisualEffect 组件中的圆环
            let circle = null;
            for (const [id, comps] of world.entities) {
                const effect = comps.find(VisualEffect.check);
                if (effect && effect.circles.length > 0) {
                    circle = effect.circles[0];
                    break;
                }
            }

            expect(circle).toBeDefined();
            expect(circle?.x).toBe(100);
            expect(circle?.y).toBe(200);
            expect(circle?.color).toBe('#ff0000');
            expect(circle?.maxRadius).toBe(150);
            expect(circle?.width).toBe(5);
            expect(circle?.radius).toBe(10); // 初始半径
            expect(circle?.life).toBe(1.0); // 初始生命周期
        });

        it('应该在连击升级时生成冲击波', () => {
            const comboEvent: ComboUpgradeEvent = {
                type: 'ComboUpgrade',
                pos: { x: 100, y: 200 },
                level: 2,
                name: 'Double',
                color: '#00ffff'
            };

            world.events.push(comboEvent);
            EffectPlayer(world, 16);

            // 验证冲击波被创建（通过 VisualEffect 组件）
            let circleCount = 0;
            for (const [id, comps] of world.entities) {
                const effect = comps.find(VisualEffect.check);
                if (effect && effect.circles.length > 0) {
                    circleCount += effect.circles.length;
                }
            }

            expect(circleCount).toBeGreaterThan(0);
        });

        it('应该生成带默认参数的冲击波', () => {
            spawnShockwave(world, 100, 200);

            // 验证 VisualEffect 组件中的圆环
            let circle = null;
            for (const [id, comps] of world.entities) {
                const effect = comps.find(VisualEffect.check);
                if (effect && effect.circles.length > 0) {
                    circle = effect.circles[0];
                    break;
                }
            }

            expect(circle?.color).toBe('#ffffff'); // 默认白色
            expect(circle?.maxRadius).toBe(150); // 默认最大半径
            expect(circle?.width).toBe(5); // 默认线宽
        });
    });

    describe('ComboUpgradeEvent 处理', () => {
        it('应该在连击升级时生成特效', () => {
            const comboEvent: ComboUpgradeEvent = {
                type: 'ComboUpgrade',
                pos: { x: 100, y: 200 },
                level: 2,
                name: 'Double',
                color: '#00ffff'
            };

            world.events.push(comboEvent);
            EffectPlayer(world, 16);

            // 应该生成连击升级粒子（使用 Particle 组件）
            let hasComboParticle = false;
            for (const [id, comps] of world.entities) {
                const particle = comps.find(Particle.check);
                if (particle && particle.color === '#00ffff') { // combo_upgrade 的颜色
                    hasComboParticle = true;
                }
            }

            expect(hasComboParticle).toBe(true);
        });

        it('应该在连击升级时生成冲击波', () => {
            const comboEvent: ComboUpgradeEvent = {
                type: 'ComboUpgrade',
                pos: { x: 100, y: 200 },
                level: 2,
                name: 'Double',
                color: '#00ffff'
            };

            world.events.push(comboEvent);
            EffectPlayer(world, 16);

            // 应该生成冲击波（通过 VisualEffect 组件）
            let circleCount = 0;
            for (const [id, comps] of world.entities) {
                const effect = comps.find(VisualEffect.check);
                if (effect && effect.circles.length > 0) {
                    circleCount += effect.circles.length;
                }
            }

            expect(circleCount).toBeGreaterThan(0);
        });
    });
});
