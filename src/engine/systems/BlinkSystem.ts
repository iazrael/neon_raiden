/**
 * 闪烁系统 - 处理闪烁效果的更新与清理
 *
 * 职责：
 * 1. 更新所有 Blink 组件的 elapsedMs
 * 2. 闪烁完成后移除组件
 */

import type { World } from '../world';
import { view, removeComponent } from '../world';
import { Blink } from '../components';

/**
 * 闪烁系统 - 更新闪烁状态并清理完成的组件
 *
 * @param world 世界对象
 * @param deltaTimeMs 增量时间（毫秒）
 */
export function BlinkSystem(world: World, deltaTimeMs: number): void {
    for (const [entityId, [blink]] of view(world, [Blink])) {
        blink.elapsedMs += deltaTimeMs;

        // 闪烁完成，移除组件
        if (blink.elapsedMs >= blink.durationMs) {
            removeComponent(world, entityId, blink);
        }
    }
}
