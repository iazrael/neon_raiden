import { Entity, EntityType, WeaponType } from '@/types';

export class BulletSystem {
  updateEnemyBullets(bullets: Entity[], player: Entity, slowFields: { x: number; y: number; range: number; life: number }[], dt: number, timeScale: number, width: number) {
    bullets.forEach(b => {
      b.x += b.vx * timeScale;
      b.y += b.vy * timeScale;
      if (b.isHoming) {
        const dx = player.x - b.x;
        const dy = player.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          const turnSpeed = 0.1;
          b.vx += (dx / dist) * turnSpeed;
          b.vy += (dy / dist) * turnSpeed;
          const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          const maxSpeed = 6;
          if (speed > maxSpeed) {
            b.vx = (b.vx / speed) * maxSpeed;
            b.vy = (b.vy / speed) * maxSpeed;
          }
        }
      }
      if (b.vx !== undefined && b.vy !== undefined && b.spriteKey !== 'bullet_enemy_spiral') {
        b.angle = Math.atan2(b.vy, b.vx) + Math.PI / 2;
      }
      if (b.spriteKey === 'bullet_enemy_spiral' && b.rotationSpeed !== undefined) {
        b.angle = (b.angle || 0) + b.rotationSpeed;
      }
      if (b.timer !== undefined) {
        b.timer -= dt;
        if (b.timer <= 0) b.markedForDeletion = true;
      }
      if (slowFields.length > 0) {
        const inSlow = slowFields.some(s => Math.hypot(b.x - s.x, b.y - s.y) < s.range);
        if (inSlow) {
          b.vx *= 0.75;
          b.vy *= 0.75;
        }
      }
    });
  }

  updatePlayerBullets(bullets: Entity[], width: number, height: number, dt: number) {
    bullets.forEach(b => {
      if (b.weaponType === WeaponType.MISSILE) {
        if (b.lifetime !== undefined) {
          b.lifetime -= dt;
          if (b.lifetime <= 0) b.markedForDeletion = true;
        }
        if (b.x < -50 || b.x > width + 50 || b.y > height + 50 || b.y < -100) b.markedForDeletion = true;
        if (b.target && (b.target.hp <= 0 || b.target.markedForDeletion)) {
          if (b.target.incomingMissiles && b.target.incomingMissiles > 0) b.target.incomingMissiles--;
          b.target = undefined;
        }
        if (b.target) {
          const dx = b.target.x - b.x;
          const dy = b.target.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            const turnSpeed = b.turnSpeed || 0.15;
            b.vx += (dx / dist) * turnSpeed;
            b.vy += (dy / dist) * turnSpeed;
            const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            const maxSpeed = 15;
            if (speed > maxSpeed) {
              b.vx = (b.vx / speed) * maxSpeed;
              b.vy = (b.vy / speed) * maxSpeed;
            }
          }
        }
      } else if (b.weaponType === WeaponType.SHURIKEN) {
        if (b.x < 0 || b.x > width) {
          b.vx *= -1;
          b.x = Math.max(0, Math.min(width, b.x));
        }
        if (b.y < 0) {
          b.vy *= -1;
          b.y = 0;
        }
      }
      if (b.weaponType !== WeaponType.PLASMA && b.vx !== undefined && b.vy !== undefined) {
        b.angle = Math.atan2(b.vy, b.vx) + Math.PI / 2;
      }
      if (b.weaponType === WeaponType.PLASMA && b.rotationSpeed !== undefined) {
        b.angle = (b.angle || 0) + b.rotationSpeed;
      }
    });
  }
}

