import { BehaviorSubject } from 'rxjs';
import { createWorld, World, generateId, addComponent } from './world';
import { Blueprint } from './blueprints';
import { spawnPlayer } from './factory';
import { buildSnapshot, GameSnapshot } from './snapshot';
import { inputManager } from './input/InputManager';
import { VisualEffect } from './components/visual';

// ============== 导入所有系统
import { AISteerSystem } from './systems/AISteerSystem';
import { AudioSystem } from './systems/AudioSystem';
import { BombSystem } from './systems/BombSystem';
import { EnemySystem } from './systems/EnemySystem';
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
import { RenderSystem, type RenderContext } from './systems/RenderSystem';
import { SpawnSystem } from './systems/SpawnSystem';
import { SpecialWeaponSystem } from './systems/SpecialWeaponSystem';
import { TimeSlowSystem } from './systems/TimeSlowSystem';
import { VisualEffectSystem } from './systems/VisualEffectSystem';
import { WeaponSynergySystem } from './systems/WeaponSynergySystem';
import { WeaponSystem } from './systems/WeaponSystem';
// ==============

export class Engine {
    private raf = 0;
    private world: World;
    private canvas: HTMLCanvasElement;
    private resizeObserver: ResizeObserver;
    public snapshot$ = new BehaviorSubject<GameSnapshot | null>(null);

    /**
     * 流星生成计时器
     */
    private meteorTimer = { value: 0 };

    /**
     * 最大时间增量（毫秒）
     *
     * 防止页面失焦后重新聚焦时的巨大时间增量导致实体位置跳跃。
     * 正常情况下每帧约 16.67ms，设置为 100ms 约等于 6 帧，足够处理偶发卡顿。
     */
    private static readonly MAX_DT = 100;

    // ========== 调试模式：只测试渲染 ==========
    // 设为 true 时只运行渲染系统，用于调试渲染问题
    private static DEBUG_RENDER_ONLY = false;
    // ==========================================

    start(canvas: HTMLCanvasElement, bp: Blueprint) {
        this.canvas = canvas;
        this.world = createWorld();

        // 监听尺寸变化
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

        // 初始同步一次
        this.world.width = canvas.clientWidth;
        this.world.height = canvas.clientHeight;
        canvas.width = this.world.width;
        canvas.height = this.world.height;

        // 初始化输入管理器
        inputManager.init(canvas);

        // 创建视觉特效实体
        this.world.visualEffectId = generateId();
        addComponent(this.world, this.world.visualEffectId, new VisualEffect());

        spawnPlayer(this.world, bp, canvas.width / 2, canvas.height - 80, 0);

        // 初始化 timeScale
        this.world.timeScale = 1.0;

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
            // 限制 dt 最大值，防止页面失焦后重新聚焦时的巨大时间增量
            const rawDt = t - (this.world.time || t);
            const dt = Math.min(rawDt, Engine.MAX_DT);
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
            RenderSystem(world, this.getRenderContext(), dt);
            return;
        }
        // ==========================================

        // 按顺序执行所有系统（P0-P8）

        // P0. 时间减速层 (最先执行,设置全局 timeScale)
        TimeSlowSystem(world);

        // P1. 决策层 (输入与AI)
        InputSystem(world, dt);                         // 1. 输入系统
        // DifficultySystem(world, dt);                    // 2. 难度系统
        SpawnSystem(world, dt);                         // 3. 生成系统

        BossSystem(world, dt);                          // 5. Boss阶段系统 / Boss系统
        EnemySystem(world, dt);                         // 6. 敌人系统
        // AISteerSystem(world, dt);                       // 7. AI转向系统

        // P2. 状态层 (数值更新)
        BuffSystem(world, dt);                          // 8. 增益系统
        // WeaponSynergySystem(world, dt);                 // 9. 武器协同系统
        WeaponSystem(world, dt);                        // 10. 武器系统
        // SpecialWeaponSystem(world, dt);                 // 11. 特殊武器效果 (追踪、链式等)

        // P3. 物理层 (位移)
        MovementSystem(world, dt);                      // 11. 移动系统

        // P4. 交互层 (核心碰撞)
        BombSystem(world, dt);                          // 12. 炸弹系统（救命神器，先生效）
        CollisionSystem(world, dt);                     // 13. 碰撞系统

        // P5. 结算层 (事件处理)
        PickupSystem(world, dt);                        // 13. 拾取系统
        DamageResolutionSystem(world, dt);              // 14. 伤害结算系统
        LootSystem(world, dt);                          // 15. 掉落系统
        ComboSystem(world, dt);                             // 16. 连击系统

        // P7. 表现层 (视听反馈)
        CameraSystem(world, dt);                        // 17. 相机系统
        EffectPlayer(world, dt);                        // 18. 效果播放系统
        
        VisualEffectSystem(world, dt);                  // 19. 视觉特效系统（更新状态）
        AudioSystem(world, dt);                     // 20. 音频系统

        // 拍快照（**必须在清理前**）
        this.snapshot$.next(buildSnapshot(world, dt));

        // P8. 清理层 (生命周期)
        LifetimeSystem(world, dt);                      // 21. 生命周期系统
        CleanupSystem(world, dt);                       // 22. 清理系统

        // 渲染系统（最后执行）
        RenderSystem(world, this.getRenderContext(), dt);  // 23. 渲染系统
    }

    /**
     * 获取渲染上下文
     */
    private getRenderContext(): RenderContext {
        return {
            canvas: this.canvas,
            context: this.canvas.getContext('2d')!,
            width: this.canvas.width,
            height: this.canvas.height,
        };
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
