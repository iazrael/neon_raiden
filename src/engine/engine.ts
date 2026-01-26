import { BehaviorSubject } from 'rxjs';
import { createWorld } from './world';
import { World } from './types';
import { Blueprint } from './blueprints';
import { spawnPlayer } from './factory';
import { buildSnapshot, GameSnapshot } from './snapshot';
import { inputManager } from './input/InputManager';

// ============== 导入所有系统
import { AISteerSystem } from './systems/AISteerSystem';
// import { AudioSystem } from './systems/AudioSystem'; // 暂时禁用 - 使用旧 GameAudioSystem
import { EnemySystem } from './systems/EnemySystem';
import { BossSystem } from './systems/BossSystem';
import { BossPhaseSystem } from './systems/BossPhaseSystem';
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
import { RenderSystem, setRenderContext, type RenderContext } from './systems/RenderSystem';
import { SpawnSystem } from './systems/SpawnSystem';
import { SpecialWeaponSystem } from './systems/SpecialWeaponSystem';
import { WeaponSynergySystem } from './systems/WeaponSynergySystem';
import { WeaponSystem } from './systems/WeaponSystem';
// ==============

export class Engine {
    private raf = 0;
    private world: World;
    private ctx: CanvasRenderingContext2D;
    private resizeObserver: ResizeObserver;
    public snapshot$ = new BehaviorSubject<GameSnapshot | null>(null);

    // ========== 调试模式：只测试渲染 ==========
    // 设为 true 时只运行渲染系统，用于调试渲染问题
    private static DEBUG_RENDER_ONLY = false;
    // ==========================================

    start(canvas: HTMLCanvasElement, bp: Blueprint) {
        this.ctx = canvas.getContext('2d')!;
        this.world = createWorld();

        // 设置渲染上下文
        setRenderContext({
            canvas,
            context: this.ctx,
            width: canvas.clientWidth,
            height: canvas.clientHeight
        });

        // 监听尺寸变化
        this.resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                canvas.width = width;
                canvas.height = height;
                this.world.width = width;
                this.world.height = height;
                // 更新渲染上下文尺寸
                setRenderContext({
                    canvas,
                    context: this.ctx,
                    width,
                    height
                });
            }
        });
        this.resizeObserver.observe(canvas);

        // 初始同步一次
        this.world.width = canvas.clientWidth;
        this.world.height = canvas.clientHeight;
        canvas.width = this.world.width;
        canvas.height = this.world.height;

        // 初始化输入管理器
        inputManager.init(canvas);

        spawnPlayer(this.world, bp, canvas.width / 2, canvas.height - 80, 0);
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
        // ========== 调试模式：只测试渲染 ==========
        if (Engine.DEBUG_RENDER_ONLY) {
            // 只运行渲染相关的系统
            RenderSystem(world, dt);
            return;
        }
        // ==========================================

        // 按顺序执行所有系统（P1-P8）

        // P1. 决策层 (输入与AI)
        InputSystem(world, dt);                         // 1. 输入系统
        // DifficultySystem(world, dt);                    // 2. 难度系统
        SpawnSystem(world, dt);                         // 3. 生成系统
        // BossPhaseSystem(world, dt);                     // 4. Boss阶段系统
        // BossSystem(world, dt);                          // 5. Boss系统
        EnemySystem(world, dt);                         // 6. 敌人系统
        // AISteerSystem(world, dt);                       // 7. AI转向系统

        // P2. 状态层 (数值更新)
        // BuffSystem(world, dt);                          // 8. 增益系统
        // WeaponSynergySystem(world, dt);                 // 9. 武器协同系统
        WeaponSystem(world, dt);                        // 10. 武器系统
        // SpecialWeaponSystem(world, dt);                 // 11. 特殊武器效果 (追踪、链式等)

        // P3. 物理层 (位移)
        MovementSystem(world, dt);                      // 11. 移动系统

        // P4. 交互层 (核心碰撞)
        CollisionSystem(world, dt);                     // 12. 碰撞系统

        // P5. 结算层 (事件处理)
        // PickupSystem(world, dt);                        // 13. 拾取系统
        // DamageResolutionSystem(world, dt);              // 14. 伤害结算系统
        // LootSystem(world, dt);                          // 15. 掉落系统
        // ComboSystem(world, dt);                         // 16. 连击系统

        // P6. 刷怪层 (生成与AI)
        // (已在 P1 中处理)

        // P7. 表现层 (视听反馈)
        // CameraSystem(world, dt);                        // 17. 相机系统
        // EffectPlayer(world, dt);                        // 18. 效果播放系统
        // AudioSystem(world, dt);                     // 19. 音频系统 (暂时禁用 - 使用旧 GameAudioSystem)

        // 拍快照（**必须在清理前**）
        this.snapshot$.next(buildSnapshot(world, dt));

        // P8. 清理层 (生命周期)
        LifetimeSystem(world, dt);                      // 20. 生命周期系统
        CleanupSystem(world, dt);                       // 21. 清理系统

        // 渲染系统（最后执行）
        RenderSystem(world, dt);                        // 22. 渲染系统
    }

    /**
     * 设置调试模式
     * @param enabled true 时只运行渲染系统
     */
    public static setDebugRenderOnly(enabled: boolean): void {
        Engine.DEBUG_RENDER_ONLY = enabled;
        console.log('[Engine] Debug Render Only:', enabled ? 'ENABLED' : 'DISABLED');
    }
}
