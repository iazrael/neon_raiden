import { Entity } from '@/types';
import { EnemyConfig, EnemySpawnWeights } from '@/game/config';
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
        let type = 0;

        for (const [typeStr, weight] of weightEntries) {
            random -= weight;
            if (random <= 0) {
                type = parseInt(typeStr);
                break;
            }
        }

        // @ts-ignore
        const config = EnemyConfig.types[type];

        // Elite Chance
        const isElite = Math.random() < EnemyConfig.eliteChance;

        let enemy: Entity = {
            x,
            y: -50,
            width: config.width,
            height: config.height,
            vx: 0,
            vy: config.baseSpeed + (level * config.speedPerLevel),
            hp: config.baseHp + (level * config.hpPerLevel),
            maxHp: config.baseHp + (level * config.hpPerLevel), // Initial MaxHP
            type: 'enemy',
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
        if (type === 1) { // Fast
            enemy.vx = (Math.random() - 0.5) * 6;
        }

        // Apply Elite Stats
        if (isElite) {
            enemy.width *= EnemyConfig.eliteSizeMultiplier;
            enemy.height *= EnemyConfig.eliteSizeMultiplier;
            enemy.hp *= EnemyConfig.eliteHpMultiplier;
            enemy.maxHp = enemy.hp;
        }

        enemies.push(enemy);
    }

    update(dt: number, timeScale: number, enemies: Entity[], player: Entity, enemyBullets: Entity[]) {
        enemies.forEach(e => {
            e.x += e.vx * timeScale;
            e.y += e.vy * timeScale;

            // Kamikaze AI
            if (e.subType === 3) {
                if (e.y < player.y) {
                    const dx = player.x - e.x;
                    e.vx = (dx > 0 ? 1 : -1) * 2;
                }
            }

            // Type 5: Laser Interceptor AI
            if (e.subType === 5) {
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
                        this.audio.playShoot('laser');
                        enemyBullets.push({
                            x: e.x, y: e.y + 30, width: 10, height: 800,
                            vx: 0, vy: 20,
                            hp: 999, maxHp: 999, type: 'bullet', color: '#f0f', markedForDeletion: false, spriteKey: 'bullet_laser',
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
            if (e.subType === 6) {
                e.timer = (e.timer || 0) + dt;
                if (e.timer > 1500) {
                    e.timer = 0;
                    // Drop Mine
                    enemyBullets.push({
                        x: e.x, y: e.y, width: 24, height: 24,
                        vx: 0, vy: 0, // Static mine
                        hp: 1, maxHp: 1, type: 'bullet', color: '#ff0', markedForDeletion: false, spriteKey: 'bullet_enemy',
                        damage: 25
                    });
                }
            }

            // Elite Gunboat Firing
            if (e.subType === 4 && Math.random() < 0.02 * timeScale) {
                const dx = player.x - e.x;
                const dy = player.y - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                enemyBullets.push({
                    x: e.x, y: e.y + 20, width: 12, height: 12,
                    vx: (dx / dist) * 4, vy: (dy / dist) * 4,
                    hp: 1, maxHp: 1, type: 'bullet', color: '#ff0', markedForDeletion: false, spriteKey: 'bullet_enemy'
                });
            }


            // General Enemy firing (Reduced for specialized types)
            if (e.subType !== 5 && e.subType !== 6) {
                // @ts-ignore
                const enemyConfig = EnemyConfig.types[e.subType || 0];
                const shootFreq = enemyConfig.shootFrequency || 0.005;

                if (Math.random() < shootFreq * timeScale) {
                    enemyBullets.push({
                        x: e.x,
                        y: e.y + e.height / 2,
                        width: 12,
                        height: 12,
                        vx: 0,
                        vy: 5,
                        hp: 1,
                        maxHp: 1,
                        type: 'bullet',
                        color: '#ff9999',
                        markedForDeletion: false,
                        spriteKey: 'bullet_enemy'
                    });
                }
            }
        });
    }
}
