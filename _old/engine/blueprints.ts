import { Transform, Health, Weapon, Shield, Sprite, Velocity } from './types';

export const FIGHTER_LIGHT = {
  transform: { x: 400, y: 500, rot: 0 } as Transform,
  health: { hp: 80, max: 80 } as Health,
  weapon: { damage: 10, cooldown: 200, curCD: 0 } as Weapon,
  sprite: { texture: 'fighter_light.png' } as Sprite,
  velocity: { vx: 0, vy: 0 } as Velocity,
};

export const BOMBER_HEAVY = {
  transform: { x: 400, y: 500, rot: 0 } as Transform,
  health: { hp: 250, max: 250 } as Health,
  weapon: { damage: 40, cooldown: 600, curCD: 0 } as Weapon,
  shield: { value: 100, regen: 20 } as Shield,
  sprite: { texture: 'bomber.png' } as Sprite,
  velocity: { vx: 0, vy: 0 } as Velocity,
};