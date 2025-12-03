import { createWorld } from './world';
import { World } from './types';
import { snapshot$ } from './store';

// 导入所有系统
import { InputSystem } from './systems/InputSystem';
import { MovementSystem } from './systems/MovementSystem';
import { WeaponSystem } from './systems/WeaponSystem';
import { CollisionSystem } from './systems/CollisionSystem';
import { DamageResolutionSystem } from './systems/DamageResolutionSystem';
import { LifetimeSystem } from './systems/LifetimeSystem';
import { LootSystem } from './systems/LootSystem';
import { PickupSystem } from './systems/PickupSystem';
import { AISteerSystem } from './systems/AISteerSystem';
import { BuffSystem } from './systems/BuffSystem';
import { EffectPlayer } from './systems/EffectPlayer';
import { CameraSystem } from './systems/CameraSystem';
import { SpawnSystem } from './systems/SpawnSystem';
import { CleanupSystem } from './systems/CleanupSystem';
import { RenderSystem } from './systems/RenderSystem';
import { AudioSystem } from './systems/AudioSystem';
import { BossSystem } from './systems/BossSystem';
import { ComboSystem } from './systems/ComboSystem';
import { WeaponSynergySystem } from './systems/WeaponSynergySystem';
import { DifficultySystem } from './systems/DifficultySystem';

let world: World = createWorld();

export function getWorld(): World {
  return world;
}

export function startEngine(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  let last = performance.now();

  function loop(t: number) {
    const dt = t - last;
    last = t;

    // 按顺序执行所有系统
    InputSystem(world, dt);
    WeaponSystem(world, dt);
    WeaponSynergySystem(world, dt);
    AISteerSystem(world, dt);
    MovementSystem(world, dt);
    CameraSystem(world, dt);
    CollisionSystem(world, dt);
    DamageResolutionSystem(world, dt);
    ComboSystem(world, dt);
    DifficultySystem(world, dt);
    // EnvironmentSystem(world, dt);
    // BossPhaseSystem(world, dt);
    BossSystem(world, dt);
    LifetimeSystem(world, dt);
    LootSystem(world, dt);
    PickupSystem(world, dt);
    BuffSystem(world, dt);
    EffectPlayer(world, dt);
    AudioSystem(world, dt);
    CleanupSystem(world, dt);
    RenderSystem(ctx, world);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}