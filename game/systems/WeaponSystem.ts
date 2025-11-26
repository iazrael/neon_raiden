import { WeaponType, Entity } from '@/types';
import { WeaponConfig } from '@/config';
import { AudioSystem } from '@/AudioSystem';

export class WeaponSystem {
    audio: AudioSystem;

    constructor(audio: AudioSystem) {
        this.audio = audio;
    }

    firePlayerWeapon(
        player: Entity,
        weaponType: WeaponType,
        weaponLevel: number,
        options: Entity[],
        bullets: Entity[],
        enemies: Entity[]
    ) {
        this.playShootSound(weaponType);

        const config = WeaponConfig[weaponType];
        const damage = config.baseDamage + (weaponLevel * config.damagePerLevel);

        // Helper to spawn bullet
        const spawn = (x: number, y: number, vx: number, vy: number, dmg: number, type: WeaponType, sprite: string, w: number, h: number) => {
            bullets.push({
                x, y, width: w, height: h, vx, vy,
                hp: type === WeaponType.WAVE || type === WeaponType.LASER ? 999 : 1,
                maxHp: 1, type: 'bullet', color: config.color, markedForDeletion: false,
                spriteKey: sprite, damage: dmg
            });
        };

        // Main Gun Logic
        if (weaponType === WeaponType.VULCAN) {
            // 1 -> 3 -> 5 -> 7
            let count = 1;
            if (weaponLevel >= 3) count = 3;
            if (weaponLevel >= 6) count = 5;
            if (weaponLevel >= 9) count = 7;

            for (let i = 0; i < count; i++) {
                const angle = (i - (count - 1) / 2) * 0.1; // Tighter spread
                spawn(player.x, player.y - 20, Math.sin(angle) * 10, -config.speed, damage, weaponType, config.sprite, config.width, config.height);
            }
        } else if (weaponType === WeaponType.LASER) {
            // Laser: Thicker and multi-beam at high levels
            const w = config.width + weaponLevel * 3;

            if (weaponLevel < 5) {
                spawn(player.x, player.y - 30, 0, -config.speed, damage, weaponType, config.sprite, w, config.height);
            } else if (weaponLevel < 8) {
                spawn(player.x - 15, player.y - 30, 0, -config.speed, damage, weaponType, config.sprite, w * 0.8, config.height);
                spawn(player.x + 15, player.y - 30, 0, -config.speed, damage, weaponType, config.sprite, w * 0.8, config.height);
            } else {
                spawn(player.x, player.y - 35, 0, -config.speed, damage, weaponType, config.sprite, w, config.height + 10);
                spawn(player.x - 25, player.y - 30, -1, -config.speed + 1, damage, weaponType, config.sprite, w * 0.7, config.height);
                spawn(player.x + 25, player.y - 30, 1, -config.speed + 1, damage, weaponType, config.sprite, w * 0.7, config.height);
            }

        } else if (weaponType === WeaponType.MISSILE) {
            // 2 -> 4 -> 6 -> 8
            let count = 2;
            if (weaponLevel >= 3) count = 4;
            if (weaponLevel >= 6) count = 6;
            if (weaponLevel >= 9) count = 8;

            for (let i = 0; i < count; i++) {
                const offsetX = (i - (count - 1) / 2) * 15;
                spawn(player.x + offsetX, player.y, (i - (count - 1) / 2) * 0.5, -config.speed, damage, weaponType, config.sprite, config.width, config.height);
            }
        } else if (weaponType === WeaponType.WAVE) {
            spawn(player.x, player.y - 40, 0, -config.speed, damage, weaponType, config.sprite, config.width + weaponLevel * 12, config.height);
        } else if (weaponType === WeaponType.PLASMA) {
            spawn(player.x, player.y - 40, 0, -config.speed, damage, weaponType, config.sprite, config.width + weaponLevel * 8, config.height + weaponLevel * 8);
        } else if (weaponType === WeaponType.TESLA) {
            // Auto-lock to nearest enemy
            let target: Entity | null = null;
            let minDist = 400; // Range
            enemies.forEach(e => {
                const dist = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2);
                if (dist < minDist && e.y < player.y) { // Only target enemies above
                    minDist = dist;
                    target = e;
                }
            });

            if (target) {
                const t = target as Entity; // TS check
                const angle = Math.atan2(t.y - player.y, t.x - player.x);
                spawn(player.x, player.y - 20, Math.cos(angle) * config.speed, Math.sin(angle) * config.speed, damage, weaponType, config.sprite, config.width, config.height);
            } else {
                spawn(player.x, player.y - 20, 0, -config.speed, damage, weaponType, config.sprite, config.width, config.height);
            }
        } else if (weaponType === WeaponType.MAGMA) {
            const count = 3 + Math.floor(weaponLevel / 3);
            for (let i = 0; i < count; i++) {
                const angle = (Math.random() - 0.5) * 0.5 - 1.57; // Upward cone
                const speed = config.speed + Math.random() * 5;
                spawn(player.x, player.y - 20, Math.cos(angle) * speed, Math.sin(angle) * speed, damage, weaponType, config.sprite, config.width, config.height);
            }
        } else if (weaponType === WeaponType.SHURIKEN) {
            const count = 2 + Math.floor(weaponLevel / 3);
            for (let i = 0; i < count; i++) {
                const angle = -1.57 + (i - (count - 1) / 2) * 0.5;
                spawn(player.x, player.y - 20, Math.cos(angle) * config.speed, Math.sin(angle) * config.speed, damage, weaponType, config.sprite, config.width, config.height);
            }
        }

        // Option Fire
        options.forEach(opt => {
            // Options always fire basic vulcan for now, or we could upgrade them
            spawn(opt.x, opt.y, 0, -15, 10, WeaponType.VULCAN, 'bullet_vulcan', 8, 16);
        });
    }

    getFireRate(weaponType: WeaponType, weaponLevel: number): number {
        const config = WeaponConfig[weaponType];
        return Math.max(30, config.baseFireRate - (weaponLevel * config.ratePerLevel));
    }

    playShootSound(weaponType: WeaponType) {
        this.audio.playShoot(
            weaponType === WeaponType.VULCAN ? 'vulcan' :
                weaponType === WeaponType.LASER ? 'laser' :
                    weaponType === WeaponType.MISSILE ? 'missile' :
                        weaponType === WeaponType.WAVE ? 'wave' :
                            weaponType === WeaponType.TESLA ? 'laser' :
                                weaponType === WeaponType.MAGMA ? 'vulcan' :
                                    weaponType === WeaponType.SHURIKEN ? 'missile' :
                                        'plasma'
        );
    }
}
