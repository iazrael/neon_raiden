import { World, Transform, Velocity, Bullet, Weapon, Health, Shield, Sprite } from '../types';
import { view } from '../world';

export const keys: Record<string, boolean> = {};

export function InputSystem(w: World, dt: number) {
  // Handle player movement
  for (const [id, [tr, vl]] of view(w, ['Transform', 'Velocity'])) {
    if (id === w.playerId) {
      // Reset velocity
      vl.vx = 0;
      vl.vy = 0;
      
      // Handle movement keys
      if (keys['ArrowLeft'] || keys['KeyA']) vl.vx = -300;
      if (keys['ArrowRight'] || keys['KeyD']) vl.vx = 300;
      if (keys['ArrowUp'] || keys['KeyW']) vl.vy = -300;
      if (keys['ArrowDown'] || keys['KeyS']) vl.vy = 300;
      
      // Keep player in bounds
      if (tr.x < 20) tr.x = 20;
      if (tr.x > 780) tr.x = 780;
      if (tr.y < 20) tr.y = 20;
      if (tr.y > 580) tr.y = 580;
    }
  }
}