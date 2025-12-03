import { World, Transform, Velocity, Bullet, Weapon, Health, Shield, Sprite } from '../types';
import { view } from '../world';

export function MovementSystem(w: World, dt: number) {
  for (const [, [tr, vl]] of view(w, ['Transform', 'Velocity'])) {
    tr.x += vl.vx * dt;
    tr.y += vl.vy * dt;
  }
}