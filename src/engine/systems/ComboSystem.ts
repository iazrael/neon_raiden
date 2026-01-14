import { World } from '../types';

// 连击状态接口
export interface ComboState {
  count: number;
  timer: number;
  multiplier: number;
}

/**
 * 获取连击得分倍率
 */
export function getScoreMultiplier(combo: number): number {
  if (combo < 5) return 1.0;
  if (combo < 10) return 1.2;
  if (combo < 20) return 1.5;
  if (combo < 30) return 2.0;
  return 2.5;
}

/**
 * 获取连击伤害倍率
 */
export function getDamageMultiplier(combo: number): number {
  if (combo < 10) return 1.0;
  if (combo < 20) return 1.1;
  if (combo < 30) return 1.2;
  return 1.3;
}

/**
 * 连击系统
 * 处理连击逻辑
 * 计算连击奖励
 */
export function ComboSystem(w: World, dt: number) {
  // 初始化连击状态
  if (!w.comboState) {
    w.comboState = { count: 0, timer: 0, multiplier: 1.0 };
  }

  // 更新连击计时器
  w.comboState.timer += dt;

  // 连击中断（3秒内没有击杀）
  if (w.comboState.timer > 3000 && w.comboState.count > 0) {
    w.comboState.count = 0;
    w.comboState.multiplier = 1.0;
  }
}
