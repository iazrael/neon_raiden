/**
 * 清理系统 (CleanupSystem)
 *
 * 职责：
 * - 删除所有带有 DestroyTag 的实体
 * - 清空每帧的事件队列
 * - 回收实体 ID 到对象池
 *
 * 系统类型：清理层
 * 执行顺序：P8 - 最后执行
 */

import { World } from '../types';
import { DestroyTag } from '../components';
import { freeId } from '../world';

/**
 * 统计信息
 */
export interface CleanupStats {
    entitiesRemoved: number;
    eventsCleared: number;
}

/**
 * 清理统计（用于调试和性能分析）
 */
const stats: CleanupStats = {
    entitiesRemoved: 0,
    eventsCleared: 0
};

/**
 * 清理系统主函数
 * @param world 世界对象
 * @param dt 时间增量（秒）
 */
export function CleanupSystem(world: World, dt: number): void {
    let removedCount = 0;

    // 收集需要删除的实体 ID
    const toRemove: number[] = [];

    for (const [id, comps] of world.entities) {
        // 检查是否有销毁标记
        const hasDestroyTag = comps.some(c => c instanceof DestroyTag);
        if (hasDestroyTag) {
            toRemove.push(id);
        }
    }

    // 删除标记的实体
    for (const id of toRemove) {
        const comps = world.entities.get(id);
        if (comps) {
            // 处理对象池回收（如果有 reusePool 属性）
            const destroyTag = comps.find(c => c instanceof DestroyTag) as DestroyTag | undefined;
            if (destroyTag?.reusePool) {
                // TODO: 回收到对象池
                // 目前简单处理：直接删除
            }

            // 回收 ID
            freeId(id);
        }

        // 从实体集合中删除
        world.entities.delete(id);
        removedCount++;

        // 如果删除的是玩家，更新 playerId
        if (id === world.playerId) {
            world.playerId = 0;
        }
    }

    // 更新统计
    stats.entitiesRemoved = removedCount;

    // 清空事件队列（必须在最后执行）
    const eventsCleared = world.events.length;
    world.events.length = 0;
    stats.eventsCleared = eventsCleared;
}

/**
 * 获取清理统计
 */
export function getCleanupStats(): CleanupStats {
    return { ...stats };
}

/**
 * 重置清理统计
 */
export function resetCleanupStats(): void {
    stats.entitiesRemoved = 0;
    stats.eventsCleared = 0;
}

/**
 * 手动标记实体销毁
 * @param world 世界对象
 * @param entityId 实体 ID
 * @param reason 销毁原因
 */
export function destroyEntity(world: World, entityId: number, reason: DestroyTag['reason'] = 'killed'): void {
    const comps = world.entities.get(entityId);
    if (!comps) return;

    // 检查是否已有销毁标记
    const hasDestroyTag = comps.some(c => c instanceof DestroyTag);
    if (!hasDestroyTag) {
        comps.push(new DestroyTag({ reason }));
    }
}

/**
 * 批量销毁实体
 * @param world 世界对象
 * @param entityIds 实体 ID 数组
 * @param reason 销毁原因
 */
export function destroyEntities(world: World, entityIds: number[], reason: DestroyTag['reason'] = 'killed'): void {
    for (const id of entityIds) {
        destroyEntity(world, id, reason);
    }
}
