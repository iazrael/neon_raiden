import { ASSETS_BASE_PATH, EnemyConfig, BossConfig, BulletConfigs } from './config';

export class AssetsLoader {
    private static cache: Map<string, HTMLImageElement> = new Map();

    // Preload all assets
    static async preloadAssets(): Promise<void> {
        const promises: Promise<void>[] = [];

        const load = (src: string) => {
            if (this.cache.has(src)) return;
            const img = new Image();
            img.src = src;
            this.cache.set(src, img); // Cache immediately
            const p = new Promise<void>((resolve, reject) => {
                if (img.complete) {
                    resolve();
                } else {
                    img.onload = () => resolve();
                    img.onerror = () => {
                        console.warn(`Failed to load asset: ${src}`);
                        resolve();
                    };
                }
            });
            promises.push(p);
        };

        // Fighters
        load(`${ASSETS_BASE_PATH}fighters/player.svg`);
        load(`${ASSETS_BASE_PATH}fighters/option.svg`);

        // Enemies (0-10: all enemy types)
        // 遍历 EnemyConfig
        Object.values(EnemyConfig).forEach(config => {
            load(`${ASSETS_BASE_PATH}enemies/${config.sprite}.svg`);
        });

        // Bullets
        Object.values(BulletConfigs).forEach(config => {
            load(`${ASSETS_BASE_PATH}bullets/${config.sprite}.svg`);
        });

        // Bosses
        Object.values(BossConfig).forEach(config => {
            load(`${ASSETS_BASE_PATH}bosses/${config.sprite}.svg`);
        });

        load(`${ASSETS_BASE_PATH}environment/obstacle.svg`);
        load(`${ASSETS_BASE_PATH}environment/energy_storm.svg`);
        load(`${ASSETS_BASE_PATH}environment/gravity_field.svg`);

        // Powerup icons
        load(`${ASSETS_BASE_PATH}powerups/invincibility.svg`);
        load(`${ASSETS_BASE_PATH}powerups/time_slow.svg`);
        load(`${ASSETS_BASE_PATH}powerups/power.svg`);
        load(`${ASSETS_BASE_PATH}powerups/hp.svg`);
        load(`${ASSETS_BASE_PATH}powerups/bomb.svg`);
        load(`${ASSETS_BASE_PATH}powerups/option.svg`);

        await Promise.all(promises);
        console.log('All assets preloaded');
    }

    static getAsset(src: string): HTMLImageElement | undefined {
        return this.cache.get(src);
    }

    static loadSVG(src: string, width: number, height: number): HTMLImageElement {
        if (this.cache.has(src)) {
            const cached = this.cache.get(src)!;
            // Update display size properties just in case, though naturalWidth/Height are fixed
            cached.width = width;
            cached.height = height;
            return cached;
        }

        const img = new Image();
        img.width = width;
        img.height = height;
        img.src = src;
        this.cache.set(src, img);
        return img;
    }
}
