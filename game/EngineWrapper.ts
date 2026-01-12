import { Engine } from './engine';
import { GameSnapshot } from './snapshot';
import { GameState } from '@/types';
import { ComboState } from './systems-deprecated/ComboSystem';
import { SynergyConfig } from './systems-deprecated/WeaponSynergySystem';
import { WeaponType } from '@/types/sprite';

export class EngineWrapper {
  private engine: Engine;
  private onScoreChange?: (score: number) => void;
  private onLevelChange?: (level: number) => void;
  private onStateChange?: (state: GameState) => void;
  private onHpChange?: (hp: number) => void;
  private onBombsChange?: (bombs: number) => void;
  private onMaxLevelChange?: (maxLevel: number) => void;
  private onBossWarningChange?: (show: boolean) => void;
  private onComboChange?: (combo: ComboState) => void;

  public showLevelTransition = false;
  public levelTransitionTimer = 0;
  public weaponType = WeaponType.VULCAN;
  public secondaryWeapon: WeaponType | null = null;
  public weaponLevel = 1;

  private lastSnapshot: GameSnapshot | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    onScoreChange?: (score: number) => void,
    onLevelChange?: (level: number) => void,
    onStateChange?: (state: GameState) => void,
    onHpChange?: (hp: number) => void,
    onBombsChange?: (bombs: number) => void,
    onMaxLevelChange?: (maxLevel: number) => void,
    onBossWarningChange?: (show: boolean) => void,
    onComboChange?: (combo: ComboState) => void
  ) {
    this.onScoreChange = onScoreChange;
    this.onLevelChange = onLevelChange;
    this.onStateChange = onStateChange;
    this.onHpChange = onHpChange;
    this.onBombsChange = onBombsChange;
    this.onMaxLevelChange = onMaxLevelChange;
    this.onBossWarningChange = onBossWarningChange;
    this.onComboChange = onComboChange;

    this.engine = new Engine();

    this.subscribeToSnapshots();
  }

  private subscribeToSnapshots(): void {
    this.engine.snapshot$.subscribe(snapshot => {
      if (!snapshot) return;

      this.lastSnapshot = snapshot;

      if (this.onScoreChange) this.onScoreChange(snapshot.score);
      if (this.onLevelChange) this.onLevelChange(snapshot.level);

      const player = snapshot.player;
      if (this.onHpChange && player) {
        this.onHpChange(player.hp || 0);
      }
    });
  }

  start(): void {
    this.engine.start(this.canvas);
    this.onStateChange?.(GameState.PLAYING);
  }

  pause(): void {
    this.engine.pause();
    this.onStateChange?.(GameState.PAUSED);
  }

  resume(): void {
    this.engine.resume();
    this.onStateChange?.(GameState.PLAYING);
  }

  stop(): void {
    this.engine.stop();
    this.onStateChange?.(GameState.MENU);
  }

  resize(): void {
    if (this.canvas) {
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
    }
  }

  startGame(): void {
    this.start();
  }

  triggerBomb(x?: number, y?: number): void {
    console.log('[Engine] Bomb triggered at', x, y);
  }

  getShieldPercent(): number {
    const player = this.lastSnapshot?.player;
    if (!player || !player.shield || !player.maxHp) return 0;
    return Math.round((player.shield / player.maxHp) * 100);
  }

  get audio(): any {
    return {
      playClick: (type: string) => {
        console.log('[Audio] Click:', type);
      }
    };
  }

  get synergy(): any {
    return {
      getActiveSynergies: () => {
        return [];
      }
    };
  }
}
