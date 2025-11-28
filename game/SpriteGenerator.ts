import { ASSETS_BASE_PATH, WeaponConfig, BulletConfigs, PowerupVisuals } from '@/game/config';
import { BulletType, WeaponType, PowerupType, EnemyEntity, BossEntity } from '@/types';
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
    generateEnemy(config: EnemyEntity): HTMLImageElement {
        return this.loadSVG(`${ASSETS_BASE_PATH}enemies/${config.sprite}.svg`, config.size.width, config.size.height);
    }

    // 生成 Boss - Load from external SVG files
    generateBoss(config: BossEntity): HTMLImageElement {
        return this.loadSVG(`${ASSETS_BASE_PATH}bosses/${config.sprite}.svg`, config.size.width, config.size.height);
    }

    // 生成子弹
    generateBullet(type: BulletType): HTMLImageElement {
        let w = 32; // Default
        let h = 32;
        let spriteName = `bullet_${type}`;

        const config = BulletConfigs[type]
        if (config) {
            w = config.size.width;
            h = config.size.height;
            spriteName = config.sprite;
        }
        return this.loadSVG(`${ASSETS_BASE_PATH}bullets/${spriteName}.svg`, w, h);
    }

    // 生成掉落物,现在包含内部图标
    generatePowerup(type: PowerupType): HTMLCanvasElement {
        const { canvas, ctx } = this.createCanvas(40, 40);

        let iconSrc = '';
        let label = '';
        let color = '#fff';

        // Check if it's a weapon powerup
        // PowerupType strings for weapons match WeaponType strings
        const weaponType = type as unknown as WeaponType;
        const weaponConfig = WeaponConfig[weaponType];

        if (weaponConfig) {
            // Weapon powerups
            color = weaponConfig.color;
            // Use bullet sprite as icon
            const spriteName = weaponConfig.sprite;
            iconSrc = `${ASSETS_BASE_PATH}bullets/${spriteName}.svg`;
        } else {
            // Special powerups - use config
            const visualConfig = PowerupVisuals[type];
            if (visualConfig) {
                color = visualConfig.color;
                label = visualConfig.label;
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

            if (weaponConfig && weaponConfig.bullet) {
                originalWidth = weaponConfig.bullet.size.width;
                originalHeight = weaponConfig.bullet.size.height;
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
