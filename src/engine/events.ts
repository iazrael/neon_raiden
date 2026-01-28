import { EntityId } from "./types";

/** 所有事件 = 纯对象，可被 JSON.stringify / 回放 / 网络同步 */
export type Event =
    | HitEvent
    | KillEvent
    | PickupEvent
    | WeaponFiredEvent
    | BossPhaseChangeEvent
    | BossSpecialEvent
    | CamShakeEvent
    | BloodFogEvent
    | LevelUpEvent
    | ComboBreakEvent
    | ScreenClearEvent
    | PlaySoundEvent
    | BerserkModeEvent
    | ComboUpgradeEvent
    | BombExplodedEvent;


/**
 * 事件类型标签（用于类型安全的过滤）
 */
export const EventTags = {
    Hit: 'Hit',
    Kill: 'Kill',
    Pickup: 'Pickup',
    WeaponFired: 'WeaponFired',
    BossPhaseChange: 'BossPhaseChange',
    BossSpecialEvent: 'BossSpecialEvent',
    CamShake: 'CamShake',
    BloodFog: 'BloodFog',
    LevelUp: 'LevelUp',
    ComboBreak: 'ComboBreak',
    ScreenClear: 'ScreenClear',
    PlaySound: 'PlaySound',
    BerserkMode: 'BerserkMode',
    ComboUpgrade: 'ComboUpgrade',
    BombExploded: 'BombExploded',
} as const;


/** 事件类型标签值的联合类型 */
export type EventTag = typeof EventTags[keyof typeof EventTags];


// ① 命中（碰撞瞬间）
export interface HitEvent {
    type: 'Hit';
    pos: { x: number; y: number }; // 命中坐标
    damage: number;                // 本次伤害值
    owner: EntityId;               // 子弹/技能 owner
    victim: EntityId;              // 被击中实体
    bloodLevel: 1 | 2 | 3;         // 飙血等级（轻/中/重）
}

// ② 击杀（HP ≤ 0）
export interface KillEvent {
    type: 'Kill';
    pos: { x: number; y: number }; // 死亡坐标
    victim: EntityId;              // 死亡实体
    killer: EntityId;              // 最后一击 owner（可为 0）
    score: number;                 // 本次击杀得分
}

// ③ 拾取（玩家碰到 PickupItem）
export interface PickupEvent {
    type: 'Pickup';
    pos: { x: number; y: number }; // 拾取坐标
    itemId: string;                // 道具/武器/Buff ID
    owner: EntityId;               // 拾取者（玩家）
}

// ④ 武器发射（每发子弹出生）
export interface WeaponFiredEvent {
    type: 'WeaponFired';
    pos: { x: number; y: number }; // 发射坐标
    weaponId: string;              // 武器配置 ID
    owner: EntityId;               // 发射者
}

// ⑤ Boss 阶段切换
export interface BossPhaseChangeEvent {
    type: 'BossPhaseChange';
    phase: number;                 // 新阶段号（1,2,3…）
    bossId: EntityId;              // Boss 实体 ID
}

// ⑤.1 Boss 特殊事件
export interface BossSpecialEvent {
    type: 'BossSpecialEvent';
    event: string;                 // 事件名称（如 'spawn_minions', 'laser_sweep'）
    bossId: EntityId;              // Boss 实体 ID
    phase: number;                 // 触发阶段（0-based）
}

// ⑥ 相机震屏
export interface CamShakeEvent {
    type: 'CamShake';
    intensity: number;             // 强度（像素）
    duration: number;              // 持续秒数
}

// ⑦ 血雾/飙血特效
export interface BloodFogEvent {
    type: 'BloodFog';
    pos: { x: number; y: number }; // 特效中心
    level: 1 | 2 | 3;              // 大/中/小
    duration: number;              // 持续秒数
}

// ⑧ 玩家升级（战机等级提升）
export interface LevelUpEvent {
    type: 'LevelUp';
    oldLevel: number;
    newLevel: number;
    source: 'pickup' | 'levelEnd' | 'shop'; // 来源
}

// ⑨ 连击中断
export interface ComboBreakEvent {
    type: 'ComboBreak';
    combo: number;                 // 中断前的连击数
    reason: 'timeout' | 'miss' | 'hit'; // 中断原因
}

// ⑩ 清屏事件
export interface ScreenClearEvent {
    type: 'ScreenClear';
}

// ⑪ 播放音效事件
export interface PlaySoundEvent {
    type: 'PlaySound';
    name: string;
}

// ⑫ 狂暴模式触发事件
export interface BerserkModeEvent {
    type: 'BerserkMode';
    pos: { x: number; y: number }; // 触发位置
}

// ⑬ 连击升级事件
export interface ComboUpgradeEvent {
    type: 'ComboUpgrade';
    pos: { x: number; y: number }; // 触发位置
    level: number;                 // 新连击等级
    name: string;                  // 连击等级名称
    color: string;                 // 视觉颜色
}

// ⑭ 炸弹爆炸
export interface BombExplodedEvent {
    type: 'BombExploded';
    pos: { x: number; y: number }; // 爆炸中心位置（玩家位置）
    playerId: number;              // 使用炸弹的玩家ID
}