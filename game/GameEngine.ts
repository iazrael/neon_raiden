import { AudioSystem } from './AudioSystem';
import { GameState, WeaponType, Particle, Shockwave, Entity, PowerupType, BossType, EnemyType, EntityType } from '@/types';
import { GameConfig, PlayerConfig, BossSpawnConfig, selectPowerupType, PowerupEffects, PowerupDropConfig, BossConfig, EnemyConfig } from './config';
import { InputSystem } from './systems/InputSystem';
import { RenderSystem } from './systems/RenderSystem';
import { WeaponSystem } from './systems/WeaponSystem';
import { EnemySystem } from './systems/EnemySystem';
import { BossSystem } from './systems/BossSystem';
import { unlockWeapon, unlockEnemy, unlockBoss } from './unlockedItems';

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
    maxLevelReached: number = 1;

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
    bossWingmen: Entity[] = [];

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
    bossTransitionTimer: number = 0;
    levelStartTime: number = 0; // Track when level started

    // Level transition
    showLevelTransition: boolean = false;
    isLevelTransitioning: boolean = false; // Flag to prevent actions during transition
    levelTransitionTimer: number = 0;

    // Callbacks
    onScoreChange: (score: number) => void;
    onLevelChange: (level: number) => void;
    onStateChange: (state: GameState) => void;
    onHpChange: (hp: number) => void;
    onBombChange: (bombs: number) => void;
    onMaxLevelChange: (level: number) => void;

    constructor(
        canvas: HTMLCanvasElement,
        onScoreChange: (s: number) => void,
        onLevelChange: (l: number) => void,
        onStateChange: (s: GameState) => void,
        onHpChange: (hp: number) => void,
        onBombChange: (bombs: number) => void,
        onMaxLevelChange: (level: number) => void
    ) {
        this.canvas = canvas;
        this.onScoreChange = onScoreChange;
        this.onLevelChange = onLevelChange;
        this.onStateChange = onStateChange;
        this.onHpChange = onHpChange;
        this.onBombChange = onBombChange;
        this.onMaxLevelChange = onMaxLevelChange;

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
                // Removed auto-start on touch. Game now only starts via UI button.
            }
        };

        this.input.onMouseMove = (x, y) => {
            if (this.state === GameState.PLAYING) {
                this.player.x = x;
                this.player.y = y;
            }
        };

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.player = this.createPlayer();

        // Load progress
        const savedMaxLevel = localStorage.getItem('neon_raiden_max_level');
        if (savedMaxLevel) {
            this.maxLevelReached = parseInt(savedMaxLevel, 10);
        }
        // Notify initial max level
        setTimeout(() => this.onMaxLevelChange(this.maxLevelReached), 0);

        // Ensure first weapon is always available
        unlockWeapon(WeaponType.VULCAN);
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
            width: PlayerConfig.size.width,
            height: PlayerConfig.size.height,
            vx: 0,
            vy: 0,
            hp: PlayerConfig.initialHp,
            maxHp: PlayerConfig.maxHp,
            type: EntityType.PLAYER,
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
        this.bossWingmen = [];
        this.levelProgress = 0;
        this.screenShake = 0;
        this.showLevelTransition = false;
        this.isLevelTransitioning = false;
        this.levelTransitionTimer = 0;
        this.bossTransitionTimer = 0;
        this.levelStartTime = Date.now(); // Initialize level start time
        this.audio.resume();

        this.onStateChange(this.state);
        this.onScoreChange(this.score);
        this.onLevelChange(this.level);
        this.onHpChange(100);
        this.onBombChange(this.bombs);
    }

    triggerBomb(targetX?: number, targetY?: number) {
        if (this.bombs > 0 && this.state === GameState.PLAYING && this.player.hp > 0) {
            this.bombs--;
            this.onBombChange(this.bombs);

            // Jump to target position if provided
            if (targetX !== undefined && targetY !== undefined) {
                this.player.x = Math.max(32, Math.min(this.render.width - 32, targetX));
                this.player.y = Math.max(32, Math.min(this.render.height - 32, targetY));
                // Reset velocity
                this.player.vx = 0;
                this.player.vy = 0;
            }

            this.audio.playBomb();
            this.screenShake = 40;
            this.addShockwave(this.render.width / 2, this.render.height / 2, '#fff', 500, 30);

            this.enemyBullets = [];
            this.enemies.forEach(e => {
                this.createExplosion(e.x, e.y, 'large', e.color);
                e.hp = 0;
                e.markedForDeletion = true;
                this.score += EnemyConfig[e.subType]?.score || 100;
            });
            this.onScoreChange(this.score);

            if (this.boss) {
                this.damageBoss(500);
            }
        }
    }

    pause() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            // Suspend audio context to stop all sounds
            this.audio.pause();
        }
    }

    resume() {
        if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
            // Resume audio context
            this.audio.resume();
        }
    }

    stop() {
        this.state = GameState.GAME_OVER;
        this.audio.pause();
        this.onStateChange(this.state);
    }

    update(dt: number) {
        if (this.state !== GameState.PLAYING) return;

        const timeScale = dt / 16.66;

        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }

        // Level transition UI
        if (this.showLevelTransition) {
            this.levelTransitionTimer += dt;
            if (this.levelTransitionTimer > 1500) { // Reduced from 3000ms
                this.showLevelTransition = false;
                this.levelTransitionTimer = 0;
            }
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
            const spawnRate = Math.max(300, 1500 - (this.level * 200));
            if (this.enemySpawnTimer > spawnRate) {
                this.enemySys.spawnEnemy(this.level, this.enemies);
                this.enemySpawnTimer = 0;
            }

            // Spawn boss when both conditions are met:
            // 1. Level progress >= 90%
            // 2. Minimum level duration has passed (60 seconds)
            // 3. Not currently transitioning levels
            const levelDuration = (Date.now() - this.levelStartTime) / 1000; // in seconds
            const minDuration = BossSpawnConfig.minLevelDuration;
            const minProgress = BossSpawnConfig.minLevelProgress;
            if (this.levelProgress >= minProgress && levelDuration >= minDuration && !this.isLevelTransitioning) {
                this.spawnBoss();
            }
        } else {
            // Continue spawning enemies for a short time after boss appears
            if (this.bossTransitionTimer < 10000) {
                this.bossTransitionTimer += dt;
                this.enemySpawnTimer += dt;
                const spawnRate = Math.max(800, 2000 - (this.level * 150));
                if (this.enemySpawnTimer > spawnRate) {
                    this.enemySys.spawnEnemy(this.level, this.enemies);
                    this.enemySpawnTimer = 0;
                }
            }

            this.bossSys.update(this.boss, dt, timeScale, this.player, this.enemyBullets, this.level);

            // Update wingmen
            this.bossWingmen.forEach(wingman => {
                wingman.x = this.boss!.x + (wingman.x - this.boss!.x) * 0.95;
                wingman.y = this.boss!.y + 80;
            });
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

        // Update enemy bullets with homing logic
        this.enemyBullets.forEach(b => {
            b.x += b.vx * timeScale;
            b.y += b.vy * timeScale;

            // Homing missile AI
            if (b.state === 1) {
                const dx = this.player.x - b.x;
                const dy = this.player.y - b.y;
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

            // Laser timer countdown
            if (b.timer !== undefined) {
                b.timer -= dt;
                if (b.timer <= 0) {
                    b.markedForDeletion = true;
                }
            }
        });

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
        this.bossWingmen = this.bossWingmen.filter(e => !e.markedForDeletion);
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
        this.bossWingmen = this.bossSys.spawnWingmen(this.level, this.boss, this.render.sprites);
        this.screenShake = 20;
        this.bossTransitionTimer = 0;
    }

    damageBoss(amount: number) {
        if (!this.boss) return;

        // Boss can only take damage if all wingmen are destroyed
        if (this.bossWingmen.length > 0) {
            return;
        }

        this.boss.hp -= amount;
        if (this.boss.hp <= 0 && !this.boss.markedForDeletion) {
            this.killBoss();
        }
    }

    killBoss() {
        if (!this.boss) return;
        const bx = this.boss.x;
        const by = this.boss.y;
        const bossLevel = this.level;

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
        this.score += BossConfig[this.boss.subType]?.score || (5000 * this.level);
        this.onScoreChange(this.score);

        // Unlock boss when defeated
        unlockBoss(bossLevel);

        this.boss = null;
        this.bossWingmen = [];
        this.isLevelTransitioning = true; // Block new boss spawns

        setTimeout(() => {
            if (this.level < this.maxLevels) {
                this.level++;
                this.levelProgress = 0;
                this.levelStartTime = Date.now(); // Reset level start time for new level
                this.enemySpawnTimer = 0; // Reset enemy spawn timer
                this.onLevelChange(this.level);

                if (this.level > this.maxLevelReached) {
                    this.maxLevelReached = this.level;
                    localStorage.setItem('neon_raiden_max_level', this.maxLevelReached.toString());
                    this.onMaxLevelChange(this.maxLevelReached);
                }

                this.player.hp = PlayerConfig.maxHp;
                this.shield = PlayerConfig.maxShield;
                this.onHpChange(this.player.hp);

                // Show level transition UI
                this.showLevelTransition = true;
                this.levelTransitionTimer = 0;
                this.isLevelTransitioning = false; // Allow spawns again (though level progress is 0)
            } else {
                this.audio.playVictory();
                this.state = GameState.VICTORY;
                this.onStateChange(this.state);
                this.isLevelTransitioning = false;
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

            // Bullets vs Wingmen
            this.bossWingmen.forEach(wingman => {
                if (this.isColliding(b, wingman)) {
                    this.handleBulletHit(b, wingman);
                }
            });

            if (this.boss && this.isColliding(b, this.boss)) {
                this.handleBulletHit(b, this.boss);
            }
        });

        // Enemy Stuff vs Player
        [...this.enemyBullets, ...this.enemies, ...this.bossWingmen].forEach(e => {
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
                this.score += 100;
                this.onScoreChange(this.score);
                this.applyPowerup(p.subType as PowerupType);
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
        this.score += EnemyConfig[e.subType]?.score || 100;
        this.onScoreChange(this.score);
        this.createExplosion(e.x, e.y, 'large', e.type === 'enemy' ? '#c53030' : '#fff');
        this.audio.playExplosion('small');

        // Unlock enemy when defeated
        if (e.subType !== undefined) {
            unlockEnemy(e.subType as EnemyType);
        }

        const dropRate = e.isElite ? PowerupDropConfig.elitePowerupDropRate : PowerupDropConfig.normalPowerupDropRate;
        if (Math.random() < dropRate) this.spawnPowerup(e.x, e.y);
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

    applyPowerup(type: PowerupType) {
        const effects = PowerupEffects;

        switch (type) {
            case PowerupType.POWER:
                // Generic power upgrade for current weapon
                this.weaponLevel = Math.min(effects.maxWeaponLevel, this.weaponLevel + 1);
                break;

            case PowerupType.HP:
                // HP restoration
                if (this.player.hp >= 100) {
                    this.shield = Math.min(PlayerConfig.maxShield, this.shield + effects.shieldRestoreAmount);
                } else {
                    this.player.hp = Math.min(PlayerConfig.maxHp, this.player.hp + effects.hpRestoreAmount);
                    this.onHpChange(this.player.hp);
                }
                break;

            case PowerupType.BOMB:
                // Bomb pickup
                if (this.bombs < effects.maxBombs) {
                    this.bombs++;
                    this.onBombChange(this.bombs);
                }
                break;

            case PowerupType.OPTION:
                // Option/僚机 pickup
                if (this.options.length < effects.maxOptions) {
                    this.options.push({
                        x: this.player.x,
                        y: this.player.y,
                        width: 16,
                        height: 16,
                        vx: 0,
                        vy: 0,
                        hp: 1,
                        maxHp: 1,
                        type: EntityType.OPTION,
                        color: '#00ffff',
                        markedForDeletion: false,
                        spriteKey: 'option'
                    });
                }
                break;

            default:
                // Weapon-specific powerups
                const weaponType = effects.weaponTypeMap[type];
                if (weaponType !== undefined && weaponType !== null) {
                    // Unlock weapon when picked up
                    unlockWeapon(weaponType);

                    if (this.weaponType === weaponType) {
                        // Same weapon type - upgrade level
                        this.weaponLevel = Math.min(effects.maxWeaponLevel, this.weaponLevel + 1);
                    } else {
                        // Different weapon type - switch weapon
                        this.weaponType = weaponType;
                        this.weaponLevel = 1;
                    }
                }
                break;
        }
    }

    spawnPowerup(x: number, y: number) {
        const type = selectPowerupType();

        this.powerups.push({
            x, y, width: 30, height: 30, vx: 0, vy: 2, hp: 1, maxHp: 1,
            type: EntityType.POWERUP, subType: type, color: '#fff', markedForDeletion: false,
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
            this.bossWingmen,
            this.bullets,
            this.enemyBullets,
            this.particles,
            this.shockwaves,
            this.powerups,
            this.meteors,
            this.shield,
            this.screenShake,
            this.weaponLevel
        );
    }

    loop(dt: number) {
        this.update(dt);
        this.draw();
    }
}
