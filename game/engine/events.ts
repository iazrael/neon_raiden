export enum CollisionEventType {
  BulletHitEnemy = 'bullet_hit_enemy',
  BulletHitBoss = 'bullet_hit_boss',
  EnemyBulletHitPlayer = 'enemy_bullet_hit_player',
  PowerupCollected = 'powerup_collected',
  PlayerCollideEnemy = 'player_collide_enemy',
  PlayerCollideBoss = 'player_collide_boss'
}

export enum CombatEventTypeBus {
  WeaponFired = 'weapon_fired',
  ExplosionCreated = 'explosion_created',
  ShieldChanged = 'shield_changed',
  PlayerDamaged = 'player_damaged',
  EnemyKilled = 'enemy_killed',
  BossKilled = 'boss_killed'
}

export enum LevelEventType {
  LevelStarted = 'level_started',
  LevelProgress = 'level_progress',
  BossWarning = 'boss_warning',
  BossSpawned = 'boss_spawned',
  LevelCompleted = 'level_completed',
  Victory = 'victory'
}

export type EventPayloads = {
  [CollisionEventType.BulletHitEnemy]: { bullet: import('@/types').Entity; enemy: import('@/types').Entity };
  [CollisionEventType.BulletHitBoss]: { bullet: import('@/types').Entity; boss: import('@/types').Entity };
  [CollisionEventType.EnemyBulletHitPlayer]: { bullet: import('@/types').Entity };
  [CollisionEventType.PowerupCollected]: { powerup: import('@/types').Entity };
  [CollisionEventType.PlayerCollideEnemy]: { enemy: import('@/types').Entity };
  [CollisionEventType.PlayerCollideBoss]: { boss: import('@/types').Entity };
  [CombatEventTypeBus.WeaponFired]: { weaponType: string };
  [CombatEventTypeBus.ExplosionCreated]: { x: number; y: number };
  [CombatEventTypeBus.ShieldChanged]: { value: number; percent: number };
  [CombatEventTypeBus.PlayerDamaged]: { amount: number };
  [CombatEventTypeBus.EnemyKilled]: { enemyId?: string };
  [CombatEventTypeBus.BossKilled]: { bossId?: string };
  [LevelEventType.LevelStarted]: { level: number };
  [LevelEventType.LevelProgress]: { progress: number };
  [LevelEventType.BossWarning]: { show: boolean };
  [LevelEventType.BossSpawned]: { level: number };
  [LevelEventType.LevelCompleted]: { level: number };
  [LevelEventType.Victory]: {};
};
