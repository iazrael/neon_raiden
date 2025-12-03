import { snapshot$ } from './store';
import { World, snapshot, createWorld } from './world';
export { createWorld, World } from './world';
import { InputSystem } from './systems/InputSystem';
import { MovementSystem } from './systems/MovementSystem';
import { WeaponSystem } from './systems/WeaponSystem';
import { CollisionSystem } from './systems/CollisionSystem';
import { RenderSystem } from './systems/RenderSystem';
import { setWorld } from './factory';

let world: World = createWorld(); // 全局单例，可被外部替换用于回滚

export function getWorld(): World {
  return world;
}

export function setWorldForEngine(w: World) {
  world = w;
  setWorld(w);
}

export function startEngine(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  let last = performance.now();

  function loop(t: number) {
    const dt = t - last;
    last = t;

    // 1. 各系统按顺序运行
    InputSystem(world, dt);
    WeaponSystem(world, dt);
    MovementSystem(world, dt);
    CollisionSystem(world, dt);

    // 2. 生成快照并广播
    snapshot$.next(snapshot(world, t));

    // 3. canvas 直接画
    RenderSystem(ctx, world);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}