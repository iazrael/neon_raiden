import { Entity, SpriteMap } from '@/types';
import { BossConfig } from '@/game/config';
import { AudioSystem } from '@/game/AudioSystem';

export class BossSystem {
    audio: AudioSystem;
    width: number = 0;
    height: number = 0;
    laserTimer: number = 0;
    movementTimer: number = 0;

    constructor(audio: AudioSystem, width: number, height: number) {
        this.audio = audio;
        this.width = width;
        this.height = height;
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    spawn(level: number, sprites: SpriteMap): Entity {
        const config = BossConfig[level as keyof typeof BossConfig];
        const hp = config.hp;
        const sprite = sprites[`boss_${level}`];
        const width = sprite ? sprite.width : 150;
        const height = sprite ? sprite.height : 150;

        // Determine spawn X position based on config
        let spawnX: number;
        if (config.spawnX === 'center') {
            spawnX = this.width / 2;
        } else if (config.spawnX === 'left') {
            spawnX = this.width * 0.3;
        } else if (config.spawnX === 'right') {
            spawnX = this.width * 0.7;
        } else { // 'random'
            spawnX = this.width * (0.25 + Math.random() * 0.5);
        }

        this.audio.playPowerUp(); // Alarm sound
        this.laserTimer = 0;
        this.movementTimer = 0;

        // Apply hitbox scaling for more precise collision detection
        const hitboxScale = config.hitboxScale || 1.0;

        return {
            x: spawnX,
            y: -150,
            width: width * config.size * hitboxScale,
            height: height * config.size * hitboxScale,
            vx: 0,
            vy: config.speed,
            hp: hp,
            maxHp: hp,
            type: 'boss',
            color: '#ffffff',
            markedForDeletion: false,
            angle: 0,
            spriteKey: `boss_${level}`,
            state: 0 // 0: entering, 1: fighting
        };
    }

    spawnWingmen(level: number, boss: Entity, sprites: SpriteMap): Entity[] {
        const config = BossConfig[level as keyof typeof BossConfig];
        const wingmen: Entity[] = [];

        for (let i = 0; i < config.wingmenCount; i++) {
            const offsetX = (i === 0 ? -1 : 1) * 120;
            const wingman: Entity = {
                x: boss.x + offsetX,
                y: boss.y + 80,
                width: 50,
                height: 50,
                vx: 0,
                vy: 0,
                hp: 300,
                maxHp: 300,
                type: 'enemy',
                subType: config.wingmenType,
                color: '#ff00ff',
                markedForDeletion: false,
                angle: 0,
                spriteKey: `enemy_${config.wingmenType}`,
                isElite: true,
                state: 0,
                timer: 0
            };
            wingmen.push(wingman);
        }

        return wingmen;
    }

    update(boss: Entity, dt: number, timeScale: number, player: Entity, enemyBullets: Entity[], level: number) {
        const config = BossConfig[level as keyof typeof BossConfig];

        // Entry phase
        if (boss.state === 0) {
            if (boss.y < 150) {
                boss.y += config.speed * timeScale;
            } else {
                boss.state = 1;
                boss.vy = 0;
            }
            return;
        }

        // Movement patterns
        this.movementTimer += dt;
        const t = this.movementTimer / 1000;

        switch (config.movementPattern) {
            case 'sine':
                boss.x += Math.cos(t * 2) * 2 * timeScale;
                boss.x = Math.max(100, Math.min(this.width - 100, boss.x));
                break;

            case 'figure8':
                boss.x = this.width / 2 + Math.sin(t) * 150;
                boss.y = 150 + Math.sin(t * 2) * 50;
                break;

            case 'tracking':
                const dx = player.x - boss.x;
                boss.x += Math.sign(dx) * Math.min(Math.abs(dx), config.speed * 1.5) * timeScale;
                boss.x = Math.max(100, Math.min(this.width - 100, boss.x));
                boss.y = 150 + Math.sin(t * 3) * 30;
                break;

            case 'aggressive':
                const targetX = player.x;
                const diffX = targetX - boss.x;
                boss.x += Math.sign(diffX) * Math.min(Math.abs(diffX) * 0.02, config.speed * 2) * timeScale;
                boss.x = Math.max(100, Math.min(this.width - 100, boss.x));

                // Occasional dive
                if (Math.floor(t) % 8 === 0 && t % 1 < 0.5) {
                    boss.y = Math.min(boss.y + 2 * timeScale, 250);
                } else {
                    boss.y = Math.max(boss.y - 1 * timeScale, 100);
                }
                break;
        }

        // Weapon firing
        if (Math.random() < config.fireRate * timeScale) {
            this.fire(boss, enemyBullets, level, player);
        }

        // Laser attacks
        if (config.hasLaser) {
            this.laserTimer += dt;
            if (this.laserTimer > config.laserCooldown) {
                this.fireLaser(boss, enemyBullets, level, player, config.laserType);
                this.laserTimer = 0;
            }
        }
    }

    fire(boss: Entity, enemyBullets: Entity[], level: number, player: Entity) {
        const config = BossConfig[level as keyof typeof BossConfig];

        // Radial Burst
        if (config.weapons.includes('radial')) {
            for (let i = 0; i < config.bulletCount; i++) {
                const angle = (i / config.bulletCount) * Math.PI * 2 + (Date.now() / 1000);
                enemyBullets.push({
                    x: boss.x,
                    y: boss.y + boss.height / 4,
                    width: 16,
                    height: 16,
                    vx: Math.cos(angle) * config.bulletSpeed,
                    vy: Math.sin(angle) * config.bulletSpeed,
                    hp: 1,
                    maxHp: 1,
                    type: 'bullet',
                    color: '#ff0055',
                    markedForDeletion: false,
                    spriteKey: 'bullet_enemy'
                });
            }
        }

        // Targeted Shot
        if (config.weapons.includes('targeted') && config.targetedShotSpeed > 0) {
            const dx = player.x - boss.x;
            const dy = player.y - boss.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            enemyBullets.push({
                x: boss.x,
                y: boss.y + boss.height / 4,
                width: 20,
                height: 20,
                vx: (dx / dist) * config.targetedShotSpeed,
                vy: (dy / dist) * config.targetedShotSpeed,
                hp: 1,
                maxHp: 1,
                type: 'bullet',
                color: '#ffffff',
                markedForDeletion: false,
                spriteKey: 'bullet_enemy'
            });
        }

        // Spread Shot
        if (config.weapons.includes('spread')) {
            for (let i = -2; i <= 2; i++) {
                const angle = Math.PI / 2 + (i * Math.PI / 12);
                enemyBullets.push({
                    x: boss.x,
                    y: boss.y + boss.height / 4,
                    width: 14,
                    height: 14,
                    vx: Math.cos(angle) * config.bulletSpeed * 0.8,
                    vy: Math.sin(angle) * config.bulletSpeed * 0.8,
                    hp: 1,
                    maxHp: 1,
                    type: 'bullet',
                    color: '#ff9900',
                    markedForDeletion: false,
                    spriteKey: 'bullet_enemy'
                });
            }
        }

        // Homing Missiles
        if (config.weapons.includes('homing')) {
            for (let i = 0; i < 2; i++) {
                const offsetX = (i === 0 ? -1 : 1) * 30;
                enemyBullets.push({
                    x: boss.x + offsetX,
                    y: boss.y + boss.height / 4,
                    width: 18,
                    height: 24,
                    vx: 0,
                    vy: 3,
                    hp: 1,
                    maxHp: 1,
                    type: 'bullet',
                    color: '#ff00ff',
                    markedForDeletion: false,
                    spriteKey: 'bullet_enemy',
                    state: 1 // Homing state
                });
            }
        }
    }

    fireLaser(boss: Entity, enemyBullets: Entity[], level: number, player: Entity, laserType: string) {
        const config = BossConfig[level as keyof typeof BossConfig];
        this.audio.playShoot('laser');

        if (laserType === 'continuous') {
            // Continuous beam - single long-lasting laser
            enemyBullets.push({
                x: boss.x,
                y: boss.y + boss.height / 2,
                width: 12,
                height: 800,
                vx: 0,
                vy: 15,
                hp: 999,
                maxHp: 999,
                type: 'bullet',
                color: '#ff00ff',
                markedForDeletion: false,
                spriteKey: 'bullet_laser',
                damage: config.laserDamage,
                timer: 1500 // Laser duration in ms
            });
        } else if (laserType === 'pulsed') {
            // Pulsed shots - multiple short laser bursts
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const dx = player.x - boss.x;
                    const dy = player.y - boss.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    enemyBullets.push({
                        x: boss.x,
                        y: boss.y + boss.height / 2,
                        width: 10,
                        height: 40,
                        vx: (dx / dist) * 12,
                        vy: (dy / dist) * 12,
                        hp: 1,
                        maxHp: 1,
                        type: 'bullet',
                        color: '#00ffff',
                        markedForDeletion: false,
                        spriteKey: 'bullet_laser',
                        damage: config.laserDamage / 2
                    });
                }, i * 150);
            }
        }
    }
}
