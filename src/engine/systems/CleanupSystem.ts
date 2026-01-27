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
import { freeId, removeEntity, view } from '../world';

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
 * @param dt 时间增量（毫秒）
 */
export function CleanupSystem(world: World, dt: number): void {
    let removedCount = 0;
    // 查找所有带有DestroyTag的实体并删除它们
    for (const [id, [destroyTag]] of view(world, [DestroyTag])) {
        removeEntity(world, id);
        removedCount++;
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
    const hasDestroyTag = comps.some(DestroyTag.check);
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
