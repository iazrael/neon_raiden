// src/engine/systems/logic/bossMovement.ts

import { BossMovementPattern, Component } from '@/engine/types';
import { BossAI, Transform, TeleportState, SpeedStat } from '@/engine/components';

export interface MovementContext {
    dtInSeconds: number;// 时间，这里的单位是秒
    timeInSeconds: number; // 时间，这里的单位是秒
    trans: Transform;
    player: Transform;
    bossAi: BossAI;
    components: Component[];
    moveSpeed: number; // 逻辑倍率 (modifiers.moveSpeed)
    speedStat: SpeedStat;
}

// 【修改】增加 type 字段，明确告诉 System 怎么用这些数字
export interface MovementResult {
    dx: number;
    dy: number;
    type: 'velocity' | 'offset'; // velocity = 方向(-1~1), offset = 像素增量
}

type MovementHandler = (ctx: MovementContext) => MovementResult;

// ==================== 具体策略实现 ====================

const idle: MovementHandler = () => ({ dx: 0, dy: 0, type: 'velocity' });

// 运动学模式：正弦波
// 这里我们返回 velocity 方向，让 MovementSystem 去乘速度
const sine: MovementHandler = ({ timeInSeconds: time, moveSpeed }) => ({
    dx: Math.sin(time * 2) * moveSpeed, // -1 ~ 1
    dy: Math.cos(time) * 0.2 * moveSpeed,
    type: 'velocity'
});

const figure8: MovementHandler = ({ timeInSeconds: time, moveSpeed }) => ({
    dx: Math.cos(time) * moveSpeed,
    dy: Math.sin(time * 2) * 0.5 * moveSpeed,
    type: 'velocity'
});

// 绕圈：计算出目标点，然后返回这就去的“速度方向”
const circle: MovementHandler = ({ timeInSeconds: time, trans }) => {
    const centerX = 400;
    const centerY = 200;
    const radius = 150;
    const targetX = centerX + Math.cos(time * 0.5) * radius;
    const targetY = centerY + Math.sin(time * 0.5) * radius;

    // 简单的 P 控制器：向目标点移动
    const dx = targetX - trans.x;
    const dy = targetY - trans.y;

    // 归一化方向，而不是直接返回距离
    // 否则距离越远速度越快，这不符合 SpeedStat 的限制
    // 这里我们允许它稍微快一点来追赶圆周 (offset 模式)
    // 或者用 velocity 模式让它慢慢飞过去
    return {
        dx: dx * 0.05, // 这里用 offset 模式比较好控制插值感
        dy: dy * 0.05,
        type: 'offset'
    };
};

const zigzag: MovementHandler = ({ timeInSeconds: time }) => {
    const zigFreq = 3.0;
    return {
        dx: Math.sign(Math.sin(time * zigFreq)),
        dy: 0,
        type: 'velocity'
    };
};

const slowDescent: MovementHandler = ({ trans }) => {
    let dy = 0.2;
    if (trans.y > 150) dy = 0;
    return { dx: 0, dy, type: 'velocity' };
};

// 【修正】Follow 逻辑：只返回方向，不乘 SpeedStat
const follow: MovementHandler = ({ trans, player }) => {
    const dx = player.x - trans.x;
    const dy = player.y - trans.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 10) {
        return {
            dx: dx / dist, // 归一化方向
            dy: dy / dist,
            type: 'velocity'
        };
    }
    return { dx: 0, dy: 0, type: 'velocity' };
};

const dash: MovementHandler = ({ timeInSeconds: time, trans, player, moveSpeed }) => {
    const dashCycle = time % 4.0; // 4秒一个循环

    if (dashCycle < 1.5) {
        // 1. 预警跟踪 (慢速调整位置)
        return {
            dx: (player.x - trans.x) * 0.02,
            dy: (100 - trans.y) * 0.05,
            type: 'offset' // 使用 offset 微调位置
        };
    } else if (dashCycle < 2.0) {
        // 2. 蓄力 (不动)
        return { dx: 0, dy: 0, type: 'velocity' };
    } else if (dashCycle < 2.5) {
        // 3. 冲刺 (极快速度向下)
        // 这里我们可以 hack 一下，返回一个大于 1 的 velocity
        // MovementSystem 会把它限制住，或者我们可以乘 moveSpeed 倍率
        return { dx: 0, dy: 3.0 * moveSpeed, type: 'velocity' };
    } else {
        // 4. 返回上方
        return { dx: 0, dy: -1.0, type: 'velocity' };
    }
};

const randomTeleport: MovementHandler = ({ dtInSeconds: dt, trans, components }) => {
    const tpState = components.find(TeleportState.check);

    if (tpState) {
        tpState.timer -= dt;
        if (tpState.timer <= 0) {
            trans.x = tpState.targetX;
            trans.y = tpState.targetY;
            const idx = components.indexOf(tpState);
            if (idx > -1) components.splice(idx, 1);
        }
        return { dx: 0, dy: 0, type: 'velocity' };
    } else {
        if (Math.random() < 0.01) {
            const targetX = 100 + Math.random() * 600; // FIXME hardcode 了屏幕宽度
            const targetY = 50 + Math.random() * 200;
            components.push(new TeleportState({
                timer: 1.0,
                targetX: targetX,
                targetY: targetY
            }));
        }
        return { dx: 0, dy: 0, type: 'velocity' };
    }
};

const adaptive: MovementHandler = ({ timeInSeconds: time, trans, player }) => {
    const dist = player.x - trans.x;
    return {
        dx: Math.sign(dist) * 0.5,
        dy: Math.sin(time * 0.5) * 0.5,
        type: 'velocity'
    };
};

const aggressive: MovementHandler = ({ trans, player }) => {
    const targetY = Math.max(50, player.y - 250);
    return {
        dx: (player.x - trans.x) * 0.02, // 逼近
        dy: (targetY - trans.y) * 0.02,
        type: 'offset'
    };
};

// 新增移动策略

// 螺旋下降
const spiralDescent: MovementHandler = ({ timeInSeconds: time, moveSpeed }) => ({
    dx: Math.cos(time * 2) * moveSpeed,
    dy: Math.sin(time * 2) * moveSpeed + 0.5,
    type: 'velocity'
});

// 横向扫描
const horizontalScan: MovementHandler = ({ timeInSeconds: time, trans }) => {
    const scanWidth = 300;
    const centerX = 400;
    const targetX = centerX + Math.sin(time * 0.5) * scanWidth / 2;
    const dx = targetX - trans.x;

    return {
        dx: dx * 0.1,
        dy: 0,
        type: 'offset'
    };
};

// 垂直摆动
const verticalSway: MovementHandler = ({ timeInSeconds: time, moveSpeed }) => ({
    dx: Math.sin(time * 3) * moveSpeed,
    dy: Math.cos(time * 1.5) * 0.5 * moveSpeed,
    type: 'velocity'
});

// 突袭模式
const ambush: MovementHandler = ({ trans, player, timeInSeconds: time }) => {
    // 初始隐藏在屏幕上方
    if (time < 5) {
        return { dx: 0, dy: 0, type: 'velocity' };
    }

    // 突然俯冲
    const dx = player.x - trans.x;
    const dy = player.y - trans.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 50) {
        return {
            dx: (dx / dist) * 2,
            dy: (dy / dist) * 2,
            type: 'velocity'
        };
    }

    return { dx: 0, dy: 0, type: 'velocity' };
};

// 跳跃移动
const hop: MovementHandler = ({ timeInSeconds: time, trans }) => {
    const hopCycle = time % 3.0;

    if (hopCycle < 1.0) {
        // 跳跃上升
        return { dx: 0, dy: -1.0, type: 'velocity' };
    } else if (hopCycle < 2.0) {
        // 滞空
        return { dx: 0, dy: 0, type: 'velocity' };
    } else {
        // 下降
        return { dx: 0, dy: 1.0, type: 'velocity' };
    }
};

export const MOVEMENT_STRATEGIES: Record<BossMovementPattern, MovementHandler> = {
    [BossMovementPattern.IDLE]: idle,
    [BossMovementPattern.SINE]: sine,
    [BossMovementPattern.FIGURE_8]: figure8,
    [BossMovementPattern.CIRCLE]: circle,
    [BossMovementPattern.ZIGZAG]: zigzag,
    [BossMovementPattern.SLOW_DESCENT]: slowDescent,
    [BossMovementPattern.FOLLOW]: follow,
    [BossMovementPattern.TRACKING]: follow,
    [BossMovementPattern.DASH]: dash,
    [BossMovementPattern.RANDOM_TELEPORT]: randomTeleport,
    [BossMovementPattern.ADAPTIVE]: adaptive,
    [BossMovementPattern.AGGRESSIVE]: aggressive,
    [BossMovementPattern.SPIRAL_DESCENT]: spiralDescent,
    [BossMovementPattern.HORIZONTAL_SCAN]: horizontalScan,
    [BossMovementPattern.VERTICAL_SWAY]: verticalSway,
    [BossMovementPattern.AMBUSH]: ambush,
    [BossMovementPattern.HOP]: hop,
};