import { SpriteGenerator } from '@/game/SpriteGenerator';
import { SpriteMap, Entity, Particle, Shockwave, GameState, BulletType, EnemyType, PowerupType, WeaponType, EntityType } from '@/types';
import { BossConfig, EnemyConfig } from '../config';
import { EnvironmentElement, EnvironmentType } from './EnvironmentSystem';

export class RenderSystem {
    ctx: CanvasRenderingContext2D;
    width: number = 0;
    height: number = 0;
    sprites: SpriteMap = {};
    spriteGen: SpriteGenerator;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d', { alpha: false })!;
        this.spriteGen = new SpriteGenerator();
        this.loadAssets();
    }

    loadAssets() {
        // Sprites
        this.sprites['player'] = this.spriteGen.generatePlayer();
        this.sprites['option'] = this.spriteGen.generateOption();

        // Enemies
        Object.values(EnemyConfig).forEach(config => {
            this.sprites[`enemy_${config.type}`] = this.spriteGen.generateEnemy(config);
        });

        // Bullets
        Object.values(BulletType).forEach(type => {
            this.sprites[`bullet_${type}`] = this.spriteGen.generateBullet(type);
        })

        // Powerups
        Object.values(PowerupType).forEach(type => {
            this.sprites[`powerup_${type}`] = this.spriteGen.generatePowerup(type);
        });

        // Bosses (Levels 1-10)
        Object.values(BossConfig).forEach(config => {
            this.sprites[`boss_${config.type}`] = this.spriteGen.generateBoss(config);
        });
    }

    resize(width: number, height: number) {
        const dpr = window.devicePixelRatio || 1;
        this.width = width;
        this.height = height;
        this.ctx.canvas.width = this.width * dpr;
        this.ctx.canvas.height = this.height * dpr;
        this.ctx.canvas.style.width = `${this.width}px`;
        this.ctx.canvas.style.height = `${this.height}px`;
        this.ctx.scale(dpr, dpr);
    }

    draw(
        gameState: GameState,
        player: Entity,
        options: Entity[],
        enemies: Entity[],
        boss: Entity | null,
        bossWingmen: Entity[],
        bullets: Entity[],
        enemyBullets: Entity[],
        particles: Particle[],
        shockwaves: Shockwave[],
        powerups: Entity[],
        meteors: any[],
        shield: number,
        screenShake: number,
        weaponLevel: number,
        environmentElements: EnvironmentElement[] = [], // P2 Environment elements
        showBossDefeatAnimation: boolean = false,
        bossDefeatTimer: number = 0
    ) {
        this.ctx.save();

        if (screenShake > 0) {
            const sx = (Math.random() - 0.5) * screenShake;
            const sy = (Math.random() - 0.5) * screenShake;
            this.ctx.translate(sx, sy);
        }

        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Dynamic Starfield
        const t = Date.now() / 1000;

        // Distant stars
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 50; i++) {
            const sx = (i * 137) % this.width;
            const sy = (i * 97 + t * 20) % this.height;
            this.ctx.beginPath();
            this.ctx.rect(sx, sy, 1, 1);
            this.ctx.fill();
        }

        // Close stars
        this.ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
        for (let i = 0; i < 30; i++) {
            const speed = (i % 3) + 2;
            const sx = (i * 57) % this.width;
            const sy = (i * 31 + t * 60 * speed) % this.height;
            this.ctx.beginPath();
            this.ctx.arc(sx, sy, Math.random() * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Meteors
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        meteors.forEach(m => {
            this.ctx.beginPath();
            this.ctx.moveTo(m.x, m.y);
            this.ctx.lineTo(m.x - m.vx * 5, m.y - m.vy * 5); // Trail
            this.ctx.stroke();
        });

        if (gameState !== GameState.MENU) {
            if (gameState !== GameState.GAME_OVER) {
                this.drawEntity(player, weaponLevel);
                // Draw Shield
                if (shield > 0) {
                    this.ctx.save();
                    this.ctx.translate(player.x, player.y);
                    this.ctx.strokeStyle = `rgba(0, 255, 255, ${Math.min(1, shield / 50)})`;
                    this.ctx.lineWidth = 3;
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowColor = '#00ffff';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 40, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.restore();
                }

                // Draw Options
                options.forEach(opt => this.drawEntity(opt));
            }

            powerups.forEach(p => this.drawEntity(p));

            // P2 Draw environment elements
            environmentElements.forEach(elem => this.drawEnvironmentElement(elem));

            enemies.forEach(e => this.drawEntity(e));
            if (boss) this.drawEntity(boss);
            bossWingmen.forEach(w => this.drawEntity(w));
            bullets.forEach(b => this.drawEntity(b));
            enemyBullets.forEach(b => this.drawEntity(b));
        }

        // Particles
        this.ctx.globalCompositeOperation = 'lighter';
        particles.forEach(p => {
            this.ctx.globalAlpha = p.life / p.maxLife;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Shockwaves
        this.ctx.globalCompositeOperation = 'source-over';

        shockwaves.forEach(s => {
            this.ctx.globalAlpha = s.life;
            this.ctx.lineWidth = s.width || 5;
            this.ctx.strokeStyle = s.color;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            this.ctx.stroke();
        });

        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'source-over';

        // Draw Boss Defeat Animation
        if (showBossDefeatAnimation) {
            this.ctx.save();
            // Fade out based on timer (3000ms to 0)
            const alpha = Math.min(1, bossDefeatTimer / 1000);
            this.ctx.globalAlpha = alpha;

            this.ctx.fillStyle = '#ffd700'; // Gold
            this.ctx.font = 'bold 48px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = '#ffaa00';
            this.ctx.shadowBlur = 20;

            // Scale effect
            const scale = 1 + Math.sin(Date.now() / 200) * 0.1;
            this.ctx.translate(this.width / 2, this.height / 2);
            this.ctx.scale(scale, scale);

            this.ctx.fillText('DEFEATED', 0, 0);
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    drawEntity(e: Entity, weaponLevel?: number) {
        this.ctx.save();
        this.ctx.translate(Math.round(e.x), Math.round(e.y));

        if (e.type === EntityType.PLAYER) {
            const bankAngle = Math.max(-0.3, Math.min(0.3, (e.vx || 0) * 0.05));
            this.ctx.rotate(bankAngle);

            // Engine flame
            this.ctx.fillStyle = `rgba(0, 255, 255, ${Math.random() * 0.5 + 0.2})`;
            this.ctx.beginPath();
            this.ctx.moveTo(-5, 25);
            this.ctx.lineTo(5, 25);
            this.ctx.lineTo(0, 40 + Math.random() * 10);
            this.ctx.lineTo(0, 40 + Math.random() * 10);
            this.ctx.fill();

            // Draw Weapon Level
            this.ctx.save();
            this.ctx.rotate(-bankAngle); // Cancel rotation for text
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = 'bold 12px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 5;
            this.ctx.fillText(`LV.${weaponLevel || 1}`, 0, -50);
            this.ctx.globalAlpha = 1.0;
            this.ctx.globalCompositeOperation = 'source-over';



            this.ctx.restore();
        }

        if (e.spriteKey === 'bullet_plasma') {
            this.ctx.rotate(Date.now() / 100);
        }

        // Enemy spiral bullet self-rotation animation
        if (e.spriteKey === 'bullet_enemy_spiral') {
            this.ctx.rotate(Date.now() / 80); // Slightly faster rotation for spiral effect
        }

        if (e.angle) {
            this.ctx.rotate(e.angle);
        }

        if (e.spriteKey && this.sprites[e.spriteKey]) {
            const sprite = this.sprites[e.spriteKey];
            if (sprite instanceof HTMLImageElement) {
                if (sprite.complete && sprite.naturalWidth > 0) {
                    // Use intrinsic size or entity size?
                    // Usually entity size is logical size.
                    // If we want to scale sprite to entity size:
                    this.ctx.drawImage(sprite, -e.width / 2, -e.height / 2, e.width, e.height);
                } else {
                    // Not loaded yet
                }
            } else {
                // Canvas
                this.ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
            }
        } else {
            // console.warn(`Unknown sprite key: ${e.spriteKey}`,e);
            this.ctx.fillStyle = e.color;
            this.ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
        }

        if (e.type === EntityType.BOSS) {
            this.ctx.rotate(Math.PI);
            this.ctx.fillStyle = 'rgba(255,0,0,0.5)';
            this.ctx.fillRect(-50, 0, 100, 6);
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(-50, 0, 100 * (e.hp / e.maxHp), 6);

            // P1 Boss Invulnerability Visual Indicator
            if (e.invulnerable) {
                const t = Date.now() / 200;
                const alpha = 0.5 + Math.sin(t) * 0.3; // Pulsing alpha

                // Outer glow
                this.ctx.shadowColor = '#ffd700'; // Gold
                this.ctx.shadowBlur = 20 + Math.sin(t) * 10;

                // Draw golden border
                this.ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
                this.ctx.lineWidth = 3;

                // Draw a circle or rectangle depending on sprite shape? 
                // Using a slightly larger rectangle for now to encompass the sprite
                // Ideally we'd use the sprite's actual shape, but a bounding box is safer
                const borderPadding = 10;
                this.ctx.strokeRect(
                    -e.width / 2 - borderPadding,
                    -e.height / 2 - borderPadding,
                    e.width + borderPadding * 2,
                    e.height + borderPadding * 2
                );

                // Reset shadow
                this.ctx.shadowBlur = 0;
            }
        }

        // Elite Visual Effect
        if (e.isElite) {
            this.ctx.globalCompositeOperation = 'overlay';
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`; // Flashing Gold
            this.ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
            this.ctx.globalCompositeOperation = 'source-over';

            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(-e.width / 2, -e.height / 2, e.width, e.height);
        }
        this.ctx.restore();
    }

    /**
     * P2 Draw environment element
     */
    drawEnvironmentElement(elem: EnvironmentElement) {
        this.ctx.save();

        switch (elem.environmentType) {
            case EnvironmentType.OBSTACLE:
                // Draw obstacle as gray metallic block
                this.ctx.translate(elem.x, elem.y);
                this.ctx.fillStyle = elem.color;
                this.ctx.fillRect(-elem.width / 2, -elem.height / 2, elem.width, elem.height);

                // Metallic shine effect
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.fillRect(-elem.width / 2, -elem.height / 2, elem.width / 3, elem.height);

                // HP bar
                const hpPercent = elem.hp / elem.maxHp;
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                this.ctx.fillRect(-elem.width / 2, -elem.height / 2 - 8, elem.width, 4);
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillRect(-elem.width / 2, -elem.height / 2 - 8, elem.width * hpPercent, 4);
                break;

            case EnvironmentType.ENERGY_STORM:
                // Draw energy storm as animated green band
                this.ctx.translate(elem.x, elem.y);
                const alpha = 0.3 + Math.sin(Date.now() / 200) * 0.15;
                this.ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`;
                this.ctx.fillRect(-elem.width / 2, -elem.height / 2, elem.width, elem.height);

                // Energy waves
                this.ctx.strokeStyle = `rgba(74, 222, 128, ${alpha + 0.2})`;
                this.ctx.lineWidth = 2;
                const waveOffset = (Date.now() / 50) % 30;
                for (let i = -elem.width / 2; i < elem.width / 2; i += 30) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(i + waveOffset, -elem.height / 2);
                    this.ctx.lineTo(i + waveOffset, elem.height / 2);
                    this.ctx.stroke();
                }
                break;

            case EnvironmentType.GRAVITY_FIELD:
                // Draw gravity field as purple translucent zone
                this.ctx.translate(elem.x, elem.y);
                const gravityAlpha = 0.2 + Math.sin(Date.now() / 300) * 0.1;
                this.ctx.fillStyle = `rgba(139, 92, 246, ${gravityAlpha})`;
                this.ctx.fillRect(-elem.width / 2, -elem.height / 2, elem.width, elem.height);

                // Gravity particles
                const side = elem.data?.side || 'left';
                const pullDirection = side === 'left' ? 1 : -1;
                this.ctx.fillStyle = `rgba(139, 92, 246, 0.6)`;
                for (let i = 0; i < 10; i++) {
                    const t = (Date.now() / 1000 + i * 0.3) % 2;
                    const x = pullDirection * (elem.width / 2 - t * elem.width / 2);
                    const y = (i - 5) * (elem.height / 10);
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                break;
        }

        this.ctx.restore();
    }
}

