import { Event } from '../events';
export * from './consts'
export * from './types'

// ========== 基础类型 ==========
/** 实体ID类型 */
export type EntityId = number;

/** 组件基类 */
export abstract class Component { }

/** 组件构造函数 */
export type ComponentConstructor = new (...args: any[]) => Component;


// ========== 世界接口 ==========
/** 世界接口 */
export interface World {
    /** 实体集合 */
    entities: Map<EntityId, Component[]>;
    /** 玩家ID */
    playerId: EntityId;
    /** 事件队列 */
    events: Event[];
    time: number;
    // 全局进度
    score: number;        
    level: number;        // 关卡序号
    playerLevel: number;  // 战机等级
    difficulty: number;   // 动态倍率
}



