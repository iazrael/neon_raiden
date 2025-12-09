import { GameState, Entity, Particle, Shockwave, WeaponType, FighterEntity, EntityType } from '../types';
import { ComboState, COMBO_CONFIG } from './systems/ComboSystem';
import { SynergyConfig } from './systems/WeaponSynergySystem';
import { PlayerConfig, PowerupEffects, GameConfig } from './config';

export interface World {
    // Game State
    state: GameState;
    score: number;
    level: number;
    maxLevels: number;
    levelProgress: number;
    maxLevelReached: number;

    // Entities
    player: Entity;
    options: Entity[];
    enemies: Entity[];
    bullets: Entity[];
    enemyBullets: Entity[];
    particles: Particle[];
    shockwaves: Shockwave[];
    powerups: Entity[];
    meteors: { x: number, y: number, length: number, vx: number, vy: number }[];
    boss: Entity | null;
    bossWingmen: Entity[];
    plasmaExplosions: { x: number, y: number, range: number, life: number }[];
    slowFields: { x: number, y: number, range: number, life: number }[];

    // Player Stats
    weaponType: WeaponType;
    secondaryWeapon: WeaponType | null;
    weaponLevel: number;
    bombs: number;
    shield: number;
    playerLevel: number;
    nextLevelScore: number;
    playerDefensePct: number;
    playerFireRateBonusPct: number;
    playerDamageBonusPct: number;
    levelingShieldBonus: number;
    playerConfig: FighterEntity;

    // Timers & Flags
    enemySpawnTimer: number;
    fireTimer: number;
    meteorTimer: number;
    screenShake: number;
    levelStartTime: number;
    regenTimer: number;
    timeSlowActive: boolean;
    timeSlowTimer: number;
    showLevelTransition: boolean;
    isLevelTransitioning: boolean;
    levelTransitionTimer: number;
    isBossWarningActive: boolean;
    bossWarningTimer: number;
    showBossDefeatAnimation: boolean;
    bossDefeatTimer: number;
    debugEnemyKillCount: number;
    debugModeEnabled: boolean;
    alternateFireEnabled: boolean;
    fireAlternateToggle: boolean;
    playerSpeedBoostTimer: number;
    shieldRegenTimer: number;

    // System States
    comboState: ComboState;
    activeSynergies: SynergyConfig[];
}

export interface GameSnapshot {
    t: number;
    state: GameState;
    score: number;
    level: number;
    showLevelTransition: boolean;
    levelTransitionTimer: number;
    maxLevelReached: number;
    showBossWarning: boolean;
    comboState: ComboState;

    player: {
        hp: number;
        maxHp: number;
        x: number;
        y: number;
        bombs: number;
        shieldPercent: number;
        weaponType: WeaponType;
        secondaryWeapon: WeaponType | null;
        weaponLevel: number;
        activeSynergies: SynergyConfig[];
        invulnerable: boolean;
    };

    bullets: Array<{ x: number, y: number, type: string }>;
    enemies: Array<{ x: number, y: number, hp: number, maxHp: number, type: string }>;
    boss: { x: number, y: number, hp: number, maxHp: number, name?: string } | null;
}

export function createWorld(width: number, height: number): World {
    const playerConfig = JSON.parse(JSON.stringify(PlayerConfig));

    // Create initial player (will be reset on startGame)
    const player: Entity = {
        x: width / 2,
        y: height - 100,
        width: playerConfig.size.width,
        height: playerConfig.size.height,
        vx: 0,
        vy: 0,
        speed: playerConfig.speed,
        hp: playerConfig.initialHp,
        maxHp: playerConfig.maxHp,
        type: EntityType.PLAYER,
        color: playerConfig.color,
        markedForDeletion: false,
        spriteKey: 'player'
    };

    return {
        state: GameState.MENU,
        score: 0,
        level: 1,
        maxLevels: GameConfig.maxLevels,
        levelProgress: 0,
        maxLevelReached: 1, // Should be loaded from storage externally and set

        player,
        options: [],
        enemies: [],
        bullets: [],
        enemyBullets: [],
        particles: [],
        shockwaves: [],
        powerups: [],
        meteors: [],
        boss: null,
        bossWingmen: [],
        plasmaExplosions: [],
        slowFields: [],

        weaponType: WeaponType.VULCAN,
        secondaryWeapon: null,
        weaponLevel: 1,
        bombs: 0,
        shield: 0,
        playerLevel: 1,
        nextLevelScore: PlayerConfig.leveling?.baseScoreForLevel1 ?? 1000,
        playerDefensePct: 0,
        playerFireRateBonusPct: 0,
        playerDamageBonusPct: 0,
        levelingShieldBonus: 0,
        playerConfig,

        enemySpawnTimer: 0,
        fireTimer: 0,
        meteorTimer: 0,
        screenShake: 0,
        levelStartTime: 0,
        regenTimer: 0,
        timeSlowActive: false,
        timeSlowTimer: 0,
        showLevelTransition: false,
        isLevelTransitioning: false,
        levelTransitionTimer: 0,
        isBossWarningActive: false,
        bossWarningTimer: 0,
        showBossDefeatAnimation: false,
        bossDefeatTimer: 0,
        debugEnemyKillCount: 0,
        debugModeEnabled: false,
        alternateFireEnabled: false,
        fireAlternateToggle: false,
        playerSpeedBoostTimer: 0,
        shieldRegenTimer: 0,

        comboState: {
            count: 0,
            timer: 0,
            level: 0,
            maxCombo: 0,
            hasBerserk: false
        },
        activeSynergies: []
    };
}

export function snapshot(world: World): GameSnapshot {
    // Calculate shield percent
    const maxShield = 100 + world.levelingShieldBonus; // Base 100 + bonus
    const shieldPercent = Math.min(100, Math.max(0, (world.shield / maxShield) * 100));

    return {
        t: Date.now(),
        state: world.state,
        score: world.score,
        level: world.level,
        showLevelTransition: world.showLevelTransition,
        levelTransitionTimer: world.levelTransitionTimer,
        maxLevelReached: world.maxLevelReached,
        showBossWarning: world.isBossWarningActive,
        comboState: { ...world.comboState },

        player: {
            hp: world.player.hp,
            maxHp: world.player.maxHp,
            x: world.player.x,
            y: world.player.y,
            bombs: world.bombs,
            shieldPercent,
            weaponType: world.weaponType,
            secondaryWeapon: world.secondaryWeapon,
            weaponLevel: world.weaponLevel,
            activeSynergies: [...world.activeSynergies],
            invulnerable: !!world.player.invulnerable
        },

        bullets: world.bullets.map(b => ({
            x: b.x,
            y: b.y,
            type: b.weaponType || 'unknown'
        })),

        enemies: world.enemies.map(e => ({
            x: e.x,
            y: e.y,
            hp: e.hp,
            maxHp: e.maxHp,
            type: e.subType?.toString() || 'unknown'
        })),

        boss: world.boss ? {
            x: world.boss.x,
            y: world.boss.y,
            hp: world.boss.hp,
            maxHp: world.boss.maxHp,
            name: world.boss.name
        } : null
    };
}
