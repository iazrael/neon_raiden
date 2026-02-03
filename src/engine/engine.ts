import { BehaviorSubject } from 'rxjs';
import { createWorld, World, generateId, addComponent } from './world';
import { Blueprint } from './blueprints';
import { spawnPlayer, spawnWorld } from './factory';
import { buildSnapshot, GameSnapshot } from './snapshot';
import { inputManager } from './input/InputManager';
import { PerformanceMonitor, FrameSnapshot } from './utils/performance';
import { DebugConfig } from './config/DebugConfig';

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
     * 性能监控器
     */
    private performanceMonitor = new PerformanceMonitor(DebugConfig.performance);

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

        // 性能监控：帧开始
        const frameStartMs = performance.now();
        this.performanceMonitor.startFrame();

        // 辅助函数：记录系统耗时
        const recordSys = (name: string, layer: string, fn: () => void) => {
            const startMs = performance.now();
            fn();
            this.performanceMonitor.recordSystem(name, layer, performance.now() - startMs);
        };

        // 按顺序执行所有系统（P0-P8）

        // P1. 决策层 (输入与AI)
        recordSys('InputSystem', 'P1', () => InputSystem(world, dt));
        recordSys('SpawnSystem', 'P1', () => SpawnSystem(world, dt));
        recordSys('BossSystem', 'P1', () => BossSystem(world, dt));
        recordSys('EnemySystem', 'P1', () => EnemySystem(world, dt));

        // P2. 状态层 (数值更新)
        recordSys('BuffSystem', 'P2', () => BuffSystem(world, dt));
        recordSys('WeaponSystem', 'P2', () => WeaponSystem(world, dt));

        // P3. 物理层 (位移)
        recordSys('MovementSystem', 'P3', () => MovementSystem(world, dt));

        // P4. 交互层 (核心碰撞)
        recordSys('BombSystem', 'P4', () => BombSystem(world, dt));
        recordSys('CollisionSystem', 'P4', () => CollisionSystem(world, dt));
        recordSys('HomingSystem', 'P4', () => HomingSystem(world, dt));

        // P5. 结算层 (事件处理)
        recordSys('PickupSystem', 'P5', () => PickupSystem(world, dt));
        recordSys('DamageResolutionSystem', 'P5', () => DamageResolutionSystem(world, dt));
        recordSys('ChainSystem', 'P5', () => ChainSystem(world, dt));
        recordSys('LootSystem', 'P5', () => LootSystem(world, dt));
        recordSys('ComboSystem', 'P5', () => ComboSystem(world, dt));

        // P7. 表现层 (视听反馈)
        recordSys('CameraSystem', 'P7', () => CameraSystem(world, dt));
        recordSys('EffectSystem', 'P7', () => EffectSystem(world, dt));
        recordSys('BlinkSystem', 'P7', () => BlinkSystem(world, dt));
        recordSys('AudioSystem', 'P7', () => AudioSystem(world, dt));

        // 拍快照（**必须在清理前**）
        recordSys('buildSnapshot', 'snapshot', () => this.snapshot$.next(buildSnapshot(world, dt)));

        // P8. 清理层 (生命周期)
        recordSys('LifetimeSystem', 'P8', () => LifetimeSystem(world, dt));
        recordSys('CleanupSystem', 'P8', () => CleanupSystem(world, dt));

        // 渲染系统（最后执行）
        recordSys('RenderSystem', 'Render', () => RenderSystem(world, dt));

        // 性能监控：帧结束
        const frameTimeMs = performance.now() - frameStartMs;
        this.performanceMonitor.endFrame(frameTimeMs);
    }

    /**
     * 设置调试模式
     * @param enabled true 时只运行渲染系统
     */
    public static setDebugRenderOnly(enabled: boolean): void {
        Engine.DEBUG_RENDER_ONLY = enabled;
        console.log('[Engine] Debug Render Only:', enabled ? 'ENABLED' : 'DISABLED');
    }

    /**
     * 获取性能监控流
     */
    get performanceStream(): BehaviorSubject<FrameSnapshot | null> {
        return this.performanceMonitor.stream;
    }
}
