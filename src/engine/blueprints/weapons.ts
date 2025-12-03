import { Weapon } from '../components'
import { Blueprint } from '../types';
import { WeaponType } from '@/types';


export const BLUEPRINT_WEAPON_VULCAN: Blueprint = {
  Weapon: new Weapon('bullet_vulcan', 150, 0),
};

export const BLUEPRINT_WEAPON_LASER: Blueprint = {
  Weapon: new Weapon('bullet_laser', 180, 0),
};

export const BLUEPRINT_WEAPON_MISSILE: Blueprint = {
  Weapon: new Weapon('bullet_missile', 400, 0),
};

export const BLUEPRINT_WEAPON_WAVE: Blueprint = {
  Weapon: new Weapon('bullet_wave', 400, 0),
};

export const BLUEPRINT_WEAPON_PLASMA: Blueprint = {
  Weapon: new Weapon('bullet_plasma', 600, 0),
};

export const BLUEPRINT_WEAPON_TESLA: Blueprint = {
  Weapon: new Weapon('bullet_tesla', 200, 0),
};

export const BLUEPRINT_WEAPON_MAGMA: Blueprint = {
  Weapon: new Weapon('bullet_magma', 220, 0),
};

export const BLUEPRINT_WEAPON_SHURIKEN: Blueprint = {
  Weapon: new Weapon('bullet_shuriken', 300, 0),
};