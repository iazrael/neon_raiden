import { WeaponType } from '@/types/sprite';

export interface Blueprint {
  weapons?: WeaponConfig[];
  enemies?: EnemySpawnConfig[];
  boss?: BossConfig;
  player?: PlayerConfig;
}

export interface WeaponConfig {
  type: WeaponType;
  level: number;
}

export interface EnemySpawnConfig {
  type: string;
  count: number;
  interval: number;
}

export interface BossConfig {
  type: string;
  hp: number;
  phaseCount: number;
}

export interface PlayerConfig {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  speed: number;
}
