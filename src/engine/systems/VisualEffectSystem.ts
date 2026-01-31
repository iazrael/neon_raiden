/**
 * 视觉特效系统 (VisualEffectSystem)
 *
 * 职责：
 * - 提供统一的特效创建 API（spawnParticles、spawnTimeSlowLines、clearTimeSlowLines、spawnCircle）
 * - 更新 VisualEffect 组件中的所有特效数据
 * - 更新粒子位置、生命周期
 * - 更新线条位置
 * - 更新圆环动画
 * - 清理过期的特效数据
 *
 * 系统类型：表现层
 * 执行顺序：P7 - 在 DamageResolutionSystem 之后，RenderSystem 之前
 */

import { World, getComponents, view } from "../world";
import {
    VisualEffect,
    VisualParticle,
    VisualLine,
    VisualCircle,
} from "../components/visual";
import { ParticleEffectConfig } from "../blueprints/effects";

// ========== 创建 API ==========

/**
 * 生成粒子特效
 * @param world 世界对象
 * @param x X 坐标
 * @param y Y 坐标
 * @param count 粒子数量
 * @param config 粒子配置
 */
export function spawnParticles(
    world: World,
    x: number,
    y: number,
    config: ParticleEffectConfig,
): void {
    const [effect] = getComponents(world, world.visualEffectId, [VisualEffect]);
    if (!effect) {
        return;
    }
    for (let i = 0; i < config.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speedMin = config.speedMin;
        const speedMax = config.speedMax;
        const speed = speedMin + Math.random() * (speedMax - speedMin);
        const size =
            config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin);
        effect.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: config.life,
            maxLife: config.life,
            color: config.color,
            size: size,
        });
    }
}

/**
 * 生成时间减速线条
 * @param world 世界对象
 * @param width 画布宽度
 * @param maxHeight 最大数量
 */
export function spawnLines(
    world: World,
    width: number,
    maxHeight: number = 20,
): void {
    const [effect] = getComponents(world, world.visualEffectId, [VisualEffect]);
    if (!effect) {
        return;
    }
    // 补充到最大数量
    while (effect.lines.length < maxHeight) {
        effect.lines.push({
            x: Math.random() * width,
            y: -50,
            length: Math.random() * 100 + 50,
            speed: Math.random() * 5 + 2,
            alpha: Math.random() * 0.5 + 0.2,
        });
    }
}

/**
 * 清空时间减速线条
 * @param world 世界对象
 */
export function clearLines(world: World): void {
    const [effect] = getComponents(world, world.visualEffectId, [VisualEffect]);
    if (!effect) {
        return;
    }
    effect.lines = [];
}

/**
 * 生成冲击波圆环
 * @param world 世界对象
 * @param x X 坐标
 * @param y Y 坐标
 * @param color 颜色
 * @param maxRadius 最大半径
 * @param width 线宽
 */
export function spawnCircle(
    world: World,
    x: number,
    y: number,
    color: string = "#ffffff",
    maxRadius: number = 150,
    width: number = 5,
): void {
    const [effect] = getComponents(world, world.visualEffectId, [VisualEffect]);
    if (!effect) {
        return;
    }
    effect.circles.push({
        x,
        y,
        radius: 10,
        maxRadius,
        life: 1.0,
        color,
        width,
    });
}

// ========== 更新逻辑 ==========

/**
 * 更新粒子位置和生命周期
 */
function updateParticles(particles: VisualParticle[], dt: number): void {
    const timeScale = dt / (1000 / 60); // 60 fps

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // 更新位置
        p.x += p.vx * timeScale;
        p.y += p.vy * timeScale;

        // 更新生命周期
        p.life -= dt;

        // 清理过期粒子
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

/**
 * 更新线条位置
 */
function updateLines(lines: VisualLine[], height: number, dt: number): void {
    const timeScale = dt / (1000 / 60); // 60 fps

    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];

        // 更新位置
        line.y += line.speed * timeScale;

        // 清理超出屏幕的线条
        if (line.y > height + 100) {
            lines.splice(i, 1);
        }
    }
}

/**
 * 更新圆环动画
 */
function updateCircles(circles: VisualCircle[], dt: number): void {
    const timeScale = dt / (1000 / 60); // 60 fps

    for (let i = circles.length - 1; i >= 0; i--) {
        const circle = circles[i];

        // 更新半径（缓动接近最大半径）
        circle.radius += (circle.maxRadius - circle.radius) * 0.1 * timeScale;

        // 更新生命周期
        circle.life -= 0.02 * timeScale;

        // 清理过期圆环
        if (circle.life <= 0) {
            circles.splice(i, 1);
        }
    }
}

/**
 * 视觉特效系统主函数
 */
export function VisualEffectSystem(world: World, dt: number): void {
    const height = world.height;
    const [effect] = getComponents(world, world.visualEffectId, [VisualEffect]);
    if (!effect) {
        return;
    }
    // 更新粒子
    if (effect.particles.length > 0) {
        updateParticles(effect.particles, dt);
    }

    // 更新线条
    if (effect.lines.length > 0) {
        updateLines(effect.lines, height, dt);
    }

    // 更新圆环
    if (effect.circles.length > 0) {
        updateCircles(effect.circles, dt);
    }
}
