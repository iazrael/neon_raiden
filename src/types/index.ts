export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  GALLERY = 'GALLERY'
}

export interface ComboState {
  count: number;
  timer: number;
  multiplier: number;
}

export interface SynergyConfig {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export type WeaponType = 'vulcan' | 'laser' | 'missile' | 'wave' | 'plasma' | 'tesla' | 'magma' | 'shuriken';
