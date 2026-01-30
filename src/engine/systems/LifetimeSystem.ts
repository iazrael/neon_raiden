/**
 * 生命周期系统 (LifetimeSystem)
 *
 * 职责：
 * - 管理实体的生命周期
 * - 当 Lifetime 组件的 timer 倒计时结束时，标记实体为销毁
 * - 移除飞出屏幕的实体（基于销毁标记）
 *
 * 系统类型：清理层
 * 执行顺序：P7 - 在 CleanupSystem 之前
 */

import { World } from '../world';
import { Lifetime, DestroyTag } from '../components';
import { addComponent, view } from '../world';

/**
 * 生命周期系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function LifetimeSystem(world: World, dt: number): void {
    for (const [id, [lifetime]] of view(world, [Lifetime])) {
        // 更新倒计时（timer 单位现在是毫秒，dt 也是毫秒，直接相减）
        lifetime.timer -= dt;

        // 倒计时结束，标记为销毁
        if (lifetime.timer <= 0) {
            // 添加销毁标记
            addComponent(world, id, new DestroyTag({ reason: 'timeout' }));
        }
    }
}
