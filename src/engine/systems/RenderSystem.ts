import { World, Transform, Sprite, Bullet, Weapon, Health, Shield, Velocity } from '../types';
import { view } from '../world';

export function RenderSystem(ctx: CanvasRenderingContext2D, world: World) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Draw background
  ctx.fillStyle = '#000011';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Draw entities
  for (const [, [tr, sp]] of view(world, ['Transform', 'Sprite'])) {
    ctx.save();
    ctx.translate(tr.x, tr.y);
    ctx.rotate(tr.rot);
    
    // Simple colored rectangles for now
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(-10, -10, 20, 20);
    
    ctx.restore();
  }
}