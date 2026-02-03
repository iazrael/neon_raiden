import { BehaviorSubject } from 'rxjs';
import { createWorld, World, generateId, addComponent } from './world';
import { Blueprint } from './blueprints';
import { spawnPlayer, spawnWorld } from './factory';
import { buildSnapshot, GameSnapshot } from './snapshot';
import { inputManager } from './input/InputManager';

// ============== 导入所有系统
import { AISteerSystem } from './systems/AISteerSystem';
import { AudioSystem } from './systems/AudioSystem';
import { BombSystem } from './systems/BombSystem';
import { BlinkSystem } from './systems/BlinkSystem';
import { EnemySystem } from './systems/EnemySystem';
import { BossSystem } from './systems/BossSystem';
import { BuffSystem } from './systems/BuffSystem';
import { CameraSystem } from './systems/CameraSystem';
import { CleanupSystem } from './systems/CleanupSystem';
import { CollisionSystem } from './systems/CollisionSystem';
import { ComboSystem } from './systems/ComboSystem';
import { DamageResolutionSystem } from './systems/DamageResolutionSystem';
import { DifficultySystem } from './systems/DifficultySystem';
import { EffectSystem } from './systems/EffectSystem';
import { InputSystem } from './systems/InputSystem';
import { LifetimeSystem } from './systems/LifetimeSystem';
import { LootSystem } from './systems/LootSystem';
import { MovementSystem } from './systems/MovementSystem';
import { PickupSystem } from './systems/PickupSystem';
import { RenderSystem } from './systems/RenderSystem';
import { SpawnSystem } from './systems/SpawnSystem';
import { SpecialWeaponSystem } from './systems/SpecialWeaponSystem';
import { WeaponSynergySystem } from './systems/WeaponSynergySystem';
import { WeaponSystem } from './systems/WeaponSystem';
import { HomingSystem } from './systems/HomingSystem';
import { ChainSystem } from './systems/ChainSystem';
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

    /**
     * 初始化或更新渲染上下文
     * @param canvas Canvas 元素
     * @param logicalWidth 逻辑宽度（CSS 像素）
     * @param logicalHeight 逻辑高度（CSS 像素）
     *
     * 说明：
     * - 设置 Canvas 物理像素尺寸 = 逻辑尺寸 × DPR
     * - 应用 ctx.scale(dpr, dpr) 使后续绘图使用逻辑坐标
     * - 将 RenderContext 存入 World（而非 Engine 私有属性）
     */
    private initRenderContext(canvas: HTMLCanvasElement, logicalWidth: number, logicalHeight: number): void {
        const dpr = window.devicePixelRatio || 1;

        // 设置物理像素尺寸
        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;

        // 设置 CSS 显示尺寸
        canvas.style.width = `${logicalWidth}px`;
        canvas.style.height = `${logicalHeight}px`;

        // 获取 context 并应用 DPR 缩放
        const ctx = canvas.getContext('2d', { alpha: false })!;
        ctx.scale(dpr, dpr);

        // 更新 World（逻辑像素）
        this.world.width = logicalWidth;
        this.world.height = logicalHeight;

        // 存储 RenderContext 到 World
        this.world.renderContext = { canvas, context: ctx };
    }

    // ========== 调试模式：只测试渲染 ==========
    // 设为 true 时只运行渲染系统，用于调试渲染问题
    private static DEBUG_RENDER_ONLY = false;
    // ==========================================

    start(canvas: HTMLCanvasElement, bp: Blueprint) {
        this.canvas = canvas;
        this.world = createWorld();

        // 初始化输入管理器
        inputManager.init(canvas);


        // 初始化渲染上下文（使用统一方法）
        const initialWidth = canvas.clientWidth;
        const initialHeight = canvas.clientHeight;
        this.initRenderContext(canvas, initialWidth, initialHeight);

        this.world.worldId = spawnWorld(this.world);
        this.world.playerId = spawnPlayer(this.world, bp, this.world.width / 2, this.world.height - 80, 0);

        // 初始化 timeScale
        this.world.timeScale = 1.0;

        // 监听尺寸变化
        this.resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                this.initRenderContext(this.canvas, width, height);
            }
        });
        this.resizeObserver.observe(canvas);

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
            RenderSystem(world, dt);
            return;
        }
        // ==========================================

        // 按顺序执行所有系统（P0-P8）

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
        HomingSystem(world, dt);                         // 14. 导弹索敌系统

        // P5. 结算层 (事件处理)
        PickupSystem(world, dt);                        // 13. 拾取系统
        DamageResolutionSystem(world, dt);              // 14. 伤害结算系统
        ChainSystem(world, dt);                         // 15. 特斯拉连锁系统
        LootSystem(world, dt);                          // 16. 掉落系统
        ComboSystem(world, dt);                         // 17. 连击系统

        // P7. 表现层 (视听反馈)
        CameraSystem(world, dt);                        // 17. 相机系统
        EffectSystem(world, dt);                        // 18. 效果播放系统

        BlinkSystem(world, dt);                         // 19. 闪烁系统（更新闪烁状态）
        AudioSystem(world, dt);                         // 21. 音频系统

        // 拍快照（**必须在清理前**）
        this.snapshot$.next(buildSnapshot(world, dt));

        // P8. 清理层 (生命周期)
        LifetimeSystem(world, dt);                      // 21. 生命周期系统
        CleanupSystem(world, dt);                       // 22. 清理系统

        // 渲染系统（最后执行）
        RenderSystem(world, dt);  // 23. 渲染系统
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
