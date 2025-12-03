import { World, Bullet, Transform, Health, Weapon, Shield, Sprite, Velocity } from '../types';
import { view, destroyEntity } from '../world';

const HIT_RADIUS = 20;

function distance(t1: Transform, t2: Transform): number {
  const dx = t1.x - t2.x;
  const dy = t1.y - t2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function CollisionSystem(w: World, dt: number) {
  for (const [bid, [bl, bt]] of view(w, ['Bullet', 'Transform'])) {
    for (const [eid, [hl, et]] of view(w, ['Health', 'Transform'])) {
      if (hl.hp <= 0) continue;
      
      if (distance(bt, et) < HIT_RADIUS) {
        // Find the weapon component of the bullet to get damage
        const bulletComps = w.entities.get(bid);
        const bulletWeapon = bulletComps?.find(c => 'damage' in c && 'cooldown' in c) as Weapon;
        
        if (bulletWeapon) {
          hl.hp -= bulletWeapon.damage;
        }
        destroyEntity(w, bid); // 子弹消失
        
        if (hl.hp <= 0) destroyEntity(w, eid);
      }
    }
  }
}