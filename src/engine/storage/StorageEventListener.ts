// src/engine/storage/StorageEventListener.ts

import type { GameStorage } from './GameStorage';
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
import type { World } from '../world';
import { EnemyTag, BossTag } from '../components/meta';
import { getEvents } from '../world';

/**
 * 存储事件监听器
 * 监听游戏事件并自动更新存档数据
 *
 * 注意：本项目使用帧内事件处理模式，而非传统的监听器模式。
 * 此类需要在游戏循环中每帧调用 processEvents() 来处理当帧事件。
 */
export class StorageEventListener {
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
   * @param world 世界对象
   */
  async processEvents(world: World): Promise<void> {
    // 处理命中事件（记录最高伤害）
    const hitEvents = getEvents<HitEvent>(world, 'Hit');
    for (const event of hitEvents) {
      await this.onHit(event, world);
    }

    // 处理击杀事件
    const killEvents = getEvents<KillEvent>(world, 'Kill');
    for (const event of killEvents) {
      await this.onKill(event, world);
    }

    // 处理拾取事件
    const pickupEvents = getEvents<PickupEvent>(world, 'Pickup');
    for (const event of pickupEvents) {
      await this.onPickup(event);
    }

    // 处理 Boss 进场（记录遇到）
    const bossEntranceEvents = getEvents<BossEntranceStartEvent>(world, 'BossEntranceStart');
    for (const event of bossEntranceEvents) {
      await this.onBossEntrance(event);
    }

    // 处理 Boss 击杀
    const bossDefeatEvents = getEvents<BossDefeatEvent>(world, 'BossDefeat');
    for (const event of bossDefeatEvents) {
      await this.onBossDefeat(event);
    }

    // 处理游戏胜利
    const victoryEvents = getEvents<VictoryEvent>(world, 'Victory');
    for (const event of victoryEvents) {
      await this.onVictory(event);
    }

    // 处理游戏失败
    const defeatEvents = getEvents<DefeatEvent>(world, 'Defeat');
    for (const _event of defeatEvents) {
      await this.onDefeat();
    }

    // 处理关卡过渡
    const levelTransitionEvents = getEvents<LevelTransitionCompleteEvent>(world, 'LevelTransitionComplete');
    for (const event of levelTransitionEvents) {
      this.setCurrentLevel(event.level);
    }
  }

  /**
   * 处理命中事件 - 记录最高伤害
   */
  private async onHit(event: HitEvent, world: World): Promise<void> {
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
  private async onKill(event: KillEvent, world: World): Promise<void> {
    this.currentSessionKills++;
    this.currentSessionScore += event.score;

    // 查询被击杀实体的类型
    const comps = world.entities.get(event.victim);
    if (!comps) {
      return;
    }

    // 检查是否是敌人
    const enemyTag = comps.find((c) => c instanceof EnemyTag) as EnemyTag | undefined;
    if (enemyTag) {
      await this.storage.recordEnemy(
        enemyTag.id,
        true,
        this.currentSessionDamage,
        0
      );
    }

    // 检查是否是 Boss
    const bossTag = comps.find((c) => c instanceof BossTag) as BossTag | undefined;
    if (bossTag) {
      this.currentSessionBossKills++;
      await this.storage.recordBoss(bossTag.id, true, this.currentSessionDamage);
    }
  }

  /**
   * 处理拾取事件
   */
  private async onPickup(event: PickupEvent): Promise<void> {
    const itemId = event.itemId;

    // 判断是武器还是道具
    if (itemId.startsWith('pickup_weapon_')) {
      const weaponIdStr = itemId.replace('pickup_weapon_', '') as WeaponId;
      await this.storage.recordWeapon(weaponIdStr, this.currentSessionDamage);
    } else if (itemId.startsWith('pickup_buff_')) {
      const buffTypeStr = itemId.replace('pickup_buff_', '') as BuffType;
      await this.storage.recordItem(buffTypeStr);
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
