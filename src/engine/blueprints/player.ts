import { Transform, Health, Weapon, Shield, Sprite, Velocity, HitBox, PlayerTag, SpeedStat } from '../components'
import { Blueprint } from '../types';


export const BLUEPRINT_FIGHTER_NEON: Blueprint = {
  Transform: {x: 0, y: 0, rot: 0},                    // 出生坐标（场景后期会重置）
  Health: { hp: 150, max: 200 },                      // 初始 HP / 最大 HP
  // Shield: [100, 0],                        // 初始护盾值 / 再生速率（这里 0，可后续 Buff 加）
  // SpeedStat: [7 * 60, 5],                  // 7 格/秒 → 像素/秒（假设 1 格 = 60 像素）
  // HitBox: [{ shape: 'circle', radius: 24 * (1 - 0.2) }], // 48×48 精灵 → 半径 24，再缩 0.2
  // Sprite: ['player', 0, 0, 48, 48, 1, 0.5, 0.5], // 图集切 48×48，轴心居中
  // PlayerTag: [],
  // Weapon: ['neonLaser', 200, 0],           // 初始武器 ID 与冷却（ms）
};