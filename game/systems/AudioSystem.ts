import { WeaponType, ClickType, ExplosionSize } from '@/types';

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    this.initContext();

    // Resume audio context on user interaction (essential for Safari)
    const resumeAudio = () => {
      this.resume();
    };
    window.addEventListener('touchstart', resumeAudio, { passive: true });
    window.addEventListener('click', resumeAudio);
    window.addEventListener('keydown', resumeAudio);
    window.addEventListener('pageshow', resumeAudio);
    window.addEventListener('focus', resumeAudio);

    // Handle visibility change to suspend/resume audio
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.ctx && this.ctx.state === 'running') {
          this.ctx.suspend();
        }
      } else {
        this.resume();
      }
    });
    window.addEventListener('pagehide', () => {
      this.pause();
    });
  }

  private initContext() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }

  private ensureContext() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!this.ctx || this.ctx.state === 'closed') {
      this.initContext();
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
  }

  resume() {
    this.ensureContext();
    if (this.ctx && this.ctx.state !== 'running') {
      this.ctx.resume().catch(e => console.warn("Audio resume failed", e));
    }
  }

  pause() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(e => console.warn("Audio pause failed", e));
    }
  }

  playClick(type: ClickType = ClickType.DEFAULT) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    const now = this.ctx.currentTime;

    if (type === ClickType.CONFIRM) {
      // High pitch ascending - Success/Start
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.1);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === ClickType.CANCEL) {
      // Lower pitch descending - Back/Close
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === ClickType.MENU) {
      // Soft short click - Navigation/Tab
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

      osc.start(now);
      osc.stop(now + 0.03);
    } else {
      // Default click (existing)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  playShoot(type: WeaponType) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    const now = this.ctx.currentTime;
    // const type = WEAPON_NAMES[weaponType];

    if (type === WeaponType.VULCAN) {
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === WeaponType.LASER) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === WeaponType.MISSILE) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === WeaponType.WAVE) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === WeaponType.PLASMA) {
      osc.type = 'square'; // Buzzier sound
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.5);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === WeaponType.TESLA) {
      // Electric zap sound - high frequency with modulation
      osc.type = 'square';
      osc.frequency.setValueAtTime(1500, now);
      osc.frequency.linearRampToValueAtTime(2000, now + 0.05);
      osc.frequency.linearRampToValueAtTime(1500, now + 0.1);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === WeaponType.MAGMA) {
      // Fiery crackling sound - low rumble with noise
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === WeaponType.SHURIKEN) {
      // Slicing/whoosh sound - sweeping high frequency
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  playExplosion(size: ExplosionSize) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 1. Impact (White Noise) - High frequency crunch
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.3);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(size === ExplosionSize.LARGE ? 1.5 : 0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);

    // 2. Bass (Sawtooth/Triangle) - Low frequency rumble
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + (size === ExplosionSize.LARGE ? 0.8 : 0.4));

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(size === ExplosionSize.LARGE ? 1.5 : 0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + (size === ExplosionSize.LARGE ? 0.8 : 0.4));

    // Lowpass for bass to make it deep
    const oscFilter = this.ctx.createBiquadFilter();
    oscFilter.type = 'lowpass';
    oscFilter.frequency.value = 200;

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + (size === ExplosionSize.LARGE ? 0.8 : 0.4));
  }

  playHit() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    const now = this.ctx.currentTime;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  playShieldBreak() {
    if (!this.ctx || !this.masterGain) return;
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      // High-frequency burst with decay
      const t = i / this.ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * (1 - t);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();
    noise.stop(this.ctx.currentTime + 0.2);

    const crack = this.ctx.createOscillator();
    crack.type = 'square';
    const crackGain = this.ctx.createGain();
    crack.connect(crackGain);
    crackGain.connect(this.masterGain);
    const now = this.ctx.currentTime;
    crack.frequency.setValueAtTime(600, now);
    crack.frequency.exponentialRampToValueAtTime(200, now + 0.12);
    crackGain.gain.setValueAtTime(0.2, now);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    crack.start(now);
    crack.stop(now + 0.12);
  }

  playBomb() {
    if (!this.ctx || !this.masterGain) return;
    // Deep rumbling sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + 1.5);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.linearRampToValueAtTime(0, now + 1.5);

    osc.start(now);
    osc.stop(now + 1.5);
  }

  playPowerUp() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    const now = this.ctx.currentTime;

    // "Coin" sound: B5 -> E6 rapid transition
    // First note
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  playVictory() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.4);
    });
  }

  playDefeat() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [300, 250, 200, 150];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, now + i * 0.2);
      gain.gain.linearRampToValueAtTime(0.01, now + i * 0.2 + 0.3);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.3);
    });
  }

  playWarning() {
    if (!this.ctx || !this.masterGain) return;
    console.log('Playing boss warning sound');
    const now = this.ctx.currentTime;

    // "Wang ~ Wang" effect
    // Low frequency sawtooth with a bandpass filter sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sawtooth';
    osc.frequency.value = 150; // Low drone

    filter.type = 'bandpass';
    filter.Q.value = 5; // High Q for "vocal" quality

    // First "Wang"
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.3); // Wah up
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.6); // Wah down

    // Second "Wang"
    filter.frequency.setValueAtTime(200, now + 0.8);
    filter.frequency.exponentialRampToValueAtTime(800, now + 1.1); // Wah up
    filter.frequency.exponentialRampToValueAtTime(200, now + 1.4); // Wah down

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.6);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.9);
    gain.gain.linearRampToValueAtTime(0, now + 1.5);

    osc.start(now);
    osc.stop(now + 1.5);
  }

  playBossDefeat() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // "Mario-style" victory: G C E G C E (Ascending arpeggio)
    // "Deng deng deng de deng"
    // Let's try a quick ascending major arpeggio
    const notes = [
      { f: 523.25, t: 0.0 }, // C5
      { f: 659.25, t: 0.1 }, // E5
      { f: 783.99, t: 0.2 }, // G5
      { f: 1046.50, t: 0.3 }, // C6
      { f: 1318.51, t: 0.4 }, // E6
      { f: 1567.98, t: 0.5 }, // G6 (Sustained)
    ];

    notes.forEach((note, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.type = 'square'; // 8-bit style
      osc.frequency.value = note.f;

      const startTime = now + note.t;
      const duration = i === notes.length - 1 ? 1.0 : 0.08; // Last note long

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + duration - 0.02);
      gain.gain.linearRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  playLevelUp() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    osc1.frequency.setValueAtTime(440, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.24);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.5, now + 0.02);
    gain1.gain.linearRampToValueAtTime(0.4, now + 0.12);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc1.start(now);
    osc1.stop(now + 0.4);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(3520, now + 0.24);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc2.start(now);
    osc2.stop(now + 0.3);
  }
}
