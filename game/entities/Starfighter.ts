import { Entity, EntityType, WeaponType, FighterEntity } from '@/types';
import { EventBus } from '../engine/EventBus';
import { EventPayloads, CombatEventTypeBus } from '../engine/events';
import { WeaponConfig } from '../config';

export class Starfighter implements Entity {
  id?: string;
  name?: string;
  chineseName?: string;
  describe?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  speed?: number;
  hp: number;
  maxHp: number;
  type: EntityType = EntityType.PLAYER;
  subType?: string | number;
  color: string;
  markedForDeletion: boolean = false;
  angle?: number;
  rotationSpeed?: number;
  spriteKey?: string;
  frame?: number;
  damage?: number;
  owner?: Entity;
  angleOffset?: number;
  isElite?: boolean;
  state?: number;
  timer?: number;
  chainCount?: number;
  chainRange?: number;
  weaponType?: WeaponType;
  isHoming?: boolean;
  invulnerable?: boolean;
  invulnerableTimer?: number;
  tags?: Record<string, number>;
  slowed?: boolean;
  originalBulletCount?: number;
  currentBulletCount?: number;
  teleportTimer?: number;
  phaseGlowColor?: string;
  phaseGlowUntil?: number;
  hitFlashUntil?: number;
  playerLevel?: number;
  defensePct?: number;
  target?: Entity;
  searchRange?: number;
  turnSpeed?: number;
  lifetime?: number;
  incomingMissiles?: number;
  attenuation?: number;

  weaponPrimary: WeaponType = WeaponType.VULCAN;
  weaponSecondary?: WeaponType | null;
  weaponLevel: number = 1;
  bombs: number = 0;
  shield: number = 0;
  level: number = 1;
  nextLevelScore: number = 1000;
  defenseBonusPct: number = 0;
  fireRateBonusPct: number = 0;
  damageBonusPct: number = 0;
  levelingShieldBonus: number = 0;
  shieldRegenTimer: number = 0;

  private config: FighterEntity;
  private bus: EventBus<EventPayloads>;

  constructor(config: FighterEntity, x: number, y: number, bus: EventBus<EventPayloads>) {
    this.config = config;
    this.bus = bus;
    this.x = x;
    this.y = y;
    this.width = config.size.width;
    this.height = config.size.height;
    this.vx = 0;
    this.vy = 0;
    this.speed = config.speed;
    this.hp = config.initialHp;
    this.maxHp = config.maxHp;
    this.color = config.color;
    this.spriteKey = config.sprite;
    this.level = config.initialLevel;
    this.nextLevelScore = config.leveling.baseScoreForLevel1;
  }

  update(input: { kb: { x: number; y: number }; touch: { active: boolean; dx?: number; dy?: number } }, dt: number, bounds: { width: number; height: number }, speedScale: number) {
    const s = (this.speed ?? 0) * speedScale;
    if (input.touch.active && input.touch.dx !== undefined && input.touch.dy !== undefined) {
      this.vx = input.touch.dx;
      this.x += input.touch.dx * 1.5;
      this.y += input.touch.dy * 1.5;
    }
    const kb = input.kb;
    if (kb.x !== 0 || kb.y !== 0) {
      this.x += kb.x * s;
      this.y += kb.y * s;
      this.vx = kb.x * s;
    } else if (!input.touch.active) {
      this.vx *= 0.8;
    }
    this.x = Math.max(32, Math.min(bounds.width - 32, this.x));
    this.y = Math.max(32, Math.min(bounds.height - 32, this.y));
    if (this.invulnerable && this.invulnerableTimer && this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) this.invulnerable = false;
    }
    if (this.shieldRegenTimer && this.shieldRegenTimer > 0) {
      this.shieldRegenTimer -= dt;
      if (this.shieldRegenTimer < 0) this.shieldRegenTimer = 0;
    }
  }

  takeDamage(amount: number) {
    const defenseMultiplier = Math.max(0, 1 - this.defenseBonusPct);
    const effective = Math.ceil(amount * defenseMultiplier);
    const prevShield = this.shield;
    if (this.shield > 0) {
      this.shield -= effective;
      if (this.shield < 0) {
        this.hp += this.shield;
        this.shield = 0;
      }
    } else {
      this.hp -= effective;
    }
    if (prevShield > 0 && this.shield === 0) {}
    this.hitFlashUntil = Date.now() + 150;
    this.bus.publish(CombatEventTypeBus.PlayerDamaged, { amount });
    this.bus.publish(CombatEventTypeBus.ShieldChanged, { value: this.shield, percent: this.getShieldPercent() });
  }

  triggerBomb() {
    if (this.bombs <= 0 || this.hp <= 0) return false;
    this.bombs -= 1;
    return true;
  }

  getShieldCap(): number {
    const base = this.config.maxShield + this.levelingShieldBonus;
    return base;
  }

  getShieldPercent(): number {
    const cap = this.getShieldCap();
    return cap > 0 ? Math.max(0, Math.min(100, Math.round((this.shield / cap) * 100))) : 0;
  }

  equipPrimary(type: WeaponType) {
    this.weaponPrimary = type;
    this.weaponLevel = 1;
  }

  equipSecondary(type?: WeaponType | null) {
    this.weaponSecondary = type ?? null;
  }

  primaryColor(): string | undefined {
    return WeaponConfig[this.weaponPrimary]?.color;
  }
}
