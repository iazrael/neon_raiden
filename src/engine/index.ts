import { BehaviorSubject } from 'rxjs';
import { createWorld } from './world';
import { World } from './types';
import { Blueprint } from './blueprints';
import { spawnPlayer } from './factory';
import { buildSnapshot, GameSnapshot } from './snapshot';

// ============== 导入所有系统
import { AISteerSystem } from './systems/AISteerSystem';
import { AudioSystem } from './systems/AudioSystem';
import { BossSystem } from './systems/BossSystem';
import { BuffSystem } from './systems/BuffSystem';
import { CameraSystem } from './systems/CameraSystem';
import { CleanupSystem } from './systems/CleanupSystem';
import { CollisionSystem } from './systems/CollisionSystem';
import { ComboSystem } from './systems/ComboSystem';
import { DamageResolutionSystem } from './systems/DamageResolutionSystem';
import { DifficultySystem } from './systems/DifficultySystem';
import { EffectPlayer } from './systems/EffectPlayer';
import { InputSystem } from './systems/InputSystem';
import { LifetimeSystem } from './systems/LifetimeSystem';
import { LootSystem } from './systems/LootSystem';
import { MovementSystem } from './systems/MovementSystem';
import { PickupSystem } from './systems/PickupSystem';
import { RenderSystem } from './systems/RenderSystem';
import { SpawnSystem } from './systems/SpawnSystem';
import { WeaponSynergySystem } from './systems/WeaponSynergySystem';
import { WeaponSystem } from './systems/WeaponSystem';
// ==============

export class Engine {
    private raf = 0;
    private world: World;
    private ctx: CanvasRenderingContext2D;
    public snapshot$ = new BehaviorSubject<GameSnapshot | null>(null);

    start(canvas: HTMLCanvasElement, bp: Blueprint) {
        this.ctx = canvas.getContext('2d')!;
        this.world = createWorld();
        spawnPlayer(this.world, bp, canvas.width / 2, canvas.height - 80);
        this.loop();
    }

    pause() {
        cancelAnimationFrame(this.raf);
        this.snapshot$.next(null);   // 可选：清 HUD
    }

    resume() {
        this.loop();
    }

    stop() {
        cancelAnimationFrame(this.raf);
        this.world.events.length = 0;
        this.world.entities.clear();
        this.snapshot$.next(null);
    }

    private loop() {
        const step = (t: number) => {
            const dt = t - (this.world.time || t);
            this.world.time = t;
            this.framePipeline(this.world, dt);
            this.raf = requestAnimationFrame(step);
        };
        this.raf = requestAnimationFrame(step);
    }

    private framePipeline(world: World, dt: number) {
        // ① 逻辑循环（所有 System）
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
        SpawnSystem(world, dt);
        // EnvironmentSystem(world, dt);
        // BossPhaseSystem(world, dt);
        BossSystem(world, dt);
        LifetimeSystem(world, dt);
        LootSystem(world, dt);
        PickupSystem(world, dt);
        BuffSystem(world, dt);
        EffectPlayer(world, dt);
        AudioSystem(world, dt);
        // ② 拍快照（**必须在清理前**）
        this.snapshot$.next(buildSnapshot(this.world, dt));
        // ③ 清理（**必须在最后**）
        CleanupSystem(world, dt);
        RenderSystem(this.ctx, world);
    }
}
