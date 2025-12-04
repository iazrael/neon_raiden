import { World } from '../types';
import { view, removeEntity } from '../world';

/**
 * 清理系统
 * 统一删除带有DestroyTag的实体
 * 回收实体ID以便重用
 */
export function CleanupSystem(w: World, dt: number) {
  // TODO: 实现清理系统逻辑
  // 统一删除带有DestroyTag的实体
  // 回收实体ID以便重用

  w.events.length = 0;

}