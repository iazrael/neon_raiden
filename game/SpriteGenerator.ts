import { ASSETS_BASE_PATH, WeaponConfig, BulletToWeaponMap, PowerupToWeaponMap, WEAPON_NAMES, EnemyBulletConfig } from '@/game/config';
import { BulletType, WeaponType, EnemyBulletType } from '@/types';
import { AssetsLoader } from './AssetsLoader';

export class SpriteGenerator {
    // Delegate to AssetsLoader
    static async preloadAssets(): Promise<void> {
        return AssetsLoader.preloadAssets();
    }

    // Get cached asset
    static getAsset(src: string): HTMLImageElement | undefined {
        return AssetsLoader.getAsset(src);
    }

    createCanvas(width: number, height: number): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        return { canvas, ctx };
    }

    private loadSVG(src: string, width: number, height: number): HTMLImageElement {
        return AssetsLoader.loadSVG(src, width, height);
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
            // Weapon powerups - use bullet sprite and weapon color
            const weaponType = PowerupToWeaponMap[type]
            const weaponName = WEAPON_NAMES[weaponType]
            const weaponConfig = WeaponConfig[weaponType];
            color = weaponConfig.color;  // Use weapon's color for the border
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
