/**
 * 游戏系统导出
 *
 * 系统按执行顺序分组：
 * - P1 决策层 (输入与AI)
 * - P2 状态层 (数值更新)
 * - P3 物理层 (位移)
 * - P4 交互层 (核心碰撞)
 * - P5 结算层 (事件处理)
 * - P6 刷怪层 (生成与AI)
 * - P7 表现层 (渲染与音效)
 * - P8 清理层 (生命周期)
 */

export { TimeSlowSystem } from "./TimeSlowSystem";

// P1: 决策层
export { InputSystem } from "./InputSystem";
export { EnemySystem } from "./EnemySystem";
export { AISteerSystem } from "./AISteerSystem";

// P2: 状态层
export { BuffSystem } from "./BuffSystem";
export { WeaponSynergySystem } from "./WeaponSynergySystem";
export { WeaponSystem } from "./WeaponSystem";

// P3: 物理层
export { MovementSystem } from "./MovementSystem";

// P4: 交互层
export { CollisionSystem } from "./CollisionSystem";
export { BombSystem } from "./BombSystem";

// P5: 结算层
export { DamageResolutionSystem } from "./DamageResolutionSystem";
export { PickupSystem } from "./PickupSystem";
export { LootSystem } from "./LootSystem";
export {
    ComboSystem,
    getComboScoreMultiplier,
    getComboDamageMultiplier,
    resetWorldCombo,
} from "./ComboSystem";

// P6: 刷怪层
export {
    SpawnSystem,
    resetBossSpawnState,
    setBossSpawnTime,
} from "./SpawnSystem";
export { BossSystem } from "./BossSystem";
// export { BossPhaseSystem, resetBossPhases, removeBossPhase } from './BossPhaseSystem';
export {
    DifficultySystem,
    resetDifficulty,
    getDifficultyConfig,
    getEliteChance,
    getEnemyMultipliers,
} from "./DifficultySystem";

// P7: 表现层
export * from "./CameraSystem";
export {
    VisualEffectSystem,
    spawnParticles,
    spawnLines as spawnTimeSlowLines,
    clearLines as clearTimeSlowLines,
    spawnCircle,
} from "./VisualEffectSystem";
export { EffectPlayer, updateParticles } from "./EffectPlayer";
export { AudioSystem } from "./AudioSystem";
export * from "./RenderSystem";

// P8: 清理层
export { LifetimeSystem } from "./LifetimeSystem";
export {
    CleanupSystem,
    destroyEntity,
    destroyEntities,
    getCleanupStats,
    resetCleanupStats,
} from "./CleanupSystem";
