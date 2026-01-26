import { World } from '../types/world';
import { SpriteGenerator } from '../SpriteGenerator';
import type { SpriteMap } from '@/types';

export function RenderSystem(ctx: CanvasRenderingContext2D, world: World): void {
  ctx.clearRect(0, 0, world.width, world.height);

  // 调试：显示实体数量
  const renderCount = world.components.renders.size;
  if (renderCount > 0) {
    console.log(`[Render] Rendering ${renderCount} entities`);
  }

  for (const [id, render] of world.components.renders) {
    const position = world.components.positions.get(id);
    if (!position) {
      console.log(`[Render] No position for entity ${id}`);
      continue;
    }

    const entity = world.entities.get(id);
    if (!entity || entity.markedForDeletion) {
      console.log(`[Render] Entity ${id} marked for deletion, skipping`);
      continue;
    }

    ctx.save();
    ctx.translate(position.x, position.y);

    if (position.angle !== undefined) {
      ctx.rotate(position.angle);
    }

    if (render.hitFlashUntil && world.time < render.hitFlashUntil) {
      ctx.globalAlpha = 0.5;
    }

    if (render.spriteKey) {
      const sprite = SpriteGenerator.getAsset(render.spriteKey);
      if (sprite) {
        ctx.drawImage(sprite, -render.width / 2, -render.height / 2, render.width, render.height);
      } else {
        ctx.fillStyle = render.color;
        ctx.fillRect(-render.width / 2, -render.height / 2, render.width, render.height);
        console.log(`[Render] Sprite not found: ${render.spriteKey}`);
      }
    } else {
      ctx.fillStyle = render.color;
      ctx.fillRect(-render.width / 2, -render.height / 2, render.width, render.height);
    }

    ctx.restore();
  }
}

