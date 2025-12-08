import { World } from '../types';
import { view, addComponent } from '../world';
import { Lifetime, DestroyTag } from '../components';

/**
 * 生命周期系统
 * 更新具有Lifetime组件的实体的计时器
 * 超时后为实体添加DestroyTag组件
 */
export function LifetimeSystem(w: World, dt: number) {
  for (const [id, [lifetime]] of view(w, [Lifetime])) {
    lifetime.timer -= dt;
    
    // 如果计时器到期，添加销毁标记
    if (lifetime.timer <= 0) {
      addComponent(w, id, new DestroyTag({ reason: 'timeout' }));
    }
  }
}