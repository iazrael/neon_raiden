import { World } from '../types';
import { view } from '../world';
import { Transform, Bullet, Health, DestroyTag } from '../components';
import { pushEvent } from '../world';

/**
 * 碰撞系统
 * 检测子弹与敌人的碰撞
 * 生成相应的事件
 */
export function CollisionSystem(w: World, dt: number) {
  // 检测子弹与敌人的碰撞
  for (const [bulletId, [bullet, bulletTransform]] of view(w, [Bullet, Transform])) {
    for (const [enemyId, [enemyHealth, enemyTransform]] of view(w, [Health, Transform])) {
      // 跳过已经死亡的敌人
      if (enemyHealth.hp <= 0) continue;
      
      // 计算距离
      const dx = bulletTransform.x - enemyTransform.x;
      const dy = bulletTransform.y - enemyTransform.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 简单的碰撞检测（假设碰撞半径为20像素）
      if (distance < 20) {
        // 减少敌人血量
        enemyHealth.hp -= 10; // 简单的固定伤害值
        
        // 生成命中事件
        pushEvent(w, {
          type: 'Hit',
          pos: { x: bulletTransform.x, y: bulletTransform.y },
          damage: 10,
          owner: bullet.owner,
          victim: enemyId,
          bloodLevel: 1
        });
        
        // 如果敌人死亡，生成击杀事件
        if (enemyHealth.hp <= 0) {
          pushEvent(w, {
            type: 'Kill',
            pos: { x: enemyTransform.x, y: enemyTransform.y },
            victim: enemyId,
            killer: bullet.owner,
            score: 100 // 简单的固定分数
          });
        }
        
        // 添加销毁标记到子弹
        const bulletComps = w.entities.get(bulletId) || [];
        bulletComps.push(new DestroyTag({ reason: 'consumed' }));
        
        // 一个子弹只能击中一个敌人，所以跳出内层循环
        break;
      }
    }
  }
}