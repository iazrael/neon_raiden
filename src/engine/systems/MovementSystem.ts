import { Transform, Velocity, MoveIntent, SpeedStat, PlayerTag } from '../components';
import { World } from '../types';
import { view } from '../world';

// TODO 假设宽度限制 800
const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 1200;

/**
 * 移动系统
 * 1. 消费 MoveIntent：根据 SpeedStat 计算目标速度 或 直接应用位移
 * 2. 应用物理：根据 Velocity 更新 Transform
 * 3. 边界限制：防止玩家跑出屏幕
 */
export function MovementSystem(w: World, dt: number) {
    // dt 通常是毫秒，转换为秒用于物理计算
    const dtSeconds = dt / 1000;

    // ==========================================
    // 1. 处理 "速度模式" (键盘/手柄)
    // 依赖: Velocity (存速度), MoveIntent (存意图), SpeedStat (存数值)
    // ==========================================
    for (const [id, [vel, intent, stat]] of view(w, [Velocity, MoveIntent, SpeedStat])) {

        // 只处理速度类型的意图
        if (intent.type === 'velocity') {
            let dx = intent.dx;
            let dy = intent.dy;

            // 归一化向量 (解决对角线移动比直线快的问题)
            // 如果长度 > 1 (例如两个键同时按)，则除以长度
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 1) {
                dx /= len;
                dy /= len;
            }

            // 【关键点】应用 SpeedStat.maxLinear
            // 目标速度 = 方向 * 最大速度
            vel.vx = dx * stat.maxLinear;
            vel.vy = dy * stat.maxLinear;

            // 处理角速度 (如果有旋转逻辑)
            // vel.vrot = ...
        }
    }
    // ==========================================
    // 2. 处理 "位移模式" (触摸/鼠标拖拽)
    // 依赖: Transform (改坐标), MoveIntent (存位移)
    // 这里的意图是 "绝对像素偏移"，不依赖 SpeedStat 和 dt
    // ==========================================
    for (const [id, [tr, intent]] of view(w, [Transform, MoveIntent])) {

        if (intent.type === 'offset') {
            // 直接应用 InputSystem 计算好的像素增量
            tr.x += intent.dx;
            tr.y += intent.dy;

            // 如果有速度组件，在触摸移动时应将速度归零，防止切回键盘时有惯性残留
            const vel = w.entities.get(id)?.find(c => c instanceof Velocity) as Velocity;
            if (vel) {
                vel.vx = 0;
                vel.vy = 0;
            }
        }
    }

    // ==========================================
    // 3. 物理积分 (位置 += 速度 * 时间)
    // 依赖: Transform, Velocity
    // ==========================================
    for (const [id, [tr, vel]] of view(w, [Transform, Velocity])) {
        tr.x += vel.vx * dtSeconds;
        tr.y += vel.vy * dtSeconds;

        // ==========================================
        // 4. 边界限制 (仅针对玩家)
        // ==========================================
        // 检查是否有 PlayerTag
        const isPlayer = w.entities.get(id)?.some(PlayerTag.check);

        if (isPlayer) {
            // TODO 假设飞船半径大概 24，留一点边距
            const margin = 24;

            // 左右边界
            if (tr.x < margin) tr.x = margin;
            if (tr.x > STAGE_WIDTH - margin) tr.x = STAGE_WIDTH - margin;

            // 上下边界
            if (tr.y < margin) tr.y = margin;
            if (tr.y > STAGE_HEIGHT - margin) tr.y = STAGE_HEIGHT - margin;
        }
    }
}