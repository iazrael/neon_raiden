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

import { World } from '../types';
import { Lifetime, Transform, DestroyTag, PlayerTag } from '../components';

/**
 * 生命周期系统主函数
 * @param world 世界对象
 * @param dt 时间增量（秒）
 */
export function LifetimeSystem(world: World, dt: number): void {
    for (const [id, comps] of world.entities) {
        // 获取生命周期组件
        const lifetime = comps.find(Lifetime.check) as Lifetime | undefined;

        if (lifetime) {
            // 更新倒计时
            lifetime.timer -= dt;

            // 倒计时结束，标记为销毁
            if (lifetime.timer <= 0) {
                // 检查是否已有销毁标记
                const hasDestroyTag = comps.some(DestroyTag.check);

                if (!hasDestroyTag) {
                    // 添加销毁标记
                    comps.push(new DestroyTag({ reason: 'timeout' }));
                }
            }
        }

        // 检查是否飞出屏幕太远（自动销毁）
        const transform = comps.find(Transform.check) as Transform | undefined;
        if (transform) {
            const margin = 200; // 屏幕外200像素

            // 如果实体飞出屏幕太远，标记为销毁
            if (
                transform.x < -margin ||
                transform.x > world.width + margin ||
                transform.y < -margin ||
                transform.y > world.height + margin
            ) {
                // 玩家不检查边界
                const isPlayer = comps.some(PlayerTag.check);
                if (!isPlayer) {
                    const hasDestroyTag = comps.some(DestroyTag.check);
                    if (!hasDestroyTag) {
                        comps.push(new DestroyTag({ reason: 'offscreen' }));
                    }
                }
            }
        }
    }
}
