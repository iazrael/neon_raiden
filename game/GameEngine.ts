
import { AudioSystem } from './AudioSystem';
import { GameState, WeaponType, Particle, SpriteMap, Shockwave } from '../types';
import { SpriteGenerator } from './SpriteGenerator';

interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  type: 'player' | 'enemy' | 'boss' | 'bullet' | 'powerup';
  subType?: number; // For varied enemies/powerups
  color: string;
  markedForDeletion: boolean;
  angle?: number;
  spriteKey?: string; // Key to look up in sprite map
  frame?: number; // Animation frame
  damage?: number; // Projectile damage
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  audio: AudioSystem;
  spriteGen: SpriteGenerator;
  sprites: SpriteMap = {};
  
  width: number = 0;
  height: number = 0;
  
  state: GameState = GameState.MENU;
  score: number = 0;
  level: number = 1;
  maxLevels: number = 5;
  
  player: Entity;
  enemies: Entity[] = [];
  bullets: Entity[] = []; // Player bullets
  enemyBullets: Entity[] = [];
  particles: Particle[] = [];
  shockwaves: Shockwave[] = [];
  powerups: Entity[] = [];
  
  boss: Entity | null = null;
  levelProgress: number = 0; // 0 to 100 before boss
  
  // Input
  keys: { [key: string]: boolean } = {};
  touch: { x: number, y: number, active: boolean } = { x: 0, y: 0, active: false };
  lastTouch: { x: number, y: number } = { x: 0, y: 0 };
  
  // Game loop vars
  lastTime: number = 0;
  enemySpawnTimer: number = 0;
  fireTimer: number = 0;
  
  // Player stats
  weaponType: WeaponType = WeaponType.VULCAN;
  weaponLevel: number = 1;
  
  // Effects
  screenShake: number = 0;

  onScoreChange: (score: number) => void;
  onLevelChange: (level: number) => void;
  onStateChange: (state: GameState) => void;
  onHpChange: (hp: number) => void;

  constructor(
    canvas: HTMLCanvasElement, 
    onScoreChange: (s: number) => void,
    onLevelChange: (l: number) => void,
    onStateChange: (s: GameState) => void,
    onHpChange: (hp: number) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!; 
    this.audio = new AudioSystem();
    this.spriteGen = new SpriteGenerator();
    
    this.onScoreChange = onScoreChange;
    this.onLevelChange = onLevelChange;
    this.onStateChange = onStateChange;
    this.onHpChange = onHpChange;

    this.loadAssets(); // Generate sprites
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Initial player
    this.player = this.createPlayer();

    this.bindInput();
  }

  loadAssets() {
      // Generate and cache all sprites
      this.sprites['player'] = this.spriteGen.generatePlayer();
      this.sprites['enemy_0'] = this.spriteGen.generateEnemy(0);
      this.sprites['enemy_1'] = this.spriteGen.generateEnemy(1);
      this.sprites['enemy_2'] = this.spriteGen.generateEnemy(2);
      
      this.sprites['bullet_vulcan'] = this.spriteGen.generateBullet('vulcan');
      this.sprites['bullet_laser'] = this.spriteGen.generateBullet('laser');
      this.sprites['bullet_missile'] = this.spriteGen.generateBullet('missile');
      this.sprites['bullet_wave'] = this.spriteGen.generateBullet('wave');
      this.sprites['bullet_plasma'] = this.spriteGen.generateBullet('plasma');
      this.sprites['bullet_enemy'] = this.spriteGen.generateBullet('enemy_orb');
      
      this.sprites['powerup_0'] = this.spriteGen.generatePowerup(0);
      this.sprites['powerup_1'] = this.spriteGen.generatePowerup(1);
      this.sprites['powerup_2'] = this.spriteGen.generatePowerup(2);
      this.sprites['powerup_3'] = this.spriteGen.generatePowerup(3);
      this.sprites['powerup_4'] = this.spriteGen.generatePowerup(4);
      this.sprites['powerup_5'] = this.spriteGen.generatePowerup(5);

      // Generate Boss sprites for all 5 levels
      for(let i=1; i<=5; i++) {
          this.sprites[`boss_${i}`] = this.spriteGen.generateBoss(i);
      }
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  createPlayer(): Entity {
    return {
      x: this.width / 2,
      y: this.height - 100,
      width: 48, // Reduced hitbox size slightly relative to visual
      height: 48,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      type: 'player',
      color: '#00ffff',
      markedForDeletion: false,
      spriteKey: 'player'
    };
  }

  bindInput() {
    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);

    // Touch - Relative movement
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this.touch.active = true;
      this.lastTouch.x = t.clientX;
      this.lastTouch.y = t.clientY;
      
      if (this.state === GameState.MENU || this.state === GameState.GAME_OVER || this.state === GameState.VICTORY) {
        this.startGame();
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.touch.active || this.state !== GameState.PLAYING) return;
      const t = e.touches[0];
      const dx = t.clientX - this.lastTouch.x;
      const dy = t.clientY - this.lastTouch.y;
      
      // Update player velocity for banking animation
      this.player.vx = dx; 
      
      this.player.x += dx * 1.5; // Sensitivity
      this.player.y += dy * 1.5;
      
      this.lastTouch.x = t.clientX;
      this.lastTouch.y = t.clientY;
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      this.touch.active = false;
      this.player.vx = 0;
    });
  }

  startGame() {
    this.state = GameState.PLAYING;
    this.score = 0;
    this.level = 1;
    this.weaponLevel = 1;
    this.weaponType = WeaponType.VULCAN;
    this.player = this.createPlayer();
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.particles = [];
    this.shockwaves = [];
    this.powerups = [];
    this.boss = null;
    this.levelProgress = 0;
    this.screenShake = 0;
    this.audio.resume();
    
    this.onStateChange(this.state);
    this.onScoreChange(this.score);
    this.onLevelChange(this.level);
    this.onHpChange(100);
  }

  update(dt: number) {
    if (this.state !== GameState.PLAYING) return;

    const timeScale = dt / 16.66; // Normalize to 60fps

    // Screen Shake Decay
    if (this.screenShake > 0) {
        this.screenShake *= 0.9;
        if (this.screenShake < 0.5) this.screenShake = 0;
    }

    // Player Movement (Keyboard fallback)
    const speed = 7 * timeScale;
    let dx = 0;
    if (this.keys['ArrowLeft']) dx = -speed;
    if (this.keys['ArrowRight']) dx = speed;
    if (this.keys['ArrowUp']) this.player.y -= speed;
    if (this.keys['ArrowDown']) this.player.y += speed;
    
    if (dx !== 0) {
        this.player.x += dx;
        this.player.vx = dx;
    } else if (!this.touch.active) {
        this.player.vx = this.player.vx * 0.8; // Friction
    }

    // Boundary check
    this.player.x = Math.max(32, Math.min(this.width - 32, this.player.x));
    this.player.y = Math.max(32, Math.min(this.height - 32, this.player.y));

    // Fire Player Bullets
    this.fireTimer += dt;
    let fireRate = 120;
    if (this.weaponType === WeaponType.LASER) fireRate = 60;
    if (this.weaponType === WeaponType.WAVE) fireRate = 300;
    if (this.weaponType === WeaponType.PLASMA) fireRate = 600;

    if (this.fireTimer > fireRate) {
       this.fireWeapon();
       this.fireTimer = 0;
    }

    // Level Progress
    if (!this.boss) {
      this.levelProgress += 0.05 * timeScale;
      // Spawn Enemies
      this.enemySpawnTimer += dt;
      const spawnRate = Math.max(500, 2000 - (this.level * 200));
      if (this.enemySpawnTimer > spawnRate) {
        this.spawnEnemy();
        this.enemySpawnTimer = 0;
      }

      if (this.levelProgress >= 100) {
        this.spawnBoss();
      }
    } else {
        // Boss Logic
        this.updateBoss(dt, timeScale);
    }

    // Update Entities
    this.updateEntities(this.bullets, timeScale);
    this.updateEntities(this.enemyBullets, timeScale);
    this.updateEntities(this.enemies, timeScale);
    this.updateEntities(this.powerups, timeScale);

    // Update Particles
    this.particles.forEach(p => {
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;
      p.life -= dt;
    });
    this.particles = this.particles.filter(p => p.life > 0);

    // Update Shockwaves
    this.shockwaves.forEach(s => {
        s.radius += (s.maxRadius - s.radius) * 0.1 * timeScale;
        s.life -= 0.02 * timeScale;
    });
    this.shockwaves = this.shockwaves.filter(s => s.life > 0);

    // Collisions
    this.checkCollisions();

    // Clean up
    this.bullets = this.bullets.filter(e => !e.markedForDeletion && e.y > -100);
    this.enemyBullets = this.enemyBullets.filter(e => !e.markedForDeletion && e.y < this.height + 50 && e.x > -50 && e.x < this.width + 50);
    this.enemies = this.enemies.filter(e => !e.markedForDeletion && e.y < this.height + 100);
    this.powerups = this.powerups.filter(e => !e.markedForDeletion && e.y < this.height + 50);

    // Game Over check
    if (this.player.hp <= 0) {
      this.createExplosion(this.player.x, this.player.y, 'large', '#00ffff');
      this.audio.playExplosion('large');
      this.state = GameState.GAME_OVER;
      this.onStateChange(this.state);
    }
  }

  fireWeapon() {
    this.audio.playShoot(
        this.weaponType === WeaponType.VULCAN ? 'vulcan' : 
        this.weaponType === WeaponType.LASER ? 'laser' : 
        this.weaponType === WeaponType.MISSILE ? 'missile' : 
        this.weaponType === WeaponType.WAVE ? 'wave' : 'plasma'
    );
    
    if (this.weaponType === WeaponType.VULCAN) {
        const count = 1 + this.weaponLevel;
        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * 10;
            const angle = (i - (count - 1) / 2) * 0.1;
            this.bullets.push({
                x: this.player.x + offset,
                y: this.player.y - 20,
                width: 10,
                height: 20,
                vx: Math.sin(angle) * 10,
                vy: -15,
                hp: 1,
                maxHp: 1,
                type: 'bullet',
                color: '#ffaa00',
                markedForDeletion: false,
                spriteKey: 'bullet_vulcan',
                damage: 10 + this.weaponLevel * 5
            });
        }
    } else if (this.weaponType === WeaponType.LASER) {
        this.bullets.push({
            x: this.player.x,
            y: this.player.y - 30,
            width: 12 + this.weaponLevel * 2,
            height: 40,
            vx: 0,
            vy: -25,
            hp: 999,
            maxHp: 999,
            type: 'bullet',
            color: '#00ffff',
            markedForDeletion: false,
            spriteKey: 'bullet_laser',
            damage: 5 + this.weaponLevel
        });
    } else if (this.weaponType === WeaponType.MISSILE) {
        this.bullets.push({
            x: this.player.x - 20,
            y: this.player.y,
            width: 16,
            height: 32,
            vx: -2,
            vy: -12,
            hp: 1,
            maxHp: 1,
            type: 'bullet',
            color: '#ff00ff',
            markedForDeletion: false,
            spriteKey: 'bullet_missile',
            damage: 20 + this.weaponLevel * 5
        });
        this.bullets.push({
            x: this.player.x + 20,
            y: this.player.y,
            width: 16,
            height: 32,
            vx: 2,
            vy: -12,
            hp: 1,
            maxHp: 1,
            type: 'bullet',
            color: '#ff00ff',
            markedForDeletion: false,
            spriteKey: 'bullet_missile',
            damage: 20 + this.weaponLevel * 5
        });
    } else if (this.weaponType === WeaponType.WAVE) {
        // Wide projectile that pierces
        this.bullets.push({
            x: this.player.x,
            y: this.player.y - 40,
            width: 80 + this.weaponLevel * 10,
            height: 30,
            vx: 0,
            vy: -15,
            hp: 999, // Piercing
            maxHp: 999,
            type: 'bullet',
            color: '#63b3ed',
            markedForDeletion: false,
            spriteKey: 'bullet_wave',
            damage: 15 + this.weaponLevel * 5
        });
    } else if (this.weaponType === WeaponType.PLASMA) {
        // Slow moving, big damage
        this.bullets.push({
            x: this.player.x,
            y: this.player.y - 40,
            width: 48 + this.weaponLevel * 5,
            height: 48 + this.weaponLevel * 5,
            vx: 0,
            vy: -6,
            hp: 1,
            maxHp: 1,
            type: 'bullet',
            color: '#ed64a6',
            markedForDeletion: false,
            spriteKey: 'bullet_plasma',
            damage: 100 + this.weaponLevel * 20
        });
    }
  }

  spawnEnemy() {
    const x = Math.random() * (this.width - 60) + 30;
    const type = Math.floor(Math.random() * 3); // 0: Basic, 1: Fast, 2: Tank
    let enemy: Entity = {
      x,
      y: -50,
      width: 40,
      height: 40,
      vx: 0,
      vy: 2 + (this.level * 0.5),
      hp: 20 + (this.level * 10),
      maxHp: 20,
      type: 'enemy',
      subType: type,
      color: '#ff0000',
      markedForDeletion: false,
      angle: 0,
      spriteKey: `enemy_${type}`
    };

    if (type === 1) { // Fast
        enemy.width = 30;
        enemy.vx = (Math.random() - 0.5) * 4;
        enemy.vy = 5 + this.level;
        enemy.hp = 10;
    } else if (type === 2) { // Tank
        enemy.width = 60;
        enemy.height = 60;
        enemy.vy = 1;
        enemy.hp = 60 + (this.level * 20);
    }

    this.enemies.push(enemy);
  }

  spawnBoss() {
    const hpMultiplier = 1000 * this.level;
    const sprite = this.sprites[`boss_${this.level}`];
    // Scale boss size based on sprite
    const width = sprite ? sprite.width : 150;
    const height = sprite ? sprite.height : 150;

    this.boss = {
        x: this.width / 2,
        y: -150,
        width: width * 0.8, // Slightly smaller hitbox than visual
        height: height * 0.8,
        vx: 0,
        vy: 1,
        hp: hpMultiplier,
        maxHp: hpMultiplier,
        type: 'boss',
        color: '#ffffff',
        markedForDeletion: false,
        angle: 0,
        spriteKey: `boss_${this.level}`
    };
    this.screenShake = 20; // Entry shake
    this.audio.playPowerUp();
  }

  updateBoss(dt: number, timeScale: number) {
    if (!this.boss) return;

    if (this.boss.y < 150) {
        this.boss.y += 1 * timeScale;
    } else {
        // Figure 8 movement pattern
        this.boss.x += Math.cos(Date.now() / 1000) * 2 * timeScale;
        
        // Attack Pattern
        if (Math.random() < 0.05 * timeScale) {
             this.bossFire();
        }
    }
  }

  bossFire() {
      if (!this.boss) return;
      
      const bulletsCount = 5 + (this.level * 2);
      
      for(let i=0; i<bulletsCount; i++) {
        const angle = (i / bulletsCount) * Math.PI * 2 + (Date.now() / 1000);
        this.enemyBullets.push({
            x: this.boss.x,
            y: this.boss.y + this.boss.height/4,
            width: 16,
            height: 16,
            vx: Math.cos(angle) * 4,
            vy: Math.sin(angle) * 4,
            hp: 1,
            maxHp: 1,
            type: 'bullet',
            color: '#ff0055',
            markedForDeletion: false,
            spriteKey: 'bullet_enemy'
        });
      }
      
      // Aimed shot
      if (this.level >= 2) {
          const dx = this.player.x - this.boss.x;
          const dy = this.player.y - this.boss.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          this.enemyBullets.push({
            x: this.boss.x,
            y: this.boss.y + this.boss.height/4,
            width: 20,
            height: 20,
            vx: (dx/dist) * 8,
            vy: (dy/dist) * 8,
            hp: 1,
            maxHp: 1,
            type: 'bullet',
            color: '#ffffff',
            markedForDeletion: false,
            spriteKey: 'bullet_enemy'
        });
      }
  }

  updateEntities(entities: Entity[], timeScale: number) {
    entities.forEach(e => {
      e.x += e.vx * timeScale;
      e.y += e.vy * timeScale;
      
      if (e.type === 'enemy' && Math.random() < 0.005 * timeScale) {
          this.enemyBullets.push({
              x: e.x,
              y: e.y + e.height/2,
              width: 12,
              height: 12,
              vx: 0,
              vy: 5,
              hp: 1,
              maxHp: 1,
              type: 'bullet',
              color: '#ff9999',
              markedForDeletion: false,
              spriteKey: 'bullet_enemy'
          });
      }
    });
  }

  checkCollisions() {
    this.bullets.forEach(b => {
        // Enemies
        this.enemies.forEach(e => {
            if (this.isColliding(b, e)) {
                if (this.weaponType === WeaponType.PLASMA) {
                     this.createPlasmaExplosion(b.x, b.y);
                     b.markedForDeletion = true;
                } else if (this.weaponType === WeaponType.WAVE || this.weaponType === WeaponType.LASER) {
                    // Piercing - do not delete bullet
                } else {
                    b.markedForDeletion = true; 
                }
                
                this.damageEnemy(e, b.damage || 10);
                if (b.type !== 'bullet' || this.weaponType !== WeaponType.PLASMA) {
                   this.createExplosion(b.x, b.y, 'small', '#ffe066');
                }
            }
        });
        
        // Boss
        if (this.boss && this.isColliding(b, this.boss)) {
             if (this.weaponType === WeaponType.PLASMA) {
                 this.createPlasmaExplosion(b.x, b.y);
                 b.markedForDeletion = true;
             } else if (this.weaponType === WeaponType.WAVE || this.weaponType === WeaponType.LASER) {
                 // Piercing
             } else {
                 b.markedForDeletion = true;
             }
             
             this.damageBoss(b.damage || 10);
             if (b.type !== 'bullet' || this.weaponType !== WeaponType.PLASMA) {
                 this.createExplosion(b.x, b.y + 20, 'small', '#fff');
             }
        }
    });

    // Player vs Enemy Bullets/Enemies
    [...this.enemyBullets, ...this.enemies].forEach(e => {
        if (this.isColliding(e, this.player)) {
            e.markedForDeletion = true; 
            if (e.type === 'enemy') e.hp = 0; 
            
            this.player.hp -= 10;
            this.screenShake = 10;
            this.onHpChange(this.player.hp);
            this.createExplosion(this.player.x, this.player.y, 'small', '#00ffff');
        }
    });
    
    if (this.boss && this.isColliding(this.boss, this.player)) {
        this.player.hp -= 1; 
        this.onHpChange(this.player.hp);
        this.screenShake = 2;
    }

    // Powerups
    this.powerups.forEach(p => {
        if (this.isColliding(p, this.player)) {
            p.markedForDeletion = true;
            this.audio.playPowerUp();
            this.score += 500;
            this.onScoreChange(this.score);
            
            if (p.subType === 0) { 
                this.weaponLevel = Math.min(5, this.weaponLevel + 1);
            } else if (p.subType === 1) { 
                this.weaponType = WeaponType.LASER;
            } else if (p.subType === 2) { 
                this.weaponType = WeaponType.VULCAN;
            } else if (p.subType === 3) { 
                this.player.hp = Math.min(100, this.player.hp + 30);
                this.onHpChange(this.player.hp);
            } else if (p.subType === 4) {
                this.weaponType = WeaponType.WAVE;
            } else if (p.subType === 5) {
                this.weaponType = WeaponType.PLASMA;
            }
        }
    });
  }

  createPlasmaExplosion(x: number, y: number) {
      this.createExplosion(x, y, 'large', '#ed64a6');
      this.addShockwave(x, y, '#ed64a6');
      this.screenShake = 15;
      this.audio.playExplosion('large');

      // AoE Damage
      const range = 100;
      this.enemies.forEach(e => {
          const dist = Math.sqrt((e.x - x)**2 + (e.y - y)**2);
          if (dist < range) {
              this.damageEnemy(e, 50);
          }
      });
      // Clear bullets
      this.enemyBullets.forEach(b => {
          const dist = Math.sqrt((b.x - x)**2 + (b.y - y)**2);
          if (dist < range) {
              b.markedForDeletion = true;
          }
      });
  }

  damageEnemy(e: Entity, dmg: number) {
      e.hp -= dmg;
      if (e.hp <= 0 && !e.markedForDeletion) {
          e.markedForDeletion = true;
          this.score += 100 * (e.subType! + 1);
          this.onScoreChange(this.score);
          this.createExplosion(e.x, e.y, 'large', e.type === 'enemy' ? '#c53030' : '#fff');
          this.audio.playExplosion('small');
          
          if (Math.random() < 0.15) this.spawnPowerup(e.x, e.y);
      }
  }

  damageBoss(dmg: number) {
      if (!this.boss) return;
      this.boss.hp -= dmg;
      if (this.boss.hp <= 0) {
          // Capture Boss Position BEFORE setting null
          const bx = this.boss.x;
          const by = this.boss.y;

          this.createExplosion(bx, by, 'large', '#ffffff');
          this.addShockwave(bx, by);
          this.screenShake = 30;

          for(let i=0; i<15; i++) {
              setTimeout(() => {
                  if (this.state === GameState.VICTORY) return;
                  // Use captured coords
                  this.createExplosion(
                      bx + (Math.random()-0.5)*150, 
                      by + (Math.random()-0.5)*150, 
                      'large', '#fff'
                  );
                  this.screenShake = 10;
              }, i * 100);
          }
          this.audio.playExplosion('large');
          this.score += 5000 * this.level;
          this.onScoreChange(this.score);
          this.boss = null;
          
          setTimeout(() => {
              if (this.level < this.maxLevels) {
                  this.level++;
                  this.levelProgress = 0;
                  this.onLevelChange(this.level);
                  this.player.hp = 100;
                  this.onHpChange(100);
              } else {
                  this.state = GameState.VICTORY;
                  this.onStateChange(this.state);
              }
          }, 3000);
      }
  }

  spawnPowerup(x: number, y: number) {
      const type = Math.floor(Math.random() * 6); 
      this.powerups.push({
          x, y, width: 30, height: 30, vx: 0, vy: 2, hp: 1, maxHp: 1, 
          type: 'powerup', subType: type, color: '#fff', markedForDeletion: false,
          spriteKey: `powerup_${type}`
      });
  }

  createExplosion(x: number, y: number, size: 'small' | 'large', color: string) {
      const count = size === 'small' ? 8 : 30;
      for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * (size === 'small' ? 4 : 10);
          this.particles.push({
              x, y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: size === 'small' ? 300 : 800,
              maxLife: size === 'small' ? 300 : 800,
              color: color,
              size: Math.random() * 4 + 2,
              type: 'spark'
          });
      }
  }

  addShockwave(x: number, y: number, color: string = '#ffffff') {
      this.shockwaves.push({
          x, y, radius: 10, maxRadius: 150, color, life: 1.0
      });
  }

  isColliding(a: Entity, b: Entity) {
      return (
          a.x - a.width/2 < b.x + b.width/2 &&
          a.x + a.width/2 > b.x - b.width/2 &&
          a.y - a.height/2 < b.y + b.height/2 &&
          a.y + a.height/2 > b.y - b.height/2
      );
  }

  draw() {
    this.ctx.save();
    
    // Screen Shake Effect
    if (this.screenShake > 0) {
        const sx = (Math.random() - 0.5) * this.screenShake;
        const sy = (Math.random() - 0.5) * this.screenShake;
        this.ctx.translate(sx, sy);
    }

    this.ctx.fillStyle = '#050505';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Dynamic Starfield
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    const t = Date.now() / 1000;
    for(let i=0; i<30; i++) {
        const speed = (i % 3) + 1;
        const sx = (i * 57) % this.width;
        const sy = (i * 31 + t * 100 * speed) % this.height;
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, Math.random() * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    if (this.state !== GameState.GAME_OVER) {
        this.drawEntity(this.player);
    }

    this.powerups.forEach(p => this.drawEntity(p));
    this.enemies.forEach(e => this.drawEntity(e));
    if (this.boss) this.drawEntity(this.boss);
    this.bullets.forEach(b => this.drawEntity(b));
    this.enemyBullets.forEach(b => this.drawEntity(b));

    // Draw Particles (Composite for glow)
    this.ctx.globalCompositeOperation = 'lighter';
    this.particles.forEach(p => {
        this.ctx.globalAlpha = p.life / p.maxLife;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
    });

    // Draw Shockwaves
    this.shockwaves.forEach(s => {
        this.ctx.globalAlpha = s.life;
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = s.color;
        this.ctx.beginPath();
        this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        this.ctx.stroke();
    });

    this.ctx.globalAlpha = 1.0;
    this.ctx.globalCompositeOperation = 'source-over';
    
    this.ctx.restore();
  }

  drawEntity(e: Entity) {
    this.ctx.save();
    this.ctx.translate(Math.round(e.x), Math.round(e.y));

    if (e.type === 'player') {
        // Banking effect
        const bankAngle = Math.max(-0.3, Math.min(0.3, (e.vx || 0) * 0.05));
        this.ctx.rotate(bankAngle);
        
        // Engine trail
        this.ctx.fillStyle = `rgba(0, 255, 255, ${Math.random() * 0.5 + 0.2})`;
        this.ctx.beginPath();
        this.ctx.moveTo(-5, 25);
        this.ctx.lineTo(5, 25);
        this.ctx.lineTo(0, 40 + Math.random() * 10);
        this.ctx.fill();
    }
    
    // Rotate bullets for visuals
    if (e.spriteKey === 'bullet_wave') {
        // Wave is upright, no rotation needed
    }
    if (e.spriteKey === 'bullet_plasma') {
        this.ctx.rotate(Date.now() / 100);
    }

    if (e.spriteKey && this.sprites[e.spriteKey]) {
        const sprite = this.sprites[e.spriteKey];
        // Draw centered
        this.ctx.drawImage(sprite, -sprite.width/2, -sprite.height/2);
    } else {
        // Fallback drawing if sprite missing
        this.ctx.fillStyle = e.color;
        this.ctx.fillRect(-e.width/2, -e.height/2, e.width, e.height);
    }

    // Boss HP Bar overlay
    if (e.type === 'boss') {
        this.ctx.rotate(Math.PI); // Cancel boss rotation for UI
        this.ctx.fillStyle = 'rgba(255,0,0,0.5)';
        this.ctx.fillRect(-50, 0, 100, 6);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(-50, 0, 100 * (e.hp/e.maxHp), 6);
    }

    this.ctx.restore();
  }

  loop(dt: number) {
      this.update(dt);
      this.draw();
  }
}
