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
            sprite: string, w: number, h: number, chainCount?: number, chainRange?: number, 
            rotationSpeed?: number, searchRange?: number, turnSpeed?: number): Entity => {
            const bullet: Entity = {
                x, y, width: w, height: h, vx, vy,
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
                spawn(player.x, player.y - 20, Math.sin(angle) * 10, -config.speed, damage, weaponType, config.sprite, config.bullet.size.width, config.bullet.size.height);
            }
        } else if (weaponType === WeaponType.LASER) {
            // 使用配置中的宽度和光束数量
            const w = config.bullet.size.width + (upgradeConfig.bulletWidth || 0);
            const beamCount = upgradeConfig.beamCount || 1;

            if (beamCount === 1) {
                spawn(player.x, player.y - 30, 0, -config.speed, damage, weaponType, config.sprite, w, config.bullet.size.height);
            } else if (beamCount === 2) {
                spawn(player.x - 15, player.y - 30, 0, -config.speed, damage, weaponType, config.sprite, w * 0.8, config.bullet.size.height);
                spawn(player.x + 15, player.y - 30, 0, -config.speed, damage, weaponType, config.sprite, w * 0.8, config.bullet.size.height);
            } else {
                spawn(player.x, player.y - 35, 0, -config.speed, damage, weaponType, config.sprite, w, config.bullet.size.height + 10);
                spawn(player.x - 25, player.y - 30, -1, -config.speed + 1, damage, weaponType, config.sprite, w * 0.7, config.bullet.size.height);
                spawn(player.x + 25, player.y - 30, 1, -config.speed + 1, damage, weaponType, config.sprite, w * 0.7, config.bullet.size.height);
            }

        } else if (weaponType === WeaponType.MISSILE) {
            // 使用配置中的子弹数量
            const count = upgradeConfig.bulletCount || 2;
            const searchRange = (upgradeConfig.searchRange || 400);
            const turnSpeed = (upgradeConfig.turnSpeed || 0.15);

            for (let i = 0; i < count; i++) {
                const offsetX = (i - (count - 1) / 2) * 15;
                const b = spawn(player.x + offsetX, player.y, (i - (count - 1) / 2) * 0.5, -config.speed, damage, weaponType, config.sprite, config.bullet.size.width, config.bullet.size.height, undefined, undefined, undefined, searchRange, turnSpeed);

                // Lock on to nearest enemy immediately
                let nearest: Entity | undefined;
                let minDist = searchRange;
                enemies.forEach(e => {
                    if (e.hp > 0 && !e.markedForDeletion) {
                        const dist = Math.sqrt((e.x - b.x) ** 2 + (e.y - b.y) ** 2);
                        if (dist < minDist) {
                            minDist = dist;
                            nearest = e;
                        }
                    }
                });

                if (nearest) {
                    b.target = nearest;
                }

                // Set lifetime to prevent infinite circling (e.g. 3 seconds)
                b.lifetime = 3000;
            }
        } else if (weaponType === WeaponType.WAVE) {
            // 使用配置中的宽度增量
            const width = config.bullet.size.width + (upgradeConfig.bulletWidth || 0);
            spawn(player.x, player.y - 40, 0, -config.speed, damage, weaponType, config.sprite, width, config.bullet.size.height);
        } else if (weaponType === WeaponType.PLASMA) {
            // 使用配置中的尺寸增量
            const width = config.bullet.size.width + (upgradeConfig.bulletWidth || 0);
            const height = config.bullet.size.height + (upgradeConfig.bulletHeight || 0);
            // Add rotation: 0.03 radians per frame (about 1.7 degrees per frame, slower rotation)
            spawn(player.x, player.y - 40, 0, -config.speed, damage, weaponType, config.sprite, width, height, undefined, undefined, 0.03);
        } else if (weaponType === WeaponType.TESLA) {
            // Tesla fires straight, chains on hit (handled in GameEngine)
            spawn(player.x, player.y - 20, 0, -config.speed, damage, weaponType, config.sprite, config.bullet.size.width, config.bullet.size.height, upgradeConfig.chainCount, upgradeConfig.chainRange);
        } else if (weaponType === WeaponType.MAGMA) {
            // 使用配置中的子弹数量
            const count = upgradeConfig.bulletCount || 3;
            for (let i = 0; i < count; i++) {
                const angle = (Math.random() - 0.5) * 0.5 - 1.57; // Upward cone
                const speed = config.speed + Math.random() * 5;
                spawn(player.x, player.y - 20, Math.cos(angle) * speed, Math.sin(angle) * speed, damage, weaponType, config.sprite, config.bullet.size.width, config.bullet.size.height);
            }
        } else if (weaponType === WeaponType.SHURIKEN) {
            // 使用配置中的子弹数量
            const count = upgradeConfig.bulletCount || 2;
            for (let i = 0; i < count; i++) {
                const angle = -1.57 + (i - (count - 1) / 2) * 0.5;
                spawn(player.x, player.y - 20, Math.cos(angle) * config.speed, Math.sin(angle) * config.speed, damage, weaponType, config.sprite, config.bullet.size.width, config.bullet.size.height);
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
