import { Entity, EntityType } from '@/types';
import { EventBus } from './EventBus';
import { EventPayloads, CollisionEventType } from './events';

export class CollisionSystem {
  private bus: EventBus<EventPayloads>;
  private handlers?: {
    onBulletHit: (b: Entity, target: Entity) => void;
    onPlayerHit: (player: Entity, source: Entity) => void;
    onPowerup: (p: Entity) => void;
  };

  constructor(bus: EventBus<EventPayloads>, handlers?: {
    onBulletHit: (b: Entity, target: Entity) => void;
    onPlayerHit: (player: Entity, source: Entity) => void;
    onPowerup: (p: Entity) => void;
  }) {
    this.bus = bus;
    this.handlers = handlers;
  }

  private aabb(a: Entity, b: Entity) {
    return (
      a.x - a.width / 2 < b.x + b.width / 2 &&
      a.x + a.width / 2 > b.x - b.width / 2 &&
      a.y - a.height / 2 < b.y + b.height / 2 &&
      a.y + a.height / 2 > b.y - b.height / 2
    );
  }

  private playerAabb(player: Entity, other: Entity, shrink: number) {
    const pw = player.width * (1 - shrink);
    const ph = player.height * (1 - shrink);
    return (
      player.x - pw / 2 < other.x + other.width / 2 &&
      player.x + pw / 2 > other.x - other.width / 2 &&
      player.y - ph / 2 < other.y + other.height / 2 &&
      player.y + ph / 2 > other.y - other.height / 2
    );
  }

  async update(snapshot: {
    player?: Entity;
    enemies: Entity[];
    bullets: Entity[];
    enemyBullets: Entity[];
    powerups: Entity[];
    boss: Entity | null;
    bossWingmen: Entity[];
  }, playerHitboxShrink: number) {
    const player = snapshot.player;
    if (!player) return;

    for (const b of snapshot.bullets) {
      for (const e of snapshot.enemies) {
        if (this.aabb(b, e)) {
          if (this.handlers) this.handlers.onBulletHit(b, e);
          await this.bus.publish(CollisionEventType.BulletHitEnemy, {});
        }
      }
      for (const w of snapshot.bossWingmen) {
        if (this.aabb(b, w)) {
          if (this.handlers) this.handlers.onBulletHit(b, w);
          await this.bus.publish(CollisionEventType.BulletHitEnemy, {});
        }
      }
      if (snapshot.boss && this.aabb(b, snapshot.boss)) {
        if (this.handlers) this.handlers.onBulletHit(b, snapshot.boss);
        await this.bus.publish(CollisionEventType.BulletHitBoss, {});
      }
    }

    for (const e of [...snapshot.enemyBullets, ...snapshot.enemies, ...snapshot.bossWingmen]) {
      if (e.type === EntityType.BULLET) {
        if (this.playerAabb(player, e, playerHitboxShrink)) {
          if (this.handlers) this.handlers.onPlayerHit(player, e);
          await this.bus.publish(CollisionEventType.EnemyBulletHitPlayer, {});
        }
      } else {
        if (this.playerAabb(player, e, playerHitboxShrink)) {
          if (this.handlers) this.handlers.onPlayerHit(player, e);
          await this.bus.publish(CollisionEventType.PlayerCollideEnemy, {});
        }
      }
    }

    if (snapshot.boss && this.playerAabb(player, snapshot.boss, playerHitboxShrink)) {
      if (this.handlers) this.handlers.onPlayerHit(player, snapshot.boss);
      await this.bus.publish(CollisionEventType.PlayerCollideBoss, {});
    }

    for (const p of snapshot.powerups) {
      if (this.playerAabb(player, p, playerHitboxShrink)) {
        if (this.handlers) this.handlers.onPowerup(p);
        await this.bus.publish(CollisionEventType.PowerupCollected, {});
      }
    }
  }
}
