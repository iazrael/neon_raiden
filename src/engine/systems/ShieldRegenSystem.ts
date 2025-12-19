import { World } from '../types';
import { view } from '../world';
import { Health, Shield } from '../components';

/**
 * 护盾恢复系统
 * 专门处理护盾的自动恢复逻辑
 */
export function ShieldRegenSystem(world: World, dt: number) {
  // 遍历所有拥有生命值和护盾组件的实体
  for (const [id, [health, shield]] of view(world, [Health, Shield])) {
    // 只有当护盾值小于最大值且恢复速率大于0时才恢复
    if (shield.value < health.max * 0.5 && shield.regen > 0) {
      // 每帧恢复护盾值
      shield.value += shield.regen * dt / 1000; // 转换为每秒恢复

      // 确保护盾值不超过最大值
      if (shield.value > health.max * 0.5) {
        shield.value = health.max * 0.5;
      }
    }
  }
}