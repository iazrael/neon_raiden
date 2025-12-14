import { Event } from '@/engine/events';
export * from './ids'
export * from './types'

// ========== 基础类型 ==========
/** 实体ID类型 */
export type EntityId = number;

/** 组件基类 */
export abstract class Component { }

// ========== 世界接口 ==========
/** 世界接口 */
export interface World {
    /** 实体集合 */
    entities: Map<EntityId, Component[]>;
    /** 玩家ID */
    playerId: EntityId;
    /** 事件队列 */
    events: Event[];
    time: number;   // 当前时间
    score: number;  // 全局进度
    level: number;  // 关卡序号
    playerLevel: number;  // 战机等级
    difficulty: number;   // 动态倍率
    spawnCredits: number; // 当前余额
    spawnTimer: number;   // 用来控制刷怪检测频率
    enemyCount: number;   // 当前敌人数量
    width: number;        // 画布宽
    height: number;       // 画布高
}



