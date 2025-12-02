import { EventBus } from './EventBus';
import { EventPayloads, LevelEventType } from './events';
import { BossSpawnConfig, EnemyCommonConfig } from '../config';

export class LevelManager {
  level: number = 1;
  progress: number = 0;
  enemySpawnTimer: number = 0;
  levelStartTime: number = Date.now();
  isLevelTransitioning: boolean = false;
  isBossWarningActive: boolean = false;
  bossWarningTimer: number = 0;
  private bus: EventBus<EventPayloads>;
  private debugEnemyKillCount: number = 0;
  private debugModeEnabled: boolean = false;

  constructor(bus: EventBus<EventPayloads>, debug: boolean) {
    this.bus = bus;
    this.debugModeEnabled = debug;
  }

  reset(level: number) {
    this.level = level;
    this.progress = 0;
    this.enemySpawnTimer = 0;
    this.levelStartTime = Date.now();
    this.isLevelTransitioning = false;
    this.isBossWarningActive = false;
    this.bossWarningTimer = 0;
    this.bus.publish(LevelEventType.LevelStarted, { level });
  }

  addKill() {
    if (this.debugModeEnabled) this.debugEnemyKillCount++;
  }

  update(dt: number, timeScale: number) {
    if (!this.isLevelTransitioning) this.progress += 0.05 * timeScale;
    this.enemySpawnTimer += dt;

    if (this.isBossWarningActive) {
      this.bossWarningTimer -= dt;
      if (this.bossWarningTimer <= 0) {
        this.isBossWarningActive = false;
        this.bus.publish(LevelEventType.BossWarning, { show: false });
      }
    }
  }

  shouldSpawnEnemy(spawnRate: number) {
    if (this.enemySpawnTimer > spawnRate) {
      this.enemySpawnTimer = 0;
      return true;
    }
    return false;
  }

  trySpawnBoss(): boolean {
    const levelDuration = (Date.now() - this.levelStartTime) / 1000;
    const minDuration = BossSpawnConfig.minLevelDuration;
    const minProgress = BossSpawnConfig.minLevelProgress;
    if (this.debugModeEnabled) {
      if (levelDuration >= 10 && this.debugEnemyKillCount >= 10 && !this.isLevelTransitioning) {
        if (!this.isBossWarningActive) {
          this.isBossWarningActive = true;
          this.bossWarningTimer = 3000;
          this.bus.publish(LevelEventType.BossWarning, { show: true });
          this.bus.publish(LevelEventType.BossSpawned, { level: this.level });
          return true;
        }
      }
    } else if (this.progress >= minProgress && levelDuration >= minDuration && !this.isLevelTransitioning) {
      if (!this.isBossWarningActive) {
        this.isBossWarningActive = true;
        this.bossWarningTimer = 3000;
        this.bus.publish(LevelEventType.BossWarning, { show: true });
        this.bus.publish(LevelEventType.BossSpawned, { level: this.level });
        return true;
      }
    }
    return false;
  }

  getSpawnRateForLevel(modifier: number) {
    const baseSpawnRate = EnemyCommonConfig.enemySpawnIntervalByLevel[this.level] || 1000;
    return Math.round(baseSpawnRate * modifier);
  }
}

