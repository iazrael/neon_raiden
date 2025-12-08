import { World } from '../types';
import { view } from '../world';
import { MoveIntent, FireIntent } from '../components';

// 全局按键状态管理
export const keys: Record<string, boolean> = {};

/**
 * 输入系统
 * 处理玩家输入，为玩家实体生成MoveIntent和FireIntent组件
 */
export function InputSystem(w: World, dt: number) {
  // 查找玩家实体
  for (const [id] of view(w, [])) {
    if (id === w.playerId) {
      // 移除旧的意图组件
      const comps = w.entities.get(id) || [];
      const moveIntentIndex = comps.findIndex(c => c instanceof MoveIntent);
      const fireIntentIndex = comps.findIndex(c => c instanceof FireIntent);
      
      if (moveIntentIndex !== -1) {
        comps.splice(moveIntentIndex, 1);
      }
      
      if (fireIntentIndex !== -1) {
        comps.splice(fireIntentIndex, 1);
      }
      
      // 创建新的意图组件
      let dx = 0;
      let dy = 0;
      
      // 处理移动输入
      if (keys['ArrowLeft'] || keys['KeyA']) dx = -1;
      if (keys['ArrowRight'] || keys['KeyD']) dx = 1;
      if (keys['ArrowUp'] || keys['KeyW']) dy = -1;
      if (keys['ArrowDown'] || keys['KeyS']) dy = 1;
      
      // 添加移动意图组件
      if (dx !== 0 || dy !== 0) {
        comps.push(new MoveIntent({ dx, dy }));
      }
      
      // 处理射击输入
      if (keys['Space']) {
        comps.push(new FireIntent());
      }
      
      break;
    }
  }
}