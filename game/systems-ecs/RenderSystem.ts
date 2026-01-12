import { World } from '../types/world';

export function RenderSystem(ctx: CanvasRenderingContext2D, world: World): void {
  ctx.clearRect(0, 0, world.width, world.height);

  for (const [id, render] of world.components.renders) {
    const position = world.components.positions.get(id);
    if (!position) continue;

    const entity = world.entities.get(id);
    if (!entity || entity.markedForDeletion) continue;

    ctx.save();
    ctx.translate(position.x, position.y);

    if (position.angle !== undefined) {
      ctx.rotate(position.angle);
    }

    if (render.hitFlashUntil && world.time < render.hitFlashUntil) {
      ctx.globalAlpha = 0.5;
    }

    if (render.spriteKey) {
      ctx.fillStyle = render.color;
      ctx.fillRect(-render.width / 2, -render.height / 2, render.width, render.height);
    } else {
      ctx.fillStyle = render.color;
      ctx.fillRect(-render.width / 2, -render.height / 2, render.width, render.height);
    }

    ctx.restore();
  }
}
