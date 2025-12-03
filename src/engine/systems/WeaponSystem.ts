import { World, Weapon, Transform, Bullet, Sprite, Velocity } from '../types';
import { view, addComponent, generateId } from '../world';
import { keys } from './InputSystem';

export function WeaponSystem(w: World, dt: number) {
  for (const [id, [wp, tr]] of view(w, ['Weapon', 'Transform'])) {
    if (wp.curCD > 0) wp.curCD -= dt;
    
    if (keys.Space && wp.curCD <= 0 && id === w.playerId) {
      wp.curCD = wp.cooldown;
      spawnBullet(w, tr.x, tr.y, wp.damage, id);
    }
  }
}

function spawnBullet(w: World, x: number, y: number, damage: number, owner: number) {
  const bulletId = generateId();
  addComponent(w, bulletId, { damage, cooldown: 0, curCD: 0 } as Weapon);
  addComponent(w, bulletId, { x, y, rot: 0 } as Transform);
  addComponent(w, bulletId, { owner, speed: 500 } as Bullet);
  addComponent(w, bulletId, { texture: 'bullet.png' } as Sprite);
  addComponent(w, bulletId, { vx: 0, vy: -500 } as Velocity);
}