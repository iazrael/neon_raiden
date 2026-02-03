/**
 * ReactEngine - ECS 引擎的 React 适配层
 *
 * 这个类包装了新的 ECS Engine，提供与旧 GameEngine 兼容的接口，
 * 使得 React UI 组件可以无缝切换到新架构。
 *
 * 主要职责：
 * - 包装 Engine 类，提供 React 友好的 API
 * - 管理游戏状态同步 (通过 snapshot$)
 * - 提供 UI 回调接口
 * - 处理用户输入 (炸弹等)
 */

import { Engine } from './engine';
import { Blueprint, BLUEPRINT_FIGHTER_NEON } from './blueprints';
import type { GameSnapshot } from './snapshot';
import { ComboState, GameState, WeaponId } from './types';
import { inputManager } from './input/InputManager';



/**
 * ReactEngine - 适配新 ECS 引擎供 React 使用
 */
export class ReactEngine {
    private engine: Engine;
    private canvas: HTMLCanvasElement | null = null;


    // ========== 游戏状态 (与旧 GameEngine 兼容) ==========
    public state: GameState = GameState.MENU;
    public score: number = 0;
    public level: number = 1;
    public maxLevels: number = 5;

    // 玩家状态
    public hp: number = 100;
    public bombs: number = 0;
    public shieldPercent: number = 0;
    public playerLevel: number = 1;
    public weaponId: WeaponId = WeaponId.VULCAN;
    public secondaryWeapon: WeaponId | null = null;
    public weaponLevel: number = 1;

    // UI 状态
    public showLevelTransition: boolean = false;
    public levelTransitionTimer: number = 0;
    public maxLevelReached: number = 1;
    public showBossWarning: boolean = false;

    // P2 Combo & Synergy
    public comboState: ComboState = { count: 0, timer: 0, level: 0, maxCombo: 0, hasBerserk: false };

    // Boss 状态
    public boss: { hp: number; maxHp: number } | null = null;

    // Boss Warning 计时器引用
    private bossWarningTimer: ReturnType<typeof setTimeout> | null = null;

    // ========== 订阅 cleanup ==========
    private snapshotSubscription: any = null;

    // ========== 回调函数 (与旧 GameEngine 兼容) ==========
    private onScoreChange: (score: number) => void = () => {};
    private onLevelChange: (level: number) => void = () => {};
    private onStateChange: (state: GameState) => void = () => {};
    private onHpChange: (hp: number) => void = () => {};
    private onBombChange: (bombs: number) => void = () => {};
    private onMaxLevelChange: (level: number) => void = () => {};
    private onBossWarning: (show: boolean) => void = () => {};
    private onComboChange: (state: ComboState) => void = () => {};
    private onBossChange: (boss: { hp: number; maxHp: number } | null) => void = () => {};

    constructor(
        canvas: HTMLCanvasElement | null = null,
        onScoreChange?: (s: number) => void,
        onLevelChange?: (l: number) => void,
        onStateChange?: (s: GameState) => void,
        onHpChange?: (hp: number) => void,
        onBombChange?: (bombs: number) => void,
        onMaxLevelChange?: (level: number) => void,
        onBossWarning?: (show: boolean) => void,
        onComboChange?: (state: ComboState) => void,
        onBossChange?: (boss: { hp: number; maxHp: number } | null) => void
    ) {
        this.engine = new Engine();
        this.canvas = canvas ?? null;

        // 设置回调
        if (onScoreChange) this.onScoreChange = onScoreChange;
        if (onLevelChange) this.onLevelChange = onLevelChange;
        if (onStateChange) this.onStateChange = onStateChange;
        if (onHpChange) this.onHpChange = onHpChange;
        if (onBombChange) this.onBombChange = onBombChange;
        if (onMaxLevelChange) this.onMaxLevelChange = onMaxLevelChange;
        if (onBossWarning) this.onBossWarning = onBossWarning;
        if (onComboChange) this.onComboChange = onComboChange;
        if (onBossChange) this.onBossChange = onBossChange;
    }

    /**
     * 启动游戏 (内部方法)
     * @param canvas Canvas 元素
     * @param blueprint 玩家蓝图
     */
    start(canvas: HTMLCanvasElement, blueprint: Blueprint): void {
        this.canvas = canvas;

        // 订阅快照流以同步状态
        this.snapshotSubscription = this.engine.snapshot$.subscribe((snapshot: GameSnapshot | null) => {
            if (snapshot) {
                this.syncFromSnapshot(snapshot);
            }
        });

        // 启动引擎
        this.engine.start(canvas, blueprint);

        // 更新状态
        this.setState(GameState.PLAYING);
    }

    /**
     * 开始游戏 (与旧 GameEngine 兼容)
     */
    startGame(): void {
        if (this.canvas) {
            // 使用预定义的玩家战机蓝图，包含 Health 等必要组件
            // 覆盖位置信息以适应当前 canvas 尺寸
            const blueprint: Blueprint = {
                ...BLUEPRINT_FIGHTER_NEON,
                Transform: {
                    x: this.canvas.width / 2,
                    y: this.canvas.height - 80,
                    rot: 0
                }
            };
            this.start(this.canvas, blueprint);
        }
    }

    /**
     * 调整大小 (与旧 GameEngine 兼容)
     * 实际上由 ResizeObserver 自动处理，这里保留接口兼容性
     */
    resize(): void {
        // 由 Engine 内部的 ResizeObserver 自动处理
    }

    /**
     * 暂停游戏
     */
    pause(): void {
        this.engine.pause();
        if (this.state === GameState.PLAYING) {
            this.setState(GameState.PAUSED);
        }
    }

    /**
     * 恢复游戏
     */
    resume(): void {
        this.engine.resume();
        if (this.state === GameState.PAUSED) {
            this.setState(GameState.PLAYING);
        }
    }

    /**
     * 停止游戏
     */
    stop(): void {
        this.engine.stop();
        this.setState(GameState.MENU);

        // 清理订阅
        if (this.snapshotSubscription) {
            this.snapshotSubscription.unsubscribe();
            this.snapshotSubscription = null;
        }

        // 清理计时器
        if (this.bossWarningTimer) {
            clearTimeout(this.bossWarningTimer);
            this.bossWarningTimer = null;
        }
    }

    /**
     * 设置游戏状态（内部辅助方法）
     */
    private setState(newState: GameState): void {
        if (this.state !== newState) {
            this.state = newState;
            this.onStateChange(this.state);
        }
    }

    /**
     * 触发炸弹
     * @param x 目标 X 坐标 (可选,暂未使用)
     * @param y 目标 Y 坐标 (可选,暂未使用)
     */
    triggerBomb(x?: number, y?: number): void {
        if (this.state !== GameState.PLAYING) return;

        // 通过 InputManager 触发炸弹意图
        // 实际炸弹数量由 BombSystem 中的 BombComponent 管理
        inputManager.triggerBomb();

        // 不再在这里减少炸弹数量
        // 炸弹消费在 BombSystem 中处理
        // 数量变化通过 snapshot 同步
    }

    /**
     * 获取护盾百分比
     */
    getShieldPercent(): number {
        // 护盾最大值为生命值的一半
        return this.shieldPercent;
    }

    /**
     * 获取性能监控流
     */
    get performanceStream() {
        return this.engine.performanceStream;
    }

    /**
     * 从快照同步状态到 UI
     */
    private syncFromSnapshot(snapshot: GameSnapshot): void {
        // 处理游戏状态事件（失败/胜利）
        if (snapshot.gameStateEvent === 'defeat') {
            this.setState(GameState.GAME_OVER);
        } else if (snapshot.gameStateEvent === 'victory') {
            this.setState(GameState.VICTORY);
        }

        // 处理 Boss 事件
        if (snapshot.bossEvent) {
            if (snapshot.bossEvent.type === 'entranceStart') {
                // Boss 开始进场
                this.showBossWarning = true;
                this.onBossWarning(true);

                // 启动 3 秒自动隐藏计时器
                if (this.bossWarningTimer) {
                    clearTimeout(this.bossWarningTimer);
                }
                this.bossWarningTimer = setTimeout(() => {
                    this.showBossWarning = false;
                    this.onBossWarning(false);
                    this.bossWarningTimer = null;
                }, 3000);

            } else if (snapshot.bossEvent.type === 'entranceComplete') {
                // Boss 进场完成，确保隐藏 warning
                if (this.bossWarningTimer) {
                    clearTimeout(this.bossWarningTimer);
                    this.bossWarningTimer = null;
                }
                this.showBossWarning = false;
                this.onBossWarning(false);

            } else if (snapshot.bossEvent.type === 'defeat') {
                // Boss 被击败
                if (this.bossWarningTimer) {
                    clearTimeout(this.bossWarningTimer);
                    this.bossWarningTimer = null;
                }
                this.showBossWarning = false;
                this.onBossWarning(false);
            }
        }

        // 同步分数
        if (snapshot.score !== this.score) {
            this.score = snapshot.score;
            this.onScoreChange(this.score);
        }

        // 同步关卡
        if (snapshot.level !== this.level) {
            this.level = snapshot.level;
            this.onLevelChange(this.level);
        }

        // 同步玩家状态
        this.hp = snapshot.player.hp;
        this.bombs = snapshot.player.bombs;
        this.shieldPercent = snapshot.player.shieldPercent;
        this.weaponId = snapshot.player.weaponId;
        this.secondaryWeapon = snapshot.player.secondaryWeapon;
        this.weaponLevel = snapshot.player.weaponLevel;

        // 同步 HP 变化
        this.onHpChange(this.hp);

        // 同步 Combo
        if (snapshot.comboState) {
            this.comboState = snapshot.comboState;
            this.onComboChange(this.comboState);
        }

        // 同步 UI 状态
        this.showLevelTransition = snapshot.showLevelTransition;
        this.levelTransitionTimer = snapshot.levelTransitionTimer;

        // 同步 Boss 状态
        if (snapshot.boss) {
            this.boss = {
                hp: snapshot.boss.hp,
                maxHp: snapshot.boss.maxHp
            };
        } else {
            this.boss = null;
        }
        this.onBossChange(this.boss);
    }
}
