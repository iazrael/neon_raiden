import { BulletSizeConfig } from '@/game/config';
import { ASSETS_BASE_PATH } from '@/game/config';
import { BulletType } from '@/types';

export class SpriteGenerator {
    createCanvas(width: number, height: number): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        return { canvas, ctx };
    }

    private loadSVG(path: string, width: number, height: number): HTMLImageElement {
        const img = new Image();
        img.width = width;
        img.height = height;
        img.src = path;
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

        const bg = new Image();
        bg.src = `${ASSETS_BASE_PATH}powerups/powerup_bg.svg`;

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

        const draw = () => {
            ctx.clearRect(0, 0, 40, 40);
            if (bg.complete) {
                ctx.drawImage(bg, 0, 0, 40, 40);

                // Overlay color tint for border if possible, or just stroke rect on top
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.strokeRect(2, 2, 36, 36);
            }

            if (iconSrc) {
                const icon = new Image();
                icon.src = iconSrc;
                if (icon.complete) {
                    // Center icon
                    const iw = 24;
                    const ih = 24;
                    ctx.drawImage(icon, (40 - iw) / 2, (40 - ih) / 2, iw, ih);
                } else {
                    icon.onload = draw;
                }
            } else {
                ctx.fillStyle = color;
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, 20, 22);
            }
        };

        bg.onload = draw;
        // Trigger initial draw in case cached
        draw();

        return canvas;
    }
}

