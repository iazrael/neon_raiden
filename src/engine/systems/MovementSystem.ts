import { Transform, Velocity, MoveIntent } from '../components';
import { World } from '../types';
import { view } from '../world';

/**
 * 移动系统
 * 根据MoveIntent组件更新实体的速度
 * 根据Velocity组件更新实体的位置
 */
export function MovementSystem(w: World, dt: number) {
  // 处理移动意图，更新速度
  for (const [id, [transform, velocity, moveIntent]] of view(w, [Transform, Velocity, MoveIntent])) {
    // 根据移动意图设置速度（假设基础速度为300像素/秒）
    const speed = 300;
    velocity.vx = moveIntent.dx * speed;
    velocity.vy = moveIntent.dy * speed;
    
    // 限制对角线移动速度，避免过快
    if (moveIntent.dx !== 0 && moveIntent.dy !== 0) {
      velocity.vx *= 0.7071; // 1/sqrt(2)
      velocity.vy *= 0.7071;
    }
  }
  
  // 根据速度更新位置
  for (const [, [transform, velocity]] of view(w, [Transform, Velocity])) {
    transform.x += velocity.vx * dt / 1000; // 转换为每秒移动
    transform.y += velocity.vy * dt / 1000;
    
    // 限制玩家在屏幕范围内
    // 注意：这里假设画布大小为800x600，实际项目中应该从配置中获取
    if (w.playerId && w.entities.has(w.playerId) && w.entities.get(w.playerId)?.includes(transform)) {
      transform.x = Math.max(20, Math.min(780, transform.x));
      transform.y = Math.max(20, Math.min(580, transform.y));
    }
  }
}