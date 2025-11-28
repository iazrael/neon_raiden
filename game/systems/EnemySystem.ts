import { Entity, WeaponType, EnemyType, BulletType, EntityType } from '@/types';
import { BulletConfigs, EnemyCommonConfig, EnemyConfig, EnemySpawnWeights } from '@/game/config';
import { AudioSystem } from '@/game/AudioSystem';

export class EnemySystem {
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

    spawnEnemy(level: number, enemies: Entity[]) {
        const x = Math.random() * (this.width - 60) + 30;

        // Use weighted spawning system
        const weights = EnemySpawnWeights[level as keyof typeof EnemySpawnWeights] || EnemySpawnWeights[10];
        const weightEntries = Object.entries(weights);
        const totalWeight = weightEntries.reduce((sum, [_, weight]) => sum + weight, 0);

        let random = Math.random() * totalWeight;
        let type: EnemyType = EnemyType.NORMAL;

        for (const [typeStr, weight] of weightEntries) {
            random -= weight;
            if (random <= 0) {
                type = typeStr as EnemyType;
                break;
            }
        }

        const config = EnemyConfig[type];

        // Elite Chance
        const isElite = Math.random() < EnemyCommonConfig.eliteChance;

        let enemy: Entity = {
            x,
            y: -50,
            width: config.size.width,
            height: config.size.height,
            vx: 0,
            vy: config.baseSpeed + (level * config.speedPerLevel),
            hp: config.baseHp + (level * config.hpPerLevel),
            maxHp: config.baseHp + (level * config.hpPerLevel), // Initial MaxHP
            type: EntityType.ENEMY,
            subType: type,
            color: '#ff0000',
            markedForDeletion: false,
            angle: 0,
            spriteKey: `enemy_${type}`,
            isElite: isElite,
            state: 0,
            timer: 0
        };

        // Specific overrides if needed (e.g. random VX for fast enemies)
        if (type === EnemyType.FAST) { // Fast
            enemy.vx = (Math.random() - 0.5) * 6;
        }

        // Apply Elite Stats
        if (isElite) {
            enemy.width *= EnemyCommonConfig.eliteSizeMultiplier;
            enemy.height *= EnemyCommonConfig.eliteSizeMultiplier;
            enemy.hp *= EnemyCommonConfig.eliteHpMultiplier;
            enemy.maxHp = enemy.hp;
        }

        enemies.push(enemy);
    }

    update(dt: number, timeScale: number, enemies: Entity[], player: Entity, enemyBullets: Entity[]) {
        enemies.forEach(e => {
            e.x += e.vx * timeScale;
            e.y += e.vy * timeScale;

            // Kamikaze AI
            if (e.subType === EnemyType.KAMIKAZE) {
                if (e.y < player.y) {
                    const dx = player.x - e.x;
                    e.vx = (dx > 0 ? 1 : -1) * 2;
                }
            }

            // Laser Interceptor - Special state machine firing
            if (e.subType === EnemyType.LASER_INTERCEPTOR) {
                const config = EnemyConfig[EnemyType.LASER_INTERCEPTOR];
                const chargeTime = (config.weapon.chargeTime || 2000) / (e.isElite ? EnemyCommonConfig.eliteFireRateMultiplier : 1);
                const cooldownTime = (config.weapon.cooldownTime || 1000) / (e.isElite ? EnemyCommonConfig.eliteFireRateMultiplier : 1);
                const bulletSpeed = config.weapon.speed || 12;
                const bulletDamage = (config.weapon.damage || 30) * (e.isElite ? EnemyCommonConfig.eliteDamageMultiplier : 1);

                if (e.state === 0) { // Entering
                    if (e.y > 150) {
                        e.state = 1; // Hover
                        e.vy = 0;
                        e.timer = 0;
                    }
                } else if (e.state === 1) { // Hover & Charge
                    e.timer = (e.timer || 0) + dt;
                    // Bobbing
                    e.y += Math.sin(Date.now() / 500) * 0.5 * timeScale;

                    if (e.timer > chargeTime) { // Fire after charge time
                        e.state = 2;
                        e.timer = 0;
                        // Fire Laser
                        this.audio.playShoot(WeaponType.LASER);
                        const bulletConfig = BulletConfigs[BulletType.ENEMY_BEAM];
                        enemyBullets.push({
                            x: e.x + e.width / 2 - bulletConfig.size.width / 2,
                            y: e.y + e.height,
                            width: bulletConfig.size.width,
                            height: bulletConfig.size.height,
                            vx: 0,
                            vy: bulletSpeed,
                            hp: 999,
                            maxHp: 999,
                            type: EntityType.BULLET,
                            color: bulletConfig.color,
                            markedForDeletion: false,
                            spriteKey: bulletConfig.sprite,
                            damage: bulletDamage
                        });
                    }
                } else if (e.state === 2) { // Cooldown / Leave
                    e.timer = (e.timer || 0) + dt;
                    if (e.timer > cooldownTime) {
                        e.vy = 5; // Fly away
                    }
                }
            }

            // Mine Layer - Special interval-based firing
            if (e.subType === EnemyType.MINE_LAYER) {
                const config = EnemyConfig[EnemyType.MINE_LAYER];
                const spawnInterval = (config.weapon.interval || 1500) / (e.isElite ? EnemyCommonConfig.eliteFireRateMultiplier : 1);
                const mineDamage = (config.weapon.damage || 25) * (e.isElite ? EnemyCommonConfig.eliteDamageMultiplier : 1);

                e.timer = (e.timer || 0) + dt;
                if (e.timer > spawnInterval) {
                    e.timer = 0;
                    // Drop Mine
                    const bulletConfig = BulletConfigs[BulletType.ENEMY_HEAVY];
                    enemyBullets.push({
                        x: e.x + e.width / 2 - bulletConfig.size.width / 2,
                        y: e.y + e.height,
                        width: bulletConfig.size.width,
                        height: bulletConfig.size.height,
                        vx: 0, vy: 0, // Static mine
                        hp: 1, maxHp: 1, type: EntityType.BULLET, color: bulletConfig.color, markedForDeletion: false, spriteKey: bulletConfig.sprite,
                        damage: mineDamage
                    });
                }
            }

            // Elite Gunboat - Targeted rapid firing
            if (e.subType === EnemyType.ELITE_GUNBOAT) {
                const config = EnemyConfig[EnemyType.ELITE_GUNBOAT];
                const shootFreq = (config.weapon.frequency || 0.02) * (e.isElite ? EnemyCommonConfig.eliteFireRateMultiplier : 1);
                const bulletSpeed = config.weapon.speed || 4;

                if (Math.random() < shootFreq * timeScale) {
                    const dx = player.x - e.x;
                    const dy = player.y - e.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const bulletConfig = BulletConfigs[BulletType.ENEMY_RAPID];
                    enemyBullets.push({
                        x: e.x + e.width / 2 - bulletConfig.size.width / 2,
                        y: e.y + e.height,
                        width: bulletConfig.size.width,
                        height: bulletConfig.size.height,
                        vx: (dx / dist) * bulletSpeed, vy: (dy / dist) * bulletSpeed,
                        hp: 1, maxHp: 1, type: EntityType.BULLET, color: bulletConfig.color, markedForDeletion: false, spriteKey: bulletConfig.sprite,
                        damage: 10 * (e.isElite ? EnemyCommonConfig.eliteDamageMultiplier : 1)
                    });
                }
            }

            // Stalker - Homing missile firing
            if (e.subType === EnemyType.STALKER) {
                const config = EnemyConfig[EnemyType.STALKER];
                const shootFreq = (config.weapon.frequency || 0.015) * (e.isElite ? EnemyCommonConfig.eliteFireRateMultiplier : 1);
                const bulletSpeed = config.weapon.speed || 3;

                if (Math.random() < shootFreq * timeScale) {
                    const bulletConfig = BulletConfigs[BulletType.ENEMY_HOMING];
                    const dx = player.x - e.x;
                    const dy = player.y - e.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    enemyBullets.push({
                        x: e.x + e.width / 2 - bulletConfig.size.width / 2,
                        y: e.y + e.height,
                        width: bulletConfig.size.width,
                        height: bulletConfig.size.height,
                        vx: (dx / dist) * bulletSpeed, vy: (dy / dist) * bulletSpeed,
                        hp: 1, maxHp: 1, type: EntityType.BULLET, color: bulletConfig.color, markedForDeletion: false, spriteKey: bulletConfig.sprite
                    });
                }
            }

            // Barrage - Spiral pattern firing
            if (e.subType === EnemyType.BARRAGE) {
                const config = EnemyConfig[EnemyType.BARRAGE];
                const shootFreq = (config.weapon.frequency || 0.03) * (e.isElite ? EnemyCommonConfig.eliteFireRateMultiplier : 1);
                const bulletSpeed = config.weapon.speed || 3;

                if (Math.random() < shootFreq * timeScale) {
                    const bulletConfig = BulletConfigs[BulletType.ENEMY_SPIRAL];
                    // Spiral pattern simulation: fire with rotating angle based on time
                    const angle = (Date.now() / 200) % (Math.PI * 2);

                    enemyBullets.push({
                        x: e.x + e.width / 2 - bulletConfig.size.width / 2,
                        y: e.y + e.height / 2,
                        width: bulletConfig.size.width,
                        height: bulletConfig.size.height,
                        vx: Math.cos(angle) * bulletSpeed, vy: Math.sin(angle) * bulletSpeed + 2, // +2 to ensure downward trend
                        hp: 1, maxHp: 1, type: EntityType.BULLET, color: bulletConfig.color, markedForDeletion: false, spriteKey: bulletConfig.sprite,
                        damage: 10 * (e.isElite ? EnemyCommonConfig.eliteDamageMultiplier : 1)
                    });
                }
            }

            // Pulsar - High frequency rapid firing
            if (e.subType === EnemyType.PULSAR) {
                const config = EnemyConfig[EnemyType.PULSAR];
                const shootFreq = (config.weapon.frequency || 0.05) * (e.isElite ? EnemyCommonConfig.eliteFireRateMultiplier : 1);
                const bulletSpeed = config.weapon.speed || 6;

                if (Math.random() < shootFreq * timeScale) {
                    const bulletConfig = BulletConfigs[BulletType.ENEMY_RAPID];
                    enemyBullets.push({
                        x: e.x + e.width / 2 - bulletConfig.size.width / 2,
                        y: e.y + e.height,
                        width: bulletConfig.size.width,
                        height: bulletConfig.size.height,
                        vx: 0, vy: bulletSpeed,
                        hp: 1, maxHp: 1, type: EntityType.BULLET, color: bulletConfig.color, markedForDeletion: false, spriteKey: bulletConfig.sprite,
                        damage: 10 * (e.isElite ? EnemyCommonConfig.eliteDamageMultiplier : 1)
                    });
                }
            }

            // General Enemy firing (for types without special behaviors)
            if (e.subType !== EnemyType.LASER_INTERCEPTOR &&
                e.subType !== EnemyType.MINE_LAYER &&
                e.subType !== EnemyType.ELITE_GUNBOAT &&
                e.subType !== EnemyType.STALKER &&
                e.subType !== EnemyType.BARRAGE &&
                e.subType !== EnemyType.PULSAR) {

                const enemyConfig = EnemyConfig[e.subType as EnemyType];
                const shootFreq = (enemyConfig.weapon.frequency || 0.05) * (e.isElite ? EnemyCommonConfig.eliteFireRateMultiplier : 1);

                if (Math.random() < shootFreq * timeScale) {
                    const bulletConfig = BulletConfigs[BulletType.ENEMY_ORB];
                    enemyBullets.push({
                        x: e.x + e.width / 2 - bulletConfig.size.width / 2,
                        y: e.y + e.height,
                        width: bulletConfig.size.width,
                        height: bulletConfig.size.height,
                        vx: 0, vy: 5, hp: 1, maxHp: 1,
                        type: EntityType.BULLET, color: bulletConfig.color, markedForDeletion: false, spriteKey: bulletConfig.sprite,
                        damage: 10 * (e.isElite ? EnemyCommonConfig.eliteDamageMultiplier : 1)
                    });
                }
            }
        });
    }
}
