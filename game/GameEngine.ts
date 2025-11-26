

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
    type: 'player' | 'enemy' | 'boss' | 'bullet' | 'powerup' | 'option';
    subType?: number;
    color: string;
    markedForDeletion: boolean;
    angle?: number;
    spriteKey?: string;
    frame?: number;
    damage?: number;
    owner?: Entity; // For options
    angleOffset?: number; // For options
    isElite?: boolean;
    state?: number; // For AI state
    timer?: number; // For AI timer
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
    maxLevels: number = 10;

    player: Entity;
    options: Entity[] = []; // Wingmen
    enemies: Entity[] = [];
    bullets: Entity[] = [];
    enemyBullets: Entity[] = [];
    particles: Particle[] = [];
    shockwaves: Shockwave[] = [];
    powerups: Entity[] = [];
    meteors: { x: number, y: number, length: number, vx: number, vy: number }[] = [];

    boss: Entity | null = null;
    levelProgress: number = 0;

    // Input
    keys: { [key: string]: boolean } = {};
    touch: { x: number, y: number, active: boolean } = { x: 0, y: 0, active: false };
    lastTouch: { x: number, y: number } = { x: 0, y: 0 };

    // Game vars
    lastTime: number = 0;
    enemySpawnTimer: number = 0;
    fireTimer: number = 0;
    meteorTimer: number = 0;

    // Player stats
    weaponType: WeaponType = WeaponType.VULCAN;
    weaponLevel: number = 1;
    bombs: number = 3; // Start with 3 bombs
    shield: number = 0; // Shield HP

    // Effects
    screenShake: number = 0;

    // Callbacks
    onScoreChange: (score: number) => void;
    onLevelChange: (level: number) => void;
    onStateChange: (state: GameState) => void;
    onHpChange: (hp: number) => void;
    onBombChange: (bombs: number) => void;

    constructor(
        canvas: HTMLCanvasElement,
        onScoreChange: (s: number) => void,
        onLevelChange: (l: number) => void,
        onStateChange: (s: GameState) => void,
        onHpChange: (hp: number) => void,
        onBombChange: (bombs: number) => void
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false })!;
        this.audio = new AudioSystem();
        this.spriteGen = new SpriteGenerator();

        this.onScoreChange = onScoreChange;
        this.onLevelChange = onLevelChange;
        this.onStateChange = onStateChange;
        this.onHpChange = onHpChange;
        this.onBombChange = onBombChange;

        this.loadAssets();
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.player = this.createPlayer();
        this.bindInput();
    }

    loadAssets() {
        // Sprites
        this.sprites['player'] = this.spriteGen.generatePlayer();
        this.sprites['option'] = this.spriteGen.generateOption();

        // Enemies (Types 0-4)
        for (let i = 0; i <= 4; i++) {
            this.sprites[`enemy_${i}`] = this.spriteGen.generateEnemy(i);
        }

        // Bullets
        this.sprites['bullet_vulcan'] = this.spriteGen.generateBullet('vulcan');
        this.sprites['bullet_laser'] = this.spriteGen.generateBullet('laser');
        this.sprites['bullet_missile'] = this.spriteGen.generateBullet('missile');
        this.sprites['bullet_wave'] = this.spriteGen.generateBullet('wave');
        this.sprites['bullet_plasma'] = this.spriteGen.generateBullet('plasma');
        this.sprites['bullet_enemy'] = this.spriteGen.generateBullet('enemy_orb');

        // Powerups (Types 0-7)
        for (let i = 0; i <= 7; i++) {
            this.sprites[`powerup_${i}`] = this.spriteGen.generatePowerup(i);
        }

        // Bosses
        for (let i = 1; i <= 5; i++) {
            this.sprites[`boss_${i}`] = this.spriteGen.generateBoss(i);
        }
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.ctx.scale(dpr, dpr);
    }

    createPlayer(): Entity {
        return {
            x: this.width / 2,
            y: this.height - 100,
            width: 48,
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
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if ((e.code === 'KeyB' || e.code === 'Space') && this.state === GameState.PLAYING) {
                this.triggerBomb();
            }
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // Mouse Movement
        window.addEventListener('mousemove', (e) => {
            if (this.state === GameState.PLAYING) {
                this.player.x = e.clientX;
                this.player.y = e.clientY;
            }
        });

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this.touch.active = true;
            this.lastTouch.x = t.clientX;
            this.lastTouch.y = t.clientY;

            if (this.state !== GameState.PLAYING) {
                if (this.state === GameState.MENU || this.state === GameState.GAME_OVER || this.state === GameState.VICTORY) {
                    this.startGame();
                }
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.touch.active || this.state !== GameState.PLAYING) return;
            const t = e.touches[0];
            const dx = t.clientX - this.lastTouch.x;
            const dy = t.clientY - this.lastTouch.y;

            this.player.vx = dx;
            this.player.x += dx * 1.5;
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
        this.bombs = 3;
        this.shield = 0;

        this.player = this.createPlayer();
        this.options = [];
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.shockwaves = [];
        this.powerups = [];
        this.meteors = [];
        this.boss = null;
        this.levelProgress = 0;
        this.screenShake = 0;
        this.audio.resume();

        this.onStateChange(this.state);
        this.onScoreChange(this.score);
        this.onLevelChange(this.level);
        this.onHpChange(100);
        this.onBombChange(this.bombs);
    }

    triggerBomb() {
        if (this.bombs > 0 && this.state === GameState.PLAYING && this.player.hp > 0) {
            this.bombs--;
            this.onBombChange(this.bombs);

            this.audio.playBomb();
            this.screenShake = 40;
            this.addShockwave(this.width / 2, this.height / 2, '#fff', 500, 30);

            // Clear bullets
            this.enemyBullets = [];

            // Kill all normal enemies
            this.enemies.forEach(e => {
                this.createExplosion(e.x, e.y, 'large', e.color);
                e.hp = 0;
                e.markedForDeletion = true;
                this.score += 100;
            });
            this.onScoreChange(this.score);

            // Damage Boss
            if (this.boss) {
                this.damageBoss(500);
            }
        }
    }

    update(dt: number) {
        if (this.state !== GameState.PLAYING) return;

        const timeScale = dt / 16.66;

        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }

        // Player Movement (Keyboard)
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
            this.player.vx = this.player.vx * 0.8;
        }

        // Boundary
        this.player.x = Math.max(32, Math.min(this.width - 32, this.player.x));
        this.player.y = Math.max(32, Math.min(this.height - 32, this.player.y));

        // Options (Wingmen) update
        this.options.forEach((opt, index) => {
            const targetAngle = (Date.now() / 1000) * 2 + (index * (Math.PI * 2 / this.options.length));
            const radius = 60;
            const tx = this.player.x + Math.cos(targetAngle) * radius;
            const ty = this.player.y + Math.sin(targetAngle) * radius;

            // Smooth follow
            opt.x += (tx - opt.x) * 0.2 * timeScale;
            opt.y += (ty - opt.y) * 0.2 * timeScale;
        });

        // Fire
        this.fireTimer += dt;
        let fireRate = 100 - (this.weaponLevel * 2); // Faster fire with level
        if (this.weaponType === WeaponType.LASER) fireRate = 60;
        if (this.weaponType === WeaponType.WAVE) fireRate = 350 - (this.weaponLevel * 20);
        if (this.weaponType === WeaponType.PLASMA) fireRate = 600 - (this.weaponLevel * 50);
        if (this.weaponType === WeaponType.TESLA) fireRate = 200 - (this.weaponLevel * 10);
        if (this.weaponType === WeaponType.MAGMA) fireRate = 50;
        if (this.weaponType === WeaponType.SHURIKEN) fireRate = 400 - (this.weaponLevel * 30);


        if (this.fireTimer > Math.max(30, fireRate)) {
            this.fireWeapon();
            this.fireTimer = 0;
        }

        // Level Logic
        if (!this.boss) {
            this.levelProgress += 0.05 * timeScale;
            this.enemySpawnTimer += dt;
            // More enemies as level rises
            const spawnRate = Math.max(300, 1500 - (this.level * 200));
            if (this.enemySpawnTimer > spawnRate) {
                this.spawnEnemy();
                this.enemySpawnTimer = 0;
            }

            if (this.levelProgress >= 100) {
                this.spawnBoss();
            }
        } else {
            this.updateBoss(dt, timeScale);
        }

        // Meteors
        this.meteorTimer += dt;
        if (this.meteorTimer > 200) {
            if (Math.random() < 0.1) this.spawnMeteor();
            this.meteorTimer = 0;
        }
        this.meteors.forEach(m => {
            m.x += m.vx * timeScale;
            m.y += m.vy * timeScale;
        });
        this.meteors = this.meteors.filter(m => m.y < this.height + 100 && m.x > -100);

        // Updates
        this.updateEntities(this.bullets, timeScale, dt);
        this.updateEntities(this.enemyBullets, timeScale, dt);
        this.updateEntities(this.enemies, timeScale, dt);
        this.updateEntities(this.powerups, timeScale, dt);

        // Particles
        this.particles.forEach(p => {
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            p.life -= dt;
        });
        this.particles = this.particles.filter(p => p.life > 0);

        // Shockwaves
        this.shockwaves.forEach(s => {
            s.radius += (s.maxRadius - s.radius) * 0.1 * timeScale;
            s.life -= 0.02 * timeScale;
        });
        this.shockwaves = this.shockwaves.filter(s => s.life > 0);

        this.checkCollisions();

        // Clean up
        this.bullets = this.bullets.filter(e => !e.markedForDeletion && e.y > -100);
        this.enemyBullets = this.enemyBullets.filter(e => !e.markedForDeletion && e.y < this.height + 50 && e.x > -50 && e.x < this.width + 50);
        this.enemies = this.enemies.filter(e => !e.markedForDeletion && e.y < this.height + 100);
        this.powerups = this.powerups.filter(e => !e.markedForDeletion && e.y < this.height + 50);

        if (this.player.hp <= 0) {
            this.createExplosion(this.player.x, this.player.y, 'large', '#00ffff');
            this.audio.playExplosion('large');
            this.audio.playDefeat();
            this.state = GameState.GAME_OVER;
            this.onStateChange(this.state);
        }
    }

    spawnMeteor() {
        const speed = Math.random() * 10 + 10;
        this.meteors.push({
            x: Math.random() * this.width,
            y: -100,
            length: Math.random() * 50 + 20,
            vx: (Math.random() - 0.5) * 5,
            vy: speed
        });
    }

    fireWeapon() {
        this.audio.playShoot(
            this.weaponType === WeaponType.VULCAN ? 'vulcan' :
                this.weaponType === WeaponType.LASER ? 'laser' :
                    this.weaponType === WeaponType.MISSILE ? 'missile' :
                        this.weaponType === WeaponType.WAVE ? 'wave' :
                            this.weaponType === WeaponType.TESLA ? 'laser' : // Reuse laser sound for now
                                this.weaponType === WeaponType.MAGMA ? 'vulcan' : // Reuse vulcan sound
                                    this.weaponType === WeaponType.SHURIKEN ? 'missile' : // Reuse missile sound
                                        'plasma'
        );

        // Helper to spawn bullet
        const spawn = (x: number, y: number, vx: number, vy: number, damage: number, type: WeaponType, sprite: string, w: number, h: number) => {
            this.bullets.push({
                x, y, width: w, height: h, vx, vy, hp: type === WeaponType.WAVE || type === WeaponType.LASER ? 999 : 1,
                maxHp: 1, type: 'bullet', color: '#fff', markedForDeletion: false,
                spriteKey: sprite, damage
            });
        };

        // Main Gun
        const levelMult = this.weaponLevel;
        if (this.weaponType === WeaponType.VULCAN) {
            // 1 -> 3 -> 5 -> 7
            let count = 1;
            if (this.weaponLevel >= 3) count = 3;
            if (this.weaponLevel >= 6) count = 5;
            if (this.weaponLevel >= 9) count = 7;

            for (let i = 0; i < count; i++) {
                const angle = (i - (count - 1) / 2) * 0.1; // Tighter spread
                spawn(this.player.x, this.player.y - 20, Math.sin(angle) * 10, -15, 10 + levelMult * 3, this.weaponType, 'bullet_vulcan', 10, 20);
            }
        } else if (this.weaponType === WeaponType.LASER) {
            // Laser: Thicker and multi-beam at high levels
            // Lvl 1-4: Single thick beam
            // Lvl 5-7: Double beam
            // Lvl 8-10: Triple beam
            const damage = 5 + levelMult * 3;
            const w = 12 + levelMult * 3;

            if (this.weaponLevel < 5) {
                spawn(this.player.x, this.player.y - 30, 0, -25, damage, this.weaponType, 'bullet_laser', w, 60);
            } else if (this.weaponLevel < 8) {
                spawn(this.player.x - 15, this.player.y - 30, 0, -25, damage, this.weaponType, 'bullet_laser', w * 0.8, 60);
                spawn(this.player.x + 15, this.player.y - 30, 0, -25, damage, this.weaponType, 'bullet_laser', w * 0.8, 60);
            } else {
                spawn(this.player.x, this.player.y - 35, 0, -25, damage, this.weaponType, 'bullet_laser', w, 70);
                spawn(this.player.x - 25, this.player.y - 30, -1, -24, damage, this.weaponType, 'bullet_laser', w * 0.7, 60);
                spawn(this.player.x + 25, this.player.y - 30, 1, -24, damage, this.weaponType, 'bullet_laser', w * 0.7, 60);
            }

        } else if (this.weaponType === WeaponType.MISSILE) {
            // 2 -> 4 -> 6 -> 8
            let count = 2;
            if (this.weaponLevel >= 3) count = 4;
            if (this.weaponLevel >= 6) count = 6;
            if (this.weaponLevel >= 9) count = 8;

            for (let i = 0; i < count; i++) {
                // Spread out launch points
                const offsetX = (i - (count - 1) / 2) * 15;
                spawn(this.player.x + offsetX, this.player.y, (i - (count - 1) / 2) * 0.5, -12, 15 + levelMult * 6, this.weaponType, 'bullet_missile', 16, 32);
            }
        } else if (this.weaponType === WeaponType.WAVE) {
            spawn(this.player.x, this.player.y - 40, 0, -15, 20 + levelMult * 6, this.weaponType, 'bullet_wave', 80 + levelMult * 12, 30);
        } else if (this.weaponType === WeaponType.PLASMA) {
            // Explosion radius handled in createPlasmaExplosion, here just bullet size
            spawn(this.player.x, this.player.y - 40, 0, -8, 80 + levelMult * 25, this.weaponType, 'bullet_plasma', 48 + levelMult * 8, 48 + levelMult * 8);
        } else if (this.weaponType === WeaponType.TESLA) {
            // Auto-lock to nearest enemy
            let target: Entity | null = null;
            let minDist = 400; // Range
            this.enemies.forEach(e => {
                const dist = Math.sqrt((e.x - this.player.x) ** 2 + (e.y - this.player.y) ** 2);
                if (dist < minDist && e.y < this.player.y) { // Only target enemies above
                    minDist = dist;
                    target = e;
                }
            });

            const damage = 15 + levelMult * 4;
            if (target) {
                const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
                spawn(this.player.x, this.player.y - 20, Math.cos(angle) * 20, Math.sin(angle) * 20, damage, this.weaponType, 'bullet_tesla', 32, 32);
            } else {
                // No target, shoot straight
                spawn(this.player.x, this.player.y - 20, 0, -20, damage, this.weaponType, 'bullet_tesla', 32, 32);
            }
        } else if (this.weaponType === WeaponType.MAGMA) {
            // Short range flamethrower
            const count = 3 + Math.floor(this.weaponLevel / 3);
            for (let i = 0; i < count; i++) {
                const angle = (Math.random() - 0.5) * 0.5 - 1.57; // Upward cone
                const speed = 10 + Math.random() * 5;
                spawn(this.player.x, this.player.y - 20, Math.cos(angle) * speed, Math.sin(angle) * speed, 8 + levelMult * 2, this.weaponType, 'bullet_magma', 24, 24);
            }
        } else if (this.weaponType === WeaponType.SHURIKEN) {
            // Bouncing projectiles
            const count = 2 + Math.floor(this.weaponLevel / 3);
            for (let i = 0; i < count; i++) {
                const angle = -1.57 + (i - (count - 1) / 2) * 0.5;
                spawn(this.player.x, this.player.y - 20, Math.cos(angle) * 12, Math.sin(angle) * 12, 12 + levelMult * 3, this.weaponType, 'bullet_shuriken', 24, 24);
            }
        }

        // Option Fire
        this.options.forEach(opt => {
            spawn(opt.x, opt.y, 0, -15, 10, WeaponType.VULCAN, 'bullet_vulcan', 8, 16);
        });
    }

    spawnEnemy() {
        const x = Math.random() * (this.width - 60) + 30;

        // Mixed Spawning Logic
        // Instead of random type based on level, we use a weighted pool based on level
        const availableTypes = [0];
        if (this.level >= 2) availableTypes.push(1);
        if (this.level >= 3) availableTypes.push(2);
        if (this.level >= 4) availableTypes.push(3);
        if (this.level >= 5) availableTypes.push(4);
        if (this.level >= 6) availableTypes.push(5); // Laser Interceptor
        if (this.level >= 7) availableTypes.push(6); // Mine Layer

        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];

        // Elite Chance
        const isElite = Math.random() < 0.15;

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
            spriteKey: `enemy_${type}`,
            isElite: isElite,
            state: 0,
            timer: 0
        };

        if (type === 1) { // Fast
            enemy.width = 30;
            enemy.vx = (Math.random() - 0.5) * 6;
            enemy.vy = 5 + this.level;
            enemy.hp = 10;
        } else if (type === 2) { // Tank
            enemy.width = 60;
            enemy.height = 60;
            enemy.vy = 1;
            enemy.hp = 60 + (this.level * 20);
        } else if (type === 3) { // Kamikaze
            enemy.width = 30;
            enemy.vy = 7;
            enemy.hp = 5;
        } else if (type === 4) { // Elite Gunboat
            enemy.width = 70;
            enemy.height = 50;
            enemy.vy = 0.5;
            enemy.hp = 150 + (this.level * 30);
        } else if (type === 5) { // Laser Interceptor
            enemy.width = 50;
            enemy.height = 50;
            enemy.vy = 4; // Fast entry
            enemy.hp = 80 + (this.level * 15);
        } else if (type === 6) { // Mine Layer
            enemy.width = 60;
            enemy.height = 40;
            enemy.vy = 1.5;
            enemy.hp = 120 + (this.level * 20);
        }

        // Apply Elite Stats
        if (isElite) {
            enemy.width *= 1.3;
            enemy.height *= 1.3;
            enemy.hp *= 3;
            enemy.maxHp = enemy.hp;
            // Visuals handled in draw
        }

        this.enemies.push(enemy);
    }

    spawnBoss() {
        const hpMultiplier = 1500 * this.level;
        const sprite = this.sprites[`boss_${this.level}`];
        const width = sprite ? sprite.width : 150;
        const height = sprite ? sprite.height : 150;

        this.boss = {
            x: this.width / 2,
            y: -150,
            width: width * 0.8,
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
        this.screenShake = 20;
        this.audio.playPowerUp(); // Alarm sound-ish
    }

    updateBoss(dt: number, timeScale: number) {
        if (!this.boss) return;

        if (this.boss.y < 150) {
            this.boss.y += 1 * timeScale;
        } else {
            this.boss.x += Math.cos(Date.now() / 1000) * 2 * timeScale;
            if (Math.random() < 0.05 * timeScale) this.bossFire();
        }
    }

    bossFire() {
        if (!this.boss) return;
        const bulletsCount = 5 + (this.level * 3);
        for (let i = 0; i < bulletsCount; i++) {
            const angle = (i / bulletsCount) * Math.PI * 2 + (Date.now() / 1000);
            this.enemyBullets.push({
                x: this.boss.x,
                y: this.boss.y + this.boss.height / 4,
                width: 16,
                height: 16,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                hp: 1,
                maxHp: 1,
                type: 'bullet',
                color: '#ff0055',
                markedForDeletion: false,
                spriteKey: 'bullet_enemy'
            });
        }

        if (this.level >= 2) {
            const dx = this.player.x - this.boss.x;
            const dy = this.player.y - this.boss.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.enemyBullets.push({
                x: this.boss.x,
                y: this.boss.y + this.boss.height / 4,
                width: 20,
                height: 20,
                vx: (dx / dist) * 9,
                vy: (dy / dist) * 9,
                hp: 1,
                maxHp: 1,
                type: 'bullet',
                color: '#ffffff',
                markedForDeletion: false,
                spriteKey: 'bullet_enemy'
            });
        }
    }

    damageBoss(amount: number) {
        if (!this.boss) return;
        this.boss.hp -= amount;
        if (this.boss.hp <= 0 && !this.boss.markedForDeletion) {
            this.killBoss();
        }
    }

    updateEntities(entities: Entity[], timeScale: number, dt: number) {
        entities.forEach(e => {
            e.x += e.vx * timeScale;
            e.y += e.vy * timeScale;

            // Shuriken Bounce
            if (e.type === 'bullet' && e.spriteKey === 'bullet_shuriken') {
                if (e.x < 0 || e.x > this.width) {
                    e.vx *= -1;
                    e.x = Math.max(0, Math.min(this.width, e.x));
                }
                if (e.y < 0) {
                    e.vy *= -1;
                    e.y = 0;
                }
            }

            // Kamikaze AI
            if (e.type === 'enemy' && e.subType === 3) {
                if (e.y < this.player.y) {
                    const dx = this.player.x - e.x;
                    e.vx = (dx > 0 ? 1 : -1) * 2;
                }
            }

            // Type 5: Laser Interceptor AI
            if (e.type === 'enemy' && e.subType === 5) {
                if (e.state === 0) { // Entering
                    if (e.y > 150) {
                        e.state = 1; // Hover
                        e.vy = 0;
                        e.timer = 0;
                    }
                } else if (e.state === 1) { // Hover & Charge
                    e.timer = (e.timer || 0) + dt;
                    // Bobbing
                    e.y += Math.sin(Date.now() / 500) * 0.5 * timeScale;

                    if (e.timer > 2000) { // Fire after 2s
                        e.state = 2;
                        e.timer = 0;
                        // Fire Laser
                        this.audio.playShoot('laser');
                        this.enemyBullets.push({
                            x: e.x, y: e.y + 30, width: 10, height: 800,
                            vx: 0, vy: 20,
                            hp: 999, maxHp: 999, type: 'bullet', color: '#f0f', markedForDeletion: false, spriteKey: 'bullet_laser',
                            damage: 30
                        });
                    }
                } else if (e.state === 2) { // Cooldown / Leave
                    e.timer = (e.timer || 0) + dt;
                    if (e.timer > 1000) {
                        e.vy = 5; // Fly away
                    }
                }
            }

            // Type 6: Mine Layer AI
            if (e.type === 'enemy' && e.subType === 6) {
                e.timer = (e.timer || 0) + dt;
                if (e.timer > 1500) {
                    e.timer = 0;
                    // Drop Mine
                    this.enemyBullets.push({
                        x: e.x, y: e.y, width: 24, height: 24,
                        vx: 0, vy: 0, // Static mine
                        hp: 1, maxHp: 1, type: 'bullet', color: '#ff0', markedForDeletion: false, spriteKey: 'bullet_enemy',
                        damage: 25
                    });
                }
            }

            // Elite Gunboat Firing
            if (e.type === 'enemy' && e.subType === 4 && Math.random() < 0.02 * timeScale) {
                const dx = this.player.x - e.x;
                const dy = this.player.y - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                this.enemyBullets.push({
                    x: e.x, y: e.y + 20, width: 12, height: 12,
                    vx: (dx / dist) * 4, vy: (dy / dist) * 4,
                    hp: 1, maxHp: 1, type: 'bullet', color: '#ff0', markedForDeletion: false, spriteKey: 'bullet_enemy'
                });
            }

            // General Enemy firing (Reduced for specialized types)
            if (e.type === 'enemy' && e.subType !== 3 && e.subType !== 5 && e.subType !== 6 && Math.random() < 0.005 * timeScale) {
                this.enemyBullets.push({
                    x: e.x,
                    y: e.y + e.height / 2,
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
        // Bullets vs Enemies
        this.bullets.forEach(b => {
            this.enemies.forEach(e => {
                if (this.isColliding(b, e)) {
                    this.handleBulletHit(b, e);
                }
            });
            if (this.boss && this.isColliding(b, this.boss)) {
                this.handleBulletHit(b, this.boss);
            }
        });

        // Enemy Stuff vs Player
        [...this.enemyBullets, ...this.enemies].forEach(e => {
            if (this.isColliding(e, this.player)) {
                e.markedForDeletion = true;
                if (e.type === 'enemy') e.hp = 0;
                this.takeDamage(10);
                this.createExplosion(this.player.x, this.player.y, 'small', '#00ffff');
            }
        });

        if (this.boss && this.isColliding(this.boss, this.player)) {
            this.takeDamage(1);
        }

        // Powerups
        this.powerups.forEach(p => {
            if (this.isColliding(p, this.player)) {
                p.markedForDeletion = true;
                this.audio.playPowerUp();
                this.score += 500;
                this.onScoreChange(this.score);
                this.applyPowerup(p.subType || 0);
            }
        });
    }

    takeDamage(amount: number) {
        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) {
                this.player.hp += this.shield; // Overflow damage
                this.shield = 0;
            }
            this.screenShake = 5;
        } else {
            this.player.hp -= amount;
            this.screenShake = 10;
        }
        this.onHpChange(this.player.hp);
    }

    handleBulletHit(b: Entity, target: Entity) {
        if (this.weaponType === WeaponType.PLASMA) {
            this.createPlasmaExplosion(b.x, b.y);
            b.markedForDeletion = true;
        } else if (this.weaponType === WeaponType.WAVE || this.weaponType === WeaponType.LASER) {
            // Piercing
        } else {
            b.markedForDeletion = true;
        }

        target.hp -= (b.damage || 10);
        this.audio.playHit();

        if (target.hp <= 0 && !target.markedForDeletion) {
            if (target.type === 'boss') {
                this.killBoss();
            } else {
                this.killEnemy(target);
            }
        } else if (b.type !== 'bullet' || this.weaponType !== WeaponType.PLASMA) {
            this.createExplosion(b.x, b.y, 'small', '#ffe066');
        }
    }

    killEnemy(e: Entity) {
        e.markedForDeletion = true;
        this.score += 100 * ((e.subType || 0) + 1);
        this.onScoreChange(this.score);
        this.createExplosion(e.x, e.y, 'large', e.type === 'enemy' ? '#c53030' : '#fff');
        this.audio.playExplosion('small');

        if (Math.random() < (e.isElite ? 0.5 : 0.05)) this.spawnPowerup(e.x, e.y); // Reduced drop rate (Elite 50%, Normal 5%)
    }

    killBoss() {
        if (!this.boss) return;
        const bx = this.boss.x;
        const by = this.boss.y;

        this.createExplosion(bx, by, 'large', '#ffffff');
        this.addShockwave(bx, by);
        this.screenShake = 30;

        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                if (this.state === GameState.VICTORY) return;
                this.createExplosion(bx + (Math.random() - 0.5) * 150, by + (Math.random() - 0.5) * 150, 'large', '#fff');
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
                this.shield = 50; // Restore shield to new max
                this.onHpChange(100);
            } else {
                this.audio.playVictory();
                this.state = GameState.VICTORY;
                this.onStateChange(this.state);
            }
        }, 3000);
    }

    createPlasmaExplosion(x: number, y: number) {
        this.createExplosion(x, y, 'large', '#ed64a6');
        this.addShockwave(x, y, '#ed64a6');
        this.screenShake = 15;
        this.audio.playExplosion('large');

        const range = 100 + (this.weaponLevel * 15); // 100 -> 250
        this.enemies.forEach(e => {
            if (Math.hypot(e.x - x, e.y - y) < range) {
                e.hp -= 50;
                if (e.hp <= 0) this.killEnemy(e);
            }
        });
        this.enemyBullets.forEach(b => {
            if (Math.hypot(b.x - x, b.y - y) < range) b.markedForDeletion = true;
        });
    }

    applyPowerup(type: number) {
        // 0:Power, 1:Laser, 2:Vulcan, 3:Heal/Shield, 4:Wave, 5:Plasma, 6:Bomb, 7:Option, 8:Tesla, 9:Magma, 10:Shuriken
        switch (type) {
            case 0: // Power
                this.weaponLevel = Math.min(10, this.weaponLevel + 1);
                break;
            case 1: // Laser
                if (this.weaponType === WeaponType.LASER) this.weaponLevel = Math.min(10, this.weaponLevel + 1);
                else { this.weaponType = WeaponType.LASER; this.weaponLevel = 1; }
                break;
            case 2: // Vulcan
                if (this.weaponType === WeaponType.VULCAN) this.weaponLevel = Math.min(10, this.weaponLevel + 1);
                else { this.weaponType = WeaponType.VULCAN; this.weaponLevel = 1; }
                break;
            case 3: // Heal/Shield
                if (this.player.hp >= 100) {
                    this.shield = Math.min(50, this.shield + 25);
                } else {
                    this.player.hp = Math.min(100, this.player.hp + 30);
                    this.onHpChange(this.player.hp);
                }
                break;
            case 4: // Wave
                if (this.weaponType === WeaponType.WAVE) this.weaponLevel = Math.min(10, this.weaponLevel + 1);
                else { this.weaponType = WeaponType.WAVE; this.weaponLevel = 1; }
                break;
            case 5: // Plasma
                if (this.weaponType === WeaponType.PLASMA) this.weaponLevel = Math.min(10, this.weaponLevel + 1);
                else { this.weaponType = WeaponType.PLASMA; this.weaponLevel = 1; }
                break;
            case 6: // Bomb
                if (this.bombs < 6) {
                    this.bombs++;
                    this.onBombChange(this.bombs);
                }
                break;
            case 7: // Option
                if (this.options.length < 3) {
                    this.options.push({
                        x: this.player.x, y: this.player.y, width: 16, height: 16,
                        vx: 0, vy: 0, hp: 1, maxHp: 1, type: 'option', color: '#00ffff', markedForDeletion: false, spriteKey: 'option'
                    });
                }
                break;
            case 8: // Tesla
                if (this.weaponType === WeaponType.TESLA) this.weaponLevel = Math.min(10, this.weaponLevel + 1);
                else { this.weaponType = WeaponType.TESLA; this.weaponLevel = 1; }
                break;
            case 9: // Magma
                if (this.weaponType === WeaponType.MAGMA) this.weaponLevel = Math.min(10, this.weaponLevel + 1);
                else { this.weaponType = WeaponType.MAGMA; this.weaponLevel = 1; }
                break;
            case 10: // Shuriken
                if (this.weaponType === WeaponType.SHURIKEN) this.weaponLevel = Math.min(10, this.weaponLevel + 1);
                else { this.weaponType = WeaponType.SHURIKEN; this.weaponLevel = 1; }
                break;
        }
    }

    spawnPowerup(x: number, y: number) {
        // 0:Power, 1:Laser, 2:Vulcan, 3:Heal, 4:Wave, 5:Plasma, 6:Bomb, 7:Option, 8:Tesla, 9:Magma, 10:Shuriken
        // Weighted Random
        const r = Math.random();
        let type = 0;
        if (r < 0.15) type = 0; // Power
        else if (r < 0.25) type = 2; // Vulcan
        else if (r < 0.35) type = 1; // Laser
        else if (r < 0.45) type = 3; // Heal
        else if (r < 0.55) type = 4; // Wave
        else if (r < 0.65) type = 5; // Plasma
        else if (r < 0.75) type = 7; // Option
        else if (r < 0.80) type = 8; // Tesla
        else if (r < 0.85) type = 9; // Magma
        else if (r < 0.90) type = 10; // Shuriken
        else type = 6; // Bomb

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

    addShockwave(x: number, y: number, color: string = '#ffffff', maxRadius: number = 150, width: number = 5) {
        this.shockwaves.push({
            x, y, radius: 10, maxRadius, color, life: 1.0, width
        });
    }

    isColliding(a: Entity, b: Entity) {
        return (
            a.x - a.width / 2 < b.x + b.width / 2 &&
            a.x + a.width / 2 > b.x - b.width / 2 &&
            a.y - a.height / 2 < b.y + b.height / 2 &&
            a.y + a.height / 2 > b.y - b.height / 2
        );
    }

    draw() {
        this.ctx.save();

        if (this.screenShake > 0) {
            const sx = (Math.random() - 0.5) * this.screenShake;
            const sy = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(sx, sy);
        }

        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Dynamic Starfield - Brighter and multi-layered
        const t = Date.now() / 1000;

        // Distant stars
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 50; i++) {
            const sx = (i * 137) % this.width;
            const sy = (i * 97 + t * 20) % this.height;
            this.ctx.beginPath();
            this.ctx.rect(sx, sy, 1, 1);
            this.ctx.fill();
        }

        // Close stars
        this.ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
        for (let i = 0; i < 30; i++) {
            const speed = (i % 3) + 2;
            const sx = (i * 57) % this.width;
            const sy = (i * 31 + t * 60 * speed) % this.height;
            this.ctx.beginPath();
            this.ctx.arc(sx, sy, Math.random() * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Meteors
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.meteors.forEach(m => {
            this.ctx.beginPath();
            this.ctx.moveTo(m.x, m.y);
            this.ctx.lineTo(m.x - m.vx * 5, m.y - m.vy * 5); // Trail
            this.ctx.stroke();
        });

        if (this.state !== GameState.GAME_OVER) {
            this.drawEntity(this.player);
            // Draw Shield
            if (this.shield > 0) {
                this.ctx.save();
                this.ctx.translate(this.player.x, this.player.y);
                this.ctx.strokeStyle = `rgba(0, 255, 255, ${Math.min(1, this.shield / 50)})`;
                this.ctx.lineWidth = 3;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#00ffff';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 40, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.restore();
            }

            // Draw Options
            this.options.forEach(opt => this.drawEntity(opt));
        }

        this.powerups.forEach(p => this.drawEntity(p));
        this.enemies.forEach(e => this.drawEntity(e));
        if (this.boss) this.drawEntity(this.boss);
        this.bullets.forEach(b => this.drawEntity(b));
        this.enemyBullets.forEach(b => this.drawEntity(b));

        // Particles
        this.ctx.globalCompositeOperation = 'lighter';
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life / p.maxLife;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Shockwaves
        this.shockwaves.forEach(s => {
            this.ctx.globalAlpha = s.life;
            this.ctx.lineWidth = s.width || 5;
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
            const bankAngle = Math.max(-0.3, Math.min(0.3, (e.vx || 0) * 0.05));
            this.ctx.rotate(bankAngle);

            this.ctx.fillStyle = `rgba(0, 255, 255, ${Math.random() * 0.5 + 0.2})`;
            this.ctx.beginPath();
            this.ctx.moveTo(-5, 25);
            this.ctx.lineTo(5, 25);
            this.ctx.lineTo(0, 40 + Math.random() * 10);
            this.ctx.fill();
        }

        if (e.spriteKey === 'bullet_plasma') {
            this.ctx.rotate(Date.now() / 100);
        }

        if (e.angle) {
            this.ctx.rotate(e.angle);
        }

        if (e.spriteKey && this.sprites[e.spriteKey]) {
            const sprite = this.sprites[e.spriteKey];
            this.ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        } else {
            this.ctx.fillStyle = e.color;
            this.ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
        }

        if (e.type === 'boss') {
            this.ctx.rotate(Math.PI);
            this.ctx.fillStyle = 'rgba(255,0,0,0.5)';
            this.ctx.fillRect(-50, 0, 100, 6);
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(-50, 0, 100 * (e.hp / e.maxHp), 6);
        }

        // Elite Visual Effect
        if (e.isElite) {
            this.ctx.globalCompositeOperation = 'overlay';
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`; // Flashing Gold
            this.ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
            this.ctx.globalCompositeOperation = 'source-over';

            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(-e.width / 2, -e.height / 2, e.width, e.height);
        }
        this.ctx.restore();
    }

    loop(dt: number) {
        this.update(dt);
        this.draw();
    }
}
