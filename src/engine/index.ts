/**
 * ECS 游戏引擎 - 入口文件
 *
 * 这个文件导出所有公共 API，供 React 应用使用。
 */

// ========== 核心引擎 ==========
export { Engine } from './engine';
export { ReactEngine } from './ReactEngine';

// ========== 世界与组件 ==========
export * from './world';
export { Component } from './types/base';
export type { World, EntityId } from './types/base';
export * from './types/ids';
export * from './types/index';
export * from './components';

// ========== 系统 ==========
export * from './systems';

// ========== 蓝图与工厂 ==========
export * from './blueprints';
export * from './factory';

// ========== 快照 ==========
export { buildSnapshot } from './snapshot';
export type { GameSnapshot } from './snapshot';

// ========== 渲染支持 ==========
export { SpriteRenderer } from './SpriteRenderer';
export type { CachedSprite } from './SpriteRenderer';

// ========== 事件 ==========
export * from './events';
