
// ==================== 游戏基础配置 ====================
export const GameConfig = {
    width: 0,               // 游戏宽度（动态设置）
    height: 0,              // 游戏高度（动态设置）
    maxLevels: 10,          // 最大关卡数
    debug: false,           // 调试模式开关
    debugBossDivisor: 1,    // 调试模式Boss血量除数
};

// ==================== 资源路径配置 ====================
export const ASSETS_BASE_PATH = './assets/sprites/';

// Asset paths
export const ASSETS = {
    BASE_PATH: './assets/sprites/',
    FIGHTERS: {
        player: 'fighters/player.svg',
        option: 'fighters/option.svg',
    },
    BULLETS: {
        laser: 'bullets/bullet_laser.svg',
        magma: 'bullets/bullet_magma.svg',
        missile: 'bullets/bullet_missile.svg',
        plasma: 'bullets/bullet_plasma.svg',
        shuriken: 'bullets/bullet_shuriken.svg',
        tesla: 'bullets/bullet_tesla.svg',
        vulcan: 'bullets/bullet_vulcan.svg',
        wave: 'bullets/bullet_wave.svg',
    },
    ENEMIES: {
        normal: 'enemies/enemy_normal.svg',
        fast: 'enemies/enemy_fast.svg',
        fortress: 'enemies/enemy_fortress.svg',
        gunboat: 'enemies/enemy_gunboat.svg',
        interceptor: 'enemies/enemy_interceptor.svg',
        kamikaze: 'enemies/enemy_kamikaze.svg',
        pulsar: 'enemies/enemy_pulsar.svg',
        stalker: 'enemies/enemy_stalker.svg',
        tank: 'enemies/enemy_tank.svg',
    },
    BOSSES: {
        annihilator: 'bosses/boss_annihilator.svg',
        apocalypse: 'bosses/boss_apocalypse.svg',
        colossus: 'bosses/boss_colossus.svg',
        destroyer: 'bosses/boss_destroyer.svg',
        dominator: 'bosses/boss_dominator.svg',
        guardian: 'bosses/boss_guardian.svg',
        interceptor: 'bosses/boss_interceptor.svg',
        leviathan: 'bosses/boss_leviathan.svg',
        overlord: 'bosses/boss_overlord.svg',
        titan: 'bosses/boss_titan.svg',
    },
};