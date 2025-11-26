import { SpriteGenerator } from '@/game/SpriteGenerator';
import { SpriteMap, Entity, Particle, Shockwave, GameState, BulletType } from '@/types';

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

        // Enemies (Types 0-6)
        for (let i = 0; i <= 6; i++) {
            this.sprites[`enemy_${i}`] = this.spriteGen.generateEnemy(i);
        }

        // Bullets
        this.sprites['bullet_vulcan'] = this.spriteGen.generateBullet(BulletType.VULCAN);
        this.sprites['bullet_laser'] = this.spriteGen.generateBullet(BulletType.LASER);
        this.sprites['bullet_missile'] = this.spriteGen.generateBullet(BulletType.MISSILE);
        this.sprites['bullet_wave'] = this.spriteGen.generateBullet(BulletType.WAVE);
        this.sprites['bullet_plasma'] = this.spriteGen.generateBullet(BulletType.PLASMA);
        this.sprites['bullet_enemy'] = this.spriteGen.generateBullet(BulletType.ENEMY_ORB);
        this.sprites['bullet_tesla'] = this.spriteGen.generateBullet(BulletType.TESLA);
        this.sprites['bullet_magma'] = this.spriteGen.generateBullet(BulletType.MAGMA);
        this.sprites['bullet_shuriken'] = this.spriteGen.generateBullet(BulletType.SHURIKEN);

        // Powerups (Types 0-10)
        // Powerups are still generated as Canvas because they combine dynamic text/icons
        for (let i = 0; i <= 10; i++) {
            this.sprites[`powerup_${i}`] = this.spriteGen.generatePowerup(i);
        }

        // Bosses (Levels 1-10)
        for (let i = 1; i <= 10; i++) {
            this.sprites[`boss_${i}`] = this.spriteGen.generateBoss(i);
        }
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
        weaponLevel: number
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
        enemies.forEach(e => this.drawEntity(e));
        if (boss) this.drawEntity(boss);
        bossWingmen.forEach(w => this.drawEntity(w));
        bullets.forEach(b => this.drawEntity(b));
        enemyBullets.forEach(b => this.drawEntity(b));

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

        this.ctx.restore();
    }

    drawEntity(e: Entity, weaponLevel?: number) {
        this.ctx.save();
        this.ctx.translate(Math.round(e.x), Math.round(e.y));

        if (e.type === 'player') {
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
            this.ctx.restore();
        }

        if (e.spriteKey === 'bullet_plasma') {
            this.ctx.rotate(Date.now() / 100);
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
            this.ctx.fillStyle = e.color;
            this.ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
        }

        if (e.type === 'boss') {
            this.ctx.rotate(Math.PI);
            this.ctx.fillStyle = 'rgba(255,0,0,0.5)';
            this.ctx.fillRect(-50, 0, 100, 6);
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(-50, 0, 100 * (e.hp / e.maxHp), 6);
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
}

