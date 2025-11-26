import { BulletSizeConfig, ASSETS_BASE_PATH, WeaponConfig, EnemyConfig, BossConfig } from '@/game/config';
import { BulletType, WeaponType } from '@/types';

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

        // Bullets
        const bulletFiles = [
            'bullet_vulcan', 'bullet_laser', 'bullet_missile', 'bullet_wave',
            'bullet_plasma', 'bullet_enemy', 'bullet_tesla', 'bullet_magma', 'bullet_shuriken'
        ];
        bulletFiles.forEach(f => load(`${ASSETS_BASE_PATH}bullets/${f}.svg`));

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
        const sizeConfig = BulletSizeConfig[type] || BulletSizeConfig[BulletType.ENEMY_ORB];
        const w = sizeConfig.width;
        const h = sizeConfig.height;

        // Map types to filenames
        let filename = 'bullet_vulcan';
        switch (type) {
            case BulletType.VULCAN: filename = 'bullet_vulcan'; break;
            case BulletType.LASER: filename = 'bullet_laser'; break;
            case BulletType.MISSILE: filename = 'bullet_missile'; break;
            case BulletType.WAVE: filename = 'bullet_wave'; break;
            case BulletType.PLASMA: filename = 'bullet_plasma'; break;
            case BulletType.ENEMY_ORB: filename = 'bullet_enemy'; break;
            case BulletType.TESLA: filename = 'bullet_tesla'; break;
            case BulletType.MAGMA: filename = 'bullet_magma'; break;
            case BulletType.SHURIKEN: filename = 'bullet_shuriken'; break;
        }

        return this.loadSVG(`${ASSETS_BASE_PATH}bullets/${filename}.svg`, w, h);
    }

    // 生成掉落物，现在包含内部图标
    generatePowerup(type: number): HTMLCanvasElement {
        const { canvas, ctx } = this.createCanvas(40, 40);

        let iconSrc = '';
        let label = '';
        let color = '#fff';

        // 0:Power, 1:Laser, 2:Vulcan, 3:Heal/Shield, 4:Wave, 5:Plasma, 6:Bomb, 7:Option
        switch (type) {
            case 0: color = '#ecc94b'; label = 'P'; break;
            case 1: iconSrc = `${ASSETS_BASE_PATH}bullets/bullet_laser.svg`; break;
            case 2: iconSrc = `${ASSETS_BASE_PATH}bullets/bullet_vulcan.svg`; break;
            case 3: color = '#48bb78'; label = 'H'; break;
            case 4: iconSrc = `${ASSETS_BASE_PATH}bullets/bullet_wave.svg`; break;
            case 5: iconSrc = `${ASSETS_BASE_PATH}bullets/bullet_plasma.svg`; break;
            case 6: color = '#f56565'; label = 'B'; break; // Bomb
            case 7: color = '#a0aec0'; label = 'O'; break; // Option
            case 8: iconSrc = `${ASSETS_BASE_PATH}bullets/bullet_tesla.svg`; break; // Tesla
            case 9: iconSrc = `${ASSETS_BASE_PATH}bullets/bullet_magma.svg`; break; // Magma (Fire)
            case 10: iconSrc = `${ASSETS_BASE_PATH}bullets/bullet_shuriken.svg`; break; // Shuriken
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
            const img = this.loadSVG(iconSrc, 24, 24); // Use loadSVG to get cached image
            const drawIcon = () => {
                ctx.save();
                // Icon size is 24x24, centered
                ctx.drawImage(img, -12, -12, 24, 24);
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
