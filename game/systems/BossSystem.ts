import { Entity, SpriteMap } from '@/types';
import { BossConfig } from '@/config';
import { AudioSystem } from '@/AudioSystem';

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
        const hp = BossConfig.hpPerLevel * level;
        const sprite = sprites[`boss_${level}`];
        const width = sprite ? sprite.width : 150;
        const height = sprite ? sprite.height : 150;

        this.audio.playPowerUp(); // Alarm sound

        return {
            x: this.width / 2,
            y: -150,
            width: width * 0.8,
            height: height * 0.8,
            vx: 0,
            vy: 1,
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
        if (boss.y < 150) {
            boss.y += 1 * timeScale;
        } else {
            boss.x += Math.cos(Date.now() / 1000) * 2 * timeScale;
            if (Math.random() < 0.05 * timeScale) {
                this.fire(boss, enemyBullets, level, player);
            }
        }
    }

    fire(boss: Entity, enemyBullets: Entity[], level: number, player: Entity) {
        const bulletsCount = BossConfig.baseBulletCount + (level * BossConfig.bulletCountPerLevel);

        // Radial Burst
        for (let i = 0; i < bulletsCount; i++) {
            const angle = (i / bulletsCount) * Math.PI * 2 + (Date.now() / 1000);
            enemyBullets.push({
                x: boss.x,
                y: boss.y + boss.height / 4,
                width: 16,
                height: 16,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                hp: 1,
                maxHp: 1,
                type: 'bullet',
                color: '#ff0055',
                markedForDeletion: false,
                spriteKey: 'bullet_enemy'
            });
        }

        // Targeted Shot
        if (level >= 2) {
            const dx = player.x - boss.x;
            const dy = player.y - boss.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            enemyBullets.push({
                x: boss.x,
                y: boss.y + boss.height / 4,
                width: 20,
                height: 20,
                vx: (dx / dist) * 9,
                vy: (dy / dist) * 9,
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
