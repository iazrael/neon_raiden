import { BehaviorSubject } from 'rxjs';
import { createWorld } from './world';
import { World } from './types';
import { Blueprint } from './blueprints';
import { spawnPlayer } from './factory';
import { buildSnapshot, GameSnapshot } from './snapshot';

// ============== 导入所有系统
import { AISteerSystem } from './systems/AISteerSystem';
import { AudioSystem } from './systems/AudioSystem';
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
import { RenderSystem } from './systems/RenderSystem';
import { SpawnSystem } from './systems/SpawnSystem';
import { WeaponSynergySystem } from './systems/WeaponSynergySystem';
import { WeaponSystem } from './systems/WeaponSystem';
// ==============

export class Engine {
    private raf = 0;
    private world: World;
    private ctx: CanvasRenderingContext2D;
    private resizeObserver: ResizeObserver;
    public snapshot$ = new BehaviorSubject<GameSnapshot | null>(null);

    start(canvas: HTMLCanvasElement, bp: Blueprint) {
        this.ctx = canvas.getContext('2d')!;
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
        // ① 逻辑循环（所有 System）
        // 按顺序执行所有系统

        // P1. 决策层 (输入与AI)
        InputSystem(world, dt);                         // 1. 输入系统 - 读取键盘/手柄输入
        DifficultySystem(world, dt);                    // 2. 难度系统 - 根据时间/击杀调整难度
        SpawnSystem(world, dt);                         // 3. 生成系统 - 刷新敌人
        BossPhaseSystem(world, dt);                  // 4. Boss阶段系统 - 控制Boss阶段转换
        BossSystem(world, dt);                          // 5. Boss系统 - 控制Boss行为
        EnemySystem(world, dt);                          // 6. 敌人系统 - 控制敌人决策 (ECS版)
        AISteerSystem(world, dt);                       // 7. AI转向系统 - 生成敌人移动意图

        // P2. 状态层 (数值更新)
        BuffSystem(world, dt);                          // 8. 增益系统 - 更新Buff效果
        WeaponSynergySystem(world, dt);                 // 9. 武器协同系统 - 计算武器组合效果
        WeaponSystem(world, dt);                        // 10. 武器系统 - 处理武器射击

        // P3. 物理层 (位移)
        MovementSystem(world, dt);                      // 11. 移动系统 - 更新实体位置

        // P4. 交互层 (核心碰撞)
        CollisionSystem(world, dt);                     // 12. 碰撞系统 - 检测碰撞并生成事件

        // P5. 结算层 (事件处理)
        PickupSystem(world, dt);                        // 13. 拾取系统 - 处理道具拾取
        DamageResolutionSystem(world, dt);              // 14. 伤害结算系统 - 处理伤害和死亡
        LootSystem(world, dt);                          // 15. 掉落系统 - 处理敌人掉落
        ComboSystem(world, dt);                         // 16. 连击系统 - 处理连击逻辑

        // P6. 表现层 (视听反馈)
        CameraSystem(world, dt);                        // 17. 相机系统 - 更新相机位置
        EffectPlayer(world, dt);                        // 18. 效果播放系统 - 播放视觉效果
        AudioSystem(world, dt);                         // 19. 音频系统 - 播放音效

        // ② 拍快照（**必须在清理前**）
        this.snapshot$.next(buildSnapshot(this.world, dt));

        // P7. 清理层 (生命周期)
        LifetimeSystem(world, dt);                      // 21. 生命周期系统 - 处理实体生命周期
        CleanupSystem(world, dt);                       // 22. 清理系统 - 删除标记销毁的实体
        RenderSystem(this.ctx, world);                  // 20. 渲染系统 - 绘制游戏画面
    }
}
