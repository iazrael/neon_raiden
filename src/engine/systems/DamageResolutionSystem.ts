import { World, Health, Shield, DestroyTag } from '../types';
import { view, addComponent } from '../world';

/**
 * 伤害结算系统
 * 处理护盾吸收伤害、DOT效果、无敌帧逻辑
 * 为需要销毁的实体添加DestroyTag组件
 */
export function DamageResolutionSystem(w: World, dt: number) {
  // 处理护盾吸收伤害
  for (const [, components] of view(w, ['Health', 'Shield'])) {
    const health = components[0];
    const shield = components[1];
    
    // 简单的类型检查
    if ('hp' in health && 'max' in health && 'value' in shield && 'regen' in shield) {
      // 护盾每帧恢复
      if (shield.value > 0 && shield.value < health.max * 0.5) { // 假设护盾最大值为生命值的一半
        shield.value += shield.regen * dt / 1000; // 转换为每秒恢复
        if (shield.value > health.max * 0.5) {
          shield.value = health.max * 0.5;
        }
      }
    }
    
    // TODO: 处理DOT效果
    // TODO: 处理无敌帧逻辑
  }
  
  // 检查需要销毁的实体
  for (const [id, components] of view(w, ['Health'])) {
    const health = components[0];
    if ('hp' in health && health.hp <= 0) {
      // 为需要销毁的实体添加DestroyTag组件
      addComponent(w, id, new DestroyTag('killed'));
    }
  }
}