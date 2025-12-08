// Game configuration constants
export const GAME_CONFIG = {
    maxLevels: 10,          // 最大关卡数
    debug: false,           // 调试模式开关
    debugBossDivisor: 1,    // 调试模式Boss血量除数
};

// Physics constants
export const PHYSICS = {
    HIT_RADIUS: 20,
    BULLET_SPEED: 500,
    PLAYER_SPEED: 300,
};

// ==================== 资源路径配置 ====================
export const BASE_ASSET_PATH = './assets/sprites/';
export const ASSETS = {
    FIGHTERS: {
        player: BASE_ASSET_PATH + 'fighters/player.svg',
        option: BASE_ASSET_PATH + 'fighters/option.svg',
    },
    BULLETS: {
        laser: BASE_ASSET_PATH + 'bullets/bullet_laser.svg',
        magma: BASE_ASSET_PATH + 'bullets/bullet_magma.svg',
        missile: BASE_ASSET_PATH + 'bullets/bullet_missile.svg',
        plasma: BASE_ASSET_PATH + 'bullets/bullet_plasma.svg',
        shuriken: BASE_ASSET_PATH + 'bullets/bullet_shuriken.svg',
        tesla: BASE_ASSET_PATH + 'bullets/bullet_tesla.svg',
        vulcan: BASE_ASSET_PATH + 'bullets/bullet_vulcan.svg',
        wave: BASE_ASSET_PATH + 'bullets/bullet_wave.svg',
    },
    POWERUPS: {
        bomb: BASE_ASSET_PATH + 'powerups/powerup_bomb.svg',
        hp: BASE_ASSET_PATH + 'powerups/powerup_hp.svg',
        invincibility: BASE_ASSET_PATH + 'powerups/powerup_invincibility.svg',
        option: BASE_ASSET_PATH + 'powerups/powerup_option.svg',
        power: BASE_ASSET_PATH + 'powerups/powerup_power.svg',
        timeSlow: BASE_ASSET_PATH + 'powerups/powerup_time_slow.svg',
        // shield: BASE_ASSET_PATH + 'powerups/powerup_shield.svg',
    },
    ENEMIES: {
        normal: BASE_ASSET_PATH + 'enemies/enemy_normal.svg',
        fast: BASE_ASSET_PATH + 'enemies/enemy_fast.svg',
        fortress: BASE_ASSET_PATH + 'enemies/enemy_fortress.svg',
        gunboat: BASE_ASSET_PATH + 'enemies/enemy_gunboat.svg',
        interceptor: BASE_ASSET_PATH + 'enemies/enemy_interceptor.svg',
        kamikaze: BASE_ASSET_PATH + 'enemies/enemy_kamikaze.svg',
        pulsar: BASE_ASSET_PATH + 'enemies/enemy_pulsar.svg',
        stalker: BASE_ASSET_PATH + 'enemies/enemy_stalker.svg',
        tank: BASE_ASSET_PATH + 'enemies/enemy_tank.svg',
        barrage: BASE_ASSET_PATH + 'enemies/enemy_barrage.svg',
        layer: BASE_ASSET_PATH + 'enemies/enemy_layer.svg',
    },
    ENEMIE_BULLETS: {
        orb: BASE_ASSET_PATH + 'bullets/bullet_enemy_orb.png',
        beam: BASE_ASSET_PATH + 'bullets/bullet_enemy_beam.png',
        rapid: BASE_ASSET_PATH + 'bullets/bullet_enemy_rapid.png',
        heavy: BASE_ASSET_PATH + 'bullets/bullet_enemy_heavy.png',
        homing: BASE_ASSET_PATH + 'bullets/bullet_enemy_homing.png',
        spiral: BASE_ASSET_PATH + 'bullets/bullet_enemy_spiral.png',
    },
    BOSSES: {
        annihilator: BASE_ASSET_PATH + 'bosses/boss_annihilator.svg',
        apocalypse: BASE_ASSET_PATH + 'bosses/boss_apocalypse.svg',
        colossus: BASE_ASSET_PATH + 'bosses/boss_colossus.svg',
        destroyer: BASE_ASSET_PATH + 'bosses/boss_destroyer.svg',
        dominator: BASE_ASSET_PATH + 'bosses/boss_dominator.svg',
        guardian: BASE_ASSET_PATH + 'bosses/boss_guardian.svg',
        interceptor: BASE_ASSET_PATH + 'bosses/boss_interceptor.svg',
        leviathan: BASE_ASSET_PATH + 'bosses/boss_leviathan.svg',
        overlord: BASE_ASSET_PATH + 'bosses/boss_overlord.svg',
        titan: BASE_ASSET_PATH + 'bosses/boss_titan.svg',
    },
};