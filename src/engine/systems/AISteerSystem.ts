import { World } from '../types';
import { view } from '../world';
import { EnemyTag, MoveIntent, Transform } from '../components';

/**
 * AI转向系统
 * 为带有EnemyTag的实体生成MoveIntent组件
 * 实现敌人的基本AI行为
 */
export function AISteerSystem(w: World, dt: number) {
  // 为带有EnemyTag的实体生成MoveIntent组件
  for (const [id, [enemyTag, transform]] of view(w, [EnemyTag, Transform])) {
    // 移除旧的移动意图组件
    const comps = w.entities.get(id) || [];
    const moveIntentIndex = comps.findIndex(c => c instanceof MoveIntent);
    
    if (moveIntentIndex !== -1) {
      comps.splice(moveIntentIndex, 1);
    }
    
    // 简单的AI行为：一直向下移动
    comps.push(new MoveIntent({ dx: 0, dy: 1 }));
  }
}