import { WeaponType, Entity } from '@/types';
import { WeaponConfig, WEAPON_NAMES, WeaponUpgradeConfig } from '@/game/config';
import { AudioSystem } from '@/game/AudioSystem';


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

        // 获取当前等级的升级配置
        const upgradeConfig = WeaponUpgradeConfig[weaponType][weaponLevel] || {};

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
            // 使用配置中的子弹数量
            const count = upgradeConfig.bulletCount || 1;

            for (let i = 0; i < count; i++) {
                const angle = (i - (count - 1) / 2) * 0.1; // Tighter spread
                spawn(player.x, player.y - 20, Math.sin(angle) * 10, -config.speed, damage, weaponType, config.sprite, config.width, config.height);
            }
        } else if (weaponType === WeaponType.LASER) {
            // 使用配置中的宽度和光束数量
            const w = config.width + (upgradeConfig.bulletWidth || 0);
            const beamCount = upgradeConfig.beamCount || 1;

            if (beamCount === 1) {
                spawn(player.x, player.y - 30, 0, -config.speed, damage, weaponType, config.sprite, w, config.height);
            } else if (beamCount === 2) {
                spawn(player.x - 15, player.y - 30, 0, -config.speed, damage, weaponType, config.sprite, w * 0.8, config.height);
                spawn(player.x + 15, player.y - 30, 0, -config.speed, damage, weaponType, config.sprite, w * 0.8, config.height);
            } else {
                spawn(player.x, player.y - 35, 0, -config.speed, damage, weaponType, config.sprite, w, config.height + 10);
                spawn(player.x - 25, player.y - 30, -1, -config.speed + 1, damage, weaponType, config.sprite, w * 0.7, config.height);
                spawn(player.x + 25, player.y - 30, 1, -config.speed + 1, damage, weaponType, config.sprite, w * 0.7, config.height);
            }

        } else if (weaponType === WeaponType.MISSILE) {
            // 使用配置中的子弹数量
            const count = upgradeConfig.bulletCount || 2;

            for (let i = 0; i < count; i++) {
                const offsetX = (i - (count - 1) / 2) * 15;
                spawn(player.x + offsetX, player.y, (i - (count - 1) / 2) * 0.5, -config.speed, damage, weaponType, config.sprite, config.width, config.height);
            }
        } else if (weaponType === WeaponType.WAVE) {
            // 使用配置中的宽度增量
            const width = config.width + (upgradeConfig.bulletWidth || 0);
            spawn(player.x, player.y - 40, 0, -config.speed, damage, weaponType, config.sprite, width, config.height);
        } else if (weaponType === WeaponType.PLASMA) {
            // 使用配置中的尺寸增量
            const width = config.width + (upgradeConfig.bulletWidth || 0);
            const height = config.height + (upgradeConfig.bulletHeight || 0);
            spawn(player.x, player.y - 40, 0, -config.speed, damage, weaponType, config.sprite, width, height);
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
            // 使用配置中的子弹数量
            const count = upgradeConfig.bulletCount || 3;
            for (let i = 0; i < count; i++) {
                const angle = (Math.random() - 0.5) * 0.5 - 1.57; // Upward cone
                const speed = config.speed + Math.random() * 5;
                spawn(player.x, player.y - 20, Math.cos(angle) * speed, Math.sin(angle) * speed, damage, weaponType, config.sprite, config.width, config.height);
            }
        } else if (weaponType === WeaponType.SHURIKEN) {
            // 使用配置中的子弹数量
            const count = upgradeConfig.bulletCount || 2;
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
        this.audio.playShoot(weaponType);
    }
}
