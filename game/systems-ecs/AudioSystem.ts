import { World } from '../types/world';
import { EntityType } from '@/types';

// 程序化音频生成器
class ProceduralAudio {
  private audioContext: AudioContext;
  private masterGain: GainNode;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.masterGain = audioContext.createGain();
    this.masterGain.connect(audioContext.destination);
    this.masterGain.gain.value = 0.3; // 降低音量
  }

  playShoot(): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
    
    console.log('[Audio] Playing shoot sound');
  }

  playExplosion(): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.value = 200;
    oscillator.type = 'sawtooth';
    filter.frequency.value = 100;
    filter.Q.value = 10;
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
    
    console.log('[Audio] Playing explosion sound');
  }

  playHit(): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.value = 400;
    oscillator.type = 'triangle';
    
    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.05);
    
    console.log('[Audio] Playing hit sound');
  }

  playPowerup(): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.value = 1200;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
    
    console.log('[Audio] Playing powerup sound');
  }
}

// 全局音频实例
let proceduralAudio: ProceduralAudio | null = null;

export function AudioSystem(world: World, dt: number): void {
  // 初始化音频系统
  if (!proceduralAudio) {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    proceduralAudio = new ProceduralAudio(audioContext);
  }

  const audioEvents = world.events.filter(e => e.type === 'audio');

  for (const event of audioEvents as any[]) {
    switch (event.sound) {
      case 'shoot':
        proceduralAudio.playShoot();
        break;
      case 'explosion':
        proceduralAudio.playExplosion();
        break;
      case 'hit':
        proceduralAudio.playHit();
        break;
      case 'powerup':
        proceduralAudio.playPowerup();
        break;
      default:
        console.log(`[Audio] Unknown sound: ${event.sound}`);
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
