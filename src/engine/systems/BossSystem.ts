import { World } from '../types';
import { view } from '../world';
import { BossTag, Transform, Health } from '../components';

/**
 * Boss系统
 * 控制Boss的行为模式
 * 管理Boss的不同阶段
 */
export function BossSystem(w: World, dt: number) {
  // 遍历所有Boss实体
  for (const [id, [bossTag, transform, health]] of view(w, [BossTag, Transform, Health])) {
    // Boss的基本行为：向下移动直到到达指定位置
    if (transform.y < 150) {
      transform.y += 100 * (dt / 1000); // 每秒移动100像素
    }
    
    // 简单的Boss AI：左右移动
    transform.x += Math.sin(w.time / 1000) * 50 * (dt / 1000); // 每秒最多移动50像素
    
    // 限制Boss在屏幕范围内
    transform.x = Math.max(100, Math.min(700, transform.x));
    
    // 简单的Boss攻击逻辑：根据血量比例改变攻击模式
    const healthRatio = health.hp / health.max;
    
    // 如果血量低于70%，进入第二阶段
    if (healthRatio < 0.7) {
      // 第二阶段行为：更快的移动和攻击
      transform.x += Math.sin(w.time / 500) * 75 * (dt / 1000);
    }
    
    // 如果血量低于30%，进入第三阶段
    if (healthRatio < 0.3) {
      // 第三阶段行为：更加激进的攻击模式
      transform.x += Math.sin(w.time / 250) * 100 * (dt / 1000);
    }
  }
}