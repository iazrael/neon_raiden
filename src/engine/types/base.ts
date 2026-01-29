import { GameState, ComboState } from './index';
import { Event as GameEvent } from '../events';

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
    events: GameEvent[];
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
    // 刷怪系统是否已初始化（用于赠送初始点数）
    spawnInitialized: boolean;

    // 时间缩放（用于 TIME_SLOW 等效果，1.0 = 正常速度）
    timeScale: number;

    // UI状态字段
    state?: GameState;
    maxLevelReached?: number;
    comboState?: ComboState;
}
