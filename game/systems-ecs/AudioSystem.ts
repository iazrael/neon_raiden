import { World } from '../types/world';
import { EntityType } from '@/types';

export function AudioSystem(world: World, dt: number): void {
  const audioEvents = world.events.filter(e => e.type === 'audio');

  for (const event of audioEvents as any[]) {
    console.log(`[Audio] Playing sound: ${event.sound}`);

    if (event.sound === 'explosion') {
    } else if (event.sound === 'shoot') {
    }
  }
}

export function EffectPlayer(world: World, dt: number): void {
  const deaths = world.events.filter(e => e.type === 'death');

  for (const event of deaths as any[]) {
    const position = world.components.positions.get(event.entityId);
    if (position) {
      createParticle(world, position.x, position.y);
    }
  }

  updateParticles(world, dt);
}

export function CameraSystem(world: World, dt: number): void {
  const cameraId = 'camera';
  const camera = world.components.cameras.get(cameraId);

  if (camera) {
    if (camera.shake > 0) {
      camera.shake *= camera.shakeDecay;
      if (camera.shake < 0.1) {
        camera.shake = 0;
      }
    }
  }
}

function createParticle(world: World, x: number, y: number): void {
  for (let i = 0; i < 10; i++) {
    const particleId = `particle_${Math.random()}`;

    world.entities.set(particleId, {
      id: particleId,
      type: 'particle' as EntityType,
      markedForDeletion: false
    });

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;

    world.components.positions.set(particleId, { x, y, angle });
    world.components.velocities.set(particleId, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed
    });
    world.components.lifetimes.set(particleId, {
      lifetime: 1000,
      createdAt: world.time
    });
  }
}

function updateParticles(world: World, dt: number): void {
  const particles = Array.from(world.components.lifetimes.entries())
    .filter(([id, _]) => {
      const entity = world.entities.get(id);
      return entity && entity.type === 'particle' as any && !entity.markedForDeletion;
    });

  for (const [id, lifetime] of particles) {
    if (world.time - lifetime.createdAt > lifetime.lifetime) {
      world.entities.get(id)!.markedForDeletion = true;
    }
  }
}
