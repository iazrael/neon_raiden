import { World } from '../types';
import { view } from '../world';
import { PickupItem, Transform } from '../components';

/**
 * 拾取系统
 * 检测玩家与PickupItem实体的碰撞
 * 根据物品类型应用相应效果
 */
export function PickupSystem(w: World, dt: number) {
  // 查找玩家位置
  let playerTransform: Transform | null = null;
  if (w.playerId) {
    const playerComps = w.entities.get(w.playerId) || [];
    playerTransform = playerComps.find(c => c instanceof Transform) as Transform || null;
  }
  
  if (!playerTransform) return;
  
  // 检测玩家与PickupItem实体的碰撞
  for (const [id, [pickupItem, transform]] of view(w, [PickupItem, Transform])) {
    // 简单的距离检测
    const dx = playerTransform.x - transform.x;
    const dy = playerTransform.y - transform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 如果距离小于一定值，认为发生碰撞
    if (distance < 30) { // 假设碰撞半径为30像素
      // 根据物品类型应用相应效果
      switch (pickupItem.kind) {
        case 'weapon':
          // 拾取武器的逻辑
          console.log(`Picked up weapon: ${pickupItem.blueprint}`);
          break;
        case 'buff':
          // 拾取增益效果的逻辑
          console.log(`Picked up buff: ${pickupItem.blueprint}`);
          break;
        case 'coin':
          // 拾取金币的逻辑
          console.log(`Picked up coin: ${pickupItem.blueprint}`);
          break;
      }
      
      // 添加销毁标记
      const comps = w.entities.get(id) || [];
      comps.push({ reason: 'consumed' } as any); // 这里应该使用DestroyTag组件
    }
  }
}