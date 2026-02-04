/**
 * 导弹索敌视觉验证工具
 *
 * 用于开发时验证导弹的精灵图是否正确朝向目标
 * 可以在浏览器控制台中调用这些函数来输出调试信息
 */

import { World, view } from '../world';
import { Transform, Velocity, Homing } from '../components';

/**
 * 验证导弹旋转角度是否正确
 * @param world 世界对象
 * @returns 验证结果的数组
 */
export function verifyMissileRotation(world: World): MissileRotationInfo[] {
    const results: MissileRotationInfo[] = [];

    for (const [id, [transform, velocity, homing]] of view(world, [Transform, Velocity, Homing])) {
        const info: MissileRotationInfo = {
            entityId: id,
            hasTarget: homing.targetId !== undefined,
            targetId: homing.targetId,
            // 速度方向（弧度）
            velocityAngle: Math.atan2(velocity.vy, velocity.vx),
            // 精灵旋转角度（弧度）
            spriteRotation: transform.rot,
            // 期望的精灵旋转角度 = 速度角度 + 90度偏移
            expectedRotation: Math.atan2(velocity.vy, velocity.vx) + Math.PI / 2,
            // 偏差（弧度）
            deviation: 0,
            isCorrect: false
        };

        // 计算偏差
        info.deviation = Math.abs(info.spriteRotation - info.expectedRotation);

        // 归一化偏差到 [-PI, PI]
        while (info.deviation > Math.PI) info.deviation -= Math.PI * 2;
        while (info.deviation < -Math.PI) info.deviation += Math.PI * 2;

        // 判断是否正确（允许0.1弧度的误差）
        info.isCorrect = Math.abs(info.deviation) < 0.1;

        results.push(info);
    }

    return results;
}

/**
 * 在控制台输出导弹旋转验证结果
 * @param world 世界对象
 */
export function logMissileRotation(world: World): void {
    const results = verifyMissileRotation(world);

    console.group('🚀 导弹旋转角度验证');
    console.log(`共 ${results.length} 枚导弹`);

    let correctCount = 0;
    let incorrectCount = 0;

    results.forEach((info, index) => {
        const status = info.isCorrect ? '✅' : '❌';
        const targetInfo = info.hasTarget ? `→ 目标#${info.targetId}` : '(无目标)';

        if (info.isCorrect) {
            correctCount++;
        } else {
            incorrectCount++;
            console.warn(
                `${status} 导弹#${info.entityId} ${targetInfo}\n` +
                `  速度方向: ${(info.velocityAngle * 180 / Math.PI).toFixed(1)}°\n` +
                `  精灵旋转: ${(info.spriteRotation * 180 / Math.PI).toFixed(1)}°\n` +
                `  期望旋转: ${(info.expectedRotation * 180 / Math.PI).toFixed(1)}°\n` +
                `  偏差: ${(info.deviation * 180 / Math.PI).toFixed(1)}°`
            );
        }
    });

    console.log(`\n✅ 正确: ${correctCount} | ❌ 错误: ${incorrectCount}`);
    console.groupEnd();
}

/**
 * 导弹旋转信息
 */
export interface MissileRotationInfo {
    /** 实体ID */
    entityId: number;
    /** 是否有目标 */
    hasTarget: boolean;
    /** 目标实体ID */
    targetId?: number;
    /** 速度方向（弧度） */
    velocityAngle: number;
    /** 精灵旋转角度（弧度） */
    spriteRotation: number;
    /** 期望的精灵旋转角度（弧度） */
    expectedRotation: number;
    /** 偏差（弧度） */
    deviation: number;
    /** 是否正确（偏差<0.1弧度） */
    isCorrect: boolean;
}

/**
 * 在浏览器中创建可视化调试层
 * 这个函数会在屏幕上绘制导弹的朝向线，帮助视觉验证
 * @param world 世界对象
 * @param canvas 画布元素（可选，会自动创建）
 */
export function createVisualDebugLayer(world: World, canvas?: HTMLCanvasElement): void {
    // 如果没有提供canvas，创建一个覆盖整个屏幕的
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 设置绘制样式
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.lineWidth = 2;

    // 绘制每枚导弹的朝向
    for (const [id, [transform, velocity, homing]] of view(world, [Transform, Velocity, Homing])) {
        const x = transform.x;
        const y = transform.y;

        // 计算速度方向
        const velocityAngle = Math.atan2(velocity.vy, velocity.vx);

        // 计算精灵朝向
        const spriteAngle = transform.rot;

        // 绘制速度方向线（蓝色）
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(velocityAngle) * 40, y + Math.sin(velocityAngle) * 40);
        ctx.stroke();

        // 绘制精灵朝向线（黄色）
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(spriteAngle - Math.PI / 2) * 40, y + Math.sin(spriteAngle - Math.PI / 2) * 40);
        ctx.stroke();

        // 如果有目标，绘制连线（绿色）
        if (homing.targetId !== undefined) {
            const targetEntity = world.entities.get(homing.targetId);
            if (targetEntity) {
                const targetTransform = targetEntity.find(c => c instanceof Transform);
                if (targetTransform) {
                    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(targetTransform.x, targetTransform.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }
        }
    }
}

/**
 * 为全局window对象添加调试函数（仅在开发环境）
 */
export function setupGlobalDebugFunctions(world: World): void {
    if (typeof window === 'undefined') return;

    (window as any).debugMissiles = {
        // 验证并输出导弹旋转信息
        verify: () => logMissileRotation(world),

        // 创建可视化调试层
        visualize: () => createVisualDebugLayer(world),

        // 清除可视化调试层
        clear: () => {
            const canvas = document.querySelector('canvas[style*="z-index: 9999"]');
            if (canvas) canvas.remove();
        }
    };

    console.log('🚀 导弹调试函数已加载！');
    console.log('  - debugMissiles.verify()  : 在控制台输出导弹旋转信息');
    console.log('  - debugMissiles.visualize(): 在屏幕上绘制导弹朝向线');
    console.log('  - debugMissiles.clear()    : 清除可视化调试层');
}
