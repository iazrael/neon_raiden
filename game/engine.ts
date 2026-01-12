import { BehaviorSubject } from 'rxjs';
import { createWorld } from './types/world';
import { World } from './types/world';
import { spawnPlayer } from './factory';
import { buildSnapshot, GameSnapshot } from './snapshot';
import { InputSystem } from './systems-ecs/InputSystem';
import { MovementSystem } from './systems-ecs/MovementSystem';
import { CollisionSystem } from './systems-ecs/CollisionSystem';
import { CleanupSystem } from './systems-ecs/CleanupSystem';
import { LifetimeSystem } from './systems-ecs/LifetimeSystem';
import { RenderSystem } from './systems-ecs/RenderSystem';
import { WeaponSystem } from './systems-ecs/WeaponSystem';
import { EnemySystem, SpawnSystem } from './systems-ecs/EnemySystem';
import { BossSystem, BossPhaseSystem } from './systems-ecs/BossSystem';
import { AISteerSystem } from './systems-ecs/AISteerSystem';
import { PickupSystem, DamageResolutionSystem, LootSystem } from './systems-ecs/PickupSystem';
import { AudioSystem, EffectPlayer, CameraSystem } from './systems-ecs/AudioSystem';
import {
  ComboSystem,
  updateComboTimer,
  WeaponSynergySystem,
  BuffSystem,
  LevelingSystem,
  ShieldRegenSystem,
  DifficultySystem
} from './systems-ecs/StateSystems';

export class Engine {
    private raf = 0;
    private world: World;
    private ctx: CanvasRenderingContext2D;
    private resizeObserver: ResizeObserver;
    public snapshot$ = new BehaviorSubject<GameSnapshot | null>(null);

    start(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!;
        this.world = createWorld();

        this.resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                canvas.width = width;
                canvas.height = height;
                this.world.width = width;
                this.world.height = height;
            }
        });
        this.resizeObserver.observe(canvas);

        this.world.width = canvas.clientWidth;
        this.world.height = canvas.clientHeight;
        canvas.width = this.world.width;
        canvas.height = this.world.height;

        spawnPlayer(this.world, canvas.width / 2, canvas.height - 80);

        this.loop();
    }

    pause() {
        cancelAnimationFrame(this.raf);
        this.snapshot$.next(null);
    }

    resume() {
        this.loop();
    }

    stop() {
        cancelAnimationFrame(this.raf);
        this.resizeObserver.disconnect();
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
        InputSystem(world, dt);

        DifficultySystem(world, dt);
        SpawnSystem(world, dt);
        BossPhaseSystem(world, dt);
        BossSystem(world, dt);
        EnemySystem(world, dt);
        AISteerSystem(world, dt);

        BuffSystem(world, dt);
        LevelingSystem(world, dt);
        ShieldRegenSystem(world, dt);
        WeaponSynergySystem(world, dt);
        WeaponSystem(world, dt);

        MovementSystem(world, dt);

        CollisionSystem(world, dt);

        PickupSystem(world, dt);
        DamageResolutionSystem(world, dt);
        LootSystem(world, dt);
        ComboSystem(world, dt);
        updateComboTimer(world, dt);

        CameraSystem(world, dt);
        EffectPlayer(world, dt);
        AudioSystem(world, dt);

        this.snapshot$.next(buildSnapshot(world));

        LifetimeSystem(world, dt);

        CleanupSystem(world, dt);

        RenderSystem(this.ctx, world);
    }
}
