import { World } from '../types';
import { view } from '../world';
import { PlayerTag, Health, Weapon } from '../components';

// 玩家升级配置
interface LevelConfig {
  // 升级所需分数
  scoreRequired: number;
  // 生命值提升
  hpBonus: number;
  // 护盾值提升
  shieldBonus: number;
  // 防御力提升 (%)
  defenseBonus: number;
  // 射速提升 (%)
  fireRateBonus: number;
  // 伤害提升 (%)
  damageBonus: number;
}

// 等级配置表
const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: { scoreRequired: 0, hpBonus: 0, shieldBonus: 0, defenseBonus: 0, fireRateBonus: 0, damageBonus: 0 },
  2: { scoreRequired: 1000, hpBonus: 10, shieldBonus: 20, defenseBonus: 0.05, fireRateBonus: 0.05, damageBonus: 0.05 },
  3: { scoreRequired: 3000, hpBonus: 20, shieldBonus: 30, defenseBonus: 0.1, fireRateBonus: 0.1, damageBonus: 0.1 },
  4: { scoreRequired: 6000, hpBonus: 30, shieldBonus: 40, defenseBonus: 0.15, fireRateBonus: 0.15, damageBonus: 0.15 },
  5: { scoreRequired: 10000, hpBonus: 40, shieldBonus: 50, defenseBonus: 0.2, fireRateBonus: 0.2, damageBonus: 0.2 },
  // 可以继续添加更多等级配置
};

/**
 * 等级系统
 * 处理玩家升级逻辑和属性增强
 */
export function LevelingSystem(world: World, dt: number) {
  // 查找玩家实体
  for (const [id, [playerTag, health, weapon]] of view(world, [PlayerTag, Health, Weapon])) {
    // 计算玩家当前等级
    let currentLevel = 1;
    for (let level = 1; level <= Object.keys(LEVEL_CONFIGS).length; level++) {
      if (world.score >= LEVEL_CONFIGS[level].scoreRequired) {
        currentLevel = level;
      } else {
        break;
      }
    }

    // 更新世界中的玩家等级
    world.playerLevel = currentLevel;

    // 获取当前等级配置
    const config = LEVEL_CONFIGS[currentLevel];

    // 应用属性增强
    // 注意：这里只是示例，实际应用中可能需要更复杂的属性管理系统
    health.max = 150 + config.hpBonus; // 基础生命值150
    // 护盾值需要在其他地方处理，因为Shield组件可能不在同一个实体上

    // 武器属性增强可以通过武器系统处理
    // 这里可以添加事件通知武器系统更新武器属性
  }
}