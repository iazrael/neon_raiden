// src/engine/systems/logic/bossMovement.ts

import { BossMovementPattern, Component } from '@/engine/types';
import { BossAI, Transform, TeleportState } from '@/engine/components';

// 定义移动上下文，传入计算所需的所有数据
export interface MovementContext {
    dt: number;
    time: number;           // world.time
    self: Transform;        // 自身位置
    player: { x: number, y: number }; // 玩家位置
    bossAi: BossAI;         // 用于存取内部状态 
    // 【新增】我们需要访问实体的组件列表来操作状态
    components: Component[];
}

// 定义返回值
interface MovementResult {
    dx: number;
    dy: number;
}

// 定义函数类型
type MovementHandler = (ctx: MovementContext) => MovementResult;

// ==================== 具体策略实现 ====================

const idle: MovementHandler = () => ({ dx: 0, dy: 0 });

const sine: MovementHandler = ({ time }) => ({
    dx: Math.sin(time * 2),
    dy: Math.cos(time) * 0.2
});

const figure8: MovementHandler = ({ time }) => ({
    dx: Math.cos(time),
    dy: Math.sin(time * 2) * 0.5
});

const circle: MovementHandler = ({ time, self }) => {
    const centerX = 400; // STAGE_WIDTH / 2
    const centerY = 200;
    const radius = 150;
    const targetX = centerX + Math.cos(time) * radius;
    const targetY = centerY + Math.sin(time) * radius;
    return {
        dx: (targetX - self.x) * 0.05,
        dy: (targetY - self.y) * 0.05
    };
};

const zigzag: MovementHandler = ({ time }) => {
    const zigFreq = 3.0;
    return {
        dx: Math.sign(Math.sin(time * zigFreq)),
        dy: 0
    };
};

const slowDescent: MovementHandler = ({ self }) => {
    let dy = 0.2;
    if (self.y > 200) dy = 0; // 悬停
    return { dx: 0, dy };
};

const follow: MovementHandler = ({ self, player }) => {
    const dist = player.x - self.x;
    return {
        dx: Math.sign(dist) * Math.min(Math.abs(dist) * 0.05, 1.0),
        dy: (200 - self.y) * 0.05 // 保持高度
    };
};

const dash: MovementHandler = ({ time, self, player }) => {
    const dashCycle = time % 3.0;
    if (dashCycle < 1.0) {
        // 预警跟踪
        return {
            dx: (player.x - self.x) * 0.05,
            dy: (100 - self.y) * 0.05
        };
    } else if (dashCycle < 1.5) {
        // 冲刺
        return { dx: 0, dy: 5.0 };
    } else {
        // 返回
        return { dx: 0, dy: -2.0 };
    }
};

const randomTeleport: MovementHandler = ({ dt, self, components }) => {
    // 1. 检查是否已经在瞬移中
    const tpState = components.find(TeleportState.check);

    if (tpState) {
        // === 正在瞬移中 (隐身阶段) ===
        tpState.timer -= dt;

        if (tpState.timer <= 0) {
            // --- 瞬移结束 (显形) ---
            self.x = tpState.targetX;
            self.y = tpState.targetY;

            // 移除状态组件 -> Boss 恢复正常
            const idx = components.indexOf(tpState);
            if (idx > -1) components.splice(idx, 1);
        }

        // 瞬移期间不移动
        return { dx: 0, dy: 0 };
    }
    else {
        // === 准备瞬移 ===
        // 这里控制瞬移频率，比如每 3 秒触发一次
        // 我们可以用简单的概率，或者在 BossAI 里存个 cooldown
        // 为了演示简单，这里假设 1% 概率触发 (每秒60帧约 0.6次)
        // 更好的做法是在 BossAI 加个 teleportCooldown 字段

        if (Math.random() < 0.01) {
            // --- 开始瞬移 ---
            const STAGE_WIDTH = 800;
            const targetX = 100 + Math.random() * (STAGE_WIDTH - 200);
            const targetY = 50 + Math.random() * 200;

            // 挂载组件：1秒后出现在目标位置
            components.push(new TeleportState({
                timer: 1.0, // 隐身 1 秒
                targetX: targetX,
                targetY: targetY
            }));
        }

        // 没触发瞬移时，保持静止或微动
        return { dx: 0, dy: 0 };
    }
};

const adaptive: MovementHandler = ({ time, self, player }) => {
    const dist = player.x - self.x;
    return {
        dx: Math.sign(dist) * 0.8,
        dy: Math.sin(time * 0.5) * 0.5
    };
};

const aggressive: MovementHandler = ({ self, player }) => {
    const targetY = Math.max(50, player.y - 250);
    return {
        dx: (player.x - self.x) * 0.03,
        dy: (targetY - self.y) * 0.03
    };
};

// ==================== 策略映射表 ====================

export const MOVEMENT_STRATEGIES: Record<BossMovementPattern, MovementHandler> = {
    [BossMovementPattern.IDLE]: idle,
    [BossMovementPattern.SINE]: sine,
    [BossMovementPattern.FIGURE_8]: figure8,
    [BossMovementPattern.CIRCLE]: circle,
    [BossMovementPattern.ZIGZAG]: zigzag,
    [BossMovementPattern.SLOW_DESCENT]: slowDescent,
    [BossMovementPattern.FOLLOW]: follow,
    [BossMovementPattern.TRACKING]: follow, // 复用 follow
    [BossMovementPattern.DASH]: dash,
    [BossMovementPattern.RANDOM_TELEPORT]: randomTeleport,
    [BossMovementPattern.ADAPTIVE]: adaptive,
    [BossMovementPattern.AGGRESSIVE]: aggressive,
};