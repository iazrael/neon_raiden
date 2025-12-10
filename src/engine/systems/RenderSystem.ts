
import { World } from '../types';
import { view } from '../world';
import { Transform, Sprite, TeleportState, InvulnerableState } from '../components';
import { Component } from '../types'; // 确保导入 Component 类型

/**
 * 渲染系统
 * 负责每一帧的画面绘制
 */
export function RenderSystem(ctx: CanvasRenderingContext2D, world: World) {
  clearScreen(ctx);
  renderBackground(ctx);
  renderEntities(ctx, world);
  renderUI(ctx, world);
}

// 1. 清除屏幕
function clearScreen(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// 2. 绘制背景
function renderBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000011';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// 3. 绘制实体
function renderEntities(ctx: CanvasRenderingContext2D, world: World) {
  // 遍历所有带有 Transform 和 Sprite 的实体
  for (const [id, [transform, sprite]] of view(world, [Transform, Sprite])) {
    const comps = world.entities.get(id);
    if (!comps) continue;

    // 如果有瞬移状态，跳过渲染 -> 实现隐形
    if (comps.some(TeleportState.check)) continue;

    renderEntity(ctx, world, transform, sprite, comps);
  }
}

// 绘制单个实体
function renderEntity(
  ctx: CanvasRenderingContext2D,
  world: World,
  transform: Transform,
  sprite: Sprite,
  comps: Component[]
) {
  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.rotate(transform.rot);

  // 处理无敌/闪烁效果
  handleInvulnerableVisuals(ctx, world, comps);

  // 绘制 Sprite 矩形
  drawSpriteShape(ctx, sprite);

  ctx.restore();
}

function handleInvulnerableVisuals(ctx: CanvasRenderingContext2D, world: World, comps: Component[]) {
  const invuln = comps.find(InvulnerableState.check);
  if (invuln) {
    // 简单闪烁：每 100ms 切换一次透明度
    if (Math.floor(world.time / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    // 如果有颜色覆盖
    if (invuln.flashColor) {
      // 简单的光环效果
      ctx.fillStyle = invuln.flashColor;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.globalAlpha = 1.0; // reset
    }
  }
}

function drawSpriteShape(ctx: CanvasRenderingContext2D, sprite: Sprite) {
  if (sprite.color) {
    ctx.fillStyle = sprite.color;
    ctx.fillRect(-10, -10, 20, 20);
  } else {
    // 默认绘制绿色矩形
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(-10, -10, 20, 20);
  }
}

// 4. 绘制 UI
function renderUI(ctx: CanvasRenderingContext2D, world: World) {
  renderPlayerInfo(ctx, world);
  renderGameInfo(ctx, world);
}

function renderPlayerInfo(ctx: CanvasRenderingContext2D, world: World) {
  if (world.playerId) {
    const playerComps = world.entities.get(world.playerId) || [];
    const playerTransform = playerComps.find(c => c instanceof Transform) as Transform || null;

    if (playerTransform) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText(`Player: (${Math.round(playerTransform.x)}, ${Math.round(playerTransform.y)})`, 10, 20);
    }
  }
}

function renderGameInfo(ctx: CanvasRenderingContext2D, world: World) {
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.fillText(`Score: ${world.score}`, 10, 40);
  ctx.fillText(`Level: ${world.level}`, 10, 60);
  ctx.fillText(`Difficulty: ${world.difficulty.toFixed(2)}`, 10, 80);
}