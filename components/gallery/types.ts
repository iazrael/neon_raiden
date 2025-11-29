import { WeaponType, EnemyType, BossWeaponType, FighterEntity } from '@/types';
import { WeaponConfig, EnemyConfig, BossConfig } from '@/game/config';

export interface BaseItem {
  name: string;
  chineseName: string;
  chineseDescription: string;
}

export interface FighterItem extends BaseItem {
  config: FighterEntity;
}

export interface WeaponItem extends BaseItem {
  type: WeaponType;
  config: typeof WeaponConfig[keyof typeof WeaponConfig];
  isUnlocked: boolean;
}

export interface EnemyItem extends BaseItem {
  type: EnemyType;
  config: typeof EnemyConfig[keyof typeof EnemyConfig];
  isUnlocked: boolean;
}

export interface BossItem extends BaseItem {
  level: number;
  config: typeof BossConfig[keyof typeof BossConfig];
  isUnlocked: boolean;
  weapons: BossWeaponType[];
  wingmenCount: number;
  wingmenType: string;
}