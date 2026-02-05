// src/engine/storage/StorageEventListener.ts

import type { GameStorage } from './GameStorage';
import type { GameEvent } from '../events';
import type {
  HitEvent,
  KillEvent,
  PickupEvent,
  BossDefeatEvent,
  BossEntranceStartEvent,
  VictoryEvent,
  DefeatEvent,
  LevelTransitionCompleteEvent,
} from '../events/events';
import { FighterId, WeaponId, BuffType } from '../types/ids';

/**
 * 存储事件监听器
 * 监听游戏事件并自动更新存档数据
 *
 * 注意：本项目使用帧内事件处理模式，而非传统的监听器模式。
 * 此类需要在游戏循环中每帧调用 processEvents() 来处理当帧事件。
 */
export class StorageEventListener {
  /** 拾取武器 itemId 前缀 */
  private readonly PICKUP_WEAPON_PREFIX = 'pickup_weapon_';
  /** 拾取道具 itemId 前缀 */
  private readonly PICKUP_BUFF_PREFIX = 'pickup_buff_';

  private storage: GameStorage;
  private currentFighterId: FighterId;
  private currentGameStartTime: number = 0;
  private currentSessionKills: number = 0;
  private currentSessionBossKills: number = 0;
  private currentSessionDamage: number = 0;
  private currentSessionScore: number = 0;
  private currentLevel: number = 1;

  constructor(storage: GameStorage) {
    this.storage = storage;
    this.currentFighterId = FighterId.NEON;
  }

  /**
   * 验证字符串是否为有效的 WeaponId
   * @param id 待验证的字符串
   */
  private isValidWeaponId(id: string): id is WeaponId {
    return Object.values(WeaponId).includes(id as WeaponId);
  }

  /**
   * 验证字符串是否为有效的 BuffType
   * @param id 待验证的字符串
   */
  private isValidBuffType(id: string): id is BuffType {
    return Object.values(BuffType).includes(id as BuffType);
  }

  /**
   * 设置当前游戏的战机
   */
  setCurrentFighter(fighterId: FighterId): void {
    this.currentFighterId = fighterId;
  }

  /**
   * 开始游戏会话
   */
  startGameSession(): void {
    this.currentGameStartTime = Date.now();
    this.currentSessionKills = 0;
    this.currentSessionBossKills = 0;
    this.currentSessionDamage = 0;
    this.currentSessionScore = 0;
    this.currentLevel = 1;
  }

  /**
   * 设置当前关卡
   */
  setCurrentLevel(level: number): void {
    this.currentLevel = level;
  }

  /**
   * 结束游戏会话并保存
   */
  async endGameSession(finalScore: number, finalLevel: number): Promise<void> {
    const playTimeMs = Date.now() - this.currentGameStartTime;
    const stats = this.storage.getFighterStats(this.currentFighterId);

    await this.storage.updateFighterStats(this.currentFighterId, {
      lastUsedAt: Date.now(),
      playCount: stats.playCount + 1,
      totalPlayTimeMs: stats.totalPlayTimeMs + playTimeMs,
      totalEnemyKills: stats.totalEnemyKills + this.currentSessionKills,
      totalBossKills: stats.totalBossKills + this.currentSessionBossKills,
      highScore: Math.max(stats.highScore, finalScore),
      maxLevel: Math.max(stats.maxLevel, finalLevel),
      highestDamage: Math.max(stats.highestDamage, this.currentSessionDamage),
    });

    // 更新全局进度
    await this.storage.updateHighScore(finalLevel, finalScore);

    // 更新全局游戏次数
    const data = this.storage.getData();
    data.progress.totalPlayCount += 1;
    data.progress.totalPlayTimeMs += playTimeMs;
    await this.storage.save(data);
  }

  /**
   * 处理当帧的所有事件（在游戏循环中每帧调用）
   * @param events 事件数组
   */
  async processEvents(events: GameEvent[]): Promise<void> {
    for (const event of events) {
      switch (event.type) {
        case 'Hit':
          await this.onHit(event as HitEvent);
          break;
        case 'Kill':
          await this.onKill(event as KillEvent);
          break;
        case 'Pickup':
          await this.onPickup(event as PickupEvent);
          break;
        case 'BossEntranceStart':
          await this.onBossEntrance(event as BossEntranceStartEvent);
          break;
        case 'BossDefeat':
          await this.onBossDefeat(event as BossDefeatEvent);
          break;
        case 'Victory':
          await this.onVictory(event as VictoryEvent);
          break;
        case 'Defeat':
          await this.onDefeat();
          break;
        case 'LevelTransitionComplete':
          this.setCurrentLevel((event as LevelTransitionCompleteEvent).level);
          break;
      }
    }
  }

  /**
   * 处理命中事件 - 记录最高伤害
   */
  private async onHit(event: HitEvent): Promise<void> {
    const damage = event.damage;
    this.currentSessionDamage = Math.max(this.currentSessionDamage, damage);

    // 更新战机最高伤害
    const stats = this.storage.getFighterStats(this.currentFighterId);
    if (damage > stats.highestDamage) {
      await this.storage.updateFighterStats(this.currentFighterId, {
        highestDamage: damage,
      });
    }
  }

  /**
   * 处理击杀事件
   */
  private async onKill(event: KillEvent): Promise<void> {
    this.currentSessionKills++;
    this.currentSessionScore += event.score;

    // 从事件中读取 tag 信息
    if (event.enemyId) {
      await this.storage.recordEnemy(
        event.enemyId,
        true,
        this.currentSessionDamage,
        0
      );
    }

    if (event.bossId) {
      this.currentSessionBossKills++;
      await this.storage.recordBoss(event.bossId, true, this.currentSessionDamage);
    }
  }

  /**
   * 处理拾取事件
   */
  private async onPickup(event: PickupEvent): Promise<void> {
    const itemId = event.itemId;

    // 判断是武器还是道具
    if (itemId.startsWith(this.PICKUP_WEAPON_PREFIX)) {
      const weaponIdStr = itemId.replace(this.PICKUP_WEAPON_PREFIX, '');
      if (this.isValidWeaponId(weaponIdStr)) {
        await this.storage.recordWeapon(weaponIdStr, this.currentSessionDamage);
      }
    } else if (itemId.startsWith(this.PICKUP_BUFF_PREFIX)) {
      const buffTypeStr = itemId.replace(this.PICKUP_BUFF_PREFIX, '');
      if (this.isValidBuffType(buffTypeStr)) {
        await this.storage.recordItem(buffTypeStr);
      }
    }
  }

  /**
   * 处理 Boss 进场 - 记录遇到
   */
  private async onBossEntrance(event: BossEntranceStartEvent): Promise<void> {
    await this.storage.recordBoss(event.bossId, false);
  }

  /**
   * 处理 Boss 击杀
   */
  private async onBossDefeat(event: BossDefeatEvent): Promise<void> {
    // 注意：Boss 击杀可能已经在 KillEvent 中处理了（通过 BossTag）
    // 这里只确保记录，避免重复计数
    await this.storage.recordBoss(
      event.bossId,
      true,
      this.currentSessionDamage
    );
  }

  /**
   * 处理游戏胜利
   */
  private async onVictory(event: VictoryEvent): Promise<void> {
    await this.endGameSession(this.currentSessionScore, event.finalLevel);
  }

  /**
   * 处理游戏失败
   */
  private async onDefeat(): Promise<void> {
    await this.endGameSession(this.currentSessionScore, this.currentLevel);
  }
}
