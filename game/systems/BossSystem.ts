import { Entity, SpriteMap } from '@/types';
import { BossConfig } from '@/game/config';
import { AudioSystem } from '@/game/AudioSystem';

export class BossSystem {
    audio: AudioSystem;
    width: number = 0;
    height: number = 0;

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

        this.audio.playPowerUp(); // Alarm sound

        return {
            x: this.width / 2,
            y: -150,
            width: width * config.size,
            height: height * config.size,
            vx: 0,
            vy: config.speed,
            hp: hp,
            maxHp: hp,
            type: 'boss',
            color: '#ffffff',
            markedForDeletion: false,
            angle: 0,
            spriteKey: `boss_${level}`
        };
    }

    update(boss: Entity, dt: number, timeScale: number, player: Entity, enemyBullets: Entity[], level: number) {
        const config = BossConfig[level as keyof typeof BossConfig];

        if (boss.y < 150) {
            boss.y += config.speed * timeScale;
        } else {
            boss.x += Math.cos(Date.now() / 1000) * 2 * timeScale;
            if (Math.random() < config.fireRate * timeScale) {
                this.fire(boss, enemyBullets, level, player);
            }
        }
    }

    fire(boss: Entity, enemyBullets: Entity[], level: number, player: Entity) {
        const config = BossConfig[level as keyof typeof BossConfig];

        // Radial Burst
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

        // Targeted Shot
        if (config.targetedShotSpeed > 0) {
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
    }
}
