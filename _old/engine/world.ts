import { EntityId, World, Component, GameSnapshot, Transform, Health, Weapon, Shield, Bullet, Velocity, Sprite } from './types';

let entityIdCounter = 1;

export function generateId(): EntityId {
  return entityIdCounter++;
}

export function createWorld(): World {
  return { entities: new Map(), playerId: 0 };
}

export { World };

export function addComponent<T extends Component>(w: World, id: EntityId, comp: T) {
  if (!w.entities.has(id)) w.entities.set(id, []);
  w.entities.get(id)!.push(comp);
}

export function* view(w: World, types: any[]): Generator<[EntityId, any[]], void, unknown> {
  for (const [id, comps] of w.entities) {
    const bucket: any[] = [];
    
    for (const type of types) {
      let found: any = null;
      
      // Use duck typing to identify component types
      if (type === 'Transform') {
        found = comps.find(c => 'x' in c && 'y' in c && 'rot' in c);
      } else if (type === 'Velocity') {
        found = comps.find(c => 'vx' in c && 'vy' in c);
      } else if (type === 'Health') {
        found = comps.find(c => 'hp' in c && 'max' in c);
      } else if (type === 'Weapon') {
        found = comps.find(c => 'damage' in c && 'cooldown' in c);
      } else if (type === 'Bullet') {
        found = comps.find(c => 'owner' in c && 'speed' in c);
      } else if (type === 'Sprite') {
        found = comps.find(c => 'texture' in c);
      } else if (type === 'Shield') {
        found = comps.find(c => 'value' in c && 'regen' in c);
      }
      
      if (found) {
        bucket.push(found);
      } else {
        break; // If any component is missing, skip this entity
      }
    }
    
    if (bucket.length === types.length) {
      yield [id, bucket];
    }
  }
}

export function destroyEntity(w: World, id: EntityId) {
  w.entities.delete(id);
}

export function snapshot(world: World, t: number): GameSnapshot {
  const player = world.entities.get(world.playerId)!;
  const tr = player.find(c => 'x' in c && 'y' in c && 'rot' in c) as Transform;
  const hl = player.find(c => 'hp' in c && 'max' in c) as Health;
  const wp = player.find(c => 'damage' in c && 'cooldown' in c) as Weapon;
  
  return {
    t,
    player: {
      hp: hl.hp,
      maxHp: hl.max,
      ammo: wp.curCD === 0 ? 1 : 0,
      maxAmmo: 1,
      shield: player.find(c => 'value' in c && 'regen' in c)?.value ?? 0,
      x: tr.x,
      y: tr.y,
    },
    bullets: [...view(world, ['Bullet', 'Transform'])].map(([, [b, t]]) => ({ x: t.x, y: t.y })),
    enemies: [...view(world, ['Health', 'Transform'])].filter(([id]) => id !== world.playerId).map(([, [h, t]]) => ({ x: t.x, y: t.y, hp: h.hp })),
  };
}