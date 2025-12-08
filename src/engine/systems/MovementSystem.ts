import { Transform, Velocity } from '../components';
import { World, } from '../types';
import { view } from '../world';

export function MovementSystem(w: World, dt: number) {
  for (const [, [tr, vl]] of view(w, [Transform, Velocity])) {
    tr.x += vl.vx * dt;
    tr.y += vl.vy * dt;
  }
}