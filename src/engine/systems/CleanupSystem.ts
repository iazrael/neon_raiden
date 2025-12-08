import { World } from '../types';
import { view, removeEntity } from '../world';
import { DestroyTag } from '../components';

/**
 * 清理系统
 * 统一删除带有DestroyTag的实体
 * 回收实体ID以便重用
 */
export function CleanupSystem(w: World, dt: number) {
  // 查找所有带有DestroyTag的实体并删除它们
  for (const [id, [destroyTag]] of view(w, [DestroyTag])) {
    removeEntity(w, id);
  }
  
  // 清空事件队列
  w.events.length = 0;
}