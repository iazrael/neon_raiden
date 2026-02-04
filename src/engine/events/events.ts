import { BossId, EntityId } from "../types";
import { BaseEvent } from "./base";


// ① 命中（碰撞瞬间）
export interface HitEvent extends BaseEvent<'Hit'> {
  pos: { x: number; y: number }; // 命中坐标
  damage: number;                // 本次伤害值
  owner: EntityId;               // 子弹/技能 owner
  victim: EntityId;              // 被击中实体
}

// ② 击杀（HP ≤ 0）
export interface KillEvent extends BaseEvent<'Kill'> {
  pos: { x: number; y: number }; // 死亡坐标
  victim: EntityId;              // 死亡实体
  killer: EntityId;              // 最后一击 owner（可为 0）
  score: number;                 // 本次击杀得分
}

// ③ 拾取（玩家碰到 PickupItem）
export interface PickupEvent extends BaseEvent<'Pickup'> {
  pos: { x: number; y: number }; // 拾取坐标
  itemId: string;                // 道具/武器/Buff ID
  owner: EntityId;               // 拾取者（玩家）
}

// ④ 武器发射（每发子弹出生）
export interface WeaponFiredEvent extends BaseEvent<'WeaponFired'> {
  pos: { x: number; y: number }; // 发射坐标
  weaponId: string;              // 武器配置 ID
  owner: EntityId;               // 发射者
}

// ⑤ Boss 阶段切换
export interface BossPhaseChangeEvent extends BaseEvent<'BossPhaseChange'> {
  phase: number;                 // 新阶段号（1,2,3…）
  bossId: EntityId;              // Boss 实体 ID
}

// ⑤.1 Boss 特殊事件
export interface BossSpecialEvent extends BaseEvent<'BossSpecialEvent'> {
  event: string;                 // 事件名称（如 'spawn_minions', 'laser_sweep'）
  bossId: EntityId;              // Boss 实体 ID
  phase: number;                 // 触发阶段（0-based）
}

// ⑥ 相机震屏
export interface CamShakeEvent extends BaseEvent<'CamShake'> {
  intensity: number;             // 强度（像素）
  duration: number;              // 持续毫秒
}

// ⑦ 血雾/飙血特效
export interface BloodFogEvent extends BaseEvent<'BloodFog'> {
  pos: { x: number; y: number }; // 特效中心
  level: 1 | 2 | 3;              // 大/中/小
  duration: number;              // 持续毫秒
}

// ⑧ 玩家升级（战机等级提升）
export interface LevelUpEvent extends BaseEvent<'LevelUp'> {
  oldLevel: number;
  newLevel: number;
  source: 'pickup' | 'levelEnd' | 'shop'; // 来源
}

// ⑨ 连击中断
export interface ComboBreakEvent extends BaseEvent<'ComboBreak'> {
  combo: number;                 // 中断前的连击数
  reason: 'timeout' | 'miss' | 'hit'; // 中断原因
}

// ⑩ 清屏事件
export interface ScreenClearEvent extends BaseEvent<'ScreenClear'> {
  // 无额外字段
}

// ⑪ 播放音效事件
export interface PlaySoundEvent extends BaseEvent<'PlaySound'> {
  name: string;
}

// ⑫ 狂暴模式触发事件
export interface BerserkModeEvent extends BaseEvent<'BerserkMode'> {
  pos: { x: number; y: number }; // 触发位置
}

// ⑬ 连击升级事件
export interface ComboUpgradeEvent extends BaseEvent<'ComboUpgrade'> {
  pos: { x: number; y: number }; // 触发位置
  level: number;                 // 新连击等级
  name: string;                  // 连击等级名称
  color: string;                 // 视觉颜色
}

// ⑭ 炸弹爆炸
export interface BombExplodedEvent extends BaseEvent<'BombExploded'> {
  pos: { x: number; y: number }; // 爆炸中心位置（玩家位置）
  playerId: number;              // 使用炸弹的玩家ID
}

// ⑮ 武器特效事件
export interface WeaponEffectEvent extends BaseEvent<'WeaponEffect'> {
  pos: { x: number; y: number }; // 特效位置
  weaponType: string;            // 武器类型
  effectType: 'explosion' | 'chain' | 'burn' | 'bounce'; // 特效类型
}

// ⑯ 护盾破碎特效事件
export interface ShieldBrokenEvent extends BaseEvent<'ShieldBroken'> {
  pos: { x: number; y: number }; // 护盾破碎位置
  owner: EntityId;               // 护盾 owner
}

// ⑰ 时间减速事件
export interface TimeSlowEvent extends BaseEvent<'TimeSlow'> {
  scale: number;                 // 时间缩放比例
  duration: number;              // 持续毫秒
  action: 'start' | 'update' | 'end';       // 开始或结束
}

// ⑱ 连锁闪电事件
export interface ChainLightningEvent extends BaseEvent<'ChainLightning'> {
  fromX: number;                 // 起点 X 坐标
  fromY: number;                 // 起点 Y 坐标
  toId: number;                  // 目标实体 ID
  count: number;                 // 剩余连锁次数
  range: number;                 // 连锁搜索范围
  damage: number;                // 伤害值
  chainedIds: Set<number>;       // 已连锁的实体 ID 集合（避免重复）
}

// ⑲ 游戏胜利事件
export interface VictoryEvent extends BaseEvent<'Victory'> {
  // 无额外字段
}

// ⑳ 游戏失败事件
export interface DefeatEvent extends BaseEvent<'Defeat'> {
  // 无额外字段
}

// ㉒ Boss 击杀事件
export interface BossDefeatEvent extends BaseEvent<'BossDefeat'> {
  bossId: BossId;  // Boss 类型
}

// ㉓ Boss 进场开始事件
export interface BossEntranceStartEvent extends BaseEvent<'BossEntranceStart'> {
  bossId: BossId;      // Boss 类型
  entityId: EntityId;  // Boss 实体 ID
}

// ㉔ Boss 进场完成事件
export interface BossEntranceCompleteEvent extends BaseEvent<'BossEntranceComplete'> {
  bossId: BossId;      // Boss 类型
  entityId: EntityId;  // Boss 实体 ID
}

// ㉕ 子弹反弹事件
export interface BulletBouncedEvent extends BaseEvent<'BulletBounced'> {
    pos: { x: number; y: number }; // 反弹位置
    entityId: EntityId;            // 子弹实体 ID
}
