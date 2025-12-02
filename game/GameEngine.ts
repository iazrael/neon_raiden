import { AudioSystem } from './systems/AudioSystem';
import { GameState, WeaponType, Particle, Shockwave, Entity, PowerupType, BossType, EnemyType, EntityType, ExplosionSize, FighterEntity } from '@/types';
import { EventBus } from './engine/EventBus';
import { EventPayloads, LevelEventType } from './engine/events';
import { EntityManager } from './engine/EntityManager';
import { FighterFactory } from './engine/FighterFactory';
import { CollisionSystem } from './engine/CollisionSystem';
import { LevelManager } from './engine/LevelManager';
import { BulletSystem } from './systems/BulletSystem';
import { PowerupSystem } from './systems/PowerupSystem';
import { Starfighter } from './entities/Starfighter';
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
    player: Starfighter;
    entityManager: EntityManager;
    tagSys: CombatTag;
    playerSpeedBoostTimer: number = 0;
    shieldRegenTimer: number = 0;

    // Player Stats moved into Starfighter

    // Instance PlayerConfig (deep clone per start)
    playerConfig: FighterEntity = JSON.parse(JSON.stringify(PlayerConfig));

    // Timers
    fireTimer: number = 0;
    meteorTimer: number = 0;
    screenShake: number = 0;
    regenTimer: number = 0;

    // Time Slow Effect
    timeSlowActive: boolean = false;
    timeSlowTimer: number = 0;

    // Level transition
    showLevelTransition: boolean = false;
    levelTransitionTimer: number = 0;

    // Boss Warning
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

    bus: EventBus<EventPayloads>;
    collision: CollisionSystem;
    levelManager: LevelManager;
    bulletSystem: BulletSystem;
    powerupSystem: PowerupSystem;

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
        this.difficultySys = new DifficultySystem();
        this.bossSys = new BossSystem(this.audio, canvas.width, canvas.height, this.difficultySys);
        this.comboSys = new ComboSystem(undefined, (state) => this.onComboChange(state)); // P2 Combo System
        this.synergySys = new WeaponSynergySystem(); // P2 Weapon Synergy System
        this.bossPhaseSys = new BossPhaseSystem(this.audio); // P2 Boss Phase System
        this.eliteAISys = new EliteAISystem(canvas.width, canvas.height); // P3 Elite AI System
        this.tagSys = new CombatTag();
        this.bus = new EventBus<EventPayloads>();
        this.entityManager = new EntityManager();
        this.collision = new CollisionSystem(this.bus, {
            onBulletHit: (b, target) => this.handleBulletHit(b, target),
            onPlayerHit: (player, source) => {
                source.markedForDeletion = true;
                if (source.type === 'enemy') source.hp = 0;
                if (!this.player.invulnerable) this.takeDamage( source.type === EntityType.BOSS ? 1 : 10 );
                this.createExplosion(this.player.x, this.player.y, ExplosionSize.SMALL, '#00ffff');
            },
            onPowerup: (p) => {
                p.markedForDeletion = true;
                this.audio.playPowerUp();
                this.score += 100;
                this.onScoreChange(this.score);
                this.checkAndApplyLevelUp();
                this.applyPowerup(p.subType as PowerupType);
            }
        });
        this.levelManager = new LevelManager(this.bus, GameConfig.debug);
        this.bulletSystem = new BulletSystem();
        this.powerupSystem = new PowerupSystem(this.bus);

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

    get weaponType(): WeaponType { return this.player.weaponPrimary; }
    set weaponType(t: WeaponType) { this.player.weaponPrimary = t; }
    get secondaryWeapon(): WeaponType | null { return this.player.weaponSecondary ?? null; }
    set secondaryWeapon(t: WeaponType | null) { this.player.weaponSecondary = t; }
    get weaponLevel(): number { return this.player.weaponLevel; }
    set weaponLevel(l: number) { this.player.weaponLevel = l; }
    get bombs(): number { return this.player.bombs; }
    set bombs(b: number) { this.player.bombs = b; }
    get shield(): number { return this.player.shield; }
    set shield(s: number) { this.player.shield = s; }
    get enemies(): Entity[] { return this.entityManager.enemies; }
    set enemies(arr: Entity[]) { this.entityManager.enemies = arr; }
    get bullets(): Entity[] { return this.entityManager.bullets; }
    set bullets(arr: Entity[]) { this.entityManager.bullets = arr; }
    get enemyBullets(): Entity[] { return this.entityManager.enemyBullets; }
    set enemyBullets(arr: Entity[]) { this.entityManager.enemyBullets = arr; }
    get powerups(): Entity[] { return this.entityManager.powerups; }
    set powerups(arr: Entity[]) { this.entityManager.powerups = arr; }
    get boss(): Entity | null { return this.entityManager.boss ?? null; }
    set boss(e: Entity | null) { this.entityManager.setBoss(e); }
    get bossWingmen(): Entity[] { return this.entityManager.bossWingmen; }
    set bossWingmen(arr: Entity[]) { this.entityManager.bossWingmen = arr; }
    get slowFields(): { x: number; y: number; range: number; life: number }[] { return this.entityManager.slowFields; }
    set slowFields(arr: { x: number; y: number; range: number; life: number }[]) { this.entityManager.slowFields = arr; }
    get playerLevel(): number { return this.player.level; }
    set playerLevel(v: number) { this.player.level = v; }
    get nextLevelScore(): number { return this.player.nextLevelScore; }
    set nextLevelScore(v: number) { this.player.nextLevelScore = v; }
    get playerDefensePct(): number { return this.player.defenseBonusPct; }
    set playerDefensePct(v: number) { this.player.defenseBonusPct = v; }
    get playerFireRateBonusPct(): number { return this.player.fireRateBonusPct; }
    set playerFireRateBonusPct(v: number) { this.player.fireRateBonusPct = v; }
    get playerDamageBonusPct(): number { return this.player.damageBonusPct; }
    set playerDamageBonusPct(v: number) { this.player.damageBonusPct = v; }
    get levelingShieldBonus(): number { return this.player.levelingShieldBonus; }
    set levelingShieldBonus(v: number) { this.player.levelingShieldBonus = v; }

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
        const p = FighterFactory.createByConfig(this.playerConfig, this.render.width / 2, this.render.height - 100, this.bus);
        return p;
    }

    startGame() {
        this.player = this.createPlayer() as Starfighter;
        this.entityManager.setPlayer(this.player);
        this.state = GameState.PLAYING;
        this.score = 0;
        this.level = 1;
        this.player.weaponLevel = 1;
        this.player.level = 1;
        this.player.nextLevelScore = this.playerConfig.leveling?.baseScoreForLevel1 ?? 1000;
        this.player.defenseBonusPct = 0;
        this.player.fireRateBonusPct = 0;
        this.player.damageBonusPct = 0;
        this.player.levelingShieldBonus = 0;
        this.player.weaponPrimary = WeaponType.VULCAN;
        this.player.equipSecondary(null);
        this.player.bombs = PowerupEffects.initialBombs;
        this.player.shield = 0;
        this.timeSlowActive = false;
        this.timeSlowTimer = 0;
        this.player.shieldRegenTimer = 0;
        resetDropContext();


        this.entityManager.options = [];
        this.entityManager.enemies = [];
        this.entityManager.bullets = [];
        this.entityManager.enemyBullets = [];
        this.entityManager.particles = [];
        this.entityManager.shockwaves = [];
        this.entityManager.powerups = [];
        this.entityManager.meteors = [];
        this.entityManager.setBoss(null);
        this.entityManager.bossWingmen = [];
        this.levelProgress = 0;
        this.screenShake = 0;
        this.showLevelTransition = false;
        this.levelTransitionTimer = 0;
        this.bossWarningTimer = 0;
        this.onBossWarning(false);
        this.showBossDefeatAnimation = false;
        this.bossDefeatTimer = 0;
        this.levelManager.reset(this.level);
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
        this.onBombChange(this.player.bombs);
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

            this.entityManager.enemyBullets = [];
            this.entityManager.enemies.forEach(e => {
                this.createExplosion(e.x, e.y, ExplosionSize.LARGE, e.color);
                e.hp -= PowerupEffects.bombDamage;
                if (e.hp <= 0) {
                    this.killEnemy(e);
                }
            });
            this.onScoreChange(this.score);

            if (this.entityManager.boss) {
                const damage = this.entityManager.boss.maxHp * PowerupEffects.bombDamageToBossPct;
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
        if (this.player.shieldRegenTimer > 0) {
            this.player.shieldRegenTimer -= dt;
            if (this.player.shieldRegenTimer < 0) {
                this.player.shieldRegenTimer = 0;
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
        const kb = this.input.getKeyboardVector();
        const touch = this.input.touch.active ? this.input.getTouchDelta() : { active: false } as any;
        const speedScale = playerTimeScale * (this.playerSpeedBoostTimer > 0 ? 1.1 : 1.0);
        this.player.updatePosition(kb, { active: this.input.touch.active, dx: (touch as any).x, dy: (touch as any).y }, dt, this.render.width, this.render.height, speedScale);

        // Options
        this.entityManager.options.forEach((opt, index) => {
            const targetAngle = (Date.now() / 1000) * 2 + (index * (Math.PI * 2 / this.entityManager.options.length));
            const radius = 60;
            const tx = this.player.x + Math.cos(targetAngle) * radius;
            const ty = this.player.y + Math.sin(targetAngle) * radius;
            opt.x += (tx - opt.x) * 0.2 * timeScale;
            opt.y += (ty - opt.y) * 0.2 * timeScale;
        });

        // Fire
        this.fireTimer += (this.timeSlowActive ? dt * 2 : dt); // Fire rate based on real time
        const baseFireRate = this.weaponSys.getFireRate(this.player.weaponPrimary, this.player.weaponLevel);
        const fireRate = Math.max(50, Math.round(baseFireRate * (1 - this.player.fireRateBonusPct)));
        if (this.fireTimer > fireRate) {
            const isMissileVulcan = this.synergySys.isSynergyActive(SynergyType.MISSILE_VULCAN);
            if (isMissileVulcan) {
                this.weaponSys.firePlayerWeapon(
                    this.player, WeaponType.VULCAN, this.player.weaponLevel,
                    this.entityManager.options, this.entityManager.bullets, this.entityManager.enemies
                );
                this.weaponSys.firePlayerWeapon(
                    this.player, WeaponType.MISSILE, 1,
                    [], this.entityManager.bullets, this.entityManager.enemies
                );
                this.fireTimer = 0;
            } else {
                const canAlt = this.alternateFireEnabled && this.player.weaponSecondary && this.synergySys.canCombine(this.player.weaponPrimary, this.player.weaponSecondary);
                const fireType = canAlt ? (this.fireAlternateToggle ? this.player.weaponSecondary! : this.player.weaponPrimary) : this.player.weaponPrimary;
                this.weaponSys.firePlayerWeapon(
                    this.player, fireType, this.player.weaponLevel,
                    this.entityManager.options, this.entityManager.bullets, this.entityManager.enemies
                );
                if (canAlt) this.fireAlternateToggle = !this.fireAlternateToggle;
                this.fireTimer = 0;
            }
        }

        // Level Logic
        if (!this.entityManager.boss) {
            this.levelManager.update(dt, timeScale);

            // P3 Get dynamic difficulty configuration
            const difficultyConfig = this.difficultySys.getConfig();
            const spawnRate = this.levelManager.getSpawnRateForLevel(difficultyConfig.spawnIntervalMultiplier);
            if (this.levelManager.shouldSpawnEnemy(spawnRate)) {
                const baseEliteChance = EnemyCommonConfig.eliteChance;
                const eliteMod = this.difficultySys.getEliteChanceModifier();
                const effectiveEliteChance = Math.max(0, Math.min(1, baseEliteChance + eliteMod));
                this.enemySys.spawnEnemy(this.level, this.entityManager.enemies, effectiveEliteChance);

                // P3 Check if newly spawned enemy is elite and initialize AI
                const newEnemy = this.entityManager.enemies[this.entityManager.enemies.length - 1];
                if (newEnemy && newEnemy.isElite) {
                    this.eliteAISys.initializeElite(newEnemy, this.entityManager.enemies);
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

            }

            // Spawn boss when both conditions are met:
            // 1. Level progress >= 90%
            // 2. Minimum level duration has passed (60 seconds)
            // 3. Not currently transitioning levels
            if (this.levelManager.trySpawnBoss()) {
                this.onBossWarning(true);
                this.audio.playWarning();
                this.spawnBoss();
            }
        } else {
            // Continue spawning enemies for a short time after boss appears
            const spawnRate = Math.round((EnemyCommonConfig.enemySpawnIntervalByLevel[this.level] || 1000) * EnemyCommonConfig.enemySpawnIntervalInBossMultiplier);
            this.levelManager.enemySpawnTimer += dt;
            if (this.levelManager.shouldSpawnEnemy(spawnRate)) {
                const baseEliteChance = EnemyCommonConfig.eliteChance;
                const eliteMod = this.difficultySys.getEliteChanceModifier();
                const bossFactor = EnemyCommonConfig.eliteChanceBossMultiplier ?? 1.0;
                const effectiveEliteChance = Math.max(0, Math.min(1, (baseEliteChance + eliteMod) * bossFactor));
                this.enemySys.spawnEnemy(this.level, this.entityManager.enemies, effectiveEliteChance);
            }

            this.bossSys.update(this.entityManager.boss, dt, timeScale, this.player, this.entityManager.enemyBullets, this.level);

            // P2 Update boss phase system
            this.bossPhaseSys.update(this.entityManager.boss, dt);

            // Update wingmen
            this.entityManager.bossWingmen.forEach(wingman => {
                wingman.x = this.entityManager.boss!.x + (wingman.x - this.entityManager.boss!.x) * 0.95;
                wingman.y = this.entityManager.boss!.y + 80;
            });
        }

        // Handle boss warning timer countdown (outside boss check so it works after spawn)
        if (this.levelManager.isBossWarningActive) {
            this.bossWarningTimer = this.levelManager.bossWarningTimer;
            if (!this.levelManager.isBossWarningActive) this.onBossWarning(false);
        }

        // Meteors
        this.meteorTimer += dt;
        if (this.meteorTimer > 200) {
            if (Math.random() < 0.1) this.spawnMeteor();
            this.meteorTimer = 0;
        }
        this.entityManager.meteors.forEach(m => {
            m.x += m.vx * timeScale;
            m.y += m.vy * timeScale;
        });
        this.entityManager.meteors = this.entityManager.meteors.filter(m => m.y < this.render.height + 100 && m.x > -100);

        // Updates
        this.updateEntities(this.entityManager.bullets, timeScale, dt);

        // Update player bullets with weapon-specific logic

        this.bulletSystem.updatePlayerBullets(this.entityManager.bullets, this.render.width, this.render.height, dt);

        // Update enemy bullets with homing logic
        this.bulletSystem.updateEnemyBullets(this.entityManager.enemyBullets, this.player, this.entityManager.slowFields, dt, timeScale, this.render.width);

        this.enemySys.update(dt, timeScale, this.entityManager.enemies, this.player, this.entityManager.enemyBullets);

        // Apply slow fields to enemies
        if (this.entityManager.slowFields.length > 0) {
            this.entityManager.enemies.forEach(e => {
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
        this.entityManager.enemies.forEach(e => {
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
        this.entityManager.enemies.forEach(enemy => {
            if (enemy.isElite) {
                this.eliteAISys.update(enemy, dt, this.entityManager.enemies, this.entityManager.enemyBullets, this.player);
            }
        });

        this.updateEntities(this.entityManager.powerups, timeScale, dt);

        // Particles
        this.entityManager.particles.forEach(p => {
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            p.life -= dt;
        });
        this.entityManager.particles = this.entityManager.particles.filter(p => p.life > 0);

        // Shockwaves
        this.entityManager.shockwaves.forEach(s => {
            s.radius += (s.maxRadius - s.radius) * 0.1 * timeScale;
            s.life -= 0.02 * timeScale;
        });
        this.entityManager.shockwaves = this.entityManager.shockwaves.filter(s => s.life > 0);

        this.entityManager.plasmaExplosions.forEach(p => {
            p.life -= dt;
        });
        this.entityManager.plasmaExplosions = this.entityManager.plasmaExplosions.filter(p => p.life > 0);
        this.entityManager.slowFields.forEach(s => { s.life -= dt; });
        this.entityManager.slowFields = this.entityManager.slowFields.filter(s => s.life > 0);

        this.collision.update(this.entityManager.snapshot(), this.playerConfig.hitboxShrink || 0);

        // Cleanup missile tracking counters for deleted bullets
        this.entityManager.bullets.forEach(b => {
            if (b.markedForDeletion && b.weaponType === WeaponType.MISSILE && b.target) {
                if (b.target.incomingMissiles && b.target.incomingMissiles > 0) {
                    b.target.incomingMissiles--;
                }
                b.target = undefined;
            }
        });

        // Clean up
        this.entityManager.bullets = this.entityManager.bullets.filter(e => !e.markedForDeletion && e.y > -100);
        this.entityManager.enemyBullets = this.entityManager.enemyBullets.filter(e => !e.markedForDeletion && e.y < this.render.height + 50 && e.x > -50 && e.x < this.render.width + 50);
        this.entityManager.enemies = this.entityManager.enemies.filter(e => !e.markedForDeletion && e.y < this.render.height + 100);
        this.entityManager.bossWingmen = this.entityManager.bossWingmen.filter(e => !e.markedForDeletion);
        this.entityManager.powerups = this.entityManager.powerups.filter(e => !e.markedForDeletion && e.y < this.render.height + 50);

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

    private updateEnemyBullets(timeScale: number, dt: number) {}

    // 处理导弹追踪目标和特殊武器效果
    private updateBulletsProp(dt: number) {}

    spawnBoss() {
        this.boss = this.bossSys.spawn(this.level, this.render.sprites);
        this.bossWingmen = this.bossSys.spawnWingmen(this.level, this.boss, this.render.sprites);
        this.screenShake = 20;

        // P2 Initialize boss phase system
            if (this.entityManager.boss) {
                this.bossPhaseSys.initializeBoss(this.entityManager.boss, this.entityManager.boss.subType as BossType);
            }
    }

    damageBoss(amount: number) {
        if (!this.entityManager.boss) return;

        // Boss cannot take damage while invulnerable
        if (this.entityManager.boss.invulnerable) {
            return;
        }

        // Boss can only take damage if all wingmen are destroyed
        if (this.entityManager.bossWingmen.length > 0) {
            return;
        }

        this.entityManager.boss.hp -= amount;
        if (this.entityManager.boss.hp <= 0 && !this.entityManager.boss.markedForDeletion) {
            this.killBoss();
        }
    }

    killBoss() {
        if (!this.entityManager.boss) return;
        const bx = this.entityManager.boss.x;
        const by = this.entityManager.boss.y;
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

        this.score += BossConfig[this.entityManager.boss.subType]?.score || (5000 * this.level);
        this.onScoreChange(this.score);
        this.checkAndApplyLevelUp();

        // Boss guaranteed drop
        if (Math.random() < PowerupDropConfig.bossDropRate) {
            this.spawnPowerup(bx, by);
        }

        // Unlock boss when defeated
        unlockBoss(bossLevel);


        // P2 Cleanup boss phase state
        this.bossPhaseSys.cleanupBoss(this.entityManager.boss);

        this.entityManager.setBoss(null);
        this.entityManager.bossWingmen = [];
        this.entityManager.enemyBullets = [];
        this.levelManager.isLevelTransitioning = true;

        setTimeout(() => {
            if (this.level < this.maxLevels) {
                this.level++;
                this.levelProgress = 0;
                this.levelManager.levelStartTime = Date.now();
                this.levelManager.enemySpawnTimer = 0;
                this.onLevelChange(this.level);

                if (this.level > this.maxLevelReached) {
                    this.maxLevelReached = this.level;
                    localStorage.setItem('neon_raiden_max_level', this.maxLevelReached.toString());
                    this.onMaxLevelChange(this.maxLevelReached);
                }

                this.player.hp = this.player.maxHp;
                this.player.shield = this.getShieldCap();
                this.onHpChange(this.player.hp);

                // Show level transition UI
                this.showLevelTransition = true;
                this.levelTransitionTimer = 0;
                this.levelManager.isLevelTransitioning = false;
            } else {
                this.audio.playVictory();
                this.state = GameState.VICTORY;
                this.onStateChange(this.state);
                this.levelManager.isLevelTransitioning = false;
            }
        }, 3000);
    }

    spawnMeteor() {
        const speed = Math.random() * 10 + 10;
        this.entityManager.meteors.push({
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
            enemies: this.entityManager.enemies,
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

            this.entityManager.enemies.forEach(e => {
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

            if (this.entityManager.boss && this.isColliding(b, this.entityManager.boss)) {
                // Only handle collision if boss is not invulnerable
                if (!this.entityManager.boss.invulnerable) {
                    this.handleBulletHit(b, this.entityManager.boss);
                }
            }
        });

        // Enemy Stuff vs Player
        [...this.entityManager.enemyBullets, ...this.entityManager.enemies, ...this.entityManager.bossWingmen].forEach(e => {
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

        if (this.entityManager.boss && this.isPlayerColliding(this.player, this.entityManager.boss)) {
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
        const prevShield = this.player.shield;
        this.player.takeDamage(amount);
        if (prevShield > 0 && this.player.shield === 0) this.audio.playShieldBreak();
        this.screenShake = this.player.shield > 0 ? 5 : 10;
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
            enemies: this.entityManager.enemies,
            player: this.player,
            plasmaExplosions: this.entityManager.plasmaExplosions.map(({ x, y, range }) => ({ x, y, range })),
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
            this.entityManager.plasmaExplosions.push({ x: b.x, y: b.y, range, life: 1200 });
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
        const potentialTargets: Entity[] = [...this.entityManager.enemies];

        // Add boss if it exists and is vulnerable
        if (this.entityManager.boss && !this.entityManager.boss.invulnerable && this.entityManager.boss.hp > 0 && !this.entityManager.boss.markedForDeletion) {
            potentialTargets.push(this.entityManager.boss);
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

        this.entityManager.plasmaExplosions.push({ x, y, range, life: 1200 });

        // P2 Check for TESLA+PLASMA synergy (Plasma Storm)
        const affectedEnemies = this.synergySys.triggerPlasmaStorm(x, y, range, this.entityManager.enemies);

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
            enemies: this.entityManager.enemies,
            player: this.player,
            plasmaExplosions: this.entityManager.plasmaExplosions.map(({ x, y, range }) => ({ x, y, range })),
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

        this.entityManager.enemies.forEach(e => {
            if (Math.hypot(e.x - x, e.y - y) < range) {
                e.hp -= 50;
                if (e.hp <= 0) this.killEnemy(e);
            }
        });
        this.entityManager.enemyBullets.forEach(b => {
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
                const prevHp = this.player.hp;
                const heal = effects.hpRestoreAmount;
                if (prevHp >= this.player.maxHp) {
                    const overflowHp = heal;
                    this.player.shield = Math.min(this.getShieldCap(), this.player.shield + overflowHp);
                } else {
                    const newHp = Math.min(this.player.maxHp, prevHp + heal);
                    const overflowHp = Math.max(0, prevHp + heal - this.player.maxHp);
                    this.player.hp = newHp;
                    if (overflowHp > 0) this.player.shield = Math.min(this.getShieldCap(), this.player.shield + overflowHp);
                }
                this.onHpChange(this.player.hp);
                break;

            case PowerupType.BOMB:
                // Bomb pickup
                if (this.player.bombs < effects.maxBombs) {
                    this.player.bombs++;
                    this.onBombChange(this.player.bombs);
                }
                break;

            case PowerupType.OPTION:
                // Option/僚机 pickup
                if (this.entityManager.options.length < effects.maxOptions) {
                    this.entityManager.options.push({
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

                    if (this.player.weaponPrimary === weaponType) {
                        // Same weapon type - upgrade level
                        {
                            const currentMax = (WeaponConfig[this.player.weaponPrimary]?.maxLevel ?? effects.maxWeaponLevel);
                            this.player.weaponLevel = Math.min(currentMax, this.player.weaponLevel + 1);
                        }

                        // P2 Update synergy system to keep it in sync with current equipment
                        const equippedWeapons = this.player.weaponSecondary
                            ? [this.player.weaponPrimary, this.player.weaponSecondary]
                            : [this.player.weaponPrimary];
                        this.synergySys.updateEquippedWeapons(equippedWeapons);
                    } else {
                        // Different weapon - switch primary
                        // Logic: New weapon becomes Primary. Old Primary becomes Secondary ONLY if it synergizes.
                        // 武器切换逻辑:
                        // 1. 新武器成为主武器,等级重置为1
                        // 2. 旧主武器仅在可协同时保留为副武器,否则丢弃
                        // 3. 旧副武器总是被丢弃
                        const oldPrimary = this.player.weaponPrimary;
                        const oldWeaponType = this.player.weaponPrimary;
                        this.player.weaponPrimary = weaponType;
                        // 判断是否能与旧主武器协同,并一次性处理副武器、装备更新和主武器校正
                        if (this.synergySys.canCombine(this.player.weaponPrimary, oldPrimary)) {
                            // 可以协同:保留旧主武器为副武器
                            this.player.weaponSecondary = oldPrimary;

                            // 更新协同系统装备状态
                            this.synergySys.updateEquippedWeapons([this.player.weaponPrimary, this.player.weaponSecondary]);

                            // 检查协同是否指定了主武器,如果是则校正主副武器位置
                            const activeSynergies = this.synergySys.getActiveSynergies();
                            if (activeSynergies.length > 0) {
                                const synergy = activeSynergies[0];
                                if (synergy.mainWeapon && this.player.weaponPrimary !== synergy.mainWeapon) {
                                    // 交换主副武器,确保协同的主武器在主武器槽
                                    this.player.weaponSecondary = this.player.weaponPrimary;
                                    this.player.weaponPrimary = synergy.mainWeapon;
                                }
                            }
                            if (this.player.weaponPrimary !== oldWeaponType) {
                                
                                this.player.weaponLevel = 1;
                            }
                        } else {
                            // 不能协同:丢弃旧武器
                            this.player.weaponLevel = 1;
                            this.player.weaponSecondary = null;
                            this.synergySys.updateEquippedWeapons([this.player.weaponPrimary]);
                        }
                    }
                }
                break;
        }
    }

    spawnPowerup(x: number, y: number) {
        const type = selectPowerupType();

        this.entityManager.powerups.push({
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
        this.entityManager.particles.push({
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
        this.entityManager.shockwaves.push({
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
        const weapons = [{ type: this.player.weaponPrimary, level: this.player.weaponLevel }];
        if (this.player.weaponSecondary) {
            weapons.push({ type: this.player.weaponSecondary, level: this.player.weaponLevel });
        }
        return weapons;
    }

    getShieldCap(): number {
        const base = this.playerConfig.maxShield + this.player.levelingShieldBonus;
        const state = this.comboSys && typeof this.comboSys.getState === 'function' ? this.comboSys.getState() : { level: 0 } as any;
        const comboLevel = state && typeof state.level === 'number' ? state.level : 0;
        let bonus = 0;
        if (comboLevel >= 2) bonus += 25;
        if (comboLevel >= 3) bonus += 25;
        if (comboLevel >= 4) bonus += 50;
        if (this.synergySys.isSynergyActive(SynergyType.MAGMA_SHURIKEN)) bonus += 10;
        return base + bonus;
    }

    getShieldPercent(): number {
        const cap = this.getShieldCap();
        return cap > 0 ? Math.max(0, Math.min(100, Math.round((this.player.shield / cap) * 100))) : 0;
    }

    draw() {
        const primaryColor = WeaponConfig[this.player.weaponPrimary]?.color;
        const secondaryColor = this.player.weaponSecondary ? WeaponConfig[this.player.weaponSecondary]?.color : undefined;
        const canCombine = this.player.weaponSecondary ? this.synergySys.canCombine(this.player.weaponPrimary, this.player.weaponSecondary) : false;

        // P2 Calculate synergy information for each powerup
        const powerupSynergyInfo = new Map<Entity, { colors: string[], synergyType: SynergyType }>();
        this.entityManager.powerups.forEach(powerup => {
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
            this.entityManager.options,
            this.entityManager.enemies,
            this.entityManager.boss,
            this.entityManager.bossWingmen,
            this.entityManager.bullets,
            this.entityManager.enemyBullets,
            this.entityManager.particles,
            this.entityManager.shockwaves,
            this.entityManager.powerups,
            this.entityManager.meteors,
            this.player.shield,
            this.screenShake,
            this.player.weaponLevel,
            this.player.level,
            [], //this.envSys.getAllElements(), // P2 Pass environment elements
            this.showBossDefeatAnimation,
            this.bossDefeatTimer,
            primaryColor,
            secondaryColor,
            canCombine,
            this.timeSlowActive,
            powerupSynergyInfo,
            this.entityManager.slowFields,
            this.playerSpeedBoostTimer,
            this.player.shieldRegenTimer,
            this.entityManager.plasmaExplosions
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
        this.entityManager.enemies.forEach(e => {
            if (e.hp > 0 && !e.markedForDeletion && (e.incomingMissiles || 0) < 2) {
                potentialTargets.push(e);
            }
        });

        // 2. Add Boss if active
        if (this.entityManager.boss && this.entityManager.boss.hp > 0 && !this.entityManager.boss.markedForDeletion && !this.entityManager.boss.invulnerable && (this.entityManager.boss.incomingMissiles || 0) < 2) {
            potentialTargets.push(this.entityManager.boss);
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
