import { Transform, Health, Sprite, BossTag, BossAI, HitBox } from '../components'
import { Blueprint } from '../types';
import { BossType } from '@/types';


export const BLUEPRINT_BOSS_GUARDIAN: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(2000, 2000),
  Sprite: new Sprite('boss_guardian', 0, 0, 180, 180, 1, 0.5, 0.5),
  BossTag: new BossTag(),
  BossAI: new BossAI(1, 0),
  HitBox: new HitBox({ shape: 'circle', radius: 90 * 0.7 }),
};

export const BLUEPRINT_BOSS_INTERCEPTOR: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(3200, 3200),
  Sprite: new Sprite('boss_interceptor', 0, 0, 200, 200, 1, 0.5, 0.5),
  BossTag: new BossTag(),
  BossAI: new BossAI(1, 0),
  HitBox: new HitBox({ shape: 'circle', radius: 100 * 0.7 }),
};

export const BLUEPRINT_BOSS_DESTROYER: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(5800, 5800),
  Sprite: new Sprite('boss_destroyer', 0, 0, 220, 220, 1, 0.5, 0.5),
  BossTag: new BossTag(),
  BossAI: new BossAI(1, 0),
  HitBox: new HitBox({ shape: 'circle', radius: 110 * 0.7 }),
};

export const BLUEPRINT_BOSS_ANNIHILATOR: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(7000, 7000),
  Sprite: new Sprite('boss_annihilator', 0, 0, 240, 240, 1, 0.5, 0.5),
  BossTag: new BossTag(),
  BossAI: new BossAI(1, 0),
  HitBox: new HitBox({ shape: 'circle', radius: 120 * 0.7 }),
};

export const BLUEPRINT_BOSS_DOMINATOR: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(8200, 8200),
  Sprite: new Sprite('boss_dominator', 0, 0, 260, 260, 1, 0.5, 0.5),
  BossTag: new BossTag(),
  BossAI: new BossAI(1, 0),
  HitBox: new HitBox({ shape: 'circle', radius: 130 * 0.7 }),
};

export const BLUEPRINT_BOSS_OVERLORD: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(10600, 10600),
  Sprite: new Sprite('boss_overlord', 0, 0, 280, 280, 1, 0.5, 0.5),
  BossTag: new BossTag(),
  BossAI: new BossAI(1, 0),
  HitBox: new HitBox({ shape: 'circle', radius: 140 * 0.7 }),
};

export const BLUEPRINT_BOSS_TITAN: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(16000, 16000),
  Sprite: new Sprite('boss_titan', 0, 0, 300, 300, 1, 0.5, 0.5),
  BossTag: new BossTag(),
  BossAI: new BossAI(1, 0),
  HitBox: new HitBox({ shape: 'circle', radius: 150 * 0.7 }),
};

export const BLUEPRINT_BOSS_COLOSSUS: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(17200, 17200),
  Sprite: new Sprite('boss_colossus', 0, 0, 320, 320, 1, 0.5, 0.5),
  BossTag: new BossTag(),
  BossAI: new BossAI(1, 0),
  HitBox: new HitBox({ shape: 'circle', radius: 160 * 0.7 }),
};

export const BLUEPRINT_BOSS_LEVIATHAN: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(18400, 18400),
  Sprite: new Sprite('boss_leviathan', 0, 0, 340, 340, 1, 0.5, 0.5),
  BossTag: new BossTag(),
  BossAI: new BossAI(1, 0),
  HitBox: new HitBox({ shape: 'circle', radius: 170 * 0.7 }),
};

export const BLUEPRINT_BOSS_APOCALYPSE: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(20000, 20000),
  Sprite: new Sprite('boss_apocalypse', 0, 0, 360, 360, 1, 0.5, 0.5),
  BossTag: new BossTag(),
  BossAI: new BossAI(1, 0),
  HitBox: new HitBox({ shape: 'circle', radius: 180 * 0.7 }),
};