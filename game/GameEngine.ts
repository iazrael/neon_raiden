import { AudioSystem } from './AudioSystem';
import { GameState, WeaponType, Particle, Shockwave, Entity } from '../types';
import { GameConfig, PlayerConfig } from './config';
import { InputSystem } from './systems/InputSystem';
import { RenderSystem } from './systems/RenderSystem';
import { WeaponSystem } from './systems/WeaponSystem';
import { EnemySystem } from './systems/EnemySystem';
import { BossSystem } from './systems/BossSystem';

export class GameEngine {
    canvas: HTMLCanvasElement;

    // Systems
    audio: AudioSystem;
    input: InputSystem;
    render: RenderSystem;
    weaponSys: WeaponSystem;
    enemySys: EnemySystem;
    bossSys: BossSystem;

    // Game State
    state: GameState = GameState.MENU;
    score: number = 0;
    level: number = 1;
    maxLevels: number = GameConfig.maxLevels;
    levelProgress: number = 0;

    // Entities
    player: Entity;
    options: Entity[] = [];
    enemies: Entity[] = [];
    bullets: Entity[] = [];
    enemyBullets: Entity[] = [];
    particles: Particle[] = [];
    shockwaves: Shockwave[] = [];
    powerups: Entity[] = [];
    meteors: { x: number, y: number, length: number, vx: number, vy: number }[] = [];
    boss: Entity | null = null;

    // Player Stats
    weaponType: WeaponType = WeaponType.VULCAN;
    weaponLevel: number = 1;
    bombs: number = PlayerConfig.initialBombs;
    shield: number = 0;

    // Timers
    enemySpawnTimer: number = 0;
    fireTimer: number = 0;
    meteorTimer: number = 0;
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
        this.onScoreChange = onScoreChange;
        this.onLevelChange = onLevelChange;
        this.onStateChange = onStateChange;
        this.onHpChange = onHpChange;
        this.onBombChange = onBombChange;

        // Initialize Systems
        this.audio = new AudioSystem();
        this.input = new InputSystem(canvas);
        this.render = new RenderSystem(canvas);
        this.weaponSys = new WeaponSystem(this.audio);
        this.enemySys = new EnemySystem(this.audio, canvas.width, canvas.height);
        this.bossSys = new BossSystem(this.audio, canvas.width, canvas.height);

        // Bind Input Actions
        this.input.onAction = (action) => {
            if (action === 'bomb_or_fire') {
                if (this.state === GameState.PLAYING) this.triggerBomb();
            } else if (action === 'touch_start') {
                if (this.state !== GameState.PLAYING) {
                    if (this.state === GameState.MENU || this.state === GameState.GAME_OVER || this.state === GameState.VICTORY) {
                        this.startGame();
                    }
                }
            }
        };

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.player = this.createPlayer();
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.render.resize(width, height);
        this.enemySys.resize(width, height);
        this.bossSys.resize(width, height);

        // Update config if needed, though config is static, systems hold dimensions
    }

    createPlayer(): Entity {
        return {
            x: this.render.width / 2,
            y: this.render.height - 100,
            width: PlayerConfig.width,
            height: PlayerConfig.height,
            vx: 0,
            vy: 0,
            hp: PlayerConfig.initialHp,
            maxHp: PlayerConfig.maxHp,
            type: 'player',
            color: PlayerConfig.color,
            markedForDeletion: false,
            spriteKey: 'player'
        };
    }

    startGame() {
        this.state = GameState.PLAYING;
        this.score = 0;
        this.level = 1;
        this.weaponLevel = 1;
        this.weaponType = WeaponType.VULCAN;
        this.bombs = PlayerConfig.initialBombs;
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
            this.addShockwave(this.render.width / 2, this.render.height / 2, '#fff', 500, 30);

            this.enemyBullets = [];
            this.enemies.forEach(e => {
                this.createExplosion(e.x, e.y, 'large', e.color);
                e.hp = 0;
                e.markedForDeletion = true;
                this.score += 100;
            });
            this.onScoreChange(this.score);

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

        // Player Movement
        const speed = PlayerConfig.speed * timeScale;
        const kb = this.input.getKeyboardVector();

        // Touch
        if (this.input.touch.active) {
            const delta = this.input.getTouchDelta();
            this.player.vx = delta.x;
            this.player.x += delta.x * 1.5;
            this.player.y += delta.y * 1.5;
        }

        // Keyboard
        if (kb.x !== 0 || kb.y !== 0) {
            this.player.x += kb.x * speed;
            this.player.y += kb.y * speed;
            this.player.vx = kb.x * speed;
        } else if (!this.input.touch.active) {
            this.player.vx *= 0.8;
        }

        // Touch Logic (Re-implemented here using InputSystem state if possible, or just hack it)
        // Since I moved the listener to InputSystem, I need to get the delta.
        // I'll assume InputSystem is "dumb" and just holds state.
        // But `touchmove` event is where delta happens.
        // I'll add a hack: direct access to `input.touch` isn't enough for delta.
        // I'll just use the `input` instance to add a listener? No.
        // I'll just use the `input.touch` position to move player towards it? No, that's absolute.
        // Original was relative.
        // I'll leave touch for a moment and focus on the rest.
        // (Self-correction: I should have designed InputSystem to return delta. I'll fix InputSystem in a follow up if needed.
        // For now, I'll assume I can access `input.touch` and if I need delta I'm stuck.
        // Actually, `InputSystem` as I wrote it doesn't expose delta.
        // I'll add `touchDelta` to `InputSystem` in a quick edit later.
        // For now, I'll proceed with `GameEngine` and assume `input.getTouchDelta()` exists and I'll add it.)

        // Boundary
        this.player.x = Math.max(32, Math.min(this.render.width - 32, this.player.x));
        this.player.y = Math.max(32, Math.min(this.render.height - 32, this.player.y));

        // Options
        this.options.forEach((opt, index) => {
            const targetAngle = (Date.now() / 1000) * 2 + (index * (Math.PI * 2 / this.options.length));
            const radius = 60;
            const tx = this.player.x + Math.cos(targetAngle) * radius;
            const ty = this.player.y + Math.sin(targetAngle) * radius;
            opt.x += (tx - opt.x) * 0.2 * timeScale;
            opt.y += (ty - opt.y) * 0.2 * timeScale;
        });

        // Fire
        this.fireTimer += dt;
        const fireRate = this.weaponSys.getFireRate(this.weaponType, this.weaponLevel);
        if (this.fireTimer > fireRate) {
            this.weaponSys.firePlayerWeapon(
                this.player, this.weaponType, this.weaponLevel,
                this.options, this.bullets, this.enemies
            );
            this.fireTimer = 0;
        }

        // Level Logic
        if (!this.boss) {
            this.levelProgress += 0.05 * timeScale;
            this.enemySpawnTimer += dt;
            // Spawn Rate from Config?
            // Config has baseSpawnRate etc.
            // let's use a formula similar to original but using config values
            // Original: max(300, 1500 - level * 200)
            // Config: baseSpawnRate: 1500, reduction: 200
            // I'll use that.
            // But I need to import EnemyConfig or just let EnemySystem handle it?
            // EnemySystem.spawnEnemy takes level.
            // I'll handle timer here.
            const spawnRate = Math.max(300, 1500 - (this.level * 200));
            if (this.enemySpawnTimer > spawnRate) {
                this.enemySys.spawnEnemy(this.level, this.enemies);
                this.enemySpawnTimer = 0;
            }

            if (this.levelProgress >= 100) {
                this.spawnBoss();
            }
        } else {
            this.bossSys.update(this.boss, dt, timeScale, this.player, this.enemyBullets, this.level);
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
        this.meteors = this.meteors.filter(m => m.y < this.render.height + 100 && m.x > -100);

        // Updates
        this.updateEntities(this.bullets, timeScale, dt);
        this.updateEntities(this.enemyBullets, timeScale, dt);
        this.enemySys.update(dt, timeScale, this.enemies, this.player, this.enemyBullets);
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
        this.enemyBullets = this.enemyBullets.filter(e => !e.markedForDeletion && e.y < this.render.height + 50 && e.x > -50 && e.x < this.render.width + 50);
        this.enemies = this.enemies.filter(e => !e.markedForDeletion && e.y < this.render.height + 100);
        this.powerups = this.powerups.filter(e => !e.markedForDeletion && e.y < this.render.height + 50);

        if (this.player.hp <= 0) {
            this.createExplosion(this.player.x, this.player.y, 'large', '#00ffff');
            this.audio.playExplosion('large');
            this.audio.playDefeat();
            this.state = GameState.GAME_OVER;
            this.onStateChange(this.state);
        }
    }

    spawnBoss() {
        this.boss = this.bossSys.spawn(this.level, this.render.sprites);
        this.screenShake = 20;
    }

    damageBoss(amount: number) {
        if (!this.boss) return;
        this.boss.hp -= amount;
        if (this.boss.hp <= 0 && !this.boss.markedForDeletion) {
            this.killBoss();
        }
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
                this.player.hp = PlayerConfig.maxHp;
                this.shield = PlayerConfig.maxShield;
                this.onHpChange(this.player.hp);
            } else {
                this.audio.playVictory();
                this.state = GameState.VICTORY;
                this.onStateChange(this.state);
            }
        }, 3000);
    }

    spawnMeteor() {
        const speed = Math.random() * 10 + 10;
        this.meteors.push({
            x: Math.random() * this.render.width,
            y: -100,
            length: Math.random() * 50 + 20,
            vx: (Math.random() - 0.5) * 5,
            vy: speed
        });
    }

    updateEntities(entities: Entity[], timeScale: number, dt: number) {
        entities.forEach(e => {
            e.x += e.vx * timeScale;
            e.y += e.vy * timeScale;

            if (e.type === 'bullet' && e.spriteKey === 'bullet_shuriken') {
                if (e.x < 0 || e.x > this.render.width) {
                    e.vx *= -1;
                    e.x = Math.max(0, Math.min(this.render.width, e.x));
                }
                if (e.y < 0) {
                    e.vy *= -1;
                    e.y = 0;
                }
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
                this.player.hp += this.shield;
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

        if (Math.random() < (e.isElite ? 0.5 : 0.05)) this.spawnPowerup(e.x, e.y);
    }

    createPlasmaExplosion(x: number, y: number) {
        this.createExplosion(x, y, 'large', '#ed64a6');
        this.addShockwave(x, y, '#ed64a6');
        this.screenShake = 15;
        this.audio.playExplosion('large');

        const range = 100 + (this.weaponLevel * 15);
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
        switch (type) {
            case 0: this.weaponLevel = Math.min(10, this.weaponLevel + 1); break;
            case 1: if (this.weaponType === WeaponType.LASER) this.weaponLevel = Math.min(10, this.weaponLevel + 1); else { this.weaponType = WeaponType.LASER; this.weaponLevel = 1; } break;
            case 2: if (this.weaponType === WeaponType.VULCAN) this.weaponLevel = Math.min(10, this.weaponLevel + 1); else { this.weaponType = WeaponType.VULCAN; this.weaponLevel = 1; } break;
            case 3: if (this.player.hp >= 100) { this.shield = Math.min(50, this.shield + 25); } else { this.player.hp = Math.min(100, this.player.hp + 30); this.onHpChange(this.player.hp); } break;
            case 4: if (this.weaponType === WeaponType.WAVE) this.weaponLevel = Math.min(10, this.weaponLevel + 1); else { this.weaponType = WeaponType.WAVE; this.weaponLevel = 1; } break;
            case 5: if (this.weaponType === WeaponType.PLASMA) this.weaponLevel = Math.min(10, this.weaponLevel + 1); else { this.weaponType = WeaponType.PLASMA; this.weaponLevel = 1; } break;
            case 6: if (this.bombs < 6) { this.bombs++; this.onBombChange(this.bombs); } break;
            case 7: if (this.options.length < 3) { this.options.push({ x: this.player.x, y: this.player.y, width: 16, height: 16, vx: 0, vy: 0, hp: 1, maxHp: 1, type: 'option', color: '#00ffff', markedForDeletion: false, spriteKey: 'option' }); } break;
            case 8: if (this.weaponType === WeaponType.TESLA) this.weaponLevel = Math.min(10, this.weaponLevel + 1); else { this.weaponType = WeaponType.TESLA; this.weaponLevel = 1; } break;
            case 9: if (this.weaponType === WeaponType.MAGMA) this.weaponLevel = Math.min(10, this.weaponLevel + 1); else { this.weaponType = WeaponType.MAGMA; this.weaponLevel = 1; } break;
            case 10: if (this.weaponType === WeaponType.SHURIKEN) this.weaponLevel = Math.min(10, this.weaponLevel + 1); else { this.weaponType = WeaponType.SHURIKEN; this.weaponLevel = 1; } break;
        }
    }

    spawnPowerup(x: number, y: number) {
        const r = Math.random();
        let type = 0;
        if (r < 0.15) type = 0;
        else if (r < 0.25) type = 2;
        else if (r < 0.35) type = 1;
        else if (r < 0.45) type = 3;
        else if (r < 0.55) type = 4;
        else if (r < 0.65) type = 5;
        else if (r < 0.75) type = 7;
        else if (r < 0.80) type = 8;
        else if (r < 0.85) type = 9;
        else if (r < 0.90) type = 10;
        else type = 6;

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
        this.render.draw(
            this.state,
            this.player,
            this.options,
            this.enemies,
            this.boss,
            this.bullets,
            this.enemyBullets,
            this.particles,
            this.shockwaves,
            this.powerups,
            this.meteors,
            this.shield,
            this.screenShake
        );
    }

    loop(dt: number) {
        this.update(dt);
        this.draw();
    }
}
