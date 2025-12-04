import { ComboState } from '@/game/systems/ComboSystem';
import { SynergyConfig } from '@/game/systems/WeaponSynergySystem';
import { GameState, WeaponType } from '@/types';
import * as Components from '../components';
export * from './sprite'

// ========== 基础类型 ==========
/** 实体ID类型 */
export type EntityId = number;

/** 组件基类 */
export abstract class Component { }

/** 组件类型 */
export type ComponentType = new (...args: any[]) => Component;

// ========== Blueprint 类型 ==========

// /** 蓝图类型 - 组件映射 */
// export type Blueprint = Partial<{
//   [K in keyof typeof Components]: ConstructorParameters<typeof Components[K]>;
// }>;

export type Blueprint = Partial<{
    [K in keyof typeof Components]: ComponentShape<typeof Components[K]>;
}>;

/** 把组件类映射成它自己的对象形状 */
type ComponentShape<T> = T extends new (arg: infer P) => any
    ? P extends any[]              // 是元组？
    ? never                      // 禁止元组，强制用对象
    : P                          // 返回对象本身
    : never;

// ========== 世界接口 ==========
/** 世界接口 */
export interface World {
    /** 实体集合 */
    entities: Map<EntityId, Component[]>;
    /** 玩家ID */
    playerId: EntityId;
    /** 事件队列 */
    events: Event[];
    // 全局进度
    score: number;        
    level: number;        // 关卡序号
    playerLevel: number;  // 战机等级
    difficulty: number;   // 动态倍率
}



