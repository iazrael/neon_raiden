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

            // Type 5: Laser Interceptor AI
            if (e.subType === EnemyType.LASER_INTERCEPTOR) {
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

                    if (e.timer > 2000) { // Fire after 2s
                        e.state = 2;
                        e.timer = 0;
                        // Fire Laser
                        this.audio.playShoot(WeaponType.LASER);
                        enemyBullets.push({
                            x: e.x, y: e.y + 30, width: 10, height: 800,
                            vx: 0, vy: 20,
                            hp: 999, maxHp: 999, type: EntityType.BULLET, color: '#f0f', markedForDeletion: false, spriteKey: 'bullet_laser',
                            damage: 30
                        });
                    }
                } else if (e.state === 2) { // Cooldown / Leave
                    e.timer = (e.timer || 0) + dt;
                    if (e.timer > 1000) {
                        e.vy = 5; // Fly away
                    }
                }
            }

            // Type 6: Mine Layer AI
            if (e.subType === EnemyType.MINE_LAYER) {
                e.timer = (e.timer || 0) + dt;
                if (e.timer > 1500) {
                    e.timer = 0;
                    // Drop Mine
                    // FIXME: 这里的尺寸要用 BulletConfig的
                    const bulletConfig = BulletConfigs[BulletType.ENEMY_HEAVY];
                    enemyBullets.push({
                        x: e.x, y: e.y, width: bulletConfig.size.width, height: bulletConfig.size.height,
                        vx: 0, vy: 0, // Static mine
                        hp: 1, maxHp: 1, type: EntityType.BULLET, color: bulletConfig.color, markedForDeletion: false, spriteKey: bulletConfig.sprite,
                        damage: 25
                    });
                }
            }

            // Elite Gunboat Firing
            if (e.subType === EnemyType.ELITE_GUNBOAT && Math.random() < 0.02 * timeScale) {
                const dx = player.x - e.x;
                const dy = player.y - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const bulletConfig = BulletConfigs[BulletType.ENEMY_RAPID];
                enemyBullets.push({
                    x: e.x, y: e.y + 20, width: bulletConfig.size.width, height: bulletConfig.size.height,
                    vx: (dx / dist) * 4, vy: (dy / dist) * 4,
                    hp: 1, maxHp: 1, type: EntityType.BULLET, color: bulletConfig.color, markedForDeletion: false, spriteKey: bulletConfig.sprite
                });
            }


            // General Enemy firing (Reduced for specialized types)
            if (e.subType !== EnemyType.LASER_INTERCEPTOR && e.subType !== EnemyType.MINE_LAYER) {
                const enemyConfig = EnemyConfig[e.subType as EnemyType];
                const shootFreq = enemyConfig?.shootFrequency || 0.005;

                if (Math.random() < shootFreq * timeScale) {
                    const bulletConfig = BulletConfigs[BulletType.ENEMY_ORB];
                    enemyBullets.push({
                        x: e.x, y: e.y + e.height / 2, width: bulletConfig.size.width, height: bulletConfig.size.height,
                        vx: 0, vy: 5, hp: 1, maxHp: 1,
                        type: EntityType.BULLET, color: bulletConfig.color, markedForDeletion: false, spriteKey: bulletConfig.sprite
                    });
                }
            }
        });
    }
}
