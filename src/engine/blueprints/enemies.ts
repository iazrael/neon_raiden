import { Transform, Health, Velocity, Sprite, EnemyTag, HitBox } from '../components'
import { Blueprint } from '../types';
import { EnemyType } from '@/types';


export const BLUEPRINT_ENEMY_NORMAL: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(30, 30),
  Velocity: new Velocity(0, 2, 0),
  Sprite: new Sprite('enemy_normal', 0, 0, 40, 40, 1, 0.5, 0.5),
  EnemyTag: new EnemyTag(),
  HitBox: new HitBox({ shape: 'circle', radius: 20 }),
};

export const BLUEPRINT_ENEMY_FAST: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(10, 10),
  Velocity: new Velocity(0, 10, 0),
  Sprite: new Sprite('enemy_fast', 0, 0, 30, 40, 1, 0.5, 0.5),
  EnemyTag: new EnemyTag(),
  HitBox: new HitBox({ shape: 'circle', radius: 15 }),
};

export const BLUEPRINT_ENEMY_TANK: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(60, 60),
  Velocity: new Velocity(0, 1, 0),
  Sprite: new Sprite('enemy_tank', 0, 0, 60, 60, 1, 0.5, 0.5),
  EnemyTag: new EnemyTag(),
  HitBox: new HitBox({ shape: 'circle', radius: 30 }),
};

export const BLUEPRINT_ENEMY_KAMIKAZE: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(5, 5),
  Velocity: new Velocity(0, 10, 0),
  Sprite: new Sprite('enemy_kamikaze', 0, 0, 30, 30, 1, 0.5, 0.5),
  EnemyTag: new EnemyTag(),
  HitBox: new HitBox({ shape: 'circle', radius: 15 }),
};

export const BLUEPRINT_ENEMY_ELITE_GUNBOAT: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(100, 100),
  Velocity: new Velocity(0, 0.5, 0),
  Sprite: new Sprite('enemy_gunboat', 0, 0, 70, 50, 1, 0.5, 0.5),
  EnemyTag: new EnemyTag(),
  HitBox: new HitBox({ shape: 'circle', radius: 35 }),
};

export const BLUEPRINT_ENEMY_LASER_INTERCEPTOR: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(80, 80),
  Velocity: new Velocity(0, 5, 0),
  Sprite: new Sprite('enemy_interceptor', 0, 0, 50, 50, 1, 0.5, 0.5),
  EnemyTag: new EnemyTag(),
  HitBox: new HitBox({ shape: 'circle', radius: 25 }),
};

export const BLUEPRINT_ENEMY_MINE_LAYER: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(60, 60),
  Velocity: new Velocity(0, 1.5, 0),
  Sprite: new Sprite('enemy_layer', 0, 0, 60, 40, 1, 0.5, 0.5),
  EnemyTag: new EnemyTag(),
  HitBox: new HitBox({ shape: 'circle', radius: 30 }),
};

export const BLUEPRINT_ENEMY_PULSAR: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(15, 15),
  Velocity: new Velocity(0, 6, 0),
  Sprite: new Sprite('enemy_pulsar', 0, 0, 32, 32, 1, 0.5, 0.5),
  EnemyTag: new EnemyTag(),
  HitBox: new HitBox({ shape: 'circle', radius: 16 }),
};

export const BLUEPRINT_ENEMY_FORTRESS: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(200, 200),
  Velocity: new Velocity(0, 0.8, 0),
  Sprite: new Sprite('enemy_fortress', 0, 0, 70, 70, 1, 0.5, 0.5),
  EnemyTag: new EnemyTag(),
  HitBox: new HitBox({ shape: 'circle', radius: 35 }),
};

export const BLUEPRINT_ENEMY_STALKER: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(30, 30),
  Velocity: new Velocity(0, 5, 0),
  Sprite: new Sprite('enemy_stalker', 0, 0, 36, 36, 1, 0.5, 0.5),
  EnemyTag: new EnemyTag(),
  HitBox: new HitBox({ shape: 'circle', radius: 18 }),
};

export const BLUEPRINT_ENEMY_BARRAGE: Blueprint = {
  Transform: new Transform(0, 0, 0),
  Health: new Health(100, 100),
  Velocity: new Velocity(0, 1.2, 0),
  Sprite: new Sprite('enemy_barrage', 0, 0, 50, 50, 1, 0.5, 0.5),
  EnemyTag: new EnemyTag(),
  HitBox: new HitBox({ shape: 'circle', radius: 25 }),
};