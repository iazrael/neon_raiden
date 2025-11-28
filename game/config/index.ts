// 统一导出所有配置项，保持对外接口一致性

// 基础游戏配置
export { GameConfig, ASSETS_BASE_PATH } from './game';

// 玩家配置
export { PlayerConfig } from './player';

// 武器相关配置
export { BulletConfigs } from './weapons/bullets';
export { WeaponConfig } from './weapons/weapons';
export { WeaponUpgradeConfig } from './weapons/upgrades';

// 敌人相关配置
export { EnemySpawnWeights } from './enemies/spawns';
export { EnemyCommonConfig } from './enemies/common';
export { EnemyConfig } from './enemies/entities';

// 道具相关配置
export { PowerupDropConfig, PowerupDropRates, selectPowerupType } from './powerups/drops';
export { PowerupEffects } from './powerups/effects';
export { PowerupVisuals } from './powerups/visuals';

// Boss相关配置
export { BossSpawnConfig } from './bosses/spawns';
export { BossWeaponConfig } from './bosses/weapons';
export { BossConfig, getBossConfigByLevel } from './bosses/entities';

// 重新导出类型
export {
    EnemyType,
    PowerupType,
    BossWeaponType
} from '@/types';