import { Entity, EntityType, WeaponType, EnemyType } from '@/types';

export function createPlayer(): Entity {
  return {
    x: 100,
    y: 100,
    width: 32,
    height: 32,
    vx: 0,
    vy: 0,
    hp: 100,
    maxHp: 100,
    type: EntityType.PLAYER,
    color: '#00ffff',
    markedForDeletion: false,
    spriteKey: 'player'
  };
}

export function createEnemy(type: EnemyType = EnemyType.NORMAL): Entity {
  return {
    x: 100,
    y: 100,
    width: 32,
    height: 32,
    vx: 0,
    vy: 0,
    hp: 50,
    maxHp: 50,
    type: EntityType.ENEMY,
    subType: type,
    color: '#ff0000',
    markedForDeletion: false,
    angle: 0,
    spriteKey: `enemy_${type}`,
    isElite: false,
    state: 0,
    timer: 0
  };
}

export function createBoss(): Entity {
  return {
    x: 100,
    y: 100,
    width: 150,
    height: 150,
    vx: 0,
    vy: 0,
    hp: 1000,
    maxHp: 1000,
    type: EntityType.BOSS,
    color: '#ffffff',
    markedForDeletion: false,
    angle: 0,
    spriteKey: 'boss_1',
    state: 0,
    invulnerable: false,
    timer: 0
  };
}

export function createBullet(weaponType: WeaponType = WeaponType.VULCAN): Entity {
  return {
    x: 100,
    y: 100,
    width: 8,
    height: 16,
    vx: 0,
    vy: -10,
    hp: 1,
    maxHp: 1,
    type: EntityType.BULLET,
    color: '#00ff00',
    markedForDeletion: false,
    spriteKey: `bullet_${weaponType}`,
    weaponType: weaponType
  };
}