import { WeaponType, Entity, EntityType } from '@/types';
import { WeaponConfig, WeaponUpgradeConfig } from '@/game/config';
import { AudioSystem } from '@/game/systems/AudioSystem';


export class WeaponSystem {
    audio: AudioSystem;
    alternateFireEnabled: boolean;

    constructor(audio: AudioSystem) {
        this.audio = audio;
        this.alternateFireEnabled = false;
    }

    enableAlternateFire(enable: boolean) {
        this.alternateFireEnabled = !!enable;
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
        const spawn = (x: number, y: number, vx: number, vy: number, dmg: number, type: WeaponType,
            sprite: string, w: number, h: number, speed: number, chainCount?: number, chainRange?: number,
            rotationSpeed?: number, searchRange?: number, turnSpeed?: number): Entity => {
            const bullet: Entity = {
                x, y, width: w, height: h, vx, vy, speed,
                hp: type === WeaponType.WAVE || type === WeaponType.LASER ? 999 : 1,
                maxHp: 1, type: EntityType.BULLET, color: config.color, markedForDeletion: false,
                spriteKey: sprite, damage: dmg,
                chainCount, chainRange,
                weaponType: type,
                target: undefined,
                searchRange, turnSpeed
            };

            // Add rotation properties if specified
            if (rotationSpeed !== undefined) {
                bullet.angle = Math.random() * Math.PI * 2; // Random starting angle
                bullet.rotationSpeed = rotationSpeed;
            }

            bullets.push(bullet);
            return bullet;
        }; // Main Gun Logic
        if (weaponType === WeaponType.VULCAN) {
            // 使用配置中的子弹数量
            const count = upgradeConfig.bulletCount || 1;

            for (let i = 0; i < count; i++) {
                const angle = (i - (count - 1) / 2) * 0.1; // Tighter spread
                spawn(player.x, player.y - 20, Math.sin(angle) * 10, -config.speed, damage, weaponType, config.sprite, config.bullet.size.width, config.bullet.size.height, config.speed);
            }
        } else if (weaponType === WeaponType.LASER) {
            // 使用配置中的宽度和光束数量
            const w = config.bullet.size.width + (upgradeConfig.bulletWidth || 0);
            const beamCount = upgradeConfig.beamCount || 1;

            if (beamCount === 1) {
                spawn(player.x, player.y - 30, 0, -config.speed, damage, weaponType, config.sprite, w, config.bullet.size.height, config.speed);
            } else if (beamCount === 2) {
                spawn(player.x - 15, player.y - 30, 0, -config.speed, damage, weaponType, config.sprite, w * 0.8, config.bullet.size.height, config.speed);
                spawn(player.x + 15, player.y - 30, 0, -config.speed, damage, weaponType, config.sprite, w * 0.8, config.bullet.size.height, config.speed);
            } else {
                spawn(player.x, player.y - 35, 0, -config.speed, damage, weaponType, config.sprite, w, config.bullet.size.height + 10, config.speed);
                spawn(player.x - 25, player.y - 30, -1, -config.speed + 1, damage, weaponType, config.sprite, w * 0.7, config.bullet.size.height, config.speed);
                spawn(player.x + 25, player.y - 30, 1, -config.speed + 1, damage, weaponType, config.sprite, w * 0.7, config.bullet.size.height, config.speed);
            }

        } else if (weaponType === WeaponType.MISSILE) {
            // 使用配置中的子弹数量
            const count = Math.min(upgradeConfig.bulletCount || 1, 9);
            const searchRange = (upgradeConfig.searchRange || 400);
            const turnSpeed = (upgradeConfig.turnSpeed || 0.15);

            const angles: number[] = [];
            const pairCount = Math.floor(count / 2);

            if (count % 2 !== 0) {
                angles.push(0);
            }

            for (let i = 1; i <= pairCount; i++) {
                // 15 degrees in radians = 15 * PI / 180 ≈ 0.2618
                const angle = i * 15 * (Math.PI / 180);
                angles.push(-angle);
                angles.push(angle);
            }

            for (const angle of angles) {
                // Calculate velocity based on angle
                // -90 degrees (up) is base, so we rotate from there? 
                // No, standard math: 0 is right, -90 is up.
                // But here we want 0 to be straight up relative to the ship?
                // Let's assume angle is offset from "straight up".
                // Straight up vector: (0, -1)
                // Rotated vector: (sin(a), -cos(a))

                const vx = Math.sin(angle) * config.speed;
                const vy = -Math.cos(angle) * config.speed;

                // Add a small positional offset based on angle to prevent overlap
                // If angle is 0, offset 0.
                // If angle is negative (left), offset left.
                // If angle is positive (right), offset right.
                const offsetX = Math.sin(angle) * 20;
                const offsetY = (1 - Math.cos(angle)) * 20; // Slight arc layout

                const b = spawn(
                    player.x + offsetX,
                    player.y + offsetY,
                    vx,
                    vy,
                    damage,
                    weaponType,
                    config.sprite,
                    config.bullet.size.width,
                    config.bullet.size.height,
                    config.speed,
                    undefined,
                    undefined,
                    undefined,
                    searchRange,
                    turnSpeed
                );

                // Set lifetime to prevent infinite circling (e.g. 3 seconds)
                b.lifetime = 3000;
                // Set initial rotation to match velocity
                b.angle = Math.atan2(vy, vx) + Math.PI / 2;
            }
        } else if (weaponType === WeaponType.WAVE) {
            // 使用配置中的宽度增量
            const width = config.bullet.size.width + (upgradeConfig.bulletWidth || 0);
            spawn(player.x, player.y - 40, 0, -config.speed, damage, weaponType, config.sprite, width, config.bullet.size.height, config.speed);
        } else if (weaponType === WeaponType.PLASMA) {
            // 使用配置中的尺寸增量
            const width = config.bullet.size.width + (upgradeConfig.bulletWidth || 0);
            const height = config.bullet.size.height + (upgradeConfig.bulletHeight || 0);
            // Add rotation: 0.03 radians per frame (about 1.7 degrees per frame, slower rotation)
            spawn(player.x, player.y - 40, 0, -config.speed, damage, weaponType, config.sprite, width, height, config.speed, undefined, undefined, 0.03);
        } else if (weaponType === WeaponType.TESLA) {
            // Tesla fires straight, chains on hit (handled in GameEngine)
            spawn(player.x, player.y - 20, 0, -config.speed, damage, weaponType, config.sprite, config.bullet.size.width, config.bullet.size.height, config.speed, upgradeConfig.chainCount, upgradeConfig.chainRange);
        } else if (weaponType === WeaponType.MAGMA) {
            // 使用配置中的子弹数量
            const count = upgradeConfig.bulletCount || 3;
            for (let i = 0; i < count; i++) {
                const angle = (Math.random() - 0.5) * 0.5 - 1.57; // Upward cone
                const speed = config.speed + Math.random() * 5;
                spawn(player.x, player.y - 20, Math.cos(angle) * speed, Math.sin(angle) * speed, damage, weaponType, config.sprite, config.bullet.size.width, config.bullet.size.height, speed);
            }
        } else if (weaponType === WeaponType.SHURIKEN) {
            // 使用配置中的子弹数量
            const count = upgradeConfig.bulletCount || 2;
            for (let i = 0; i < count; i++) {
                const angle = -1.57 + (i - (count - 1) / 2) * 0.5;
                spawn(player.x, player.y - 20, Math.cos(angle) * config.speed, Math.sin(angle) * config.speed, damage, weaponType, config.sprite, config.bullet.size.width, config.bullet.size.height, config.speed);
            }
        }

        // Option Fire
        options.forEach(opt => {
            // Options always fire basic vulcan for now, or we could upgrade them
            spawn(opt.x, opt.y, 0, -15, 10, WeaponType.VULCAN, 'bullet_vulcan', 8, 16, 15);
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
