import { AudioSystem } from './systems/AudioSystem';
import { GameState, WeaponType, Particle, Shockwave, Entity, PowerupType, BossType, EnemyType, EntityType, ExplosionSize, FighterEntity } from '@/types';
import { GameConfig, PlayerConfig, BossSpawnConfig, selectPowerupType, PowerupEffects, PowerupDropConfig, BossConfig, EnemyConfig, EnemyCommonConfig, resetDropContext, validatePowerupVisuals, WeaponConfig, WeaponUpgradeConfig } from './config';
import { InputSystem } from './systems/InputSystem';
import { RenderSystem } from './systems/RenderSystem';
import { WeaponSystem } from './systems/WeaponSystem';
import { EnemySystem } from './systems/EnemySystem';
import { BossSystem } from './systems/BossSystem';
import { ComboSystem, ComboState } from './systems/ComboSystem';
import { WeaponSynergySystem, SynergyTriggerContext, SynergyType, CombatEventType, SynergyEffectType, SynergyConfig } from './systems/WeaponSynergySystem';
import { BossPhaseSystem } from './systems/BossPhaseSystem';
import { DifficultySystem, DifficultyConfig } from './systems/DifficultySystem';
import { EliteAISystem } from './systems/EliteAISystem';
import { unlockWeapon, unlockEnemy, unlockBoss } from './unlockedItems';
import { CombatTag } from './utils/CombatTag';
import { World, createWorld, snapshot } from './world';
import { snapshot$ } from './store';

export class GameEngine {
    canvas: HTMLCanvasElement;
    world: World;

    // Systems
    audio: AudioSystem;
    input: InputSystem;
    render: RenderSystem;
    weaponSys: WeaponSystem;
    enemySys: EnemySystem;
    bossSys: BossSystem;
    comboSys: ComboSystem;
    synergySys: WeaponSynergySystem;
    bossPhaseSys: BossPhaseSystem;
    difficultySys: DifficultySystem;
    eliteAISys: EliteAISystem;
    tagSys: CombatTag;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.world = createWorld(canvas.width, canvas.height);

        // Initialize Systems
        this.audio = new AudioSystem();
        this.input = new InputSystem(canvas);
        this.render = new RenderSystem(canvas);
        this.weaponSys = new WeaponSystem(this.audio);
        this.enemySys = new EnemySystem(this.audio, canvas.width, canvas.height);
        this.bossSys = new BossSystem(this.audio, canvas.width, canvas.height, this.difficultySys); // difficultySys is undefined here!
        // Wait, difficultySys needs to be initialized before bossSys?
        // In original code:
        // this.bossSys = new BossSystem(..., this.difficultySys);
        // this.difficultySys = new DifficultySystem();
        // This means bossSys received undefined! That's a bug in original code or JS hoisting?
        // JS classes don't hoist property initialization like that if they are in constructor.
        // In original code:
        // this.bossSys = new BossSystem(..., this.difficultySys);
        // this.difficultySys = new DifficultySystem();
        // Yes, this.difficultySys was undefined when passed to BossSystem.
        // I should fix this order.

        this.comboSys = new ComboSystem(undefined, (state) => {
            this.world.comboState = state;
        });
        this.synergySys = new WeaponSynergySystem();
        this.bossPhaseSys = new BossPhaseSystem(this.audio);
        this.difficultySys = new DifficultySystem();
        // Re-initialize BossSystem with valid difficultySys if needed, or fix order.
        // I'll fix the order.

        this.eliteAISys = new EliteAISystem(canvas.width, canvas.height);
        this.tagSys = new CombatTag();

        // Fix order:
        this.difficultySys = new DifficultySystem();
        this.bossSys = new BossSystem(this.audio, canvas.width, canvas.height, this.difficultySys);

        // Bind Input Actions
        this.input.onAction = (action) => {
            if (action === 'bomb_or_fire') {
                if (this.world.state === GameState.PLAYING) this.triggerBomb();
            } else if (action === 'touch_start') {
                // Removed auto-start on touch.
            }
        };

        this.input.onMouseMove = (x, y) => {
            if (this.world.state === GameState.PLAYING && this.world.player) {
                this.world.player.x = x;
                this.world.player.y = y;
            }
        };

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Load progress
        const savedMaxLevel = localStorage.getItem('neon_raiden_max_level');
        if (savedMaxLevel) {
            this.world.maxLevelReached = parseInt(savedMaxLevel, 10);
        }

        // Ensure first weapon is always available
        unlockWeapon(WeaponType.VULCAN);
        validatePowerupVisuals(Object.values(PowerupType));

        // Emit initial snapshot
        snapshot$.next(snapshot(this.world));
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.render.resize(width, height);
        this.enemySys.resize(width, height);
        this.bossSys.resize(width, height);
        this.eliteAISys.resize(width, height);
    }

    startGame() {
        // Reset world but keep some persistent state if needed?
        // Original startGame reset everything including score, level, etc.
        // It kept maxLevelReached (which is loaded in constructor).
        // So we can just create a new world, but we need to preserve maxLevelReached.
        const maxLevel = this.world.maxLevelReached;
        this.world = createWorld(this.render.width, this.render.height);
        this.world.maxLevelReached = maxLevel;

        this.world.state = GameState.PLAYING;
        this.world.levelStartTime = Date.now();
        this.audio.resume();

        this.world.debugModeEnabled = GameConfig.debug;
        this.world.debugEnemyKillCount = 0;

        this.comboSys.reset();
        this.synergySys.reset();
        this.difficultySys.reset();

        snapshot$.next(snapshot(this.world));
    }

    triggerBomb(targetX?: number, targetY?: number) {
        if (this.world.bombs > 0 && this.world.state === GameState.PLAYING && this.world.player.hp > 0) {
            this.world.bombs--;

            if (targetX !== undefined && targetY !== undefined) {
                this.world.player.x = Math.max(32, Math.min(this.render.width - 32, targetX));
                this.world.player.y = Math.max(32, Math.min(this.render.height - 32, targetY));
                this.world.player.vx = 0;
                this.world.player.vy = 0;
            }

            this.audio.playBomb();
            this.world.screenShake = 40;
            this.addShockwave(this.render.width / 2, this.render.height / 2, '#fff', 500, 30);

            this.world.enemyBullets = [];
            this.world.enemies.forEach(e => {
                this.createExplosion(e.x, e.y, ExplosionSize.LARGE, e.color);
                e.hp -= PowerupEffects.bombDamage;
                if (e.hp <= 0) {
                    this.killEnemy(e);
                }
            });

            if (this.world.boss) {
                const damage = this.world.boss.maxHp * PowerupEffects.bombDamageToBossPct;
                this.damageBoss(damage);
            }
        }
    }

    pause() {
        if (this.world.state === GameState.PLAYING) {
            this.world.state = GameState.PAUSED;
            this.audio.pause();
            snapshot$.next(snapshot(this.world));
        }
    }

    resume() {
        if (this.world.state === GameState.PAUSED) {
            this.world.state = GameState.PLAYING;
            this.audio.resume();
            snapshot$.next(snapshot(this.world));
        }
    }

    stop() {
        this.world.state = GameState.GAME_OVER;
        this.audio.pause();
        snapshot$.next(snapshot(this.world));
    }

    update(dt: number) {
        if (this.world.state !== GameState.PLAYING) return;

        // Handle Time Slow
        if (this.world.timeSlowActive) {
            this.world.timeSlowTimer -= dt;
            if (this.world.timeSlowTimer <= 0) {
                this.world.timeSlowActive = false;
            }
            dt *= 0.5;
        }

        const timeScale = dt / 16.66;
        const playerTimeScale = this.world.timeSlowActive ? timeScale * 2 : timeScale;

        // Handle Shield Timer & Audio
        if (this.world.player.invulnerable && this.world.player.invulnerableTimer && this.world.player.invulnerableTimer > 0) {
            this.world.player.invulnerableTimer -= (this.world.timeSlowActive ? dt * 2 : dt);
            this.audio.playShieldLoop();

            if (this.world.player.invulnerableTimer <= 0) {
                this.world.player.invulnerable = false;
                this.world.player.invulnerableTimer = 0;
                this.audio.stopShieldLoop();
            }
        } else if (this.world.player.invulnerable && (!this.world.player.invulnerableTimer || this.world.player.invulnerableTimer <= 0)) {
            this.world.player.invulnerable = false;
            this.audio.stopShieldLoop();
        }

        // Handle Shield Regen Timer
        if (this.world.shieldRegenTimer > 0) {
            this.world.shieldRegenTimer -= dt;
            if (this.world.shieldRegenTimer < 0) {
                this.world.shieldRegenTimer = 0;
            }
        }

        // Update combo timer
        this.comboSys.update(dt);
        this.world.comboState = this.comboSys.getState();

        if (this.world.screenShake > 0) {
            this.world.screenShake *= 0.9;
            if (this.world.screenShake < 0.5) this.world.screenShake = 0;
        }

        // Level transition UI
        if (this.world.showLevelTransition) {
            this.world.levelTransitionTimer += dt;
            if (this.world.levelTransitionTimer > 1500) {
                this.world.showLevelTransition = false;
                this.world.levelTransitionTimer = 0;
            }
        }

        // Boss Defeat Animation
        if (this.world.showBossDefeatAnimation) {
            this.world.bossDefeatTimer -= dt;
            if (this.world.bossDefeatTimer <= 0) {
                this.world.showBossDefeatAnimation = false;
            }
        }

        // Player Movement
        let speed = this.world.playerConfig.speed * playerTimeScale * (this.world.playerSpeedBoostTimer > 0 ? 1.1 : 1.0);

        const kb = this.input.getKeyboardVector();

        // Touch
        if (this.input.touch.active) {
            const delta = this.input.getTouchDelta();
            this.world.player.vx = delta.x;
            this.world.player.x += delta.x * 1.5;
            this.world.player.y += delta.y * 1.5;
        }

        // Keyboard
        if (kb.x !== 0 || kb.y !== 0) {
            this.world.player.x += kb.x * speed;
            this.world.player.y += kb.y * speed;
            this.world.player.vx = kb.x * speed;
        } else if (!this.input.touch.active) {
            this.world.player.vx *= 0.8;
        }

        // Boundary
        this.world.player.x = Math.max(32, Math.min(this.render.width - 32, this.world.player.x));
        this.world.player.y = Math.max(32, Math.min(this.render.height - 32, this.world.player.y));

        // Options
        this.world.options.forEach((opt, index) => {
            const targetAngle = (Date.now() / 1000) * 2 + (index * (Math.PI * 2 / this.world.options.length));
            const radius = 60;
            const tx = this.world.player.x + Math.cos(targetAngle) * radius;
            const ty = this.world.player.y + Math.sin(targetAngle) * radius;
            opt.x += (tx - opt.x) * 0.2 * timeScale;
            opt.y += (ty - opt.y) * 0.2 * timeScale;
        });

        // Fire
        this.world.fireTimer += (this.world.timeSlowActive ? dt * 2 : dt);
        const baseFireRate = this.weaponSys.getFireRate(this.world.weaponType, this.world.weaponLevel);
        const fireRate = Math.max(50, Math.round(baseFireRate * (1 - this.world.playerFireRateBonusPct)));
        if (this.world.fireTimer > fireRate) {
            const isMissileVulcan = this.synergySys.isSynergyActive(SynergyType.MISSILE_VULCAN);
            if (isMissileVulcan) {
                this.weaponSys.firePlayerWeapon(
                    this.world.player, WeaponType.VULCAN, this.world.weaponLevel,
                    this.world.options, this.world.bullets, this.world.enemies
                );
                this.weaponSys.firePlayerWeapon(
                    this.world.player, WeaponType.MISSILE, 1,
                    [], this.world.bullets, this.world.enemies
                );
                this.world.fireTimer = 0;
            } else {
                const canAlt = this.world.alternateFireEnabled && this.world.secondaryWeapon && this.synergySys.canCombine(this.world.weaponType, this.world.secondaryWeapon);
                const fireType = canAlt ? (this.world.fireAlternateToggle ? this.world.secondaryWeapon! : this.world.weaponType) : this.world.weaponType;
                this.weaponSys.firePlayerWeapon(
                    this.world.player, fireType, this.world.weaponLevel,
                    this.world.options, this.world.bullets, this.world.enemies
                );
                if (canAlt) this.world.fireAlternateToggle = !this.world.fireAlternateToggle;
                this.world.fireTimer = 0;
            }
        }

        // Level Logic
        if (!this.world.boss) {
            this.world.levelProgress += 0.05 * timeScale;
            this.world.enemySpawnTimer += dt;

            const difficultyConfig = this.difficultySys.getConfig();
            const baseSpawnRate = EnemyCommonConfig.enemySpawnIntervalByLevel[this.world.level] || 1000;
            const spawnRate = Math.round(baseSpawnRate * difficultyConfig.spawnIntervalMultiplier);

            if (this.world.enemySpawnTimer > spawnRate) {
                const baseEliteChance = EnemyCommonConfig.eliteChance;
                const eliteMod = this.difficultySys.getEliteChanceModifier();
                const effectiveEliteChance = Math.max(0, Math.min(1, baseEliteChance + eliteMod));
                this.enemySys.spawnEnemy(this.world.level, this.world.enemies, effectiveEliteChance);

                const newEnemy = this.world.enemies[this.world.enemies.length - 1];
                if (newEnemy && newEnemy.isElite) {
                    this.eliteAISys.initializeElite(newEnemy, this.world.enemies);
                }

                if (newEnemy) {
                    newEnemy.hp *= difficultyConfig.enemyHpMultiplier;
                    newEnemy.maxHp = newEnemy.hp;
                    newEnemy.vy *= difficultyConfig.enemySpeedMultiplier;
                    if (newEnemy.vx !== 0) {
                        newEnemy.vx *= difficultyConfig.enemySpeedMultiplier;
                    }
                }

                this.world.enemySpawnTimer = 0;
            }

            const levelDuration = (Date.now() - this.world.levelStartTime) / 1000;
            const minDuration = BossSpawnConfig.minLevelDuration;
            const minProgress = BossSpawnConfig.minLevelProgress;

            if (this.world.debugModeEnabled) {
                if (levelDuration >= 10 && this.world.debugEnemyKillCount >= 10 && !this.world.isLevelTransitioning) {
                    if (!this.world.isBossWarningActive) {
                        this.world.isBossWarningActive = true;
                        this.world.bossWarningTimer = 3000;
                        this.audio.playWarning();
                        this.spawnBoss();
                    }
                }
            } else if (this.world.levelProgress >= minProgress && levelDuration >= minDuration && !this.world.isLevelTransitioning) {
                if (!this.world.isBossWarningActive) {
                    this.world.isBossWarningActive = true;
                    this.world.bossWarningTimer = 3000;
                    this.audio.playWarning();
                    this.spawnBoss();
                }
            }
        } else {
            this.world.enemySpawnTimer += dt;
            const spawnRate = Math.round((EnemyCommonConfig.enemySpawnIntervalByLevel[this.world.level] || 1000) * EnemyCommonConfig.enemySpawnIntervalInBossMultiplier);
            if (this.world.enemySpawnTimer > spawnRate) {
                const baseEliteChance = EnemyCommonConfig.eliteChance;
                const eliteMod = this.difficultySys.getEliteChanceModifier();
                const bossFactor = EnemyCommonConfig.eliteChanceBossMultiplier ?? 1.0;
                const effectiveEliteChance = Math.max(0, Math.min(1, (baseEliteChance + eliteMod) * bossFactor));
                this.enemySys.spawnEnemy(this.world.level, this.world.enemies, effectiveEliteChance);
                this.world.enemySpawnTimer = 0;
            }

            this.bossSys.update(this.world.boss, dt, timeScale, this.world.player, this.world.enemyBullets, this.world.level);
            this.bossPhaseSys.update(this.world.boss, dt);

            this.world.bossWingmen.forEach(wingman => {
                wingman.x = this.world.boss!.x + (wingman.x - this.world.boss!.x) * 0.95;
                wingman.y = this.world.boss!.y + 80;
            });
        }

        if (this.world.isBossWarningActive) {
            this.world.bossWarningTimer -= dt;
            if (this.world.bossWarningTimer <= 0) {
                this.world.isBossWarningActive = false;
            }
        }

        // Meteors
        this.world.meteorTimer += dt;
        if (this.world.meteorTimer > 200) {
            if (Math.random() < 0.1) this.spawnMeteor();
            this.world.meteorTimer = 0;
        }
        this.world.meteors.forEach(m => {
            m.x += m.vx * timeScale;
            m.y += m.vy * timeScale;
        });
        this.world.meteors = this.world.meteors.filter(m => m.y < this.render.height + 100 && m.x > -100);

        this.updateEntities(this.world.bullets, timeScale, dt);
        this.updateBulletsProp(dt);
        this.updateEnemyBullets(timeScale, dt);

        this.enemySys.update(dt, timeScale, this.world.enemies, this.world.player, this.world.enemyBullets);

        // Slow fields
        if (this.world.slowFields.length > 0) {
            this.world.enemies.forEach(e => {
                const inSlow = this.world.slowFields.some(s => Math.hypot(e.x - s.x, e.y - s.y) < s.range);
                if (inSlow) {
                    e.vx *= 0.8;
                    e.vy *= 0.8;
                    e.slowed = true;
                } else {
                    e.slowed = false;
                }
            });
        }

        // Burn DOT
        this.world.enemies.forEach(e => {
            if (this.tagSys.hasTag(e, 'burn_dot')) {
                e.hp -= (5 * dt / 1000);
                if (e.hp <= 0 && !e.markedForDeletion) this.killEnemy(e);
            }
        });

        // Difficulty System
        const currentWeapons = this.getPlayerWeapons();
        this.difficultySys.update(dt, this.world.player, currentWeapons, this.world.comboState.count, this.world.level);

        // Regen
        this.world.regenTimer += dt;
        const comboLevel = this.world.comboState.level;
        let regenAmount = 0;
        if (this.synergySys.isSynergyActive(SynergyType.MAGMA_SHURIKEN)) {
            if (comboLevel >= 4) regenAmount = 3;
            else if (comboLevel >= 3) regenAmount = 2;
            else if (comboLevel >= 2) regenAmount = 1;
        }
        if (this.world.regenTimer >= 1000 && regenAmount > 0 && this.world.player.hp > 0 && this.world.player.hp < this.world.player.maxHp) {
            this.world.player.hp = Math.min(this.world.player.maxHp, this.world.player.hp + regenAmount);
            this.world.regenTimer = 0;
        }

        // Elite AI
        this.world.enemies.forEach(enemy => {
            if (enemy.isElite) {
                this.eliteAISys.update(enemy, dt, this.world.enemies, this.world.enemyBullets, this.world.player);
            }
        });

        this.updateEntities(this.world.powerups, timeScale, dt);

        // Particles
        this.world.particles.forEach(p => {
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            p.life -= dt;
        });
        this.world.particles = this.world.particles.filter(p => p.life > 0);

        // Shockwaves
        this.world.shockwaves.forEach(s => {
            s.radius += (s.maxRadius - s.radius) * 0.1 * timeScale;
            s.life -= 0.02 * timeScale;
        });
        this.world.shockwaves = this.world.shockwaves.filter(s => s.life > 0);

        this.world.plasmaExplosions.forEach(p => {
            p.life -= dt;
        });
        this.world.plasmaExplosions = this.world.plasmaExplosions.filter(p => p.life > 0);
        this.world.slowFields.forEach(s => { s.life -= dt; });
        this.world.slowFields = this.world.slowFields.filter(s => s.life > 0);

        this.checkCollisions();

        // Cleanup missile tracking
        this.world.bullets.forEach(b => {
            if (b.markedForDeletion && b.weaponType === WeaponType.MISSILE && b.target) {
                if (b.target.incomingMissiles && b.target.incomingMissiles > 0) {
                    b.target.incomingMissiles--;
                }
                b.target = undefined;
            }
        });

        // Clean up
        this.world.bullets = this.world.bullets.filter(e => !e.markedForDeletion && e.y > -100);
        this.world.enemyBullets = this.world.enemyBullets.filter(e => !e.markedForDeletion && e.y < this.render.height + 50 && e.x > -50 && e.x < this.render.width + 50);
        this.world.enemies = this.world.enemies.filter(e => !e.markedForDeletion && e.y < this.render.height + 100);
        this.world.bossWingmen = this.world.bossWingmen.filter(e => !e.markedForDeletion);
        this.world.powerups = this.world.powerups.filter(e => !e.markedForDeletion && e.y < this.render.height + 50);

        if (this.world.player.hp <= 0) {
            if (this.world.boss) {
                this.difficultySys.recordPlayerDefeatedByBoss(this.world.level);
            }

            this.createExplosion(this.world.player.x, this.world.player.y, ExplosionSize.LARGE, '#00ffff');
            this.audio.playExplosion(ExplosionSize.LARGE);
            this.audio.playDefeat();
            this.world.state = GameState.GAME_OVER;
        }
    }

    get snapshot$() {
        return snapshot$;
    }

    getSnapshot() {
        return snapshot$.value;
    }

    private updateEnemyBullets(timeScale: number, dt: number) {
        this.world.enemyBullets.forEach(b => {
            b.x += b.vx * timeScale;
            b.y += b.vy * timeScale;

            if (b.isHoming) {
                const dx = this.world.player.x - b.x;
                const dy = this.world.player.y - b.y;
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
                if (b.timer <= 0) {
                    b.markedForDeletion = true;
                }
            }

            if (this.world.slowFields.length > 0) {
                const inSlow = this.world.slowFields.some(s => Math.hypot(b.x - s.x, b.y - s.y) < s.range);
                if (inSlow) {
                    b.vx *= 0.75;
                    b.vy *= 0.75;
                }
            }
        });
    }

    private updateBulletsProp(dt: number) {
        this.world.bullets.forEach(b => {
            if (b.weaponType === WeaponType.MISSILE) {
                if (b.lifetime !== undefined) {
                    b.lifetime -= dt;
                    if (b.lifetime <= 0) {
                        b.markedForDeletion = true;
                        this.createExplosion(b.x, b.y, ExplosionSize.SMALL, '#ca0ac7ff');
                    }
                }

                if (b.x < -50 || b.x > this.render.width + 50 || b.y > this.render.height + 50 || b.y < -100) {
                    b.markedForDeletion = true;
                }

                if (b.target && (b.target.hp <= 0 || b.target.markedForDeletion)) {
                    if (b.target.incomingMissiles && b.target.incomingMissiles > 0) {
                        b.target.incomingMissiles--;
                    }
                    b.target = undefined;
                }

                if (!b.target) {
                    const newTarget = this.findMissileTarget(b);
                    if (newTarget) {
                        b.target = newTarget;
                        b.target.incomingMissiles = (b.target.incomingMissiles || 0) + 1;
                    }
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
                if (b.x < 0 || b.x > this.render.width) {
                    b.vx *= -1;
                    b.x = Math.max(0, Math.min(this.render.width, b.x));
                    this.handleShurikenBounce(b);
                }
                if (b.y < 0) {
                    b.vy *= -1;
                    b.y = 0;
                    this.handleShurikenBounce(b);
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

    spawnBoss() {
        this.world.boss = this.bossSys.spawn(this.world.level, this.render.sprites);
        this.world.bossWingmen = this.bossSys.spawnWingmen(this.world.level, this.world.boss, this.render.sprites);
        this.world.screenShake = 20;

        if (this.world.boss) {
            this.bossPhaseSys.initializeBoss(this.world.boss, this.world.boss.subType as BossType);
        }
    }

    damageBoss(amount: number) {
        if (!this.world.boss) return;

        if (this.world.boss.invulnerable) {
            return;
        }

        if (this.world.bossWingmen.length > 0) {
            return;
        }

        this.world.boss.hp -= amount;
        if (this.world.boss.hp <= 0 && !this.world.boss.markedForDeletion) {
            this.killBoss();
        }
    }

    killBoss() {
        if (!this.world.boss) return;
        const bx = this.world.boss.x;
        const by = this.world.boss.y;
        const bossLevel = this.world.level;

        this.createExplosion(bx, by, ExplosionSize.LARGE, '#ffffff');
        this.addShockwave(bx, by);
        this.world.screenShake = 30;

        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                if (this.world.state === GameState.VICTORY) return;
                this.createExplosion(bx + (Math.random() - 0.5) * 150, by + (Math.random() - 0.5) * 150, ExplosionSize.LARGE, '#fff');
            }, i * 100);
        }
        this.audio.playExplosion(ExplosionSize.LARGE);
        this.audio.playBossDefeat();
        this.world.showBossDefeatAnimation = true;
        this.world.bossDefeatTimer = 3000;

        this.world.score += BossConfig[this.world.boss.subType]?.score || (5000 * this.world.level);
        this.checkAndApplyLevelUp();

        if (Math.random() < PowerupDropConfig.bossDropRate) {
            this.spawnPowerup(bx, by);
        }

        unlockBoss(bossLevel);

        this.bossPhaseSys.cleanupBoss(this.world.boss);

        this.world.boss = null;
        this.world.bossWingmen = [];
        this.world.enemyBullets = [];
        this.world.isLevelTransitioning = true;

        setTimeout(() => {
            if (this.world.level < this.world.maxLevels) {
                this.world.level++;
                this.world.levelProgress = 0;
                this.world.levelStartTime = Date.now();
                this.world.enemySpawnTimer = 0;

                if (this.world.level > this.world.maxLevelReached) {
                    this.world.maxLevelReached = this.world.level;
                    localStorage.setItem('neon_raiden_max_level', this.world.maxLevelReached.toString());
                }

                this.world.player.hp = this.world.player.maxHp;
                this.world.shield = this.getShieldCap();

                this.world.showLevelTransition = true;
                this.world.levelTransitionTimer = 0;
                this.world.isLevelTransitioning = false;
            } else {
                this.audio.playVictory();
                this.world.state = GameState.VICTORY;
                this.world.isLevelTransitioning = false;
            }
        }, 3000);
    }

    spawnMeteor() {
        const speed = Math.random() * 10 + 10;
        this.world.meteors.push({
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
        });
    }

    private handleShurikenBounce(shuriken: Entity) {
        this.tagSys.setTag(shuriken, 'shuriken_bounced', 600);

        const bounceContext: SynergyTriggerContext = {
            weaponType: WeaponType.SHURIKEN,
            bulletX: shuriken.x,
            bulletY: shuriken.y,
            targetEnemy: this.world.player,
            enemies: this.world.enemies,
            player: this.world.player,
            eventType: CombatEventType.BOUNCE,
            shurikenBounced: true
        };

        const bounceResults = this.synergySys.tryTriggerSynergies(bounceContext);
        bounceResults.forEach(r => {
            if (r.effect === SynergyEffectType.SPEED_BOOST) {
                this.world.playerSpeedBoostTimer = Math.max(this.world.playerSpeedBoostTimer, r.value);
            }
        });

        if (this.synergySys.isSynergyActive(SynergyType.MAGMA_SHURIKEN)) {
            this.tagSys.setTag(shuriken, 'magma_shuriken', 600);
        }
    }

    checkCollisions() {
        const obstacles: Entity[] = [];

        this.world.bullets.forEach(b => {
            let blockedByObstacle = false;
            obstacles.forEach(obstacle => {
                if (this.isColliding(b, obstacle)) {
                    b.markedForDeletion = true;
                    this.createExplosion(b.x, b.y, ExplosionSize.SMALL, '#888888');
                    blockedByObstacle = true;
                }
            });
            if (blockedByObstacle) return;

            this.world.enemies.forEach(e => {
                if (this.isColliding(b, e)) {
                    this.handleBulletHit(b, e);
                }
            });

            this.world.bossWingmen.forEach(wingman => {
                if (this.isColliding(b, wingman)) {
                    this.handleBulletHit(b, wingman);
                }
            });

            if (this.world.boss && this.isColliding(b, this.world.boss)) {
                if (!this.world.boss.invulnerable) {
                    this.handleBulletHit(b, this.world.boss);
                }
            }
        });

        [...this.world.enemyBullets, ...this.world.enemies, ...this.world.bossWingmen].forEach(e => {
            if (e.type === EntityType.BULLET) {
                obstacles.forEach(obstacle => {
                    if (this.isColliding(e, obstacle)) {
                        e.markedForDeletion = true;
                        this.createExplosion(e.x, e.y, ExplosionSize.SMALL, '#888888');
                    }
                });
            }

            if (this.isPlayerColliding(this.world.player, e)) {
                e.markedForDeletion = true;
                if (e.type === 'enemy') e.hp = 0;
                if (!this.world.player.invulnerable) {
                    this.takeDamage(10);
                }
                this.createExplosion(this.world.player.x, this.world.player.y, ExplosionSize.SMALL, '#00ffff');
            }
        });

        if (this.world.boss && this.isPlayerColliding(this.world.player, this.world.boss)) {
            if (!this.world.player.invulnerable) {
                this.takeDamage(1);
            }
        }

        this.world.powerups.forEach(p => {
            if (this.isPlayerColliding(this.world.player, p)) {
                p.markedForDeletion = true;
                this.audio.playPowerUp();
                this.world.score += 100;
                this.checkAndApplyLevelUp();
                this.applyPowerup(p.subType as PowerupType);
            }
        });
    }

    takeDamage(amount: number) {
        const defenseMultiplier = Math.max(0, 1 - this.world.playerDefensePct);
        const effective = Math.ceil(amount * defenseMultiplier);
        const prevShield = this.world.shield;
        if (this.world.shield > 0) {
            this.world.shield -= effective;
            if (this.world.shield < 0) {
                this.world.player.hp += this.world.shield;
                this.world.shield = 0;
            }
            this.world.screenShake = 5;
        } else {
            this.world.player.hp -= effective;
            this.world.screenShake = 10;
        }
        if (prevShield > 0 && this.world.shield === 0) {
            this.audio.playShieldBreak();
        }
        this.world.player.hitFlashUntil = Date.now() + 150;
        this.audio.playHit();
    }

    handleBulletHit(b: Entity, target: Entity) {
        if (b.weaponType === WeaponType.PLASMA) {
            this.createPlasmaExplosion(b.x, b.y);
            b.markedForDeletion = true;
        } else if (b.weaponType === WeaponType.WAVE || b.weaponType === WeaponType.LASER) {
            // Piercing
        } else if (b.weaponType === WeaponType.TESLA && (b.chainCount || 0) > 0) {
            this.createTeslaChain(b, target);
            b.markedForDeletion = true;
        } else {
            b.markedForDeletion = true;
        }

        const comboDamageMultiplier = this.comboSys.getDamageMultiplier();
        let finalDamage = (b.damage || 10) * comboDamageMultiplier * (1 + this.world.playerDamageBonusPct);

        const synergyContext: SynergyTriggerContext = {
            weaponType: b.weaponType || this.world.weaponType,
            bulletX: b.x,
            bulletY: b.y,
            targetEnemy: target,
            enemies: this.world.enemies,
            player: this.world.player,
            plasmaExplosions: this.world.plasmaExplosions.map(({ x, y, range }) => ({ x, y, range })),
            eventType: CombatEventType.HIT,
            shurikenBounced: !!(b.tags && b.tags['shuriken_bounced'] && b.tags['shuriken_bounced'] > Date.now())
        };
        const synergyResults = this.synergySys.tryTriggerSynergies(synergyContext);

        synergyResults.forEach(result => {
            if (result.effect === SynergyEffectType.CHAIN_LIGHTNING) {
                const angle = Math.random() * Math.PI * 2;
                const config = WeaponConfig[WeaponType.TESLA];
                const upgradeConfig = WeaponUpgradeConfig[WeaponType.TESLA]
                if (!config || !upgradeConfig) return;
                const level1 = upgradeConfig[1];
                const speed = config.speed;
                this.world.bullets.push({
                    x: target.x,
                    y: target.y,
                    width: config.bullet.size.width,
                    height: config.bullet.size.height,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    speed,
                    hp: 1,
                    maxHp: 1,
                    type: EntityType.BULLET,
                    color: result.color,
                    markedForDeletion: false,
                    spriteKey: config.sprite,
                    damage: config.baseDamage,
                    chainCount: level1.chainCount,
                    chainRange: level1.chainRange,
                    weaponType: WeaponType.TESLA
                });
                this.createExplosion(target.x, target.y, ExplosionSize.SMALL, result.color);
            } else if (result.effect === SynergyEffectType.DAMAGE_BOOST) {
                finalDamage *= result.multiplier || 1.0;
                this.tagSys.setTag(b, 'damage_boost', 1000);
            } else if (result.effect === SynergyEffectType.BURN) {
                this.tagSys.setTag(target, 'burn_dot', 3000);
                this.createExplosion(target.x, target.y, ExplosionSize.SMALL, result.color);
            } else if (result.effect === SynergyEffectType.SHIELD_REGEN) {
                const cap = this.getShieldCap();
                this.world.shield = Math.min(cap, this.world.shield + result.value);
                this.world.shieldRegenTimer = 1000;
            } else if (result.effect === SynergyEffectType.INVULNERABLE) {
                this.world.player.invulnerable = true;
                this.world.player.invulnerableTimer = Math.max(this.world.player.invulnerableTimer || 0, result.value);
            } else if (result.effect === SynergyEffectType.SLOW_FIELD) {
                this.world.slowFields.push({ x: b.x, y: b.y, range: 120, life: result.value });
            } else if (result.effect === SynergyEffectType.SPEED_BOOST) {
                this.world.playerSpeedBoostTimer = Math.max(this.world.playerSpeedBoostTimer, result.value);
            }
        });

        if (b.weaponType === WeaponType.WAVE && this.synergySys.isSynergyActive(SynergyType.WAVE_PLASMA)) {
            const range = 80;
            this.world.plasmaExplosions.push({ x: b.x, y: b.y, range, life: 1200 });
        }

        if (b.weaponType === WeaponType.VULCAN) {
            this.tagSys.setTag(target, 'hitByVulcan', 800);
        }

        target.hp -= finalDamage;
        this.audio.playHit();

        if (target.hp <= 0 && !target.markedForDeletion) {
            if (target.type === 'boss') {
                this.killBoss();
            } else {
                this.killEnemy(target);
            }
        } else if (b.type !== 'bullet' || b.weaponType !== WeaponType.PLASMA) {
            this.createExplosion(b.x, b.y, ExplosionSize.SMALL, '#ffe066');
        }

        if (b.attenuation && b.damage !== undefined) {
            b.damage *= (1 - b.attenuation);
            if (b.damage < 1) {
                b.markedForDeletion = true;
            }
        }
    }

    private createTeslaChain(b: Entity, target: Entity) {
        const range = b.chainRange || 150;
        let nearest: Entity | null = null;
        let minDist = range;

        const potentialTargets: Entity[] = [...this.world.enemies];

        if (this.world.boss && !this.world.boss.invulnerable && this.world.boss.hp > 0 && !this.world.boss.markedForDeletion) {
            potentialTargets.push(this.world.boss);
        }

        this.world.bossWingmen.forEach(wingman => {
            if (wingman.hp > 0 && !wingman.markedForDeletion) {
                potentialTargets.push(wingman);
            }
        });

        potentialTargets.forEach(e => {
            if (e === target || e.hp <= 0 || e.markedForDeletion) return;
            const dist = Math.sqrt((e.x - target.x) ** 2 + (e.y - target.y) ** 2);
            if (dist < minDist) {
                minDist = dist;
                nearest = e;
            }
        });

        if (nearest) {
            const t = nearest as Entity;
            const angle = Math.atan2(t.y - target.y, t.x - target.x);
            const speed = b.speed || 20;

            this.world.bullets.push({
                x: target.x,
                y: target.y,
                width: b.width,
                height: b.height,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                speed,
                hp: 1,
                maxHp: 1,
                type: EntityType.BULLET,
                color: b.color,
                markedForDeletion: false,
                spriteKey: b.spriteKey,
                damage: b.damage,
                chainCount: (b.chainCount || 0) - 1,
                chainRange: b.chainRange,
                weaponType: WeaponType.TESLA
            });
        }
    }

    killEnemy(e: Entity) {
        e.markedForDeletion = true;

        const leveledUp = this.comboSys.addKill();
        const comboScoreMultiplier = this.comboSys.getScoreMultiplier();

        const baseScore = EnemyConfig[e.subType]?.score || 100;
        const eliteMultiplier = e.isElite ? EnemyCommonConfig.eliteScoreMultiplier : 1;
        const difficultyScoreMultiplier = this.difficultySys.getScoreMultiplier();
        const finalScore = Math.floor(baseScore * eliteMultiplier * comboScoreMultiplier * difficultyScoreMultiplier);

        this.world.score += finalScore;
        this.checkAndApplyLevelUp();
        this.createExplosion(e.x, e.y, ExplosionSize.LARGE, e.type === 'enemy' ? '#c53030' : '#fff');
        this.audio.playExplosion(ExplosionSize.SMALL);

        if (leveledUp) {
            const tier = this.comboSys.getCurrentTier();
            this.addShockwave(this.world.player.x, this.world.player.y, tier.color, 200, 8);
            this.world.screenShake = 15;
        }

        if (e.subType !== undefined) {
            unlockEnemy(e.subType as EnemyType);
        }

        const difficultyConfig = this.difficultySys.getConfig();
        const baseDropRate = e.isElite ? PowerupDropConfig.elitePowerupDropRate : PowerupDropConfig.normalPowerupDropRate;
        const finalDropRate = baseDropRate * difficultyConfig.powerupDropMultiplier;
        if (Math.random() < finalDropRate || this.difficultySys.consumePityDrop()) this.spawnPowerup(e.x, e.y);

        if (this.world.debugModeEnabled) {
            this.world.debugEnemyKillCount++;
        }
    }

    createPlasmaExplosion(x: number, y: number) {
        this.createExplosion(x, y, ExplosionSize.LARGE, '#ed64a6');
        this.addShockwave(x, y, '#ed64a6');
        this.world.screenShake = 15;
        this.audio.playExplosion(ExplosionSize.LARGE);

        const range = 100 + (this.world.weaponLevel * 15);

        this.world.plasmaExplosions.push({ x, y, range, life: 1200 });

        const affectedEnemies = this.synergySys.triggerPlasmaStorm(x, y, range, this.world.enemies);

        if (affectedEnemies.length > 0) {
            affectedEnemies.forEach(e => {
                const angle = Math.atan2(e.y - y, e.x - x);
                const config = WeaponConfig[WeaponType.TESLA];
                const upgradeConfig = WeaponUpgradeConfig[WeaponType.TESLA]
                if (!config || !upgradeConfig) return;
                const level1 = upgradeConfig[1];
                const speed = config.speed;
                this.world.bullets.push({
                    x: x,
                    y: y,
                    width: 10,
                    height: 10,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    speed,
                    hp: 1,
                    maxHp: 1,
                    type: EntityType.BULLET,
                    color: '#a855f7',
                    markedForDeletion: false,
                    spriteKey: config.sprite,
                    damage: config.baseDamage,
                    chainCount: level1.chainCount,
                    chainRange: level1.chainRange,
                    weaponType: WeaponType.TESLA
                });
            });
            this.createExplosion(x, y, ExplosionSize.LARGE, '#a855f7');
        }

        const context: SynergyTriggerContext = {
            weaponType: WeaponType.PLASMA,
            bulletX: x,
            bulletY: y,
            targetEnemy: this.world.player,
            enemies: this.world.enemies,
            player: this.world.player,
            plasmaExplosions: this.world.plasmaExplosions.map(({ x, y, range }) => ({ x, y, range })),
            eventType: CombatEventType.EXPLODE
        };
        const defenseResults = this.synergySys.tryTriggerSynergies(context);
        defenseResults.forEach(r => {
            if (r.effect === SynergyEffectType.SHIELD_REGEN) {
                const cap = this.getShieldCap();
                this.world.shield = Math.min(cap, this.world.shield + r.value);
            } else if (r.effect === SynergyEffectType.INVULNERABLE) {
                this.world.player.invulnerable = true;
                this.world.player.invulnerableTimer = Math.max(this.world.player.invulnerableTimer || 0, r.value);
            }
        });

        this.world.enemies.forEach(e => {
            if (Math.hypot(e.x - x, e.y - y) < range) {
                e.hp -= 50;
                if (e.hp <= 0) this.killEnemy(e);
            }
        });
        this.world.enemyBullets.forEach(b => {
            if (Math.hypot(b.x - x, b.y - y) < range) b.markedForDeletion = true;
        });
    }

    applyPowerup(type: PowerupType) {
        const effects = PowerupEffects;

        switch (type) {
            case PowerupType.POWER:
                {
                    const currentMax = (WeaponConfig[this.world.weaponType]?.maxLevel ?? effects.maxWeaponLevel);
                    this.world.weaponLevel = Math.min(currentMax, this.world.weaponLevel + 1);
                }
                break;

            case PowerupType.HP:
                if (this.world.player.hp >= this.world.player.maxHp) {
                    const overflowHp = effects.hpRestoreAmount;
                    this.world.shield = Math.min(this.getShieldCap(), this.world.shield + overflowHp);
                } else {
                    this.world.player.hp = Math.min(this.world.player.maxHp, this.world.player.hp + effects.hpRestoreAmount);
                    const overflowHp = Math.max(0, this.world.player.hp + effects.hpRestoreAmount - this.world.player.maxHp);
                    if (overflowHp > 0) {
                        this.world.shield = Math.min(this.getShieldCap(), this.world.shield + overflowHp);
                    }
                    this.world.player.hp = Math.min(this.world.player.maxHp, this.world.player.hp + effects.hpRestoreAmount);
                }
                break;

            case PowerupType.BOMB:
                if (this.world.bombs < effects.maxBombs) {
                    this.world.bombs++;
                }
                break;

            case PowerupType.OPTION:
                if (this.world.options.length < effects.maxOptions) {
                    this.world.options.push({
                        x: this.world.player.x,
                        y: this.world.player.y,
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

            case PowerupType.INVINCIBILITY:
                this.world.player.invulnerable = true;
                this.world.player.invulnerableTimer = 5000;
                break;

            case PowerupType.TIME_SLOW:
                this.world.timeSlowActive = true;
                this.world.timeSlowTimer = 3000;
                this.audio.playSlowMotionEnter();
                break;

            default:
                const weaponType = effects.weaponTypeMap[type];
                if (weaponType !== undefined && weaponType !== null) {
                    unlockWeapon(weaponType);

                    if (this.world.weaponType === weaponType) {
                        {
                            const currentMax = (WeaponConfig[this.world.weaponType]?.maxLevel ?? effects.maxWeaponLevel);
                            this.world.weaponLevel = Math.min(currentMax, this.world.weaponLevel + 1);
                        }

                        const equippedWeapons = this.world.secondaryWeapon
                            ? [this.world.weaponType, this.world.secondaryWeapon]
                            : [this.world.weaponType];
                        this.synergySys.updateEquippedWeapons(equippedWeapons);
                    } else {
                        const oldPrimary = this.world.weaponType;
                        const oldWeaponType = this.world.weaponType;
                        this.world.weaponType = weaponType;
                        if (this.synergySys.canCombine(this.world.weaponType, oldPrimary)) {
                            this.world.secondaryWeapon = oldPrimary;

                            this.synergySys.updateEquippedWeapons([this.world.weaponType, this.world.secondaryWeapon]);

                            const activeSynergies = this.synergySys.getActiveSynergies();
                            if (activeSynergies.length > 0) {
                                const synergy = activeSynergies[0];
                                if (synergy.mainWeapon && this.world.weaponType !== synergy.mainWeapon) {
                                    this.world.secondaryWeapon = this.world.weaponType;
                                    this.world.weaponType = synergy.mainWeapon;
                                }
                            }
                            if (this.world.weaponType !== oldWeaponType) {
                                this.world.weaponLevel = 1;
                            }
                        } else {
                            this.world.weaponLevel = 1;
                            this.world.secondaryWeapon = null;
                            this.synergySys.updateEquippedWeapons([this.world.weaponType]);
                        }
                    }
                }
                break;
        }
    }

    spawnPowerup(x: number, y: number) {
        const type = selectPowerupType();

        this.world.powerups.push({
            x, y, width: 30, height: 30, vx: 0, vy: 2, hp: 1, maxHp: 1,
            type: EntityType.POWERUP, subType: type, color: '#fff', markedForDeletion: false,
            spriteKey: `powerup_${type}`
        });
        this.difficultySys.recordPowerupDrop();
    }

    createExplosion(x: number, y: number, size: ExplosionSize, color: string) {
        const count = size === ExplosionSize.SMALL ? 8 : 30;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * (size === ExplosionSize.SMALL ? 4 : 10);
            this.world.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: size === ExplosionSize.SMALL ? 300 : 800,
                maxLife: size === ExplosionSize.SMALL ? 300 : 800,
                color: color,
                size: Math.random() * 4 + 2,
                type: 'spark'
            });
        }
    }

    addShockwave(x: number, y: number, color: string = '#ffffff', maxRadius: number = 150, width: number = 5) {
        this.world.shockwaves.push({
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

    private isPlayerColliding(player: Entity, other: Entity): boolean {
        const shrinkFactor = this.world.playerConfig.hitboxShrink || 0;
        const playerWidth = player.width * (1 - shrinkFactor);
        const playerHeight = player.height * (1 - shrinkFactor);

        return (
            player.x - playerWidth / 2 < other.x + other.width / 2 &&
            player.x + playerWidth / 2 > other.x - other.width / 2 &&
            player.y - playerHeight / 2 < other.y + other.height / 2 &&
            player.y + playerHeight / 2 > other.y - other.height / 2
        );
    }

    private getPlayerWeapons(): { type: WeaponType, level: number }[] {
        const weapons = [{ type: this.world.weaponType, level: this.world.weaponLevel }];
        if (this.world.secondaryWeapon) {
            weapons.push({ type: this.world.secondaryWeapon, level: this.world.weaponLevel });
        }
        return weapons;
    }

    getShieldCap(): number {
        const base = this.world.playerConfig.maxShield + this.world.levelingShieldBonus;
        const comboLevel = this.comboSys && typeof this.comboSys.getState === 'function'
            ? this.comboSys.getState().level
            : 0;
        let bonus = 0;
        if (comboLevel >= 2) bonus += 25;
        if (comboLevel >= 3) bonus += 25;
        if (comboLevel >= 4) bonus += 50;
        if (this.synergySys.isSynergyActive(SynergyType.MAGMA_SHURIKEN)) bonus += 10;
        return base + bonus;
    }

    getShieldPercent(): number {
        const cap = this.getShieldCap();
        return cap > 0 ? Math.max(0, Math.min(100, Math.round((this.world.shield / cap) * 100))) : 0;
    }

    draw() {
        const primaryColor = WeaponConfig[this.world.weaponType]?.color;
        const secondaryColor = this.world.secondaryWeapon ? WeaponConfig[this.world.secondaryWeapon]?.color : undefined;
        const canCombine = this.world.secondaryWeapon ? this.synergySys.canCombine(this.world.weaponType, this.world.secondaryWeapon) : false;

        const powerupSynergyInfo = new Map<Entity, { colors: string[], synergyType: SynergyType }>();
        this.world.powerups.forEach(powerup => {
            const powerupType = powerup.subType as PowerupType;
            const weaponType = PowerupEffects.weaponTypeMap[powerupType];
            if (weaponType !== undefined && weaponType !== null) {
                const synergyInfo = this.synergySys.getPotentialSynergyColors(weaponType);
                if (synergyInfo) {
                    powerupSynergyInfo.set(powerup, synergyInfo);
                }
            }
        });

        this.render.draw(
            this.world.state,
            this.world.player,
            this.world.options,
            this.world.enemies,
            this.world.boss,
            this.world.bossWingmen,
            this.world.bullets,
            this.world.enemyBullets,
            this.world.particles,
            this.world.shockwaves,
            this.world.powerups,
            this.world.meteors,
            this.world.shield,
            this.world.screenShake,
            this.world.weaponLevel,
            this.world.playerLevel,
            [],
            this.world.showBossDefeatAnimation,
            this.world.bossDefeatTimer,
            primaryColor,
            secondaryColor,
            canCombine,
            this.world.timeSlowActive,
            powerupSynergyInfo,
            this.world.slowFields,
            this.world.playerSpeedBoostTimer,
            this.world.shieldRegenTimer,
            this.world.plasmaExplosions
        );
    }

    loop(dt: number) {
        this.update(dt);
        this.draw();
        snapshot$.next(snapshot(this.world));
    }

    private checkAndApplyLevelUp() {
        const conf = this.world.playerConfig.leveling;
        if (!conf) return;
        while (this.world.score >= this.world.nextLevelScore && this.world.playerLevel < conf.maxLevel) {
            this.world.playerLevel += 1;
            this.world.nextLevelScore *= conf.scoreGrowthFactor;
            this.world.player.maxHp += conf.bonusesPerLevel.maxHpFlat;
            this.world.player.hp = this.world.player.maxHp;
            this.world.levelingShieldBonus += conf.bonusesPerLevel.maxShieldFlat;
            this.world.shield = this.getShieldCap();
            const defInc = (conf.bonusesPerLevel.defensePct || 0) / 100;
            const frInc = (conf.bonusesPerLevel.fireRatePct || 0) / 100;
            const dmgInc = (conf.bonusesPerLevel.damagePct || 0) / 100;
            const defCap = (conf.bonusesPerLevel.defensePctMax ?? Number.POSITIVE_INFINITY) / 100;
            const frCap = (conf.bonusesPerLevel.fireRatePctMax ?? Number.POSITIVE_INFINITY) / 100;
            const dmgCap = (conf.bonusesPerLevel.damagePctMax ?? Number.POSITIVE_INFINITY) / 100;
            this.world.playerDefensePct = Math.min(this.world.playerDefensePct + defInc, defCap);
            this.world.playerFireRateBonusPct = Math.min(this.world.playerFireRateBonusPct + frInc, frCap);
            this.world.playerDamageBonusPct = Math.min(this.world.playerDamageBonusPct + dmgInc, dmgCap);
            this.world.player.hitFlashUntil = Date.now() + 300;
            this.audio.playLevelUp();
        }
    }

    findMissileTarget(missile: Entity): Entity | undefined {
        const potentialTargets: Entity[] = [];

        this.world.enemies.forEach(e => {
            if (e.hp > 0 && !e.markedForDeletion && (e.incomingMissiles || 0) < 2) {
                potentialTargets.push(e);
            }
        });

        if (this.world.boss && this.world.boss.hp > 0 && !this.world.boss.markedForDeletion && !this.world.boss.invulnerable && (this.world.boss.incomingMissiles || 0) < 2) {
            potentialTargets.push(this.world.boss);
        }

        potentialTargets.sort((a, b) => {
            const distA = (a.x - missile.x) ** 2 + (a.y - missile.y) ** 2;
            const distB = (b.x - missile.x) ** 2 + (b.y - missile.y) ** 2;

            if (Math.abs(distA - distB) > 100) {
                return distA - distB;
            }
            return a.hp - b.hp;
        });

        return potentialTargets[0];
    }
}
