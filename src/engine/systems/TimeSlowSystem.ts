/**
 * TimeSlowSystem (时间减速系统)
 *
 * 职责:
 * - 查询 TimeSlow 实体,设置全局 world.state.timeScale
 * - 当 TimeSlow 实体不存在时,重置 timeScale 为 1.0
 * - 管理 timeSlowLines 视觉特效的创建和清除
 *
 * 系统类型: 状态层
 * 执行顺序: P0 - 在所有系统之前执行
 */

import { TimeSlow } from '../components';
import { view, World } from '../world';
import { spawnTimeSlowLines, clearTimeSlowLines } from './VisualEffectSystem';

export function TimeSlowSystem(world: World): void {
    // 使用 view 查询 TimeSlow 实体
    const timeSlowEntities = [...view(world, [TimeSlow])];

    if (timeSlowEntities.length > 0) {
        // 存在 TimeSlow 实体: 应用减速
        const [, [timeSlow]] = timeSlowEntities[0];

        // 限制范围防止异常值
        const safeScale = Math.max(0.1, Math.min(2.0, timeSlow.scale));
        world.timeScale = safeScale;

        // 生成时间减速线条特效
        spawnTimeSlowLines(world, world.width, 20);
    } else {
        // ❗不存在 TimeSlow 实体: 重置为正常速度
        world.timeScale = 1.0;

        // 清除时间减速线条特效
        clearTimeSlowLines(world);
    }
}
