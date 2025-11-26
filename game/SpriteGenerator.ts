import { ASSETS_BASE_PATH, WeaponConfig, BulletToWeaponMap, PowerupToWeaponMap, WEAPON_NAMES, EnemyBulletConfig } from '@/game/config';
import { BulletType, WeaponType, EnemyBulletType } from '@/types';

export class SpriteGenerator {
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

        // Enemies
        for (let i = 0; i <= 6; i++) {
            load(`${ASSETS_BASE_PATH}enemies/enemy_${i}.svg`);
        }

        // Bullets - Player weapons
        Object.values(WeaponConfig).forEach(config => {
            load(`${ASSETS_BASE_PATH}bullets/${config.sprite}.svg`);
        });

        // Bullets - Enemy bullets
        Object.values(EnemyBulletConfig).forEach(config => {
            load(`${ASSETS_BASE_PATH}bullets/${config.sprite}.svg`);
        });

        // Powerups
        // load(`${ASSETS_BASE_PATH}powerups/powerup_bg.svg`); // Removed as we use canvas for bg

        // Bosses
        for (let i = 1; i <= 10; i++) {
            load(`${ASSETS_BASE_PATH}bosses/boss_${i}.svg`);
        }

        await Promise.all(promises);
        console.log('All assets preloaded');
    }

    createCanvas(width: number, height: number): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        return { canvas, ctx };
    }

    private loadSVG(src: string, width: number, height: number): HTMLImageElement {
        if (SpriteGenerator.cache.has(src)) {
            const cached = SpriteGenerator.cache.get(src)!;
            // Return a clone or the same instance?
            // If we return the same instance, width/height might be overwritten if different sizes are requested for same src.
            // But usually src maps to one size.
            // However, to be safe, we can just return the cached image.
            // Canvas drawImage works fine with same image instance.
            // But we need to ensure width/height properties are set if they are used for layout.
            // The cached image has naturalWidth/Height.
            // The `width` and `height` properties on HTMLImageElement are display size.
            // Let's update them just in case.
            cached.width = width;
            cached.height = height;
            return cached;
        }

        const img = new Image();
        img.width = width;
        img.height = height;
        img.src = src;
        // Cache it immediately, though it might not be loaded yet.
        // But better to cache loaded ones.
        // If we use preloadAssets, they should be in cache.
        // If not, we add to cache.
        SpriteGenerator.cache.set(src, img);
        return img;
    }

    // 生成玩家战机 (雷电风格)
    generatePlayer(): HTMLImageElement {
        return this.loadSVG(`${ASSETS_BASE_PATH}fighters/player.svg`, 64, 64);
    }

    // 僚机/浮游炮
    generateOption(): HTMLImageElement {
        return this.loadSVG(`${ASSETS_BASE_PATH}fighters/option.svg`, 32, 32);
    }

    // 生成敌人
    generateEnemy(type: number): HTMLImageElement {
        const size = (type === 2 || type === 4 || type === 6) ? 80 : 48;
        return this.loadSVG(`${ASSETS_BASE_PATH}enemies/enemy_${type}.svg`, size, size);
    }

    // 生成 Boss - Load from external SVG files
    generateBoss(level: number): HTMLImageElement {
        const size = 160 + (level * 20);
        return this.loadSVG(`${ASSETS_BASE_PATH}bosses/boss_${level}.svg`, size, size);
    }

    // 生成子弹
    generateBullet(type: BulletType): HTMLImageElement {
        let w = 32; // Default
        let h = 32;
        let spriteName = `bullet_${type}`;

        // 玩家武器子弹
        const weaponType = BulletToWeaponMap[type];
        if (weaponType !== undefined) {
            const config = WeaponConfig[weaponType];
            w = config.width;
            h = config.height;
            spriteName = config.sprite;
        }
        // 敌人子弹
        else if (type === BulletType.ENEMY_ORB) {
            const config = EnemyBulletConfig[EnemyBulletType.ORB];
            w = config.width;
            h = config.height;
            spriteName = config.sprite;
        }
        else if (type === BulletType.ENEMY_BEAM) {
            const config = EnemyBulletConfig[EnemyBulletType.BEAM];
            w = config.width;
            h = config.height;
            spriteName = config.sprite;
        }

        return this.loadSVG(`${ASSETS_BASE_PATH}bullets/${spriteName}.svg`, w, h);
    }

    // 生成掉落物，现在包含内部图标
    generatePowerup(type: number): HTMLCanvasElement {
        const { canvas, ctx } = this.createCanvas(40, 40);

        let iconSrc = '';
        let label = '';
        let color = '#fff';

        // PowerupType: 0-7 are weapon types (VULCAN, LASER, MISSILE, WAVE, PLASMA, TESLA, MAGMA, SHURIKEN)
        // PowerupType: 100=POWER, 101=HP, 102=BOMB, 103=OPTION
        if (type >= 0 && type <= 7) {
            // Weapon powerups - use bullet sprite
            const weaponType = PowerupToWeaponMap[type]
            const weaponName = WEAPON_NAMES[weaponType]
            iconSrc = `${ASSETS_BASE_PATH}bullets/bullet_${weaponName}.svg`;
        } else {
            // Special powerups
            switch (type) {
                case 100: color = '#ecc94b'; label = 'P'; break; // POWER
                case 101: color = '#48bb78'; label = 'H'; break; // HP
                case 102: color = '#f56565'; label = 'B'; break; // BOMB
                case 103: color = '#a0aec0'; label = 'O'; break; // OPTION
            }
        }

        // Draw Background (Canvas)
        ctx.translate(20, 20);
        ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-15, -15, 30, 30, 5);
        } else {
            ctx.rect(-15, -15, 30, 30); // Fallback
        }
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw Icon or Label
        if (iconSrc) {
            // Get the original dimensions from WeaponConfig
            let originalWidth = 24;
            let originalHeight = 24;

            if (PowerupToWeaponMap[type] !== undefined) {
                const weaponType = PowerupToWeaponMap[type];
                const config = WeaponConfig[weaponType];
                originalWidth = config.width;
                originalHeight = config.height;
            }

            // Calculate scaling to fit within 24x24 while preserving aspect ratio
            const maxSize = 24;
            const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight);
            const scaledWidth = originalWidth * scale;
            const scaledHeight = originalHeight * scale;

            // Load SVG with scaled dimensions
            const img = this.loadSVG(iconSrc, scaledWidth, scaledHeight);
            const drawIcon = () => {
                ctx.save();
                // Draw centered
                ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
                ctx.restore();
            };

            if (img.complete) {
                drawIcon();
            } else {
                img.addEventListener('load', drawIcon);
            }
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
