import { Transform, Sprite, PickupItem, HitBox } from '../components'
import { Blueprint } from '../types';
import { PowerupType } from '@/types';


export const BLUEPRINT_POWERUP_POWER: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Sprite: new Sprite('powerup_power', 0, 0, 24, 24, 1, 0.5, 0.5),
  PickupItem: new PickupItem('buff', 'powerup_power', true),
  HitBox: new HitBox({ shape: 'circle', radius: 12 }),
};

export const BLUEPRINT_POWERUP_HP: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Sprite: new Sprite('powerup_hp', 0, 0, 24, 24, 1, 0.5, 0.5),
  PickupItem: new PickupItem('buff', 'powerup_hp', true),
  HitBox: new HitBox({ shape: 'circle', radius: 12 }),
};

export const BLUEPRINT_POWERUP_BOMB: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Sprite: new Sprite('powerup_bomb', 0, 0, 24, 24, 1, 0.5, 0.5),
  PickupItem: new PickupItem('buff', 'powerup_bomb', true),
  HitBox: new HitBox({ shape: 'circle', radius: 12 }),
};

export const BLUEPRINT_POWERUP_OPTION: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Sprite: new Sprite('powerup_option', 0, 0, 24, 24, 1, 0.5, 0.5),
  PickupItem: new PickupItem('buff', 'powerup_option', true),
  HitBox: new HitBox({ shape: 'circle', radius: 12 }),
};

export const BLUEPRINT_POWERUP_VULCAN: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Sprite: new Sprite('powerup_vulcan', 0, 0, 24, 24, 1, 0.5, 0.5),
  PickupItem: new PickupItem('weapon', 'powerup_vulcan', true),
  HitBox: new HitBox({ shape: 'circle', radius: 12 }),
};

export const BLUEPRINT_POWERUP_LASER: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Sprite: new Sprite('powerup_laser', 0, 0, 24, 24, 1, 0.5, 0.5),
  PickupItem: new PickupItem('weapon', 'powerup_laser', true),
  HitBox: new HitBox({ shape: 'circle', radius: 12 }),
};

export const BLUEPRINT_POWERUP_MISSILE: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Sprite: new Sprite('powerup_missile', 0, 0, 24, 24, 1, 0.5, 0.5),
  PickupItem: new PickupItem('weapon', 'powerup_missile', true),
  HitBox: new HitBox({ shape: 'circle', radius: 12 }),
};

export const BLUEPRINT_POWERUP_SHURIKEN: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Sprite: new Sprite('powerup_shuriken', 0, 0, 24, 24, 1, 0.5, 0.5),
  PickupItem: new PickupItem('weapon', 'powerup_shuriken', true),
  HitBox: new HitBox({ shape: 'circle', radius: 12 }),
};

export const BLUEPRINT_POWERUP_TESLA: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Sprite: new Sprite('powerup_tesla', 0, 0, 24, 24, 1, 0.5, 0.5),
  PickupItem: new PickupItem('weapon', 'powerup_tesla', true),
  HitBox: new HitBox({ shape: 'circle', radius: 12 }),
};

export const BLUEPRINT_POWERUP_MAGMA: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Sprite: new Sprite('powerup_magma', 0, 0, 24, 24, 1, 0.5, 0.5),
  PickupItem: new PickupItem('weapon', 'powerup_magma', true),
  HitBox: new HitBox({ shape: 'circle', radius: 12 }),
};

export const BLUEPRINT_POWERUP_WAVE: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Sprite: new Sprite('powerup_wave', 0, 0, 24, 24, 1, 0.5, 0.5),
  PickupItem: new PickupItem('weapon', 'powerup_wave', true),
  HitBox: new HitBox({ shape: 'circle', radius: 12 }),
};

export const BLUEPRINT_POWERUP_PLASMA: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Sprite: new Sprite('powerup_plasma', 0, 0, 24, 24, 1, 0.5, 0.5),
  PickupItem: new PickupItem('weapon', 'powerup_plasma', true),
  HitBox: new HitBox({ shape: 'circle', radius: 12 }),
};

export const BLUEPRINT_POWERUP_INVINCIBILITY: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Sprite: new Sprite('powerup_invincibility', 0, 0, 24, 24, 1, 0.5, 0.5),
  PickupItem: new PickupItem('buff', 'powerup_invincibility', true),
  HitBox: new HitBox({ shape: 'circle', radius: 12 }),
};

export const BLUEPRINT_POWERUP_TIME_SLOW: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Sprite: new Sprite('powerup_time_slow', 0, 0, 24, 24, 1, 0.5, 0.5),
  PickupItem: new PickupItem('buff', 'powerup_time_slow', true),
  HitBox: new HitBox({ shape: 'circle', radius: 12 }),
};