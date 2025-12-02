import { Entity, Particle, Shockwave } from '@/types';

export class EntityManager {
  player?: Entity;
  options: Entity[] = [];
  enemies: Entity[] = [];
  bullets: Entity[] = [];
  enemyBullets: Entity[] = [];
  powerups: Entity[] = [];
  particles: Particle[] = [];
  shockwaves: Shockwave[] = [];
  boss?: Entity | null;
  bossWingmen: Entity[] = [];
  meteors: { x: number; y: number; length: number; vx: number; vy: number }[] = [];
  plasmaExplosions: { x: number; y: number; range: number; life: number }[] = [];
  slowFields: { x: number; y: number; range: number; life: number }[] = [];

  setPlayer(e: Entity) {
    this.player = e;
  }

  setBoss(e: Entity | null) {
    this.boss = e;
  }

  snapshot() {
    return {
      player: this.player,
      options: this.options,
      enemies: this.enemies,
      bullets: this.bullets,
      enemyBullets: this.enemyBullets,
      powerups: this.powerups,
      boss: this.boss ?? null,
      bossWingmen: this.bossWingmen,
      meteors: this.meteors,
      plasmaExplosions: this.plasmaExplosions,
      slowFields: this.slowFields
    } as const;
  }
}
