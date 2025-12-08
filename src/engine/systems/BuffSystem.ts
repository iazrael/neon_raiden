import { World } from '../types';
import { view } from '../world';
import { Buff } from '../components';

/**
 * 增益效果系统
 * 更新Buff组件的计时器
 * 到期后移除Buff组件并应用相应效果
 */
export function BuffSystem(w: World, dt: number) {
  // 遍历所有拥有Buff组件的实体
  for (const [id, [buff]] of view(w, [Buff])) {
    // 更新Buff的剩余时间
    buff.remaining -= dt / 1000; // 转换为秒
    
    // 如果Buff已过期，移除它
    if (buff.remaining <= 0) {
      const comps = w.entities.get(id) || [];
      const buffIndex = comps.indexOf(buff);
      
      if (buffIndex !== -1) {
        comps.splice(buffIndex, 1);
      }
    }
    
    // 根据Buff类型应用效果
    switch (buff.type) {
      case 'speed':
        // 增加速度的效果
        break;
      case 'damage':
        // 增加伤害的效果
        break;
      case 'shield':
        // 增加护盾的效果
        break;
      // 可以添加更多Buff类型
    }
  }
}