/**
 * SpriteRenderer - SVG 精灵渲染器
 *
 * 负责加载和缓存 SVG 精灵资源，为渲染系统提供图像支持。
 * 这个类包装了 AssetsLoader，提供更简洁的接口。
 */

import { ASSETS_BASE_PATH } from '@/game/config';

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
        const spritesToLoad: Array<{ key: string, src: string, w: number, h: number }> = [
            { key: 'player', src: `${ASSETS_BASE_PATH}fighters/player.svg`, w: 64, h: 64 },
            { key: 'option', src: `${ASSETS_BASE_PATH}fighters/option.svg`, w: 32, h: 32 },
            { key: 'obstacle', src: `${ASSETS_BASE_PATH}environment/obstacle.svg`, w: 60, h: 80 },
            { key: 'energy_storm', src: `${ASSETS_BASE_PATH}environment/energy_storm.svg`, w: 600, h: 120 },
            { key: 'gravity_field', src: `${ASSETS_BASE_PATH}environment/gravity_field.svg`, w: 220, h: 600 },
        ];

        // 加载敌人
        const enemyTypes = ['drone', 'fighter', 'bomber', 'interceptor', 'cruiser'];
        for (const type of enemyTypes) {
            spritesToLoad.push({
                key: `enemy_${type}`,
                src: `${ASSETS_BASE_PATH}enemies/${type}.svg`,
                w: 48,
                h: 48
            });
        }

        // 加载 Boss
        const bossTypes = ['guardian', 'destroyer', 'titan', 'phoenix'];
        for (const type of bossTypes) {
            spritesToLoad.push({
                key: `boss_${type}`,
                src: `${ASSETS_BASE_PATH}bosses/${type}.svg`,
                w: 128,
                h: 128
            });
        }

        // 加载子弹
        const bulletTypes = ['vulcan', 'laser', 'missile', 'wave', 'plasma', 'tesla', 'magma', 'shuriken'];
        for (const type of bulletTypes) {
            spritesToLoad.push({
                key: `bullet_${type}`,
                src: `${ASSETS_BASE_PATH}bullets/bullet_${type}.svg`,
                w: 32,
                h: 32
            });
        }

        // 并行加载所有资源
        const promises = spritesToLoad.map(({ key, src, w, h }) =>
            this.loadSprite(key, src, w, h)
        );

        await Promise.all(promises);
        console.log('[SpriteRenderer] All assets preloaded');
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
            img.src = `${ASSETS_BASE_PATH}enemies/${spriteName}.svg`;
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
            img.src = `${ASSETS_BASE_PATH}bosses/${spriteName}.svg`;
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
            img.src = `${ASSETS_BASE_PATH}bullets/${spriteName}.svg`;
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
