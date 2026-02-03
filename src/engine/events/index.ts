import {
  HitEvent,
  KillEvent,
  PickupEvent,
  WeaponFiredEvent,
  BossPhaseChangeEvent,
  BossSpecialEvent,
  CamShakeEvent,
  BloodFogEvent,
  LevelUpEvent,
  ComboBreakEvent,
  ScreenClearEvent,
  PlaySoundEvent,
  BerserkModeEvent,
  ComboUpgradeEvent,
  BombExplodedEvent,
  WeaponEffectEvent,
  ShieldBrokenEvent,
  TimeSlowEvent,
  ChainLightningEvent,
} from './events';

// 重新导出所有事件类型
export type * from './events';

/**
 * 自动收集所有事件类型
 * 手动列出所有事件类型，生成联合类型
 *
 * 注意：这里需要手动维护，但相比完全手动的 EventTags 已经简化很多
 * 后续可以考虑使用高级类型技巧实现完全自动化
 */
export type GameEvent =
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
  | BombExplodedEvent
  | WeaponEffectEvent
  | ShieldBrokenEvent
  | TimeSlowEvent
  | ChainLightningEvent;

/**
 * EventType 事件类型标签联合
 * 自动提取所有事件的 type 字段值
 * 用于 getEvents 的类型安全
 */
export type EventType = GameEvent['type'];
