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
import { Blueprint } from './blueprints';
import { GameState, WeaponType } from '@/types';
import type { ComboState } from '@/game/systems/ComboSystem';
import type { SynergyConfig } from '@/game/systems/WeaponSynergySystem';
import type { GameSnapshot } from './snapshot';

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
    public shield: number = 0;
    public playerLevel: number = 1;
    public weaponType: WeaponType = WeaponType.VULCAN;
    public secondaryWeapon: WeaponType | null = null;
    public weaponLevel: number = 1;

    // UI 状态
    public showLevelTransition: boolean = false;
    public levelTransitionTimer: number = 0;
    public maxLevelReached: number = 1;
    public showBossWarning: boolean = false;

    // P2 Combo & Synergy
    public comboState: ComboState = { count: 0, timer: 0, level: 0, maxCombo: 0, hasBerserk: false };
    public activeSynergies: SynergyConfig[] = [];

    // ========== 回调函数 (与旧 GameEngine 兼容) ==========
    public onScoreChange: (score: number) => void = () => {};
    public onLevelChange: (level: number) => void = () => {};
    public onStateChange: (state: GameState) => void = () => {};
    public onHpChange: (hp: number) => void = () => {};
    public onBombChange: (bombs: number) => void = () => {};
    public onMaxLevelChange: (level: number) => void = () => {};
    public onBossWarning: (show: boolean) => void = () => {};
    public onComboChange: (state: ComboState) => void = () => {};

    // ========== 订阅 cleanup ==========
    private snapshotSubscription: any = null;

    constructor() {
        this.engine = new Engine();
    }

    /**
     * 启动游戏
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
        this.state = GameState.PLAYING;
        this.onStateChange(this.state);
    }

    /**
     * 暂停游戏
     */
    pause(): void {
        this.engine.pause();
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            this.onStateChange(this.state);
        }
    }

    /**
     * 恢复游戏
     */
    resume(): void {
        this.engine.resume();
        if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
            this.onStateChange(this.state);
        }
    }

    /**
     * 停止游戏
     */
    stop(): void {
        this.engine.stop();
        this.state = GameState.MENU;
        this.onStateChange(this.state);

        // 清理订阅
        if (this.snapshotSubscription) {
            this.snapshotSubscription.unsubscribe();
            this.snapshotSubscription = null;
        }
    }

    /**
     * 触发炸弹
     * @param x 目标 X 坐标 (可选)
     * @param y 目标 Y 坐标 (可选)
     */
    triggerBomb(x?: number, y?: number): void {
        if (this.bombs > 0 && this.state === GameState.PLAYING) {
            this.bombs--;
            this.onBombChange(this.bombs);

            // TODO: 通过事件系统触发炸弹效果
            // 目前简化处理：直接调用引擎方法或推送事件
        }
    }

    /**
     * 获取护盾百分比
     */
    getShieldPercent(): number {
        // 护盾最大值为生命值的一半
        const maxShield = this.hp * 0.5;
        return maxShield > 0 ? Math.max(0, Math.min(100, (this.shield / maxShield) * 100)) : 0;
    }

    /**
     * 从快照同步状态到 UI
     */
    private syncFromSnapshot(snapshot: GameSnapshot): void {
        // 同步游戏状态
        if (snapshot.state !== this.state) {
            this.state = snapshot.state;
            this.onStateChange(this.state);
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
        // shieldPercent 是通过 getShieldPercent() 方法计算的，不需要存储
        this.shield = 0;  // 由 snapshot 更新
        this.weaponType = snapshot.player.weaponType as WeaponType;
        this.secondaryWeapon = snapshot.player.secondaryWeapon as WeaponType | null;
        this.weaponLevel = snapshot.player.weaponLevel;
        this.activeSynergies = snapshot.player.activeSynergies;

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
        this.showBossWarning = snapshot.showBossWarning;
    }
}
