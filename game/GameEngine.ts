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
import { DifficultySystem, DifficultyConfig } from './systems/DifficultySystem'; // P3 Difficulty System
import { EliteAISystem } from './systems/EliteAISystem'; // P3 Elite AI System
import { unlockWeapon, unlockEnemy, unlockBoss } from './unlockedItems';
import { CombatTag } from './utils/CombatTag';

export class GameEngine {
    canvas: HTMLCanvasElement;

    // Systems
    audio: AudioSystem;
    input: InputSystem;
    render: RenderSystem;
    weaponSys: WeaponSystem;
    enemySys: EnemySystem;
    bossSys: BossSystem;
    comboSys: ComboSystem; // P2 Combo System
    synergySys: WeaponSynergySystem; // P2 Weapon Synergy System
    bossPhaseSys: BossPhaseSystem; // P2 Boss Phase System
    difficultySys: DifficultySystem; // P3 Difficulty System
    eliteAISys: EliteAISystem; // P3 Elite AI System

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
    plasmaExplosions: { x: number, y: number, range: number, life: number }[] = [];
    slowFields: { x: number, y: number, range: number, life: number }[] = [];
    tagSys: CombatTag;
    playerSpeedBoostTimer: number = 0;
    shieldRegenTimer: number = 0;

    // Player Stats
    weaponType: WeaponType = WeaponType.VULCAN;
    secondaryWeapon: WeaponType | null = null; // P2 Secondary weapon for synergy
    weaponLevel: number = 1;
    bombs: number = 0;
    shield: number = 0;
    playerLevel: number = 1;
    nextLevelScore: number = PlayerConfig.leveling.baseScoreForLevel1 ?? 1000;
    playerDefensePct: number = 0;
    playerFireRateBonusPct: number = 0;
    playerDamageBonusPct: number = 0;
    levelingShieldBonus: number = 0;

    // Instance PlayerConfig (deep clone per start)
    playerConfig: FighterEntity = JSON.parse(JSON.stringify(PlayerConfig));

    // Timers
    enemySpawnTimer: number = 0;
    fireTimer: number = 0;
    meteorTimer: number = 0;
    screenShake: number = 0;
    levelStartTime: number = 0; // Track when level started
    regenTimer: number = 0;

    // Time Slow Effect
    timeSlowActive: boolean = false;
    timeSlowTimer: number = 0;

    // Level transition
    showLevelTransition: boolean = false;
    isLevelTransitioning: boolean = false; // Flag to prevent actions during transition
    levelTransitionTimer: number = 0;

    // Boss Warning
    isBossWarningActive: boolean = false;
    bossWarningTimer: number = 0;

    // Boss Defeat Celebration
    showBossDefeatAnimation: boolean = false;
    bossDefeatTimer: number = 0;

    // Debug Mode Variables
    debugEnemyKillCount: number = 0;
    debugModeEnabled: boolean = false;

    // Alternate fire toggle
    alternateFireEnabled: boolean = false;
    fireAlternateToggle: boolean = false;

    // Callbacks
    onScoreChange: (score: number) => void;
    onLevelChange: (level: number) => void;
    onStateChange: (state: GameState) => void;
    onHpChange: (hp: number) => void;
    onBombChange: (bombs: number) => void;
    onMaxLevelChange: (level: number) => void;
    onBossWarning: (show: boolean) => void;
    onComboChange: (state: ComboState) => void; // P2 Combo callback

    constructor(
        canvas: HTMLCanvasElement,
        onScoreChange: (s: number) => void,
        onLevelChange: (l: number) => void,
        onStateChange: (s: GameState) => void,
        onHpChange: (hp: number) => void,
        onBombChange: (bombs: number) => void,
        onMaxLevelChange: (level: number) => void,
        onBossWarning: (show: boolean) => void,
        onComboChange: (state: ComboState) => void // P2 Combo callback
    ) {
        this.canvas = canvas;
        this.onScoreChange = onScoreChange;
        this.onLevelChange = onLevelChange;
        this.onStateChange = onStateChange;
        this.onHpChange = onHpChange;
        this.onBombChange = onBombChange;
        this.onMaxLevelChange = onMaxLevelChange;
        this.onBossWarning = onBossWarning;
        this.onComboChange = onComboChange;

        // Initialize Systems
        this.audio = new AudioSystem();
        this.input = new InputSystem(canvas);
        this.render = new RenderSystem(canvas);
        this.weaponSys = new WeaponSystem(this.audio);
        this.enemySys = new EnemySystem(this.audio, canvas.width, canvas.height);
        this.bossSys = new BossSystem(this.audio, canvas.width, canvas.height, this.difficultySys);
        this.comboSys = new ComboSystem(undefined, (state) => this.onComboChange(state)); // P2 Combo System
        this.synergySys = new WeaponSynergySystem(); // P2 Weapon Synergy System
        this.bossPhaseSys = new BossPhaseSystem(this.audio); // P2 Boss Phase System
        this.difficultySys = new DifficultySystem(); // P3 Difficulty System
        this.eliteAISys = new EliteAISystem(canvas.width, canvas.height); // P3 Elite AI System
        this.tagSys = new CombatTag();

        // Bind Input Actions
        this.input.onAction = (action) => {
            if (action === 'bomb_or_fire') {
                if (this.state === GameState.PLAYING) this.triggerBomb();
            } else if (action === 'touch_start') {
                // Removed auto-start on touch. Game now only starts via UI button.
            }
        };

        this.input.onMouseMove = (x, y) => {
            if (this.state === GameState.PLAYING && this.player) {
                this.player.x = x;
                this.player.y = y;
            }
        };

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // this.player = this.createPlayer();

        // Load progress
        const savedMaxLevel = localStorage.getItem('neon_raiden_max_level');
        if (savedMaxLevel) {
            this.maxLevelReached = parseInt(savedMaxLevel, 10);
        }
        // Notify initial max level
        setTimeout(() => this.onMaxLevelChange(this.maxLevelReached), 0);

        // Ensure first weapon is always available
        unlockWeapon(WeaponType.VULCAN);
        validatePowerupVisuals(Object.values(PowerupType));
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.render.resize(width, height);
        this.enemySys.resize(width, height);
        this.bossSys.resize(width, height);
        this.eliteAISys.resize(width, height); // P3 Resize elite AI system

        // Update config if needed, though config is static, systems hold dimensions
    }

    createPlayer(): Entity {
        this.playerConfig = JSON.parse(JSON.stringify(PlayerConfig));
        return {
            x: this.render.width / 2,
            y: this.render.height - 100,
            width: this.playerConfig.size.width,
            height: this.playerConfig.size.height,
            vx: 0,
            vy: 0,
            speed: this.playerConfig.speed,
            hp: this.playerConfig.initialHp,
            maxHp: this.playerConfig.maxHp,
            type: EntityType.PLAYER,
            color: this.playerConfig.color,
            markedForDeletion: false,
            spriteKey: 'player'
        };
    }

    startGame() {
        this.player = this.createPlayer();
        this.state = GameState.PLAYING;
        this.score = 0;
        this.level = 1;
        this.weaponLevel = 1;
        this.playerLevel = 1;
        this.nextLevelScore = this.playerConfig.leveling?.baseScoreForLevel1 ?? 1000;
        this.playerDefensePct = 0;
        this.playerFireRateBonusPct = 0;
        this.playerDamageBonusPct = 0;
        this.levelingShieldBonus = 0;
        this.weaponType = WeaponType.VULCAN;
        this.secondaryWeapon = null; // P2 Reset secondary weapon
        this.bombs = PowerupEffects.initialBombs;
        this.shield = 0;
        this.timeSlowActive = false;
        this.timeSlowTimer = 0;
        this.shieldRegenTimer = 0;
        resetDropContext();


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
        this.isBossWarningActive = false;
        this.bossWarningTimer = 0;
        this.onBossWarning(false);
        this.showBossDefeatAnimation = false;
        this.bossDefeatTimer = 0;
        this.levelStartTime = Date.now(); // Initialize level start time
        this.audio.resume();

        // Debug Mode: Set debug mode enabled flag based on GameConfig
        this.debugModeEnabled = GameConfig.debug;
        this.debugEnemyKillCount = 0;

        // P2 Reset combo system
        this.comboSys.reset();

        // P2 Reset environment system

        this.synergySys.reset();

        // P3 Reset difficulty system
        this.difficultySys.reset();

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
                this.createExplosion(e.x, e.y, ExplosionSize.LARGE, e.color);
                e.hp -= PowerupEffects.bombDamage;
                if (e.hp <= 0) {
                    this.killEnemy(e);
                }
            });
            this.onScoreChange(this.score);

            if (this.boss) {
                const damage = this.boss.maxHp * PowerupEffects.bombDamageToBossPct;
                this.damageBoss(damage);
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

        // 处理时间减缓效果
        if (this.timeSlowActive) {
            this.timeSlowTimer -= dt;
            if (this.timeSlowTimer <= 0) {
                this.timeSlowActive = false;
            }
            // 减缓时间为原来的一半
            dt *= 0.5;
        }

        const timeScale = dt / 16.66;
        // Player's time scale (unaffected by slow motion)
        // If timeSlowActive is true, dt was halved, so we need to double it back for player to be normal speed relative to real time
        const playerTimeScale = this.timeSlowActive ? timeScale * 2 : timeScale;

        // Handle Shield Timer & Audio
        if (this.player.invulnerable && this.player.invulnerableTimer && this.player.invulnerableTimer > 0) {
            this.player.invulnerableTimer -= (this.timeSlowActive ? dt * 2 : dt); // Shield timer runs in real time
            this.audio.playShieldLoop();

            if (this.player.invulnerableTimer <= 0) {
                this.player.invulnerable = false;
                this.player.invulnerableTimer = 0;
                this.audio.stopShieldLoop();
            }
        } else if (this.player.invulnerable && (!this.player.invulnerableTimer || this.player.invulnerableTimer <= 0)) {
            // Cleanup if timer is missing or invalid but flag is set (safety)
            this.player.invulnerable = false;
            this.audio.stopShieldLoop();
        }

        // Handle Shield Regen Timer
        if (this.shieldRegenTimer > 0) {
            this.shieldRegenTimer -= dt;
            if (this.shieldRegenTimer < 0) {
                this.shieldRegenTimer = 0;
            }
        }

        // P2 Update combo timer
        this.comboSys.update(dt);


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

        // Boss Defeat Animation
        if (this.showBossDefeatAnimation) {
            this.bossDefeatTimer -= dt;
            if (this.bossDefeatTimer <= 0) {
                this.showBossDefeatAnimation = false;
            }
        }

        // Player Movement
        let speed = this.playerConfig.speed * playerTimeScale * (this.playerSpeedBoostTimer > 0 ? 1.1 : 1.0);


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
        this.fireTimer += (this.timeSlowActive ? dt * 2 : dt); // Fire rate based on real time
        const baseFireRate = this.weaponSys.getFireRate(this.weaponType, this.weaponLevel);
        const fireRate = Math.max(50, Math.round(baseFireRate * (1 - this.playerFireRateBonusPct)));
        if (this.fireTimer > fireRate) {
            const isMissileVulcan = this.synergySys.isSynergyActive(SynergyType.MISSILE_VULCAN);
            if (isMissileVulcan) {
                this.weaponSys.firePlayerWeapon(
                    this.player, WeaponType.VULCAN, this.weaponLevel,
                    this.options, this.bullets, this.enemies
                );
                this.weaponSys.firePlayerWeapon(
                    this.player, WeaponType.MISSILE, 1,
                    [], this.bullets, this.enemies
                );
                this.fireTimer = 0;
            } else {
                const canAlt = this.alternateFireEnabled && this.secondaryWeapon && this.synergySys.canCombine(this.weaponType, this.secondaryWeapon);
                const fireType = canAlt ? (this.fireAlternateToggle ? this.secondaryWeapon! : this.weaponType) : this.weaponType;
                this.weaponSys.firePlayerWeapon(
                    this.player, fireType, this.weaponLevel,
                    this.options, this.bullets, this.enemies
                );
                if (canAlt) this.fireAlternateToggle = !this.fireAlternateToggle;
                this.fireTimer = 0;
            }
        }

        // Level Logic
        if (!this.boss) {
            this.levelProgress += 0.05 * timeScale;
            this.enemySpawnTimer += dt;

            // P3 Get dynamic difficulty configuration
            const difficultyConfig = this.difficultySys.getConfig();
            const baseSpawnRate = EnemyCommonConfig.enemySpawnIntervalByLevel[this.level] || 1000;
            const spawnRate = Math.round(baseSpawnRate * difficultyConfig.spawnIntervalMultiplier);

            if (this.enemySpawnTimer > spawnRate) {
                const baseEliteChance = EnemyCommonConfig.eliteChance;
                const eliteMod = this.difficultySys.getEliteChanceModifier();
                const effectiveEliteChance = Math.max(0, Math.min(1, baseEliteChance + eliteMod));
                this.enemySys.spawnEnemy(this.level, this.enemies, effectiveEliteChance);

                // P3 Check if newly spawned enemy is elite and initialize AI
                const newEnemy = this.enemies[this.enemies.length - 1];
                if (newEnemy && newEnemy.isElite) {
                    this.eliteAISys.initializeElite(newEnemy, this.enemies);
                }

                // P3 Apply difficulty multipliers to newly spawned enemy
                if (newEnemy) {
                    // Apply HP multiplier
                    newEnemy.hp *= difficultyConfig.enemyHpMultiplier;
                    newEnemy.maxHp = newEnemy.hp;

                    // Apply speed multiplier
                    newEnemy.vy *= difficultyConfig.enemySpeedMultiplier;
                    if (newEnemy.vx !== 0) {
                        newEnemy.vx *= difficultyConfig.enemySpeedMultiplier;
                    }
                }

                this.enemySpawnTimer = 0;
            }

            // Spawn boss when both conditions are met:
            // 1. Level progress >= 90%
            // 2. Minimum level duration has passed (60 seconds)
            // 3. Not currently transitioning levels
            const levelDuration = (Date.now() - this.levelStartTime) / 1000; // in seconds
            const minDuration = BossSpawnConfig.minLevelDuration;
            const minProgress = BossSpawnConfig.minLevelProgress;

            // Debug Mode: Spawn boss after 10 seconds and 10 enemy kills
            if (this.debugModeEnabled) {
                if (levelDuration >= 10 && this.debugEnemyKillCount >= 10 && !this.isLevelTransitioning) {
                    if (!this.isBossWarningActive) {
                        this.isBossWarningActive = true;
                        this.bossWarningTimer = 3000; // 3 seconds warning
                        this.onBossWarning(true);
                        this.audio.playWarning();
                        // Spawn boss immediately, warning will show during entrance
                        this.spawnBoss();
                    }
                }
            } else if (this.levelProgress >= minProgress && levelDuration >= minDuration && !this.isLevelTransitioning) {
                if (!this.isBossWarningActive) {
                    this.isBossWarningActive = true;
                    this.bossWarningTimer = 3000; // 3 seconds warning
                    this.onBossWarning(true);
                    this.audio.playWarning();
                    // Spawn boss immediately, warning will show during entrance
                    this.spawnBoss();
                }
            }
        } else {
            // Continue spawning enemies for a short time after boss appears
            this.enemySpawnTimer += dt;
            const spawnRate = Math.round((EnemyCommonConfig.enemySpawnIntervalByLevel[this.level] || 1000) * EnemyCommonConfig.enemySpawnIntervalInBossMultiplier);
            if (this.enemySpawnTimer > spawnRate) {
                const baseEliteChance = EnemyCommonConfig.eliteChance;
                const eliteMod = this.difficultySys.getEliteChanceModifier();
                const bossFactor = EnemyCommonConfig.eliteChanceBossMultiplier ?? 1.0;
                const effectiveEliteChance = Math.max(0, Math.min(1, (baseEliteChance + eliteMod) * bossFactor));
                this.enemySys.spawnEnemy(this.level, this.enemies, effectiveEliteChance);
                this.enemySpawnTimer = 0;
            }

            this.bossSys.update(this.boss, dt, timeScale, this.player, this.enemyBullets, this.level);

            // P2 Update boss phase system
            this.bossPhaseSys.update(this.boss, dt);

            // Update wingmen
            this.bossWingmen.forEach(wingman => {
                wingman.x = this.boss!.x + (wingman.x - this.boss!.x) * 0.95;
                wingman.y = this.boss!.y + 80;
            });
        }

        // Handle boss warning timer countdown (outside boss check so it works after spawn)
        if (this.isBossWarningActive) {
            this.bossWarningTimer -= dt;
            if (this.bossWarningTimer <= 0) {
                this.isBossWarningActive = false;
                this.onBossWarning(false);
            }
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

        // Update player bullets with weapon-specific logic

        this.updateBulletsProp(dt);

        // Update enemy bullets with homing logic
        this.updateEnemyBullets(timeScale, dt);

        this.enemySys.update(dt, timeScale, this.enemies, this.player, this.enemyBullets);

        // Apply slow fields to enemies
        if (this.slowFields.length > 0) {
            this.enemies.forEach(e => {
                const inSlow = this.slowFields.some(s => Math.hypot(e.x - s.x, e.y - s.y) < s.range);
                if (inSlow) {
                    e.vx *= 0.8;
                    e.vy *= 0.8;
                    e.slowed = true;
                } else {
                    e.slowed = false;
                }
            });
        }

        // Apply burn DOT to enemies
        this.enemies.forEach(e => {
            if (this.tagSys.hasTag(e, 'burn_dot')) {
                e.hp -= (5 * dt / 1000);
                if (e.hp <= 0 && !e.markedForDeletion) this.killEnemy(e);
            }
        });

        // P3 Update difficulty system
        const currentWeapons = this.getPlayerWeapons();
        this.difficultySys.update(dt, this.player, currentWeapons, this.comboSys.getState().count, this.level);

        this.regenTimer += dt;
        const comboLevel = this.comboSys.getState().level;
        let regenAmount = 0;
        if (this.synergySys.isSynergyActive(SynergyType.MAGMA_SHURIKEN)) {
            if (comboLevel >= 4) regenAmount = 3;
            else if (comboLevel >= 3) regenAmount = 2;
            else if (comboLevel >= 2) regenAmount = 1;
        }
        if (this.regenTimer >= 1000 && regenAmount > 0 && this.player.hp > 0 && this.player.hp < this.player.maxHp) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + regenAmount);
            this.onHpChange(this.player.hp);
            this.regenTimer = 0;
        }

        // P3 Update elite AI for all elite enemies
        this.enemies.forEach(enemy => {
            if (enemy.isElite) {
                this.eliteAISys.update(enemy, dt, this.enemies, this.enemyBullets, this.player);
            }
        });

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

        this.plasmaExplosions.forEach(p => {
            p.life -= dt;
        });
        this.plasmaExplosions = this.plasmaExplosions.filter(p => p.life > 0);
        this.slowFields.forEach(s => { s.life -= dt; });
        this.slowFields = this.slowFields.filter(s => s.life > 0);

        this.checkCollisions();

        // Cleanup missile tracking counters for deleted bullets
        this.bullets.forEach(b => {
            if (b.markedForDeletion && b.weaponType === WeaponType.MISSILE && b.target) {
                if (b.target.incomingMissiles && b.target.incomingMissiles > 0) {
                    b.target.incomingMissiles--;
                }
                b.target = undefined;
            }
        });

        // Clean up
        this.bullets = this.bullets.filter(e => !e.markedForDeletion && e.y > -100);
        this.enemyBullets = this.enemyBullets.filter(e => !e.markedForDeletion && e.y < this.render.height + 50 && e.x > -50 && e.x < this.render.width + 50);
        this.enemies = this.enemies.filter(e => !e.markedForDeletion && e.y < this.render.height + 100);
        this.bossWingmen = this.bossWingmen.filter(e => !e.markedForDeletion);
        this.powerups = this.powerups.filter(e => !e.markedForDeletion && e.y < this.render.height + 50);

        if (this.player.hp <= 0) {
            // P3 Record player defeated by boss for dynamic difficulty adjustment
            // Only record if there's a boss present
            if (this.boss) {
                this.difficultySys.recordPlayerDefeatedByBoss(this.level);
            }

            this.createExplosion(this.player.x, this.player.y, ExplosionSize.LARGE, '#00ffff');
            this.audio.playExplosion(ExplosionSize.LARGE);
            this.audio.playDefeat();
            this.state = GameState.GAME_OVER;
            this.onStateChange(this.state);
        }
    }

    private updateEnemyBullets(timeScale: number, dt: number) {
        this.enemyBullets.forEach(b => {
            b.x += b.vx * timeScale;
            b.y += b.vy * timeScale;

            // Homing missile AI - only for bullets marked with isHoming flag
            if (b.isHoming) {
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

            // Update all enemy bullets rotation to face flight direction
            if (b.vx !== undefined && b.vy !== undefined && b.spriteKey !== 'bullet_enemy_spiral') {
                b.angle = Math.atan2(b.vy, b.vx) + Math.PI / 2;
            }

            // Update rotation angle for spiral bullets
            if (b.spriteKey === 'bullet_enemy_spiral' && b.rotationSpeed !== undefined) {
                b.angle = (b.angle || 0) + b.rotationSpeed;
            }

            // Laser timer countdown
            if (b.timer !== undefined) {
                b.timer -= dt;
                if (b.timer <= 0) {
                    b.markedForDeletion = true;
                }
            }

            // Apply slow fields to enemy bullets
            if (this.slowFields.length > 0) {
                const inSlow = this.slowFields.some(s => Math.hypot(b.x - s.x, b.y - s.y) < s.range);
                if (inSlow) {
                    b.vx *= 0.75;
                    b.vy *= 0.75;
                }
            }
        });
    }

    // 处理导弹追踪目标和特殊武器效果
    private updateBulletsProp(dt: number) {
        this.bullets.forEach(b => {
            // Missile homing logic
            if (b.weaponType === WeaponType.MISSILE) {
                // Lifetime management
                if (b.lifetime !== undefined) {
                    b.lifetime -= dt;
                    if (b.lifetime <= 0) {
                        b.markedForDeletion = true;
                        this.createExplosion(b.x, b.y, ExplosionSize.SMALL, '#ca0ac7ff');
                    }
                }

                // Bounds check
                if (b.x < -50 || b.x > this.render.width + 50 || b.y > this.render.height + 50 || b.y < -100) {
                    b.markedForDeletion = true;
                }

                // If target is dead or invalid, stop tracking
                if (b.target && (b.target.hp <= 0 || b.target.markedForDeletion)) {
                    // Decrement counter on old target
                    if (b.target.incomingMissiles && b.target.incomingMissiles > 0) {
                        b.target.incomingMissiles--;
                    }
                    b.target = undefined;
                }

                // Try to find a target if we don't have one
                if (!b.target) {
                    const newTarget = this.findMissileTarget(b);
                    if (newTarget) {
                        b.target = newTarget;
                        b.target.incomingMissiles = (b.target.incomingMissiles || 0) + 1;
                    }
                }

                // Track target
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

            // Update all player bullets rotation to face flight direction
            // Skip plasma as it has its own spinning animation
            if (b.weaponType !== WeaponType.PLASMA && b.vx !== undefined && b.vy !== undefined) {
                b.angle = Math.atan2(b.vy, b.vx) + Math.PI / 2;
            }

            // Update rotation angle for plasma bullets
            if (b.weaponType === WeaponType.PLASMA && b.rotationSpeed !== undefined) {
                b.angle = (b.angle || 0) + b.rotationSpeed;
            }
        });
    }

    spawnBoss() {
        this.boss = this.bossSys.spawn(this.level, this.render.sprites);
        this.bossWingmen = this.bossSys.spawnWingmen(this.level, this.boss, this.render.sprites);
        this.screenShake = 20;

        // P2 Initialize boss phase system
        if (this.boss) {
            this.bossPhaseSys.initializeBoss(this.boss, this.boss.subType as BossType);
        }
    }

    damageBoss(amount: number) {
        if (!this.boss) return;

        // Boss cannot take damage while invulnerable
        if (this.boss.invulnerable) {
            return;
        }

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

        this.createExplosion(bx, by, ExplosionSize.LARGE, '#ffffff');
        this.addShockwave(bx, by);
        this.screenShake = 30;

        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                if (this.state === GameState.VICTORY) return;
                this.createExplosion(bx + (Math.random() - 0.5) * 150, by + (Math.random() - 0.5) * 150, ExplosionSize.LARGE, '#fff');
            }, i * 100);
        }
        this.audio.playExplosion(ExplosionSize.LARGE);
        this.audio.playBossDefeat(); // Play victory fanfare
        this.showBossDefeatAnimation = true;
        this.bossDefeatTimer = 3000; // Show for 3 seconds

        this.score += BossConfig[this.boss.subType]?.score || (5000 * this.level);
        this.onScoreChange(this.score);
        this.checkAndApplyLevelUp();

        // Boss guaranteed drop
        if (Math.random() < PowerupDropConfig.bossDropRate) {
            this.spawnPowerup(bx, by);
        }

        // Unlock boss when defeated
        unlockBoss(bossLevel);


        // P2 Cleanup boss phase state
        this.bossPhaseSys.cleanupBoss(this.boss);

        this.boss = null;
        this.bossWingmen = [];
        this.enemyBullets = []; // Clear all enemy bullets on boss death
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

                this.player.hp = this.player.maxHp;
                this.shield = this.getShieldCap();
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
        });
    }

    /**
     * 处理SHURIKEN子弹反弹逻辑
     * @param shuriken SHURIKEN子弹实体
     */
    private handleShurikenBounce(shuriken: Entity) {
        // 设置反弹标记
        this.tagSys.setTag(shuriken, 'shuriken_bounced', 600);

        // 触发协同效果
        const bounceContext: SynergyTriggerContext = {
            weaponType: WeaponType.SHURIKEN,
            bulletX: shuriken.x,
            bulletY: shuriken.y,
            targetEnemy: this.player,
            enemies: this.enemies,
            player: this.player,
            eventType: CombatEventType.BOUNCE,
            shurikenBounced: true
        };

        const bounceResults = this.synergySys.tryTriggerSynergies(bounceContext);
        bounceResults.forEach(r => {
            if (r.effect === SynergyEffectType.SPEED_BOOST) {
                this.playerSpeedBoostTimer = Math.max(this.playerSpeedBoostTimer, r.value);
            }
        });

        // 如果MAGMA_SHURIKEN协同效果激活，为SHURIKEN子弹添加标记
        if (this.synergySys.isSynergyActive(SynergyType.MAGMA_SHURIKEN)) {
            this.tagSys.setTag(shuriken, 'magma_shuriken', 600);
        }
    }

    checkCollisions() {
        const obstacles: Entity[] = [];

        // Bullets vs Enemies
        this.bullets.forEach(b => {
            let blockedByObstacle = false;
            obstacles.forEach(obstacle => {
                if (this.isColliding(b, obstacle)) {
                    b.markedForDeletion = true;
                    this.createExplosion(b.x, b.y, ExplosionSize.SMALL, '#888888');
                    blockedByObstacle = true;
                }
            });
            if (blockedByObstacle) return;

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
                // Only handle collision if boss is not invulnerable
                if (!this.boss.invulnerable) {
                    this.handleBulletHit(b, this.boss);
                }
            }
        });

        // Enemy Stuff vs Player
        [...this.enemyBullets, ...this.enemies, ...this.bossWingmen].forEach(e => {
            if (e.type === EntityType.BULLET) {
                obstacles.forEach(obstacle => {
                    if (this.isColliding(e, obstacle)) {
                        e.markedForDeletion = true;
                        this.createExplosion(e.x, e.y, ExplosionSize.SMALL, '#888888');
                    }
                });
            }

            if (this.isPlayerColliding(this.player, e)) {
                e.markedForDeletion = true;
                if (e.type === 'enemy') e.hp = 0;
                // Only take damage if player is not invulnerable
                if (!this.player.invulnerable) {
                    this.takeDamage(10);
                }
                this.createExplosion(this.player.x, this.player.y, ExplosionSize.SMALL, '#00ffff');
            }
        });

        if (this.boss && this.isPlayerColliding(this.player, this.boss)) {
            // Only take damage if player is not invulnerable
            if (!this.player.invulnerable) {
                this.takeDamage(1);
            }
        }

        // Powerups
        this.powerups.forEach(p => {
            if (this.isPlayerColliding(this.player, p)) {
                p.markedForDeletion = true;
                this.audio.playPowerUp();
                this.score += 100;
                this.onScoreChange(this.score);
                this.checkAndApplyLevelUp();
                this.applyPowerup(p.subType as PowerupType);
            }
        });
    }

    takeDamage(amount: number) {
        const defenseMultiplier = Math.max(0, 1 - this.playerDefensePct);
        const effective = Math.ceil(amount * defenseMultiplier);
        const prevShield = this.shield;
        if (this.shield > 0) {
            this.shield -= effective;
            if (this.shield < 0) {
                this.player.hp += this.shield;
                this.shield = 0;
            }
            this.screenShake = 5;
        } else {
            this.player.hp -= effective;
            this.screenShake = 10;
        }
        if (prevShield > 0 && this.shield === 0) {
            this.audio.playShieldBreak();
        }
        this.player.hitFlashUntil = Date.now() + 150;
        this.audio.playHit();
        this.onHpChange(this.player.hp);
    }
    // 子弹击中的处理
    handleBulletHit(b: Entity, target: Entity) {
        if (b.weaponType === WeaponType.PLASMA) {
            this.createPlasmaExplosion(b.x, b.y);
            b.markedForDeletion = true;
        } else if (b.weaponType === WeaponType.WAVE || b.weaponType === WeaponType.LASER) {
            // Piercing
        } else if (b.weaponType === WeaponType.TESLA && (b.chainCount || 0) > 0) {
            // Tesla Chain Logic
            this.createTeslaChain(b, target);
            b.markedForDeletion = true;
        } else {
            b.markedForDeletion = true;
        }

        // P2 Apply combo damage multiplier
        const comboDamageMultiplier = this.comboSys.getDamageMultiplier();
        let finalDamage = (b.damage || 10) * comboDamageMultiplier * (1 + this.playerDamageBonusPct);

        // P2 Try to trigger weapon synergies
        const synergyContext: SynergyTriggerContext = {
            weaponType: b.weaponType || this.weaponType,
            bulletX: b.x,
            bulletY: b.y,
            targetEnemy: target,
            enemies: this.enemies,
            player: this.player,
            plasmaExplosions: this.plasmaExplosions.map(({ x, y, range }) => ({ x, y, range })),
            eventType: CombatEventType.HIT,
            shurikenBounced: !!(b.tags && b.tags['shuriken_bounced'] && b.tags['shuriken_bounced'] > Date.now())
        };
        const synergyResults = this.synergySys.tryTriggerSynergies(synergyContext);
        console.log(`synergy results:`, synergyResults)
        // Apply synergy effects
        synergyResults.forEach(result => {
            if (result.effect === SynergyEffectType.CHAIN_LIGHTNING) {
                // LASER+TESLA: Spawn chain lightning
                const angle = Math.random() * Math.PI * 2;
                // 只使用一级配置
                const config = WeaponConfig[WeaponType.TESLA];
                const upgradeConfig = WeaponUpgradeConfig[WeaponType.TESLA]
                if (!config || !upgradeConfig) return;
                const level1 = upgradeConfig[1];
                const speed = config.speed;
                this.bullets.push({
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
                // WAVE+PLASMA or MISSILE+VULCAN: Apply damage multiplier
                finalDamage *= result.multiplier || 1.0;
                // Tag the bullet for visual effect
                this.tagSys.setTag(b, 'damage_boost', 1000);
            } else if (result.effect === SynergyEffectType.BURN) {
                // MAGMA+SHURIKEN: Apply burn DOT (simplified: instant extra damage)
                this.tagSys.setTag(target, 'burn_dot', 3000);
                this.createExplosion(target.x, target.y, ExplosionSize.SMALL, result.color);
            } else if (result.effect === SynergyEffectType.SHIELD_REGEN) {
                const cap = this.getShieldCap();
                this.shield = Math.min(cap, this.shield + result.value);
                this.shieldRegenTimer = 1000; // Set timer for 1 second to show visual effect
            } else if (result.effect === SynergyEffectType.INVULNERABLE) {
                this.player.invulnerable = true;
                this.player.invulnerableTimer = Math.max(this.player.invulnerableTimer || 0, result.value);
            } else if (result.effect === SynergyEffectType.SLOW_FIELD) {
                this.slowFields.push({ x: b.x, y: b.y, range: 120, life: result.value });
            } else if (result.effect === SynergyEffectType.SPEED_BOOST) {
                this.playerSpeedBoostTimer = Math.max(this.playerSpeedBoostTimer, result.value);
            }
        });

        if (b.weaponType === WeaponType.WAVE && this.synergySys.isSynergyActive(SynergyType.WAVE_PLASMA)) {
            const range = 80;
            this.plasmaExplosions.push({ x: b.x, y: b.y, range, life: 1200 });
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

        // Apply damage attenuation for piercing weapons
        if (b.attenuation && b.damage !== undefined) {
            b.damage *= (1 - b.attenuation);
            // If damage becomes too low, destroy the bullet
            if (b.damage < 1) {
                b.markedForDeletion = true;
            }
        }
    }

    private createTeslaChain(b: Entity, target: Entity) {
        const range = b.chainRange || 150;
        let nearest: Entity | null = null;
        let minDist = range;

        // Build list of all potential bounce targets (enemies, boss, wingmen)
        const potentialTargets: Entity[] = [...this.enemies];

        // Add boss if it exists and is vulnerable
        if (this.boss && !this.boss.invulnerable && this.boss.hp > 0 && !this.boss.markedForDeletion) {
            potentialTargets.push(this.boss);
        }

        // Add all live wingmen
        this.bossWingmen.forEach(wingman => {
            if (wingman.hp > 0 && !wingman.markedForDeletion) {
                potentialTargets.push(wingman);
            }
        });

        // Find nearest target within range (excluding the current hit target)
        potentialTargets.forEach(e => {
            if (e === target || e.hp <= 0 || e.markedForDeletion) return; // Skip current target and dead entities
            const dist = Math.sqrt((e.x - target.x) ** 2 + (e.y - target.y) ** 2);
            if (dist < minDist) {
                minDist = dist;
                nearest = e;
            }
        });

        if (nearest) {
            const t = nearest as Entity;
            const angle = Math.atan2(t.y - target.y, t.x - target.x);
            const speed = b.speed || 20; // Fast chain speed


            // Spawn chain bullet from current target to next target
            this.bullets.push({
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

        // P2 Add combo kill and apply score multiplier
        const leveledUp = this.comboSys.addKill();
        const comboScoreMultiplier = this.comboSys.getScoreMultiplier();

        const baseScore = EnemyConfig[e.subType]?.score || 100;
        const eliteMultiplier = e.isElite ? EnemyCommonConfig.eliteScoreMultiplier : 1;
        // P3 Apply difficulty score multiplier
        const difficultyScoreMultiplier = this.difficultySys.getScoreMultiplier();
        const finalScore = Math.floor(baseScore * eliteMultiplier * comboScoreMultiplier * difficultyScoreMultiplier);

        this.score += finalScore;
        this.onScoreChange(this.score);
        this.checkAndApplyLevelUp();
        this.createExplosion(e.x, e.y, ExplosionSize.LARGE, e.type === 'enemy' ? '#c53030' : '#fff');
        this.audio.playExplosion(ExplosionSize.SMALL);

        // P2 Visual feedback for combo level up
        if (leveledUp) {
            const tier = this.comboSys.getCurrentTier();
            this.addShockwave(this.player.x, this.player.y, tier.color, 200, 8);
            this.screenShake = 15;
        }

        // Unlock enemy when defeated
        if (e.subType !== undefined) {
            unlockEnemy(e.subType as EnemyType);
        }

        // P3 Apply difficulty drop rate multiplier
        const difficultyConfig = this.difficultySys.getConfig();
        const baseDropRate = e.isElite ? PowerupDropConfig.elitePowerupDropRate : PowerupDropConfig.normalPowerupDropRate;
        const finalDropRate = baseDropRate * difficultyConfig.powerupDropMultiplier;
        if (Math.random() < finalDropRate || this.difficultySys.consumePityDrop()) this.spawnPowerup(e.x, e.y);

        // Debug Mode: Increment enemy kill count
        if (this.debugModeEnabled) {
            this.debugEnemyKillCount++;
        }
    }

    createPlasmaExplosion(x: number, y: number) {
        this.createExplosion(x, y, ExplosionSize.LARGE, '#ed64a6');
        this.addShockwave(x, y, '#ed64a6');
        this.screenShake = 15;
        this.audio.playExplosion(ExplosionSize.LARGE);

        const range = 100 + (this.weaponLevel * 15);

        this.plasmaExplosions.push({ x, y, range, life: 1200 });

        // P2 Check for TESLA+PLASMA synergy (Plasma Storm)
        const affectedEnemies = this.synergySys.triggerPlasmaStorm(x, y, range, this.enemies);

        if (affectedEnemies.length > 0) {
            // Generate lightning bolts to affected enemies
            affectedEnemies.forEach(e => {
                const angle = Math.atan2(e.y - y, e.x - x);
                // 只使用一级配置
                const config = WeaponConfig[WeaponType.TESLA];
                const upgradeConfig = WeaponUpgradeConfig[WeaponType.TESLA]
                if (!config || !upgradeConfig) return;
                const level1 = upgradeConfig[1];
                const speed = config.speed;
                this.bullets.push({
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
            targetEnemy: this.player,
            enemies: this.enemies,
            player: this.player,
            plasmaExplosions: this.plasmaExplosions.map(({ x, y, range }) => ({ x, y, range })),
            eventType: CombatEventType.EXPLODE
        };
        const defenseResults = this.synergySys.tryTriggerSynergies(context);
        defenseResults.forEach(r => {
            if (r.effect === SynergyEffectType.SHIELD_REGEN) {
                const cap = this.getShieldCap();
                this.shield = Math.min(cap, this.shield + r.value);
            } else if (r.effect === SynergyEffectType.INVULNERABLE) {
                this.player.invulnerable = true;
                this.player.invulnerableTimer = Math.max(this.player.invulnerableTimer || 0, r.value);
            }
        });

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
                {
                    const currentMax = (WeaponConfig[this.weaponType]?.maxLevel ?? effects.maxWeaponLevel);
                    this.weaponLevel = Math.min(currentMax, this.weaponLevel + 1);
                }
                break;

            case PowerupType.HP:
                // 生命值溢出转换为护盾能量
                if (this.player.hp >= this.player.maxHp) {
                    // 当生命值已满时，将溢出的生命值转换为护盾能量
                    const overflowHp = effects.hpRestoreAmount;
                    this.shield = Math.min(this.getShieldCap(), this.shield + overflowHp);
                } else {
                    // 当生命值未满时，优先恢复生命值
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + effects.hpRestoreAmount);
                    // 如果恢复生命值后仍有溢出，则将溢出部分转换为护盾能量
                    const overflowHp = Math.max(0, this.player.hp + effects.hpRestoreAmount - this.player.maxHp);
                    if (overflowHp > 0) {
                        this.shield = Math.min(this.getShieldCap(), this.shield + overflowHp);
                    }
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + effects.hpRestoreAmount);
                }
                this.onHpChange(this.player.hp);
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

            case PowerupType.INVINCIBILITY:
                // 无敌时间 - 给玩家5秒无敌时间
                this.player.invulnerable = true;
                this.player.invulnerableTimer = 5000; // 5秒
                break;

            case PowerupType.TIME_SLOW:
                // 时间减缓 - 减缓游戏速度3秒
                this.timeSlowActive = true;
                this.timeSlowTimer = 3000; // 3秒
                this.audio.playSlowMotionEnter();
                break;

            default:
                // Weapon-specific powerups
                const weaponType = effects.weaponTypeMap[type];
                if (weaponType !== undefined && weaponType !== null) {
                    // Unlock weapon when picked up
                    unlockWeapon(weaponType);

                    if (this.weaponType === weaponType) {
                        // Same weapon type - upgrade level
                        {
                            const currentMax = (WeaponConfig[this.weaponType]?.maxLevel ?? effects.maxWeaponLevel);
                            this.weaponLevel = Math.min(currentMax, this.weaponLevel + 1);
                        }

                        // P2 Update synergy system to keep it in sync with current equipment
                        const equippedWeapons = this.secondaryWeapon
                            ? [this.weaponType, this.secondaryWeapon]
                            : [this.weaponType];
                        this.synergySys.updateEquippedWeapons(equippedWeapons);
                    } else {
                        // Different weapon - switch primary
                        // Logic: New weapon becomes Primary. Old Primary becomes Secondary ONLY if it synergizes.
                        // 武器切换逻辑:
                        // 1. 新武器成为主武器,等级重置为1
                        // 2. 旧主武器仅在可协同时保留为副武器,否则丢弃
                        // 3. 旧副武器总是被丢弃
                        const oldPrimary = this.weaponType;
                        const oldWeaponType = this.weaponType;
                        this.weaponType = weaponType;
                        // 判断是否能与旧主武器协同,并一次性处理副武器、装备更新和主武器校正
                        if (this.synergySys.canCombine(this.weaponType, oldPrimary)) {
                            // 可以协同:保留旧主武器为副武器
                            this.secondaryWeapon = oldPrimary;

                            // 更新协同系统装备状态
                            this.synergySys.updateEquippedWeapons([this.weaponType, this.secondaryWeapon]);

                            // 检查协同是否指定了主武器,如果是则校正主副武器位置
                            const activeSynergies = this.synergySys.getActiveSynergies();
                            if (activeSynergies.length > 0) {
                                const synergy = activeSynergies[0];
                                if (synergy.mainWeapon && this.weaponType !== synergy.mainWeapon) {
                                    // 交换主副武器,确保协同的主武器在主武器槽
                                    this.secondaryWeapon = this.weaponType;
                                    this.weaponType = synergy.mainWeapon;
                                }
                            }
                            if (this.weaponType !== oldWeaponType) {
                                // 如果最终主武器没变化，要保留武器等级
                                this.weaponLevel = 1;
                            }
                        } else {
                            // 不能协同:丢弃旧武器
                            this.weaponLevel = 1; // 重置武器等级
                            this.secondaryWeapon = null;
                            this.synergySys.updateEquippedWeapons([this.weaponType]);
                        }
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
        this.difficultySys.recordPowerupDrop();
    }

    createExplosion(x: number, y: number, size: ExplosionSize, color: string) {
        const count = size === ExplosionSize.SMALL ? 8 : 30;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * (size === ExplosionSize.SMALL ? 4 : 10);
            this.particles.push({
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

    private isPlayerColliding(player: Entity, other: Entity): boolean {
        // 获取玩家的碰撞箱收缩比例
        const shrinkFactor = this.playerConfig.hitboxShrink || 0;

        // 计算收缩后的宽度和高度
        const playerWidth = player.width * (1 - shrinkFactor);
        const playerHeight = player.height * (1 - shrinkFactor);

        // 使用收缩后的尺寸进行碰撞检测
        return (
            player.x - playerWidth / 2 < other.x + other.width / 2 &&
            player.x + playerWidth / 2 > other.x - other.width / 2 &&
            player.y - playerHeight / 2 < other.y + other.height / 2 &&
            player.y + playerHeight / 2 > other.y - other.height / 2
        );
    }

    // P3 Helper method to get all equipped weapons for difficulty system
    private getPlayerWeapons(): { type: WeaponType, level: number }[] {
        const weapons = [{ type: this.weaponType, level: this.weaponLevel }];
        if (this.secondaryWeapon) {
            weapons.push({ type: this.secondaryWeapon, level: this.weaponLevel });
        }
        return weapons;
    }

    getShieldCap(): number {
        const base = this.playerConfig.maxShield + this.levelingShieldBonus;
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
        return cap > 0 ? Math.max(0, Math.min(100, Math.round((this.shield / cap) * 100))) : 0;
    }

    draw() {
        const primaryColor = WeaponConfig[this.weaponType]?.color;
        const secondaryColor = this.secondaryWeapon ? WeaponConfig[this.secondaryWeapon]?.color : undefined;
        const canCombine = this.secondaryWeapon ? this.synergySys.canCombine(this.weaponType, this.secondaryWeapon) : false;

        // P2 Calculate synergy information for each powerup
        const powerupSynergyInfo = new Map<Entity, { colors: string[], synergyType: SynergyType }>();
        this.powerups.forEach(powerup => {
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
            this.weaponLevel,
            this.playerLevel,
            [], //this.envSys.getAllElements(), // P2 Pass environment elements
            this.showBossDefeatAnimation,
            this.bossDefeatTimer,
            primaryColor,
            secondaryColor,
            canCombine,
            this.timeSlowActive,
            powerupSynergyInfo,
            this.slowFields,
            this.playerSpeedBoostTimer,
            this.shieldRegenTimer,
            this.plasmaExplosions
        );
    }

    loop(dt: number) {
        this.update(dt);
        this.draw();
    }

    private checkAndApplyLevelUp() {
        const conf = this.playerConfig.leveling;
        if (!conf) return;
        while (this.score >= this.nextLevelScore && this.playerLevel < conf.maxLevel) {
            this.playerLevel += 1;
            this.nextLevelScore *= conf.scoreGrowthFactor;
            this.player.maxHp += conf.bonusesPerLevel.maxHpFlat;
            this.player.hp = this.player.maxHp;
            this.levelingShieldBonus += conf.bonusesPerLevel.maxShieldFlat;
            this.shield = this.getShieldCap();
            const defInc = (conf.bonusesPerLevel.defensePct || 0) / 100;
            const frInc = (conf.bonusesPerLevel.fireRatePct || 0) / 100;
            const dmgInc = (conf.bonusesPerLevel.damagePct || 0) / 100;
            const defCap = (conf.bonusesPerLevel.defensePctMax ?? Number.POSITIVE_INFINITY) / 100;
            const frCap = (conf.bonusesPerLevel.fireRatePctMax ?? Number.POSITIVE_INFINITY) / 100;
            const dmgCap = (conf.bonusesPerLevel.damagePctMax ?? Number.POSITIVE_INFINITY) / 100;
            this.playerDefensePct = Math.min(this.playerDefensePct + defInc, defCap);
            this.playerFireRateBonusPct = Math.min(this.playerFireRateBonusPct + frInc, frCap);
            this.playerDamageBonusPct = Math.min(this.playerDamageBonusPct + dmgInc, dmgCap);
            this.player.hitFlashUntil = Date.now() + 300;
            this.audio.playLevelUp();
        }
    }

    findMissileTarget(missile: Entity): Entity | undefined {
        const potentialTargets: Entity[] = [];

        // 1. Add active enemies
        this.enemies.forEach(e => {
            if (e.hp > 0 && !e.markedForDeletion && (e.incomingMissiles || 0) < 2) {
                potentialTargets.push(e);
            }
        });

        // 2. Add Boss if active
        if (this.boss && this.boss.hp > 0 && !this.boss.markedForDeletion && !this.boss.invulnerable && (this.boss.incomingMissiles || 0) < 2) {
            potentialTargets.push(this.boss);
        }

        // 3. Sort by Priority: Closest -> Lowest HP
        potentialTargets.sort((a, b) => {
            const distA = (a.x - missile.x) ** 2 + (a.y - missile.y) ** 2;
            const distB = (b.x - missile.x) ** 2 + (b.y - missile.y) ** 2;

            if (Math.abs(distA - distB) > 100) { // Epsilon for float comparison (squared distance)
                return distA - distB; // Closest first
            }
            return a.hp - b.hp; // Lowest HP first
        });

        return potentialTargets[0];
    }
}
