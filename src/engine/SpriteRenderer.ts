/**
 * SpriteRenderer - SVG 精灵渲染器
 *
 * 负责加载和缓存 SVG 精灵资源，为渲染系统提供图像支持。
 * 这个类包装了 AssetsLoader，提供更简洁的接口。
 */

import { ASSETS } from './configs/assets';
import { BASE_ASSET_PATH } from './configs/global';

/**
 * 精灵类型枚举
 */
export enum SpriteType {
    // 战斗机
    PLAYER = 'fighters/player',
    OPTION = 'fighters/option',

    // 敌人 - 动态加载
    ENEMY = 'enemies/',
    BOSS = 'bosses/',

    // 子弹
    BULLET = 'bullets/',

    // 环境
    OBSTACLE = 'environment/obstacle',
    ENERGY_STORM = 'environment/energy_storm',
    GRAVITY_FIELD = 'environment/gravity_field',
}

/**
 * 缓存的精灵图像
 */
interface CachedSprite {
    image: HTMLImageElement;
    width: number;
    height: number;
    loaded: boolean;
}

/**
 * SpriteRenderer 类
 */
export class SpriteRenderer {
    private static cache: Map<string, CachedSprite> = new Map();
    private static loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();

    /**
     * 预加载所有游戏资源
     */
    static async preloadAssets(): Promise<void> {
        const spritesToLoad: Array<{ key: string, src: string, w: number, h: number }> = [];

        // ============ 战斗机 ============
        spritesToLoad.push(
            { key: 'player', src: ASSETS.FIGHTERS.player, w: 64, h: 64 },
            { key: 'option', src: ASSETS.FIGHTERS.option, w: 32, h: 32 },
        );

        // ============ 子弹 (玩家) ============
        const bulletTypes: Array<{ key: string; src: string }> = [
            { key: 'bullet_laser', src: ASSETS.BULLETS.laser },
            { key: 'bullet_magma', src: ASSETS.BULLETS.magma },
            { key: 'bullet_missile', src: ASSETS.BULLETS.missile },
            { key: 'bullet_plasma', src: ASSETS.BULLETS.plasma },
            { key: 'bullet_shuriken', src: ASSETS.BULLETS.shuriken },
            { key: 'bullet_tesla', src: ASSETS.BULLETS.tesla },
            { key: 'bullet_vulcan', src: ASSETS.BULLETS.vulcan },
            { key: 'bullet_wave', src: ASSETS.BULLETS.wave },
        ];
        for (const { key, src } of bulletTypes) {
            spritesToLoad.push({ key, src, w: 32, h: 32 });
        }

        // ============ 敌人 ============
        const enemyTypes: Array<{ key: string; src: string }> = [
            { key: 'enemy_normal', src: ASSETS.ENEMIES.normal },
            { key: 'enemy_fast', src: ASSETS.ENEMIES.fast },
            { key: 'enemy_fortress', src: ASSETS.ENEMIES.fortress },
            { key: 'enemy_gunboat', src: ASSETS.ENEMIES.gunboat },
            { key: 'enemy_interceptor', src: ASSETS.ENEMIES.interceptor },
            { key: 'enemy_kamikaze', src: ASSETS.ENEMIES.kamikaze },
            { key: 'enemy_pulsar', src: ASSETS.ENEMIES.pulsar },
            { key: 'enemy_stalker', src: ASSETS.ENEMIES.stalker },
            { key: 'enemy_tank', src: ASSETS.ENEMIES.tank },
            { key: 'enemy_barrage', src: ASSETS.ENEMIES.barrage },
            { key: 'enemy_layer', src: ASSETS.ENEMIES.layer },
        ];
        for (const { key, src } of enemyTypes) {
            spritesToLoad.push({ key, src, w: 48, h: 48 });
        }

        // ============ Boss ============
        const bossTypes: Array<{ key: string; src: string }> = [
            { key: 'boss_guardian', src: ASSETS.BOSSES.guardian },
            { key: 'boss_interceptor', src: ASSETS.BOSSES.interceptor },
            { key: 'boss_destroyer', src: ASSETS.BOSSES.destroyer },
            { key: 'boss_dominator', src: ASSETS.BOSSES.dominator },
            { key: 'boss_overlord', src: ASSETS.BOSSES.overlord },
            { key: 'boss_titan', src: ASSETS.BOSSES.titan },
            { key: 'boss_colossus', src: ASSETS.BOSSES.colossus },
            { key: 'boss_leviathan', src: ASSETS.BOSSES.leviathan },
            { key: 'boss_annihilator', src: ASSETS.BOSSES.annihilator },
            { key: 'boss_apocalypse', src: ASSETS.BOSSES.apocalypse },
        ];
        for (const { key, src } of bossTypes) {
            spritesToLoad.push({ key, src, w: 128, h: 128 });
        }

        // ============ 敌人子弹 ============
        const enemyBulletTypes: Array<{ key: string; src: string }> = [
            { key: 'bullet_enemy_orb', src: ASSETS.ENEMIE_BULLETS.orb },
            { key: 'bullet_enemy_beam', src: ASSETS.ENEMIE_BULLETS.beam },
            { key: 'bullet_enemy_rapid', src: ASSETS.ENEMIE_BULLETS.rapid },
            { key: 'bullet_enemy_heavy', src: ASSETS.ENEMIE_BULLETS.heavy },
            { key: 'bullet_enemy_homing', src: ASSETS.ENEMIE_BULLETS.homing },
            { key: 'bullet_enemy_spiral', src: ASSETS.ENEMIE_BULLETS.spiral },
        ];
        for (const { key, src } of enemyBulletTypes) {
            spritesToLoad.push({ key, src, w: 32, h: 32 });
        }

        // 并行加载所有资源
        const promises = spritesToLoad.map(({ key, src, w, h }) =>
            this.loadSprite(key, src, w, h)
        );

        await Promise.all(promises);
        console.log('[SpriteRenderer] All assets preloaded:', spritesToLoad.length);
    }

    /**
     * 加载单个精灵
     */
    private static loadSprite(
        key: string,
        src: string,
        width: number,
        height: number
    ): Promise<HTMLImageElement> {
        // 检查是否已在加载中
        if (this.loadingPromises.has(key)) {
            return this.loadingPromises.get(key)!;
        }

        // 检查缓存
        if (this.cache.has(key)) {
            const cached = this.cache.get(key)!;
            if (cached.loaded) {
                return Promise.resolve(cached.image);
            }
        }

        // 创建新的加载 Promise
        const promise = new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.width = width;
            img.height = height;

            img.onload = () => {
                this.cache.set(key, { image: img, width, height, loaded: true });
                this.loadingPromises.delete(key);
                resolve(img);
            };

            img.onerror = () => {
                console.warn(`[SpriteRenderer] Failed to load: ${src}`);
                this.loadingPromises.delete(key);
                // 返回一个占位图像
                resolve(img);
            };

            img.src = src;
        });

        this.loadingPromises.set(key, promise);
        return promise;
    }

    /**
     * 获取缓存的精灵
     */
    static getSprite(key: string): CachedSprite | undefined {
        return this.cache.get(key);
    }

    /**
     * 获取精灵图像
     */
    static getImage(key: string): HTMLImageElement | undefined {
        return this.cache.get(key)?.image;
    }

    /**
     * 动态加载敌人精灵
     */
    static loadEnemySprite(spriteName: string, width: number, height: number): HTMLImageElement {
        const key = `enemy_${spriteName}`;
        let cached = this.cache.get(key);

        if (!cached) {
            const img = new Image();
            img.width = width;
            img.height = height;
            img.src = `${BASE_ASSET_PATH}enemies/${spriteName}.svg`;
            cached = { image: img, width, height, loaded: false };
            this.cache.set(key, cached);
        }

        return cached.image;
    }

    /**
     * 动态加载 Boss 精灵
     */
    static loadBossSprite(spriteName: string, width: number, height: number): HTMLImageElement {
        const key = `boss_${spriteName}`;
        let cached = this.cache.get(key);

        if (!cached) {
            const img = new Image();
            img.width = width;
            img.height = height;
            img.src = `${BASE_ASSET_PATH}bosses/${spriteName}.svg`;
            cached = { image: img, width, height, loaded: false };
            this.cache.set(key, cached);
        }

        return cached.image;
    }

    /**
     * 动态加载子弹精灵
     */
    static loadBulletSprite(spriteName: string, width: number, height: number): HTMLImageElement {
        const key = `bullet_${spriteName}`;
        let cached = this.cache.get(key);

        if (!cached) {
            const img = new Image();
            img.width = width;
            img.height = height;
            img.src = `${BASE_ASSET_PATH}bullets/${spriteName}.svg`;
            cached = { image: img, width, height, loaded: false };
            this.cache.set(key, cached);
        }

        return cached.image;
    }

    /**
     * 创建道具 Canvas (动态生成)
     */
    static createPowerupCanvas(
        type: string,
        color: string,
        label: string,
        iconSrc?: string
    ): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d')!;

        ctx.translate(20, 20);

        // 背景
        ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-15, -15, 30, 30, 5);
        } else {
            ctx.rect(-15, -15, 30, 30);
        }
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // 图标或标签
        if (iconSrc) {
            const img = new Image();
            img.src = iconSrc;
            const size = 24;
            ctx.drawImage(img, -size / 2, -size / 2, size, size);
        } else {
            ctx.fillStyle = color;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, 0, 1);
        }

        return canvas;
    }
}

/**
 * 导出 CachedSprite 类型
 */
export type { CachedSprite };
