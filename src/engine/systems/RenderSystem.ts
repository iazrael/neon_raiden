import { World } from '../types';
import { view } from '../world';
import { Transform, Sprite, TeleportState } from '../components';

export function RenderSystem(ctx: CanvasRenderingContext2D, world: World) {
  // 清除画布
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 绘制背景
  ctx.fillStyle = '#000011';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 绘制所有实体
  for (const [id, [transform, sprite]] of view(world, [Transform, Sprite])) {
    const comps = world.entities.get(id)!;
    // 如果有瞬移状态，跳过渲染 -> 实现隐形
    if (comps.some(TeleportState.check)) continue;

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.rotate(transform.rot);

    // 根据sprite组件绘制图形
    if (sprite.color) {
      ctx.fillStyle = sprite.color;
      ctx.fillRect(-10, -10, 20, 20);
    } else {
      // 默认绘制绿色矩形
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(-10, -10, 20, 20);
    }

    ctx.restore();
  }

  // 绘制玩家信息
  if (world.playerId) {
    const playerComps = world.entities.get(world.playerId) || [];
    const playerTransform = playerComps.find(c => c instanceof Transform) as Transform || null;

    if (playerTransform) {
      // 绘制玩家位置信息
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText(`Player: (${Math.round(playerTransform.x)}, ${Math.round(playerTransform.y)})`, 10, 20);
    }
  }

  // 绘制游戏信息
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.fillText(`Score: ${world.score}`, 10, 40);
  ctx.fillText(`Level: ${world.level}`, 10, 60);
  ctx.fillText(`Difficulty: ${world.difficulty.toFixed(2)}`, 10, 80);
}