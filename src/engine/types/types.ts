import { GameState, ComboState } from './index';
import { Event } from '../events';

// 实体ID类型
export type EntityId = number;

// 组件基类
export abstract class Component { }

// 世界接口
export interface World {
    // 实体集合
    entities: Map<EntityId, Component[]>;
    // 玩家ID
    playerId: EntityId;
    // 事件队列
    events: Event[];
    // 游戏时间
    time: number;
    // 全局进度
    score: number;
    // 关卡序号
    level: number;
    // 战机等级
    playerLevel: number;
    // 动态倍率
    difficulty: number;
    // 当前余额
    spawnCredits: number;
    // 刷怪检测频率
    spawnTimer: number;
    // 当前敌人数量
    enemyCount: number;
    // 画布宽
    width: number;
    // 画布高
    height: number;

    // UI状态字段
    state?: GameState;
    maxLevelReached?: number;
    comboState?: ComboState;
}
